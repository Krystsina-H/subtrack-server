const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative'],
  },
  billingCycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    required: [true, 'Billing cycle is required'],
  },
  customCycleDays: {
    type: Number,
    min: [1, 'Custom cycle days must be at least 1'],
    validate: {
      validator: function (v) {
        // Only required when billingCycle is 'custom'
        return this.billingCycle !== 'custom' || (v != null && v > 0);
      },
      message: 'customCycleDays is required when billingCycle is custom',
    },
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  nextPaymentDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries by user
subscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
