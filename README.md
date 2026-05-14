# 🐾 CatCare UTM | SCRUM-28

## Feature: Admin Approval Dashboard 🛡️

![Status](https://img.shields.io/badge/Status-In%20Review-yellow)
![Access](https://img.shields.io/badge/Access-Admin%20Only-red)
![Security](https://img.shields.io/badge/Auth-JWT%20Protected-success)

---

## 📖 Overview

The Admin Approval Dashboard serves as the verification hub for all incoming donation transactions. This module empowers project administrators to audit uploaded receipts, validate fundraising authenticity, and maintain financial transparency across the CatCare UTM platform.

The dashboard emphasizes security, usability, and operational efficiency through protected access control and real-time frontend updates.

---

## 🚀 Core Features

* Fetch and display all pending donation requests
* Interactive receipt preview modal
* One-click Approve / Reject actions
* Optimistic UI updates without page refresh
* JWT-protected admin routes

---

## 🛠 Technical Architecture

### Frontend

* Scrollable dashboard interface
* Card-based receipt presentation
* Fullscreen receipt preview modal
* Instant frontend state synchronization

### Backend

* Protected API middleware using JWT/session validation
* PATCH-based verification workflow
* Role-based access control:

```js
user.role === "admin"
```

### Database Logic

* Retrieve records where:

```sql
status = "pending"
```

* Update approval state to:

```sql
status = "verified"
```

---

## 🔒 Security Controls

* Restricted admin-only route access
* Token verification for all sensitive endpoints
* Protection against unauthorized API manipulation
* Session validation before state mutations

---

## ✅ Definition of Done (DoD)

* [ ] Only admins can access dashboard routes
* [ ] Approve action updates verification status
* [ ] Reject action archives or removes transaction
* [ ] UI updates instantly without reload
* [ ] Receipt preview modal functions correctly

---

## 📌 Assigned Developer

**PIC:** @LaythAmgad
