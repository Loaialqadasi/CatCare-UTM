# 🔐 CatCare-UTM: Authentication Module

[![Jira Ticket](https://img.shields.io/badge/Jira-SCRUM--11-blue?style=for-the-badge)](https://jira.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)](#)

## 📖 Overview
This branch (`SCRUM-11`) contains the **Authentication and Authorization Module** for the CatCare-UTM project. Developed by Layth, this system ensures that user data is securely managed, utilizing modern encryption and token-based authentication to protect backend resources.

## ✨ Features Implemented
* **User Registration:** Secure account creation with password hashing (bcrypt).
* **User Login:** Authenticate users and generate secure JSON Web Tokens (JWT).
* **Protected Routes:** Custom middlewares to verify tokens and block unauthorized access.
* **Role Management:** Foundation for user vs. admin access control.

## 🛠️ Tech Stack
* **Security:** JSON Web Tokens (JWT), bcrypt
* **Language:** TypeScript
* **Framework:** Express.js (Node.js)

## 🔗 API Endpoints (Auth)

| HTTP Method | Endpoint               | Description                           | Access |
|-------------|------------------------|---------------------------------------|--------|
| `POST`      | `/api/auth/register`   | Register a new user account           | Public |
| `POST`      | `/api/auth/login`      | Authenticate user and return token    | Public |
| `GET`       | `/api/auth/profile`    | Get current logged-in user details    | Private|

## 🚀 Getting Started
1. Checkout the branch: `git checkout SCRUM-11`
2. Ensure you have a `.env` file with a `JWT_SECRET` key.
3. Run the development server: `npm run dev`

---
*Developed with 🔒 for CatCare-UTM*
