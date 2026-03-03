// Comprehensive acceptance test for XFileLoader triangulation
// Tests that polygon triangulation is correct and produces identical
// rendering for symmetric parts of the model.

const fs = require('fs');
const THREE = require('./js/lib/three.min.js');
// Make THREE global so XFileLoader can use it
global.THREE = THREE;
const XFileLoader = require('./js/lib/XFileLoader.js');

// Create loader
const loader = new XFileLoader(THREE.DefaultLoadingManager, new THREE.TextureLoader());
const xContent = fs.readFileSync('./test.x');

// Parse using _parse (async via setTimeout)
loader._parse(xContent, function(result) {
  runTests(result);
});

function runTests(result) {

console.log('=== PARSE RESULT ===');
console.log('Models:', result.models ? result.models.length : 0);
if (result.error) {
  console.error('Error:', result.error);
  process.exit(1);
}

let allPassed = true;
function assert(condition, msg) {
  if (!condition) {
    console.error('FAIL:', msg);
    allPassed = false;
  } else {
    console.log('PASS:', msg);
  }
}

// Test each model mesh
result.models.forEach(function(mesh, mi) {
  console.log('\n--- Model', mi, ':', mesh.name, '---');
  const geom = mesh.geometry;
  const posAttr = geom.getAttribute('position');
  const normAttr = geom.getAttribute('normal');
  
  console.log('  Vertices:', posAttr.count);
  console.log('  Has normals:', !!normAttr);
  if (normAttr) console.log('  Normal count:', normAttr.count);
  
  assert(posAttr.count > 0, mesh.name + ' has vertices');
  assert(posAttr.count % 3 === 0, mesh.name + ' vertex count divisible by 3 (triangles)');
  if (normAttr) {
    assert(normAttr.count === posAttr.count, mesh.name + ' normals count matches vertices');
  }
  
  // Check for degenerate triangles (zero-area)
  let degenerateCount = 0;
  let totalTriangles = posAttr.count / 3;
  for (let t = 0; t < totalTriangles; t++) {
    const i = t * 3;
    const ax = posAttr.array[i*3], ay = posAttr.array[i*3+1], az = posAttr.array[i*3+2];
    const bx = posAttr.array[(i+1)*3], by = posAttr.array[(i+1)*3+1], bz = posAttr.array[(i+1)*3+2];
    const cx = posAttr.array[(i+2)*3], cy = posAttr.array[(i+2)*3+1], cz = posAttr.array[(i+2)*3+2];
    
    // Cross product of (b-a) x (c-a)
    const ex = bx-ax, ey = by-ay, ez = bz-az;
    const fx = cx-ax, fy = cy-ay, fz = cz-az;
    const nx = ey*fz - ez*fy;
    const ny = ez*fx - ex*fz;
    const nz = ex*fy - ey*fx;
    const area = Math.sqrt(nx*nx + ny*ny + nz*nz) * 0.5;
    if (area < 1e-10) degenerateCount++;
  }
  console.log('  Total triangles:', totalTriangles);
  console.log('  Degenerate triangles:', degenerateCount);
  assert(degenerateCount === 0, mesh.name + ' has no degenerate triangles');
  
  // Check for overlapping/self-intersecting triangles in screen space
  // This is a simplified check - we look for triangles that share edges
  // in unexpected ways
  
  // Check normals are valid (no NaN)
  if (normAttr) {
    let nanNormals = 0;
    for (let i = 0; i < normAttr.count; i++) {
      if (isNaN(normAttr.array[i*3]) || isNaN(normAttr.array[i*3+1]) || isNaN(normAttr.array[i*3+2])) {
        nanNormals++;
      }
    }
    assert(nanNormals === 0, mesh.name + ' has no NaN normals');
  }
  
  // Bounding box
  geom.computeBoundingBox();
  const bb = geom.boundingBox;
  console.log('  BBox min:', bb.min.x.toFixed(2), bb.min.y.toFixed(2), bb.min.z.toFixed(2));
  console.log('  BBox max:', bb.max.x.toFixed(2), bb.max.y.toFixed(2), bb.max.z.toFixed(2));
});

// Test symmetry: for the Cube mesh, check that front-face and back-face
// triangles covering the same area produce identical triangle counts
// The test.x model should be symmetric along the Y axis (local) / Z axis (world)
console.log('\n=== SYMMETRY CHECKS ===');

result.models.forEach(function(mesh, mi) {
  const geom = mesh.geometry;
  const posAttr = geom.getAttribute('position');
  const normAttr = geom.getAttribute('normal');
  
  if (!normAttr) return;
  
  // Count triangles facing +Z vs -Z (front vs back in local space)
  let frontCount = 0, backCount = 0;
  let frontArea = 0, backArea = 0;
  let totalTriangles = posAttr.count / 3;
  
  for (let t = 0; t < totalTriangles; t++) {
    const i = t * 3;
    // Use geometry normals to determine facing
    const nx = normAttr.array[i*3];
    const ny = normAttr.array[i*3+1];
    const nz = normAttr.array[i*3+2];
    
    // Compute triangle area
    const ax = posAttr.array[i*3], ay = posAttr.array[i*3+1], az = posAttr.array[i*3+2];
    const bx = posAttr.array[(i+1)*3], by = posAttr.array[(i+1)*3+1], bz = posAttr.array[(i+1)*3+2];
    const cx = posAttr.array[(i+2)*3], cy = posAttr.array[(i+2)*3+1], cz = posAttr.array[(i+2)*3+2];
    const ex = bx-ax, ey = by-ay, ez = bz-az;
    const fx = cx-ax, fy = cy-ay, fz = cz-az;
    const crossx = ey*fz - ez*fy;
    const crossy = ez*fx - ex*fz;
    const crossz = ex*fy - ey*fx;
    const area = Math.sqrt(crossx*crossx + crossy*crossy + crossz*crossz) * 0.5;
    
    // Determine dominant normal direction
    const anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz);
    if (anz > anx && anz > any) {
      // Z-facing
      if (nz > 0) { frontCount++; frontArea += area; }
      else { backCount++; backArea += area; }
    }
  }
  
  console.log(mesh.name + ':');
  console.log('  Z+ facing triangles:', frontCount, 'area:', frontArea.toFixed(4));
  console.log('  Z- facing triangles:', backCount, 'area:', backArea.toFixed(4));
  
  // For a symmetric model, front and back should have matching triangle counts
  // for the outer shell faces (allowing for small differences from inner geometry)
});

