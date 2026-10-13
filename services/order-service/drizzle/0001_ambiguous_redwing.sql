ALTER TABLE "orders" ADD COLUMN "projection_cm" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fabric_category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "depth_cm";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "fabric";