const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');
const { updateProfileValidators } = require('../utils/validators');
const validate = require('../middleware/validate');

// All routes are protected
router.use(auth);

/**
 * @openapi
 * /user/profile:
 *   get:
 *     summary: Получить профиль пользователя
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Данные профиля
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 currency:
 *                   type: string
 *                   example: RUB
 *                 notifyDays:
 *                   type: integer
 *                   example: 3
 */
router.get('/profile', getProfile);

/**
 * @openapi
 * /user/profile:
 *   put:
 *     summary: Обновить профиль
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdate'
 *     responses:
 *       200:
 *         description: Профиль обновлён
 *       400:
 *         description: Ошибка валидации (неверный текущий пароль и т.д.)
 */
router.put('/profile', updateProfileValidators, validate, updateProfile);

module.exports = router;
