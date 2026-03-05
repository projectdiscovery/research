# VaultBank Setup

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

---

## Local Development

### 1. Database
```bash
createdb vaultbank
```

### 2. Backend
```bash
cd backend
cp .env.example .env          # edit DATABASE_URL if needed
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed --reset     # creates schema + demo data
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo Logins
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vaultbank.com | admin1234 |
| Manager | manager@vaultbank.com | demo1234 |
| Compliance | compliance@vaultbank.com | demo1234 |
| Teller | teller1@vaultbank.com | demo1234 |
| Customer | demo@vaultbank.com | demo1234 |

---

## Production Deployment

### Option A — Single VPS (nginx + systemd)

**1. Server setup (Ubuntu 22.04)**
```bash
apt install python3.11 python3.11-venv nodejs npm postgresql nginx -y
createdb vaultbank
```

**2. Backend**
```bash
cd /srv/vaultbank/backend
cp .env.example .env
# Set in .env:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/vaultbank
#   SECRET_KEY=$(openssl rand -hex 32)
#   ACCESS_TOKEN_EXPIRE_MINUTES=15
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.seed --reset
```

Create `/etc/systemd/system/vaultbank.service`:
```ini
[Unit]
After=network.target

[Service]
WorkingDirectory=/srv/vaultbank/backend
ExecStart=/srv/vaultbank/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
EnvironmentFile=/srv/vaultbank/backend/.env

[Install]
WantedBy=multi-user.target
```
```bash
systemctl enable --now vaultbank
```

**3. Frontend**
```bash
cd /srv/vaultbank/frontend
npm install && npm run build
# Output: frontend/dist/
```

**4. nginx** (`/etc/nginx/sites-available/vaultbank`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /srv/vaultbank/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
```bash
ln -s /etc/nginx/sites-available/vaultbank /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
# Add TLS: certbot --nginx -d yourdomain.com
```

---

### Option B — Docker Compose

Create `docker-compose.yml` at project root:
```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: vaultbank
      POSTGRES_USER: vault
      POSTGRES_PASSWORD: vaultpass
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://vault:vaultpass@db:5432/vaultbank
      SECRET_KEY: change-me
      ACCESS_TOKEN_EXPIRE_MINUTES: 15
    depends_on: [db]
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on: [backend]

volumes:
  pgdata:
```

`backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python -m app.seed --reset
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

`frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ARG VITE_API_URL=http://backend:8000
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

`frontend/nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
docker compose up -d
```

---

### Option C — Railway / Render / Fly.io

**Railway (recommended — free tier)**
1. Push repo to GitHub
2. New project → Deploy from GitHub → select repo
3. Add PostgreSQL plugin → copy `DATABASE_URL` to backend env vars
4. Add backend service: root dir `backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add frontend service: root dir `frontend`, build `npm run build`, publish dir `dist`
6. Set frontend env var: `VITE_API_BASE_URL=https://your-backend.railway.app`

**Fly.io**
```bash
# Backend
cd backend && fly launch --name vaultbank-api
fly postgres create --name vaultbank-db
fly postgres attach vaultbank-db
fly secrets set SECRET_KEY=$(openssl rand -hex 32)
fly deploy

# Frontend
cd frontend && fly launch --name vaultbank-ui
fly deploy
```
