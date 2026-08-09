-- Reviews Link Platform - core schema
-- Base tables follow the spec exactly; additive columns needed for
-- admin-panel features (brand color overrides, per-branch notification
-- channels, optional modules, role scoping) are marked with a comment.

CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,          -- additive: chain-level entry point for the mandatory branch-picker screen (/r/:slug)
  logo_url TEXT,
  brand_color TEXT DEFAULT '#1a1a1a',
  primary_color TEXT DEFAULT '#4A6CF7',   -- additive: overridable header gradient start
  accent_color TEXT DEFAULT '#F97316',    -- additive: overridable CTA/accent color
  privacy_policy_url TEXT,                -- additive: linked from privacy strip
  default_rating_threshold INTEGER DEFAULT 4,  -- additive: default applied to new branches
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  review_url TEXT,
  rating_threshold INTEGER DEFAULT 4,
  manager_phone TEXT,
  manager_email TEXT,
  is_active INTEGER DEFAULT 1,
  -- additive: custom on-page copy overrides
  intro_text TEXT,
  question_text TEXT,
  -- additive: optional modules, off by default, toggle per branch
  feature_loyalty_enabled INTEGER DEFAULT 0,
  feature_wheel_enabled INTEGER DEFAULT 0,
  -- additive: per-branch notification channel toggles - WhatsApp is the
  -- default channel, email is secondary (opt-in)
  notify_email_enabled INTEGER DEFAULT 0,
  notify_whatsapp_enabled INTEGER DEFAULT 1,
  notify_webhook_enabled INTEGER DEFAULT 0,
  notify_webhook_url TEXT,
  manager_whatsapp TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  rating INTEGER NOT NULL,
  source TEXT,
  categories TEXT,           -- JSON array of category keys
  comment TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  contact_consent INTEGER DEFAULT 0,  -- additive: "ok to contact me back" checkbox
  feedback_token TEXT,       -- additive: opaque token required to attach feedback to this row (prevents ID guessing)
  redirected_out INTEGER DEFAULT 0,
  sentiment TEXT,
  status TEXT DEFAULT 'pending',
  handled_by INTEGER,
  handled_at TEXT,
  internal_notes TEXT,
  ip_hash TEXT,
  branch_selection_method TEXT,  -- additive: 'manual' | 'geo' | 'direct_link' - how the branch was selected
  policy_version TEXT,           -- additive: privacy policy version customer agreed to
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,                 -- additive: display name for sidebar user card
  role TEXT NOT NULL,        -- super_admin | restaurant_admin | branch_manager
  restaurant_id INTEGER REFERENCES restaurants(id),
  branch_id INTEGER REFERENCES branches(id),  -- additive: required for branch_manager scoping
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- additive: persistent rate-limit / dedup log (survives restarts, unlike in-memory)
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id INTEGER PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  branch_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- additive: named QR sources per branch (table numbers, "counter", "invoice", etc.)
CREATE TABLE IF NOT EXISTS qr_sources (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  label TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- additive: cached daily AI-generated weekly summary per branch
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  summary_json TEXT NOT NULL,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- additive: optional module - loyalty club customer records
CREATE TABLE IF NOT EXISTS loyalty_customers (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  response_id INTEGER REFERENCES responses(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  visit_count INTEGER DEFAULT 1,
  last_sentiment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- additive: optional module - wheel of fortune prizes + redemptions
CREATE TABLE IF NOT EXISTS wheel_prizes (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  label TEXT NOT NULL,
  probability REAL NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wheel_redemptions (
  id INTEGER PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  response_id INTEGER REFERENCES responses(id),
  prize_id INTEGER NOT NULL REFERENCES wheel_prizes(id),
  redemption_code TEXT UNIQUE NOT NULL,
  redeemed INTEGER DEFAULT 0,
  redeemed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branches_restaurant ON branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_responses_branch ON responses(branch_id);
CREATE INDEX IF NOT EXISTS idx_responses_created ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_log(ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);
