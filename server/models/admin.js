const mongoose = require('mongoose');
const validator = require('validator');

const adminSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['superuser', 'admin'],
            message: '{VALUE} is not a valid role'
        },
        default: 'admin'
    },
    permissions: {
        type: [{
            type: String,
            enum: {
                values: [
                    'manageUsers',
                    'manageJobs',
                    'manageBids',
                    'manageTransactions',
                    'viewReports',
                    'manageAdmins',
                    'manageSettings'
                ],
                message: '{VALUE} is not a valid permission'
            }
        }],
        default: []
    },
    wallet: {
        balance: {
            type: Number,
            default: 0,
            min: [0, 'Wallet balance cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD'
        },
        lastTransaction: {
            type: Date
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ status: 1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
    return this.name;
});

// Instance method to check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

// Static method to find active admins
adminSchema.statics.findActive = function() {
    return this.find({ status: 'active' });
};

module.exports = mongoose.model("Admin", adminSchema);
