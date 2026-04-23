# Hermes 1.0 - Deployment Guide

## Overview

This guide shows how to deploy Hermes 1.0 on Render with Supabase for the database. The app is split into two services:
- a Render Web Service for the Express backend
- a Render Static Site for the React frontend

The chatbot will keep working after deployment as long as the frontend points to the backend API and the backend has the required AI keys.

## Prerequisites

- Node.js 18+
- Render account ([render.com](https://render.com))
- Supabase account ([supabase.com](https://supabase.com))
- Git repository with this project

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name: `Hermes 1.0`
4. Set a strong database password
5. Wait for the project to be created

### 1.2 Run SQL Setup

1. Go to the SQL Editor in your Supabase project
2. Copy and paste the SQL from `supabase_setup.sql`
3. Click "Run"

### 1.3 Get Your Credentials

1. Go to Project Settings → API
2. Copy your:
   - Project URL
   - anon public key
   - service_role secret key

## Step 2: Configure Environment Variables

### 2.1 Local Development

Create `.env` files in both `client` and `server` if you want to run locally.

**client/.env:**
```bash
VITE_API_URL=/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENCLAUDE_API_KEY=your_openclaude_api_key
```

**server/.env:**
```bash
PORT=3000
OPENCLAUDE_API_KEY=your_openclaude_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FB_VERIFY_TOKEN=your_fb_verify_token
FB_PAGE_ACCESS_TOKEN=your_fb_page_access_token
FB_APP_SECRET=your_fb_app_secret
FB_PAGE_ID=your_fb_page_id
FB_PAGE_NAME=your_fb_page_name
CORS_ORIGIN=http://localhost:5173
```

### 2.2 Render Environment Variables

Add these environment variables in Render for the backend service:

```bash
NODE_ENV=production
OPENCLAUDE_API_KEY=your_openclaude_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FB_VERIFY_TOKEN=your_fb_verify_token
FB_PAGE_ACCESS_TOKEN=your_fb_page_access_token
FB_APP_SECRET=your_fb_app_secret
FB_PAGE_ID=your_fb_page_id
FB_PAGE_NAME=your_fb_page_name
CORS_ORIGIN=https://your-frontend.onrender.com
```

Add these environment variables for the frontend static site:

```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 3: Install Dependencies

```bash
npm install
cd client
npm install
cd ..
```

## Step 4: Local Development

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:client
npm run dev:api
```

Local URLs:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api

## Step 5: Deploy to Render

### 5.1 Use the Blueprint

This repository includes [render.yaml](render.yaml). You can deploy both services from one blueprint in Render.

### 5.2 Backend Service

Render settings for the backend:
- Type: Web Service
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

Make sure the backend env vars are set.

### 5.3 Frontend Static Site

Render settings for the frontend:
- Type: Static Site
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Set `VITE_API_URL` to your backend public URL, for example `https://your-backend.onrender.com/api`.

### 5.4 Facebook Webhook

In Meta/Facebook settings, use this webhook URL:

```bash
https://your-backend.onrender.com/api/webhooks/facebook
```

Use the same `FB_VERIFY_TOKEN` value in both Meta and Render.

## Step 6: Will the Chatbot Be Affected?

The chatbot will not be affected if the following are correct:
- `VITE_API_URL` points to the Render backend
- `OPENCLAUDE_API_KEY` or `OPENROUTER_API_KEY` is set on the backend
- Supabase credentials are set

What can break the chatbot:
- missing API key
- wrong backend URL
- frontend and backend deployed but not linked through `VITE_API_URL`
- Facebook keys missing if you use the Messenger integration

## Step 7: Test the Live Application

1. Open the frontend Render URL
2. Test authentication
3. Test the chatbot
4. Test CRM and admin pages
5. Test the Facebook connect screen
6. Test Messenger webhook flow if enabled

## Troubleshooting

### Build Errors

1. Check that dependencies are installed
2. Verify environment variables
3. Check Render build logs

### API Errors

1. Check the backend logs in Render
2. Verify API keys and Supabase credentials
3. Confirm `VITE_API_URL` points to the backend

### Database Issues

1. Verify `supabase_setup.sql` was run
2. Check Row Level Security policies
3. Verify service role permissions

## Next Steps

1. Add a custom domain in Render
2. Configure SSL
3. Set up monitoring and alerts
4. Add automated deploys from GitHub

## Support

For issues and questions, contact the development team.
