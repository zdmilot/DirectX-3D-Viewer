var fs = require('fs');
global.THREE = {
  DefaultLoadingManager: function(){},
  TextureLoader: function(){ this.load = function(){ return {}; }; },
  FileLoader: function(){ this.setResponseType = function(){}; this.load = function(){}; },
};
function getScene(lp, data) {
  delete require.cache[require.resolve(lp)];
  var L = require(lp);
  var loader = new L();
  loader._initCurrentAnimationAndMesh = function() {};
  loader._processFrame = function() {};
  var sto = global.setTimeout;
  global.setTimeout = function(fn) { fn(); };
  try { loader._parse(data, function() {}); } catch(e) { console.log('  err:', e.message || e); }
  global.setTimeout = sto;
  return loader._exportScene;
}
function countNodes(n) {
  if (n === null || n === undefined) return {frames:0,meshes:0,verts:0};
  var r = {frames:1, meshes:n.meshes.length, verts:0};
  n.meshes.forEach(function(m) { r.verts += m.vertices.length; });
  n.childrenNodes.forEach(function(c) { var s = countNodes(c); r.frames += s.frames; r.meshes += s.meshes; r.verts += s.verts; });
  return r;
}
function firstVert(n) {
  if (n === null || n === undefined) return 'none';
  if (n.meshes.length > 0 && n.meshes[0].vertices.length > 0) {
    var v = n.meshes[0].vertices[0];
    return '(' + v.x + ',' + v.y + ',' + v.z + ')';
  }
  for (var i = 0; i < n.childrenNodes.length; i++) {
    var r = firstVert(n.childrenNodes[i]);
    if (r !== 'none') return r;
  }
  return 'none';
}
var bp = './js/lib/XFileLoader.js.bak';
var np = './js/lib/XFileLoader.js';
var files = [
  'test.x',
  'teapot_simple.x',
  'testing x files/Calibration Block (61178-01).x',
  'testing x files/9041000.x'
];
files.forEach(function(f) {
  if (fs.existsSync(f) === false) { console.log(f + ': NOT FOUND'); return; }
  var data = fs.readFileSync(f, 'utf8');
  console.log('\n' + f + ' (' + (data.length/1024).toFixed(0) + ' KB)');
  var t0 = Date.now();
  var os = getScene(bp, data);
  var oldMs = Date.now() - t0;
  t0 = Date.now();
  var ns = getScene(np, data);
  var newMs = Date.now() - t0;
  var oc = countNodes(os.rootNode);
  var nc = countNodes(ns.rootNode);
  console.log('  OLD: ' + oldMs + 'ms frames=' + oc.frames + ' meshes=' + oc.meshes + ' verts=' + oc.verts + ' standalone=' + os.meshes.length + ' firstV=' + firstVert(os.rootNode));
  console.log('  NEW: ' + newMs + 'ms frames=' + nc.frames + ' meshes=' + nc.meshes + ' verts=' + nc.verts + ' standalone=' + ns.meshes.length + ' firstV=' + firstVert(ns.rootNode));
  if (oc.frames !== nc.frames || oc.meshes !== nc.meshes || oc.verts !== nc.verts) console.log('  *** DIFFERENCE DETECTED ***');
  else console.log('  OK - identical');
});
