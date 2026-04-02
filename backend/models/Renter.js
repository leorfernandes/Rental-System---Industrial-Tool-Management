const mongoose = require('mongoose');

const RenterSchema = new mongoose.Schema({
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    membershipDate: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Renter', RenterSchema);