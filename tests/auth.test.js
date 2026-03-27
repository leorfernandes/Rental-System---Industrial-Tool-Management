const request = require('supertest');
const app = require('../backend/server');
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const { after } = require('node:test');

describe('Authentication Flow', () => {
    // 1. Setup a clean test user
    beforeAll(async () => {
        const user = new User({
            username: 'testadmin',
            password: 'password123',
            role: 'admin'
        });
        await user.save();
    });

    afterAll(async () => {
        await User.deleteMany({ username: 'testadmin' });
        await mongoose.connection.close();
    });

    // 2. The Core Login Test
    it('should login successfully and return a token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testadmin',
                password: 'password123'
            });

        // Diagnostics
        if (res.statusCode !== 200) {
            console.log('Login Failed Body:', res.body);
        }

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
    });

    // 3. The "Invalid Password" Test
    it('should reject incorrect passwords', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testadmin',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(400);
    });
});