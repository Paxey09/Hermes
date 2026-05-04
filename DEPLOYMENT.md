# Hermes 1.0 - Deployment Guide

## Overview

This guide will help you deploy Hermes 1.0 to production using Vercel (frontend + backend) and Supabase (database).

## Prerequisites

- Node.js 18+ installed
- Vercel account ([vercel.com](https://vercel.com))
- Supabase account ([supabase.com](https://supabase.com))
- Git repository with your code

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name: `Hermes 1.0`
4. Set a strong database password
5. Wait for the project to be created

### 1.2 Run SQL Setup

1. Go to the SQL Editor in your Supabase project
2. Copy and paste the SQL from `supabase_setup.sql` (see below)
3. Click "Run" to execute the SQL

### 1.3 Get Your Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - anon public key
   - service_role secret key

## Step 2: Configure Environment Variables

### 2.1 Local Development (.env)

Create `.env` files in both `client` and `server` directories:

**client/.env:**
```bash
VITE_API_URL=/api
VITE_OPENCLAUDE_API_KEY=your_openclaude_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**server/.env:**
```bash
PORT=3000
OPENCLAUDE_API_KEY=your_openclaude_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=http://localhost:5173
```

### 2.2 Vercel Environment Variables

1. Go to your Vercel project settings
2. Add the following environment variables:

```
OPENCLAUDE_API_KEY=your_openclaude_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Go back to root
cd ..
```

## Step 4: Local Development

```bash
# Run both client and API
npm run dev

# Or run separately:
# Terminal 1: npm run dev:client
# Terminal 2: npm run dev:api
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api

## Step 5: Deploy to Vercel

### 5.1 Connect Your Repository

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository

### 5.2 Configure Build Settings

1. **Framework Preset:** Vite
2. **Root Directory:** `client`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`

### 5.3 Add Environment Variables

In Vercel project settings, add:
- `OPENCLAUDE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 5.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## Step 6: Test the Live Application

1. Visit your Vercel URL
2. Test authentication (sign up/login)
3. Test creating customers in CRM
4. Test generating AI insights
5. Test infrastructure management
6. Test security audits

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all dependencies are installed
2. Verify environment variables are set
3. Check the Vercel build logs

### API Errors

If API calls fail:

1. Check that API keys are correct
2. Verify Supabase connection
3. Check browser console for errors

### Database Issues

If database operations fail:

1. Verify Supabase SQL was run correctly
2. Check Row Level Security (RLS) policies
3. Verify API keys have correct permissions

## Next Steps

1. Set up custom domain in Vercel
2. Configure SSL certificates
3. Set up monitoring and alerts
4. Configure backup strategies
5. Set up CI/CD pipeline with GitHub Actions

## Support

For issues and questions, please refer to the project documentation or contact the development team.
