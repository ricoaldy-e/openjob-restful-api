# OpenJob RESTful API 🚀

> Advanced Back-End RESTful API for a Job Portal platform, built with Node.js, Express, PostgreSQL, Redis, and RabbitMQ. 

A robust, scalable backend solution designed to handle complex relational data, asynchronous processing, and high-traffic caching for modern job portal platforms.

## 🌟 Key Features

This API provides a complete backend infrastructure for a job portal, including user management, job postings, asynchronous email notifications, and high-performance caching.

1. **Authentication & User Management** 🔐
   - User registration and login with encrypted passwords (`bcrypt`).
   - Secure authentication flow using JSON Web Tokens (JWT).
   - Complete token management (Access Token & Refresh Token).

2. **Core Job Portal Operations** 💼
   - CRUD operations for Companies, Categories, and Jobs.
   - Job application system for users.
   - Job bookmarking feature.
   - Relational database structure utilizing strict SQL `JOIN` queries.

3. **PDF Document Management** 📄
   - Multipart/form-data support using `multer`.
   - Strict file validation: Accepts only `.pdf` files up to 5MB.
   - Secure binary serving endpoint.

4. **High-Performance Caching (Redis)** ⚡
   - Server-side caching for heavily accessed endpoints (Profile, Companies, Applications, Bookmarks).
   - Dynamic cache invalidation triggered automatically upon data mutations.
   - Custom `X-Data-Source` HTTP headers.

5. **Asynchronous Processing (RabbitMQ)** 🐇
   - "Fire-and-forget" email notification system.
   - Separate standalone consumer process to handle message queues via `amqplib`.
   - Email dispatch mechanism utilizing `Nodemailer`.

---

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL (with `pg` and `node-pg-migrate`)
- **Caching:** Redis (via `ioredis`)
- **Message Broker:** RabbitMQ (via `amqplib`)
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Validation:** Joi
- **Email Service:** Nodemailer

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have the following installed and running locally:
- PostgreSQL
- Redis Server (default port `6379`)
- RabbitMQ Server (default port `5672`)

### 2. Environment Variables
Duplicate `.env.example` to `.env` and fill in your credentials:
```env
# Database Configuration
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=your_password
PGDATABASE=openjob_api
PGPORT=5432

# Token Configuration
ACCESS_TOKEN_KEY=your_super_secret_access_key
REFRESH_TOKEN_KEY=your_super_secret_refresh_key
ACCESS_TOKEN_AGE=1800

# Redis & RabbitMQ
REDIS_HOST=127.0.0.1
RABBITMQ_HOST=amqp://localhost

# SMTP Configuration (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### 3. Installation & Migration
```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate:up
```

### 4. Running the Application
Because this project utilizes a message broker for asynchronous processing, you must run both the API server and the background consumer in **separate terminal windows**:

**Terminal 1: API Server**
```bash
npm run start:dev
```

**Terminal 2: RabbitMQ Consumer**
```bash
npm run start:consumer
```

---

## 🧪 Testing

This API is strictly tested against the **OpenJob API Postman Collection**.

**Important Note for Postman Testing:**
Due to Postman Collection Runner's limitations with local file uploads, the `Documents` folder must be tested **manually** by attaching a valid PDF file via the `form-data` tab in the request body. All other tests will pass 100% via the automated Collection Runner.

---

*Developed by Fesst.*