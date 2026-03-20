const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // You'll need to export 'app' from server.js

describe('Asset API Endpoints', () => {
  
  // Test 1: Successful Creation
  it('should create a new asset', async () => {
    const res = await request(app)
      .post('/api/assets')
      .send({
        name: "Test Drill",
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
        name: "Broken Drill",
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
});