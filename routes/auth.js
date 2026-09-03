const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { registerValidators, loginValidators } = require('../utils/validators');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', authLimiter, registerValidators, validate, register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Вход в аккаунт
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Неверный email или пароль
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authLimiter, loginValidators, validate, login);

module.exports = router;
