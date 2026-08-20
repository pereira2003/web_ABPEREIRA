#!/usr/bin/env bash
# Usage: make this executable then run: ./deploy_rules.sh
# This script requires the Firebase CLI and that you are logged in.

PROJECT_ID="abpereira-web"
RULES_FILE="database.rules.json"

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI not found. Install with: npm install -g firebase-tools"
  exit 1
fi

echo "Deploying Realtime Database rules from ${RULES_FILE} to project ${PROJECT_ID}"
firebase database:rules:set ${RULES_FILE} --project ${PROJECT_ID}

echo "If the command fails, ensure you ran 'firebase login' and that you have access to project ${PROJECT_ID}."
