const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getSubscriptions,
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  pauseSubscription,
  cancelSubscription,
  resumeSubscription,
} = require('../controllers/subscriptionController');
const {
  createSubscriptionValidators,
  updateSubscriptionValidators,
  subscriptionIdValidator,
} = require('../utils/validators');
const validate = require('../middleware/validate');

// All routes are protected
router.use(auth);

/**
 * @openapi
 * /subscriptions:
 *   get:
 *     summary: Список подписок пользователя
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Список подписок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 */
router.get('/', getSubscriptions);

/**
 * @openapi
 * /subscriptions:
 *   post:
 *     summary: Создать подписку
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionCreate'
 *     responses:
 *       201:
 *         description: Подписка создана, расписание платежей сгенерировано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', createSubscriptionValidators, validate, createSubscription);

/**
 * @openapi
 * /subscriptions/{id}:
 *   get:
 *     summary: Получить подписку по ID
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID подписки
 *     responses:
 *       200:
 *         description: Данные подписки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Подписка не найдена
 */
router.get('/:id', subscriptionIdValidator, validate, getSubscription);

/**
 * @openapi
 * /subscriptions/{id}:
 *   put:
 *     summary: Обновить подписку
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionUpdate'
 *     responses:
 *       200:
 *         description: Подписка обновлена, расписание пересчитано
 *       404:
 *         description: Подписка не найдена
 */
router.put('/:id', subscriptionIdValidator, updateSubscriptionValidators, validate, updateSubscription);

/**
 * @openapi
 * /subscriptions/{id}:
 *   delete:
 *     summary: Удалить подписку
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Подписка удалена
 *       404:
 *         description: Подписка не найдена
 */
router.delete('/:id', subscriptionIdValidator, validate, deleteSubscription);

/**
 * @openapi
 * /subscriptions/{id}/pause:
 *   patch:
 *     summary: Приостановить подписку
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Подписка приостановлена, запланированные платежи отменены
 *       400:
 *         description: Подписка уже приостановлена или отменена
 */
router.patch('/:id/pause', subscriptionIdValidator, validate, pauseSubscription);

/**
 * @openapi
 * /subscriptions/{id}/cancel:
 *   patch:
 *     summary: Отменить подписку
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Подписка отменена, запланированные платежи отменены
 *       400:
 *         description: Подписка уже отменена
 */
router.patch('/:id/cancel', subscriptionIdValidator, validate, cancelSubscription);

/**
 * @openapi
 * /subscriptions/{id}/resume:
 *   patch:
 *     summary: Возобновить подписку
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Подписка возобновлена, расписание сгенерировано
 *       400:
 *         description: Подписка уже активна
 */
router.patch('/:id/resume', subscriptionIdValidator, validate, resumeSubscription);

module.exports = router;
