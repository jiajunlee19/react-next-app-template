#!/usr/bin/env sh

set -e

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
    echo "[error] Missing arguments. Usage: ./kill.sh <app_name>"
    exit 1
fi

echo "[info] Killing existing listening port process ..."

echo "[info] pm2 stop ${APP_NAME}"
pm2 stop "${APP_NAME}" || echo "[warn] Failed to stop ${APP_NAME}!"

echo "Kill Completed !"