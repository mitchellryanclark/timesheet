# 🕒 Rush Timesheet App

A high-performance, voice-integrated Progressive Web App (PWA) designed for seamless timekeeping and automated billing. This app syncs real-time with Google Sheets and generates professional PDF invoices with a single tap.

## 🚀 Key Features

*   **🎙 Advanced Voice Control:** Log shifts, set dates, and adjust break times using natural speech (e.g., "Started at 9:00 AM", "Logged 8 hours today", "No lunch").
*   **🔔 Native Push Notifications:** Instant alerts for successful logs, missing days, and pay period completion.
*   **🔄 Two-Way Master Sync:** Automatically pulls truth from Google Sheets. Adjustments made in the spreadsheet are instantly reflected in the app's calendar.
*   **📊 Automated PDF Invoicing:** Generate professional, centered PDF invoices with currency formatting and smart pay date logic.
*   **⏲ 5-Minute Rounding:** Every entry is automatically rounded to the nearest 5-minute increment for consistent billing.
*   **📱 PWA / Offline Support:** Install to your home screen and use even without a data connection for basic time logging.

## 🛠 Tech Stack

*   **Frontend:** HTML5, Vanilla CSS, Modern JavaScript
*   **Backend:** Google Apps Script (GAS)
*   **Database/Storage:** Google Sheets & Browser LocalStorage
*   **Hosting:** GitHub Pages

## 📖 How to Use

1.  **Log Time:** Tap the Microphone or pick a date manually. Enter your Start and End times.
2.  **Save:** Hit "Save & Sync" to send data to your Google Sheet.
3.  **Review:** Select the 15th or Last Day of a month, and hit "1. Generate & Review" to receive a summary PDF via email.
4.  **Submit:** Once satisfied, hit "2. Approve & Send" to email the final invoice to your employer.

---
*Developed for Mitchell Clark's personal timesheet workflow.*
