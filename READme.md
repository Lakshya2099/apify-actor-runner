Based on our entire conversation about the Apify Actor Runner project, here's a comprehensive README file that covers both manual and Docker setup:

# Apify Actor Runner

A full-stack web application that allows users to dynamically fetch, configure, and execute Apify actors with real-time schema loading and results display.



- **Dynamic Schema Loading**: Automatically fetches and renders actor input forms based on schema
- **Real-time Execution**: Execute actors and monitor progress with live updates
- **Secure Authentication**: API key-based authentication with secure headers
- **Responsive Design**: Clean, modern UI that works on desktop and mobile
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Docker Support**: One-command setup with Docker Compose

## 🏗️ Architecture

- **Frontend**: React 18 with functional components and hooks
- **Backend**: Node.js with Express API server
- **Integration**: Apify API v2 for actor management and execution
- **Styling**: Custom CSS with modern design patterns

## 📋 Prerequisites

**For Manual Setup:**
- Node.js 18.x or higher
- npm or yarn
- Apify account with API token

**For Docker Setup:**
- Docker
- Docker Compose
- Apify account with API token

## 🛠️ Installation Methods

## Method 1: Manual Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Lakshya2099/apify-actor-runner.git
cd apify-actor-runner
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Edit `backend/.env` and add your Apify API key:**
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
APIFY_API_BASE=https://api.apify.com/v2
API_TIMEOUT=10000
```

**Start the backend server:**
```bash
npm run dev
```

### 3. Frontend Setup

**Open a new terminal:**
```bash
cd frontend
npm install
cp .env.example .env
```

**Edit `frontend/.env` (optional, defaults work fine):**
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_NAME=Apify Actor Runner
REACT_APP_VERSION=1.0.0
```

**Start the frontend server:**
```bash
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Method 2: Docker Setup (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/apify-actor-runner.git
cd apify-actor-runner
```

### 2. Quick Start with Docker

**Single command to run everything:**
```bash
docker-compose up --build
```

That's it! The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

