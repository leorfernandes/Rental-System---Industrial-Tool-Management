# Test Cases: Rental Management System

## Test Case Form
-
- **TC ID:** Unique identifier
- **Feature:** Feature being tested
- **Priority:** Critical / High / Medium / Low
- **Preconditions:** Setup required before test
- **Test Steps:** Step-by-step execution
- **Expected Result:** What should happen
- **Actual Result:** What actually happened (filled during execution)
- **Status:** Pass / Fail / Blocked

---

## Authentication

---

### TC-001: Successful Login with Valid Credentials

- **TC ID:** TC-001
- **Feature:** Authentication
- **Priority:** Critical
- **Preconditions:** A user with email `jestauth@test.com` and password `password123` exists in the database.
- **Test Steps:**
  1. Send a `POST` request to `/api/auth/login` with body `{ email: "jestauth@test.com", password: "password123" }`.
- **Expected Result:** Response status is `200`. Body contains a `token` property. `user.email` equals `jestauth@test.com`.
- **Actual Result:** Response status was `200`. Body contained a valid JWT token. `user.email` matched.
- **Status:** Pass

---

### TC-002: Failed Login with Wrong Password

- **TC ID:** TC-002
- **Feature:** Authentication
- **Priority:** Critical
- **Preconditions:** A user with email `jestauth@test.com` exists in the database.
- **Test Steps:**
  1. Send a `POST` request to `/api/auth/login` with body `{ email: "jestauth@test.com", password: "wrongpassword" }`.
- **Expected Result:** Response status is `400`. Body message equals `"Invalid Credentials"`.
- **Actual Result:** Response status was `400`. Body message was `"Invalid Credentials"`.
- **Status:** Pass

---

## Asset Management

---

### TC-003: Create New Asset

- **TC ID:** TC-003
- **Feature:** Asset Management
- **Priority:** Critical
- **Preconditions:** Authenticated admin token is available. No asset named `"Test Tool"` exists in the database.
- **Test Steps:**
  1. Send a `POST` request to `/api/assets` with header `x-auth-token: <adminToken>` and body `{ name: "Test Tool", category: "Scaffolding", dailyRate: 45.00, status: "Available" }`.
- **Expected Result:** Response status is `201`. Body contains `name: "Test Tool"` and an `_id` field.
- **Actual Result:** Response status was `201`. Asset was created with the correct name and a new `_id`.
- **Status:** Pass

---

### TC-004: Retrieve Asset Inventory

- **TC ID:** TC-004
- **Feature:** Asset Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. Asset `"Test Tool"` was created in TC-003.
- **Test Steps:**
  1. Send a `GET` request to `/api/assets` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body is an array. The array contains the asset created in TC-003 with name `"Test Tool"`.
- **Actual Result:** Response status was `200`. Array was returned, and `"Test Tool"` was found in the list.
- **Status:** Pass

---

### TC-005: Update Asset Details

- **TC ID:** TC-005
- **Feature:** Asset Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. Asset `"Test Tool"` was created in TC-003 and its `_id` is stored.
- **Test Steps:**
  1. Send a `PUT` request to `/api/assets/:id` with header `x-auth-token: <adminToken>` and body `{ dailyRate: 55.00, status: "Maintenance" }`.
- **Expected Result:** Response status is `200`. Body shows `dailyRate: 55.00` and `status: "Maintenance"`.
- **Actual Result:** Response status was `200`. Updated fields were correctly reflected.
- **Status:** Pass

---

### TC-006: Clear Maintenance and Update Inspection Date

