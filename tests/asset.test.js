const request = require('supertest');
const app = require('../backend/server'); 
const Asset = require('../backend/models/Asset');
const mongoose = require('mongoose');
const User = require('../backend/models/User');

describe ('Asset API Master Test Suite', () => {
    let testToken;
    let createdAssetId;
    let assetIdsForCleaning = []; // To track multiple cleaning assets created during tests for cleanup

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
        await Asset.deleteMany({ _id: { $in: assetIdsForCleaning } }); // Clean up specific test assets
        await User.deleteMany({ email: 'jestTester@test.com' }); // Clean up test user
        await mongoose.connection.close();
    });
  describe('Asset Lifecycle API Tests', () => {
      /**
       * TC-003: Create New Asset (POST)
       * Goal: Verify a logged-in user can add a tool to inventory.
       */
      test('TC-003: Should create a new asset successfully', async () => {
          const newTool = {
              name: 'New Tool',
              category: 'Scaffolding',
              dailyRate: 45.00,
              status: 'Available'
          };

          const res = await request(app)
              .post('/api/assets')
              .set('x-auth-token', testToken)
              .send(newTool);

          expect(res.statusCode).toBe(201);
          expect(res.body.name).toBe(newTool.name);
          expect(res.body).toHaveProperty('_id');
          
          // Store ID for use in GET and PUT tests
          createdAssetId = res.body._id;
          assetIdsForCleaning.push(createdAssetId);
      });

      /**
       * TC-004: Read Asset Inventory (GET)
       * Goal: Verify the system returns the correct list of tools.
       */
      test('TC-004: Should retrieve the list of assets', async () => {
          const res = await request(app)
              .get('/api/assets')
              .set('x-auth-token', testToken);

          expect(res.statusCode).toBe(200);
          expect(Array.isArray(res.body)).toBe(true);
          // Ensure the asset we just created is in the list
          const found = res.body.find(a => a._id === createdAssetId);
          expect(found).toBeDefined();
          expect(found.name).toBe('New Tool');
      });

      /**
       * TC-005: Update Asset Details (PUT)
       * Goal: Verify that editing an asset reflects changes in the database.
       */
      test('TC-005: Should update asset details (dailyRate and status)', async () => {
          const updates = {
              dailyRate: 55.00,
              status: 'Maintenance'
          };

          const res = await request(app)
              .put(`/api/assets/${createdAssetId}`)
              .set('x-auth-token', testToken)
              .send(updates);

          expect(res.statusCode).toBe(200);
          expect(res.body.dailyRate).toBe(55.00);
          expect(res.body.status).toBe('Maintenance');
      });
  });

  /**
   * Maintenance Workflow Integrity (PUT)
   * Goal: Verify the 'clear-maintenance' logic only works when appropriate 
   * and correctly updates the inspection timestamp.
   */
  describe('Maintenance State Transitions', () => {
      test('TC-006: Should successfully clear maintenance and update inspection date', async () => {
          // 1. Setup: Create an asset specifically in Maintenance
          const maintenanceAsset = await Asset.create({
              name: 'Maintenance Asset',
              status: 'Maintenance',
              dailyRate: 30,
              category: 'Scaffolding'
          });

          // 2. Action: Clear maintenance
          const res = await request(app)
              .put(`/api/assets/clear-maintenance/${maintenanceAsset._id}`)
              .set('x-auth-token', testToken);

          // 3. Assertions
          expect(res.statusCode).toBe(200);
          expect(res.body.asset.status).toBe('Available');
          expect(res.body.asset).toHaveProperty('lastInspection');
          
          // Verify the date is recent (within the last minute)
          const inspectionDate = new Date(res.body.asset.lastInspection);
          expect(Date.now() - inspectionDate.getTime()).toBeLessThan(60000);

        // Track this asset for cleanup
        assetIdsForCleaning.push(maintenanceAsset._id);
      });

      test('TC-007: Should fail to clear maintenance if asset is already Available', async () => {
          const availableAsset = await Asset.create({
              name: 'Available Asset',
              status: 'Available',
              category: 'Scaffolding',
              dailyRate: 5
          });

          const res = await request(app)
              .put(`/api/assets/clear-maintenance/${availableAsset._id}`)
              .set('x-auth-token', testToken);

          expect(res.statusCode).toBe(400);
          expect(res.body.message).toBe("Asset is not in maintenance");

          // Cleanup
            await Asset.findByIdAndDelete(availableAsset._id);
      });
  });

/**
 * Conditional Deletion Safety (DELETE)
 * Goal: Verify the system blocks the deletion of assets currently generating revenue (Rented).
 */
  describe('Conditional Deletion Safety', () => {
      test('TC-008: Should block deletion of a Rented asset', async () => {
          // 1. Setup: Create an asset with Rented status
          const rentedAsset = await Asset.create({
              name: 'Rented Asset',
              status: 'Rented',
              category: 'Scaffolding',
              dailyRate: 500
          });

          // 2. Action: Attempt to delete
          const res = await request(app)
              .delete(`/api/assets/${rentedAsset._id}`)
              .set('x-auth-token', testToken);

          // 3. Assertions
          expect(res.statusCode).toBe(400);
          expect(res.body.message).toBe("Cannot delete an asset that is currently rented.");
          
          // Data Integrity Check: Ensure it still exists in DB
          const checkDb = await Asset.findById(rentedAsset._id);
          expect(checkDb).not.toBeNull();

          // Cleanup: Remove the rented asset
          await Asset.findByIdAndDelete(rentedAsset._id);
      });

      test('TC-009: Should allow deletion of an Available asset', async () => {
          const disposableAsset = await Asset.create({
              name: 'Disposable Asset',
              status: 'Available',
              category: 'Scaffolding',
              dailyRate: 2
          });

          const res = await request(app)
              .delete(`/api/assets/${disposableAsset._id}`)
              .set('x-auth-token', testToken);

          expect(res.statusCode).toBe(200);
          expect(res.body.message).toBe("Asset deleted successfully");

            // Data Integrity Check: Ensure it's gone from the DB
            const checkDb = await Asset.findById(disposableAsset._id);
            expect(checkDb).toBeNull();
            
      });
  });

  /**
 * Authorization Security
 * Goal: Verify that the 'auth' middleware blocks unauthenticated requests 
 * to protect inventory data.
 */
  describe('API Security & Authorization', () => {
      
      test('TC-010: Should reject GET /api/assets if no token is provided', async () => {
          const res = await request(app)
              .get('/api/assets'); // No .set('x-auth-token') here

          expect(res.statusCode).toBe(401);
          expect(res.body.message).toBe('No token, authorization denied');
      });

      test('TC-011: Should reject POST /api/assets if token is malformed/invalid', async () => {
          const res = await request(app)
              .post('/api/assets')
              .set('x-auth-token', 'not-a-real-token-123') // Fake token
              .send({ name: 'Security Test Tool', dailyRate: 10 });

          expect(res.statusCode).toBe(401);
          expect(res.body.message).toBe('Token is not valid');
      });
  });
});