# Project Handover: Transition to Firebase Backend

## 📍 Current State (v2 Build)
- **Branch**: `feature/universal-app` (active)
- **Architecture**: Universal Configurable Platform. 
- **Features**: 
    - ⚙️ Settings Menu (Name, Rate, Employer, etc.)
    - 🗓️ Local Calendar PDF Generation (Grid View)
    - 👤 User Profile system in `localStorage`
- **Dependency**: Still relies on `sync_data` to a personal Google Apps Script for "Pro" features (Email/Backup).

## 🚀 The Backend Goal
Move from a **Personal Script** architecture to a **Universal Centralized Platform** (Firebase) to allow zero-setup "Pro" features for all users.

### 🏢 Proposed Infrastructure (Firebase)
1. **Authentication**: "Sign in with Google" to replace the manual `syncEmail` setting.
2. **Firestore (Database)**: Store shifts centrally so users can sync across devices.
3. **Cloud Functions**: A central "Post Office" to send emails and save PDFs to the user's Google Drive.

## 🛠️ Next Steps (New Conversation)
1. **[INIT]**: Connect the project to the existing Firebase account/project.
2. **[AUTH]**: Implement Google Sign-In and replace `localStorage` with a basic Firebase User object.
3. **[SYNC]**: Migrating the `rushTimesheet` local data to Firestore.
4. **[EMAIL]**: Replacing the Apps Script `fetch` calls with Firebase Cloud Functions.

## 📝 Remaining Google Task List Items
- 8 items were postponed to ensure the Backend architecture is in place first.
