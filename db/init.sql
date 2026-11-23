CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

INSERT INTO categories (name) VALUES
  ('Electronics'), ('Books'), ('Home'), ('Sports')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, description, price, category_id)
SELECT seed.name, seed.description, seed.price, categories.id
FROM (VALUES
  ('Wireless Mouse', 'Ergonomic wireless mouse', 24.99::numeric, 'Electronics'),
  ('Mechanical Keyboard', 'Compact mechanical keyboard', 89.00::numeric, 'Electronics'),
  ('USB-C Hub', 'Multi-port USB-C adapter', 39.50::numeric, 'Electronics'),
  ('Distributed Systems', 'An introduction to distributed systems', 42.00::numeric, 'Books'),
  ('Clean Code', 'A handbook of agile software craftsmanship', 35.00::numeric, 'Books'),
  ('Desk Lamp', 'LED desk lamp with adjustable brightness', 28.75::numeric, 'Home'),
  ('Yoga Mat', 'Non-slip exercise mat', 19.99::numeric, 'Sports')
) AS seed(name, description, price, category_name)
JOIN categories ON categories.name = seed.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM products existing WHERE existing.name = seed.name
);
