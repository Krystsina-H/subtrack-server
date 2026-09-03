const PaymentHistory = require('../models/PaymentHistory');
const Subscription = require('../models/Subscription');
const mongoose = require('mongoose');

// GET /api/payments — list user's payments with query filters
exports.getPayments = async (req, res) => {
  try {
    const { month, year, dateFrom, dateTo, status, category, subscriptionId } = req.query;

    const filter = { user: req.userId };

    // Filter by subscription
    if (subscriptionId) {
      filter.subscription = subscriptionId;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        filter.date.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filter.date.$lte = to;
      }
    } else if (month || year) {
      filter.date = {};
      if (year) {
        const y = parseInt(year, 10);
        const m = month ? parseInt(month, 10) - 1 : 0;
        const mEnd = month ? parseInt(month, 10) : 12;

        if (month) {
          const startDate = new Date(y, m, 1);
          const endDate = new Date(y, mEnd, 0, 23, 59, 59, 999);
          filter.date = { $gte: startDate, $lte: endDate };
        } else {
          const startDate = new Date(y, 0, 1);
          const endDate = new Date(y, 11, 31, 23, 59, 59, 999);
          filter.date = { $gte: startDate, $lte: endDate };
        }
      }
    }

    // If category filter, find subscription IDs matching that category first
    let categorySubscriptionIds = null;
    if (category) {
      const subs = await Subscription.find({ user: req.userId, category }).select('_id');
      categorySubscriptionIds = subs.map((s) => s._id);
      filter.subscription = { $in: categorySubscriptionIds };
      // If both subscriptionId and category, intersection
      if (subscriptionId) {
        if (!categorySubscriptionIds.some((id) => id.toString() === subscriptionId)) {
          return res.json([]); // No overlap
        }
        filter.subscription = subscriptionId;
      }
    }

    const payments = await PaymentHistory.find(filter)
      .populate('subscription', 'serviceName category billingCycle')
      .sort({ date: 1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

// GET /api/payments/monthly-summary — aggregate total + by-category for a given month/year
exports.getMonthlySummary = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-indexed
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Total amount for the month (only paid)
    const totalResult = await PaymentHistory.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          date: { $gte: startDate, $lte: endDate },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // By-category breakdown
    // First, get subscription IDs and their categories
    const userSubscriptions = await Subscription.find({ user: req.userId }).select('_id category');
    const subCategoryMap = {};
    userSubscriptions.forEach((s) => {
      subCategoryMap[s._id.toString()] = s.category;
    });

    const paymentsInMonth = await PaymentHistory.find({
      user: req.userId,
      date: { $gte: startDate, $lte: endDate },
      status: 'paid',
    }).select('subscription amount status');

    // Group by category
    const byCategory = {};
    paymentsInMonth.forEach((payment) => {
      const cat = subCategoryMap[payment.subscription.toString()] || 'Другое';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, count: 0 };
      }
      byCategory[cat].total += payment.amount;
      byCategory[cat].count += 1;
    });

    // Convert to array
    const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }));

    res.json({
      month,
      year,
      total: totalResult.length > 0 ? totalResult[0].total : 0,
      count: totalResult.length > 0 ? totalResult[0].count : 0,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching monthly summary' });
  }
};

// GET /api/payments/yearly-summary — aggregate total + by-category for a calendar year
exports.getYearlySummary = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // Total amount for the year (only paid)
    const totalResult = await PaymentHistory.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          date: { $gte: startDate, $lte: endDate },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get subscription categories
    const userSubscriptions = await Subscription.find({ user: req.userId }).select('_id category');
    const subCategoryMap = {};
    userSubscriptions.forEach((s) => {
      subCategoryMap[s._id.toString()] = s.category;
    });

    const paymentsInYear = await PaymentHistory.find({
      user: req.userId,
      date: { $gte: startDate, $lte: endDate },
      status: 'paid',
    }).select('subscription amount status date');

    // Group by category
    const byCategory = {};
    paymentsInYear.forEach((payment) => {
      const cat = subCategoryMap[payment.subscription.toString()] || 'Другое';
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, count: 0 };
      }
      byCategory[cat].total += payment.amount;
      byCategory[cat].count += 1;
    });

    // Group by month
    const byMonth = {};
    paymentsInYear.forEach((payment) => {
      const m = payment.date.getMonth();
      if (!byMonth[m]) {
        byMonth[m] = { total: 0, count: 0 };
      }
      byMonth[m].total += payment.amount;
      byMonth[m].count += 1;
    });

    const categoryBreakdown = Object.entries(byCategory).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }));

    const monthlyBreakdown = Object.entries(byMonth)
      .sort(([a], [b]) => a - b)
      .map(([monthIndex, data]) => ({
        month: parseInt(monthIndex, 10) + 1,
        total: data.total,
        count: data.count,
      }));

    res.json({
      year,
      total: totalResult.length > 0 ? totalResult[0].total : 0,
      count: totalResult.length > 0 ? totalResult[0].count : 0,
      categoryBreakdown,
      monthlyBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching yearly summary' });
  }
};

// PATCH /api/payments/:id/status — manually change payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['scheduled', 'paid', 'missed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: scheduled, paid, missed, cancelled',
      });
    }

    const payment = await PaymentHistory.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    payment.autoGenerated = false; // Manual change
    await payment.save();

    res.json(payment);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }
    res.status(500).json({ message: 'Server error updating payment status' });
  }
};
