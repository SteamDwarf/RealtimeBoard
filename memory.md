Пет-проект: Платформа интерактивных комнат планирования (Real-time Board)

## 1. Стек технологий и Production-принципы

- **Backend:** Nest.js (TypeScript) + WebSockets (Socket.io) + Redis Adapter (для Pub/Sub горизонтального масштабирования сокетов).
- **ORM / База данных:** Prisma ORM + PostgreSQL (в Docker). Используются Driver Adapters (`@prisma/adapter-pg`) для повышения производительности.
- **Валидация:** Zod v4 (сквозная валидация, разделяемая между бэком и фронтом).
- **Подход к коду:** Строгий TypeScript, использование Production-ready паттернов, отсутствие deprecated методов. К читателю кода/документации обращаться на "ты".

---

## 2. Текущая Структура проекта

```text
realtime-board/
├── backend/
│   ├── src/
│   │   ├── common/
│   │   │   ├── adapters/
│   │   │   │   └── redis-io.adapter.ts     # WS адаптер масштабирования через Redis
│   │   │   └── pipes/
│   │   │   │   └── zod-validation.pipe.ts  # Изолированный валидатор для @Body()
│   │   │   prisma/
│   │   │   └── prisma.service.ts           # Сервис БД на PrismaPg адаптере
│   │   ├── modules/
│   │   │   ├── rooms/                      # REST API управления комнатами
│   │   │   └── board-gateway/              # WebSocket слой для real-time
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma                   # Схема БД (генерация в кастомный путь)
│   └── .env
└── docker-compose.yml                      # Инфраструктура (Postgres + Redis)
```

3. Что уже реализовано и работает
   Инфраструктура (docker-compose.yml)
   Подняты локальные контейнеры для PostgreSQL (порт 5432) и Redis (порт 6379). Локальный Nest.js работает с ними напрямую.

База данных (prisma/schema.prisma)
Спроектированы 3 базовые сущности: User, Room и BoardObject (фигуры на доске).

Настроены каскадные удаления (onDelete: Cascade для объектов комнаты) и зануление связей при выходе юзера (onDelete: SetNull).

REST API (modules/rooms)
Реализован полный CRUD для управления комнатами (POST, GET :id, PATCH :id, DELETE :id).

Валидация входных данных для REST изолирована на уровне @Body() с помощью ZodValidationPipe и схем Zod.

Real-time слой (modules/board-gateway)
Настроен RedisIoAdapter для управления сессиями сокетов через Redis Pub/Sub. Исправлена ошибка отложенной инициализации TypeScript через оператор !.

Реализовано и протестировано WebSocket-событие 'room:join'.

Внутри Gateway добавлен слой нормализации входящих данных (парсинг строк в JSON-объекты для совместимости со сторонними HTTP-клиентами вроде Postman/Bruno) и валидация через Zod-схему (UUID проверяется регулярным выражением для обхода deprecated методов Zod v4).

4. Контракты данных (Contracts & DTOs)
   REST: Создание / Обновление комнаты

```typescript
// z.string().min(2).max(50)
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, "Название комнаты должно быть не менее 2 символов")
    .max(50),
});
export const updateRoomSchema = createRoomSchema.partial();
```

WebSocket: Вход в комнату (room:join)

```typescript
export const joinRoomSchema = z.object({
  roomId: z.uuid("ID комнаты должен быть валидным UUID"),
  userName: z.string().min(2),
});
```

5.  Следующие шаги разработки (Бэклог)
    При возобновлении сессии необходимо двигаться по следующему плану:
    1. Доработка WebSocket событий на бэкенде (Завершение MVP бэка):
    - Реализовать событие object:create (создание новой карточки в БД через Prisma и бродкаст остальным участникам).
    - Реализовать событие object:move (миграция координат карточки $\{x, y\}$).
    - Архитектурный вызов: Спроектировать логику (оптимизация через Redis или прямая запись в Postgres с throttling, чтобы частые апдейты координат не забивали пул соединений БД).
    2. Инициализация Фронтенда:
    - Развернуть React + TypeScript + Vite.
    - Настроить архитектуру по методологии Feature-Sliced Design (FSD).
    - Установить и настроить socket.io-client, Zustand (клиентский стейт) и TanStack Query (серверный стейт комнат).
    3. Интеграция фронта и бэка:
    - Написание Drag-and-Drop холста с real-time синхронизацией.
