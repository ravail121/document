CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Untitled document',
  content    JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS documents_owner_idx ON documents(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS document_shares (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS shares_user_idx ON document_shares(user_id);

CREATE OR REPLACE FUNCTION reject_self_share() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = NEW.document_id AND d.owner_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'cannot share a document with its owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_self_share ON document_shares;
CREATE TRIGGER no_self_share
  BEFORE INSERT ON document_shares
  FOR EACH ROW EXECUTE FUNCTION reject_self_share();
