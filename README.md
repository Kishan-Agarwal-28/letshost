# LetsHost Application

![LetsHost Banner](https://letshost.imgix.net/assets/Screenshot%202025-06-28%20160149.png?fm=webp)

---

## 🚀 Introduction

LetsHost is a modern, full-stack platform for hosting, managing, and analyzing digital content. Built for scalability, security, and developer experience, LetsHost combines a robust backend, a beautiful frontend, and advanced AI-powered services to deliver a seamless experience for creators and users alike.

---

## 📚 Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

- 🔐 **Authentication & Authorization**: Secure OAuth, JWT, and CSRF protection
- 📦 **Content Hosting & CDN**: Fast, reliable content delivery with AWS S3 and Cloudinary
- 🤖 **AI-Powered Analytics**: Gain insights with advanced analytics and vector search
- 💳 **Payment Processing**: Integrated payment gateways for monetization
- 🖼️ **Gallery & Media Management**: Organize and showcase digital assets
- 🌐 **Subdomain Management**: Custom subdomains for creators
- 📧 **Automated Email Notifications**: Transactional and marketing emails
- 🧠 **Vector Database Integration**: Fast, semantic search and recommendations
- 🖥️ **Modern Frontend**: Responsive, accessible, and beautiful UI

---

## 🏗️ Architecture

LetsHost is organized into four main components:

```
frontend/      # React + Vite + TypeScript SPA
backend/       # Node.js + Express REST API
embedder/      # Python FastAPI for AI embedding/vector ops
vectorbackend/ # Node.js service for vector DB management
```

- **Backend**: Handles business logic, authentication, storage, and integrations
- **Frontend**: Provides a fast, interactive user experience
- **Embedder**: Powers AI features like semantic search and recommendations
- **Vector Backend**: Manages vector database operations

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Lottie, modern CSS
- **Backend**: Node.js, Express, MongoDB, Redis, AWS S3, Cloudinary
- **AI/Embedder**: Python, FastAPI, vector DB

---

## 📁 Directory Structure

```
backend/
  controllers/   # Business logic
  models/        # Mongoose models
  middlewares/   # Auth, CSRF, file upload, etc.
  services/      # AWS, Cloudinary, payments
  db/            # DB connections
  routes/        # API routes
  utils/         # Helpers, error handling
frontend/
  src/components/  # UI components
  src/pages/       # App pages
  src/hooks/       # Custom hooks
  src/lib/         # Utilities
  src/config/      # Config files
  public/          # Static assets
embedder/
  main.py          # FastAPI server
  pyproject.toml   # Python dependencies
vectorbackend/
  index.js         # Vector DB service
```

---

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Python 3.9+
- MongoDB
- Redis

### 1. Clone the Repository

```bash
git clone <REPO_URL>
cd letshost
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Embedder Setup

```bash
cd embedder
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. Vector Backend Setup

```bash
cd vectorbackend
npm install
npm start
```

### 6. Observability Stack (Grafana + Loki + OTel Collector)

The `docker-compose.yml` now includes:

- `loki` for log storage
- `loki-gateway` (nginx) for Basic Auth protected public Loki access
- `otel-collector` for OTLP log ingestion and forwarding to Loki
- `grafana` with Loki datasource pre-provisioned

Run everything:

```bash
docker compose up --build
```

Before running, inject credentials using environment variables (for local use, put these in a root `.env` file that is not committed):

```bash
OBS_AUTH_USER=your_loki_user
OBS_AUTH_PASS=your_loki_password
GRAFANA_ADMIN_USER=your_grafana_user
GRAFANA_ADMIN_PASSWORD=your_grafana_password
OTEL_INGEST_HTPASSWD=collector_user:$apr1$hash$generated_hash
BACKEND_OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(user:pass)>
```

Notes:

- `OTEL_INGEST_HTPASSWD` must be a valid htpasswd line (username + hashed password), not plain text.
- `BACKEND_OTEL_EXPORTER_OTLP_HEADERS` should match the collector basic auth credentials.

Access Grafana:

- URL: `http://localhost:3001`
- Username: from `GRAFANA_ADMIN_USER`
- Password: from `GRAFANA_ADMIN_PASSWORD`

Access Loki (Basic Auth protected):

- URL: `http://localhost:3100`
- Username: from `OBS_AUTH_USER`
- Password: from `OBS_AUTH_PASS`

OTLP log ingest endpoint (Basic Auth protected):

- URL: `http://localhost:4318/v1/logs`
- Header: from `BACKEND_OTEL_EXPORTER_OTLP_HEADERS`

Your backend container is preconfigured to export logs through OTLP to `otel-collector` with:

- `ENV=local` (non-dev, so export is enabled)
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318`
- `OTEL_SERVICE_NAME=letshost-backend`
- `OTEL_EXPORTER_OTLP_HEADERS` injected from `BACKEND_OTEL_EXPORTER_OTLP_HEADERS`

---

## 📖 API Documentation

- All API endpoints are organized by feature in `backend/routes/`.
- Authentication required for most endpoints (see `middlewares/`).

---

## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow the code style and add tests where appropriate.

---

## 📄 License

This project is licensed under the ![MIT License](LICENSE).

---
