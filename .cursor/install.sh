#!/usr/bin/env bash
# Idempotent bootstrap for the MonCaviste SaaS Cloud Agent environment.
set -euo pipefail

cd "$(dirname "$0")/.."

npm install

# Provide local placeholder Supabase credentials when none exist so the
# Next.js dev server can boot. Replace with real values via secrets to enable
# auth/database features.
if [ ! -f .env.local ]; then
  cat > .env.local <<'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
fi
