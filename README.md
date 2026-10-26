# SAC QueueFlow — Smart Queuing & Student Notification System
> **"Your Time Matters. Your Queue, Anywhere."**  
> **Target Institution:** St. Anthony’s College, San Jose de Buenavista, Antique, Philippines  
> **Platform:** Responsive Web Application & Progressive Web App (PWA)

---

## 🏛️ Project Overview

**SAC QueueFlow** is a modern, real-time queuing and student notification platform tailored specifically for the academic and financial offices of St. Anthony's College (SAC) in Antique, Philippines. 

Instead of waiting for hours inside crowded administrative hallways or constantly running out of lecture classes to peek at physical bulletin boards, Antonians can:
1. Join campus queues remotely via their smartphone.
2. Attend ongoing lectures, laboratories, or library study sessions without risking their place in line.
3. Track active numbers, estimated wait ranges, and live notifications.
4. Request **Class-Conflict Deferments** when major academic conflicts arise.
5. Provide verification at the counter with opaque **Digital QR Passes**.
6. Support walk-in visitors and students without smartphones through physical queue tickets and a **High-Visibility Live TV Display**.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Server & Client Components) |
| **Language** | TypeScript |
| **Styling & UI Tokens** | Tailwind CSS v4, Lucide Icons, Custom SAC Education Teal Palette (`#0D9488`, `#2DD4BF`, `#F0FDFA`) |
| **Motion & Polish** | Framer Motion & CSS Micro-transitions (150–250ms, reduced-motion compliant) |
| **Offline / PWA** | Web App Manifest (`manifest.json`), Service Worker readiness |
| **Database & Auth Engine** | PostgreSQL with Row-Level Security (RLS) & Supabase Realtime migrations |
| **QR Code Engine** | Opaque non-PII token generation & verification via `qrcode` |

---

## 👥 User Roles & Core Features

### 1. Student Experience (`/` - Student View)
- **Active Queue Passes**: Displays large visible ticket number, current status, students ahead, and dynamic wait times.
- **Smart Wait Estimation**: Dynamic range calculation based on actual completed transaction throughput, office duration averages, and open counters.
- **Class-Conflict Deferment**: Allows students attending class to pause their ticket for 45 minutes with built-in fairness limits (maximum 2 deferments).
- **Digital QR Pass Modal**: Clean visual pass with opaque hash and verification code for counter scanning.
- **Campus Announcements**: Instant banner for office schedules, fee deadlines, and exam permit announcements.

### 2. Staff Console (`/` - Staff Desk)
- **Multi-Counter Dispatcher**: Counter selection (Counter #1, #2, #3, etc.) with assigned officer name.
- **Transactional Actions**:
  - `CALL NEXT`: Atomically claims the next waiting student in line.
  - `RECALL`: Dispatches immediate urgent recall alerts.
  - `START SERVICE`: Flags ticket as actively being transacted.
  - `COMPLETE`: Finishes transaction and frees counter.
  - `SKIP / NO-SHOW`: Handles absent students after the 3-minute grace window.
  - `PAUSE COUNTER`: Safely pauses counter operations for breaks.
- **Walk-in Ticket Generator**: Generates physical paper tickets with lookup codes for non-smartphone users.
- **Ticket Validator**: Instantly validates QR codes or verification codes presented at the window.

### 3. Executive Administration & Analytics (`/` - Admin & Analytics)
- Real-time KPIs: Total Tickets Issued, Completion Rate, Class Deferments Count, No-Show / Skipped Rate.
- Office-by-office breakdown and counter roster.
- Complete chronological audit log adhering to the Philippine Data Privacy Act.
- **CSV Data Export** for institutional reporting.

### 4. TV Queue Display Mode (Full-Screen Live Monitor)
- High-contrast, large-format display for administration lobby monitors and waiting-area TVs.
- Real-time **"NOW SERVING"** counter calling card with smooth number transitions.
- "UP NEXT IN LINE" queue roster.
- Optional voice audio announcement synthesizer (*"Queue number R-036, please proceed to Counter 1"*).

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v18+ or v20+
- npm, pnpm, or yarn

### Installation

```bash
# 1. Navigate to the project directory
cd "sac-queueflow"

# 2. Install dependencies (if not already installed)
npm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Open your Supabase project dashboard or local PostgreSQL instance.
2. Navigate to the **SQL Editor**.
3. Run the complete SQL migration file provided in:
   ```
   sac-queueflow/supabase/migrations/001_initial_schema.sql
   ```
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` into your `.env.local`.

---

## 🔒 Security & Privacy Posture
- **Philippine Data Privacy Act Compliant**: Student IDs and full names are never projected onto public TV displays or unauthenticated public endpoints.
- **Opaque Tokenization**: Digital QR codes contain random cryptographically generated tokens (`SAC-PASS-...`), not raw database IDs or private academic records.
- **Anti-Hoarding Fairness**: Queue deferments enforce hard ceilings (2 per ticket) so students cannot manipulate queue positions.

---

## 🏫 Institutional Info
- **Institution**: St. Anthony’s College
- **Address**: San Jose de Buenavista, Antique, Philippines
- **System Version**: 1.0.0 Production MVP
