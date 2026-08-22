# Infrastructure

Docker configuration for inHaz.

```
infra/
├── docker/
│   ├── nginx.dev.conf
│   ├── nginx.prod.conf
│   ├── php/
│   │   ├── dev.ini
│   │   ├── prod.ini
│   │   └── www.conf
│   └── supervisord.conf
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── Dockerfile
├── Dockerfile.dev
└── README.md
```

## Dev

```bash
cd infra
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec php php artisan migrate
```

## Production

```bash
cp .env.example .env  # configure secrets
cd infra
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec php php artisan migrate --force
```
