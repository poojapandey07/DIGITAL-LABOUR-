# 🏛️ Digital Labor Chowk (डिजिटल लेबर चौक)
### Worker–Employer Job Portal (दैनिक रोजगार एवं श्रम शक्ति मंच)

A responsive, mobile-first web application connecting daily-wage workers (*mazdoors*, masons, electricians, plumbers, carpenters, painters, welders) directly with contractors, builders, and household employers. Inspired by India's Ministry of Labour & Employment **"Digital Labor Chowk"** initiative to eliminate middleman exploitation, provide fair daily wages, and bring dignity to daily-wage work.

---

## 🌟 Key Features

1. **🇮🇳 Authentic Government Portal Design**:
   - Indian tricolor decorative touch (`#ff9933`, `#ffffff`, `#138808`), trustworthy deep navy blue (`#0b2545`), and saffron accent (`#f7941d`).
   - Bilingual typography (Hindi & English) for effortless comprehension across labor and employer demographics.

2. **📱 Mobile-First Accessibility & PWA (Installable Web App)**:
   - **Progressive Web App (PWA)**: Includes `manifest.json` and a Service Worker (`sw.js`) enabling users to install the app directly to Android & iOS home screens.
   - **Slide-Out Hamburger Drawer**: High-touch mobile menu (`☰`) with quick navigation, profile badge, direct helpline shortcut (`📞 14434`), and PWA install button.
   - **Touch-Friendly Bottom Navigation**: Persistent bottom bar for one-thumb reach with safe-area insets (`env(safe-area-inset-bottom)`) for modern notched phones.
   - **Mobile Cards (Dual-View)**: Automatically transforms wide desktop data tables into swipeable touch cards on small screens.
   - **Mobile Bottom-Sheet Modals**: Dialogs smoothly slide up from the bottom of phone screens with touch drag handles.

3. **⚡ Zero-Config Demo Experience & Mock Database**:
   - Powered purely by **client-side `localStorage`** (no backend/server setup required).
   - Automatically pre-seeded with realistic Indian labor market data (trades, cities, wages in ₹/day, sample applicants, and postings).
   - **1-Click Quick Demo Login buttons** on both login pages for immediate end-to-end evaluation.
   - Built-in **"🔄 Reset Demo Data"** action in the footer to restore seed state anytime.

4. **👷 Worker Portal**:
   - **Tabbed Login/Signup** with phone validation, trade selection, and wage expectations.
   - **Dashboard**:
     - Status metric cards (Applications Sent, Matching Jobs, Profile Score).
     - Recommended jobs feed scored against the worker's trade and city.
     - Application tracking table with live status badges (`Applied`, `Viewed`, `Shortlisted`, `Selected`).
   - **Profile Manager**:
     - Dynamic profile completion progress gauge (0–100%).
     - Multi-trade skill chips/tags selection.
     - Availability switch (*Available Now* vs. *Busy*).

5. **🏢 Employer Portal**:
   - Dedicated login/signup for builders, contractors, and household employers.
   - **Post a Job Wizard**: Title, Trade category, Location, Site landmark, Daily wage (₹), Workers needed, and Duration.
   - **Active Postings Manager**: View live postings, toggle status (*Active* / *Closed*), or delete postings.
   - **Applicant Inspector Modal**: View worker applicants, see their phone number and trade experience, update candidate status (*Shortlist*, *Select*), and initiate direct telephone contact.

6. **🔎 Job Search & Multi-Criteria Filtering**:
   - Real-time keyword search across title, description, trade, and employer.
   - Filters: Trade/Category, City/Location, Duration (1-day, Multi-day, Ongoing), and interactive Daily Wage slider.
   - Sort by Newest first, Wage (High to Low), or Wage (Low to High).

7. **🔔 Non-Intrusive Toast Notification System**:
   - Stackable, auto-dismissing notifications for actions (applications, logins, errors, job postings).

---

## 📂 Project Structure

