import { Router } from "express";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { authenticate, requireAdmin, optionalAuth, type AuthRequest } from "../middlewares/authenticate";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  ConfirmPaymentParams,
  ConfirmPaymentBody,
} from "@workspace/api-zod";

const router = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId)).orderBy(asc(orderItemsTable.id));
  return {
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    items: items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })),
  };
}

router.get("/orders", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const isAdmin = req.userRole === "admin";

  if (!isAdmin && !req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const conditions = [];

  if (!isAdmin && req.userId) {
    conditions.push(eq(ordersTable.userId, req.userId));
  }

  if (params.data.status) {
    conditions.push(eq(ordersTable.status, params.data.status));
  }

  if (params.data.userId && isAdmin) {
    conditions.push(eq(ordersTable.userId, params.data.userId));
  }

  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions)).orderBy(desc(ordersTable.createdAt))
    : await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  if (orders.length === 0) {
    res.json([]);
    return;
  }

  const orderIds = orders.map((o) => o.id);
  const allItems = await db.select().from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds))
    .orderBy(asc(orderItemsTable.orderId));

  const itemsByOrder = allItems.reduce<Record<number, typeof allItems>>((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push(item);
    return acc;
  }, {});

  res.json(orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.deliveryFee),
    total: Number(o.total),
    items: (itemsByOrder[o.id] ?? []).map((i) => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })),
  })));
});

router.post("/orders", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, ...orderData } = parsed.data;

  const isCash = orderData.paymentMethod === "CASH" || orderData.paymentMethod === "cash_on_delivery";
  const paymentStatus = isCash ? "UNPAID" : "PENDING";

  const [order] = await db.insert(ordersTable).values({
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    customerEmail: orderData.customerEmail ?? null,
    paymentMethod: orderData.paymentMethod,
    subtotal: String(orderData.subtotal),
    deliveryFee: String(orderData.deliveryFee),
    total: String(orderData.total),
    deliveryAddress: orderData.deliveryAddress,
    deliveryLocation: orderData.deliveryLocation ?? null,
    zoneId: orderData.zoneId ?? null,
    deliveryNotes: orderData.deliveryNotes ?? null,
    userId: req.userId ?? null,
    status: "PENDING",
    paymentStatus,
  }).returning();

  if (items && items.length > 0) {
    await db.insert(orderItemsTable).values(items.map((item) => ({
      orderId: order.id,
      productId: item.productId ?? null,
      productName: item.productName,
      variantName: item.variantName ?? null,
      addonNames: item.addonNames ?? null,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      totalPrice: String(item.totalPrice),
      notes: item.notes ?? null,
    })));
  }

  const result = await getOrderWithItems(order.id);
  res.status(201).json(result);
});

router.get("/orders/:id", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (req.userRole !== "admin" && order.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(order);
});

router.patch("/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  await db.update(ordersTable).set({
    status: body.data.status,
    ...(body.data.estimatedDeliveryTime ? { estimatedDeliveryTime: body.data.estimatedDeliveryTime } : {}),
  }).where(eq(ordersTable.id, params.data.id));

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

router.post("/orders/:id/payment", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = ConfirmPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ConfirmPaymentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const isAdmin = req.userRole === "admin";
  const updateData: Record<string, string> = {};

  if (body.data.action === "customer_confirmed") {
    updateData.paymentStatus = "AWAITING_CONFIRMATION";
    updateData.status = "AWAITING_CONFIRMATION";
  } else if (isAdmin && body.data.action === "admin_confirm") {
    updateData.paymentStatus = "PAID";
    updateData.status = "CONFIRMED";
  } else if (isAdmin && body.data.action === "admin_reject") {
    updateData.paymentStatus = "FAILED";
  }

  if (body.data.paymentStatus) {
    updateData.paymentStatus = body.data.paymentStatus;
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, params.data.id));
  }

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

export default router;
