# 🐾 CatCare UTM | SCRUM-27

## Feature: Donation Receipt Upload Workflow 💸

![Status](https://img.shields.io/badge/Status-In%20Progress-orange)
![Module](https://img.shields.io/badge/Module-Fundraising-blue)
![Platform](https://img.shields.io/badge/Platform-Flutter-02569B)

---

## 📖 Overview

The Donation Receipt Upload Workflow enables student donors to securely submit proof of payment for fundraising contributions. This module streamlines donation verification while improving transparency, traceability, and user experience within the CatCare UTM ecosystem.

The workflow supports receipt capture through both camera and gallery sources, integrates cloud-based image storage, and ensures secure transaction handling with frontend validation and asynchronous processing.

---

## 🚀 Core Features

* Receipt upload via Camera or Gallery
* Real-time image preview before submission
* Secure cloud image synchronization
* Form validation and numeric sanitization
* Duplicate-submit prevention using loading states
* Automatic redirection to confirmation screen after successful upload

---

## 🛠 Technical Architecture

### Frontend

* Flutter form-based UI implementation
* `image_picker` integration for native device access
* Dynamic image preview rendering
* Circular loading indicator during upload lifecycle

### Backend

* REST API endpoint:

```http
POST /api/donations/upload
```

* Cloud Storage integration for receipt persistence
* Metadata synchronization:

  * `userId`
  * `amount`
  * `timestamp`
  * `imageURL`

### Validation & Safety

* File extension whitelist:

  * `.jpg`
  * `.jpeg`
  * `.png`
* Maximum upload size: `5MB`
* Null safety checks for cancelled image selection
* Input sanitization for amount fields

---

## ✅ Acceptance Criteria

* [ ] User can capture or select a receipt image
* [ ] System validates file type and upload size
* [ ] Image preview is displayed before submission
* [ ] Upload process shows loading feedback
* [ ] Empty or invalid amounts are rejected
* [ ] Unique transaction record is generated
* [ ] User is redirected after successful upload

---

## 📌 Assigned Developer

**PIC:** @YoussefBadr
