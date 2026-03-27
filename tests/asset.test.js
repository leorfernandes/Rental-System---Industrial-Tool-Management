const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../backend/server');
const Asset = require('../backend/models/Asset');
const Rental = require('../backend/models/Rental');
const User = require('../backend/models/User');

const jwt = require('jsonwebtoken');
require('dotenv').config();

describe('Asset API Endpoints', () => {
  let token;

  beforeAll(async () => {
          const user = new User({
            username: 'asset-tester',
            password: 'password123',
            role: 'admin'
        });
        await user.save();

        token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
      });

  // CLEANUP AFTER EACH TEST
  afterEach(async () => {
    await Asset.deleteMany({ name: "Test Tool" }); // Delete specific test assets
    await Rental.deleteMany({ customerName: "Test User" }); // Delete specific test rentals
  });

  // CLEANUP AFTER ALL TESTS
  afterAll(async () => {
    await User.deleteMany({ username: 'asset-tester' });
    await mongoose.connection.close();
  });

  // Test 1: Successful Creation
  it('should create a new asset', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('x-auth-token', token)
      .send({
        name: "Test Tool",
        category: "Power Tools",
        dailyRate: 50
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
  });

  // Test 2: Validation Failure (Regression Test)
  it('should fail if dailyRate is negative', async () => {
    const res = await request(app)
      .post('/api/assets')
      .send({
        name: "Test Tool",
        category: "Power Tools",
        dailyRate: -10
      });
    
    expect(res.statusCode).toEqual(400);
  });

  // Test 3: Validation Failure (Regression Test)
  it('should fail if name is empty', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('x-auth-token', token)
      .send({
        name: "",
        category: "Power Tools",
        dailyRate: 50
      });
    
    expect(res.statusCode).toEqual(400);
  });

  it('should clear maintenance and make asset available', async () => {
      // 1. Setup: Create a temporary asset
      const asset = await Asset.create({
        name: "Test Tool",
        category: "Power Tools",
        dailyRate: 50,
        status: "Maintenance"
      });
  
      const res = await request(app)
        .put(`/api/assets/${asset._id}/clear-maintenance`)
        .set('x-auth-token', token)
        .send();
  
      // 3. Assertion: Asset should be available
      expect(res.statusCode).toBe(200);
      expect(res.body.asset.status).toBe("Available");

    });
});