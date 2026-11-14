#!/usr/bin/env bash
# ============================================================
# NestMate — Team Setup Script
# Run once after cloning:  bash setup.sh
# ============================================================
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NestMate Team Setup Script     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════╝${NC}"
echo ""

# ── 1. Install backend dependencies ─────────────────────────
echo -e "${YELLOW}[1/3] Installing backend dependencies...${NC}"
npm install
echo -e "${GREEN}      ✓ Backend dependencies installed${NC}"

# ── 2. Install mobile dependencies ──────────────────────────
echo -e "${YELLOW}[2/3] Installing mobile dependencies...${NC}"
cd mobile && npm install && cd ..
echo -e "${GREEN}      ✓ Mobile dependencies installed${NC}"

# ── 3. Seed demo data ────────────────────────────────────────
echo -e "${YELLOW}[3/3] Setting up demo data store...${NC}"
mkdir -p data
if [ ! -f data/store.json ]; then
  cat > data/store.json << 'STORE_EOF'
{
  "users": [
    {
      "id": "user-1",
      "fullName": "Alex Rivera",
      "email": "alex@example.com",
      "passwordHash": "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
      "isActive": true,
      "authVersion": 0,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "profiles": [
    {
      "id": "user-1",
      "fullName": "Alex Rivera",
      "email": "alex@example.com",
      "occupation": "Graduate Student",
      "city": "Bangalore",
      "bio": "Graduate student looking for a quiet, clean, and collaborative living space.",
      "phone": "+91 98765 43210",
      "photo": null,
      "preferences": {
        "minBudget": "8000",
        "maxBudget": "18000",
        "preferredArea": "Koramangala",
        "sleepSchedule": "early",
        "foodHabits": "vegetarian",
        "cleanliness": "high",
        "smoking": "no",
        "drinking": "never",
        "pets": "any"
      }
    }
  ],
  "tokens": [],
  "listings": [],
  "connectionRequests": [],
  "conversations": [],
  "matchRequests": [],
  "favorites": [],
  "notifications": []
}
STORE_EOF
  echo -e "${GREEN}      ✓ Demo data created${NC}"
else
  echo -e "${GREEN}      ✓ Data store already exists (skipped)${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Setup complete! How to run:${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Terminal 1 — Start backend:${NC}"
echo -e "    npm start"
echo ""
echo -e "  ${YELLOW}Terminal 2 — Start Expo (mobile):${NC}"
echo -e "    cd mobile && npx expo start --clear"
echo ""
echo -e "  ${YELLOW}Demo login credentials:${NC}"
echo -e "    Email:    alex@example.com"
echo -e "    Password: nestmate123"
echo ""
echo -e "  ${YELLOW}Or tap 'Quick Demo' on the login screen.${NC}"
echo ""
echo -e "  ${BLUE}📱 Scan the QR code with Expo Go (Android/iOS)${NC}"
echo -e "     — no manual IP config needed, it auto-detects.${NC}"
echo ""
