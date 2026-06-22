# OWASP Secure Coding Notes
## nStore Internship – Phase 1 Deliverable

---

## 1. Introduction

The **OWASP (Open Web Application Security Project)** provides open-source, vendor-neutral security resources. Two primary references guide our work:

- **OWASP Developer Guide** – Developer-centric secure development practices
- **OWASP Secure Coding Practices Quick Reference** – Actionable checklist per category
- **OWASP Top 10** – The 10 most critical web application security risks

---

## 2. Authentication

### Why It Matters
Authentication is the gatekeeper. A weak auth system allows attackers to impersonate users, escalate privileges, or bypass access controls entirely.

### Secure Practices
| Topic | Weak (Bad) | Secure (Good) |
|---|---|---|
| Password storage | `password: "user123"` (plain text) | `bcrypt.hash(password, 12)` |
| Error messages | "User not found" / "Wrong password" | "Invalid email or password" (same message both) |
| Session tokens | UUID stored in DB | Signed JWT with expiry |
| Brute force | No limit | Lockout after 5 failed attempts |

### Implementation in This Project
```js
// bcrypt hashing on save (User model)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});
```

### Strong Password Rules
- Minimum 8 characters
- Must contain uppercase, lowercase, digit
- Validated on both client (frontend) and server (express-validator)

---

## 3. Authorization & RBAC

### Principle of Least Privilege
Every user should have the **minimum access** required to perform their tasks.

### Role Matrix

| Action | `user` | `admin` |
|---|---|---|
| View employees | ✅ | ✅ |
| Create employee | ✅ | ✅ |
| Edit employee | ✅ | ✅ |
| Delete employee | ❌ | ✅ |
| View audit logs | ❌ | ✅ |

### Implementation
```js
// Role middleware – only admin can delete
router.delete('/:id', protect, authorize('admin'), deleteEmployee);
```

---

## 4. Input Validation

### Why It Matters
Unvalidated input is the root cause of SQL Injection, XSS, Command Injection, and many OWASP Top 10 attacks.

### Attack Example
```html
<!-- Attacker submits this as a name field -->
name = <script>document.cookie='stolen='+document.cookie</script>
```

### Defense Strategy
- **Whitelist** allowed characters/formats (not just blacklist bad ones)
- Validate **server-side** even if client validates (never trust the client)
- Use a validation library: `express-validator` in this project

```js
body('email').trim().isEmail().normalizeEmail()
body('salary').isFloat({ min: 0 })
body('department').isIn(['Engineering', 'Marketing', ...])
```

---

## 5. Secrets Management

### OWASP Rule: Never commit secrets to Git

| Bad Practice | Good Practice |
|---|---|
| `JWT_SECRET=abc123` in code | `JWT_SECRET=...` in `.env` |
| API key hardcoded | Loaded from `process.env.AI_API_KEY` |
| `.env` committed to Git | `.env` in `.gitignore`, `.env.example` committed |
| Password in connection string in code | `MONGO_URI` in environment |

### `.gitignore` entries (mandatory)
```
.env
node_modules/
*.log
```

---

## 6. Error Handling

### OWASP: Do not expose internal details in error responses

| Bad (Leaks info) | Good (Generic) |
|---|---|
| `"MongoServerError: E11000 duplicate key error collection: nstore.users"` | `"An account with this email already exists."` |
| `"JsonWebTokenError: invalid signature at ..."` | `"Access denied. Invalid token."` |
| Stack traces in API responses | `"Something went wrong."` |
| Database field names | `"Validation failed."` |

### Central Error Handler Pattern
```js
// errorHandler.js – logs real error server-side, sends generic to client
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err); // Real error – server logs only
  res.status(err.statusCode || 500).json({ message: 'Something went wrong.' });
};
```

---

## 7. Logging & Audit Trail

### What to Log (OWASP Recommendation)
| Event | Why |
|---|---|
| Login success | Track who accessed the system |
| Login failure | Detect brute force attempts |
| Delete operations | Accountability for destructive actions |
| Role-based access violations | Detect privilege escalation attempts |
| AI API calls | Monitor for prompt injection abuse |

### What NOT to Log
- Passwords (even hashed)
- Full JWT tokens
- Credit card numbers
- Full API keys

### Log Schema (AuditLog model)
```js
{
  action: 'LOGIN_FAILED',
  userEmail: 'attacker@evil.com',
  ip: '192.168.1.1',
  status: 'failure',
  details: 'Failed attempt 3',
  createdAt: ISODate
}
```

---

## 8. OWASP Top 10 – Mapping to This Project

| # | Risk | Our Mitigation |
|---|---|---|
| A01 | Broken Access Control | RBAC middleware, role checks on delete |
| A02 | Cryptographic Failures | bcrypt for passwords, JWT for sessions |
| A03 | Injection | express-validator, no raw SQL, Mongoose |
| A04 | Insecure Design | Documented threat model, RBAC matrix |
| A05 | Security Misconfiguration | .env secrets, CORS restricted to client URL |
| A06 | Vulnerable Components | npm audit, pin dependency versions |
| A07 | Auth Failures | Account lockout, same error messages |
| A08 | Integrity Failures | JWT signed with secret, content-type validation |
| A09 | Security Logging Failures | AuditLog model captures all key events |
| A10 | SSRF | AI API URL from env only, no user-supplied URLs |

---

## 9. nStore Use Cases

1. **Customer registration** → password hashing + email validation
2. **Product search API** → input validation to prevent injection
3. **Order deletion** → admin-only RBAC
4. **HR salary data** → access control + audit logs
5. **AI chatbot** → prompt injection prevention, PII masking

---

## 10. Key Takeaways

1. **Validate on both client AND server** – client validation is UX, server validation is security
2. **Hash, never encrypt passwords** – bcrypt is one-way; if DB is breached, passwords are not exposed
3. **Same error messages for auth failures** – don't help attackers enumerate valid users
4. **Least privilege RBAC** – grant only what's needed
5. **Secrets in environment variables** – never in code or Git
6. **Generic errors to client, full errors to server logs**

---

*Document prepared as part of nStore 2-Month AI Internship – Phase 1 (OWASP Secure Coding)*
