import { Router } from "express";
import { db, productsTable, productVariantsTable, productAddonsTable, categoriesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authenticate";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  GetProductVariantsParams,
  CreateProductVariantParams,
  CreateProductVariantBody,
  GetProductAddonsParams,
  CreateProductAddonParams,
  CreateProductAddonBody,
} from "@workspace/api-zod";

const router = Router();

async function getProductWithDetails(productId: number) {
  const [product] = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      slug: productsTable.slug,
      description: productsTable.description,
      imageUrl: productsTable.imageUrl,
      basePrice: productsTable.basePrice,
      isAvailable: productsTable.isAvailable,
      isFeatured: productsTable.isFeatured,
      sortOrder: productsTable.sortOrder,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, productId));

  if (!product) return null;

  const [variants, addons] = await Promise.all([
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, productId)).orderBy(asc(productVariantsTable.id)),
    db.select().from(productAddonsTable).where(eq(productAddonsTable.productId, productId)).orderBy(asc(productAddonsTable.id)),
  ]);

  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
    addons: addons.map((a) => ({ ...a, price: Number(a.price) })),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { categoryId, search, available } = params.data;

  let productsRaw = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      slug: productsTable.slug,
      description: productsTable.description,
      imageUrl: productsTable.imageUrl,
      basePrice: productsTable.basePrice,
      isAvailable: productsTable.isAvailable,
      isFeatured: productsTable.isFeatured,
      sortOrder: productsTable.sortOrder,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(asc(productsTable.sortOrder), asc(productsTable.name));

  if (categoryId != null) {
    productsRaw = productsRaw.filter((p) => p.categoryId === categoryId);
  }
  if (search) {
    const q = search.toLowerCase();
    productsRaw = productsRaw.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }
  if (available != null) {
    productsRaw = productsRaw.filter((p) => p.isAvailable === available);
  }

  const [allVariants, allAddons] = await Promise.all([
    db.select().from(productVariantsTable).orderBy(asc(productVariantsTable.productId), asc(productVariantsTable.id)),
    db.select().from(productAddonsTable).orderBy(asc(productAddonsTable.productId), asc(productAddonsTable.id)),
  ]);

  const productIds = new Set(productsRaw.map((p) => p.id));

  const variantsByProduct = allVariants
    .filter((v) => productIds.has(v.productId))
    .reduce<Record<number, typeof allVariants>>((acc, v) => {
      if (!acc[v.productId]) acc[v.productId] = [];
      acc[v.productId].push(v);
      return acc;
    }, {});

  const addonsByProduct = allAddons
    .filter((a) => productIds.has(a.productId))
    .reduce<Record<number, typeof allAddons>>((acc, a) => {
      if (!acc[a.productId]) acc[a.productId] = [];
      acc[a.productId].push(a);
      return acc;
    }, {});

  res.json(productsRaw.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    variants: (variantsByProduct[p.id] ?? []).map((v) => ({ ...v, price: Number(v.price) })),
    addons: (addonsByProduct[p.id] ?? []).map((a) => ({ ...a, price: Number(a.price) })),
  })));
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  res.status(201).json({ ...product, basePrice: Number(product.basePrice), variants: [], addons: [] });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = await getProductWithDetails(params.data.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.patch("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db.update(productsTable).set(body.data).where(eq(productsTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const product = await getProductWithDetails(params.data.id);
  res.json(product);
});

router.delete("/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/products/:id/variants", async (req, res): Promise<void> => {
  const params = GetProductVariantsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const variants = await db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, params.data.id)).orderBy(asc(productVariantsTable.id));
  res.json(variants.map((v) => ({ ...v, price: Number(v.price) })));
});

router.post("/products/:id/variants", requireAdmin, async (req, res): Promise<void> => {
  const params = CreateProductVariantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateProductVariantBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [variant] = await db.insert(productVariantsTable).values({ ...body.data, productId: params.data.id }).returning();
  res.status(201).json({ ...variant, price: Number(variant.price) });
});

router.get("/products/:id/addons", async (req, res): Promise<void> => {
  const params = GetProductAddonsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const addons = await db.select().from(productAddonsTable).where(eq(productAddonsTable.productId, params.data.id)).orderBy(asc(productAddonsTable.id));
  res.json(addons.map((a) => ({ ...a, price: Number(a.price) })));
});

router.post("/products/:id/addons", requireAdmin, async (req, res): Promise<void> => {
  const params = CreateProductAddonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateProductAddonBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [addon] = await db.insert(productAddonsTable).values({ ...body.data, productId: params.data.id }).returning();
  res.status(201).json({ ...addon, price: Number(addon.price) });
});

export default router;
