# Kung Fu Chess Online - Real-Time Multiplayer Chess Game

🚀 **Play Chess Like Never Before** - Experience the revolutionary **simultaneous chess** gameplay where both players move at the same time! No turns, no waiting - just pure chess strategy at lightning speed.


https://github.com/user-attachments/assets/2dcac36f-a8e5-46cd-b907-8773ee9da3c1


 


🌐 **Play Now**: [https://kungfu-chess.com](https://kungfu-chess.com)

## What is Kung Fu Chess?

**Kung Fu Chess** (also known as **Rapid Chess**, **Real-Time Chess**, or **Simultaneous Chess**) is a revolutionary chess variant where traditional turn-based gameplay is replaced with **real-time simultaneous movement**. Both players can move their pieces at any time, creating intense, fast-paced chess battles that test your tactical thinking and quick decision-making skills.

### 🎯 Key Features

- **⚡ Real-Time Multiplayer Chess**: Play against opponents worldwide in simultaneous chess matches
- **🏆 ELO Ranking System**: Competitive ranking from Novice (0-999) to Grandmaster (2200+)
- **🎮 Smart Matchmaking**: Rank-based player matching with quick random opponent finder
- **📊 Game History & Statistics**: Track your wins, losses, and chess improvement over time
- **🔥 Move Cooldowns**: Strategic piece cooldowns prevent spam and encourage tactical play
- **📱 Mobile-Friendly**: Responsive design works perfectly on desktop, tablet, and mobile
- **🛡️ Secure Authentication**: User registration with persistent player profiles
- **☁️ AWS Cloud Infrastructure**: Scalable, reliable multiplayer chess server

## 🚀 How to Play Kung Fu Chess

1. **Create Account** - Register for free to track your chess progress and rankings
2. **Find Opponent** - Use quick matchmaking or create private chess rooms with friends
3. **Play Real-Time** - Move your chess pieces simultaneously with your opponent
4. **Master Strategy** - Learn to balance speed with chess tactics and positioning
5. **Climb Rankings** - Win games to increase your ELO rating and earn chess titles

### 🎯 Chess Game Rules

- **Standard Chess Rules Apply**: All traditional chess piece movements and captures
- **Simultaneous Movement**: Both players can move at any time (no turn-based waiting)
- **Move Limits**: Maximum moves per 10-second interval to prevent spam
- **Piece Cooldowns**: Recently moved pieces have temporary cooldown periods
- **Win Conditions**: Checkmate, resignation, or time-based victory

## 🛠️ Technology Stack

### Frontend Chess Client
- **Next.js 15.3.2** - Modern React framework with server-side rendering for fast chess gameplay
- **React 19.0.0** - Latest React with concurrent features for smooth chess gameplay
- **TypeScript** - Type-safe chess game development
- **Tailwind CSS 3.4.17** - Beautiful, responsive chess board design
- **Socket.IO Client 4.8.1** - Real-time chess move synchronization
- **Chess.js 1.0.0-beta.8** - Complete chess rule validation and game logic
- **Radix UI** - Accessible component primitives for dialogs and UI elements

### Backend Chess Server
- **Node.js** - High-performance chess game server
- **Express.js 5.1.0** - RESTful API for chess game management
- **Socket.IO 4.8.1** - WebSocket-based real-time chess communication
- **AWS DynamoDB** - Scalable NoSQL database for player profiles and chess games
- **AWS SDK v3** - Modern AWS service integration

### Cloud Infrastructure
- **AWS EC2** - Reliable chess game server hosting
- **AWS Application Load Balancer** - High-availability chess game distribution
- **AWS VPC** - Secure network infrastructure for chess gameplay
- **HTTPS/WSS** - Encrypted chess game connections
- **Terraform** - Infrastructure as Code for reproducible chess server deployment

## 🎮 Chess Game Features

### Authentication & Player Management
- **User Registration**: Create your chess player profile with unique username
- **Secure Login**: Password-protected chess accounts with session management
- **Player Statistics**: Comprehensive chess game history and performance metrics
- **ELO Rating System**: Competitive chess ranking with skill-based matchmaking

### Chess Gameplay Mechanics
- **Real-Time Chess Board**: Responsive chess piece movement with visual feedback
- **Move Validation**: Server-side chess rule enforcement and legal move checking
- **Game Synchronization**: Real-time chess board state sync between players
- **Spectator Mode**: Watch ongoing chess matches as observer

### Ranking & Competition
- **Chess Titles**: Progress through ranks from Novice to Grandmaster
  - 🟤 **Novice** (0-999 ELO) - Learning chess basics and simultaneous play
  - 🟢 **Beginner** (1000-1199 ELO) - Developing chess tactics and speed
  - 🔵 **Amateur** (1200-1399 ELO) - Solid chess fundamentals with quick play
  - 🟡 **Intermediate** (1400-1599 ELO) - Advanced chess strategy and positioning
  - 🟠 **Advanced** (1600-1799 ELO) - Expert-level chess with rapid execution
  - 🔴 **Expert** (1800-1999 ELO) - Master-class chess tactics and endgames
  - 🟣 **Master** (2000-2199 ELO) - Elite chess skills with lightning-fast play
  - 👑 **Grandmaster** (2200+ ELO) - Legendary chess mastery in real-time format

### Matchmaking System
- **Quick Match**: Instant chess opponent finding based on your skill level
- **Private Rooms**: Create custom chess games with friends using room codes
- **Skill-Based Matching**: Algorithm matches players of similar chess ability
- **Global Player Pool**: Play chess against opponents from around the world

## 🏗️ Local Development Setup

### Prerequisites for Chess Development
- **Node.js 18+** and npm (for running the chess application)
  - Check version: `node --version` (should be 18.0.0 or higher)
  - Check npm: `npm --version`
- **Git** (for cloning the chess game repository)
  - Check version: `git --version`
- **Modern Web Browser** (Chrome, Firefox, Safari, or Edge)
- **AWS CLI** (optional, for cloud deployment)
- **Code Editor** (VS Code, WebStorm, or similar)

### 🚀 Detailed Setup Guide

#### Step 1: Environment Preparation
First, ensure your development environment is ready:

```bash
# Check Node.js version (must be 18+)
node --version

# Check npm version
npm --version

# If Node.js is outdated, install latest LTS version from https://nodejs.org/
```

#### Step 2: Clone and Navigate to Project
```bash
# Clone the repository
git clone https://github.com/watislaf/kungfu-chess.com.git

# Navigate to project directory
cd kungfu-chess.com

# Check project structure
ls -la
```

#### Step 3: Install Dependencies
```bash
# Install all project dependencies (this may take 2-3 minutes)
npm install

# Verify installation completed successfully
npm list --depth=0
```

#### Step 4: Build the Backend Server
Before running the development server, you need to build the backend:

```bash
# Build the TypeScript backend server
npm run build:server
```

### 🎮 Running the Application

#### Option 1: Full Development Mode (Recommended)
Start both frontend and backend servers simultaneously:

```bash
# Start complete development environment
npm run dev
```

This command does the following:
- Builds the backend server (`npm run build:server`)
- Starts the Next.js frontend on `http://localhost:3000`
- Starts the Express.js backend server with Socket.IO support
- Enables hot reloading for both frontend and backend changes
- Shows combined logs from both servers

**Expected Output:**
```
> concurrently "npm run dev:frontend" "npm run dev:backend"

[0] ▲ Next.js ready on http://localhost:3000
[1] Backend server running on port 3001
[1] Socket.IO server initialized
[1] Database connection established
```

#### Option 2: Frontend Only Development
If you only need to work on the frontend:

```bash
# Start only the Next.js frontend server
npm run dev:frontend
```

Access at: `http://localhost:3000`

**Note:** Without the backend, you won't have:
- Real-time multiplayer functionality
- User authentication
- Game state persistence
- Matchmaking system

#### Option 3: Backend Only Development
If you only need to work on the backend server:

```bash
# First build the server
npm run build:server

# Then start only the backend
npm run dev:backend
```

The backend will run on port 3001 with Socket.IO WebSocket support.

#### Option 4: Production Build Testing
Test the application as it would run in production:

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 🔧 Development Scripts Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run dev` | Start full development environment | Daily development, testing features |
| `npm run dev:frontend` | Frontend only (port 3000) | UI/UX work, component development |
| `npm run dev:backend` | Backend only (port 3001) | API development, server logic |
| `npm run build` | Production build | Before deployment, testing |
| `npm run build:server` | Build TypeScript backend | After backend changes |
| `npm run start` | Production server | Testing production build locally |
| `npm run lint` | Code quality checks | Before committing code |
| `npm run clean` | Clean build artifacts | Troubleshooting build issues |

### 🎯 First-Time Setup Verification

After starting the application, verify everything works:

1. **Frontend Check**: Visit `http://localhost:3000`
   - You should see the Kung Fu Chess homepage
   - Navigation should work (Home, Game, History)

2. **Backend Check**: Look for these console messages:
   ```
   Backend server running on port 3001
   Socket.IO server initialized
   Database connection established
   ```

3. **Test User Registration**:
   - Click "Register" to create a test account
   - Try logging in with development accounts (see below)

4. **Test Game Creation**:
   - Create a new game room
   - Open a second browser tab/window
   - Join the same game with a different account

### 🔑 Development Chess Accounts

For local testing, use these pre-configured accounts:

**Primary Test Account:**
- Username: `tugrza`
- Password: `password123`

**Secondary Test Account:**
- Username: `challenger`
- Password: `password123`

**Testing Multiplayer Games:**
1. Open two browser windows/tabs
2. Log in with different accounts in each window
3. Create a game in one window
4. Join the game from the other window
5. Test real-time chess moves

### 🌐 Accessing Your Local Application

Once running, you can access:

- **Main Application**: `http://localhost:3000`
- **Game Creation**: `http://localhost:3000/game`
- **Game History**: `http://localhost:3000/history`
- **Debug Page**: `http://localhost:3000/debug` (development only)

### 📱 Testing on Mobile Devices

To test on mobile devices on your local network:

1. Find your computer's IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

2. Access from mobile device: `http://YOUR_IP_ADDRESS:3000`

3. Ensure your firewall allows connections on port 3000

### ⚡ Hot Reloading and Development Workflow

The development setup supports hot reloading:

**Frontend Changes (React/Next.js):**
- Save any file in `app/`, `components/`, or `pages/`
- Browser automatically refreshes
- Changes appear immediately

**Backend Changes (Express/Socket.IO):**
- Save any file in `app/services/`, `app/controllers/`, etc.
- Server automatically restarts
- Frontend reconnects to updated backend

**Styling Changes (Tailwind CSS):**
- Save any component with updated classes
- Styles update instantly without page refresh

### 🔍 Development Debugging

#### Enable Debug Logging
Set environment variable for detailed logs:

```bash
# Linux/macOS
DEBUG=chess:* npm run dev

# Windows
set DEBUG=chess:* && npm run dev
```

#### Common Debug Endpoints
- `/debug` - Development debugging page
- Browser DevTools Console - Frontend logs
- Terminal Output - Backend logs

### 🏗️ Project Structure for Development

Understanding the codebase structure:

```
kungfu-chess.com/
├── app/                    # Next.js app directory
│   ├── controllers/        # Backend route controllers
│   ├── models/            # Game logic and data models
│   ├── services/          # Database and external services
│   ├── utils/             # Utility functions
│   └── page.tsx           # Frontend pages
├── components/            # React UI components
│   └── ui/               # Reusable UI components
├── terraform/            # AWS infrastructure code
├── dist/                 # Compiled backend code (auto-generated)
├── .next/                # Next.js build output (auto-generated)
└── package.json          # Dependencies and scripts
```

### 🔄 Typical Development Workflow

1. **Start Development Environment**:
   ```bash
   npm run dev
   ```

2. **Make Changes**: Edit files in `app/`, `components/`, or other directories

3. **Test Changes**: Check browser and console for updates

4. **Run Code Quality Checks**:
   ```bash
   npm run lint
   ```

5. **Build and Test Production**:
   ```bash
   npm run build
   npm start
   ```

This setup provides everything you need for local Kung Fu Chess development!

## 🛠️ Troubleshooting Common Issues

### Installation Problems

#### Node.js Version Issues
**Problem**: `npm install` fails or shows compatibility errors

**Solution**:
```bash
# Check your Node.js version
node --version

# If version is below 18.0.0, update Node.js
# Visit https://nodejs.org/ and install the latest LTS version

# Clear npm cache if needed
npm cache clean --force

# Remove node_modules and package-lock.json, then reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Dependency Installation Failures
**Problem**: `npm install` hangs or fails with network errors

**Solutions**:
```bash
# Try using a different registry
npm install --registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force

# Use yarn instead of npm (if available)
yarn install

# Check internet connection and firewall settings
```

#### Permission Errors (Linux/macOS)
**Problem**: Permission denied errors during installation

**Solution**:
```bash
# Fix npm permissions (don't use sudo with npm)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Then retry installation
npm install
```

### Server Startup Issues

#### Backend Build Failures
**Problem**: `npm run build:server` fails with TypeScript errors

**Solutions**:
```bash
# Check TypeScript configuration
npx tsc --version

# Clean and rebuild
npm run clean
npm run build:server

# If specific TypeScript errors occur, check:
# - tsconfig.server.json configuration
# - Missing type definitions
# - Import/export statement syntax
```

#### Port Already in Use
**Problem**: `Error: listen EADDRINUSE :::3000` or similar port errors

**Solutions**:
```bash
# Find what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process using the port
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use a different port
PORT=3001 npm run dev
```

#### Frontend Won't Start
**Problem**: Next.js development server fails to start

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild everything
npm run clean
npm install
npm run dev

# Check for conflicting packages
npm ls
```

### Runtime Issues

#### WebSocket Connection Failures
**Problem**: "WebSocket connection failed" in browser console

**Solutions**:
1. **Check Backend Status**: Ensure backend server is running (you should see "Socket.IO server initialized")
2. **Firewall Issues**: Allow ports 3000 and 3001 through firewall
3. **Browser Extensions**: Disable ad blockers or privacy extensions temporarily
4. **Network Configuration**: Check if corporate firewall blocks WebSocket connections

```bash
# Test WebSocket connection manually
curl -I http://localhost:3001/socket.io/
```

#### Game State Not Syncing
**Problem**: Chess moves don't appear in real-time between players

**Debugging Steps**:
1. **Check Browser Console**: Look for JavaScript errors
2. **Check Backend Logs**: Look for Socket.IO connection messages
3. **Test with Development Accounts**: Use the provided test accounts
4. **Network Tab**: Check for failed WebSocket messages in browser DevTools

#### Authentication Issues
**Problem**: Cannot login or register users

**Solutions**:
1. **Check Backend Database**: Ensure backend server started successfully
2. **Clear Browser Data**: Clear cookies and localStorage for localhost
3. **Test with Development Accounts**: Try the pre-configured accounts first

```bash
# Clear browser storage (in browser console)
localStorage.clear()
sessionStorage.clear()
```

### Performance Issues

#### Slow Application Loading
**Problem**: Application takes too long to load or respond

**Solutions**:
```bash
# Check if running in development mode (expected to be slower)
npm run build
npm start  # Test production build performance

# Check system resources
top  # Linux/macOS
taskmgr  # Windows

# Optimize development setup
npm run dev:frontend  # Run only frontend if backend not needed
```

#### High Memory Usage
**Problem**: Development server uses too much memory

**Solutions**:
- Close unused browser tabs
- Restart development servers periodically
- Use production build for performance testing
- Consider running frontend and backend separately

### Environment-Specific Issues

#### Windows-Specific Problems
**Problem**: Path or script execution issues on Windows

**Solutions**:
```bash
# Use PowerShell or Command Prompt as Administrator
# Install windows-build-tools if needed
npm install --global windows-build-tools

# For path issues, use cross-env
npm install --save-dev cross-env
```

#### macOS-Specific Problems
**Problem**: Xcode command line tools missing

**Solution**:
```bash
# Install Xcode command line tools
xcode-select --install
```

#### Linux-Specific Problems
**Problem**: Missing build dependencies

**Solutions**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
```

### Database and Backend Issues

#### AWS Connection Errors
**Problem**: Cannot connect to AWS services in development

**Note**: The application works in development mode without AWS. AWS is only needed for production deployment.

**For Development**:
- The app uses in-memory storage for development
- No AWS configuration required for local testing
- Focus on frontend functionality and game logic

### Getting Help

If you're still experiencing issues:

1. **Check Console Logs**: Look for specific error messages in:
   - Terminal where you ran `npm run dev`
   - Browser Developer Tools Console (F12)

2. **Verify Prerequisites**: Double-check all prerequisites are installed correctly

3. **Clean Installation**: Try a completely fresh installation:
   ```bash
   # Remove everything and start over
   rm -rf node_modules .next dist package-lock.json
   npm install
   npm run dev
   ```

4. **Check System Requirements**:
   - Ensure 4GB+ RAM available
   - Ensure 2GB+ free disk space
   - Check antivirus isn't blocking Node.js processes

5. **Environment Information**: When reporting issues, include:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Complete error message from console

## ⚙️ Environment Configuration

### Development Environment Variables

The application works out-of-the-box for local development without additional configuration. However, you can customize behavior using environment variables:

#### Available Environment Variables

Create a `.env.local` file in the project root for custom configuration:

```bash
# .env.local (optional for development)

# Development server ports (default values shown)
PORT=3000                    # Frontend Next.js server port
BACKEND_PORT=3001           # Backend Express server port

# Development mode settings
NODE_ENV=development        # Environment mode (development/production)
DEBUG=false                # Enable debug logging
NEXT_TELEMETRY_DISABLED=1   # Disable Next.js telemetry

# Database settings (development uses in-memory storage)
USE_LOCAL_DB=true           # Use in-memory database for development

# Socket.IO settings
SOCKET_CORS_ORIGIN=http://localhost:3000  # CORS origin for WebSocket

# Development features
ENABLE_DEBUG_PAGE=true      # Enable /debug endpoint
ENABLE_DEV_ACCOUNTS=true    # Enable pre-configured test accounts
```

#### Setting Environment Variables

**Option 1: Create .env.local file** (Recommended)
```bash
# Create environment file
touch .env.local

# Edit with your preferred editor
echo "PORT=3000" >> .env.local
echo "BACKEND_PORT=3001" >> .env.local
```

**Option 2: Inline with commands**
```bash
# Linux/macOS
PORT=3005 npm run dev

# Windows PowerShell
$env:PORT=3005; npm run dev

# Windows Command Prompt
set PORT=3005 && npm run dev
```

**Option 3: Export in shell session**
```bash
# Linux/macOS
export PORT=3005
export BACKEND_PORT=3006
npm run dev

# Windows PowerShell
$env:PORT=3005
$env:BACKEND_PORT=3006
npm run dev
```

### Production Environment Configuration

For production deployment (AWS), additional environment variables are required:

```bash
# Production environment variables (required for AWS deployment)
NODE_ENV=production
AWS_REGION=us-east-1
DYNAMODB_TABLE_PREFIX=kungfu-chess-prod
SSL_CERTIFICATE_ARN=arn:aws:acm:...
DOMAIN_NAME=kungfu-chess.com
```

### Configuration Hierarchy

Environment variables are loaded in this order (later sources override earlier ones):

1. System environment variables
2. `.env` file (committed to repository - avoid sensitive data)
3. `.env.local` file (local development only - not committed)
4. Inline environment variables (highest priority)

### Security Notes

**Important**: Never commit sensitive information to version control!

✅ **Safe for .env files**:
- Development ports and settings
- Feature flags
- Debug settings
- Local database settings

❌ **Never commit**:
- AWS credentials
- API keys
- Database passwords
- SSL certificates
- Production secrets

```bash
# Add to .gitignore (already configured)
.env.local
.env.production
*.key
*.pem
```

### Docker Environment (Optional)

If you prefer using Docker for development:

```dockerfile
# Dockerfile (create if needed)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000 3001
CMD ["npm", "run", "dev"]
```

```yaml
# docker-compose.yml (create if needed)
version: '3.8'
services:
  kungfu-chess:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - BACKEND_PORT=3001
    volumes:
      - .:/app
      - /app/node_modules
```

Run with Docker:
```bash
# Build and start with Docker Compose
docker-compose up --build

# Or with Docker directly
docker build -t kungfu-chess .
docker run -p 3000:3000 -p 3001:3001 kungfu-chess
```

### Environment-Specific Features

#### Development Mode Features
When `NODE_ENV=development`:
- In-memory database (no AWS required)
- Hot reloading enabled
- Debug endpoints available (`/debug`)
- Detailed error messages
- Pre-configured test accounts
- CORS enabled for localhost

#### Production Mode Features
When `NODE_ENV=production`:
- AWS DynamoDB database required
- Optimized builds and caching
- Error logging to CloudWatch
- Security headers enabled
- CORS restricted to production domain
- Compressed assets

### Verifying Configuration

Check that your environment is configured correctly:

```bash
# Check environment variables are loaded
npm run dev

# In browser console or terminal, you should see:
# - Port numbers if customized
# - Environment mode (development/production)
# - Debug status if enabled

# Test configuration with different ports
PORT=3005 BACKEND_PORT=3006 npm run dev
# Then visit http://localhost:3005
```

## ☁️ AWS Cloud Deployment

### Production Chess Server Setup

1. **Configure Terraform Variables**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit Chess Server Configuration**:
   ```hcl
   project_name = "kungfu-chess"
   environment = "production"
   aws_region = "us-east-1"
   instance_type = "t3.micro"
   domain_name = "kungfu-chess.com"
   ssl_certificate_arn = "your-ssl-cert-arn"
   ```

3. **Deploy Chess Infrastructure**:
   ```bash
   ./deploy.sh
   ```

### Chess Server Infrastructure
- **Load Balancer**: Distributes chess game traffic across multiple servers
- **Auto Scaling**: Handles chess game load spikes automatically
- **Database**: DynamoDB tables for chess players, games, and matchmaking
- **Security**: VPC isolation and security groups for chess server protection
- **Monitoring**: CloudWatch logs for chess game performance tracking

## 🎯 SEO Keywords

**Primary Chess Keywords**: kung fu chess, real-time chess, simultaneous chess, rapid chess online, multiplayer chess game, chess no turns, instant chess, speed chess, live chess, online chess game

**Chess Gameplay Terms**: chess strategy, chess tactics, chess rankings, ELO chess rating, competitive chess, chess matchmaking, chess variants, modern chess, innovative chess, chess with friends

**Technical Chess Terms**: WebSocket chess, real-time chess game, chess game development, Node.js chess, React chess board, chess game server, multiplayer chess architecture

## 🤝 Contributing to Chess Development

We welcome contributions to improve the chess game! Whether you're interested in:
- **Chess Game Logic**: Improving move validation, endgame detection, or rule implementation
- **User Interface**: Enhancing the chess board design, player profiles, or game statistics
- **Performance**: Optimizing real-time chess communication or server scaling
- **New Features**: Adding chess variants, tournaments, or social features

## 📄 Chess Game License

This chess game is open source and available under the MIT License. Feel free to fork, modify, and deploy your own version of this real-time chess application.

## 🔗 Chess Game Links

- **Play Chess Now**: [https://kungfu-chess.com](https://kungfu-chess.com)
- **GitHub Repository**: [Source Code](https://github.com/watislaf/kungfu-chess.com)
- **Documentation**: Comprehensive setup and deployment guides
- **Support**: Community-driven chess game support and feature requests

---

*Experience the future of chess gaming with Kung Fu Chess Online - where strategy meets speed in the ultimate real-time chess challenge!*
