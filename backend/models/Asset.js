const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { 
  type: String, 
  required: [true, 'Please provide the name of the tool'],
  trim: true 
},
  category: { 
    type: String, 
    required: true, 
    enum: ['Power Tools', 'Scaffolding', 'Generators', 'Lifts', 'Hand Tools', 'Cleaning', 'Other', 'Test' ] 
  },
  dailyRate: { 
    type: Number, 
    required: true, 
    min: [0, 'Rental rate cannot be negative'] // QA Validation
  },
  status: { 
    type: String, 
    enum: ['Available', 'Rented', 'Maintenance'], 
    default: 'Available' 
  },
  lastInspection: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);