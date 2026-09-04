const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getPayments,
  getMonthlySummary,
  getYearlySummary,
  updatePaymentStatus,
} = require('../controllers/paymentController');
const {
  updatePaymentStatusValidators,
  paymentQueryValidators,
  paymentIdValidator,
} = require('../utils/validators');
const validate = require('../middleware/validate');

router.use(auth);

/**
 * @openapi
 * /payments/monthly-summary:
 *   get:
 *     summary: Сводка расходов за месяц (только оплаченные)
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Месяц (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Год
 *     responses:
 *       200:
 *         description: Сводка за месяц
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month:
 *                   type: integer
 *                 year:
 *                   type: integer
 *                 total:
 *                   type: number
 *                   description: Сумма оплаченных платежей
 *                 count:
 *                   type: integer
 *                 categoryBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       total:
 *                         type: number
 *                       count:
 *                         type: integer
 */
router.get('/monthly-summary', paymentQueryValidators, validate, getMonthlySummary);

/**
 * @openapi
 * /payments/yearly-summary:
 *   get:
 *     summary: Сводка расходов за календарный год (только оплаченные)
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Год
 *     responses:
 *       200:
 *         description: Сводка за год
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 year:
 *                   type: integer
 *                 total:
 *                   type: number
 *                   description: Сумма оплаченных платежей за год
 *                 count:
 *                   type: integer
 *                 categoryBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       total:
 *                         type: number
 *                       count:
 *                         type: integer
 *                 monthlyBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: integer
 *                       total:
 *                         type: number
 *                       count:
 *                         type: integer
 */
router.get('/yearly-summary', paymentQueryValidators, validate, getYearlySummary);

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: Список платежей с фильтрами
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Месяц (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Год
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, paid, missed, cancelled]
 *         description: Статус платежа
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Категория подписки
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *         description: ID подписки
 *     responses:
 *       200:
 *         description: Список платежей
 */
router.get('/', paymentQueryValidators, validate, getPayments);

/**
 * @openapi
 * /payments/{id}/status:
 *   patch:
 *     summary: Изменить статус платежа вручную
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID платежа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentStatusUpdate'
 *     responses:
 *       200:
 *         description: Статус обновлён
 *       400:
 *         description: Неверный статус
 *       404:
 *         description: Платёж не найден
 */
router.patch(
  '/:id/status',
  paymentIdValidator,
  updatePaymentStatusValidators,
  validate,
  updatePaymentStatus,
);

module.exports = router;
