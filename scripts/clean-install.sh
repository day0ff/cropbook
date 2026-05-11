set -e

echo "Cleaning root node_modules and pnpm lockfile..."
rm -rf node_modules
rm -f pnpm-lock.yaml
rm -rf dist

echo "Cleaning node_modules in apps and packages..."
find apps packages -name node_modules -type d -prune -exec rm -rf '{}' +
find apps packages -name dist -type d -prune -exec rm -rf '{}' +

echo "Pruning pnpm store..."
pnpm store prune

echo "Reinstalling dependencies..."
pnpm install

echo "✅ All done!"