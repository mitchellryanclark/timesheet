# v2 Universal App – Build Walkthrough

## What Was Built

Three files were updated and committed to the `feature/universal-app` branch.

---

## ⚙️ 1. Universal Profile System (`app.js`)

All hardcoded personal strings were replaced with a `getProfile()` function that reads from `localStorage`. This means any user can configure the app without touching code.

**Profile fields stored:**
- `userName`, `employerName`, `employerEmail`, `syncEmail`
- `hourlyRate` (default: $26/hr)
- `payPeriod`, `payDateType`, `payDateVal`
- `pdfFormat`, `syncEnabled`

---

## ⚙️ 2. Settings Modal (`index.html` + `app.js`)

A full-screen settings overlay accessible via the **⚙️ button** in the app header.

![Settings Modal](file:///C:/Users/mello/.gemini/antigravity/brain/39a8dfe2-51d3-4e0d-9cd8-4ad47880eeba/settings_modal_top_1774498474857.png)

All fields are pre-populated from the profile and saved back to `localStorage` on "Save Profile."

---

## 📅 3. Calendar Grid PDF (`index.html` + `style.css` + `app.js`)

A new **"👁️ Preview Calendar PDF"** button opens a full-screen calendar preview that matches the hand-drawn reference format.

![Calendar PDF Preview](file:///C:/Users/mello/.gemini/antigravity/brain/39a8dfe2-51d3-4e0d-9cd8-4ad47880eeba/pdf_preview_1774498498891.png)

**Features:**
- 7-column (Sun–Sat) monthly grid
- Shows 12hr shift times and daily hour totals in each cell
- Special pay types (Sick Pay, Holiday, etc.) shown in italics
- Footer: 1st–15th subtotal, 16th–End subtotal, and monthly grand total × hourly rate
- **Print / Save PDF** button triggers the browser's native print dialog

---

## 🌿 Git Status

- **Branch**: `feature/universal-app`
- **Commit**: `feat: Add universal profile system, settings modal, and calendar PDF generator`
- **Files changed**: `app.js`, `index.html`, `style.css` (321 insertions)
- **Main branch**: Untouched ✅

---

## ▶️ Recording

![v2 Feature Verification](file:///C:/Users/mello/.gemini/antigravity/brain/39a8dfe2-51d3-4e0d-9cd8-4ad47880eeba/v2_settings_pdf_verification_1774498457302.webp)
