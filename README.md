# InvoiceAI – AI-Powered Invoice Management SaaS

InvoiceAI is a modern, responsive, multi-tenant SaaS application designed for freelancers, SMEs, and companies to automate invoicing, track payments, process supplier bills, and converse with an AI financial assistant.

---

## 🚀 Key Features

1. **AI-Powered Natural Language Invoice Creation:**
   - Type plain English instructions (e.g., *"Create an invoice for ABC Technologies. I completed a website development project for them. Cost is LKR 85,000 with a 10% discount due in 14 days"*).
   - The backend AI engine isolates provider calls (OpenRouter / Claude / Gemini) with an offline-resilient local NLP fallback.
   - Extracts customer details, products, line totals, discounts, taxes, and payment terms into an editable draft form.
   - **Never auto-issues:** Keeps all AI-generated invoices as drafts until user verification and approval.

2. **Voice-to-Invoice Workflow:**
   - In-browser microphone audio recording with live waveform and duration counter.
   - Audio preview playback, format verification, and transcription.
   - Converts voice instructions directly into structured invoice drafts.

3. **Multi-Tenant Architecture & Role-Based Permissions:**
   - Multi-tenant data isolation enforced by backend `CompanyAccessGuard`.
   - Support for multiple business profiles per user with instant business switching.
   - Roles: `OWNER`, `ADMIN`, `ACCOUNTANT`, `STAFF`.

4. **Multiple Professional PDF & Visual Templates:**
   - **Modern**, **Minimal**, **Corporate**, and **Creative** invoice templates.
   - Lightweight, zero-Puppeteer, 100% pure Node.js PDF generation via **PDFKit** (fully compatible with shared hosting & cPanel).
   - Secure public invoice sharing links (`/view-invoice/:token`) with revocable tokens and direct PDF downloads.

5. **Incoming Invoices & OCR/AI Extraction:**
   - Upload supplier bills (PDF, JPG, JPEG, PNG).
   - Automatic text parsing with `pdf-parse` and AI-driven field extraction.
   - Vendor duplicate detection and confidence score indicators.
   - Review and approval workflow: `PENDING_REVIEW` ➔ `APPROVED` / `REJECTED`.

6. **Payment Management & Financial Analytics:**
   - Record manual payments (Cash, Bank Transfer, Cheque, Card) with partial payment handling.
   - Real-time recalculation of invoice status: `DRAFT` ➔ `ISSUED` ➔ `PARTIALLY_PAID` ➔ `PAID` / `OVERDUE`.
   - Date-filtered financial dashboards (Today, This Week, This Month, This Year).
   - Historical monthly Revenue vs. Expense trend charts.
   - One-click CSV export for invoices and expenses.

7. **AI Financial Assistant:**
   - Conversational assistant for queries like *"How much revenue did I generate this month?"*, *"Show me all overdue invoices"*, or *"Who owes outstanding balances?"*.
   - Strictly queries authorized backend database models.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, React Router v6, Axios, date-fns.
- **Backend:** Node.js, NestJS, Prisma ORM, Express, Multer, PDFKit, pdf-parse, bcryptjs, Passport JWT.
- **Database:** MySQL / MariaDB.
- **AI Integration:** Backend-isolated OpenRouter / LLM client with local NLP fallback.

---

## 📁 Repository Structure

```
d:\Invoice Manager\
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Complete relational schema (18 models)
│   │   └── seed.ts             # Initial demo user & sample company seed
│   ├── src/
│   │   ├── common/             # Guards, decorators, decimal calculations
│   │   ├── prisma/             # Prisma client service
│   │   ├── auth/               # JWT authentication & registration
│   │   ├── companies/          # Multi-tenant business profiles & logos
│   │   ├── customers/          # Client management & debtor balances
│   │   ├── suppliers/          # Vendor directory & expense tracking
│   │   ├── products/           # Catalog items & rates
│   │   ├── invoices/           # Core invoice engine & numbering
│   │   ├── ai/                 # OpenRouter & local NLP invoice generator
│   │   ├── voice/              # Audio transcription service
│   │   ├── incoming-invoices/  # Supplier bill uploads & OCR extraction
│   │   ├── payments/           # Manual payments & gateway adapters
│   │   ├── pdf/                # PDFKit templates (Modern, Minimal, Corporate, Creative)
│   │   ├── reports/            # Dashboard analytics & CSV exports
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── uploads/                # Local storage for logos and bills
└── frontend/
    ├── src/
    │   ├── api/                # Axios client with multi-tenant headers
    │   ├── context/            # AuthContext & CompanyContext
    │   ├── components/         # UI badges, modal, templates, voice recorder
    │   ├── pages/              # Dashboard, Invoices, Incoming, Customers, etc.
    │   ├── types/              # Comprehensive TypeScript interfaces
    │   ├── App.tsx             # Protected and public routes
    │   └── main.tsx
    └── tailwind.config.js
```

