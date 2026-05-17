# 🐾 CatCare UTM | SCRUM-29 
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


