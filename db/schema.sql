-- Daily Spend Tracker — reference schema (5 tables)
-- Applied incrementally via db/migrations/*.sql. This file documents the
-- final shape; it is not run directly against an existing database.

CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(60) NOT NULL,
    type       VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income')),
    color      VARCHAR(20) NOT NULL DEFAULT '#e05f3d',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, type)
);

CREATE TABLE expenses (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER NOT NULL REFERENCES categories(id),
    description  VARCHAR(255) NOT NULL,
    amount       NUMERIC NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incomes (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    amount      NUMERIC NOT NULL CHECK (amount > 0),
    income_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER REFERENCES categories(id), -- NULL = overall monthly budget
    month        DATE NOT NULL, -- always stored as the first day of the month
    amount_limit NUMERIC NOT NULL CHECK (amount_limit > 0),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category_id, month)
);

CREATE TABLE settings (
    id    SERIAL PRIMARY KEY,
    key   VARCHAR(60) NOT NULL UNIQUE,
    value VARCHAR(255) NOT NULL
);