```
digital-labor-chowk/
├── index.html                  # Landing page (Hero, stats, how it works, highlights)
├── manifest.json               # Web App Manifest for mobile home screen installation
├── sw.js                       # Service Worker for offline shell caching
├── pages/
│   ├── worker-login.html       # Worker sign in, registration & quick demo login
│   ├── employer-login.html     # Employer sign in, registration & quick demo login
│   ├── worker-dashboard.html   # Worker metrics, matching jobs & application tracker
│   ├── post-job.html           # Employer job posting form, active jobs & applicant viewer
│   ├── worker-profile.html     # Worker editable profile, multi-skills & progress gauge
│   └── job-search.html         # Job search with category, city, wage slider & sort
├── css/
│   ├── style.css               # Design tokens, color palette, resets, header/footer
│   ├── components.css          # Cards, buttons, inputs, badges, modals, toasts, progress
│   └── responsive.css          # Mobile-first breakpoints & mobile bottom navigation
├── js/
│   ├── storage.js              # LocalStorage DB simulation layer & realistic seed data
│   ├── auth.js                 # Authentication, role validation, session guards & logout
│   ├── jobs.js                 # Job CRUD, search & filter engine, application tracking
│   ├── toast.js                # Accessible toast notification utility
│   └── main.js                 # Global UI orchestration, header sync & card renderers
├── README.md                   # Comprehensive project documentation
├── .gitignore                  # Standard web ignores
└── LICENSE                     # MIT License
```

---

## 🚀 How to Run Locally

Because this project is built entirely with **pure HTML5, CSS3, and vanilla JavaScript**, there is **no build step, no npm install, and no backend needed**!

### Option 1: Open Directly in Browser
Simply double-click `index.html` or drag and drop it into Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option 2: Using VS Code Live Server
1. Open the project folder in **VS Code**.
2. Right-click on `index.html` and choose **"Open with Live Server"**.
3. The app will open at `http://127.0.0.1:5500/index.html`.

### Option 3: Using Python HTTP Server
Open your terminal inside the project directory and run:
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

### Option 4: Using Node.js `npx serve`
```bash
npx serve .
```

---

## 🔑 Demo Accounts & Credentials

The application comes pre-loaded with realistic demo data so you can test all features immediately:

| Persona | Name | Mobile Number | Password | Trade / Type |
|---|---|---|---|---|
| **Worker (श्रमिक)** | Ramesh Kumar (रमेश कुमार) | `9876543210` | `password123` | Mason / राजमिस्त्री (Delhi) |
| **Worker (श्रमिक)** | Sunita Devi (सुनीता देवी) | `9811223344` | `password123` | Painter / पेंटर (Noida) |
| **Employer (नियोक्ता)** | Sharma Construction Co. | `9899001122` | `password123` | Construction (Delhi) |
| **Employer (नियोक्ता)** | Metro Home Renovations | `9812345678` | `password123` | Household / Repairs (Gurugram) |

> 💡 **Tip:** Both login pages feature a prominent **"⚡ Quick Demo Login"** button that logs into these accounts with one click without having to type phone numbers or passwords.

---

## 📊 LocalStorage Data Model

The simulated database uses the following keys:

- `dlc_users`: Array of worker and employer accounts:
  ```json
  [
    {
      "id": "worker-101",
      "role": "worker",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "password": "password123",
      "primarySkill": "Mason / राजमिस्त्री",
      "skills": ["Mason / राजमिस्त्री", "Tile & Marble Worker / टाइल कारीगर"],
      "location": "New Delhi / नई दिल्ली",
      "experience": "7",
      "dailyWage": 850,
      "bio": "Experienced mason with 7 years of brickwork...",
      "availability": "available"
    }
  ]
  ```
- `dlc_jobs`: Array of job listings posted by employers.
- `dlc_applications`: Array of applications submitted by workers.
- `dlc_current_session`: Active login session `{ userId, role, name, phone }`.

---

## 🔮 Future Enhancements & Stretch Goals

- **Complete Hindi / English Full Toggle**: Global i18n dictionary switcher.
- **Dark Mode**: High-contrast dark theme for night-time battery saving on OLED mobile screens.
- **Export to CSV**: Enable employers to export applicant lists to Excel/CSV for offline attendance.
- **PWA (Progressive Web App)**: Add `manifest.json` and a service worker for offline kiosk and homescreen installation.
- **Voice Search (आवाज़ से खोजें)**: Speech-to-text integration for workers with limited literacy.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
#   D I G I T A L - L A B O U R -  
 #   D I G I T A L - L A B O U R -  
 