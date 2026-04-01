const mongoose = require('mongoose');

const RentalSchema = new mongoose.Schema({
  asset: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset', // This links to your Asset model
    required: true 
  },
  renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Renter',
      required: true
  },
  rentDate: { type: Date, default: Date.now },
  returnDate: { type: Date, required: true },
  totalCost: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Active', 'Completed', 'Late'], 
    default: 'Active' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Rental', RentalSchema);