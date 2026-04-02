const request = require('supertest');
const app = require('../backend/server');
const mongoose = require('mongoose');
const User = require('../backend/models/User');

describe('Auth API Tests', () => {
    // Clean up or seed database before tests
    beforeAll(async () => {
            const user = new User({
            name: 'jestTester',
            email: 'jesttester@test.com',
            password: 'password123',
            role: 'admin'
        });
        await user.save();
    });

        afterAll(async () => {
        await User.deleteMany({ email: 'jesttester@test.com' });
        await mongoose.connection.close();
    });

    // TC-001: Successful login with valid credentials
    test('TC-001: Should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jestTester@test.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('jesttester@test.com');
    });

    // TC-002: Failed login with invalid credentials
    test('TC-002: Should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jestTester@test.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Invalid Credentials');
    });
});