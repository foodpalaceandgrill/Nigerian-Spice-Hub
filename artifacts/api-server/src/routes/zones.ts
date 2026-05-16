import { Router } from "express";
import { db, deliveryZonesTable, deliveryLocationsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/authenticate";
import {
  CreateZoneBody,
  UpdateZoneParams,
  UpdateZoneBody,
  DeleteZoneParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await db.select().from(deliveryZonesTable).orderBy(asc(deliveryZonesTable.id));
  const locations = await db.select().from(deliveryLocationsTable);

  const locationsByZone = locations.reduce<Record<number, typeof locations>>((acc, loc) => {
    if (!acc[loc.zoneId]) acc[loc.zoneId] = [];
    acc[loc.zoneId].push(loc);
    return acc;
  }, {});

  res.json(zones.map((z) => ({
    ...z,
    fee: Number(z.fee),
    locations: locationsByZone[z.id] ?? [],
  })));
});

router.post("/zones", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateZoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { locations, ...zoneData } = parsed.data;
  const [zone] = await db.insert(deliveryZonesTable).values(zoneData).returning();

  const savedLocations = locations && locations.length > 0
    ? await db.insert(deliveryLocationsTable).values(locations.map((name: string) => ({ zoneId: zone.id, name }))).returning()
    : [];

  res.status(201).json({ ...zone, fee: Number(zone.fee), locations: savedLocations });
});

router.patch("/zones/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateZoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateZoneBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [zone] = await db.update(deliveryZonesTable).set(body.data).where(eq(deliveryZonesTable.id, params.data.id)).returning();
  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }
  const locations = await db.select().from(deliveryLocationsTable).where(eq(deliveryLocationsTable.zoneId, params.data.id));
  res.json({ ...zone, fee: Number(zone.fee), locations });
});

router.delete("/zones/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteZoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(deliveryZonesTable).where(eq(deliveryZonesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
