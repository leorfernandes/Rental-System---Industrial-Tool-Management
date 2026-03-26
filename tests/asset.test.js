const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../backend/server');
const Asset = require('../backend/models/Asset');
const Rental = require('../backend/models/Rental');

describe('Asset API Endpoints', () => {
  // CLEANUP AFTER EACH TEST
  afterEach(async () => {
    await Asset.deleteMany({ name: "Jackhammer" }); // Delete specific test assets
    await Rental.deleteMany({ customerName: "Test User" }); // Delete specific test rentals
  });

  // Test 1: Successful Creation
  it('should create a new asset', async () => {
    const res = await request(app)
      .post('/api/assets')
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
        .send();
  
      // 3. Assertion: Asset should be available
      expect(res.statusCode).toBe(200);
      expect(res.body.asset.status).toBe("Available");

    });
});