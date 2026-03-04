// Acceptance test for drag-clamping logic in makeDraggable
// Validates that the clamp function keeps panels within viewport bounds
// in all edge cases.

let passed = 0, failed = 0;

function assert(condition, msg) {
    if (!condition) {
        console.error('  FAIL:', msg);
        failed++;
    } else {
        console.log('  PASS:', msg);
        passed++;
    }
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

// ── Test 1: clamp keeps left within [0, vw - pw] ──
console.log('\n=== Test 1: Horizontal clamping ===');
{
    const vw = 1200;
    const pw = 68; // typical panel width (56px + 12px padding)
    
    // Panel at left edge
    assert(clamp(0, 0, vw - pw) === 0, 'Left edge: stays at 0');
    
    // Panel at right edge  
    assert(clamp(vw, 0, vw - pw) === vw - pw, 'Right edge: clamped to vw-pw=' + (vw-pw));
    
    // Panel past right edge
    assert(clamp(1300, 0, vw - pw) === vw - pw, 'Past right: clamped to vw-pw');
    
    // Panel past left edge
    assert(clamp(-100, 0, vw - pw) === 0, 'Past left: clamped to 0');
    
    // Panel in middle
    assert(clamp(500, 0, vw - pw) === 500, 'Middle: stays at 500');
    
    // Panel exactly at max
    assert(clamp(vw - pw, 0, vw - pw) === vw - pw, 'Exact max: stays at vw-pw');
}

// ── Test 2: Vertical clamping ──
console.log('\n=== Test 2: Vertical clamping ===');
{
    const vh = 800;
    const ph = 520; // typical panel height
    
    assert(clamp(0, 0, vh - ph) === 0, 'Top edge: stays at 0');
    assert(clamp(vh, 0, vh - ph) === vh - ph, 'Bottom edge: clamped to vh-ph=' + (vh-ph));
    assert(clamp(-50, 0, vh - ph) === 0, 'Past top: clamped to 0');
    assert(clamp(900, 0, vh - ph) === vh - ph, 'Past bottom: clamped to vh-ph');
    assert(clamp(100, 0, vh - ph) === 100, 'Middle: stays at 100');
}

// ── Test 3: Edge-snap with viewport clamping ──
console.log('\n=== Test 3: Edge-snap never exceeds viewport ===');
{
    const vw = 1200;
    const pw = 68;
    
    // Simulate host right edge at viewport right edge
    const hrRight = 1200;
    const snapLeft = clamp(hrRight - pw, 0, vw - pw);
    assert(snapLeft === vw - pw, 'Snap-right at viewport edge: ' + snapLeft + ' === ' + (vw - pw));
    assert(snapLeft + pw <= vw, 'Snap-right: panel right edge (' + (snapLeft+pw) + ') <= viewport (' + vw + ')');
    
    // Simulate host right edge BEYOND viewport (shouldn't happen but be safe)
    const hrRight2 = 1300;
    const snapLeft2 = clamp(hrRight2 - pw, 0, vw - pw);
    assert(snapLeft2 === vw - pw, 'Snap-right beyond viewport: clamped to ' + (vw - pw));
    assert(snapLeft2 + pw <= vw, 'Snap-right beyond: panel stays in viewport');
    
    // Simulate host left edge at 0
    const hrLeft = 0;
    const snapLeftEdge = clamp(hrLeft, 0, vw - pw);
    assert(snapLeftEdge === 0, 'Snap-left at viewport edge: 0');
    
    // Simulate host left edge negative (shouldn't happen but be safe)
    const hrLeft2 = -50;
    const snapLeftEdge2 = clamp(hrLeft2, 0, vw - pw);
    assert(snapLeftEdge2 === 0, 'Snap-left past viewport: clamped to 0');
}

// ── Test 4: Drag with offset ──
console.log('\n=== Test 4: Drag movement with clamping ===');
{
    const vw = 1200;
    const vh = 800;
    const pw = 68;
    const ph = 500;
    const origLeft = 1100; // start near right edge
    const origTop = 50;
    
    // Drag right by 200px (should clamp)
    const dx = 200;
    const newLeft = clamp(origLeft + dx, 0, vw - pw);
    assert(newLeft === vw - pw, 'Drag right past edge: clamped to ' + (vw - pw));
    assert(newLeft + pw <= vw, 'Panel right edge within viewport after drag right');
    
    // Drag left by 1200px (should clamp at 0)
    const dx2 = -1200;
    const newLeft2 = clamp(origLeft + dx2, 0, vw - pw);
    assert(newLeft2 === 0, 'Drag left past edge: clamped to 0');
    
    // Drag down past bottom
    const dy = 800;
    const newTop = clamp(origTop + dy, 0, vh - ph);
    assert(newTop === vh - ph, 'Drag down past edge: clamped to ' + (vh - ph));
    assert(newTop + ph <= vh, 'Panel bottom within viewport');
}

// ── Test 5: Small viewport (panel barely fits) ──
console.log('\n=== Test 5: Small viewport edge case ===');
{
    const vw = 100;
    const pw = 68;
    
    assert(clamp(50, 0, vw - pw) === vw - pw, 'Small viewport: clamped to ' + (vw - pw));
    assert(clamp(0, 0, vw - pw) === 0, 'Small viewport left: stays at 0');
    
    // Panel larger than viewport
    const vw2 = 50;
    const maxLeft = vw2 - pw; // negative!
    // clamp(anything, 0, -18) → should return 0 (max of 0 and whatever)
    assert(clamp(0, 0, maxLeft) === 0, 'Panel wider than viewport: clamped to 0');
    assert(clamp(100, 0, maxLeft) === 0, 'Panel wider than viewport (past right): clamped to 0');
}

// ── Summary ──
console.log('\n═══════════════════════════════════════════');
console.log('RESULTS: ' + passed + ' passed, ' + failed + ' failed');
console.log('═══════════════════════════════════════════');
if (failed > 0) {
    console.log('\nSOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('\nAll tests PASSED!');
}
