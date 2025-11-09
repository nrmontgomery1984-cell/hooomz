#!/bin/bash

# Hooomz Profile™ Setup Script
# This script automates the initial setup process

echo "🏠 Setting up Hooomz Profile™..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

# Install root dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install workspace dependencies
echo ""
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo ""
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo ""
echo "📦 Installing shared dependencies..."
cd shared && npm install && cd ..

# Create .env files from examples
echo ""
echo "🔐 Setting up environment files..."

if [ ! -f client/.env ]; then
  cp client/.env.example client/.env
  echo "✓ Created client/.env (please configure)"
fi

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "✓ Created server/.env (please configure)"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure client/.env with your Supabase credentials"
echo "2. Configure server/.env with your Supabase credentials"
echo "3. Run database migrations (see docs/dev-setup.md)"
echo "4. Start dev servers: npm run dev"
echo ""
echo "📖 Documentation: docs/README.md"
echo "🚀 Happy coding!"
