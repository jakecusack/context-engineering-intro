#!/bin/bash

# 🚀 Deepify.org PRP Parsing MCP Server Deployment Script
# Run this on a compatible system (Intel/AMD64, macOS, or Linux)

echo "🚀 Deploying Deepify.org PRP Parsing MCP Server..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo "🔐 Logging into Cloudflare..."
wrangler login

# Set up secrets
echo "🔑 Setting up environment secrets..."
echo "Please enter the following values when prompted:"

echo "Setting GITHUB_CLIENT_ID..."
wrangler secret put GITHUB_CLIENT_ID

echo "Setting GITHUB_CLIENT_SECRET..."
wrangler secret put GITHUB_CLIENT_SECRET

echo "Setting COOKIE_ENCRYPTION_KEY..."
wrangler secret put COOKIE_ENCRYPTION_KEY

echo "Setting ANTHROPIC_API_KEY..."
wrangler secret put ANTHROPIC_API_KEY

echo "Setting DATABASE_URL..."
wrangler secret put DATABASE_URL

echo "Setting ANTHROPIC_MODEL (optional)..."
wrangler secret put ANTHROPIC_MODEL

# Build and deploy
echo "🔨 Building and deploying..."
npm run build 2>/dev/null || echo "No build script found, proceeding with deployment..."

echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo "✅ Deployment complete!"
echo "🌐 Your MCP server should now be available at your configured domain."
echo "📋 Don't forget to:"
echo "   1. Set up your database schema (see src/database/schema.sql)"
echo "   2. Configure your custom domain in Cloudflare Dashboard"
echo "   3. Test your MCP tools"
echo "   4. Set up monitoring"