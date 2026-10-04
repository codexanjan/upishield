import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('docs/assets');
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.svg'));

console.log(`Found ${files.length} SVGs in ${assetsDir}`);

for (const file of files) {
  const svgPath = path.join(assetsDir, file);
  const pngName = file.replace('.svg', '.png');
  const pngPath = path.join(assetsDir, pngName);
  
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    // Render at 2x density (2400 width) for ultra-sharp retina screens
    await sharp(svgBuffer, { density: 150 })
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(pngPath);
    
    const stats = fs.statSync(pngPath);
    console.log(`Converted ${file} -> ${pngName} (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`Failed to convert ${file}:`, err.message);
  }
}
