# Multi-Level Marketing (MLM) System — Implementation Plan

Your plan is workable and a sensible MLM model. Below is the full design based on your answers:

- **Chain**: A → B → C → D → E → F → G (classic upline chain)
- **Commission paid on**: each downline's **daily ROI earnings** (ongoing, every day)
- **Rates by level (relative to the upline)**: L1=10%, L2=3%, L3=3%, L4=2%, L5=2%, L6=0% (ignored / cap)
- **Replaces** the existing single-level 10%-on-investment model

---

## 1. How commissions will work (worked example)

A invested $100. B joined via A's code and invested $100. C joined via B's code, etc.

Each user's daily ROI = `amount × 2 / 600 = $0.333/day` per $100.

When **C** earns $0.333 today:
- C's L1 upline = **B** → B earns 10% × $0.333 = **$0.0333**
- C's L2 upline = **A** → A earns 3% × $0.333 = **$0.0100**

When **G** earns $0.333 today:
- L1 F → 10%, L2 E → 3%, L3 D → 3%, L4 C → 2%, L5 B → 2%, A is L6 → 0% (gets nothing)

**Important rule**: A user only earns MLM commission if they have at least one **confirmed active investment** themselves (prevents free-riding uplines).

---

## 2. Database changes

**New table** `mlm_commissions` (separate from old `referral_commissions` so historical data is preserved):
- `id, referrer_id, downline_id, daily_earning_id, level (1-5), percentage, amount, earned_date, created_at`
- RLS: user can SELECT own (referrer_id = auth.uid()) or admin

**New table** `rank_tiers` (admin-configurable):
- `id, name, min_direct_referrals, min_team_size, min_team_volume_usd, badge_color, bonus_percentage, sort_order`
- Seed defaults:
  - **Bronze** — 3 directs / 5 team / $500 volume
  - **Silver** — 10 directs / 25 team / $5,000
  - **Gold** — 25 directs / 100 team / $25,000
  - **Diamond** — 50 directs / 500 team / $100,000
  - **Crown** — 100 directs / 2,000 team / $500,000

**New columns on `profiles`**:
- `current_rank_id uuid` (nullable, FK-style ref to rank_tiers)
- `direct_referrals_count int default 0`
- `team_size int default 0` (full downline depth ≤ 5)
- `team_volume numeric default 0` (sum of confirmed investments in downline ≤ 5)

**New transaction type**: extend `transaction_type` enum with `'mlm_commission'` (keeps `referral_commission` for legacy).

**Helper SQL function** `get_upline_chain(_user_id uuid, _max_levels int)` returns table of `(level, ancestor_id)` by recursively walking `profiles.referred_by`. SECURITY DEFINER, used by the edge function.

---

## 3. Edge function changes — `process-daily-earnings`

After inserting each `daily_earnings` row, also:
1. Call `get_upline_chain(downline_user_id, 5)` → returns up to 5 ancestors with their level.
2. For each ancestor, check they have ≥1 `confirmed` investment. If not, skip (commission is forfeited, not rolled up).
3. Lookup % from a constant map `{1:10, 2:3, 3:3, 4:2, 5:2}`.
4. Insert into `mlm_commissions` and a matching `transactions` row of type `mlm_commission`.
5. The commission becomes immediately part of the ancestor's available balance (same accounting path as today's referral commission).

A separate scheduled job (or trigger) recalculates `direct_referrals_count`, `team_size`, `team_volume`, and `current_rank_id` after each new confirmed investment.

---

## 4. Confirmation flow change

Currently, when admin confirms an investment, **10% goes instantly to the direct referrer**. With your new model (commission on **daily ROI**, not on principal), this instant 10% is **removed**. All commissions now flow through the daily ROI engine. Confirm this is OK — it changes cash-flow timing for referrers (gradual instead of upfront).

If you'd rather keep an upfront bonus too, say so and I'll add a small one-time "joining bonus" (e.g. 5% to direct referrer on confirmation) on top.

---

## 5. UI changes

### Investor Dashboard → Referral page (rebuild)
- **My Rank card**: current rank badge, progress bar to next rank (showing each requirement: directs / team size / volume).
- **Team tree view**: collapsible tree showing levels 1–5 with each member's name (masked email), join date, invested, status, and commission you've earned from them lifetime.
- **Earnings by level**: table — Level | Members | Total Invested | Commission Earned (today / 7d / lifetime).
- **Recent commission ledger**: live-updating list of `mlm_commissions` rows.

### Admin Dashboard
- **Rank Tiers manager**: CRUD on `rank_tiers` (% rates per level remain code constants for safety, ranks are configurable).
- **MLM overview**: top leaders by team volume, total MLM payouts today / month, suspicious patterns (e.g. circular referrals).
- **Per-user view**: full downline tree for any investor.

### Landing page
- Update "Refer & Earn" copy to advertise the 6-level MLM with the rate table.
- ROI calculator: add an optional "Estimate referral income" mode showing potential earnings if you build a 5-level team.

---

## 6. Edge cases & safeguards

- **Self-referral / circular**: enforced by a trigger that rejects `referred_by = user_id` and detects cycles in the upline chain.
- **Inactive uplines**: ancestor without a confirmed investment → skipped (commission is **not** rolled up to next level, it's simply forfeited). Tell me if you want roll-up instead.
- **200% cap**: each user's own ROI still capped at 200% over 600 days. MLM commissions are **separate income** and not capped per investor (this is standard MLM behavior).
- **Migration of old data**: existing `referral_commissions` rows stay as-is (historical). New activity uses `mlm_commissions`. Old single-level 10% on principal is **stopped** going forward.
- **Memory update**: replace the "Single-level 10%" memory with the new 6-level rate table and rank tier system.

---

## 7. Build order

1. DB migration: new tables, columns, enum value, recursive upline function, anti-cycle trigger, seed rank tiers.
2. Update `process-daily-earnings` to fan out commissions through the upline.
3. Stop the upfront 10% on investment confirmation in `AdminDashboard`.
4. Build rank/team aggregation function + recompute on investment confirmation.
5. Rebuild investor Referral page (rank card, tree, level breakdown, ledger).
6. Build admin rank-tier manager and MLM overview.
7. Update landing page copy + calculator.
8. Update project memory.

---

## One outstanding decision

**Upfront referrer bonus on investment confirmation** — your doc was silent on this. Pick one when you approve:
- **A.** Pure daily-only (cleanest, matches your answer exactly). ← my default
- **B.** Daily + small one-time 5% to direct referrer on confirmation (faster gratification, slightly higher payout).

Approve the plan and tell me A or B, and I'll build it.