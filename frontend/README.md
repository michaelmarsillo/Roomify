# TFSA Calculator - Frontend

A modern web application for tracking Tax-Free Savings Account (TFSA) contributions and withdrawals, built with Next.js and Tailwind CSS.

## Features

- User authentication with email and password
- Dashboard showing contribution room, deposits, withdrawals, and remaining room
- Transaction history with ability to add new transactions
- Educational information about TFSAs

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend directory)

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```
   npm install
   ```

### Environment Setup

Create a `.env.local` file in the frontend directory with the following variables:

```
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Adjust the URL as needed to match your backend configuration.

### Running the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Project Structure

- `app/` - Next.js App Router pages and components
  - `page.tsx` - Home/landing page
  - `login/page.tsx` - Login page
  - `signup/page.tsx` - Registration page
  - `dashboard/page.tsx` - TFSA dashboard
  - `info/page.tsx` - Educational information about TFSAs
- `components/` - Reusable React components
- `services/` - API services and utility functions

## Connecting to Backend

The frontend is configured to connect to the backend API at the URL specified in the `.env.local` file. Make sure the backend server is running before using the application.

## Demo Mode

For demonstration purposes, you can access the dashboard without authentication by clicking the "View Demo Dashboard" button on the landing page.
