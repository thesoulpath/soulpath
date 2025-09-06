#!/bin/bash

echo "🔧 Fixing Vercel Environment Variables..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to remove environment variable
remove_env_var() {
    local var_name=$1
    local env=$2
    
    echo -e "${YELLOW}Removing $var_name from $env...${NC}"
    echo "y" | vercel env rm "$var_name" "$env" 2>/dev/null || echo "Variable $var_name not found in $env"
}

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local value=$2
    local env=$3
    
    echo -e "${YELLOW}Adding $var_name to $env...${NC}"
    echo "$value" | vercel env add "$var_name" "$env"
}

# Get current environment variables from .env file
echo -e "${GREEN}Reading environment variables from .env file...${NC}"

# Read variables from .env file
DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
DIRECT_URL=$(grep "^DIRECT_URL=" .env | cut -d'=' -f2- | tr -d '"')
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2- | tr -d '"')
NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2- | tr -d '"')
SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d'=' -f2- | tr -d '"')

echo -e "${GREEN}Environment variables loaded:${NC}"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "DIRECT_URL: ${DIRECT_URL:0:50}..."
echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:50}..."
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

# Environments to update
ENVIRONMENTS=("production" "preview" "development")

for env in "${ENVIRONMENTS[@]}"; do
    echo -e "${GREEN}Processing $env environment...${NC}"
    
    # Remove existing variables
    remove_env_var "DATABASE_URL" "$env"
    remove_env_var "DIRECT_URL" "$env"
    remove_env_var "JWT_SECRET" "$env"
    remove_env_var "NEXT_PUBLIC_SUPABASE_URL" "$env"
    remove_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
    remove_env_var "SUPABASE_SERVICE_ROLE_KEY" "$env"
    
    # Add variables with correct values
    add_env_var "DATABASE_URL" "$DATABASE_URL" "$env"
    add_env_var "DIRECT_URL" "$DIRECT_URL" "$env"
    add_env_var "JWT_SECRET" "$JWT_SECRET" "$env"
    add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "$env"
    add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
    add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "$env"
    
    echo -e "${GREEN}✅ $env environment updated${NC}"
done

echo -e "${GREEN}🎉 All environment variables have been updated!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy to production: vercel --prod"
echo "2. Test the login: curl -X POST https://your-domain.vercel.app/api/auth/login"
echo "3. Check database connection: curl https://your-domain.vercel.app/api/health"