- **TC ID:** TC-006
- **Feature:** Asset Management — Maintenance Workflow
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. An asset in `"Maintenance"` status exists.
- **Test Steps:**
  1. Create an asset with `status: "Maintenance"` directly in the database.
  2. Send a `PUT` request to `/api/assets/clear-maintenance/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. `asset.status` becomes `"Available"`. `asset.lastInspection` is set to a timestamp within the last 60 seconds.
- **Actual Result:** Response status was `200`. Status updated to `"Available"` and `lastInspection` timestamp was recent.
- **Status:** Pass

---

### TC-007: Fail to Clear Maintenance on Already Available Asset

- **TC ID:** TC-007
- **Feature:** Asset Management — Maintenance Workflow
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. An asset with `status: "Available"` exists.
- **Test Steps:**
  1. Create an asset with `status: "Available"` directly in the database.
  2. Send a `PUT` request to `/api/assets/clear-maintenance/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `400`. Body message equals `"Asset is not in maintenance"`.
- **Actual Result:** Response status was `400`. Correct error message was returned.
- **Status:** Pass

---

### TC-008: Block Deletion of a Rented Asset

- **TC ID:** TC-008
- **Feature:** Asset Management — Conditional Deletion
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. An asset with `status: "Rented"` exists.
- **Test Steps:**
  1. Create an asset with `status: "Rented"` directly in the database.
  2. Send a `DELETE` request to `/api/assets/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `400`. Body message equals `"Cannot delete an asset that is currently rented."`. Asset still exists in the database.
- **Actual Result:** Response status was `400`. Correct error message returned. Asset was confirmed to still exist in the database.
- **Status:** Pass

---

### TC-009: Allow Deletion of an Available Asset

- **TC ID:** TC-009
- **Feature:** Asset Management — Conditional Deletion
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. An asset with `status: "Available"` exists.
- **Test Steps:**
  1. Create an asset with `status: "Available"` directly in the database.
  2. Send a `DELETE` request to `/api/assets/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body message equals `"Asset deleted successfully"`. Asset no longer exists in the database.
- **Actual Result:** Response status was `200`. Asset was confirmed to be removed from the database.
- **Status:** Pass

---

### TC-010: Reject Asset GET Without Token

- **TC ID:** TC-010
- **Feature:** Asset Management — Authorization
- **Priority:** Critical
- **Preconditions:** No authentication token is provided.
- **Test Steps:**
  1. Send a `GET` request to `/api/assets` without an `x-auth-token` header.
- **Expected Result:** Response status is `401`. Body message equals `"No token, authorization denied"`.
- **Actual Result:** Response status was `401`. Correct error message returned.
- **Status:** Pass

---

### TC-011: Reject Asset POST With Invalid Token

- **TC ID:** TC-011
- **Feature:** Asset Management — Authorization
- **Priority:** High
- **Preconditions:** A malformed token string is available.
- **Test Steps:**
  1. Send a `POST` request to `/api/assets` with header `x-auth-token: not-a-real-token-123` and any body.
- **Expected Result:** Response status is `401`. Body message equals `"Token is not valid"`.
- **Actual Result:** Response status was `401`. Correct error message returned.
- **Status:** Pass

---

## Renter Management

---

### TC-012: Register a New Renter

- **TC ID:** TC-012
- **Feature:** Renter Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. No renter with email `jestrenter@example.com` exists.
- **Test Steps:**
  1. Send a `POST` request to `/api/renters` with header `x-auth-token: <adminToken>` and body `{ firstName: "Jest", lastName: "Renter", email: "jestrenter@example.com", phone: "123-456-7890" }`.
- **Expected Result:** Response status is `201`. Body contains `email: "jestrenter@example.com"` and an `_id` field.
- **Actual Result:** Response status was `201`. Renter was created with the correct email and a new `_id`.
- **Status:** Pass

---

### TC-013: Retrieve All Renters

- **TC ID:** TC-013
- **Feature:** Renter Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. Renter from TC-012 exists in the database.
- **Test Steps:**
  1. Send a `GET` request to `/api/renters` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body is an array containing the renter created in TC-012.
- **Actual Result:** Response status was `200`. Renter from TC-012 was found in the returned array.
- **Status:** Pass

---

### TC-014: Retrieve a Single Renter by ID

