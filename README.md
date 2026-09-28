# EduManage — School Management System

Frontend-only school ERP/internship project built with HTML5, CSS3 and vanilla JavaScript.

## Included modules
- Dashboard with statistics, quick actions, recent students, fee collection and attendance overview
- Student Management CRUD, profiles, photos/initials, attendance/grade/fee summaries
- Teacher Management CRUD and profiles
- Class & Section Management with teacher assignment and capacity checks
- Attendance with date/class/section filters, bulk marking, history and local persistence
- Grade Management with automatic A+/A/B+/B/C/F calculation, reports and filters
- Fee Management with fee types, paid/pending state, payment history and mark-paid action
- Timetable with add/edit/delete and duplicate-slot protection
- Login/Register with Admin, Teacher and Parent demo roles
- Role-based navigation
- Dark mode with persisted theme
- Reports & CSV export plus print-to-PDF browser workflow
- Exam Schedule
- Parent Communication log
- Responsive desktop/tablet/mobile UI
- localStorage/sessionStorage persistence with a local-file fallback bridge for authentication

## Demo accounts
- Admin: admin@school.com / admin123
- Teacher: teacher@school.com / teacher123
- Parent: parent@school.com / parent123

## Run
Open `login.html` first. Register a new account or use a demo account.

This authentication is intentionally frontend-only for an internship/demo submission. It is not production-grade authentication because credentials are stored locally in the browser.

## Deployment
The project can be deployed as a static site on GitHub Pages, Netlify or Vercel. Set `login.html` as the entry page or link it from the deployed site.


## Phase 7 Bonus Features
- Exam schedule management
- Parent communication log
- Printable fee receipts
- Local student photo manager
- Notifications generated from fees, exams and attendance


## Phase 8 — Final UI Polish
- Consistent responsive layout across dashboard and all modules
- Improved mobile sidebar overlay and navigation behavior
- Dark/light theme readability refinements
- Accessible keyboard focus and Escape-to-close behavior
- Refined modal, button, table, empty-state and profile styling
- Reduced-motion support and print-friendly application styling
