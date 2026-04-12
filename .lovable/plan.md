
# Zentrix Finance - Investment Platform

## Brand & Design
- **Color scheme**: Gold (#FFD700) + Black (#0A0A0A) combination
- **Dark/Light mode** toggle support
- **Professional, premium look** with smooth animations
- **Fully responsive** - mobile & desktop optimized

---

## 1. Landing Page (Public)
- **Hero Section**: Bold headline, animated background, CTA "Start Investing"
- **How It Works**: 3-step visual flow (Invest → Grow → Withdraw)
- **ROI Calculator**: Interactive - enter amount, see 20-month returns with daily breakdown
- **Stats Section**: Total invested, active investors, total payouts (admin-controlled numbers)
- **Live Ticker**: Scrolling bar showing recent investments/payouts
- **Comparison Section**: Zentrix vs Bank FD vs other investments
- **Team Section**: About the fund manager
- **Testimonials**: Investor reviews
- **FAQ Section**: Common questions answered
- **Footer**: Contact, social links, disclaimer

## 2. Authentication (Lovable Cloud)
- **Investor Signup/Login** with email & password
- **Referral link support** - signup via referral code links the new user to referrer
- **Admin login** - separate admin panel access

## 3. Investor Dashboard
- **Portfolio Overview**: Total invested, current value, total earned, available for withdrawal
- **Daily Growth Display**: Shows daily earnings (e.g., $3.33/day on $1000 investment) accumulating in real-time
- **Growth Chart**: Graphical line/area chart showing portfolio growth over time
- **Investment History**: Table of all investments with dates, amounts, status
- **Deposit Section**: 
  - USDT wallet address display + QR code for payment
  - Upload payment proof/transaction hash
  - Investment status tracking (Pending → Confirmed by Admin)
- **Withdrawal Section**:
  - Withdraw button **active only when balance ≥ $20**
  - Enter USDT wallet address for receiving funds
  - Withdrawal request tracking (Pending → Completed within 5 hours)
  - Withdrawal history
- **Referral Section**:
  - Unique referral link/code
  - List of referred investors
  - 10% instant commission on each referral's investment (shown in dashboard)
  - Referral earnings history
- **Transaction History**: Complete log of all deposits, withdrawals, referral commissions with filters

## 4. Admin Dashboard
- **Overview**: Total investments, active users, pending requests, total payouts, revenue stats
- **User Management**: View all investors, block/unblock, reset password, view individual portfolios
- **Investment Management**: View pending deposits, confirm/reject investments (triggers daily ROI calculation)
- **Withdrawal Management**: View pending withdrawal requests, mark as completed (manual USDT transfer), reject with reason
- **Transaction Log**: Complete system-wide transaction history with filters
- **Referral Overview**: See referral tree, commission payouts
- **Settings**: Update USDT deposit address, QR code, site settings

## 5. Database Structure (Lovable Cloud/Supabase)
- **profiles**: User details, wallet address, blocked status
- **user_roles**: Admin role management (secure, separate table)
- **investments**: Amount, status, date, confirmed_by, referrer_id
- **daily_earnings**: Pre-calculated daily ROI records per investment
- **withdrawals**: Amount, status, wallet address, processed timestamp
- **referral_commissions**: Referrer, referred user, amount, investment_id
- **transactions**: Unified ledger for all money movements

## 6. Core Business Logic
- On admin confirming investment: Start daily ROI calculation ($amount × 2 / 600 days ≈ daily earning)
- If referred: Instantly credit 10% of investment to referrer's available balance
- Admin trades on 90% (after referral commission), but system tracks full amount for investor
- Withdrawal: Only when available balance ≥ $20, admin manually processes within 5 hours
- 20-month investment cycle with daily compounding display

## 7. Security
- Row Level Security on all tables
- Admin role verification server-side (never client-side)
- Input validation on all forms
- Secure authentication via Lovable Cloud