- **TC ID:** TC-014
- **Feature:** Renter Management
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. Renter from TC-012 exists with a known `_id`.
- **Test Steps:**
  1. Send a `GET` request to `/api/renters/:id` using the renter's `_id` from TC-012, with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body `_id` matches the requested ID and `email` equals `"jestrenter@example.com"`.
- **Actual Result:** Response status was `200`. Correct renter record was returned.
- **Status:** Pass

---

### TC-015: Update Renter Phone Number

- **TC ID:** TC-015
- **Feature:** Renter Management
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. Renter from TC-012 exists with a known `_id`.
- **Test Steps:**
  1. Send a `PUT` request to `/api/renters/:id` with header `x-auth-token: <adminToken>` and body `{ phone: "098-765-4321" }`.
- **Expected Result:** Response status is `200`. `phone` is updated to `"098-765-4321"`. `firstName` and `lastName` remain unchanged.
- **Actual Result:** Response status was `200`. Phone was updated. Other fields were unchanged.
- **Status:** Pass

---

### TC-016: Prevent Duplicate Email Registration for Renter

- **TC ID:** TC-016
- **Feature:** Renter Management — Data Integrity
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. A renter with email `jestrenter@example.com` already exists (created in TC-012).
- **Test Steps:**
  1. Send a `POST` request to `/api/renters` with header `x-auth-token: <adminToken>` and body using the same email `jestrenter@example.com`.
- **Expected Result:** Response status is `400`. Body message equals `"Renter with this email already exists"`.
- **Actual Result:** Response status was `400`. Correct error message returned.
- **Status:** Pass

---

### TC-017: Prevent Email Collision on Renter Update

