const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixApiRoutes() {
  // Find all API route files
  const files = await glob('src/app/api/**/route.ts', { cwd: __dirname });

  let fixedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has dynamic export
    if (content.includes('export const dynamic')) {
      console.log(`⏭️  Skipped: ${file} (already has dynamic export)`);
      skippedCount++;
      continue;
    }

    // Find the first import statement
    const lines = content.split('\n');
    let insertIndex = 0;

    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0 && lines[i].trim() === '') {
        // Found blank line after imports
        break;
      }
    }

    // Insert after imports and blank line
    if (insertIndex > 0) {
      lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'");
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    } else {
      console.log(`⚠️  Warning: Could not find import statements in ${file}`);
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log(`⏭️  Skipped ${skippedCount} files`);
}

fixApiRoutes().catch(console.error);
