#!/bin/bash

# AWS EC2 Setup Script for HostTrack Backend
# This script sets up a new EC2 instance for hosting the Node.js backend

echo "🚀 Setting up EC2 instance for HostTrack backend..."

# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy
sudo yum install -y nginx

# Create application directory
sudo mkdir -p /var/www/hosttrack
sudo chown ec2-user:ec2-user /var/www/hosttrack

# Install git
sudo yum install -y git

# Clone your repository (replace with your actual repo URL)
# git clone https://github.com/yourusername/hosttrack.git /var/www/hosttrack

echo "✅ EC2 setup complete!"
echo "📁 Application directory: /var/www/hosttrack"
echo "🔧 Node.js version: $(node --version)"
echo "📦 PM2 version: $(pm2 --version)"
echo "🌐 Nginx version: $(nginx -v 2>&1)"
