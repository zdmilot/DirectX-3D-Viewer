const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const pngToIco = require('png-to-ico');

const SVG_PATH = path.join(__dirname, 'icon.svg');
const ICO_PATH = path.join(__dirname, 'icon.ico');
const PNG_PATH = path.join(__dirname, 'icon.png');

const svgData = fs.readFileSync(SVG_PATH, 'utf8');

function renderPng(svg, size) {
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
    return resvg.render().asPng();
}

// Save 256x256 PNG
const png256 = renderPng(svgData, 256);
fs.writeFileSync(PNG_PATH, png256);
console.log(`Saved ${PNG_PATH} (256x256)`);

// Generate ICO from multiple PNGs
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = sizes.map(sz => renderPng(svgData, sz));

// png-to-ico accepts an array of PNG buffers
pngToIco(pngBuffers).then(ico => {
    fs.writeFileSync(ICO_PATH, ico);
    console.log(`Saved ${ICO_PATH} with sizes [${sizes.join(', ')}]`);
}).catch(err => {
    console.error('ICO generation failed:', err);
    process.exit(1);
});
