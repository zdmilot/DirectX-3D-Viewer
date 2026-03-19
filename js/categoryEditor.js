/* ============================================================
   Category Editor — Browse the Hamilton labware categorization
   system as a hierarchical tree, view labware items under each
   category, and inspect individual labware details + 3D preview.
   Mirrors the original Hamilton Labware Editor category tree.
   ============================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ================================================================
    //  State
    // ================================================================
    const st = {
        initialized: false,
        categories: [],        // [{id, parentId, name, icon, children:[]}]
        categoryMap: {},       // id → category node
        indexEntries: [],      // [{categoryId, displayName, description, fileName, relPath}]
        labwareByCategory: {}, // categoryId → [indexEntry, ...]
        expandedNodes: {},     // id → true (open nodes)
        selectedCatId: null,
        selectedLabware: null, // index entry for detail view
        searchTerm: '',
        // 3D preview state
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        previewModel: null,
        previewAnimId: null,
    };

    // ================================================================
    //  Helpers
    // ================================================================
    function hamiltonDir() {
        return (typeof window.getHamiltonDir === 'function' ? window.getHamiltonDir() : '') || 'Base Hamilton Files';
    }

    function labwareDir() {
        return hamiltonDir() + '/Labware';
    }

    /** Parse Category.dat content → array of {id, parentId, name, icon} */
    function parseCategoryDat(text) {
        var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        var cats = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            // Skip the next-ID counter line (just a number)
            if (/^\d+$/.test(line)) continue;
            // Skip version GUID line
            if (line.indexOf('VersionGUID') === 0) continue;
            // Parse category line: id,parentId,name,icon
            // Name may contain escaped commas, but in practice Category.dat names don't use commas
            var parts = line.split(',');
            if (parts.length < 3) continue;
            var id = parseInt(parts[0], 10);
            var parentId = parseInt(parts[1], 10);
            var name = parts[2].trim();
            var icon = (parts[3] || 'default.bmp').trim();
            if (isNaN(id) || isNaN(parentId)) continue;
            cats.push({ id: id, parentId: parentId, name: name, icon: icon, children: [] });
        }
        return cats;
    }

    /** Parse Index.dat content → array of entries.
     *  Format: categoryId,displayName,description,fileName,relPath
     *  Commas in displayName/description are escaped with \,
     */
    function parseIndexDat(text) {
        var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        var entries = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            // Split respecting escaped commas
            var parts = splitEscapedCommas(line);
            if (parts.length < 5) continue;
            var categoryId = parseInt(parts[0], 10);
            if (isNaN(categoryId)) continue;
            entries.push({
                categoryId: categoryId,
                displayName: (parts[1] || '').replace(/\\,/g, ','),
                description: (parts[2] || '').replace(/\\,/g, ','),
                fileName: parts[3] || '',
                relPath: parts[4] || '',
            });
        }
        return entries;
    }

    /** Split by comma but respect \, as escaped */
    function splitEscapedCommas(str) {
        var result = [];
        var current = '';
        for (var i = 0; i < str.length; i++) {
            if (str[i] === '\\' && i + 1 < str.length && str[i + 1] === ',') {
                current += '\\,';
                i++; // skip the comma
            } else if (str[i] === ',') {
                result.push(current);
                current = '';
            } else {
                current += str[i];
            }
        }
        result.push(current);
        return result;
    }

    /** Build the tree hierarchy from flat category list */
    function buildCategoryTree(cats) {
        var map = {};
        var roots = [];
        // Create map
        for (var i = 0; i < cats.length; i++) {
            cats[i].children = [];
            map[cats[i].id] = cats[i];
        }
        // Build tree
        for (var j = 0; j < cats.length; j++) {
            var cat = cats[j];
            if (cat.parentId === 0 || !map[cat.parentId]) {
                roots.push(cat);
            } else {
                map[cat.parentId].children.push(cat);
            }
        }
        // Sort children alphabetically
        function sortChildren(nodes) {
            nodes.sort(function(a, b) { return a.name.localeCompare(b.name); });
            for (var k = 0; k < nodes.length; k++) {
                if (nodes[k].children.length) sortChildren(nodes[k].children);
            }
        }
        sortChildren(roots);
        return { roots: roots, map: map };
    }

    /** Group index entries by category ID */
    function groupByCategory(entries) {
        var grouped = {};
        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            if (!grouped[e.categoryId]) grouped[e.categoryId] = [];
            // Avoid duplicate file entries in same category
            var exists = false;
            for (var j = 0; j < grouped[e.categoryId].length; j++) {
                if (grouped[e.categoryId][j].fileName === e.fileName) { exists = true; break; }
            }
            if (!exists) grouped[e.categoryId].push(e);
        }
        return grouped;
    }

    /** Count total labware items under a category node (recursively) */
    function countLabware(catNode) {
        var count = (st.labwareByCategory[catNode.id] || []).length;
        for (var i = 0; i < catNode.children.length; i++) {
            count += countLabware(catNode.children[i]);
        }
        return count;
    }

    // ================================================================
    //  Data Loading
    // ================================================================
    function loadCategoryData() {
        var dir = labwareDir();
        var catUrl = dir + '/Category.dat';
        var idxUrl = dir + '/Index.dat';

        var statusEl = $('#cated-status');
        if (statusEl) statusEl.textContent = 'Loading category data…';

        Promise.all([
            fetch(catUrl).then(function(r) {
                if (!r.ok) throw new Error('Cannot load Category.dat from ' + catUrl);
                return r.text();
            }),
            fetch(idxUrl).then(function(r) {
                if (!r.ok) throw new Error('Cannot load Index.dat from ' + idxUrl);
                return r.text();
            })
        ]).then(function(results) {
            st.categories = parseCategoryDat(results[0]);
            st.indexEntries = parseIndexDat(results[1]);
            var tree = buildCategoryTree(st.categories);
            st.categories = tree.roots;
            st.categoryMap = tree.map;
            st.labwareByCategory = groupByCategory(st.indexEntries);

            renderTree();
            if (statusEl) statusEl.textContent = Object.keys(st.categoryMap).length + ' categories, ' + st.indexEntries.length + ' index entries loaded';
        }).catch(function(err) {
            console.error('[CategoryEditor]', err);
            if (statusEl) statusEl.textContent = 'Error: ' + err.message;
            var treeEl = $('#cated-tree');
            if (treeEl) treeEl.innerHTML = '<div class="cated-error"><i class="fas fa-exclamation-triangle"></i> ' +
                'Could not load category data. Make sure the Hamilton directory is set correctly in Global Settings.<br><small>' +
                escHtml(err.message) + '</small></div>';
        });
    }

    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // ================================================================
    //  Tree Rendering
    // ================================================================
    function renderTree() {
        var treeEl = $('#cated-tree');
        if (!treeEl) return;

        var filter = st.searchTerm.toLowerCase();
        var html = buildTreeHtml(st.categories, 0, filter);
        treeEl.innerHTML = html || '<div class="cated-empty">No categories found.</div>';
    }

    function buildTreeHtml(nodes, depth, filter) {
        var html = '';
        for (var i = 0; i < nodes.length; i++) {
            var cat = nodes[i];
            var items = st.labwareByCategory[cat.id] || [];
            var totalCount = countLabware(cat);
            var hasChildren = cat.children.length > 0 || items.length > 0;
            var isExpanded = !!st.expandedNodes[cat.id];
            var isSelected = st.selectedCatId === cat.id;

            // Filter logic: show node if it matches or any child/labware matches
            if (filter && !matchesFilter(cat, filter)) continue;

            // Choose appropriate icon
            var icon = getCategoryIcon(cat);

            html += '<div class="cated-node" data-depth="' + depth + '">';
            html += '<div class="cated-node-header' + (isSelected ? ' is-selected' : '') + '" data-cat-id="' + cat.id + '" style="padding-left:' + (12 + depth * 18) + 'px">';

            // Expand/collapse toggle
            if (hasChildren) {
                html += '<i class="fas fa-chevron-' + (isExpanded ? 'down' : 'right') + ' cated-toggle"></i>';
            } else {
                html += '<span class="cated-toggle-placeholder"></span>';
            }

            html += '<i class="' + icon + ' cated-icon"></i>';
            html += '<span class="cated-node-name">' + escHtml(cat.name) + '</span>';
            if (totalCount > 0) {
                html += '<span class="cated-count">' + totalCount + '</span>';
            }
            html += '</div>';

            // Children + labware items (if expanded)
            if (isExpanded && hasChildren) {
                html += '<div class="cated-children">';
                // Sub-categories first
                if (cat.children.length > 0) {
                    html += buildTreeHtml(cat.children, depth + 1, filter);
                }
                // Labware items
                if (items.length > 0) {
                    for (var j = 0; j < items.length; j++) {
                        var item = items[j];
                        var itemName = item.displayName || item.fileName;
                        var isLabSelected = st.selectedLabware && st.selectedLabware.fileName === item.fileName && st.selectedLabware.categoryId === item.categoryId;
                        html += '<div class="cated-labware-item' + (isLabSelected ? ' is-selected' : '') + '" data-cat-id="' + cat.id + '" data-idx="' + j + '" style="padding-left:' + (12 + (depth + 1) * 18) + 'px">';
                        html += '<i class="' + getLabwareIcon(item.fileName) + ' cated-lw-icon"></i>';
                        html += '<span class="cated-lw-name" title="' + escHtml(item.fileName) + '">' + escHtml(itemName) + '</span>';
                        html += '</div>';
                    }
                }
                html += '</div>';
            }

            html += '</div>';
        }
        return html;
    }

    /** Check if a category node (or its children/labware) match the search filter */
    function matchesFilter(cat, filter) {
        if (cat.name.toLowerCase().indexOf(filter) >= 0) return true;
        var items = st.labwareByCategory[cat.id] || [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if ((item.displayName || '').toLowerCase().indexOf(filter) >= 0) return true;
            if ((item.fileName || '').toLowerCase().indexOf(filter) >= 0) return true;
            if ((item.description || '').toLowerCase().indexOf(filter) >= 0) return true;
        }
        for (var j = 0; j < cat.children.length; j++) {
            if (matchesFilter(cat.children[j], filter)) return true;
        }
        return false;
    }

    /** Get icon class for a category based on its name */
    function getCategoryIcon(cat) {
        var name = cat.name.toLowerCase();
        if (name.indexOf('plate') >= 0) return 'fas fa-th';
        if (name.indexOf('carrier') >= 0) return 'fas fa-pallet';
        if (name.indexOf('tip') >= 0) return 'fas fa-syringe';
        if (name.indexOf('needle') >= 0) return 'fas fa-syringe';
        if (name.indexOf('wash') >= 0) return 'fas fa-shower';
        if (name.indexOf('waste') >= 0) return 'fas fa-trash';
        if (name.indexOf('tool') >= 0) return 'fas fa-wrench';
        if (name.indexOf('shaker') >= 0) return 'fas fa-random';
        if (name.indexOf('reagent') >= 0) return 'fas fa-flask';
        if (name.indexOf('sample') >= 0) return 'fas fa-vial';
        if (name.indexOf('stack') >= 0) return 'fas fa-layer-group';
        if (name.indexOf('filter') >= 0) return 'fas fa-filter';
        if (name.indexOf('pcr') >= 0) return 'fas fa-dna';
        if (name.indexOf('temperature') >= 0 || name.indexOf('temp') >= 0) return 'fas fa-thermometer-half';
        if (name.indexOf('vantage') >= 0) return 'fas fa-microchip';
        if (name.indexOf('nimbus') >= 0) return 'fas fa-cloud';
        if (name.indexOf('ml star') >= 0) return 'fas fa-star';
        if (name.indexOf('core') >= 0 || name.indexOf('co-re') >= 0) return 'fas fa-grip-lines';
        if (name.indexOf('autolys') >= 0) return 'fas fa-cog';
        if (name.indexOf('bvs') >= 0) return 'fas fa-wave-square';
        if (name.indexOf('vacutube') >= 0) return 'fas fa-vial';
        if (name.indexOf('nano') >= 0) return 'fas fa-atom';
        if (name.indexOf('customized') >= 0) return 'fas fa-user-cog';
        if (name.indexOf('special') >= 0) return 'fas fa-star-of-life';
        if (name.indexOf('multiflex') >= 0 || name.indexOf('mfx') >= 0) return 'fas fa-th-large';
        if (name.indexOf('corning') >= 0 || name.indexOf('nunc') >= 0 || name.indexOf('dynex') >= 0 ||
            name.indexOf('greiner') >= 0 || name.indexOf('hamilton') >= 0 || name.indexOf('qiagen') >= 0 ||
            name.indexOf('polyfiltronic') >= 0 || name.indexOf('macherey') >= 0) return 'fas fa-industry';
        if (name.indexOf('agowa') >= 0) return 'fas fa-dna';
        if (name.indexOf('deep well') >= 0) return 'fas fa-th';
        if (name.indexOf('cell culture') >= 0) return 'fas fa-microscope';
        if (cat.children.length > 0) return 'fas fa-folder';
        return 'fas fa-folder';
    }

    /** Get icon for labware item based on filename extension */
    function getLabwareIcon(fileName) {
        if (!fileName) return 'fas fa-file';
        var ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'rck') return 'fas fa-grip-horizontal';
        if (ext === 'ctr') return 'fas fa-vial';
        if (ext === 'tml') return 'fas fa-pallet';
        return 'fas fa-file';
    }

    // ================================================================
    //  Detail Panel
    // ================================================================
    function showLabwareDetail(entry) {
        st.selectedLabware = entry;
        var panel = $('#cated-detail-panel');
        if (!panel) return;

        var catName = st.categoryMap[entry.categoryId] ? st.categoryMap[entry.categoryId].name : 'Unknown';
        var itemName = entry.displayName || entry.fileName;
        var ext = entry.fileName.split('.').pop().toLowerCase();
        var typeName = ext === 'rck' ? 'Rack' : ext === 'ctr' ? 'Container' : ext === 'tml' ? 'Carrier Template' : 'File';

        // Find all categories this file belongs to
        var allCategories = [];
        for (var i = 0; i < st.indexEntries.length; i++) {
            if (st.indexEntries[i].fileName === entry.fileName) {
                var cn = st.categoryMap[st.indexEntries[i].categoryId];
                if (cn) allCategories.push(cn.name + ' (' + cn.id + ')');
            }
        }

        var html = '';
        html += '<div class="cated-detail-header">';
        html += '<i class="' + getLabwareIcon(entry.fileName) + ' cated-detail-type-icon"></i>';
        html += '<div class="cated-detail-title">';
        html += '<div class="cated-detail-name">' + escHtml(itemName) + '</div>';
        html += '<div class="cated-detail-type">' + typeName + '</div>';
        html += '</div>';
        html += '</div>';

        // Images: Bitmap + Image3D side by side (populated after file load)
        html += '<div class="cated-detail-section" id="cated-images-section" style="display:none">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-image"></i> Images</div>';
        html += '<div class="cated-images-row" id="cated-images-row"></div>';
        html += '</div>';

        // 3D Preview container
        html += '<div class="cated-detail-section">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-cube"></i> 3D Preview</div>';
        html += '<div class="cated-preview-container" id="cated-preview-container">';
        html += '<canvas id="cated-preview-canvas"></canvas>';
        html += '<div class="cated-preview-loading" id="cated-preview-loading"><i class="fas fa-spinner fa-spin"></i> Loading model…</div>';
        html += '</div>';
        html += '</div>';

        // File Information
        html += '<div class="cated-detail-section">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-info-circle"></i> File Information</div>';
        html += '<table class="cated-detail-table">';
        html += '<tr><td class="cated-dt-label">File Name</td><td class="cated-dt-value">' + escHtml(entry.fileName) + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Relative Path</td><td class="cated-dt-value">' + escHtml(entry.relPath.replace(/\\\\/g, '/')) + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Type</td><td class="cated-dt-value">' + typeName + ' (.' + ext + ')</td></tr>';
        if (entry.displayName) {
            html += '<tr><td class="cated-dt-label">Display Name</td><td class="cated-dt-value">' + escHtml(entry.displayName) + '</td></tr>';
        }
        if (entry.description) {
            html += '<tr><td class="cated-dt-label">Description</td><td class="cated-dt-value">' + escHtml(entry.description) + '</td></tr>';
        }
        html += '</table>';
        html += '</div>';

        // Category Memberships
        html += '<div class="cated-detail-section">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-tags"></i> Category Memberships</div>';
        html += '<div class="cated-detail-tags">';
        for (var c = 0; c < allCategories.length; c++) {
            html += '<span class="cated-tag">' + escHtml(allCategories[c]) + '</span>';
        }
        html += '</div>';
        html += '</div>';

        // Resources section (populated after file load)
        html += '<div class="cated-detail-section" id="cated-resources-section" style="display:none">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-paperclip"></i> Associated Resources</div>';
        html += '<div id="cated-resources-list"></div>';
        html += '</div>';

        // Labware configuration data (loaded from the actual file)
        html += '<div class="cated-detail-section">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-cogs"></i> Configuration Data</div>';
        html += '<div id="cated-config-data" class="cated-config-data"><i class="fas fa-spinner fa-spin"></i> Loading file data…</div>';
        html += '</div>';

        panel.innerHTML = html;
        panel.style.display = '';

        // Load actual labware file data
        loadLabwareFileData(entry);
        // Load 3D preview
        load3DPreview(entry);
        // Re-render tree to show selected state
        renderTree();
    }

    /** Normalize a Hamilton backslash path to a URL relative to Labware/ */
    function normResPath(raw) {
        if (!raw) return '';
        return raw.replace(/\\\\/g, '/').replace(/\\/g, '/');
    }

    /** Build a full URL for a resource path relative to the Labware directory */
    function resUrl(relPath) {
        return labwareDir() + '/' + normResPath(relPath);
    }

    /** Populate images section with Bitmap and Image3D */
    function populateImages(cfg) {
        var imagesRow = $('#cated-images-row');
        var imagesSection = $('#cated-images-section');
        if (!imagesRow || !imagesSection) return;

        var bitmapVal = cfg['Bitmap'] ? cfg['Bitmap'].trim() : '';
        var image3dVal = cfg['Image3D'] ? cfg['Image3D'].trim() : '';
        if (!bitmapVal && !image3dVal) return;

        var html = '';
        if (bitmapVal) {
            var bmpUrl = resUrl(bitmapVal);
            html += '<div class="cated-image-card">';
            html += '<div class="cated-image-label">Bitmap</div>';
            html += '<img class="cated-image-thumb" src="' + escHtml(bmpUrl) + '" alt="Bitmap" onerror="this.parentElement.style.display=\'none\'">';
            html += '<div class="cated-image-path">' + escHtml(normResPath(bitmapVal)) + '</div>';
            html += '</div>';
        }
        if (image3dVal) {
            var imgUrl = resUrl(image3dVal);
            html += '<div class="cated-image-card">';
            html += '<div class="cated-image-label">Image 3D</div>';
            html += '<img class="cated-image-thumb" src="' + escHtml(imgUrl) + '" alt="Image3D" onerror="this.parentElement.style.display=\'none\'">';
            html += '<div class="cated-image-path">' + escHtml(normResPath(image3dVal)) + '</div>';
            html += '</div>';
        }
        imagesRow.innerHTML = html;
        imagesSection.style.display = '';
    }

    /** Populate Associated Resources section */
    function populateResources(cfg, ext) {
        var resList = $('#cated-resources-list');
        var resSection = $('#cated-resources-section');
        if (!resList || !resSection) return;

        var resources = [];
        if (cfg['3DModel']) resources.push({ label: '3D Model', path: normResPath(cfg['3DModel']) });
        if (cfg['3DModelRel']) resources.push({ label: '3D Model (rel)', path: normResPath(cfg['3DModelRel']) });
        if (cfg['Bitmap']) resources.push({ label: 'Bitmap', path: normResPath(cfg['Bitmap']) });
        if (cfg['Image3D']) resources.push({ label: 'Image 3D', path: normResPath(cfg['Image3D']) });

        // Container file references
        var cntrIdx = 1;
        while (cfg['Cntr.' + cntrIdx + '.file']) {
            resources.push({ label: 'Container ' + cntrIdx, path: normResPath(cfg['Cntr.' + cntrIdx + '.file']) });
            cntrIdx++;
        }

        if (resources.length === 0) return;

        var html = '<table class="cated-detail-table">';
        for (var i = 0; i < resources.length; i++) {
            html += '<tr><td class="cated-dt-label">' + escHtml(resources[i].label) + '</td>';
            html += '<td class="cated-dt-value">' + escHtml(resources[i].path) + '</td></tr>';
        }
        html += '</table>';
        resList.innerHTML = html;
        resSection.style.display = '';
    }

    /** Load and parse the actual labware file (.rck/.ctr/.tml) to show its properties */
    function loadLabwareFileData(entry) {
        var dir = labwareDir();
        var filePath = normResPath(entry.relPath);
        var url = dir + '/' + filePath;

        fetch(url).then(function(r) {
            if (!r.ok) throw new Error('File not found');
            return r.text();
        }).then(function(text) {
            var configEl = $('#cated-config-data');
            if (!configEl) return;

            var cfg = parseHxCfgSimple(text);
            if (!cfg || Object.keys(cfg).length === 0) {
                configEl.innerHTML = '<span class="cated-muted">No parseable configuration data.</span>';
                return;
            }

            // Populate images and resources from parsed data
            populateImages(cfg);
            populateResources(cfg, entry.fileName.split('.').pop().toLowerCase());

            var html = '<table class="cated-detail-table">';
            var keyFields = [
                ['Description', 'Description'], ['Dim.Dx', 'Width (mm)'], ['Dim.Dy', 'Depth (mm)'],
                ['Dim.Dz', 'Height (mm)'], ['Rows', 'Rows'], ['Columns', 'Columns'],
                ['Dx', 'Col Spacing (mm)'], ['Dy', 'Row Spacing (mm)'],
                ['Depth', 'Well Depth (mm)'], ['Clearance', 'Clearance (mm)'],
                ['Shape', 'Shape'], ['StackHt', 'Stack Height (mm)'],
                ['CategoryCnt', 'Category Count'], ['Visible', 'Visible'],
                ['ReadOnly', 'Read-Only'], ['DataType', 'Data Type'],
                ['SingleCntr', 'Single Container'], ['Segments', 'Segments'],
                ['cLLD', 'Cap. LLD'], ['BaseMM', 'Base (mm)'],
            ];
            var shown = {};
            for (var i = 0; i < keyFields.length; i++) {
                var key = keyFields[i][0];
                var label = keyFields[i][1];
                if (cfg[key] !== undefined) {
                    var val = cfg[key];
                    if (key === 'Visible') val = val === '0' ? 'Yes (visible)' : 'No (hidden)';
                    if (key === 'ReadOnly') val = val === '1' ? 'Yes' : 'No';
                    if (key === 'cLLD') val = val === '1' ? 'Enabled' : 'Disabled';
                    html += '<tr><td class="cated-dt-label">' + escHtml(label) + '</td><td class="cated-dt-value">' + escHtml(String(val)) + '</td></tr>';
                    shown[key] = true;
                }
            }

            var catCnt = parseInt(cfg['CategoryCnt']) || 0;
            for (var ci = 0; ci < catCnt; ci++) {
                var catIdKey = 'Category.' + ci + '.Id';
                if (cfg[catIdKey]) {
                    var embCatId = cfg[catIdKey];
                    var embCatName = st.categoryMap[parseInt(embCatId)] ? st.categoryMap[parseInt(embCatId)].name : 'Unknown';
                    html += '<tr><td class="cated-dt-label">Embedded Cat ' + ci + '</td><td class="cated-dt-value">' + escHtml(embCatName) + ' (' + embCatId + ')</td></tr>';
                    shown[catIdKey] = true;
                }
            }

            var siteCount = 0;
            for (var sk in cfg) {
                var siteMatch = sk.match(/^Site\.(\d+)\./);
                if (siteMatch) {
                    var sn = parseInt(siteMatch[1]);
                    if (sn > siteCount) siteCount = sn;
                }
            }
            if (siteCount > 0) {
                html += '<tr><td class="cated-dt-label">Site Count</td><td class="cated-dt-value">' + siteCount + '</td></tr>';
            }

            var segments = parseInt(cfg['Segments']) || 0;
            for (var si = 1; si <= segments; si++) {
                var eqn = cfg[si + '.EqnOfVol'];
                if (eqn) {
                    html += '<tr><td class="cated-dt-label">Seg ' + si + ' Volume</td><td class="cated-dt-value">' + escHtml(eqn) + '</td></tr>';
                }
                var shape = cfg[si + '.Shape'];
                if (shape !== undefined) {
                    var shapeNames = { '0': 'Cylinder', '1': 'Rectangle', '4': 'Sphere/Cone' };
                    html += '<tr><td class="cated-dt-label">Seg ' + si + ' Shape</td><td class="cated-dt-value">' + (shapeNames[shape] || shape) + '</td></tr>';
                }
            }

            var propIdx = 0;
            while (cfg['Property.' + propIdx] !== undefined) {
                var propName = cfg['Property.' + propIdx];
                var propVal = cfg['PropertyValue.' + propIdx] || '';
                html += '<tr><td class="cated-dt-label">' + escHtml(propName) + '</td><td class="cated-dt-value">' + escHtml(propVal) + '</td></tr>';
                propIdx++;
            }

            html += '</table>';
            configEl.innerHTML = html;
        }).catch(function() {
            var configEl = $('#cated-config-data');
            if (configEl) configEl.innerHTML = '<span class="cated-muted">Could not load file data.</span>';
        });
    }

    /** Minimal HxCfgFile parser — extract key-value pairs from DataDef block */
    function parseHxCfgSimple(text) {
        var cfg = {};
        // Find content inside { ... }
        var braceStart = text.indexOf('{');
        var braceEnd = text.lastIndexOf('}');
        if (braceStart < 0 || braceEnd < 0) return cfg;
        var body = text.substring(braceStart + 1, braceEnd);
        var lines = body.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === ';') continue;
            // Remove trailing comma/semicolon
            line = line.replace(/[,;]\s*$/, '');
            // Key, "Value" pattern
            var match = line.match(/^([^,]+),\s*"([^"]*)"/);
            if (match) {
                cfg[match[1].trim()] = match[2];
            } else {
                // Key, Value (unquoted)
                var parts = line.split(',');
                if (parts.length >= 2) {
                    cfg[parts[0].trim()] = parts.slice(1).join(',').trim().replace(/^"|"$/g, '');
                }
            }
        }
        return cfg;
    }

    // ================================================================
    //  3D Preview
    // ================================================================
    function load3DPreview(entry) {
        var container = $('#cated-preview-container');
        var canvas = $('#cated-preview-canvas');
        var loadingEl = $('#cated-preview-loading');
        if (!container || !canvas) return;

        // Clean up previous
        cleanup3D();

        var dir = labwareDir();
        var filePath = normResPath(entry.relPath);

        // Load the labware file to get model references and dimensions
        fetch(dir + '/' + filePath).then(function(r) {
            if (!r.ok) throw new Error('not found');
            return r.text();
        }).then(function(text) {
            var cfg = parseHxCfgSimple(text);
            var ext = entry.fileName.split('.').pop().toLowerCase();

            // Look for a 3D model reference in the config
            var modelRaw = (cfg['3DModel'] || '').trim();
            var modelRelRaw = (cfg['3DModelRel'] || '').trim();

            // Determine the directory the labware file lives in (for relative paths)
            var fileDir = filePath.substring(0, filePath.lastIndexOf('/'));

            var modelUrl = '';
            if (modelRaw) {
                modelUrl = dir + '/' + normResPath(modelRaw);
            } else if (modelRelRaw) {
                modelUrl = dir + '/' + (fileDir ? fileDir + '/' : '') + normResPath(modelRelRaw);
            }

            if (modelUrl) {
                init3DPreview(canvas);
                loadModelFile(modelUrl, function(ok) {
                    if (loadingEl) loadingEl.style.display = 'none';
                    if (!ok) {
                        // Model failed — fall back to generated geometry
                        buildLabwarePreview(cfg, ext);
                    }
                });
                return;
            }

            // No model reference — generate geometry from dimensions
            init3DPreview(canvas);
            buildLabwarePreview(cfg, ext);
            if (loadingEl) loadingEl.style.display = 'none';
        }).catch(function() {
            if (loadingEl) loadingEl.innerHTML = '<i class="fas fa-cube" style="opacity:0.3"></i> No preview available';
        });
    }

    function init3DPreview(canvas) {
        var container = canvas.parentElement;
        var w = container.clientWidth || 300;
        var h = container.clientHeight || 200;

        st.scene = new THREE.Scene();
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        st.scene.background = new THREE.Color(isDark ? 0x1b2838 : 0xf0f0f0);

        st.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        st.camera.position.set(100, 80, 120);

        st.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        st.renderer.setPixelRatio(window.devicePixelRatio);
        st.renderer.setSize(w, h);

        st.controls = new THREE.OrbitControls(st.camera, canvas);
        st.controls.enableDamping = true;
        st.controls.dampingFactor = 0.12;

        // Lighting
        var amb = new THREE.AmbientLight(0xffffff, 0.6);
        st.scene.add(amb);
        var dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(100, 200, 150);
        st.scene.add(dir);

        animate3D();
    }

    function animate3D() {
        st.previewAnimId = requestAnimationFrame(animate3D);
        if (st.controls) st.controls.update();
        if (st.renderer && st.scene && st.camera) {
            st.renderer.render(st.scene, st.camera);
        }
    }

    function cleanup3D() {
        if (st.previewAnimId) {
            cancelAnimationFrame(st.previewAnimId);
            st.previewAnimId = null;
        }
        if (st.previewModel && st.scene) {
            st.scene.remove(st.previewModel);
            st.previewModel = null;
        }
        if (st.renderer) {
            st.renderer.dispose();
            st.renderer = null;
        }
        st.scene = null;
        st.camera = null;
        st.controls = null;
    }

    /** Build a simple 3D box/wells representation from parsed config */
    function buildLabwarePreview(cfg, ext) {
        if (!st.scene) return;

        var dx = parseFloat(cfg['Dim.Dx']) || 127;
        var dy = parseFloat(cfg['Dim.Dy']) || 86;
        var dz = parseFloat(cfg['Dim.Dz']) || 10;

        var group = new THREE.Group();

        // Base plate
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var baseColor = isDark ? 0x4466aa : 0x6699cc;
        var baseMat = new THREE.MeshPhongMaterial({ color: baseColor, transparent: true, opacity: 0.7 });
        var baseGeo = new THREE.BoxGeometry(dx, dz, dy);
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(dx / 2, dz / 2, dy / 2);
        group.add(baseMesh);

        // Wells for rack files
        if (ext === 'rck') {
            var rows = parseInt(cfg['Rows']) || 8;
            var cols = parseInt(cfg['Columns']) || 12;
            var spacingX = parseFloat(cfg['Dx']) || 9;
            var spacingY = parseFloat(cfg['Dy']) || 9;
            var bndX = parseFloat(cfg['BndryX']) || 14;
            var bndY = parseFloat(cfg['BndryY']) || 11.5;
            var wellR = Math.min(spacingX, spacingY) * 0.35;
            var wellDepth = parseFloat(cfg['Depth'] || cfg['Dim.Dz']) || dz;
            var wellColor = isDark ? 0x223344 : 0x334455;

            var wellGeo = new THREE.CylinderGeometry(wellR, wellR, Math.min(wellDepth, dz) * 0.6, 12);
            var wellMat = new THREE.MeshPhongMaterial({ color: wellColor });

            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    var well = new THREE.Mesh(wellGeo, wellMat);
                    well.position.set(
                        bndX + c * spacingX,
                        dz + 1,
                        bndY + r * spacingY
                    );
                    group.add(well);
                }
            }
        }

        // Container: show a well cross-section
        if (ext === 'ctr') {
            var depth = parseFloat(cfg['Depth']) || 20;
            var wellGeoC = new THREE.CylinderGeometry(dx * 0.4, dx * 0.3, depth, 16);
            var wellMatC = new THREE.MeshPhongMaterial({ color: isDark ? 0x446688 : 0x5588aa, transparent: true, opacity: 0.8 });
            var wellC = new THREE.Mesh(wellGeoC, wellMatC);
            wellC.position.set(dx / 2, depth / 2 + dz, dy / 2);
            group.add(wellC);
        }

        // Center and frame
        var box = new THREE.Box3().setFromObject(group);
        var center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);

        st.previewModel = group;
        st.scene.add(group);

        // Frame camera
        var size = box.getSize(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);
        st.camera.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
        st.controls.target.set(0, 0, 0);
        st.controls.update();
    }

    function loadModelFile(url, callback) {
        var isHxx = /\.hxx$/i.test(url);

        if (isHxx && window.HXXLoader) {
            // .hxx: fetch as ArrayBuffer → decompress → load the .x blob
            fetch(url).then(function(r) {
                if (!r.ok) throw new Error('HXX not found');
                return r.arrayBuffer();
            }).then(function(buf) {
                return HXXLoader.toXFileBlob(buf);
            }).then(function(blob) {
                var blobUrl = URL.createObjectURL(blob);
                // basePath stays at the original model's directory for textures
                var basePath = url.substring(0, url.lastIndexOf('/') + 1);
                loadXModel(blobUrl, basePath, function(ok) {
                    URL.revokeObjectURL(blobUrl);
                    if (callback) callback(ok);
                });
            }).catch(function(err) {
                console.warn('[CatEd] HXX load error:', err);
                if (callback) callback(false);
            });
            return;
        }

        // .x file — load directly
        var basePath = url.substring(0, url.lastIndexOf('/') + 1);
        loadXModel(url, basePath, callback);
    }

    /** Load an .x file URL using XFileLoader with texture resolution */
    function loadXModel(url, basePath, callback) {
        if (typeof THREE.XFileLoader !== 'function') {
            if (callback) callback(false);
            return;
        }

        var manager = new THREE.LoadingManager();
        manager.setURLModifier(function(texUrl) {
            if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                return basePath + texUrl.split('/').pop();
            }
            return texUrl;
        });

        var loader = new THREE.XFileLoader(manager);
        // Add cache-bust for direct URLs (not blobs)
        var finalUrl = /^blob:|^data:/i.test(url) ? url : url + (url.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();

        loader.load(finalUrl, function(obj) {
            if (!st.scene || !obj) { if (callback) callback(false); return; }
            if (obj.error || !obj.models || obj.models.length === 0) {
                if (callback) callback(false);
                return;
            }

            var group = new THREE.Group();
            for (var i = 0; i < obj.models.length; i++) {
                group.add(obj.models[i]);
            }

            // Center and frame
            var box = new THREE.Box3().setFromObject(group);
            var center = box.getCenter(new THREE.Vector3());
            group.position.sub(center);

            st.previewModel = group;
            st.scene.add(group);

            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                st.camera.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
                st.controls.target.set(0, 0, 0);
                st.controls.update();
            }
            if (callback) callback(true);
            }, undefined, function() {
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    }

    // ================================================================
    //  Event Handling
    // ================================================================
    function wireEvents() {
        var treeEl = $('#cated-tree');
        if (treeEl) {
            treeEl.addEventListener('click', function(e) {
                // Category node header click — toggle expand + select
                var header = e.target.closest('.cated-node-header');
                if (header) {
                    var catId = parseInt(header.dataset.catId, 10);
                    st.selectedCatId = catId;
                    // Toggle expand
                    if (st.expandedNodes[catId]) {
                        delete st.expandedNodes[catId];
                    } else {
                        st.expandedNodes[catId] = true;
                    }
                    st.selectedLabware = null;
                    renderTree();
                    showCategoryInfo(catId);
                    return;
                }

                // Labware item click — show detail
                var lwItem = e.target.closest('.cated-labware-item');
                if (lwItem) {
                    var lwCatId = parseInt(lwItem.dataset.catId, 10);
                    var lwIdx = parseInt(lwItem.dataset.idx, 10);
                    var items = st.labwareByCategory[lwCatId] || [];
                    if (items[lwIdx]) {
                        showLabwareDetail(items[lwIdx]);
                    }
                }
            });
        }

        // Search
        var searchEl = $('#cated-search');
        if (searchEl) {
            searchEl.addEventListener('input', function() {
                st.searchTerm = searchEl.value;
                // Auto-expand matching nodes when searching
                if (st.searchTerm.length >= 2) {
                    autoExpandMatches(st.searchTerm.toLowerCase());
                }
                renderTree();
            });
        }

        // Expand All / Collapse All buttons
        var expandAllBtn = $('#cated-expand-all');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', function() {
                expandAll(st.categories);
                renderTree();
            });
        }
        var collapseAllBtn = $('#cated-collapse-all');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', function() {
                st.expandedNodes = {};
                renderTree();
            });
        }

        // Refresh button
        var refreshBtn = $('#cated-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                st.expandedNodes = {};
                st.selectedCatId = null;
                st.selectedLabware = null;
                loadCategoryData();
                var panel = $('#cated-detail-panel');
                if (panel) panel.innerHTML = '<div class="cated-detail-placeholder"><i class="fas fa-mouse-pointer"></i><p>Select a labware item to view details</p></div>';
            });
        }
    }

    /** Expand all parent nodes of matching items */
    function autoExpandMatches(filter) {
        function expand(nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if (matchesFilter(nodes[i], filter)) {
                    st.expandedNodes[nodes[i].id] = true;
                    if (nodes[i].children.length) expand(nodes[i].children);
                }
            }
        }
        expand(st.categories);
    }

    function expandAll(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            st.expandedNodes[nodes[i].id] = true;
            if (nodes[i].children.length) expandAll(nodes[i].children);
        }
    }

    /** Show category info in detail panel when a category (not labware) is selected */
    function showCategoryInfo(catId) {
        var cat = st.categoryMap[catId];
        if (!cat) return;

        var panel = $('#cated-detail-panel');
        if (!panel) return;

        cleanup3D();

        var items = st.labwareByCategory[catId] || [];
        var totalCount = countLabware(cat);

        var html = '';
        html += '<div class="cated-detail-header">';
        html += '<i class="' + getCategoryIcon(cat) + ' cated-detail-type-icon"></i>';
        html += '<div class="cated-detail-title">';
        html += '<div class="cated-detail-name">' + escHtml(cat.name) + '</div>';
        html += '<div class="cated-detail-type">Category (ID: ' + cat.id + ')</div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="cated-detail-section">';
        html += '<div class="cated-detail-section-title"><i class="fas fa-info-circle"></i> Category Details</div>';
        html += '<table class="cated-detail-table">';
        html += '<tr><td class="cated-dt-label">Category ID</td><td class="cated-dt-value">' + cat.id + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Parent ID</td><td class="cated-dt-value">' + cat.parentId + (cat.parentId === 0 ? ' (root)' : '') + '</td></tr>';
        if (cat.parentId !== 0 && st.categoryMap[cat.parentId]) {
            html += '<tr><td class="cated-dt-label">Parent Category</td><td class="cated-dt-value">' + escHtml(st.categoryMap[cat.parentId].name) + '</td></tr>';
        }
        html += '<tr><td class="cated-dt-label">Icon</td><td class="cated-dt-value">' + escHtml(cat.icon) + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Direct Items</td><td class="cated-dt-value">' + items.length + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Total Items (incl. children)</td><td class="cated-dt-value">' + totalCount + '</td></tr>';
        html += '<tr><td class="cated-dt-label">Sub-categories</td><td class="cated-dt-value">' + cat.children.length + '</td></tr>';
        html += '</table>';
        html += '</div>';

        // List labware files in this category
        if (items.length > 0) {
            html += '<div class="cated-detail-section">';
            html += '<div class="cated-detail-section-title"><i class="fas fa-list"></i> Labware in this Category (' + items.length + ')</div>';
            html += '<div class="cated-cat-labware-list">';
            for (var i = 0; i < items.length; i++) {
                html += '<div class="cated-cat-lw-item" data-file-idx="' + i + '">';
                html += '<i class="' + getLabwareIcon(items[i].fileName) + '"></i> ';
                html += '<span>' + escHtml(items[i].displayName || items[i].fileName) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

        panel.innerHTML = html;

        // Wire clicks on labware items in the category detail
        var catLwItems = panel.querySelectorAll('.cated-cat-lw-item');
        catLwItems.forEach(function(el) {
            el.addEventListener('click', function() {
                var idx = parseInt(el.dataset.fileIdx, 10);
                if (items[idx]) {
                    showLabwareDetail(items[idx]);
                }
            });
        });
    }

    // ================================================================
    //  Initialization
    // ================================================================
    function initCategoryEditor() {
        if (st.initialized) return;
        st.initialized = true;

        wireEvents();
        loadCategoryData();
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.CategoryEditorModule = {
        init: initCategoryEditor,
        getCategories: function() { return st.categories; },
        getCategoryMap: function() { return st.categoryMap; },
        /** Open a category picker dialog — returns a Promise resolving to selected category IDs */
        openCategoryPicker: function(currentIds) {
            return openCategoryPickerDialog(currentIds || []);
        },
    };

    // ================================================================
    //  Category Picker Dialog (for MFX / Labware / Carrier editors)
    // ================================================================
    function openCategoryPickerDialog(currentIds) {
        return new Promise(function(resolve) {
            // Build modal
            var overlay = document.createElement('div');
            overlay.className = 'cated-picker-overlay';

            var modal = document.createElement('div');
            modal.className = 'cated-picker-modal';

            var header = '<div class="cated-picker-header">';
            header += '<i class="fas fa-tags"></i> Select Categories';
            header += '<button class="cated-picker-close" title="Cancel">&times;</button>';
            header += '</div>';

            var body = '<div class="cated-picker-body">';
            body += '<div class="cated-picker-search"><input type="text" class="lwe-input" placeholder="Search categories…" id="cated-picker-search-input"></div>';
            body += '<div class="cated-picker-tree" id="cated-picker-tree"></div>';
            body += '</div>';

            var footer = '<div class="cated-picker-footer">';
            footer += '<span class="cated-picker-count" id="cated-picker-count">0 selected</span>';
            footer += '<button class="lwe-btn" id="cated-picker-cancel">Cancel</button>';
            footer += '<button class="lwe-btn lwe-btn-accent" id="cated-picker-ok">OK</button>';
            footer += '</div>';

            modal.innerHTML = header + body + footer;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Checked IDs
            var checked = {};
            for (var i = 0; i < currentIds.length; i++) {
                checked[currentIds[i]] = true;
            }

            // Ensure data is loaded
            function renderPickerTree(filter) {
                var treeEl = document.getElementById('cated-picker-tree');
                if (!treeEl) return;
                treeEl.innerHTML = buildPickerTreeHtml(st.categories, 0, filter || '', checked);
            }

            function updateCount() {
                var countEl = document.getElementById('cated-picker-count');
                var sel = Object.keys(checked).filter(function(k) { return checked[k]; });
                if (countEl) countEl.textContent = sel.length + ' selected';
            }

            // Ensure category data is loaded
            if (Object.keys(st.categoryMap).length === 0) {
                // Load fresh
                var dir = labwareDir();
                Promise.all([
                    fetch(dir + '/Category.dat').then(function(r) { return r.text(); }),
                    fetch(dir + '/Index.dat').then(function(r) { return r.text(); })
                ]).then(function(results) {
                    st.categories = parseCategoryDat(results[0]);
                    st.indexEntries = parseIndexDat(results[1]);
                    var tree = buildCategoryTree(st.categories);
                    st.categories = tree.roots;
                    st.categoryMap = tree.map;
                    st.labwareByCategory = groupByCategory(st.indexEntries);
                    renderPickerTree();
                    updateCount();
                });
            } else {
                renderPickerTree();
                updateCount();
            }

            // Events
            var pickerTree = document.getElementById('cated-picker-tree');
            pickerTree.addEventListener('click', function(e) {
                var chk = e.target.closest('input[type="checkbox"]');
                if (chk) {
                    var catId = chk.dataset.catId;
                    if (chk.checked) checked[catId] = true;
                    else delete checked[catId];
                    updateCount();
                    return;
                }
                var hdr = e.target.closest('.cated-picker-node-header');
                if (hdr) {
                    var body = hdr.nextElementSibling;
                    if (body && body.classList.contains('cated-picker-children')) {
                        body.classList.toggle('is-hidden');
                        var chevron = hdr.querySelector('.cated-toggle');
                        if (chevron) {
                            chevron.classList.toggle('fa-chevron-right');
                            chevron.classList.toggle('fa-chevron-down');
                        }
                    }
                }
            });

            var searchInput = document.getElementById('cated-picker-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    renderPickerTree(searchInput.value.toLowerCase());
                });
            }

            // OK / Cancel
            document.getElementById('cated-picker-ok').addEventListener('click', function() {
                var result = Object.keys(checked).filter(function(k) { return checked[k]; });
                document.body.removeChild(overlay);
                resolve(result);
            });
            document.getElementById('cated-picker-cancel').addEventListener('click', function() {
                document.body.removeChild(overlay);
                resolve(null);
            });
            overlay.querySelector('.cated-picker-close').addEventListener('click', function() {
                document.body.removeChild(overlay);
                resolve(null);
            });
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(null);
                }
            });
        });
    }

    function buildPickerTreeHtml(nodes, depth, filter, checked) {
        var html = '';
        for (var i = 0; i < nodes.length; i++) {
            var cat = nodes[i];
            if (filter && !matchesFilter(cat, filter)) continue;

            var hasChildren = cat.children.length > 0;
            var isChecked = !!checked[cat.id];
            var icon = getCategoryIcon(cat);

            html += '<div class="cated-picker-node">';
            html += '<div class="cated-picker-node-header" style="padding-left:' + (8 + depth * 16) + 'px">';
            if (hasChildren) {
                html += '<i class="fas fa-chevron-right cated-toggle"></i>';
            } else {
                html += '<span class="cated-toggle-placeholder"></span>';
            }
            html += '<label class="cated-picker-label">';
            html += '<input type="checkbox" data-cat-id="' + cat.id + '"' + (isChecked ? ' checked' : '') + '>';
            html += '<i class="' + icon + ' cated-picker-icon"></i>';
            html += '<span>' + escHtml(cat.name) + '</span>';
            html += '<small class="cated-picker-id">(' + cat.id + ')</small>';
            html += '</label>';
            html += '</div>';

            if (hasChildren) {
                html += '<div class="cated-picker-children is-hidden">';
                html += buildPickerTreeHtml(cat.children, depth + 1, filter, checked);
                html += '</div>';
            }
            html += '</div>';
        }
        return html;
    }

})();
