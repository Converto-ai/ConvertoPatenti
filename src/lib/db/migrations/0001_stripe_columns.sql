ALTER TABLE "autoscuole" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text UNIQUE;
ALTER TABLE "autoscuole" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text UNIQUE;
