import { Router } from "express";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authenticate";

const router = Router();

router.get("/admin/analytics", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totals] = await db.select({
    totalOrders: sql<number>`count(*)::int`,
    totalRevenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)::float`,
    pendingOrders: sql<number>`count(*) filter (where ${ordersTable.status} = 'pending')::int`,
  }).from(ordersTable);

  const [todayStats] = await db.select({
    todayOrders: sql<number>`count(*)::int`,
    todayRevenue: sql<number>`coalesce(sum(${ordersTable.total}), 0)::float`,
  }).from(ordersTable).where(gte(ordersTable.createdAt, today));

  const topProductsRaw = await db.select({
    productName: orderItemsTable.productName,
    orderCount: sql<number>`count(*)::int`,
    revenue: sql<number>`sum(${orderItemsTable.totalPrice})::float`,
  })
    .from(orderItemsTable)
    .groupBy(orderItemsTable.productName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const statusBreakdown = await db.select({
    status: ordersTable.status,
    count: sql<number>`count(*)::int`,
  }).from(ordersTable).groupBy(ordersTable.status);

  res.json({
    totalOrders: totals.totalOrders ?? 0,
    totalRevenue: totals.totalRevenue ?? 0,
    pendingOrders: totals.pendingOrders ?? 0,
    todayOrders: todayStats.todayOrders ?? 0,
    todayRevenue: todayStats.todayRevenue ?? 0,
    topProducts: topProductsRaw,
    ordersByStatus: statusBreakdown,
  });
});

router.get("/admin/orders/recent", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);

  const allItems = await db.select().from(orderItemsTable);
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
    items: (itemsByOrder[o.id] ?? []).map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  })));
});

export default router;
