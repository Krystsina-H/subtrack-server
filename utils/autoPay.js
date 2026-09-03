const PaymentHistory = require('../models/PaymentHistory');
const Subscription = require('../models/Subscription');

/**
 * Mark all scheduled payments with date <= now as paid.
 * Called on server startup and periodically.
 */
async function autoMarkPaid() {
  try {
    const now = new Date();
    const result = await PaymentHistory.updateMany(
      { status: 'scheduled', date: { $lte: now } },
      { $set: { status: 'paid' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[AutoPay] ${result.modifiedCount} payment(s) marked as paid`);
    }
  } catch (err) {
    console.error('[AutoPay] Error:', err.message);
  }
}

/**
 * Update nextPaymentDate for all active subscriptions
 * to the earliest scheduled (or future) payment.
 */
async function syncNextPaymentDates() {
  try {
    const activeSubs = await Subscription.find({ status: 'active' });
    for (const sub of activeSubs) {
      const nextPayment = await PaymentHistory.findOne({
        subscription: sub._id,
        status: 'scheduled',
        date: { $gte: new Date() },
      }).sort({ date: 1 });

      if (nextPayment) {
        sub.nextPaymentDate = nextPayment.date;
      } else {
        const lastPaid = await PaymentHistory.findOne({
          subscription: sub._id,
          status: 'paid',
        }).sort({ date: -1 });
        sub.nextPaymentDate = lastPaid ? lastPaid.date : null;
      }
      await sub.save();
    }
  } catch (err) {
    console.error('[SyncNext] Error:', err.message);
  }
}

/**
 * Run both tasks and schedule them every hour.
 */
function startAutoPayJob() {
  // Run immediately on startup
  autoMarkPaid().then(() => syncNextPaymentDates());

  // Run every hour
  setInterval(() => {
    autoMarkPaid().then(() => syncNextPaymentDates());
  }, 60 * 60 * 1000);
}

module.exports = { autoMarkPaid, syncNextPaymentDates, startAutoPayJob };
