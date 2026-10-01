-- Every plan names every limit in the entitlement registry, so none falls
-- back to 0 by omission. Storage and monthly PDFs aren't enforced yet and
-- stay unlimited until pricing decides otherwise; the API, embedding and
-- team limits stay at 0 until plans that include them exist.
UPDATE "Plan"
SET "limits" = '{
  "cv.max": 1,
  "storage.bytes": null,
  "pdf.monthly": null,
  "apiKey.max": 0,
  "api.requests.monthly": 0,
  "embed.max": 0,
  "embed.externalUsers.max": 0,
  "org.members.max": 0
}'::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'free';

UPDATE "Plan"
SET "limits" = '{
  "cv.max": null,
  "storage.bytes": null,
  "pdf.monthly": null,
  "apiKey.max": 0,
  "api.requests.monthly": 0,
  "embed.max": 0,
  "embed.externalUsers.max": 0,
  "org.members.max": 0
}'::jsonb,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'premium';
