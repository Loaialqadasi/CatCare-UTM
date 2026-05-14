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
