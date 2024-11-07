#!/usr/bin/env sh

set -e

echo '[info] Dockerizing ...'

echo '[info] docker build -t docker-template:latest .'
docker build -t docker-template:latest .

# echo '[info] docker compose down'
# docker compose down

echo '[info] docker compose --env-file=./.env up -d'
docker compose --env-file=./.env up -d

echo '[info] Dockerized and up !'