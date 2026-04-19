
SMART GYM MANAGEMENT MOBILE APPLICATION

GROUP PROJECT GUIDE


1. PROJECT OVERVIEW

This is our Web and Mobile Technologies group project.

We are building a Smart Gym Management Mobile Application.

Main system modules:

1. User Registration / Login / Payment
2. Membership Management
3. Trainer & Class Management
4. Attendance Monitoring & Notifications
5. Reports & Dashboard
6. Feedback & Complaint Management


--------------------------------------------------
2. TECHNOLOGIES USED
--------------------------------------------------

Frontend:
- React Native
- Expo

Backend:
- Node.js
- Express.js

Database:
- MongoDB

Team Collaboration:
- GitHub
- GitHub Desktop

Editor:
- VS Code


--------------------------------------------------
3. WHY WE USE THESE TECHNOLOGIES
--------------------------------------------------

React Native:
Used to build mobile app screens.

Expo:
Used to make React Native setup easier.
Helps us run the app on a phone using Expo Go.

Node.js:
Used to run backend JavaScript code.

Express.js:
Used to create backend APIs and routes.

MongoDB:
Used to store project data.

GitHub:
Used for teamwork, code sharing, and version control.

GitHub Desktop:
Used for easy pull / push / commit.

VS Code:
Used to write and manage code.


--------------------------------------------------
4. PROJECT ARCHITECTURE
--------------------------------------------------

Frontend Mobile App
(React Native + Expo)

        ↓

Backend Server
(Node.js + Express.js)

        ↓

MongoDB Database


--------------------------------------------------
5. CURRENT PROJECT FOLDER STRUCTURE
--------------------------------------------------

smart-gym-mobile-app/

backend/
frontend/
docs/
README.md


--------------------------------------------------
6. BACKEND STRUCTURE
--------------------------------------------------

backend/

config/
controllers/
middleware/
models/
routes/
utils/
package.json
server.js


Meaning:

config/      = database connection and settings
controllers/ = backend logic
middleware/  = auth / error handling
models/      = MongoDB schemas
routes/      = API route files
utils/       = helper functions
server.js    = backend starting file


--------------------------------------------------
7. FRONTEND STRUCTURE
--------------------------------------------------

frontend/

app/
assets/
components/
constants/
hooks/
package.json
app.json
tsconfig.json


Meaning:

app/         = screens / pages / routes
assets/      = images / icons
components/  = reusable UI components
constants/   = colors / API URLs / values
hooks/       = reusable React logic


IMPORTANT:
Expo created some sample starter files.
Those are NOT our final gym project UI.

We must build our own screens.


--------------------------------------------------
8. WHAT HAS BEEN COMPLETED SO FAR
--------------------------------------------------

Repository Setup:
- GitHub repo created
- Members added
- Base structure pushed

Backend Setup:
- Node.js initialized
- Express installed
- Backend starter working

Frontend Setup:
- Expo project created
- Frontend starter working

Documentation:
- architecture
- database schema
- team modules
- API planning


--------------------------------------------------
9. DATABASE PLAN
--------------------------------------------------

Main collections:

- Users
- Memberships
- Payments
- FitnessClasses
- AttendanceRecords
- Notifications
- Complaints
- Feedback

Users collection will store roles:

- MEMBER
- TRAINER
- ADMIN

Why:
- easier login
- easier auth
- cleaner structure


--------------------------------------------------
10. TEAM MODULES
--------------------------------------------------

Module 1:
Trainer & Class Management

Module 2:
Attendance Monitoring & Notification Management

Module 3:
Reports & Dashboard

Module 4:
Membership Management

Module 5:
Feedback & Complaint Management

Module 6:
User Registration / Login / Payment


--------------------------------------------------
11. WHAT TO DO AFTER PULLING PROJECT
--------------------------------------------------

STEP 1:
Pull latest code from GitHub.

STEP 2:
Open project in VS Code.

STEP 3:
Install backend packages:

