# 🐾 CatCare-UTM: Cat Profiles Module  
   
[![Jira Ticket](https://img.shields.io/badge/Jira-SCRUM--12-blue?style=for-the-badge)](https://jira.com)  
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)  
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](#)  
   
## 📖 Overview  
This branch (`SCRUM-12`) introduces the core backend infrastructure for the **Cat Profiles Module**. It implements full **CRUD (Create, Read, Update, Delete)** operations, allowing users to efficiently manage cat data within the CatCare system. Developed by Loai for the UTM project.  
   
## ✨ Features Implemented  
* **Create:** Add new cat profiles with detailed attributes (name, breed, age, health status).  
* **Read:** Fetch a single cat profile by ID or retrieve a paginated list of all cats.  
* **Update:** Modify existing cat profile information.  
* **Delete:** Securely remove a cat profile from the database.  
* **Validation:** Integrated middleware to ensure clean, strictly typed incoming data.  
   
## 🛠️ Tech Stack  
* **Language:** TypeScript  
* **Framework:** Express.js (Node.js)  
* **Database:** SQL  
* **Architecture:** Modular Middleware and Controller pattern  
   
## 🔗 API Endpoints (CRUD)  
   
| HTTP Method | Endpoint               | Description                           |  
|-------------|------------------------|---------------------------------------|  
| `POST`      | `/api/cats`            | Create a new cat profile              |  
| `GET`       | `/api/cats`            | Retrieve all cat profiles             |  
| `GET`       | `/api/cats/:id`        | Retrieve a specific cat profile       |  
| `PUT`       | `/api/cats/:id`        | Update an existing cat profile        |  
| `DELETE`    | `/api/cats/:id`        | Delete a cat profile                  |  
   
## 🚀 Getting Started  
To test this specific module locally:  
1. Ensure you are on the correct branch: `git checkout SCRUM-12`  
2. Install dependencies: `npm install`  
3. Run the development server: `npm run dev`  
   
---  
*Developed with ❤️ for CatCare-UTM*  
