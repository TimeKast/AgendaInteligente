-- Add multi-channel contact preferences + Discord webhook config.
--
-- `users.contact_channels` — which channels the user wants reach-outs on.
-- Multi-select (array). v1 supports 'email' + 'discord'; 'whatsapp' is
-- declared but not yet wired (UI shows it as "Próximamente").
--
-- `notification_prefs.discord_webhook_url` — opaque Discord webhook URL
-- the user pastes from Server Settings → Integrations → Webhooks. We
-- POST check-ins there. NULL = not configured. Validation lives at the
-- action layer; CHECK at DB level just enforces non-empty when present.

ALTER TABLE "users"
  ADD COLUMN "contact_channels" text[] NOT NULL DEFAULT ARRAY['email']::text[];

ALTER TABLE "users"
  ADD CONSTRAINT "users_contact_channels_check"
  CHECK (
    array_length("contact_channels", 1) > 0
    AND "contact_channels" <@ ARRAY['email','discord','whatsapp']::text[]
  );

ALTER TABLE "notification_prefs"
  ADD COLUMN "discord_webhook_url" text;

ALTER TABLE "notification_prefs"
  ADD CONSTRAINT "notification_prefs_discord_webhook_url_check"
  CHECK (
    "discord_webhook_url" IS NULL
    OR length("discord_webhook_url") BETWEEN 50 AND 200
  );
