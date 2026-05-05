# CatCare-UTM Backend Foundation 🐱

## Overview
This branch (`SCRUM-13-project-mgmt`) contains the foundational backend setup for the **CatCare-UTM** project. It is built using **Node.js** and **TypeScript**, structured to handle routing, database connections, and error management efficiently.

## Core Architecture
* **Language:** TypeScript (`.ts`)
* **Database:** SQL (Scripts provided for schema and seeding)
* **Architecture:** Express.js (indicated by standard middleware patterns)

## Project Structure
- `app.ts` & `server.ts`: Application initialization and server entry points.
- `database.ts` & `env.ts`: Database connection and environment variable management.
- `schema.sql` & `seed.sql`: Database table creation and initial mock data setup.
- `error.middleware.ts` / `not-found.middleware.ts` / `validate.middleware.ts`: Custom Express middlewares for robust API error handling and request validation.
- `logger.ts`: Centralized application logging utility.
- `response.ts`, `errors.ts`, `utils.ts`, `types.ts`: Standardized API responses, custom error classes, shared utilities, and TypeScript interfaces.

## Project Management
- **Scrum Ticket:** SCRUM-13
- **Objective:** Initialize foundational backend codebase and project management structure.
