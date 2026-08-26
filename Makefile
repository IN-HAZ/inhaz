COMPOSE_DEV := docker compose -f infra/docker-compose.dev.yml
COMPOSE_PROD := docker compose -f infra/docker-compose.prod.yml

.PHONY: dev env up down logs build prod-up prod-build prod-down

## Ensure root .env and backend/.env exist
env:
	@if [ ! -f .env ]; then \
		echo "Creating root .env from .env.example..."; \
		cp .env.example .env; \
	fi
	@if [ ! -f backend/.env ] || [ ! -s backend/.env ]; then \
		echo "Creating backend/.env from root .env..."; \
		cp .env backend/.env; \
	fi


## Start dev stack (Docker background services + Expo mobile app foreground)
dev: env up
	@export $$(grep -v '^#' .env | xargs) && cd mobile && npm run start

up: env
	$(COMPOSE_DEV) up -d --build

down:
	$(COMPOSE_DEV) down

logs:
	$(COMPOSE_DEV) logs -f

build:
	$(COMPOSE_DEV) build

## Production (requires root .env configuration)
prod-up: env
	$(COMPOSE_PROD) --env-file .env up -d --build

prod-down:
	$(COMPOSE_PROD) --env-file .env down
