# Hermes V2.0

A comprehensive business management system with AI-powered features, built with React, Vercel, and Supabase.

## Features

- **Admin Dashboard** - System overview and module navigation
- **Hermes Chatbot** - AI-powered chatbot with OpenClaude integration
- **CRM Workflows** - Customer relationship management with AI insights
- **ERP Documentation** - Enterprise resource planning documentation
- **Analytics & Reports** - Business intelligence and market research
- **Infrastructure** - Model deployment and resource management
- **Security & Compliance** - Security audits and compliance monitoring

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Render
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Render

## Project Structure

```
Hermes_1.0/
├── api/                          # Vercel Serverless Functions
│   ├── index.js
│   └── services/
│       ├── openClaude.js
│       ├── openfang.js
│       └── pentagi.js
├── client/                       # React Frontend
│   ├── src/
│   │   ├── config/
│   │   │   └── supabaseClient.js
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Admin_Dashboard.jsx
│   │   │   │   ├── Admin_AccountControl.jsx
│   │   │   │   ├── Admin_HermesChatbot.jsx
│   │   │   │   └── Modules/
│   │   │   │       ├── Admin_CRM.jsx
│   │   │   │       ├── Admin_ERP.jsx
│   │   │   │       ├── Admin_Analytics.jsx
│   │   │   │       ├── Admin_Infrastructure.jsx
│   │   │   │       └── Admin_Security.jsx
│   │   │   ├── Components/
│   │   │   │   └── Admin_Components/
│   │   │   ├── Client/
│   │   │   └── LandingPage.jsx
│   │   ├── services/
│   │   │   ├── openClaude/
│   │   │   ├── openfang/
│   │   │   └── pentagi/
│   │   ├── styles/
│   │   │   └── Admin_styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/                       # Express Backend (optional)
│   ├── routes/
│   ├── config/
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── vercel.json                  # Vercel Configuration
├── supabase_setup.sql          # Database Setup
└── DEPLOYMENT.md              # Deployment Guide
```

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel account
- Supabase account
- Git repository

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

4. Add your API keys to the `.env` files

5. Set up Supabase:
   - Create a new project in Supabase
   - Run the SQL from `supabase_setup.sql`

### Local Development

```bash
# Run both client and API
npm run dev

# Or run separately:
# Terminal 1: npm run dev:client
# Terminal 2: npm run dev:api
```

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

### Client (.env)

```bash
VITE_API_URL=/api
VITE_OPENCLAUDE_API_KEY=your_openclaude_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server (.env)

```bash
PORT=3000
OPENCLAUDE_API_KEY=your_openclaude_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=http://localhost:5173
```

### Vercel

Add these environment variables in your Vercel project settings:
- `OPENCLAUDE_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Scripts

- `npm run dev` - Run both client and API
- `npm run dev:client` - Run client only
- `npm run dev:api` - Run API only
- `npm run build` - Build for production
- `npm run start` - Preview production build

## License

MIT

## Support

For issues and questions, please contact the development team.
