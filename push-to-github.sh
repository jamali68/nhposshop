#!/usr/bin/env bash
# ==============================================================================
# NH POS Shop & Retail SaaS - 1-Click GitHub & Netlify Push Script
# گٹ ہب اور نیٹلی فائی پر کوڈ اپلوڈ / اپڈیٹ کرنے کا خودکار اسکرپٹ
# ==============================================================================

set -e

echo ""
echo "=========================================================="
echo "   🚀 NH POS Shop - GitHub & Netlify Auto-Sync Script    "
echo "=========================================================="
echo ""

# 1. Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed or not in PATH."
    exit 1
fi

# 2. Re-build fresh production bundles for dist/ (Netlify) & docs/ (GitHub Pages)
if [ -f "package.json" ]; then
    echo "📦 Building production assets (dist/ & docs/)..."
    npm run build
fi

# 3. Check git status
echo "🔍 Checking Git repository status..."
if [ ! -d ".git" ]; then
    echo "📁 Initializing new Git repository..."
    git init
    git branch -M main
fi

# 4. Check or configure remote origin
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$CURRENT_REMOTE" ]; then
    echo ""
    echo "⚠️  کوئی GitHub Repository URL منسلک نہیں ہے۔"
    echo "برائے مہربانی اپنا GitHub Repository لنک درج کریں:"
    echo "مثلاً: https://github.com/USERNAME/REPO_NAME.git"
    echo "یا ٹوکن کے ساتھ: https://YOUR_TOKEN@github.com/USERNAME/REPO_NAME.git"
    echo ""
    read -r -p "Enter GitHub Repo URL: " USER_REPO_URL

    if [ -z "$USER_REPO_URL" ]; then
        echo "❌ کوئی URL درج نہیں کیا گیا۔ اسکرپٹ بند ہو رہا ہے۔"
        exit 1
    fi

    git remote add origin "$USER_REPO_URL"
    echo "✅ Remote origin شامل کر دیا گیا: $USER_REPO_URL"
else
    echo "🔗 موجودہ GitHub Repository: $CURRENT_REMOTE"
fi

# 5. Stage all changes
echo "➕ Staging all modified files..."
git add .

# 6. Commit changes
COMMIT_MSG="${1:-Fix password hash verification for GitHub Pages and Netlify}"
echo "📝 Creating commit: \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG" || echo "ℹ️ No new changes to commit."

# 7. Push to GitHub
echo "🚀 Pushing changes to GitHub main branch..."
git branch -M main
git push -u origin main

echo ""
echo "=========================================================="
echo "🎉 مبارک ہو! کوڈ کامیابی سے GitHub پر اپڈیٹ ہو گیا ہے۔"
echo "GitHub Pages اور Netlify پر آٹومیٹک بلڈ شروع ہو چکی ہے۔"
echo "=========================================================="
echo ""
