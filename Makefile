COMPOSE_DEV := docker compose -f infra/docker-compose.dev.yml
COMPOSE_PROD := docker compose -f infra/docker-compose.prod.yml

.PHONY: dev up down logs build prod-up prod-build prod-down

## Start the dev stack (detached) + Expo in the foreground
dev: up
	cd mobile && npm run start

up:
	$(COMPOSE_DEV) up -d --build

down:
	$(COMPOSE_DEV) down

logs:
	$(COMPOSE_DEV) logs -f

build:
	$(COMPOSE_DEV) build

## Production (requires .env at repo root, see .env.example)
prod-up:
	$(COMPOSE_PROD) --env-file .env up -d --build

prod-down:
	$(COMPOSE_PROD) --env-file .env down
