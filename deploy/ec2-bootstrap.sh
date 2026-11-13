#!/usr/bin/env bash
set -euo pipefail

# Bootstrap an Ubuntu 22.04/24.04 EC2 instance for Skill-Swap (Docker + swap + IMDS info)
if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash deploy/ec2-bootstrap.sh"
  exit 1
fi

# 1. Add 2GB swap so Vite/Docker builds do not OOM on t3.micro/t3.small
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

# 2. Install Docker Engine & Docker Compose plugin if missing
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg git openssl
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y docker-compose-plugin
fi

TARGET_USER="${SUDO_USER:-ubuntu}"
if id "$TARGET_USER" >/dev/null 2>&1; then
  usermod -aG docker "$TARGET_USER" || true
fi

# 3. Query EC2 metadata (IMDSv2) to print ready-to-paste host/TURN values
IMDS_TOKEN=$(curl -sS -m 2 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
PUBLIC_IP=""
PRIVATE_IP=""
if [ -n "$IMDS_TOKEN" ]; then
  PUBLIC_IP=$(curl -sS -m 2 -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 || true)
  PRIVATE_IP=$(curl -sS -m 2 -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4 || true)
fi

echo ""
echo "=== EC2 Bootstrap Complete ==="
if [ -n "$PUBLIC_IP" ]; then
  SSLIP_HOST="${PUBLIC_IP//./-}.sslip.io"
  echo "Public IP      : $PUBLIC_IP"
  echo "Free sslip.io  : https://$SSLIP_HOST"
  echo "TURN_EXTERNAL_IP=${PUBLIC_IP}${PRIVATE_IP:+/$PRIVATE_IP}"
fi
echo "Next: log out/in (or run 'newgrp docker'), configure backend/.env, and run:"
echo "  docker compose -f docker-compose.prod.yml --env-file backend/.env up -d --build"
echo "  (Add '--profile turn' to also run the Coturn WebRTC TURN relay.)"
