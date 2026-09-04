const PaymentHistory = require('../models/PaymentHistory');
const Subscription = require('../models/Subscription');

/**
 * Do not infer a successful payment from its due date. A payment can be
 * explicitly marked as paid by the user; overdue scheduled payments stay
 * visible until then.
 */
async function autoMarkPaid() {
  return { modifiedCount: 0 };
}

/**
 * Update nextPaymentDate for all active subscriptions
 * to the earliest scheduled payment, including an overdue one. This keeps a
 * missed payment actionable instead of silently moving the next due date.
 */
async function syncNextPaymentDates() {
  try {
    const activeSubs = await Subscription.find({ status: 'active' });
    for (const sub of activeSubs) {
      const nextPayment = await PaymentHistory.findOne({
        subscription: sub._id,
        status: 'scheduled',
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
 * Synchronize due dates on startup and every hour. Payment status is never
 * changed automatically.
 */
function startAutoPayJob() {
  // Run immediately on startup
  syncNextPaymentDates();

  // Run every hour
  setInterval(() => {
    syncNextPaymentDates();
  }, 60 * 60 * 1000);
}

module.exports = { autoMarkPaid, syncNextPaymentDates, startAutoPayJob };
