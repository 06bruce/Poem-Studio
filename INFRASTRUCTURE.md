# Poem Studio - Infrastructure Design

## 🏗 System Architecture Overview
Poem Studio is a modern full-stack web application built on the **Next.js** framework, leveraging a **Serverless/Monolithic** architecture pattern. It integrates frontend, backend, and database management into a single unified codebase.

---

## 🚀 Core Infrastructure Components

### 1. **Application Framework: Next.js 15 (App Router)**
- **Role:** Handles both UI rendering and API logic.
- **Rendering Strategy:** Utilizes **Server-Side Rendering (SSR)** for SEO-sensitive pages (like user profiles) and **Client-Side Rendering (CSR)** for interactive components (like the Poem Composer).
- **Routing:** File-system based routing via the `app/` directory.

### 2. **Database: MongoDB Atlas**
- **Role:** Primary NoSQL data store.
- **ODM:** **Mongoose** for schema definition and data validation.
- **Connection Management:** Implements a cached connection pattern in `@/lib/mongodb.js` to prevent connection exhaustion in serverless environments.

### 3. **Authentication Layer**
- **Dual-Mechanism Auth:**
    - **Next-Auth (Auth.js v5):** Handles OAuth (Google Login) and session management.
    - **Native JWT:** Custom implementation for traditional Email/Password signup/signin.
- **Security:** Password hashing with `bcryptjs` and secure token storage.

### 4. **Storage & Assets**
- **Static Assets:** Served via Next.js's optimized `public/` directory.
- **Image Generation:** Client-side generation of shareable poem cards using `html2canvas`.

---

## 🛠 Tech Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15+ |
| **Language** | TypeScript / JavaScript (ES6+) |
| **Styling** | Tailwind CSS 4.0 |
| **Database** | MongoDB + Mongoose |
| **Auth** | Next-Auth v5 + JWT |
| **State** | React Context API |
| **Deployment** | Vercel (Optimized for Next.js) |

---

## 🔒 Security Infrastructure
- **Environment Variables:** All sensitive keys (MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID) are managed via `.env` files.
- **API Protection:** Unified middleware/helper `getAuthenticatedUser` to verify sessions/tokens before processing sensitive requests.
- **Validation:** Server-side validation of poem length, title, and ownership.
