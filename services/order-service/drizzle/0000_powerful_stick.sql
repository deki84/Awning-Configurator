CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"width_cm" integer NOT NULL,
	"depth_cm" integer NOT NULL,
	"fabric" text NOT NULL,
	"motor" boolean DEFAULT false NOT NULL,
	"net_cents" integer NOT NULL,
	"vat_cents" integer NOT NULL,
	"gross_cents" integer NOT NULL,
	"customer_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
