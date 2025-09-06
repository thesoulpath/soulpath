#!/bin/bash

echo "🔧 Optimizing Prisma connections for better performance..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all API route files that use PrismaClient
API_FILES=$(find app/api -name "*.ts" -type f)

for file in $API_FILES; do
    echo -e "${YELLOW}Processing $file...${NC}"
    
    # Check if file contains PrismaClient import
    if grep -q "PrismaClient" "$file"; then
        echo -e "${GREEN}Found PrismaClient in $file${NC}"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Replace PrismaClient import and instantiation
        sed -i '' '/import.*PrismaClient.*from.*@prisma\/client/d' "$file"
        sed -i '' '/const prisma = new PrismaClient();/d' "$file"
        
        # Add the new import at the top (after NextRequest/NextResponse imports)
        if grep -q "NextRequest\|NextResponse" "$file"; then
            # Add after NextRequest/NextResponse imports
            sed -i '' '/import.*NextRequest\|import.*NextResponse/a\
import { prisma } from '"'"'@/lib/prisma'"'"';
' "$file"
        else
            # Add at the beginning
            sed -i '' '1i\
import { prisma } from '"'"'@/lib/prisma'"'"';
' "$file"
        fi
        
        echo -e "${GREEN}✅ Updated $file${NC}"
    else
        echo -e "${YELLOW}No PrismaClient found in $file${NC}"
    fi
done

echo -e "${GREEN}🎉 All API routes optimized for better database performance!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the application locally"
echo "2. Deploy to Vercel: vercel --prod"
echo "3. Monitor database connection performance"
