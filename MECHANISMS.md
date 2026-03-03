# Poem Studio - Mechanism & Data Flow

## 🔄 Core Mechanisms

### 1. **Unified Authentication Flow**
The system uniquely combines two authentication methods into a single `getAuthenticatedUser` utility:
- **Flow A (Social):** User signs in via Google -> Next-Auth handles OAuth -> Callback creates/syncs user in MongoDB -> Session cookie is set.
- **Flow B (Native):** User signs up with Email/Pass -> Password hashed with `bcryptjs` -> User saved in MongoDB -> JWT generated and returned -> Client stores JWT in `localStorage`.
- **Validation:** Every protected API route calls `getAuthenticatedUser(req)` which checks both the session cookie (Next-Auth) and the `Authorization` header (JWT).

### 2. **Poem Lifecycle & Enforcement**
- **Creation:** Users can create poems with themes, moods, and co-authors.
- **The "10-Minute Window" Rule:**
    - A critical business logic mechanism enforced in `api/poems/[id]/route.js`.
    - Edit requests are rejected if `(Date.now() - poem.createdAt) > 10 * 60 * 1000`.
- **Streak System:** 
    - Automatically triggered upon poem creation.
    - Increments `currentStreak` if written on consecutive days; resets if a day is missed.
    - Updates `longestStreak` if the current one exceeds it.

### 3. **Dynamic UI & Effects**
- **Weather System:** A `WeatherEffect` component that renders animations (snow, rain, etc.) based on the user's current "mood" or manual toggle.
- **Glassmorphism:** A consistent UI design pattern using Tailwind's `backdrop-blur` and semi-transparent backgrounds to create a modern, layered look.

---

## 📊 Data Flow Diagrams

### **A. Poem Creation Flow**
1. **Client:** User submits poem via `ComposeModal`.
2. **Server (API):** `POST /api/poems` receives request.
3. **Auth Check:** `getAuthenticatedUser` verifies the user.
4. **Validation:** Check title/content length.
5. **DB Write:** Save poem to MongoDB.
6. **Side Effect:** Update User's streak and total poem count.
7. **Response:** Return populated poem object to UI.

### **B. Social & Discovery Flow**
1. **Discovery:** `PoemList` fetches poems via `GET /api/poems` with cursor-based pagination.
2. **User Search:** Real-time search against the `User` collection via regex/index.
3. **Trending:** `TrendingUsers` computes most active/followed users based on recent activity.

---

## 📂 Data Models (Schemas)

### **User Model**
- `username`, `email`, `password` (optional for OAuth).
- `avatar`, `bio`.
- `currentStreak`, `longestStreak`, `totalPoems`.
- `lastWrittenAt`.

### **Poem Model**
- `title`, `content`.
- `author` (Ref: User).
- `coAuthors` (Array of Ref: User).
- `likes` (Array of Ref: User).
- `theme`, `mood`.
- `promptTag`.
