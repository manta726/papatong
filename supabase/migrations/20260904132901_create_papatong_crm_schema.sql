/*
# Papatong CRM - Initial Schema

## Overview
Creates the full schema for a marketing operations CRM with leads management,
bookings, units inventory, tasks, and budget/expenses tracking.

## New Tables

1. **leads** - Prospective customers (marketing leads)
   - id (uuid PK)
   - name, email, phone (contact info)
   - source (where the lead came from: website, referral, social, etc.)
   - status (new, contacted, qualified, converted, lost)
   - unit_interest (which unit they're interested in)
   - budget (their budget range)
   - notes (free text)
   - user_id (owner, defaults to auth.uid())
   - created_at, updated_at

2. **bookings** - Confirmed reservations/bookings
   - id (uuid PK)
   - lead_id (FK to leads)
   - unit_id (FK to units)
   - booking_date (when the booking is for)
   - status (pending, confirmed, cancelled, completed)
   - amount (booking value)
   - user_id (owner)
   - created_at, updated_at

3. **units** - Inventory/properties available
   - id (uuid PK)
   - name, code (identifier)
   - type (studio, 1br, 2br, etc.)
   - status (available, reserved, sold, maintenance)
   - price
   - location
   - description
   - user_id (owner)
   - created_at, updated_at

4. **tasks** - Operational tasks/to-dos
   - id (uuid PK)
   - title, description
   - status (todo, in_progress, done)
   - priority (low, medium, high)
   - due_date
   - related_lead_id (optional FK)
   - user_id (owner)
   - created_at, updated_at

5. **expenses** - Marketing budget/expenses tracking
   - id (uuid PK)
   - title, description
   - category (advertising, events, materials, digital, other)
   - amount
   - date
   - user_id (owner)
   - created_at, updated_at

## Security
- All tables have RLS enabled
- All tables are owner-scoped (user_id defaults to auth.uid())
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE) scoped to authenticated owner
- Owner column defaulted to auth.uid() so inserts without explicit user_id succeed
*/

-- =====================
-- LEADS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  source text DEFAULT 'website',
  status text NOT NULL DEFAULT 'new',
  unit_interest text,
  budget text,
  notes text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_leads" ON leads;
CREATE POLICY "select_own_leads" ON leads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_leads" ON leads;
CREATE POLICY "insert_own_leads" ON leads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_leads" ON leads;
CREATE POLICY "update_own_leads" ON leads FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_leads" ON leads;
CREATE POLICY "delete_own_leads" ON leads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- UNITS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'studio',
  status text NOT NULL DEFAULT 'available',
  price numeric(12,2) DEFAULT 0,
  location text,
  description text,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_units" ON units;
CREATE POLICY "select_own_units" ON units FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_units" ON units;
CREATE POLICY "insert_own_units" ON units FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_units" ON units;
CREATE POLICY "update_own_units" ON units FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_units" ON units;
CREATE POLICY "delete_own_units" ON units FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- BOOKINGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  amount numeric(12,2) DEFAULT 0,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bookings" ON bookings;
CREATE POLICY "delete_own_bookings" ON bookings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- TASKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  related_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- EXPENSES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_units_user_id ON units(user_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- =====================
-- UPDATED_AT TRIGGERS
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON leads;
CREATE TRIGGER trigger_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_units_updated_at ON units;
CREATE TRIGGER trigger_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON bookings;
CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();