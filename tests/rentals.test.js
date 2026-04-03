const request = require('supertest');
const app = require('../backend/server'); 
const Asset = require('../backend/models/Asset');
const User = require('../backend/models/User');
const Rental = require('../backend/models/Rental');
const mongoose = require('mongoose');
const { describe } = require('node:test');

describe('User API Master Test Suite', () => {
    let testToken;
    let createdRental; // To track the created rental for test use in multiple tests
    let rentalIdsForCleaning = []; // To track multiple rentals created during tests for cleanup
    let assetIdsForCleaning = []; // To track the asset used in rental tests for cleanup
    let renterIdsForCleaning = []; // To track the renter used in rental tests for cleanup
    let userIdsForCleaning = []; // To track the user used in rental tests for cleanup

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
                testToken = loginRes.body.token;
        });
   
       afterAll(async () => {
            await Rental.deleteMany({ _id: { $in: rentalIdsForCleaning } }); // Clean up specific test rentals
            await Asset.deleteMany({ _id: { $in: assetIdsForCleaning } }); // Clean up specific test assets
            await User.deleteMany({ _id: { $in: renterIdsForCleaning } }); // Clean up specific test renters
            await User.deleteMany({ _id: { $in: userIdsForCleaning } }); // Clean up specific test users
           await mongoose.connection.close();
       });

       describe('Rental Lifecycle API Tests', () => {
        /**
         * TC-029: Rental Creation & Cost Calculation
         * Goal: Verify that creating a rental calculates the cost correctly 
         * and flips the Asset status to 'Rented'.
         */
        test('TC-029: Should create rental with calculated cost and update Asset status', async () => {
        // 1. Setup: Create an Available Asset
        const testAsset = await Asset.create({
            name: 'Generic Test Asset',
            dailyRate: 50.00,
            status: 'Available',
            category: 'Scaffolding'
        });

        const mockRenter = {
            firstName: 'Test',
            lastName: 'Renter',
            email: 'jestRenter@test.com',
            phone: '123-456-7890'
        };

        const createdRenter = await request(app)
            .post('/api/renters')
            .set('x-auth-token', testToken)
            .send(mockRenter);
        const renterId = createdRenter.body._id;

        // 2. Define a 3-day rental period
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        const rentalData = {
            asset: testAsset._id,
            renter: renterId,
            returnDate: threeDaysLater
        };

        // 3. Action: Create Rental
        const res = await request(app)
            .post('/api/rentals')
            .set('x-auth-token', testToken)
            .send(rentalData);

            // 4. Assertions
            expect(res.statusCode).toBe(201);
            expect(res.body.totalCost).toBe(150.00); // 3 days * $50.00
            
            // Integrity Check: Is the Asset now marked as Rented?
            const updatedAsset = await Asset.findById(testAsset._id);
            expect(updatedAsset.status).toBe('Rented');

            // Track IDs for cleanup
            rentalIdsForCleaning.push(res.body._id);
            assetIdsForCleaning.push(testAsset._id);
            renterIdsForCleaning.push(renterId);
            createdRental = res.body; // Store for use in return tests
        });

        /**
         * TC-030: Return Logic & Maintenance Trigger
         * Goal: Verify returning an asset completes the rental 
         * and moves the asset to 'Maintenance'.
         */
        test('TC-030: Should complete rental and move Asset to Maintenance on return', async () => {
            // Setup: Use the asset from the previous test (it is currently 'Rented')
            const res = await request(app)
                .put(`/api/rentals/return/${createdRental.asset}`)
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('Completed');

            // Integrity Check: Is the Asset now in Maintenance?
            const updatedAsset = await Asset.findById(createdRental.asset);
            expect(updatedAsset.status).toBe('Maintenance');
        });

        /**
         * TC-031: Data Persistence Accuracy
         * Goal: Verify all IDs and dates are saved correctly in the Rental record.
         */
        test('TC-031: Should persist correct Renter and Asset IDs in the rental record', async () => {
            const rental = await Rental.findOne({ _id: createdRental._id });
            expect(rental.asset.toString()).toBe(createdRental.asset.toString());
            expect(rental.renter._id.toString()).toBe(createdRental.renter.toString());
            expect(rental).toHaveProperty('totalCost');
        });

        /**
         * TC-032: Comprehensive Rental History (GET)
         * Goal: Verify the system returns all records with populated Asset and Renter details.
         */
        test('TC-032: Should retrieve all rentals with populated references', async () => {
            const res = await request(app)
                .get('/api/rentals')
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            
            // Integrity Check: Verify 'populate' worked
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('asset.name');
                expect(res.body[0]).toHaveProperty('renter.firstName');
            }
        });

        /**
         * TC-033: Active Filter Accuracy
         * Goal: Verify the /active endpoint only returns rentals that haven't been returned yet.
         */
        test('TC-033: Should only return rentals with "Active" status', async () => {
            const res = await request(app)
                .get('/api/rentals/active')
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(200);
            // Logic Check: Every returned item must be 'Active'
            const allActive = res.body.every(rental => rental.status === 'Active');
            expect(allActive).toBe(true);
        });
    });

    describe('Rental API Negative Tests', () => {
        /**
         * TC-034: Double Rental Prevention
         * Goal: Verify the system blocks a rental if the asset is not 'Available'.
         */
        test('TC-034: Should block rental if asset status is Rented or Maintenance', async () => {
            // 1. Setup: Create an asset that is already Rented
            const busyAsset = await Asset.create({
                name: 'Busy Test Asset',
                dailyRate: 100,
                status: 'Rented',
                category: 'Scaffolding'
            });

            // Define a 3-day rental period
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);

            const rentalData = {
                asset: busyAsset._id,
                renter: new mongoose.Types.ObjectId(),
                returnDate: threeDaysLater
            };

            // 2. Action: Try to rent the busy asset
            const res = await request(app)
                .post('/api/rentals')
                .set('x-auth-token', testToken)
                .send(rentalData);

            // 3. Assertion: Logic in rentalRoutes.js should block this
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Asset is not available for rent");

            // Mark for Cleanup
            assetIdsForCleaning.push(busyAsset._id);
        });

        /**
         * TC-035: Non-Existent Asset Rental
         * Goal: Verify the system returns a 404 for an invalid assetId.
         */
        test('TC-035: Should return 404 when renting an asset that does not exist', async () => {
            const fakeAssetId = new mongoose.Types.ObjectId();

            // 2. Define a 3-day rental period
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);

            const res = await request(app)
                .post('/api/rentals')
                .set('x-auth-token', testToken)
                .send({
                    asset: fakeAssetId,
                    renter: new mongoose.Types.ObjectId(),
                    returnDate: threeDaysLater
                });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Asset not found");
        });

        /**
         * TC-036: Return Logic for Inactive Rentals
         * Goal: Verify 404 is returned if no 'Active' rental exists for the asset.
         */
        test('TC-036: Should return 404 when trying to return an asset with no active rental', async () => {
            const freshAsset = await Asset.create({ 
                name: 'Idle Drill', 
                status: 'Available', 
                category: 'Scaffolding', 
                dailyRate: 20 
            });

            const res = await request(app)
                .put(`/api/rentals/return/${freshAsset._id}`)
                .set('x-auth-token', testToken);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Rental not found");

            // Mark for Cleanup
            assetIdsForCleaning.push(freshAsset._id);
        });

        /**
         * TC-037: Duplicate Return Prevention
         * Goal: Verify the system blocks returning an already 'Completed' rental.
         */
        test('TC-037: Should block return request if rental is already Completed', async () => {
            // 1. Setup: Create a completed rental record
            const finishedAsset = await Asset.create({ 
                name: 'Finished Test Asset', 
                status: 'Maintenance', 
                category: 'Scaffolding', 
                dailyRate: 15 
            });

            await Rental.create({
                asset: finishedAsset._id,
                renter: new mongoose.Types.ObjectId(),
                status: 'Completed',
                totalCost: 50,
                returnDate: new Date()
            });

            // 2. Action: Try to return it again
            const res = await request(app)
                .put(`/api/rentals/return/${finishedAsset._id}`)
                .set('x-auth-token', testToken);

            // If it doesn't find an active one, it should hit the 404 block.
            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe("Rental not found");

            // Cleanup: Remove the finished asset and rental
            assetIdsForCleaning.push(finishedAsset._id);
            rentalIdsForCleaning.push(res.body._id);
        });
    });

    describe('Rental Data Security & Integrity Tests', () => {
        /**
        * TC-038: Unauthorized Transaction Attempt
        * Goal: Verify that the rental transaction endpoints are protected.
        */
        test('TC-038: Should reject rental creation and return if no token is provided', async () => {
            const testAsset = await Asset.create({
                name: 'Generic Test Asset',
                dailyRate: 50.00,
                status: 'Available',
                category: 'Scaffolding'
            });
            
            // Attempt POST
            const postRes = await request(app)
                .post('/api/rentals')
                .send({ asset: testAsset._id });

            // Attempt PUT
            const putRes = await request(app)
                .put(`/api/rentals/return/${testAsset._id}`);

            expect(postRes.statusCode).toBe(401);
            expect(putRes.statusCode).toBe(401);
        });

        /**
         * TC-039: Date Calculation Integrity
         * Goal: Verify that a same-day rental defaults to 1 full day of cost.
         */
        test('TC-039: Should charge a minimum of 1 day for same-day returns', async () => {
            const testAsset = await Asset.create({
                name: 'Test Asset for Same-Day Rental',
                dailyRate: 40.00,
                status: 'Available',
                category: 'Scaffolding'
            });

            // Set return date to "now" (same as rent date)
            const sameDayReturn = new Date();

            const res = await request(app)
                .post('/api/rentals')
                .set('x-auth-token', testToken)
                .send({
                    asset: testAsset._id,
                    renter: new mongoose.Types.ObjectId(),
                    returnDate: sameDayReturn
                });

            expect(res.statusCode).toBe(201);
            // Logic: diffDays = Math.ceil(0) || 1; 1 * 40 = 40
            expect(res.body.totalCost).toBe(40.00);

            // Mark for Cleanup
            rentalIdsForCleaning.push(res.body._id);
            assetIdsForCleaning.push(testAsset._id);
        });

        /**
         * TC-040: Cascading State Check (Safety Workflow)
         * Goal: Verify the Asset status is strictly 'Maintenance' after a return.
         */
        test('TC-040: Should ensure Asset status transitions strictly to Maintenance', async () => {
            // 1. Setup: Create an active rental
            const asset = await Asset.create({ 
                name: 'Test Asset for Return Status Check', 
                status: 'Available',
                dailyRate: 60,
                category: 'Scaffolding'   
                });

            // 2. Define a 3-day rental period
            const today = new Date();
            const threeDaysLater = new Date();
            threeDaysLater.setDate(today.getDate() + 3);

            const rental = await request(app)
                .post('/api/rentals')
                .set('x-auth-token', testToken)
                .send({
                    asset: asset._id,
                    renter: new mongoose.Types.ObjectId(),
                    returnDate: threeDaysLater
                });

            // 2. Action: Perform the return
            await request(app)
                .put(`/api/rentals/return/${asset._id}`)
                .set('x-auth-token', testToken);

            // 3. Assertion: Status must be 'Maintenance', NOT 'Available'
            const updatedAsset = await Asset.findById(asset._id);
            expect(updatedAsset.status).toBe('Maintenance');
            expect(updatedAsset.status).not.toBe('Available');

            // Mark for Cleanup
            rentalIdsForCleaning.push(rental.body._id);
            assetIdsForCleaning.push(asset._id);
        });
    });
});