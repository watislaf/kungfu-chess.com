#!/bin/bash

# Update system
apt-get update -y
apt-get upgrade -y

# Install dependencies
apt-get install -y curl wget git nginx htop unzip

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /opt/chess-app
cd /opt/chess-app

# Clone repository (replace with your actual repo)
%{ if github_repo != "" }
git clone ${github_repo} .
git checkout ${github_branch}
%{ else }
# Create a placeholder structure if no repo is provided
mkdir -p app components lib
echo '{"name": "rapid-chess-online", "version": "1.0.0"}' > package.json
%{ endif }

# Set ownership
chown -R ubuntu:ubuntu /opt/chess-app

# Install dependencies and build (run as ubuntu user)
sudo -u ubuntu bash << 'EOF'
cd /opt/chess-app

# Install dependencies
npm install --production

# Install dev dependencies needed for build
npm install --only=dev

# Build the application
npm run build

# If you have a deploy script, run it
if [ -f package.json ] && npm run | grep -q "deploy"; then
    npm run deploy
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: 'chess-server',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: '${app_port}',
      AWS_REGION: '${aws_region}',
      DYNAMODB_PLAYERS_TABLE: '${dynamodb_players_table}',
      DYNAMODB_GAMES_TABLE: '${dynamodb_games_table}',
      DYNAMODB_MATCHMAKING_TABLE: '${dynamodb_matchmaking_table}'
    },
    error_file: '/var/log/chess-app/error.log',
    out_file: '/var/log/chess-app/access.log',
    log_file: '/var/log/chess-app/combined.log'
  }]
};
EOFPM2

EOF

# Create log directory
mkdir -p /var/log/chess-app
chown ubuntu:ubuntu /var/log/chess-app

# Configure Nginx (optional reverse proxy)
%{ if domain_name != "" }
cat > /etc/nginx/sites-available/chess-app << 'EOFNGINX'
server {
    listen 80;
    server_name ${domain_name};

    location / {
        proxy_pass http://localhost:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Specific Socket.IO handling
    location /socket.io/ {
        proxy_pass http://localhost:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
EOFNGINX
%{ else }
# Default configuration for non-domain deployments
cat > /etc/nginx/sites-available/chess-app << 'EOFNGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Specific Socket.IO handling
    location /socket.io/ {
        proxy_pass http://localhost:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
EOFNGINX
%{ endif }

# Enable the site
ln -s /etc/nginx/sites-available/chess-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Start the application with PM2
sudo -u ubuntu bash << 'EOF'
cd /opt/chess-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF

# Get the startup command from PM2 and execute it
PM2_STARTUP_CMD=$(sudo -u ubuntu pm2 startup | grep 'sudo' | tail -1)
if [ ! -z "$PM2_STARTUP_CMD" ]; then
    eval $PM2_STARTUP_CMD
fi

# Enable and start nginx
systemctl enable nginx
systemctl start nginx

# Configure firewall (UFW)
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow ${app_port}/tcp

# Create a simple health check script
cat > /opt/chess-app/health-check.sh << 'EOFHEALTH'
#!/bin/bash
response=$(curl -s -o /dev/null -w "%%{http_code}" http://localhost:${app_port})
if [ $response -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $response)"
    exit 1
fi
EOFHEALTH

chmod +x /opt/chess-app/health-check.sh

# Set up log rotation
cat > /etc/logrotate.d/chess-app << 'EOFLOGROTATE'
/var/log/chess-app/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        sudo -u ubuntu pm2 reloadLogs
    endscript
}
EOFLOGROTATE

# Create deployment script for future updates
cat > /opt/chess-app/deploy.sh << 'EOFDEPLOY'
#!/bin/bash
cd /opt/chess-app

echo "Pulling latest changes..."
git pull origin ${github_branch}

echo "Installing dependencies..."
npm install --production

echo "Building application..."
if npm run | grep -q "deploy"; then
    npm run deploy
fi

echo "Restarting application..."
pm2 reload chess-server

echo "Deployment complete!"
EOFDEPLOY

chmod +x /opt/chess-app/deploy.sh
chown ubuntu:ubuntu /opt/chess-app/deploy.sh

# Log deployment completion
echo "Chess application deployment completed at $(date)" >> /var/log/deployment.log 