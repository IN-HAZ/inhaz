COMPOSE := docker compose -f infra/docker-compose.dev.yml

.PHONY: env set-ip up dev andr down down-v logs build

## Bootstrap .env files from examples (first-time setup)
env:
	@[ -f backend/.env ]  || cp backend/.env.example  backend/.env
	@[ -f mobile/.env ]   || cp mobile/.env.example   mobile/.env
	@[ -f infra/.env ]    || cp infra/.env.example     infra/.env

## Update EXPO_PUBLIC_API_URL with local machine IP
set-ip: env
	$(eval IP := $(shell ip route get 1.1.1.1 | awk '{print $$7; exit}'))
	@sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$(IP):8000/api/v1|" mobile/.env

## Start backend containers
up: env
	$(COMPOSE) up -d --build

## Start full dev stack: containers + Expo
dev: set-ip up
	cd mobile && npm run start

## Run android on device
andr: set-ip up
	cd mobile && npx expo run:android --device

## Stop containers
down:
	$(COMPOSE) down

## Stop containers and wipe volumes
down-v:
	$(COMPOSE) down -v

## Stream container logs
logs:
	$(COMPOSE) logs -f

## Rebuild images
build:
	$(COMPOSE) build

## Run artisan inside the php container
art:
	$(COMPOSE) exec php php artisan $(filter-out $@,$(MAKECMDGOALS))
%:
	@:
