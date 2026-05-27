# PROJECT-STATUS.md — Sage Plant Care System

## Implemented ✅

### Authentication

- Google Sign-In (popup) ✅
- Email + Password ✅
- Phone Number (SMS) ✅
- Forgot Password ✅
- Create Account ✅
- Protected Routes ✅
- RBAC (customer/staff/admin) ✅
- User documents in Firestore ✅
- Unauthorized page ✅
- Sign In page (/signin) ✅
- T&C acceptance at sign-up ✅
- Onboarding — name capture for email/phone users ✅
- Display name editing in Account popup (non-Google users) ✅

### Security

- Firebase App Check with reCAPTCHA Enterprise ✅
- phoneEnforcementState: ENFORCE ✅
- App Check enforced for Authentication ✅
- Debug token configured for local development ✅

### Navigation

- Bottom nav bar (role-aware) ✅
- Hamburger menu with role-aware nav ✅
- Back button ✅
- Scroll to top on route change ✅
- Ask removed from Staff/Admin nav ✅
- Dashboard link for admin ✅
- Account popup + sign out ✅
- Google profile photo ✅
- Nav hidden on /terms and /onboarding ✅

### Scanning & Plants

- Scan page with camera ✅
- OCR via Google Vision ✅
- LLM plant info (Gemini streaming) ✅
- Structured lightLevel from LLM ✅
- AI plant tagging (30+ tags across 9 categories) ✅
- Save plant to space ✅
- Spaces (indoor/outdoor) ✅
- My Spaces page (/spaces) ✅
- Plant profile page (/plant/[spaceId]/[id]) ✅
- Tags displayed on plant profile page ✅
- Delete plant ✅
- Ask about specific plant ✅
- Photo upload with compression ✅
- Move plant to different space (/plant/[spaceId]/[id]/move) ✅
- Plant photos shown in space circles on home page ✅
- PhotoPicker component (camera + photo library) ✅
- Two-phase scan flow — OCR "Hold Still" + LLM "Identifying your plant..." ✅
- Error handling across scan flow (camera, OCR, LLM, save failures) ✅
- Minimum 2 second scan animation ✅

### UI & Design

- Botanical background illustrations (per-page) ✅
- Logo component ✅
- EditIcon component ✅
- Swansons colour tokens + typography system ✅
- ClientLayout with conditional max-width + padding ✅
- Motion entrance animations (home, scan, ask, spaces) ✅
- Button spring animations ✅
- Landing page (/) with botanical background image ✅
- Dashboard moved to /dashboard ✅

### Threads & Expert Chat

- Ask an Expert (/ask) ✅
- Ask without plant association ✅
- Cascading space → plant dropdowns on /ask ✅
- Thread detail (/ask/[threadId]) ✅
- Real-time messaging ✅
- Photo sharing in threads ✅
- Staff inbox (/admin/inbox) ✅
- Desktop split pane + mobile stacked ✅
- Thread status management ✅
- Auto needs-followup on customer reply ✅
- Plant name in staff inbox ✅
- Customer name in staff inbox ✅
- Staff inbox left panel scrolling (Lenis data-lenis-prevent) ✅
- Initial question shown as first message bubble ✅
- Customer messages left / staff messages right ✅
- Thread preview modal from admin dashboard ✅

### Admin Dashboard

- Admin dashboard (/admin/dashboard) ✅
- Thread Queue tab with stat cards ✅
- Filter pills ✅
- Assign/Reassign threads to staff ✅
- Urgent flag toggle ✅
- Send Notifications tab (stubbed) ✅
- Staff Management tab (combined workload + accounts) ✅
- Staff edit modal (role + specialty) ✅
- Add Staff modal (promote customer to staff) ✅
- Admin user management (change roles in app) ✅
- Icon-only sidebar ✅
- Stat cards with coloured bars ✅

### Notifications (FCM)

- Service worker at /firebase-messaging-sw.js ✅
- FCM token saved to Firestore ✅
- NotificationBanner component ✅
- Permission requested via user gesture only ✅
- Staff notified on new thread ✅
- Staff notified on customer reply ✅
- Customer notified on staff reply ✅
- Foreground + background notifications ✅
- Stale token cleanup ✅

### Onboarding Modal

- First-time onboarding modal ✅
- Shows once per user (Firestore flag) ✅
- Preview mode via ?onboarding=preview ✅
- Reset tool on /debug page ✅
- LottieAnimation component ✅

### Infrastructure

- Firebase project: sage-swansons-e4677 ✅
- Firestore database ✅
- Firebase Storage (CORS + rules configured) ✅
- Firebase App Check (reCAPTCHA Enterprise) ✅
- Deployed: sage-ocr-mvp-one.vercel.app ✅
- OCR + Gemini LLM both on sage-swansons-e4677 ✅
- Vertex AI for Gemini (service account, no prepay credits) ✅
- GCP billing alerts configured ✅

### Dev Tools

- Debug page (/debug) — admin only ✅
- Clear display name tool ✅
- Reset onboarding tool ✅
- Clean up my test data tool ✅

---

## Planned

- Add lightLevel + containment fields to Space schema in Firestore + spaces.ts

### High Priority

- QR code → direct URL sign in
- Create standalone space (without scanning a plant)
- Email notifications

### Medium Priority

- Staff profiles in replies
- Internal notes (staff only)
- Canned responses/macros
- Routing rules
- Dashboard/Home (waiting on Shawn's designs)
- Account/Profile page (edit name, view details)
- Account deletion — delete Firebase Auth user + all Firestore data (spaces, plants, threads, user doc) to prevent orphaned data
- Send Notifications — targeted push by plant tags
- Apple Developer account ($99/yr) for iPhone push + Sign in with Apple

### Lower Priority

- Reporting & system health
- Audit log
- Search & Export
- SMS notifications via Twilio
