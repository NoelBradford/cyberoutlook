-- D1 schema for the email Worker (SQLite). Nothing here is deployed yet.
-- Principles: keep the least that is needed, record consent properly, and never keep an address longer than its purpose.

-- One row per address that is waiting to be confirmed or is active. The address is deleted by the purge job when no topic needs it.
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,         -- lower case
  email_hash  TEXT NOT NULL UNIQUE,         -- SHA-256 of the lower-case address, used for the suppression list
  created_at  INTEGER NOT NULL              -- milliseconds
);

-- The record of who agreed to what, when and where. One row per topic per request.
CREATE TABLE IF NOT EXISTS consents (
  id            INTEGER PRIMARY KEY,
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL,              -- result | download | newsletter | report-updates
  wording       TEXT NOT NULL,              -- id of the exact wording shown next to the box (marketing topics)
  source        TEXT NOT NULL,              -- the page the form was on, for example /check/
  asked_at      INTEGER NOT NULL,
  confirmed_at  INTEGER,                    -- set when they click the link in the confirmation email
  withdrawn_at  INTEGER                     -- set when they unsubscribe
);
CREATE INDEX IF NOT EXISTS consents_subscriber ON consents(subscriber_id, topic);

-- Single-use, expiring links. Only the SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS tokens (
  token_hash    TEXT PRIMARY KEY,
  purpose       TEXT NOT NULL,              -- confirm | download
  subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  payload       TEXT,                       -- JSON: topics, files or a result, depending on the purpose
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  used_at       INTEGER
);
CREATE INDEX IF NOT EXISTS tokens_subscriber ON tokens(subscriber_id, created_at);

-- Do not contact. Holds a hash, not the address, so it can stay after the address is deleted.
CREATE TABLE IF NOT EXISTS suppressions (
  email_hash TEXT NOT NULL,
  topic      TEXT NOT NULL,                 -- a topic, or * for everything
  at         INTEGER NOT NULL,
  PRIMARY KEY (email_hash, topic)
);
