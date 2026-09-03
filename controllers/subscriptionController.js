const Subscription = require('../models/Subscription');
const PaymentHistory = require('../models/PaymentHistory');
const { generateSchedule, cancelScheduledPayments, regenerateSchedule } = require('../utils/generateSchedule');

// GET /api/subscriptions — list user's subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching subscriptions' });
  }
};

// POST /api/subscriptions — create subscription + auto-generate payment schedule
exports.createSubscription = async (req, res) => {
  try {
    const {
      serviceName,
      category,
      cost,
      billingCycle,
      customCycleDays,
      startDate,
    } = req.body;

    // Validate customCycleDays when billingCycle is 'custom'
    if (billingCycle === 'custom' && (!customCycleDays || customCycleDays < 1)) {
      return res.status(400).json({
        message: 'customCycleDays is required and must be at least 1 when billingCycle is custom',
      });
    }

    const subscription = await Subscription.create({
      user: req.userId,
      serviceName,
      category,
      cost,
      billingCycle,
      customCycleDays: billingCycle === 'custom' ? customCycleDays : undefined,
      startDate,
      status: 'active',
    });

    // Auto-generate payment schedule
    await generateSchedule(subscription);

    // Reload to get the updated nextPaymentDate
    const populatedSub = await Subscription.findById(subscription._id);

    res.status(201).json(populatedSub);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating subscription' });
  }
};

// GET /api/subscriptions/:id — get one subscription with payment history
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const paymentHistory = await PaymentHistory.find({
      subscription: subscription._id,
    }).sort({ date: 1 });

    res.json({ ...subscription.toObject(), paymentHistory });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error fetching subscription' });
  }
};

// PUT /api/subscriptions/:id — update subscription + regenerate schedule
exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const {
      serviceName,
      category,
      cost,
      billingCycle,
      customCycleDays,
      startDate,
      status,
    } = req.body;

    // Validate customCycleDays when billingCycle is 'custom'
    const effectiveCycle = billingCycle || subscription.billingCycle;
    const effectiveCustomDays = customCycleDays !== undefined ? customCycleDays : subscription.customCycleDays;
    if (effectiveCycle === 'custom' && (!effectiveCustomDays || effectiveCustomDays < 1)) {
      return res.status(400).json({
        message: 'customCycleDays is required and must be at least 1 when billingCycle is custom',
      });
    }

    // Update fields
    if (serviceName !== undefined) subscription.serviceName = serviceName;
    if (category !== undefined) subscription.category = category;
    if (cost !== undefined) subscription.cost = cost;
    if (billingCycle !== undefined) subscription.billingCycle = billingCycle;
    if (customCycleDays !== undefined) subscription.customCycleDays = customCycleDays;
    if (startDate !== undefined) subscription.startDate = startDate;
    if (status !== undefined) subscription.status = status;

    // Clear customCycleDays if not custom cycle
    if (subscription.billingCycle !== 'custom') {
      subscription.customCycleDays = undefined;
    }

    await subscription.save();

    // Regenerate payment schedule from nextPaymentDate
    await regenerateSchedule(subscription);

    // Reload
    const updated = await Subscription.findById(subscription._id);

    res.json(updated);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error updating subscription' });
  }
};

// DELETE /api/subscriptions/:id — delete subscription + its payment history
exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Delete all payment history for this subscription
    await PaymentHistory.deleteMany({ subscription: subscription._id });

    // Delete the subscription
    await subscription.deleteOne();

    res.json({ message: 'Subscription and its payment history deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error deleting subscription' });
  }
};

// PATCH /api/subscriptions/:id/pause — set status to paused, cancel scheduled payments
exports.pauseSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Only active subscriptions can be paused' });
    }

    subscription.status = 'paused';
    await subscription.save();

    // Cancel all scheduled payments
    await cancelScheduledPayments(subscription._id);

    res.json(subscription);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error pausing subscription' });
  }
};

// PATCH /api/subscriptions/:id/cancel — set status to cancelled, cancel scheduled payments
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Subscription is already cancelled' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // Cancel all scheduled payments
    await cancelScheduledPayments(subscription._id);

    res.json(subscription);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error cancelling subscription' });
  }
};

// PATCH /api/subscriptions/:id/resume — set status back to active, regenerate schedule
exports.resumeSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'active') {
      return res.status(400).json({ message: 'Subscription is already active' });
    }

    subscription.status = 'active';

    // Set nextPaymentDate to now if it's in the past or doesn't exist
    if (!subscription.nextPaymentDate || subscription.nextPaymentDate < new Date()) {
      subscription.nextPaymentDate = new Date();
    }

    await subscription.save();

    // Regenerate payment schedule
    await generateSchedule(subscription, subscription.nextPaymentDate);

    // Reload
    const updated = await Subscription.findById(subscription._id);

    res.json(updated);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid subscription ID' });
    }
    res.status(500).json({ message: 'Server error resuming subscription' });
  }
};
