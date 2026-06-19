const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const MASTER = path.join(PUBLIC, 'vidyalaya-logo.png'); // detailed 1254px logo, white bg

async function main() {
  const master = fs.readFileSync(MASTER);
  const white = { r: 255, g: 255, b: 255 };

  // Full-logo square icons (opaque, white background)
  const squares = {
    'icon-512.png': 512,
    'icon-192.png': 192,
    'apple-touch-icon.png': 180,
    'favicon-48.png': 48,
    'favicon-32.png': 32,
  };
  for (const [name, size] of Object.entries(squares)) {
    await sharp(master)
      .resize(size, size, { fit: 'contain', background: white })
      .flatten({ background: white })
      .png()
      .toFile(path.join(PUBLIC, name));
  }

  // Maskable: logo at 80% (safe zone) centered on full-bleed white (no navy frame)
  const CANVAS = 512;
  const INNER = Math.round(CANVAS * 0.80);
  const off = Math.round((CANVAS - INNER) / 2);
  const logo = await sharp(master)
    .resize(INNER, INNER, { fit: 'contain', background: white })
    .flatten({ background: white })
    .png()
    .toBuffer();
  await sharp({ create: { width: CANVAS, height: CANVAS, channels: 3, background: white } })
    .composite([{ input: logo, top: off, left: off }])
    .png()
    .toFile(path.join(PUBLIC, 'icon-512-maskable.png'));

  // favicon.svg and logo.svg now literally contain the real logo (embedded PNG)
  const embed = async (px) => {
    const buf = await sharp(master)
      .resize(px, px, { fit: 'contain', background: white })
      .flatten({ background: white })
      .png()
      .toBuffer();
    const b64 = buf.toString('base64');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}"><image width="${px}" height="${px}" href="data:image/png;base64,${b64}"/></svg>`;
  };
  fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), await embed(64));
  fs.writeFileSync(path.join(PUBLIC, 'logo.svg'), await embed(256));

  console.log('Icons regenerated from vidyalaya-logo.png');
}

main().catch((e) => { console.error(e); process.exit(1); });