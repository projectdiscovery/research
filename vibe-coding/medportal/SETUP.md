# Setup

1. `pnpm install`
2. `cp .env.example .env` and set `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
3. `npx prisma generate && npx prisma db push && npx prisma db seed`
4. `pnpm dev` for local preview
5. Deploy to Vercel or similar with env vars + `pnpm build && pnpm start`