cd backend
npm install

STEP 4:
Install frontend packages:

cd frontend
npm install

STEP 5:
Run backend:

npm run dev

STEP 6:
Run frontend:

npm start

STEP 7:
Read this guide and understand your module.

STEP 8:
Start coding only your assigned part first.


--------------------------------------------------
12. WHAT EACH MEMBER SHOULD WORK ON
--------------------------------------------------

Frontend work:
- screens
- forms
- UI
- buttons
- API calling

Backend work:
- models
- routes
- controllers
- database logic

Most members may do both frontend + backend for their module.


--------------------------------------------------
13. IMPORTANT TEAM RULES
--------------------------------------------------

MUST DO:

1. Pull latest code before starting work
2. Test code before pushing
3. Use clear commit messages
4. Inform team before changing shared files
5. Push regularly after stable work

MUST NOT DO:

1. Do not delete shared files
2. Do not rename folders randomly
3. Do not push broken code knowingly
4. Do not edit another member’s files unnecessarily
5. Do not commit node_modules
6. Do not commit .env


--------------------------------------------------
14. API RULES (VERY IMPORTANT)
--------------------------------------------------

Since all modules use one backend, everyone must follow the same API rules.

1. Use module-based route names

Good examples:

/api/auth/login
/api/auth/register
/api/payments/submit
/api/memberships/activate
/api/complaints/create

Bad examples:

/api/test
/api/new
/api/doSomething

--------------------------------------------------

2. Use correct HTTP methods

GET    = Read data
POST   = Create data
PUT    = Full update
PATCH  = Partial update
DELETE = Remove data

Examples:

GET /api/users/profile
POST /api/auth/login
PUT /api/users/profile
DELETE /api/complaints/12

--------------------------------------------------

3. Use lowercase URLs only

Correct:

/api/auth/login

Wrong:

/API/Auth/Login

--------------------------------------------------

4. Use one route file per module

Examples:

routes/authRoutes.js
routes/paymentRoutes.js
routes/membershipRoutes.js
routes/complaintRoutes.js

--------------------------------------------------

5. Use same response format

Success:

{
 success: true,
 message: "Success",
 data: ...
}

Error:

{
 success: false,
 message: "Invalid request"
}

--------------------------------------------------

6. Use IDs in URL when needed

Examples:

GET /api/users/123
DELETE /api/complaints/456

--------------------------------------------------

7. Protect private APIs

Examples:

/api/profile
/api/payments/history
/api/reports

Need login/auth token.

--------------------------------------------------

8. Public APIs

Examples:

/api/auth/login
/api/auth/register

--------------------------------------------------

9. Do not duplicate APIs

Only one member should handle each module route set.

Example:

Auth member owns:
/api/auth/*

Membership member owns:
/api/memberships/*

Complaint member owns:
/api/complaints/*

--------------------------------------------------

10. Update API docs if adding new routes

Always update:

docs/api-endpoints.md


--------------------------------------------------
15. MERGE RULES
--------------------------------------------------

Before pushing:

1. Pull latest code
2. Check conflicts
3. Test your part
4. Commit clearly
5. Push

If two members edit same file:
Talk first to avoid merge conflicts.


--------------------------------------------------
16. GOOD COMMIT MESSAGE EXAMPLES
--------------------------------------------------

Good:

- Added login screen UI
- Created payment routes
- Added membership model
- Updated complaint screen

Bad:

- update
- changes
- done
- final


--------------------------------------------------
17. RECOMMENDED NEXT STEPS
--------------------------------------------------

1. Everyone pull latest repo
2. Make sure project runs on all laptops
3. Connect MongoDB
4. Build authentication first
5. Build module APIs
6. Build frontend screens
7. Integrate gradually
8. Test regularly


--------------------------------------------------
18. FINAL REMINDER
--------------------------------------------------

Everyone must work from this same shared repository.

Do not create separate unrelated project folders.

Always coordinate changes with the team.

