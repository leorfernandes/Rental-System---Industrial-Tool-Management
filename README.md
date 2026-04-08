# Rental System - Industrial Tool Management

![Jest Tests](https://github.com/leorfernandes/Rental-System---Industrial-Tool-Management/actions/workflows/jest.yml/badge.svg)
![Playwright Tests](https://github.com/leorfernandes/Rental-System---Industrial-Tool-Management/actions/workflows/playwright.yml/badge.svg)

**IN PROGRESS - EXPECTED APRIL 2026**

## 📋 Project Overview

This project is a comprehensive rental management system designed for industrial equipment rental businesses. This project serves as a technical showcase for Backend QA Automation and State-Transition Testing. It simulates complex industrial business logic, specifically focusing on the validation of asset lifecycles (Available ↔ Rented ↔ Maintenance) and data integrity across a RESTful architecture.

### Key Features

- **Asset Management**: Create, read, update, and delete industrial tool records
- **Inventory Tracking**: Monitor equipment status (Available, Rented, Maintenance)
- **User Authentication**: JWT-based login/register with role-based access (admin/staff)
- **Rental Transaction Management**: Create rentals, calculate costs, and process returns
- **Category Organization**: Tools organized into categories (Power Tools, Scaffolding, Generators, Lifts, Hand Tools)
- **Maintenance Tracking**: Record last inspection dates for equipment safety
- **Data Validation**: Comprehensive input validation to ensure data integrity
- **API Testing**: Automated test suite with Jest and Supertest
- **E2E Testing**: Playwright tests for complete user workflows
- **CI/CD Pipeline**: GitHub Actions with automated testing

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
│   │   ├── Asset.js           # Asset schema
│   │   ├── Rental.js          # Rental transaction schema
│   │   └── User.js            # User authentication schema
│   ├── routes/
│   │   ├── assetRoutes.js     # Asset CRUD endpoints
│   │   ├── authRoutes.js      # Login/register endpoints
│   │   └── rentalRoutes.js    # Rental transaction endpoints
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── server.js              # Main application entry point
│   ├── connectToDatabase.js   # MongoDB connection handler
│   ├── seeder.js              # Asset seeding utility
│   └── seedUser.js            # User seeding utility
├── tests/
│   ├── asset.test.js          # Jest API integration tests
│   └── health.test.js         # Health check endpoint tests
├── e2e/
│   └── rental-flow.spec.js    # Playwright E2E tests
├── .github/workflows/
│   ├── jest.yml               # Jest CI workflow
│   └── playwright.yml         # Playwright E2E CI workflow
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
   JWT_SECRET=your_secret_key_here
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```
   This will create an admin user and populate your database with sample industrial tools.

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
- **GET** `/api/health` - Server status check

### Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login and receive JWT token

### Assets
- **GET** `/api/assets` - Retrieve all assets
- **POST** `/api/assets` - Create new asset
- **PUT** `/api/assets/:id` - Update asset
- **DELETE** `/api/assets/:id` - Delete asset

### Rentals
- **POST** `/api/rentals` - Create new rental (calculates cost automatically)
- **PUT** `/api/rentals/:id/return` - Process return (requires auth)

## 🔒 Security Features

- **JWT Authentication**: Token-based authentication for protected routes
- **Password Hashing**: bcryptjs with salting for secure password storage
- **Role-Based Access**: Admin and staff roles with middleware protection
- **Input Validation**: Mongoose schema validation prevents invalid data
- **CORS**: Cross-Origin Resource Sharing enabled
- **Environment Variables**: Sensitive data isolated in `.env` file

## 📦 Sample Seed Data

**Users:**
- Admin user (username: `admin`, password: `password123`)

**Assets:**
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

## 🚀 Future Improvements / Technical Debt

To ensure the project was delivered on time while prioritizing robust backend logic and testing, some technical trade-offs were made. The following improvements are planned for future iterations:

- **Frontend Refactoring:** The frontend logic is currently housed in a single `script.js` file (~50KB) to expedite initial development. A planned update involves refactoring this into modular ES6 files (e.g., `api.js`, `ui.js`, `utils.js`) for better separation of concerns and maintainability.
- **Complete Test Coverage:**
  - Expanding **Jest API integration tests** to cover edge cases for all CRUD operations.
  - Finalizing **Playwright E2E tests** to simulate complete, end-to-end user workflows (e.g., logging in, renting a tool, and processing a return) across different browser environments.
