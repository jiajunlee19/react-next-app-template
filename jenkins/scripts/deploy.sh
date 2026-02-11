#!/usr/bin/env sh

set -e

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
    echo "[error] Missing arguments. Usage: ./kill.sh <app_name>"
    exit 1
fi

echo "[info] Deploying ..."

echo "[info] pm2 start ${APP_NAME}.config.js --only ${APP_NAME} || pm2 restart ${APP_NAME}"
pm2 start "${APP_NAME}".config.js --only "${APP_NAME}" || pm2 restart "${APP_NAME}"

echo "[info] Deploy Completed !"