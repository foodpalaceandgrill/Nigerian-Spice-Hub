import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantSettingsTable = pgTable("restaurant_settings", {
  id: serial("id").primaryKey(),
  restaurantName: text("restaurant_name").notNull().default("Food Palace Restaurant"),
  tagline: text("tagline"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  logoUrl: text("logo_url"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  isOpen: boolean("is_open").notNull().default(true),
  openingHours: text("opening_hours"),
  whatsappNumber: text("whatsapp_number"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  twitterUrl: text("twitter_url"),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  estimatedDeliveryTime: text("estimated_delivery_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRestaurantSettingsSchema = createInsertSchema(restaurantSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRestaurantSettings = z.infer<typeof insertRestaurantSettingsSchema>;
export type RestaurantSettings = typeof restaurantSettingsTable.$inferSelect;
