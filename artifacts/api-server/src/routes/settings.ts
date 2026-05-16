import { Router } from "express";
import { db, restaurantSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authenticate";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

async function ensureSettings() {
  const existing = await db.select().from(restaurantSettingsTable).limit(1);
  if (existing.length === 0) {
    const [settings] = await db.insert(restaurantSettingsTable).values({
      restaurantName: "Food Palace Restaurant",
      tagline: "Authentic Nigerian Flavors, Delivered To You",
      heroTitle: "Experience the True Taste of Nigeria",
      heroSubtitle: "From our kitchen to your doorstep — fresh, authentic Nigerian cuisine crafted with love",
      isOpen: true,
      openingHours: "Mon - Sun: 8:00 AM - 10:00 PM",
      whatsappNumber: "2349110064364",
      bankName: "MONIEPOINT MFB",
      bankAccountName: "USMAN SAMBO MARAFA",
      bankAccountNumber: "9110064364",
      estimatedDeliveryTime: "30 - 45 minutes",
      phone: "+234 911 006 4364",
    }).returning();
    return settings;
  }
  return existing[0];
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(settings);
});

router.patch("/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await ensureSettings();
  const [updated] = await db.update(restaurantSettingsTable)
    .set(parsed.data)
    .where(eq(restaurantSettingsTable.id, existing.id))
    .returning();

  res.json(updated ?? existing);
});

export default router;
