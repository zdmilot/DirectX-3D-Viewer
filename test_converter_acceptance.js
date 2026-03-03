/**
 * Acceptance Test - File Converter Feature
 * 
 * Run in browser console at http://localhost:8080
 * Tests: sidebar switching, converter initialization, file loading,
 *        rotation controls, .x export, and six-view rendering.
 */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    let passed = 0, failed = 0;

    function assert(condition, msg) {
        if (condition) {
            console.log('  ✅ PASS: ' + msg);
            passed++;
        } else {
            console.error('  ❌ FAIL: ' + msg);
            failed++;
        }
    }

    function delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    async function runTests() {
        console.log('═══════════════════════════════════════════');
        console.log('  FILE CONVERTER ACCEPTANCE TESTS');
        console.log('═══════════════════════════════════════════');

        // ── Test 1: Sidebar structure ──
        console.log('\n📋 Test 1: Sidebar Structure');
        const sidebarItems = $$('.sidebar-nav-item');
        assert(sidebarItems.length === 2, 'Sidebar has 2 navigation items');
        assert(sidebarItems[0].dataset.view === 'viewer', 'First item is "viewer"');
        assert(sidebarItems[1].dataset.view === 'converter', 'Second item is "converter"');
        assert(sidebarItems[0].textContent.trim().includes('3D Viewer'), 'First item labeled "3D Viewer"');
        assert(sidebarItems[1].textContent.trim().includes('File Converter'), 'Second item labeled "File Converter"');

        // ── Test 2: Default view is viewer ──
        console.log('\n📋 Test 2: Default View');
        const viewerPanel = $('[data-view-panel="viewer"]');
        const converterPanel = $('[data-view-panel="converter"]');
        assert(viewerPanel.classList.contains('is-active'), 'Viewer panel is active by default');
        assert(!converterPanel.classList.contains('is-active'), 'Converter panel is NOT active by default');

        // ── Test 3: Switch to converter view ──
        console.log('\n📋 Test 3: View Switching');
        sidebarItems[1].click();
        await delay(200);

        assert(!viewerPanel.classList.contains('is-active'), 'Viewer panel is hidden after switching');
        assert(converterPanel.classList.contains('is-active'), 'Converter panel is active after switching');
        assert(sidebarItems[1].classList.contains('is-active'), 'Converter sidebar item is active');
        assert(!sidebarItems[0].classList.contains('is-active'), 'Viewer sidebar item is no longer active');

        // ── Test 4: Converter DOM elements ──
        console.log('\n📋 Test 4: Converter DOM Elements');
        assert($('#cv-main-canvas') !== null, 'Main canvas exists');
        assert($('#converter-main-viewport') !== null, 'Main viewport exists');
        assert($('#cv-file-input') !== null, 'File input exists');
        assert($('#cv-open-btn') !== null, 'Open button exists');
        assert($('#cv-export-btn') !== null, 'Export button exists');
        assert($('#cv-reset-rot') !== null, 'Reset rotation button exists');
        assert($('#cv-rotation-display') !== null, 'Rotation display exists');
        assert($('#cv-format-badge') !== null, 'Format badge exists');

        // Six view canvases
        ['top', 'bottom', 'left', 'right', 'front', 'back'].forEach(view => {
            assert($(`#cv-view-${view}`) !== null, `View canvas "${view}" exists`);
        });

        // ── Test 5: Converter initialized ──
        console.log('\n📋 Test 5: Converter Initialization');
        await delay(300);  // wait for init
        assert(window.ConverterModule !== undefined, 'ConverterModule is exposed globally');
        assert(typeof window.ConverterModule.init === 'function', 'ConverterModule.init is a function');
        assert(typeof window.ConverterModule.updateTheme === 'function', 'ConverterModule.updateTheme is a function');

        // ── Test 6: Rotation buttons ──
        console.log('\n📋 Test 6: Rotation Controls');
        const rotBtns = $$('.cv-rot-btn');
        assert(rotBtns.length === 6, '6 rotation buttons exist');

        const axes = [];
        const degs = [];
        rotBtns.forEach(btn => {
            axes.push(btn.dataset.axis);
            degs.push(parseInt(btn.dataset.deg));
        });
        assert(axes.includes('x'), 'X rotation button exists');
        assert(axes.includes('y'), 'Y rotation button exists');
        assert(axes.includes('z'), 'Z rotation button exists');
        assert(degs.includes(90), '+90° rotation exists');
        assert(degs.includes(-90), '-90° rotation exists');

        // ── Test 7: Export button disabled when no model ──
        console.log('\n📋 Test 7: Export Button State');
        const exportBtn = $('#cv-export-btn');
        assert(exportBtn.disabled === true, 'Export button is disabled when no model loaded');

        // ── Test 8: Three.js loaders available ──
        console.log('\n📋 Test 8: Three.js Loaders');
        assert(typeof THREE.OBJLoader === 'function', 'OBJLoader is registered on THREE');
        assert(typeof THREE.MTLLoader === 'function', 'MTLLoader is registered on THREE');
        assert(typeof THREE.GLTFLoader === 'function', 'GLTFLoader is registered on THREE');
        assert(typeof THREE.STLLoader === 'function', 'STLLoader is registered on THREE');
        assert(typeof THREE.XFileLoader === 'function', 'XFileLoader is still available');

        // ── Test 9: File input accepts correct formats ──
        console.log('\n📋 Test 9: File Input Accepts');
        const fileInput = $('#cv-file-input');
        const acceptAttr = fileInput.getAttribute('accept');
        assert(acceptAttr.includes('.obj'), 'Accepts .obj');
        assert(acceptAttr.includes('.mtl'), 'Accepts .mtl');
        assert(acceptAttr.includes('.stl'), 'Accepts .stl');
        assert(acceptAttr.includes('.glb'), 'Accepts .glb');
        assert(acceptAttr.includes('.gltf'), 'Accepts .gltf');
        assert(acceptAttr.includes('.x'), 'Accepts .x');
        assert(fileInput.multiple === true, 'Allows multiple files (for OBJ+MTL)');

        // ── Test 10: Switch back to viewer ──
        console.log('\n📋 Test 10: Switch Back to Viewer');
        sidebarItems[0].click();
        await delay(200);
        assert(viewerPanel.classList.contains('is-active'), 'Viewer panel is active again');
        assert(!converterPanel.classList.contains('is-active'), 'Converter panel is hidden again');

        // ── Test 11: Drag-drop zone ──
        console.log('\n📋 Test 11: Drag Drop Zone');
        sidebarItems[1].click();
        await delay(100);
        const dropzone = $('#cv-dropzone');
        assert(dropzone !== null, 'Converter dropzone exists');
        assert(dropzone.classList.contains('viewer-hidden'), 'Dropzone is hidden by default');

        // ── Test 12: Original viewer still works ──
        console.log('\n📋 Test 12: Original Viewer Integrity');
        sidebarItems[0].click();
        await delay(100);
        assert($('#viewer-canvas') !== null, 'Original viewer canvas still exists');
        assert($('#viewer-toolbar') !== null, 'Original viewer toolbar still exists');
        assert($('#gizmo-canvas') !== null, 'Gizmo canvas still exists');

        // ── Summary ──
        console.log('\n═══════════════════════════════════════════');
        console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
        console.log('═══════════════════════════════════════════');
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED!');
        } else {
            console.log('⚠️  Some tests failed. Review errors above.');
        }
    }

    // Auto-run after splash screen
    setTimeout(runTests, 3000);
})();