- **TC ID:** TC-017
- **Feature:** Renter Management — Data Integrity
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. Two distinct renters exist in the database.
- **Test Steps:**
  1. Create a second renter with email `jestrenter2@example.com` directly in the database.
  2. Send a `PUT` request to `/api/renters/:id` (using the first renter's ID) with header `x-auth-token: <adminToken>` and body `{ email: "jestrenter2@example.com" }`.
- **Expected Result:** Response status is `400`.
- **Actual Result:** Response status was `400`.
- **Status:** Pass

---

### TC-018: Delete a Renter

- **TC ID:** TC-018
- **Feature:** Renter Management — Deletion
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. Renter from TC-012 exists with a known `_id`.
- **Test Steps:**
  1. Send a `DELETE` request to `/api/renters/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body message equals `"Renter deleted successfully"`. Renter no longer exists in the database.
- **Actual Result:** Response status was `200`. Renter was confirmed removed from the database.
- **Status:** Pass

---

## User Management

---

### TC-019: Admin Creates a New Staff Member

- **TC ID:** TC-019
- **Feature:** User Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. No user with email `jester.staff@test.com` exists.
- **Test Steps:**
  1. Send a `POST` request to `/api/users` with header `x-auth-token: <adminToken>` and body `{ name: "Jester Staff Test", email: "jester.staff@test.com", password: "securePassword123", role: "staff" }`.
- **Expected Result:** Response status is `201`. Body contains `email: "jester.staff@test.com"`. Body does **not** contain a `password` field.
- **Actual Result:** Response status was `201`. Email matched. No password field was present in the response.
- **Status:** Pass

---

### TC-020: Retrieve All Users Without Exposing Passwords

- **TC ID:** TC-020
- **Feature:** User Management — Security
- **Priority:** High
- **Preconditions:** Authenticated admin token is available.
- **Test Steps:**
  1. Send a `GET` request to `/api/users` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body is an array. No user object in the array contains a `password` field.
- **Actual Result:** Response status was `200`. No password hashes were exposed in any returned user object.
- **Status:** Pass

---

### TC-021: Update User Role and Name

- **TC ID:** TC-021
- **Feature:** User Management
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. User from TC-019 exists with a known `_id`.
- **Test Steps:**
  1. Send a `PUT` request to `/api/users/:id` with header `x-auth-token: <adminToken>` and body `{ name: "Jest Senior Staff Test", role: "admin" }`.
- **Expected Result:** Response status is `200`. Body shows `name: "Jest Senior Staff Test"` and `role: "admin"`. No `password` field in the response.
- **Actual Result:** Response status was `200`. Name and role were updated. Password was not exposed.
- **Status:** Pass

---

### TC-022: Prevent Duplicate Email on User Creation

- **TC ID:** TC-022
- **Feature:** User Management — Data Integrity
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. A user with email `jester.staff@test.com` already exists (created in TC-019).
- **Test Steps:**
  1. Send a `POST` request to `/api/users` with header `x-auth-token: <adminToken>` and body using email `jester.staff@test.com`.
- **Expected Result:** Response status is `400`. Body message equals `"User already exists"`.
- **Actual Result:** Response status was `400`. Correct error message returned.
- **Status:** Pass

---

### TC-023: Prevent Email Collision on User Update

- **TC ID:** TC-023
- **Feature:** User Management — Data Integrity
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. Two distinct users exist (user from TC-019 and a second user with email `jest.second@test.com`).
- **Test Steps:**
  1. Create a second user with email `jest.second@test.com` directly in the database.
  2. Send a `PUT` request to `/api/users/:id` (using the first user's ID from TC-019) with body `{ email: "jest.second@test.com" }`.
- **Expected Result:** Response status is `400`. Body message equals `"Email is already in use by another user"`.
- **Actual Result:** Response status was `400`. Correct error message returned.
- **Status:** Pass

---

### TC-024: Return 404 for Non-Existent User ID

- **TC ID:** TC-024
- **Feature:** User Management — Error Handling
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. A valid MongoDB `ObjectId` is generated that does not match any user.
- **Test Steps:**
  1. Send a `GET` request to `/api/users/:fakeId` with header `x-auth-token: <adminToken>`.
  2. Send a `DELETE` request to `/api/users/:fakeId` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Both responses return status `404`. The `GET` response body message equals `"User not found"`.
- **Actual Result:** Both responses returned `404`. `GET` message matched.
- **Status:** Pass

---

### TC-025: Reject User List GET Without Token

- **TC ID:** TC-025
- **Feature:** User Management — Authorization
- **Priority:** Critical
- **Preconditions:** No authentication token is provided.
- **Test Steps:**
  1. Send a `GET` request to `/api/users` without an `x-auth-token` header.
- **Expected Result:** Response status is `401`. Body message equals `"No token, authorization denied"`.
- **Actual Result:** Response status was `401`. Correct error message returned.
- **Status:** Pass

---

### TC-026: Block Non-Admin User from Creating Staff

- **TC ID:** TC-026
- **Feature:** User Management — Role-Based Access Control
- **Priority:** Critical
- **Preconditions:** A valid JWT token exists for a user with `role: "staff"`.
- **Test Steps:**
  1. Generate a JWT for a staff-role user.
  2. Send a `POST` request to `/api/users` with header `x-auth-token: <staffToken>` and a valid user body.
- **Expected Result:** Response status is `403`. Body message equals `"Access denied. Admin privileges required."`.
- **Actual Result:** Response status was `403`. Correct error message returned.
- **Status:** Pass

---

### TC-027: No Password Hash Exposed on Single User Profile

- **TC ID:** TC-027
- **Feature:** User Management — Security
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. User from TC-019 exists with a known `_id`.
- **Test Steps:**
  1. Send a `GET` request to `/api/users/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body contains `name` and `email`. Body does **not** contain a `password` field.
- **Actual Result:** Response status was `200`. No password field was present in the response.
- **Status:** Pass

---

### TC-028: Admin Deletes a User Successfully

- **TC ID:** TC-028
- **Feature:** User Management — Deletion
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. User from TC-019 exists with a known `_id`.
- **Test Steps:**
  1. Send a `DELETE` request to `/api/users/:id` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body message equals `"User deleted successfully"`.
- **Actual Result:** Response status was `200`. Correct message returned.
- **Status:** Pass

---

## Rental Transactions

---

### TC-029: Create Rental with Calculated Cost and Asset Status Update

- **TC ID:** TC-029
- **Feature:** Rental Transactions
- **Priority:** Critical
- **Preconditions:** Authenticated admin token is available. An `"Available"` asset with `dailyRate: 50.00` and a renter both exist in the database.
- **Test Steps:**
  1. Send a `POST` request to `/api/rentals` with header `x-auth-token: <adminToken>` and body `{ asset: <assetId>, renter: <renterId>, returnDate: <3 days from now> }`.
- **Expected Result:** Response status is `201`. `totalCost` equals `150.00` (3 days × $50.00). The asset's status in the database becomes `"Rented"`.
- **Actual Result:** Response status was `201`. `totalCost` was `150.00`. Asset status was updated to `"Rented"`.
- **Status:** Pass

---

### TC-030: Return Rental and Trigger Maintenance Status

- **TC ID:** TC-030
- **Feature:** Rental Transactions
- **Priority:** Critical
- **Preconditions:** Authenticated admin token is available. An active rental exists for an asset (created in TC-029).
- **Test Steps:**
  1. Send a `PUT` request to `/api/rentals/return/:assetId` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Response body `status` equals `"Completed"`. The asset's status in the database becomes `"Maintenance"`.
- **Actual Result:** Response status was `200`. Rental marked as `"Completed"`. Asset moved to `"Maintenance"`.
- **Status:** Pass

---

### TC-031: Data Persistence Accuracy in Rental Record

- **TC ID:** TC-031
- **Feature:** Rental Transactions — Data Integrity
- **Priority:** Medium
- **Preconditions:** A rental was created in TC-029 and its `_id` is stored.
- **Test Steps:**
  1. Query the `Rental` collection directly using the rental `_id` from TC-029.
- **Expected Result:** The retrieved rental's `asset` and `renter` IDs match those used during creation. The record contains a `totalCost` field.
- **Actual Result:** All IDs matched. `totalCost` field was present.
- **Status:** Pass

---

### TC-032: Retrieve All Rentals with Populated References

- **TC ID:** TC-032
- **Feature:** Rental Transactions
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. At least one rental record with a linked asset and renter exists.
- **Test Steps:**
  1. Send a `GET` request to `/api/rentals` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Body is an array. If results exist, each record contains nested `asset.name` and `renter.firstName` (populated references).
- **Actual Result:** Response status was `200`. Populated references were present in records.
- **Status:** Pass

---

### TC-033: Active Filter Returns Only Active Rentals

- **TC ID:** TC-033
- **Feature:** Rental Transactions
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available.
- **Test Steps:**
  1. Send a `GET` request to `/api/rentals/active` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `200`. Every record in the returned array has `status: "Active"`.
- **Actual Result:** Response status was `200`. All returned records had `status: "Active"`.
- **Status:** Pass

---

### TC-034: Block Rental if Asset is Not Available

- **TC ID:** TC-034
- **Feature:** Rental Transactions — Business Logic
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. An asset with `status: "Rented"` exists.
- **Test Steps:**
  1. Create an asset with `status: "Rented"` directly in the database.
  2. Send a `POST` request to `/api/rentals` with header `x-auth-token: <adminToken>` and body referencing that asset's ID.
- **Expected Result:** Response status is `400`. Body message equals `"Asset is not available for rent"`.
- **Actual Result:** Response status was `400`. Correct error message returned.
- **Status:** Pass

---

### TC-035: Return 404 When Renting a Non-Existent Asset

- **TC ID:** TC-035
- **Feature:** Rental Transactions — Error Handling
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. A valid MongoDB `ObjectId` is generated that matches no asset.
- **Test Steps:**
  1. Send a `POST` request to `/api/rentals` with header `x-auth-token: <adminToken>` and a body with a fake `asset` ID.
- **Expected Result:** Response status is `404`. Body message equals `"Asset not found"`.
- **Actual Result:** Response status was `404`. Correct error message returned.
- **Status:** Pass

---

### TC-036: Return 404 When Returning Asset With No Active Rental

- **TC ID:** TC-036
- **Feature:** Rental Transactions — Error Handling
- **Priority:** Medium
- **Preconditions:** Authenticated admin token is available. An asset with `status: "Available"` exists with no active rental record.
- **Test Steps:**
  1. Create an `"Available"` asset with no linked rental.
  2. Send a `PUT` request to `/api/rentals/return/:assetId` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `404`. Body message equals `"Rental not found"`.
- **Actual Result:** Response status was `404`. Correct error message returned.
- **Status:** Pass

---

### TC-037: Block Duplicate Return of Already-Completed Rental

- **TC ID:** TC-037
- **Feature:** Rental Transactions — Business Logic
- **Priority:** High
- **Preconditions:** Authenticated admin token is available. A rental record with `status: "Completed"` exists for an asset.
- **Test Steps:**
  1. Create an asset and a rental with `status: "Completed"` directly in the database.
  2. Send a `PUT` request to `/api/rentals/return/:assetId` with header `x-auth-token: <adminToken>`.
- **Expected Result:** Response status is `404`. Body message equals `"Rental not found"` (system ignores completed rentals when looking for an active one to return).
- **Actual Result:** Response status was `404`. Correct error message returned.
- **Status:** Pass

---

### TC-038: Reject Rental and Return Requests Without Token

- **TC ID:** TC-038
- **Feature:** Rental Transactions — Authorization
- **Priority:** Critical
- **Preconditions:** No authentication token is provided.
- **Test Steps:**
  1. Send a `POST` request to `/api/rentals` without an `x-auth-token` header.
  2. Send a `PUT` request to `/api/rentals/return/:assetId` without an `x-auth-token` header.
- **Expected Result:** Both responses return status `401`.
- **Actual Result:** Both responses returned `401`.
- **Status:** Pass

---

### TC-039: Minimum 1 Day Charge for Same-Day Return

- **TC ID:** TC-039
- **Feature:** Rental Transactions — Cost Calculation
- **Priority:** Low
- **Preconditions:** Authenticated admin token is available. An `"Available"` asset with `dailyRate: 40.00` exists.
- **Test Steps:**
  1. Send a `POST` request to `/api/rentals` with `returnDate` set to the current timestamp (same as rental start).
- **Expected Result:** Response status is `201`. `totalCost` equals `40.00` (minimum 1 day enforced by `Math.ceil(0) || 1`).
- **Actual Result:** Response status was `201`. `totalCost` was `40.00`.
- **Status:** Pass

---

### TC-040: Asset Status Transitions Strictly to Maintenance After Return

- **TC ID:** TC-040
- **Feature:** Rental Transactions — Business Logic
- **Priority:** Low
- **Preconditions:** Authenticated admin token is available. An `"Available"` asset exists with no prior rental.
- **Test Steps:**
  1. Create an `"Available"` asset.
  2. Send a `POST` request to `/api/rentals` to create an active rental for it.
  3. Send a `PUT` request to `/api/rentals/return/:assetId` to process the return.
  4. Query the asset directly from the database.
- **Expected Result:** Asset `status` is `"Maintenance"`. Asset `status` is **not** `"Available"`.
- **Actual Result:** Asset status was `"Maintenance"` and was confirmed not `"Available"`.
- **Status:** Pass

---

## Summary
- **Total Test Cases:** 40
- **Critical:** 9
- **High:** 13
- **Medium:** 16
- **Low:** 2
- **Pass Rate:** 100% (40/40)
- **Coverage:** API endpoints, authentication, authorization, asset management, renter management, user management, rental transactions
