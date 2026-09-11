-- Adds categories/incomes/budgets/settings and migrates expenses.category
-- (text) to expenses.category_id (FK), preserving existing rows.
BEGIN;

CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(60) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    color      VARCHAR(20) NOT NULL DEFAULT '#e05f3d',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, type)
);

CREATE TABLE IF NOT EXISTS incomes (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    amount      NUMERIC NOT NULL CHECK (amount > 0),
    income_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER REFERENCES categories(id),
    month        DATE NOT NULL,
    amount_limit NUMERIC NOT NULL CHECK (amount_limit > 0),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, month)
);

CREATE TABLE IF NOT EXISTS settings (
    id    SERIAL PRIMARY KEY,
    key   VARCHAR(60) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL
);

-- Seed categories once (six expense + four income), matching the app's
-- previous hardcoded list so existing expense rows can be backfilled by name.
INSERT INTO categories (name, type, color)
SELECT * FROM (VALUES
    ('Food', 'expense', '#e05f3d'),
    ('Transport', 'expense', '#3d7fe0'),
    ('Bills', 'expense', '#b43f2d'),
    ('Shopping', 'expense', '#9d5fe0'),
    ('Health', 'expense', '#2da683'),
    ('Other', 'expense', '#79817c'),
    ('Salary', 'income', '#2da683'),
    ('Freelance', 'income', '#3d7fe0'),
    ('Gift', 'income', '#9d5fe0'),
    ('Other', 'income', '#79817c')
) AS seed(name, type, color)
WHERE NOT EXISTS (SELECT 1 FROM categories);

-- Migrate expenses.category (text) -> expenses.category_id (FK)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

UPDATE expenses e
SET category_id = c.id
FROM categories c
WHERE e.category_id IS NULL
  AND c.type = 'expense'
  AND c.name = e.category;

-- Anything that didn't match a known category name falls back to "Other".
UPDATE expenses e
SET category_id = (SELECT id FROM categories WHERE type = 'expense' AND name = 'Other')
WHERE e.category_id IS NULL;

ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE expenses DROP COLUMN IF EXISTS category;

INSERT INTO settings (key, value)
SELECT 'currency', 'USD'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'currency');

COMMIT;
