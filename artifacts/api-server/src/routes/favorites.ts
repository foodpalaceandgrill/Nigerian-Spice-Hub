import { Router } from "express";
import { db, favoritesTable, productsTable, productVariantsTable, productAddonsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/authenticate";
import { AddFavoriteParams, RemoveFavoriteParams } from "@workspace/api-zod";

const router = Router();

router.get("/favorites", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const favs = await db.select().from(favoritesTable).where(eq(favoritesTable.userId, req.userId!));

  const result = await Promise.all(favs.map(async (fav) => {
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
      .where(eq(productsTable.id, fav.productId));

    const [variants, addons] = await Promise.all([
      db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, fav.productId)),
      db.select().from(productAddonsTable).where(eq(productAddonsTable.productId, fav.productId)),
    ]);

    return {
      ...fav,
      product: product ? {
        ...product,
        basePrice: Number(product.basePrice),
        variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
        addons: addons.map((a) => ({ ...a, price: Number(a.price) })),
      } : null,
    };
  }));

  res.json(result);
});

router.post("/favorites/:productId", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [fav] = await db.insert(favoritesTable).values({
      userId: req.userId!,
      productId: params.data.productId,
    }).returning();
    res.status(201).json(fav);
  } catch {
    res.status(400).json({ error: "Already favorited" });
  }
});

router.delete("/favorites/:productId", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(favoritesTable).where(
    and(
      eq(favoritesTable.userId, req.userId!),
      eq(favoritesTable.productId, params.data.productId)
    )
  );
  res.sendStatus(204);
});

export default router;
