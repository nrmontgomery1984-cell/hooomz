@echo off
REM Hooomz Profile™ Setup Script for Windows
REM This script automates the initial setup process

echo 🏠 Setting up Hooomz Profile™...
echo.

REM Check Node.js version
node -v
echo.

REM Install root dependencies
echo 📦 Installing dependencies...
call npm install

REM Install workspace dependencies
echo.
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo 📦 Installing server dependencies...
cd server
call npm install
cd ..

echo.
echo 📦 Installing shared dependencies...
cd shared
call npm install
cd ..

REM Create .env files from examples
echo.
echo 🔐 Setting up environment files...

if not exist client\.env (
  copy client\.env.example client\.env
  echo ✓ Created client\.env (please configure)
)

if not exist server\.env (
  copy server\.env.example server\.env
  echo ✓ Created server\.env (please configure)
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Configure client\.env with your Supabase credentials
echo 2. Configure server\.env with your Supabase credentials
echo 3. Run database migrations (see docs\dev-setup.md)
echo 4. Start dev servers: npm run dev
echo.
echo 📖 Documentation: docs\README.md
echo 🚀 Happy coding!
pause
