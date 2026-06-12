A simple todo app using nextjs and supabase# Anania's Todo Workspace

A highly responsive, terminal-inspired task tracking workspace built with Next.js 15, React, and Supabase. This project transitions away from traditional heavyweight state managers by leveraging Next.js URL state synchronization alongside Optimistic UI updates to deliver instantaneous database mutations.

## 🛠️ Tech Stack & Architecture

* **Framework:** Next.js 15 (App Router, Server Actions)
* **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
* **State & Mutations:** React `useOptimistic` + Next.js URL SearchParams
* **Styling:** Tailwind CSS (Dark Mode optimization)
* **Icons:** Lucide React

---

## ⚡ Key Technical Challenges & Implementations

### 1. Eliminating Content Flashing via SearchParams Gatekeeping
A common architectural issue with hybrid Server/Client authentication is the visual "flash" of restricted content before the client-side session listener validates the user state. 

To solve this, this application catches authorization tokens inside the Next.js `searchParams` object immediately at the server layer during a redirect. By validating the presence of the authentication success flag before rendering the main view tree, the app completely bypasses the login screen layout without adding client-side processing bottlenecks.

### 2. URL State Pollution & Sync Maintenance
When tracking different dashboard panels (Active vs. Completed rows) using URL query parameters (`/?view=completed`), changing tabs natively overrides existing parameters, which drops the session tracking flag. 

This was resolved by building an inline URL parameter persistence mechanism into the navigation components:

```typescript
href={`/?view=completed${isAuthSuccess ? '&auth=success' : ''}`}