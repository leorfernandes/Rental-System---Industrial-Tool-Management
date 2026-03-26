const request = require('supertest');
const app = require('../backend/server');
const Asset = require('../backend/models/Asset');
const Rental = require('../backend/models/Rental');

describe('Rental Logic Tests', () => {
  // CLEANUP AFTER EACH TEST
  afterEach(async () => {
    await Asset.deleteMany({ name: "Test Tool" }); // Delete specific test assets
    await Rental.deleteMany({ customerName: "Test User" }); // Delete specific test rentals
  });

  it('should calculate the correct price for a 10-day rental', async () => {
    // 1. Setup: Create a temporary asset
    const asset = await Asset.create({
      name: "Test Tool",
      category: "Power Tools",
      dailyRate: 100, // $100 for easy math
      status: "Available"
    });

    // 2. Action: Rent it for 10 days from now
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

    const res = await request(app)
      .post('/api/rentals')
      .send({
        asset: asset._id,
        customerName: "Test User",
        returnDate: tenDaysFromNow
      });

    // 3. Assertion: Expected Cost = 10 * 100 = 1000
    expect(res.statusCode).toBe(201);
    expect(res.body.totalCost).toBe(1000);
    
    // 4. Verify Asset is now Rented
    const updatedAsset = await Asset.findById(asset._id);
    expect(updatedAsset.status).toBe('Rented');

  });

  it('should mark rental as completed and move asset to Maintenance', async () => {
    // 1. Setup: Create an asset that is currently 'Rented'
    const asset = await Asset.create({
      name: "Test Tool",
      category: "Cleaning",
      dailyRate: 40,
      status: "Rented" 
    });

    // 2. Setup: Create an active rental for this asset
    const rental = await Rental.create({
      asset: asset._id,
      customerName: "Test User",
      returnDate: new Date(),
      status: "Active"
    });

    // 3. Action: Call the Return endpoint
    const res = await request(app).put(`/api/rentals/${rental._id}/return`).send();

    // 4. Assertions
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("Completed");

    // 5. THE QA CHECK: Is the asset now in Maintenance?
    const updatedAsset = await Asset.findById(asset._id);
    expect(updatedAsset.status).toBe("Maintenance");
  });
});