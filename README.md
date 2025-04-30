# Waste Management System

A modern web application built with React, TypeScript, and Clerk for authentication. This system helps manage waste collection and recycling processes with different user roles (Admin, Officer, and User).

## Features

- 🔐 Authentication with Clerk
- 👥 Role-based access control (Admin, Officer, User)
- 📱 Responsive design with Tailwind CSS
- 🎯 Real-time updates with React Query
- 📝 Complaint management system
- ♻️ Recycling request handling
- 📊 Officer scheduling and reporting
- 🎨 Modern UI with Shadcn components

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-project-name]
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Clerk keys:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key
VITE_CLERK_SECRET_KEY=your_secret_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

## User Roles and Features

### Admin
- Manage officers
- Assign cases
- View all complaints and requests
- Access system analytics

### Officer
- View assigned cases
- Update case status
- Manage schedule
- Generate reports

### User
- Submit complaints
- Request recycling pickup
- Track request status
- Update profile

## Checking Your Clerk Email

To check which email you used to log in:

1. In your code, you can access the user's email using the Clerk `useUser` hook:
```typescript
import { useUser } from "@clerk/clerk-react";

const YourComponent = () => {
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress;
  
  return <div>Logged in as: {primaryEmail}</div>;
};
```

2. In the Clerk Dashboard:
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your application
   - Click on "Users" in the sidebar
   - Find your user and click to view details
   - Your email will be listed under "Email addresses"

## Deployment

This project is configured for deployment on Vercel:

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically deploy your application

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Clerk Authentication
- React Query
- React Router DOM
- Shadcn UI Components
- Framer Motion

## Support

For any issues or questions, please open an issue in the repository. 