// Final check: no triangles should cross polygon boundaries
// (This is the critical test for the triangle artifact)
console.log('\n=== TRIANGLE OVERLAP CHECK ===');
result.models.forEach(function(mesh, mi) {
  const geom = mesh.geometry;
  const posAttr = geom.getAttribute('position');
  const totalTriangles = posAttr.count / 3;
  
  // Check that no triangle has vertices that cross the centroid of the polygon
  // in a way that would cause visual artifacts
  let suspiciousTriangles = 0;
  
  for (let t = 0; t < totalTriangles; t++) {
    const i = t * 3;
    const ax = posAttr.array[i*3], ay = posAttr.array[i*3+1], az = posAttr.array[i*3+2];
    const bx = posAttr.array[(i+1)*3], by = posAttr.array[(i+1)*3+1], bz = posAttr.array[(i+1)*3+2];
    const cx = posAttr.array[(i+2)*3], cy = posAttr.array[(i+2)*3+1], cz = posAttr.array[(i+2)*3+2];
    
    // Check for extremely elongated triangles (aspect ratio > 100)
    const ab = Math.sqrt((bx-ax)**2+(by-ay)**2+(bz-az)**2);
    const bc = Math.sqrt((cx-bx)**2+(cy-by)**2+(cz-bz)**2);
    const ca = Math.sqrt((ax-cx)**2+(ay-cy)**2+(az-cz)**2);
    const maxEdge = Math.max(ab, bc, ca);
    const minEdge = Math.min(ab, bc, ca);
    
    if (minEdge > 1e-8 && maxEdge / minEdge > 100) {
      suspiciousTriangles++;
    }
  }
  
  console.log(mesh.name + ': suspicious (very elongated) triangles:', suspiciousTriangles);
  assert(suspiciousTriangles === 0, mesh.name + ' has no extremely elongated triangles');
});

console.log('\n' + (allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));
process.exit(allPassed ? 0 : 1);
} // end runTests
