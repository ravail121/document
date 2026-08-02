INSERT INTO users (id, name, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Bob',   'bob@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO documents (id, owner_id, title, content) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Welcome to the editor',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This document is owned by Alice. Share it with Bob to see it appear in his shared list."}]}]}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
