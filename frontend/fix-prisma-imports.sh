#!/bin/bash

echo "🔧 Fixing missing Prisma imports..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Find all API route files that use prisma but might be missing imports
API_FILES=$(find app/api -name "*.ts" -type f)

for file in $API_FILES; do
    echo -e "${YELLOW}Checking $file...${NC}"
    
    # Check if file contains prisma usage but no import
    if grep -q "prisma\." "$file" && ! grep -q "import.*prisma.*from.*@/lib/prisma" "$file"; then
        echo -e "${GREEN}Found prisma usage without import in $file${NC}"
        
        # Add the import after NextRequest/NextResponse imports
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
        
        echo -e "${GREEN}✅ Added prisma import to $file${NC}"
    else
        echo -e "${YELLOW}No missing imports found in $file${NC}"
    fi
done

echo -e "${GREEN}🎉 All missing Prisma imports have been fixed!${NC}"
