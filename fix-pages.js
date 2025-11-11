const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixPages() {
  // Find all page files
  const files = await glob('src/app/**/page.tsx', { cwd: __dirname });

  let fixedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has dynamic export or is a client component ('use client')
    if (content.includes('export const dynamic')) {
      console.log(`⏭️  Skipped: ${file} (already has dynamic export)`);
      skippedCount++;
      continue;
    }

    // Check if it's a 'use client' component
    const isClientComponent = content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"');

    if (isClientComponent) {
      // Add after 'use client'
      content = content.replace(
        /('use client'|"use client")\s*\n/,
        "$1\n\nexport const dynamic = 'force-dynamic'\n"
      );
    } else {
      // Add at the top for server components
      content = "export const dynamic = 'force-dynamic'\n\n" + content;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);
  console.log(`⏭️  Skipped ${skippedCount} files`);
}

fixPages().catch(console.error);
