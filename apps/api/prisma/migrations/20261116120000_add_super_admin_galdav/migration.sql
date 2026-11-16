-- Super admin account for galdav@autoroom.am.
-- Only a bcrypt hash of a one-time password is committed (the password itself was handed to the
-- owner out of band); "mustChangePassword" forces a new one at first sign-in.
-- Idempotent: an existing account is left untouched. Needs the seeded super_admin role, so on a
-- brand-new database (migrations run before the seed) it inserts nothing.
INSERT INTO "users" ("id", "email", "passwordHash", "name", "status", "mustChangePassword", "roleId", "updatedAt")
SELECT 'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24),
       'galdav@autoroom.am',
       '$2b$12$y/k13nOxSlMpDHCdHvbvleNC3NgmIcHabx1I6FEc42SXTTECPWUYO',
       'Galdav',
       'ACTIVE',
       true,
       "id",
       CURRENT_TIMESTAMP
FROM "roles"
WHERE "key" = 'super_admin'
ON CONFLICT ("email") DO NOTHING;
