# AI-Powered Secure Employee Management System

A secure full-stack web application for employee and product management with **Role-Based Access Control (RBAC)**, **JWT authentication**, and **AI-powered workflow automation** using **n8n**, **Groq AI**, and **Gmail**.

---

## Features

* Secure JWT Authentication
* Role-Based Access Control (Admin, Employee, User)
* Employee CRUD Operations
* Product CRUD Operations
* Password Hashing (bcrypt)
* Input Validation
* Audit Logging
* AI-generated Employee Summary using Groq AI
* Automated Email Reports using n8n and Gmail

---

## Tech Stack

* **Frontend:** Vue.js, Vite
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas
* **Authentication:** JWT
* **Automation:** n8n
* **AI:** Groq AI
* **API Testing:** Postman

---

## Workflow

```text
Webhook
   ↓
Login API
   ↓
Get Employee Data
   ↓
Groq AI Summary
   ↓
Send Report via Gmail
```

---

## Project Structure

```text
secure-crud-app/
├── backend/
├── frontend/
├── docs/
├── postman/
└── README.md
```

---

## Installation

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `backend` folder:

```env
PORT=
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
AI_API_KEY=
CLIENT_URL=
```

---

## API Endpoints

### Authentication

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/me`

### Employees

* `GET /api/employees`
* `POST /api/employees`
* `PUT /api/employees/:id`
* `DELETE /api/employees/:id`

### Products

* `GET /api/products`
* `POST /api/products`
* `PUT /api/products/:id`
* `DELETE /api/products/:id`
