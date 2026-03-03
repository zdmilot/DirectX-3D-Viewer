const THREE = require('./js/lib/three.min.js');
global.THREE = THREE;
const XFileLoader = require('./js/lib/XFileLoader.js');
const fs = require('fs');
const loader = new XFileLoader();
loader._parse(fs.readFileSync('./test.x'), function(result) {
  const geom = result.models[0].geometry;
  const pos = geom.getAttribute('position');
  const norm = geom.getAttribute('normal');
  const total = pos.count / 3;
  let elongated = [];
  for (let t = 0; t < total; t++) {
    const i = t * 3;
    const ax = pos.array[i*3], ay = pos.array[i*3+1], az = pos.array[i*3+2];
    const bx = pos.array[(i+1)*3], by = pos.array[(i+1)*3+1], bz = pos.array[(i+1)*3+2];
    const cx = pos.array[(i+2)*3], cy = pos.array[(i+2)*3+1], cz = pos.array[(i+2)*3+2];
    const ab = Math.sqrt((bx-ax)**2+(by-ay)**2+(bz-az)**2);
    const bc = Math.sqrt((cx-bx)**2+(cy-by)**2+(cz-bz)**2);
    const ca = Math.sqrt((ax-cx)**2+(ay-cy)**2+(az-cz)**2);
    const maxE = Math.max(ab, bc, ca);
    const minE = Math.min(ab, bc, ca);
    if (minE > 1e-8 && maxE / minE > 100) {
      elongated.push({tri: t, ratio: (maxE/minE).toFixed(1),
        a: [ax.toFixed(3), ay.toFixed(3), az.toFixed(3)],
        b: [bx.toFixed(3), by.toFixed(3), bz.toFixed(3)],
        c: [cx.toFixed(3), cy.toFixed(3), cz.toFixed(3)],
        n: [norm.array[i*3].toFixed(3), norm.array[i*3+1].toFixed(3), norm.array[i*3+2].toFixed(3)]
      });
    }
  }
  console.log('Elongated triangles in Model 0:', elongated.length);
  elongated.slice(0, 5).forEach(function(e) { console.log(JSON.stringify(e)); });
  if (elongated.length > 5) console.log('... and', elongated.length - 5, 'more');
});
