require('dotenv').config();
const mongoose = require('mongoose');
const Asset = require('./models/Asset');

const seedAssets = [
  { name: "Industrial Jackhammer", category: "Power Tools", dailyRate: 85, status: "Available" },
  { name: "Scaffolding Tower (5m)", category: "Scaffolding", dailyRate: 45, status: "Available" },
  { name: "Heavy Duty Generator", category: "Generators", dailyRate: 120, status: "Maintenance" },
  { name: "Laser Level Kit", category: "Power Tools", dailyRate: 30, status: "Rented" },
  { name: "Demolition Saw", category: "Power Tools", dailyRate: 65, status: "Available" },
  { name: "Extension Ladder (10m)", category: "Scaffolding", dailyRate: 25, status: "Available" }
];

const importData = async () => {
  try {
    // 1. Connect using your existing logic    
    const {
            MONGO_USER,
            MONGO_PASS,
            MONGO_HOST,
            MONGO_DB
          } = process.env;
      
          const mongoURI = `mongodb+srv://${MONGO_USER}:${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}/${MONGO_DB}`;
      
          await mongoose.connect(mongoURI);
      
          console.log("MongoDB connected");

    // 2. Clear existing data (Careful! This wipes the collection)
    await Asset.deleteMany();
    
    // 3. Insert the new data
    await Asset.insertMany(seedAssets);

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error('Error with data import:', error);
    process.exit(1);
  }
};

importData();