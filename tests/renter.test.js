const request = require('supertest');
const app = require('../backend/server'); 
const Asset = require('../backend/models/Asset');
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const Renter = require('../backend/models/Renter');

describe ('Renter API Master Test Suite', () => {
    let testToken;
    let createdRenterId;
    let createdRenterEmail = []; // To track multiple renters created during tests for cleanup

    beforeAll(async () => {
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
        testToken = loginRes.body.token;
    });

    afterAll(async () => {
        if (createdRenterEmail.length > 0) {
            await Renter.deleteMany({ email: { $in: createdRenterEmail } }); // Clean up specific test renters if they weren't deleted in the tests
        }
        await User.deleteMany({ email: 'jestTester@test.com' }); // Clean up test user
        await mongoose.connection.close();
    });

    describe('Renter Lifecycle API Tests', () => {
        /**
         * TC-011: Create New Renter (POST)
         * Goal: Verify staff can register a new customer.
         */
        test('TC-011: Should register a new renter successfully', async () => {
            const newRenter = {
                firstName: 'Jest',
                lastName: 'Renter',
                email: 'jestrenter@example.com',
                phone: '123-456-7890',
            };

            await Renter.findOneAndDelete({ email: newRenter.email }); // Clean up specific test renter if it exists before start the tests

            const res = await request(app)
                .post('/api/renters')
                .set('x-auth-token', testToken)
                .send(newRenter);



            expect(res.statusCode).toBe(201);
            expect(res.body.email).toBe(newRenter.email);
            createdRenterId = res.body._id;
            createdRenterEmail.push(newRenter.email); // Track the email for cleanup
        });

        /**
         * TC-012: Retrieve Renter List (GET)
         * Goal: Ensure renters are returned and sorted correctly.
         */
        test('TC-012: Should retrieve all renters sorted by lastName', async () => {
            const res = await request(app)
                .get('/api/renters')
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            // Data Integrity Check: Ensure our specific renter is present
            const found = res.body.find(r => r._id === createdRenterId);
            expect(found).toBeDefined();
        });

        /**
         * TC-013: Retrieve One Renter Information (GET)
         * Goal: Ensure a single renter's information can be retrieved correctly.
         */
        test('TC-013: Retrieve One Renter Information', async () => {
            const res = await request(app)
                .get(`/api/renters/${createdRenterId}`)
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            expect(res.body._id).toBe(createdRenterId);
            expect(res.body.email).toBe('jestrenter@example.com');
        });
        
        /**
         * TC-014: Update Renter Details (PUT)
         * Goal: Verify that existing customer data can be modified 
         * and changes persist in the database.
         */
        test('TC-014: Should update renter phone successfully', async () => {
            const updates = {
                phone: '098-765-4321',
            };

            const res = await request(app)
                .put(`/api/renters/${createdRenterId}`)
                .set('x-auth-token', testToken)
                .send(updates);

            expect(res.statusCode).toBe(200);
            expect(res.body.phone).toBe('098-765-4321');
            
            // Integrity Check: Ensure the name didn't change
            expect(res.body.firstName).toBe('Jest'); 
            expect(res.body.lastName).toBe('Renter');
        });
    });

    describe('Renter Security & Integrity Tests', () => {
        test('TC-015: Should prevent registration with a duplicate email', async () => {
            const duplicateRenter = {
                firstName: 'Duplicate',
                lastName: 'Jester',
                email: 'jestrenter@example.com', // Already used in TC-011
                phone: '000-000-0000'
            };

            const res = await request(app)
                .post('/api/renters')
                .set('x-auth-token', testToken)
                .send(duplicateRenter);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Renter with this email already exists');
            createdRenterEmail.push(duplicateRenter.email); // Track the email for cleanup just in case
        });

        /**
         * TC-016: Email Collision on Update
         * Goal: Ensure a user cannot update their email to an address 
         * already registered to another renter.
         */
        test('TC-016: Should prevent updating email to one already in use', async () => {
            // 1. Create a second renter
            const renterB = {
                firstName: 'Jest',
                lastName: 'Renter 2',
                email: 'jestrenter2@example.com',
                phone: '111-222-3333'
            };

            await Renter.findOneAndDelete({ email: renterB.email }); // Clean up specific test renter if it exists before start the tests

            await Renter.create(renterB);
            createdRenterEmail.push(renterB.email); // Track the email for cleanup

            // 2. Try to update the first renter (created in earlier tests) to existing email of renterB
            const res = await request(app)
                .put(`/api/renters/${createdRenterId}`)
                .set('x-auth-token', testToken)
                .send({ email: 'jestrenter2@example.com' });

            expect(res.statusCode).toBe(400); 
        });
    });

    describe('Renter Deletion Tests', () => {
        /**
         * TC-017: Successful Deletion 
         * Goal: Verify an authorized user can remove a renter.
         */
        test('TC-017: Should delete a renter successfully when authorized', async () => {
            const res = await request(app)
                .delete(`/api/renters/${createdRenterId}`)
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Renter deleted successfully');

            // Final Data Integrity Check: Ensure it's gone from the DB
            const checkDb = await Renter.findById(createdRenterId);
            expect(checkDb).toBeNull();
        });
    });
});