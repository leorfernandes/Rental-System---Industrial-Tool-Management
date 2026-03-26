# Rental System - Industrial Tool Management

![Playwright Tests](https://github.com/leorfernandes/Rental-System---Industrial-Tool-Management/actions/workflows/playwright.yml/badge.svg)

**IN PROGRESS - EXPECTED APRIL 2026**

## 📋 Project Overview

This project is a comprehensive rental management system designed for industrial equipment rental businesses. This project serves as a technical showcase for Backend QA Automation and State-Transition Testing. It simulates complex industrial business logic, specifically focusing on the validation of asset lifecycles (Available ↔ Rented ↔ Maintenance) and data integrity across a RESTful architecture.

### Key Features

- **Asset Management**: Create, read, update, and delete industrial tool records
- **Inventory Tracking**: Monitor equipment status (Available, Rented, Maintenance)
- **Category Organization**: Tools organized into categories (Power Tools, Scaffolding, Generators, Lifts, Hand Tools)
- **Rental Rate Management**: Track daily rental rates for each asset
- **Maintenance Tracking**: Record last inspection dates for equipment safety
- **Data Validation**: Comprehensive input validation to ensure data integrity
- **API Testing**: Automated test suite with Jest and Supertest
- **Database Seeding**: Pre-populate database with sample data for testing

## 🧪 Testing & Quality Assurance Strategy
Unlike standard CRUD tests, this suite focuses on Contract Testing and Business Rule Validation:
- **State Transition Validation:** Verified that assets cannot move from 'Available' to 'Maintenance' without passing specific validation checks.
- **Boundary Value Analysis:** Implemented tests for dailyRate to ensure negative values or non-numeric inputs are rejected by the API layer.
- **Negative Testing:** Comprehensive coverage of 400 and 404 error codes to ensure graceful failure and clear system feedback.
- **Automated Regression:** Developed using Jest & Supertest to allow for high-speed verification of backend logic during CI/CD cycles.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **Testing**: Jest & Supertest (backend), Playwright (E2E)
- **Development**: Nodemon for hot reloading
- **Environment Variables**: dotenv for configuration management
- **Security**: CORS enabled for cross-origin requests

## 📁 Project Structure

```
FinalProject/
├── backend/
│   ├── models/
│   │   └── Asset.js           # Mongoose schema for rental assets
│   ├── routes/
│   │   └── assetRoutes.js     # API endpoints for asset operations
│   ├── server.js              # Main application entry point
│   └── seeder.js              # Database seeding utility
├── tests/
│   ├── asset.test.js          # Jest API integration tests
│   └── health.test.js         # Health check endpoint tests
├── e2e/
│   └── rental-flow.spec.js    # Playwright E2E tests
├── package.json               # Project dependencies and scripts
└── .env                       # Environment variables (not tracked)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd FinalProject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   MONGO_USER=your_mongodb_username
   MONGO_PASS=your_mongodb_password
   MONGO_HOST=your_mongodb_host
   MONGO_DB=your_database_name
   MY_PORT=8888
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```
   This will populate your database with sample industrial tools.

5. **Start the server**
   
   For production:
   ```bash
   npm start
   ```
   
   For development (with auto-reload):
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8888` (or your configured port).

## 📡 API Endpoints

### Health Check
- **GET** `/api/health`
  - Returns server status
  - Response: `{ status: 'UP', message: 'Rental System API is alive' }`

### Assets

- **GET** `/api/assets`
  - Retrieve all assets in inventory
  - Response: Array of asset objects

- **POST** `/api/assets`
  - Add a new asset to inventory
  - Request Body:
    ```json
    {
      "name": "Industrial Jackhammer",
      "category": "Power Tools",
      "dailyRate": 85,
      "status": "Available"
    }
    ```
  - Response: Created asset object with `_id`

### Asset Schema

```javascript
{
  name: String (required, trimmed),
  category: String (required, enum),
  dailyRate: Number (required, min: 0),
  status: String (enum: Available|Rented|Maintenance, default: Available),
  lastInspection: Date (default: now),
  timestamps: true (createdAt, updatedAt)
}
```

### Valid Categories
- Power Tools
- Scaffolding
- Generators
- Lifts
- Hand Tools

## 🧪 Testing & Quality Assurance Strategy

This project uses a **Test-Driven Development (TDD)** approach to ensure high-performance reliability for industrial-scale inventory management.

**Run the automated suite:**
```bash
npm test
```
### Key Testing Focus Areas:
- **Business Logic Validation:** Verified complex state transitions (e.g., ensuring an asset cannot move from 'Available' to 'Maintenance' without valid status updates).
- **Boundary Value Analysis (BVA):** Implemented negative testing for dailyRate to prevent zero or negative values from entering the database.
- **Contract Testing:** Used Supertest to validate that API responses strictly match expected JSON schemas and HTTP status codes (200, 201, 400, 404).
- **Security & Auth Testing:** Validated JWT token generation and restricted access to protected asset modification endpoints.
- **Data Integrity:** Used Mongoose schema validation as a 'Shift-Left' strategy to catch data errors before they reach the persistence layer.

## 🔒 Security Features

- **Input Validation**: Mongoose schema validation prevents invalid data
- **CORS**: Cross-Origin Resource Sharing enabled
- **JWT Ready**: Infrastructure for token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Environment Variables**: Sensitive data isolated in `.env` file

## 📦 Sample Seed Data

The seeder includes sample equipment:
- Industrial Jackhammer - $85/day
- Scaffolding Tower (5m) - $45/day
- Heavy Duty Generator - $120/day
- Laser Level Kit - $30/day
- Demolition Saw - $65/day
- Extension Ladder (10m) - $25/day

## 🔧 Development Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run seed` | Seed database with sample data |
| `npm test` | Run Jest backend tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:all` | Run all tests (Jest + Playwright) |

## 🗄️ Database Configuration

The application connects to MongoDB using environment variables for security. Connection string format:
```
mongodb+srv://<username>:<password>@<host>/<database>
```

## 📝 Error Handling

The API includes comprehensive error handling:
- **400**: Bad Request (validation errors)
- **404**: Resource Not Found
- **500**: Internal Server Error

## 🎓 Professional Development Context
Developed as part of a Computer Information Systems (CIS) specialization to master the intersection of Software Development and Quality Engineering. Key focus areas included:

- **Test-Driven Development (TDD):** Writing unit and integration tests alongside feature development.
- **Defect Prevention:** Implementing Mongoose schema validation as a 'Shift-Left' strategy to catch data errors before they reach the database.
- **Security Auditing:** Validating JWT authentication and bcrypt password hashing to ensure API endpoint security.
