const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SubTrack API',
      description: 'API для трекера подписок и платежей',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Локальный сервер',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@mail.com' },
            password: { type: 'string', minLength: 6, example: '123456' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@mail.com' },
            password: { type: 'string', minLength: 6, example: '123456' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '6501a1b2c3d4e5f6a7b8c9d0' },
                email: { type: 'string', example: 'user@mail.com' },
                currency: { type: 'string', example: 'RUB' },
              },
            },
          },
        },
        SubscriptionCreate: {
          type: 'object',
          required: ['serviceName', 'category', 'cost', 'billingCycle', 'startDate'],
          properties: {
            serviceName: { type: 'string', example: 'Netflix' },
            category: {
              type: 'string',
              enum: ['Стриминг', 'Музыка', 'Софт', 'Облако', 'Игры', 'Фитнес', 'Обучение', 'VPN', 'Другое'],
              example: 'Стриминг',
            },
            cost: { type: 'number', example: 890 },
            billingCycle: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
              example: 'monthly',
            },
            customCycleDays: { type: 'integer', description: 'Обязателен если billingCycle = custom', example: 15 },
            startDate: { type: 'string', format: 'date', example: '2026-01-15' },
          },
        },
        SubscriptionUpdate: {
          type: 'object',
          properties: {
            serviceName: { type: 'string', example: 'Netflix' },
            category: { type: 'string', enum: ['Стриминг', 'Музыка', 'Софт', 'Облако', 'Игры', 'Фитнес', 'Обучение', 'VPN', 'Другое'] },
            cost: { type: 'number', example: 990 },
            billingCycle: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'] },
            customCycleDays: { type: 'integer' },
            startDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['active', 'paused', 'cancelled'] },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            serviceName: { type: 'string', example: 'Netflix' },
            category: { type: 'string', example: 'Стриминг' },
            cost: { type: 'number', example: 890 },
            billingCycle: { type: 'string', example: 'monthly' },
            customCycleDays: { type: 'integer' },
            startDate: { type: 'string', format: 'date' },
            nextPaymentDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['active', 'paused', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaymentStatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['scheduled', 'paid', 'missed', 'cancelled'],
              example: 'paid',
            },
          },
        },
        UserProfileUpdate: {
          type: 'object',
          properties: {
            currency: { type: 'string', enum: ['RUB', 'USD', 'EUR', 'GBP', 'BYN'], example: 'RUB' },
            currentPassword: { type: 'string', description: 'Обязателен при смене пароля' },
            newPassword: { type: 'string', minLength: 6, description: 'Новый пароль' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Ошибка сервера' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
    ],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