---

## ⚡ Quick Start Guide (Local Development)

### 1. Prerequisites
- Node.js (v18 or higher)
- MySQL or MariaDB running on port 3306

### 2. Start Both Frontend & Backend with a Single Command
From the project root directory (`d:\Invoice Manager`), simply run:
```bash
npm run dev
```
This concurrently starts:
- 🔵 **Backend (NestJS API in watch mode):** `http://localhost:4000`
- 🟣 **Frontend (Vite Dev Server):** `http://localhost:5173`

*(Press `Ctrl + C` at any time to cleanly terminate both processes).*

---

### 3. Alternative Individual Startup
If you prefer starting them in separate terminals:
- **Backend:** `cd backend && npm run dev`
- **Frontend:** `cd frontend && npm run dev`

### 4. Demo Login Credentials
- **Email:** `demo@invoiceai.com`
- **Password:** `password123`
*(Or click the "Fill Demo Account" button on the login screen).*

---

## 🌐 cPanel & Shared Hosting Deployment Guide

InvoiceAI is designed to be **free-first** and deployable on low-cost cPanel shared hosting accounts without requiring Docker, permanently running Python daemons, Redis, or Puppeteer/Chrome.

### Step 1: Database Setup in cPanel
1. Open cPanel ➔ **MySQL Databases**.
2. Create database `youruser_invoiceai` and a MySQL user with full privileges.
3. Update `backend/.env` with your cPanel database URL:
   ```env
   DATABASE_URL="mysql://youruser_dbuser:StrongPassword@localhost:3306/youruser_invoiceai"
   ```

### Step 2: Deploy Backend using cPanel "Setup Node.js App"
1. In cPanel, navigate to **Setup Node.js App** (CloudLinux / cPanel Application Manager).
2. Click **Create Application**:
   - **Node.js version:** Select `18.x`, `20.x`, or higher.
   - **Application mode:** `Production`.
   - **Application root:** `invoice-backend`
   - **Application startup file:** `dist/src/main.js`
3. Upload the backend files (or clone via Git).
4. Enter the virtual environment terminal provided by cPanel and run:
   ```bash
   npm install --production
   npx prisma db push
   npm run build
   ```
5. Click **Restart Application** in cPanel.

### Step 3: Deploy Frontend (Static HTML/JS)
1. Build the frontend locally or on CI:
   ```bash
   cd frontend
   npm run build
   ```
2. Upload the contents of `frontend/dist/` into your cPanel `public_html/` (or subdomain folder).
3. Add a `.htaccess` file in `public_html/` to support React Router single-page navigation:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

### Step 4: Scheduled Background Tasks (cPanel Cron Jobs)
Instead of permanently running background workers or Redis:
1. Open cPanel ➔ **Cron Jobs**.
2. Add a daily cron job to run invoice overdue reminders:
   ```bash
   0 0 * * * /usr/local/bin/node /home/youruser/invoice-backend/dist/src/jobs/overdue-check.js
   ```

---

## 🛡️ Security & Tenant Isolation

- **Company Access Guard:** Every incoming request to protected routes validates that the authenticated user holds an active membership for the target `companyId` header.
- **Idempotent Payment Calculations:** Outstanding balances and invoice status are computed via backend transactional operations using decimal math to prevent race conditions.
- **Revocable Public Links:** Public customer invoice views utilize high-entropy UUID tokens rather than exposing internal database IDs.
- **Document Protection:** Supplier receipts and documents are stored in protected storage locations served through controlled endpoints.

# Ai-Invoice-Management-System
