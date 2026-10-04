import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('docs/assets');
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.svg'));

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace unescaped & with &amp;
  const fixedContent = content.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  
  // Ensure XML declaration
  let finalContent = fixedContent;
  if (!finalContent.trim().startsWith('<?xml')) {
    finalContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + finalContent;
  }
  
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log(`Fixed XML entities in ${file}`);
}
