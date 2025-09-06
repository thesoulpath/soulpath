# Wellness Platform Monorepo

A comprehensive wellness platform with Rasa conversational AI backend and Next.js frontend.

## Structure

```
wellness-monorepo/
├── backend/          # Rasa conversational AI backend
├── frontend/         # Next.js frontend application
├── package.json      # Monorepo configuration
└── README.md         # This file
```

## Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development
```bash
# Run both backend and frontend
npm run dev

# Run only backend (Rasa)
npm run dev:backend

# Run only frontend (Next.js)
npm run dev:frontend
```

### Production
```bash
# Build both applications
npm run build

# Start both applications
npm start
```

## Deployment

### Backend (Render.com)
- Located in `backend/` directory
- Uses `render.yaml` for deployment configuration
- Deploy with: `npm run deploy:backend`

### Frontend (Vercel)
- Located in `frontend/` directory
- Uses Vercel configuration
- Deploy with: `npm run deploy:frontend`

## Environment Variables

### Backend
- See `backend/.env.example` for required variables

### Frontend
- See `frontend/.env.example` for required variables

## Development Workflow

1. Make changes in respective directories
2. Test locally with `npm run dev`
3. Deploy backend to Render: `npm run deploy:backend`
4. Deploy frontend to Vercel: `npm run deploy:frontend`
