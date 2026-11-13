#!/usr/bin/env bash
# Generate RS256 keypair for JWT signing
set -euo pipefail

KEYS_DIR="$(cd "$(dirname "$0")/../keys" && pwd)"
mkdir -p "$KEYS_DIR"

echo "Generating RS256 keypair..."
openssl genrsa -out "$KEYS_DIR/private.pem" 2048 2>/dev/null
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem" 2>/dev/null

# Output base64-encoded versions for env vars
echo ""
echo "=== Copy these into your .env ==="
echo ""
echo "JWT_PRIVATE_KEY_B64=$(base64 < "$KEYS_DIR/private.pem" | tr -d '\n')"
echo ""
echo "JWT_PUBLIC_KEY_B64=$(base64 < "$KEYS_DIR/public.pem" | tr -d '\n')"
echo ""
echo "QR_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo ""
echo "Keys saved to $KEYS_DIR/"
