# 🏗️ CatCare-UTM: Core Backend Foundation

[![Jira Ticket](https://img.shields.io/badge/Jira-SCRUM--13-blue?style=for-the-badge)](https://jira.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](#)

## 📖 Overview
This branch (`SCRUM-13`) establishes the **Core Backend Architecture** for the CatCare-UTM project. Developed by Mohamed, this branch provides the essential plumbing, error handling, and database configurations that all other modules (Auth, Cats, etc.) will build upon.

## ✨ Features Implemented
* **Robust Server Setup:** Clean initialization of the Express application (`app.ts`, `server.ts`).
* **Database Integration:** SQL connection and schema seeding configurations (`database.ts`, `schema.sql`).
* **Global Error Handling:** Custom error classes and centralized middleware to catch and format API errors neatly.
* **Environment Management:** Type-safe environment variable loading (`env.ts`).
* **Logging & Utilities:** Centralized console logging and standardized API response formats.

## 📁 Core Structure Highlight
* `error.middleware.ts` / `not-found.middleware.ts` - Prevents the app from crashing on bad requests.
* `schema.sql` & `seed.sql` - Instantly sets up the database tables for the team.
* `types.ts` - Global TypeScript interfaces for strict type-checking across the team.

## 🚀 Getting Started
1. Checkout the branch: `git checkout SCRUM-13`
2. Run your local SQL database and execute `schema.sql` to build the tables.
3. Install packages with `npm install` and run `npm run dev`.

---
*Developed with ⚙️ for CatCare-UTM*
