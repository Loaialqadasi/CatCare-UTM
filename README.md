# 🐾 CatCare UTM | SCRUM-29 & SCRUM-30

# 📊 SCRUM-29 — Public Donation Progress Tracker

![Status](https://img.shields.io/badge/Status-Development-green)
![Impact](https://img.shields.io/badge/Impact-Community-brightgreen)
![UI](https://img.shields.io/badge/UI-Real--Time-orange)

---

## 📖 Overview

The Public Donation Progress Tracker visualizes fundraising progress in real time to encourage community participation and improve transparency. The module dynamically aggregates verified donations and presents them through an engaging progress interface aligned with UTM branding guidelines.

---

## 🚀 Core Features

* Real-time donation progress tracking
* Dynamic percentage-to-goal calculation
* Top 5 verified donors display
* Automatic refresh synchronization
* Achievement badge upon reaching target

---

## 🎨 UI & Visualization

### UTM Brand Colors

* Maroon: `#800000`
* Gold: `#FFD700`

### Display Components

* Animated progress bar
* Donor leaderboard
* Currency-formatted donation totals
* Goal achievement badge

---

## 🛠 Technical Architecture

### Backend Aggregation

* Calculate:

```sql
SUM(amount)
```

* Filter only:

```sql
status = "verified"
```

### Refresh Logic

* 60-second polling interval
* Optional pull-to-refresh synchronization

### Formatting

* Malaysian Ringgit localization:

```text
RM 125.50
```

---

## ✅ Subtasks

* [ ] Verified donation aggregation logic
* [ ] Goal percentage calculation
* [ ] Top donor leaderboard implementation
* [ ] Real-time refresh mechanism
* [ ] Achievement badge state handling

---

## 📌 Assigned Developer

**PIC:** @MohamedAbdelgawwad

---

# 🔒 SCRUM-30 — Security: Privacy & Encryption (TG-1)

![Security](https://img.shields.io/badge/Security-Hardened-blueviolet)
![Compliance](https://img.shields.io/badge/Compliance-UTM%20TG--1-blue)
![Encryption](https://img.shields.io/badge/Encryption-AES256-critical)

---

## 📖 Overview

This module implements TG-1 security compliance requirements for protecting donor and volunteer identities within the CatCare UTM platform. Sensitive identifiers are encrypted before persistence and masked on all public-facing interfaces to prevent unauthorized disclosure of personally identifiable information (PII).

---

## 🛡️ Security Architecture

### Encryption Layer

* AES-256 encryption for:

  * `student_id`
  * `volunteer_id`

### Data Masking

Example:

```text
A21CS0011 → A21******11
```

### Environment Security

* Encryption keys stored securely in:

```bash
.env
```

* Repository protection through:

```bash
.gitignore
```

---

## ⚙️ Advanced Security Logic

### Search Compatibility

To preserve searchable functionality after encryption:

* Hashed search indexing
* OR controlled decrypt-match logic

### Compliance Goals

* Prevent raw ID exposure
* Secure sensitive student data
* Maintain TG-1 policy compliance

---

## ✅ Security Checklist

* [ ] AES encryption utility implemented
* [ ] Masking utility integrated
* [ ] `.env` excluded from repository
* [ ] Encrypted IDs verified in database
* [ ] Search functionality preserved securely

---

## 📌 Assigned Developer

**PIC:** @LoaiRafaat
