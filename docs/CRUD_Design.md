# Secure CRUD Application – Design Document
## nStore Internship – Phase 2 Deliverable

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                              │
│                                                                  │
│   Vue.js 3 (SPA)                                                │
│   ├── Vue Router (client-side routing + auth guards)            │
│   ├── Axios (HTTP client with JWT interceptors)                 │
│   └── CSS (custom design system)                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/JSON (port 5173 → proxy → 5000)
                      │ Authorization: Bearer <JWT>
┌─────────────────────▼───────────────────────────────────────────┐
│                  EXPRESS API SERVER (Node.js)                    │
│                                                                  │
│   ├── CORS (restricted to CLIENT_URL)                           │
│   ├── Morgan (HTTP request logging)                             │
│   ├── express-validator (input validation)                      │
│   ├── JWT Middleware (authentication)                           │
│   ├── Role Middleware (RBAC authorization)                      │
│   ├── Central Error Handler (OWASP generic errors)             │
│   └── AuditLog (security event logging)                        │
│                                                                  │
│   Routes:                                                        │
│   POST /api/auth/register                                       │
│   POST /api/auth/login                                          │
│   GET  /api/auth/me                                             │
│   GET  /api/employees          [user + admin]                   │
│   POST /api/employees          [user + admin]                   │
│   PUT  /api/employees/:id      [user + admin]                   │
│   DELETE /api/employees/:id    [admin only]                     │
│   POST /api/ai-summary         [user + admin]                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Mongoose ODM
┌─────────────────────▼───────────────────────────────────────────┐
│               MONGODB ATLAS (Cloud Database)                     │
│                                                                  │
│   Collections:                                                   │
│   ├── users      (auth, RBAC)                                   │
│   ├── employees  (core CRUD data, soft-delete)                  │
│   └── auditlogs  (security event trail)                         │
└─────────────────────────────────────────────────────────────────┘
                      │ (optional)
┌─────────────────────▼───────────────────────────────────────────┐
│               AI API (Grok/xAI or Mock)                         │
│                                                                  │
│   POST https://api.x.ai/v1/chat/completions                     │
│   Authorization: Bearer AI_API_KEY (from .env)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Design

### Collection: `users`

```json
{
  "_id": "ObjectId",
  "name": "string (required, max 100)",
  "email": "string (required, unique, lowercase)",
  "password": "string (bcrypt hash, select: false)",
  "role": "enum ['user', 'admin'] (default: user)",
  "isActive": "boolean (default: true)",
  "lastLogin": "Date",
  "loginAttempts": "number (default: 0)",
  "lockUntil": "Date (null if not locked)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Collection: `employees`

```json
{
  "_id": "ObjectId",
  "name": "string (required, max 100)",
  "email": "string (required, unique, lowercase)",
  "department": "enum [Engineering, Marketing, Sales, HR, Finance, Operations, Design]",
  "position": "string (required)",
  "salary": "number (required, min: 0)",
  "phone": "string (optional, validated)",
  "isActive": "boolean (soft delete flag)",
  "createdBy": "ObjectId → ref: User",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Collection: `auditlogs`

```json
{
  "_id": "ObjectId",
  "action": "enum [REGISTER, LOGIN, LOGIN_FAILED, LOGOUT, CREATE_EMPLOYEE, READ_EMPLOYEES, UPDATE_EMPLOYEE, DELETE_EMPLOYEE, AI_SUMMARY, UNAUTHORIZED_ACCESS]",
  "userId": "ObjectId (nullable)",
  "userEmail": "string",
  "resourceId": "string (employee ID if applicable)",
  "ip": "string",
  "userAgent": "string",
  "status": "enum [success, failure]",
  "details": "string",
  "createdAt": "Date"
}
```

---

## 3. API Design

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user profile |

**Register Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@nstore.com",
  "password": "SecurePass1"
}
```

**Login Response:**
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@nstore.com", "role": "user" }
}
```

### Employee CRUD Endpoints

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/employees` | JWT | user/admin | List all (paginated, searchable) |
| GET | `/api/employees/:id` | JWT | user/admin | Get single employee |
| POST | `/api/employees` | JWT | user/admin | Create employee |
| PUT | `/api/employees/:id` | JWT | user/admin | Update employee |
| DELETE | `/api/employees/:id` | JWT | admin only | Soft delete employee |

**GET /api/employees Query Params:**
```
?page=1&limit=10&search=john&department=Engineering&sort=-createdAt
```

**Create Employee Request:**
```json
{
  "name": "John Smith",
  "email": "john.smith@nstore.com",
  "department": "Engineering",
  "position": "Senior Developer",
  "salary": 850000,
  "phone": "+91 98765 43210"
}
```

**Paginated Response:**
```json
{
  "employees": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

### AI Endpoint

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai-summary` | JWT | Generate AI summary for employee |

---

## 4. Security Design Decisions

### Why Soft Delete?
- Hard deletes destroy audit evidence
- Soft delete (`isActive: false`) preserves data for compliance
- AuditLog records who deleted what and when

### Why Account Lockout?
- Prevents brute force attacks
- 5 failed attempts → 15-minute lockout
- Logged in AuditLog for security monitoring

### Why Separate AuditLog Collection?
- Decouples security concerns from business data
- Cannot be modified by regular users
- Queryable for compliance reports

### Why `select: false` on password?
- Mongoose never returns password in queries by default
- Explicit `.select('+password')` required (only in login route)
- Prevents accidental password exposure in GET /api/auth/me

---

## 5. Folder Structure

```
backend/
├── models/
│   ├── User.js          # Auth model with bcrypt pre-save
│   ├── Employee.js      # Core business entity
│   └── AuditLog.js      # Security event log
├── controllers/
│   ├── authController.js      # Register, login, getMe
│   ├── employeeController.js  # Full CRUD
│   └── aiController.js        # Grok/mock AI summary
├── middleware/
│   ├── auth.js          # JWT verify + RBAC
│   ├── validate.js      # express-validator rules
│   └── errorHandler.js  # Central OWASP-compliant error handler
├── routes/
│   ├── auth.js
│   ├── employees.js
│   └── ai.js
├── .env                 # Secrets (gitignored)
├── .env.example         # Template (committed)
└── server.js            # App entry point

frontend/
├── src/
│   ├── assets/main.css       # Design system
│   ├── services/api.js       # Axios + interceptors
│   ├── router/index.js       # Vue Router + auth guards
│   ├── components/
│   │   └── AppNavbar.vue
│   └── views/
│       ├── LoginView.vue
│       ├── RegisterView.vue
│       ├── DashboardView.vue
│       ├── AddEmployeeView.vue
│       └── EditEmployeeView.vue
├── index.html
├── vite.config.js
└── package.json
```

---

*Document prepared as part of nStore 2-Month AI Internship – Phase 2 (Secure CRUD Design)*
