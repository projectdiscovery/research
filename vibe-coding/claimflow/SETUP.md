# ClaimFlow Setup Guide

This guide walks you through setting up and running ClaimFlow locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (v9.x or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Verify Installation

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be v9.x or higher
git --version     # Any recent version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/projectdiscovery/vibe-coding.git
cd vibe-coding/apps/insurance/app
```

Or if you have the code locally:

```bash
cd /path/to/claimflow
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- SvelteKit and Svelte 5
- Drizzle ORM and SQLite driver
- Tailwind CSS
- Lucide icons
- date-fns

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or create it manually:

```env
DATABASE_URL=file:./local.db
```

### 4. Initialize the Database

Push the database schema:

```bash
npm run db:push
```

This creates the SQLite database (`local.db`) with all required tables.

### 5. Seed Demo Data

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:
- 9 demo user accounts (all roles)
- 6 sample policies
- 6 sample claims with various statuses
- Sample documents, notes, and notifications

### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## Demo Accounts

All accounts use the password: `password123`

| Role | Email | Description |
|------|-------|-------------|
| Admin | admin@claimflow.com | Full system access |
| Underwriter | underwriter@claimflow.com | High-value claim review |
| Adjuster | adjuster@claimflow.com | Claim processing |
| Adjuster | adjuster2@claimflow.com | Claim processing |
| Agent | agent@claimflow.com | Customer management |
| Agent | agent2@claimflow.com | Customer management |
| Policyholder | john.doe@example.com | Customer with multiple policies |
| Policyholder | jane.smith@example.com | Customer with claims |
| Policyholder | robert.wilson@example.com | High-value customer |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## Project Configuration

### Database Configuration (`drizzle.config.ts`)

```typescript
export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./local.db'
  }
});
```

### SvelteKit Configuration (`svelte.config.js`)

The app uses the default SvelteKit adapter for development. For production, configure the appropriate adapter based on your hosting platform.

## Troubleshooting

### Port Already in Use

If port 5173 is busy:

```bash
npm run dev -- --port 3000
```

### Database Issues

Reset the database:

```bash
rm local.db
npm run db:push
npm run db:seed
```

### Permission Errors on macOS

If you get permission errors:

```bash
chmod +x node_modules/.bin/*
```

### Module Not Found

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Vite Cache Issues

Clear Vite cache:

```bash
rm -rf node_modules/.vite
npm run dev
```

## Production Deployment

### Build the Application

```bash
npm run build
```

### Preview the Build

```bash
npm run preview
```

### Environment Variables for Production

```env
DATABASE_URL=file:./data/production.db
NODE_ENV=production
```

### Recommended Hosting Platforms

- **Vercel** - Use `@sveltejs/adapter-vercel`
- **Netlify** - Use `@sveltejs/adapter-netlify`
- **Node.js Server** - Use `@sveltejs/adapter-node`
- **Docker** - Create a Dockerfile with Node.js base image

## File Upload Configuration

Uploaded files are stored in the `./uploads` directory. For production:

1. Configure cloud storage (S3, GCS, etc.)
2. Update `src/lib/server/uploads.ts` with cloud provider SDK
3. Set appropriate environment variables for credentials

## Security Considerations

For production deployment:

1. **Use HTTPS** - Always serve over HTTPS
2. **Set secure cookies** - Configure `secure: true` in session cookies
3. **Environment variables** - Never commit `.env` files
4. **Database** - Use PostgreSQL or MySQL for production
5. **File uploads** - Validate file types and scan for malware
6. **Rate limiting** - Implement rate limiting on API endpoints

## Getting Help

- Check the main [README.md](./README.md) for feature documentation
- Open an issue on GitHub for bugs or feature requests
- Review the SvelteKit documentation: https://kit.svelte.dev/docs
