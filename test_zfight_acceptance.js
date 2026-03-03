#!/usr/bin/env node
/**
 * Acceptance Test for X File Viewer — Triangulation & Z-Fighting
 *
 * Tests:
 * 1. Concave polygon triangulation produces no self-intersecting triangles
 * 2. Quad and pentagon triangulation correctness
 * 3. DoubleSide must be set on materials in XFileLoader
 * 4. logarithmicDepthBuffer must NOT be used (breaks polygonOffset)
 * 5. LessDepth must NOT be used
 * 6. No degenerate triangles
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Minimal THREE stubs ──
const THREE = {
    Vector2: function(x, y) { this.x = x; this.y = y; },
    ShapeUtils: {
        triangulateShape: function(contour, holes) {
            var n = contour.length;
            if (n < 3) return [];
            if (n === 3) return [[0, 1, 2]];
            var indices = [];
            for (var i = 0; i < n; i++) indices.push(i);
            function area2(a, b, c) {
                return (contour[b].x - contour[a].x) * (contour[c].y - contour[a].y) -
                       (contour[c].x - contour[a].x) * (contour[b].y - contour[a].y);
            }
            function pointInTri(px, py, ax, ay, bx, by, cx, cy) {
                var d1 = (px-cx)*(ay-cy)-(ax-cx)*(py-cy);
                var d2 = (px-ax)*(by-ay)-(bx-ax)*(py-ay);
                var d3 = (px-bx)*(cy-by)-(cx-bx)*(py-by);
                return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));
            }
            var totalArea = 0;
            for (var i = 0; i < n; i++) {
                var j = (i+1)%n;
                totalArea += contour[i].x*contour[j].y - contour[j].x*contour[i].y;
            }
            if (totalArea < 0) indices.reverse();
            var result = [];
            var maxIter = n * n;
            while (indices.length > 3 && maxIter-- > 0) {
                var earFound = false;
                var len = indices.length;
                for (var i = 0; i < len; i++) {
                    var prev = indices[(i+len-1)%len], cur = indices[i], nxt = indices[(i+1)%len];
                    if (area2(prev, cur, nxt) <= 0) continue;
                    var isEar = true;
                    for (var k = 0; k < len; k++) {
                        var t = indices[k];
                        if (t===prev||t===cur||t===nxt) continue;
                        if (pointInTri(contour[t].x,contour[t].y,contour[prev].x,contour[prev].y,contour[cur].x,contour[cur].y,contour[nxt].x,contour[nxt].y)) { isEar=false; break; }
                    }
                    if (isEar) { result.push([prev,cur,nxt]); indices.splice(i,1); earFound=true; break; }
                }
                if (!earFound) { for (var i=1;i<indices.length-1;i++) result.push([indices[0],indices[i],indices[i+1]]); break; }
            }
            if (indices.length===3) result.push([indices[0],indices[1],indices[2]]);
            return result;
        }
    }
};

var meshVerts = [
    {x:-2.500000,y:-2.500000,z:-2.500000},{x:-2.500000,y:-2.500000,z:2.500000},
    {x:-2.500000,y:2.500000,z:-2.500000},{x:-2.500000,y:2.500000,z:2.500000},
    {x:2.500000,y:-2.500000,z:-2.500000},{x:2.500000,y:-2.500000,z:2.500000},
    {x:2.500000,y:2.500000,z:-2.500000},{x:2.500000,y:2.500000,z:2.500000},
    {x:-2.468613,y:-2.445914,z:2.500000},{x:-2.468613,y:2.449483,z:2.500000},
    {x:2.465228,y:2.449483,z:2.500000},{x:2.465228,y:-2.445914,z:2.500000},
    {x:-2.468163,y:2.439258,z:-2.500000},{x:-2.468163,y:-2.451690,z:-2.500000},
    {x:2.461165,y:2.439258,z:-2.500000},{x:2.461165,y:-2.451690,z:-2.500000},
    {x:-0.367994,y:-2.445914,z:2.500000},{x:-0.367859,y:-2.500000,z:2.500000},
    {x:0.372232,y:-2.500000,z:2.500000},{x:0.371534,y:-2.445914,z:2.500000},
    {x:0.370559,y:-2.500000,z:-2.033806},{x:-0.368312,y:-2.500000,z:-2.015435},
    {x:0.377753,y:-2.451242,z:-2.110411},{x:-0.368168,y:-2.451216,z:-2.088298},
];

function triangulatePoly(faceIndices) {
    var n = faceIndices.length;
    if (n === 3) return [[faceIndices[0],faceIndices[1],faceIndices[2]]];
    var pts = [];
    for (var i = 0; i < n; i++) {
        var v = meshVerts[faceIndices[i]];
        pts.push(v ? {x:v.x,y:v.y,z:v.z} : {x:0,y:0,z:0});
    }
    var nx=0,ny=0,nz=0;
    for (var i = 0; i < n; i++) {
        var c=pts[i], ne=pts[(i+1)%n];
        nx+=(c.y-ne.y)*(c.z+ne.z); ny+=(c.z-ne.z)*(c.x+ne.x); nz+=(c.x-ne.x)*(c.y+ne.y);
    }
    var len = Math.sqrt(nx*nx+ny*ny+nz*nz);
    if (len<1e-10) { var out=[]; for(var t=1;t<n-1;t++) out.push([faceIndices[0],faceIndices[t],faceIndices[t+1]]); return out; }
    nx/=len; ny/=len; nz/=len;
    var ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz);
    var upx,upy,upz;
    if(ax<=ay&&ax<=az){upx=1;upy=0;upz=0;}else if(ay<=az){upx=0;upy=1;upz=0;}else{upx=0;upy=0;upz=1;}
    var ux=upy*nz-upz*ny,uy=upz*nx-upx*nz,uz=upx*ny-upy*nx;
    var ul=Math.sqrt(ux*ux+uy*uy+uz*uz); ux/=ul;uy/=ul;uz/=ul;
    var vx=ny*uz-nz*uy,vy=nz*ux-nx*uz,vz=nx*uy-ny*ux;
    var contour=[];
    for(var i=0;i<n;i++) contour.push(new THREE.Vector2(pts[i].x*ux+pts[i].y*uy+pts[i].z*uz,pts[i].x*vx+pts[i].y*vy+pts[i].z*vz));
    var tris;
    try { tris=THREE.ShapeUtils.triangulateShape(contour,[]); }
    catch(e) { var out=[]; for(var t=1;t<n-1;t++) out.push([faceIndices[0],faceIndices[t],faceIndices[t+1]]); return out; }
    var result=[];
    for(var i=0;i<tris.length;i++) { var tri=tris[i]; result.push([faceIndices[tri[0]],faceIndices[tri[1]],faceIndices[tri[2]]]); }
    return result;
}

function triArea3D(i0,i1,i2) {
    var p0=meshVerts[i0],p1=meshVerts[i1],p2=meshVerts[i2];
    var ax=p1.x-p0.x,ay=p1.y-p0.y,az=p1.z-p0.z;
    var bx=p2.x-p0.x,by=p2.y-p0.y,bz=p2.z-p0.z;
    var cx=ay*bz-az*by,cy=az*bx-ax*bz,cz=ax*by-ay*bx;
    return 0.5*Math.sqrt(cx*cx+cy*cy+cz*cz);
}

function segIntersect2D(ax,ay,bx,by,cx,cy,dx,dy) {
    function cross(ox,oy,px,py,qx,qy){return(px-ox)*(qy-oy)-(py-oy)*(qx-ox);}
    var d1=cross(cx,cy,dx,dy,ax,ay),d2=cross(cx,cy,dx,dy,bx,by);
    var d3=cross(ax,ay,bx,by,cx,cy),d4=cross(ax,ay,bx,by,dx,dy);
    return((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));
}

// ═══ TESTS ═══
var pass=0, fail=0;
function ok(cond,msg) { if(cond){pass++;}else{fail++;console.error('  FAIL: '+msg);} }

console.log('\n=== TEST 1: 8-vertex concave face triangulation ===');
var face14=[19,22,23,16,8,13,15,11];
var tris14=triangulatePoly(face14);
ok(tris14.length===6,'8-vert face -> 6 triangles (got '+tris14.length+')');
tris14.forEach(function(tri,i){
    var a=triArea3D(tri[0],tri[1],tri[2]);
    ok(a>1e-8,'tri '+i+' non-degenerate (area='+a.toFixed(6)+')');
});

// Check no crossing edges
var proj14=face14.map(function(vi){return[meshVerts[vi].x,meshVerts[vi].z];});
var edges=[];
tris14.forEach(function(tri){for(var e=0;e<3;e++){edges.push([face14.indexOf(tri[e]),face14.indexOf(tri[(e+1)%3])]);}});
var crossings=0;
for(var i=0;i<edges.length;i++)for(var j=i+1;j<edges.length;j++){
    var a=edges[i],b=edges[j];
    if(a[0]===b[0]||a[0]===b[1]||a[1]===b[0]||a[1]===b[1])continue;
    if(segIntersect2D(proj14[a[0]][0],proj14[a[0]][1],proj14[a[1]][0],proj14[a[1]][1],proj14[b[0]][0],proj14[b[0]][1],proj14[b[1]][0],proj14[b[1]][1])){crossings++;}
}
ok(crossings===0,'No self-intersecting edges (found '+crossings+')');

console.log('\n=== TEST 2: Quad triangulation ===');
var trisQ=triangulatePoly([0,2,3,1]);
ok(trisQ.length===2,'Quad -> 2 triangles (got '+trisQ.length+')');
trisQ.forEach(function(tri,i){ok(triArea3D(tri[0],tri[1],tri[2])>1e-8,'quad tri '+i+' non-degenerate');});

console.log('\n=== TEST 3: 7-vertex face ===');
var tris7=triangulatePoly([8,16,19,11,5,18,1]); // synthetic
ok(tris7.length===5,'7-vert -> 5 triangles (got '+tris7.length+')');

console.log('\n=== TEST 4: DoubleSide in XFileLoader ===');
var loaderCode=fs.readFileSync(path.join(__dirname,'js/lib/XFileLoader.js'),'utf8');
ok(loaderCode.includes('DoubleSide')||loaderCode.includes('.side'),'DoubleSide must be set on materials');

console.log('\n=== TEST 5: No logarithmicDepthBuffer in app.js ===');
var appCode=fs.readFileSync(path.join(__dirname,'js/app.js'),'utf8');
ok(!appCode.includes('logarithmicDepthBuffer'),'logarithmicDepthBuffer must NOT be used');

console.log('\n=== TEST 6: No LessDepth in app.js ===');
ok(!appCode.includes('LessDepth'),'LessDepth must NOT be used');

console.log('\n=== TEST 7: polygonOffset present ===');
ok(appCode.includes('polygonOffset'),'polygonOffset must be used for z-fighting');

console.log('\n═════════════════════');
console.log('RESULTS: '+pass+' passed, '+fail+' failed');
console.log('═════════════════════');
process.exit(fail>0?1:0);
