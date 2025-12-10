#!/bin/bash
# Script to watch backend logs in real-time
echo "Starting log viewer for Backend Replicas..."
echo "You will see requests handled by backend-1 and backend-2"
echo "Press Ctrl+C to exit"
echo "-----------------------------------------------------"
sudo docker compose -f ~/api_ventas/docker-compose.prod.yml logs -f --tail=50 backend
