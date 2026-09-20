-- =============================================================
-- HMM3 Telegram Mini App — Database Schema (PostgreSQL)
-- =============================================================
-- Includes all fields for:
--   ✅ Core gameplay (hero state, map state)
--   ✅ Energy system (consumption + regen tracking)
--   ✅ Referral system (codes, bonuses, tracking)
--   ✅ Monetization (purchases, premium status)
--   ✅ Retention (daily quests, streaks, analytics)
-- =============================================================

-- -----------------------------------------------------------
-- 1. USERS — Central player table
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  telegram_id       BIGINT UNIQUE NOT NULL,       -- Telegram user ID
  username          VARCHAR(64),                   -- @username (nullable)
  first_name        VARCHAR(64),                   -- Display name

  -- Game state (stored as JSONB for flexibility during MVP)
  current_map       JSONB DEFAULT '{}',            -- Serialized grid data
  hero_data         JSONB DEFAULT '{}',            -- Hero position, AP, army

  -- Energy system
  energy            INTEGER DEFAULT 100,           -- Current energy
  max_energy        INTEGER DEFAULT 100,           -- Capacity (upgradeable)
  last_energy_regen TIMESTAMPTZ DEFAULT NOW(),     -- Last regen timestamp

  -- Resources
  gold              INTEGER DEFAULT 0,             -- In-game soft currency
  gems              INTEGER DEFAULT 0,             -- Premium hard currency

  -- Referral system
  referral_code       VARCHAR(16) UNIQUE,          -- This user's invite code
  referred_by         INTEGER REFERENCES users(id),-- Who invited this user
  referral_count      INTEGER DEFAULT 0,           -- How many friends invited
  referral_bonus_claimed BOOLEAN DEFAULT FALSE,    -- Whether invite bonus was claimed

  -- Engagement & analytics
  total_turns       INTEGER DEFAULT 0,             -- Lifetime turns played
  total_sessions    INTEGER DEFAULT 0,             -- Total game sessions
  last_login        TIMESTAMPTZ DEFAULT NOW(),     -- Last activity timestamp
  login_streak      INTEGER DEFAULT 0,             -- Consecutive daily logins
  created_at        TIMESTAMPTZ DEFAULT NOW(),     -- Account creation date

  -- Monetization
  total_spent       DECIMAL(10,2) DEFAULT 0,       -- Lifetime spending (USD)
  is_premium        BOOLEAN DEFAULT FALSE,         -- Active premium subscription
  premium_expires   TIMESTAMPTZ                    -- Premium expiration date
);

-- Fast lookups by Telegram ID and referral code
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- -----------------------------------------------------------
-- 2. REFERRAL REWARDS — Log of earned referral bonuses
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_rewards (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),  -- Inviter
  referred_user   INTEGER NOT NULL REFERENCES users(id),  -- Invitee
  reward_type     VARCHAR(32) NOT NULL,   -- 'gold', 'gems', 'energy'
  reward_amount   INTEGER NOT NULL,       -- Quantity awarded
  claimed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);

-- -----------------------------------------------------------
-- 3. PURCHASES — In-app purchase history
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id),
  item_type           VARCHAR(64) NOT NULL,    -- 'energy_refill', 'premium_7d', 'gem_pack_100'
  item_id             VARCHAR(64),             -- Catalog item identifier
  amount              DECIMAL(10,2) NOT NULL,  -- Price paid
  currency            VARCHAR(8) DEFAULT 'XTR',-- Telegram Stars (XTR) or other
  status              VARCHAR(16) DEFAULT 'pending', -- pending | completed | refunded
  telegram_payment_id VARCHAR(128),            -- Telegram payment charge ID
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);

-- -----------------------------------------------------------
-- 4. DAILY QUESTS — Retention mechanic
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_quests (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  quest_type      VARCHAR(64) NOT NULL,     -- 'move_10_cells', 'end_5_turns', 'collect_gold'
  target_value    INTEGER NOT NULL,          -- Goal amount
  current_value   INTEGER DEFAULT 0,         -- Progress
  reward_type     VARCHAR(32) NOT NULL,      -- 'gold', 'gems', 'energy'
  reward_amount   INTEGER NOT NULL,
  completed       BOOLEAN DEFAULT FALSE,
  quest_date      DATE DEFAULT CURRENT_DATE, -- One set of quests per day

  UNIQUE(user_id, quest_type, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON daily_quests(user_id, quest_date);

-- -----------------------------------------------------------
-- 5. GAME SESSIONS — Analytics & retention tracking
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  turns_played    INTEGER DEFAULT 0,
  energy_spent    INTEGER DEFAULT 0,
  platform        VARCHAR(32),               -- 'telegram_ios', 'telegram_android', 'web'
  app_version     VARCHAR(16)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON game_sessions(started_at);
