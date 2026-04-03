const request = require('supertest');
const app = require('../backend/server'); 
const User = require('../backend/models/User');
const mongoose = require('mongoose');
const { describe } = require('node:test');
const jwt = require('jsonwebtoken');

describe('User API Master Test Suite', () => {
    let adminToken;
    let newUserId;
    let createdUserEmail = []; // To track multiple users created during tests for cleanup

    beforeAll(async () => {
        await User.deleteMany({ email: 'jestTester@test.com' }); // Clean up before starting tests
         // Create a test user
           const user = new User({
               name: 'jestTester',
               email: 'jestTester@test.com',
               password: 'password123',
               role: 'admin'
           });
           await user.save();
   
           // Log in to get a valid token for all subsequent requests
           const loginRes = await request(app)
               .post('/api/auth/login')
               .send({ email: 'jestTester@test.com', password: 'password123' });
           adminToken = loginRes.body.token;
       });
   
       afterAll(async () => {
           if (newUserId) {
               await User.deleteMany({ _id: newUserId }); // Clean up specific test user if it wasn't deleted in the tests
           }
           if (createdUserEmail.length > 0) {
               await User.deleteMany({ email: { $in: createdUserEmail } }); // Clean up multiple test users
           }
           await User.deleteMany({ email: 'jestTester@test.com' }); // Clean up test user
           await mongoose.connection.close();
       });

    describe('User Management Lifecycle (Admin Privileges)', () => {
        /**
         * TC-019: Staff Registration (POST)
         * Goal: Verify Admin can create a user and sensitive data is hidden.
         */
        test('TC-019: Should allow Admin to create a new staff member', async () => {
            const newUser = {
                name: 'Jester Staff Test',
                email: 'jester.staff@test.com',
                password: 'securePassword123',
                role: 'staff'
            };

            const res = await request(app)
                .post('/api/users')
                .set('x-auth-token', adminToken)
                .send(newUser);

            expect(res.statusCode).toBe(201);
            expect(res.body.email).toBe(newUser.email);
            expect(res.body).not.toHaveProperty('password');
            
            newUserId = res.body._id;
            createdUserEmail.push(newUser.email); // Track the created user's email for cleanup
        });

        /**
         * TC-020: Staff Directory Access (GET)
         * Goal: Verify the list of users is accessible and sanitized.
         */
        test('TC-020: Should retrieve all users without exposing passwords', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('x-auth-token', adminToken);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            
            // Security Verification: Check that no user in the list has a password field
            res.body.forEach(user => {
                expect(user).not.toHaveProperty('password');
            });
        });

        /**
         * TC-021: Update Staff Profile (PUT)
         * Goal: Verify Admin can update user roles and details.
         */
        test('TC-021: Should update user role and name', async () => {
            const updates = {
                name: 'Jest Senior Staff Test',
                role: 'admin'
            };

            const res = await request(app)
                .put(`/api/users/${newUserId}`)
                .set('x-auth-token', adminToken)
                .send(updates);

            expect(res.statusCode).toBe(200);
            expect(res.body.name).toBe('Jest Senior Staff Test');
            expect(res.body.role).toBe('admin');
            expect(res.body).not.toHaveProperty('password');
        });
    });

    describe('User Management Security & Integrity', () => {
        /**
         * TC-022: Duplicate Staff Prevention (POST)
         * Goal: Verify the system blocks creating a second user with the same email.
         */
        test('TC-022: Should prevent creating a user with an existing email', async () => {
            const duplicateUser = {
                name: 'Jest Clone Staff',
                email: 'jester.staff@test.com',
                password: 'password123',
                role: 'staff'
            };

            const res = await request(app)
                .post('/api/users')
                .set('x-auth-token', adminToken)
                .send(duplicateUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('User already exists');
        });

        /**
         * TC-023: Email Collision on Update (PUT)
         * Goal: Verify that updating a user to an email held by another staff member is blocked.
         */
        test('TC-023: Should prevent updating a user to an email already in use', async () => {
            // 1. Setup: Create a second unique user
            const secondUser = await User.create({
                name: 'Jest Second Staff',
                email: 'jest.second@test.com',
                password: 'hashedPassword',
                role: 'staff'
            });
            createdUserEmail.push(secondUser.email); // Track the second user's email for cleanup

            // 2. Action: Try to update our primary test user (from TC-016) to this new email
            const res = await request(app)
                .put(`/api/users/${newUserId}`)
                .set('x-auth-token', adminToken)
                .send({ email: 'jest.second@test.com' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Email is already in use by another user');
        });

        /**
         * TC-024: Non-Existent User Handling (GET/PUT/DELETE)
         * Goal: Verify the system returns 404 instead of crashing when an ID doesn't exist.
         */
        test('TC-024: Should return 404 when performing actions on a non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId(); // Generate a valid-format but non-existent ID

            const getRes = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('x-auth-token', adminToken);

            const deleteRes = await request(app)
                .delete(`/api/users/${fakeId}`)
                .set('x-auth-token', adminToken);

            expect(getRes.statusCode).toBe(404);
            expect(deleteRes.statusCode).toBe(404);
            expect(getRes.body.message).toBe('User not found'); // Check if your route returns this specific message
        });
    });

    describe('User Security & Authorization Tests', () => {
        /**
         * TC-025: Global Authorization Check
         * Goal: Verify that a request without a token is blocked by the 'auth' middleware.
         */
        test('TC-025: Should reject GET /api/users when no token is provided', async () => {
            const res = await request(app)
                .get('/api/users'); // Missing .set('x-auth-token')

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('No token, authorization denied');
        });

        /**
         * TC-026: Role-Based Access Control (RBAC) Protection
         * Goal: Verify that a logged-in user with 'Staff' role is blocked 
         * from Admin-only routes (403 Forbidden).
         */
        test('TC-026: Should block non-admin users from creating new staff', async () => {
            // 1. Setup: Create a token for a standard 'Staff' user
            const staffToken = jwt.sign(
                { id: 'staff123', role: 'staff' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            const newUser = {
                name: 'Jest Illegal Entry',
                email: 'jestHacker@test.com',
                password: 'password123',
                role: 'admin'
            };

            // 2. Action: Try to POST as Staff
            const res = await request(app)
                .post('/api/users')
                .set('x-auth-token', staffToken)
                .send(newUser);

            // 3. Assertion: Should be Forbidden (403), not just Unauthorized (401)
            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Access denied. Admin privileges required.');
        });

        /**
         * TC-027: Sensitive Data Exposure Check
         * Goal: Verify that even when fetching a single user, the password hash 
         * is never sent over the API.
         */
        test('TC-027: Should not leak password hash when fetching a single user profile', async () => {
            const res = await request(app)
                .get(`/api/users/${newUserId}`)
                .set('x-auth-token', adminToken);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('email');
            
            expect(res.body).not.toHaveProperty('password');
        });
    });

    describe('User Deletion Tests', () => {
        /**
         * TC-028: Authorized Deletion (DELETE)
         * Goal: Verify Admin can delete a user and that user is removed from the system.
         */
        test('TC-028: Should delete a user successfully when authorized', async () => {
            const res = await request(app)
                .delete(`/api/users/${newUserId}`)
                .set('x-auth-token', adminToken);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');
        });
    });
});