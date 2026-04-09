# EcoGuardian - Waste Management System

EcoGuardian is a modern waste management and recycling platform designed to streamline operations between city administrators, waste management officers, and citizens.

## 🚀 Migration Update

This application has been successfully migrated from a Supabase/Clerk managed infrastructure to a self-hosted **Node.js Express** backend with a **PostgreSQL** database.

## 🏗️ Technical Architecture

- **Frontend**: React 18 with Vite, TypeScript, and Tailwind CSS.
- **Backend**: Node.js & Express REST API.
- **Database**: PostgreSQL for persistent data storage.
- **Authentication**: Custom JWT-based authentication with Bcrypt password hashing.
- **File Storage**: Local filesystem storage for complaint and recycling images.
- **UI Components**: Shadcn UI, Lucide Icons, and Framer Motion for animations.

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18 or later.
- **PostgreSQL**: A running instance (local or remote).
- **npm**: Comes with Node.js.

### Installation

1. **Clone the repository**:
   ```bash
   git clone [your-repo-url]
   cd sgp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Backend Configuration
   API_PORT=3001
   JWT_SECRET=your_super_secret_key
   STORAGE_PATH=C:\eco_guardian_storage # Path for uploaded images

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ecoguardian
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. **Initialize the Database**:
   The backend server automatically initializes tables on startup.

### Development Commands

You can run the frontend and backend simultaneously or separately:

- **Run All (Recommended)**: `npm run dev:all`
- **Frontend Only**: `npm run dev` (Runs on port 8080)
- **Backend Only**: `npm run dev:server` (Runs on port 3001)

## 🔐 Default Credentials

For testing purposes, the following accounts have been seeded:

- **Admin**: `admin@ecoguardian.com` / `admin123`
- **Officer 1**: `officer1@ecoguardian.com` / `officer123`
- **Officer 2**: `officer2@ecoguardian.com` / `officer123`

## 👥 User Roles

### 🏛️ Admin
- Complete oversight of the system.
- Manage officers and assign areas of responsibility.
- Monitor city-wide waste statistics and performance reports.

### 👮 Officer
- Manage assigned collection tasks and complaints.
- Real-time status updates for citizens.
- Daily scheduling and performance tracking.

### 👤 Citizen (User)
- Report waste issues with photos and GPS location.
- Schedule recyclable pick-ups.
- Track the progress of their requests in real-time.

## 📁 Storage
Uploaded images are stored locally in the path defined by `STORAGE_PATH`. The backend serves these files statically via the `/uploads` route.