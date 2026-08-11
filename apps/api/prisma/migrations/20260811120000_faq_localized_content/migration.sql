-- A question can now be written in more than one of the site's languages.
-- Existing single-language rows are preserved as their Armenian ("hy") text,
-- the site's default and only guaranteed-enabled locale — nothing is lost,
-- and every prior row is a valid `{ hy: "..." }` row under the new shape.

-- AlterTable
ALTER TABLE "faq"
  ALTER COLUMN "question" TYPE JSONB USING jsonb_build_object('hy', "question"),
  ALTER COLUMN "answer" TYPE JSONB USING (
    CASE WHEN "answer" IS NULL THEN NULL ELSE jsonb_build_object('hy', "answer") END
  );
