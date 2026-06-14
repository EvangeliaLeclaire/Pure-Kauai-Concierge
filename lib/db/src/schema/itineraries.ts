import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const itinerariesTable = pgTable("itineraries", {
  id:        text("id").primaryKey(),
  slug:      text("slug").notNull().unique(),
  data:      jsonb("data").notNull(),
  approved:  boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
