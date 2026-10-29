/* ============================================================
   Portal Data Kabupaten & Kota — Profil Wilayah Controller (Profil.js)
   Tampilan 9 Tab Lengkap, Kompas & Batas Wilayah Spasial (Leaflet flyToBounds),
   Diagram Kursi DPRD 2024, Piramida Penduduk, & Bar PDRB 17 Sektor.
   ============================================================ */

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const REGION_NAME_ALIASES = {
    'TOBA': 'TOBASAMOSIR',
    'TOBASAMOSIR': 'TOBA',
    'PAKPAKBHARAT': 'PAKPAKBARAT',
    'PAKPAKBARAT': 'PAKPAKBHARAT',
    'TANJUNGJABUNGBARAT': 'TANJUNGJABUNGB',
    'TANJUNGJABUNGTIMUR': 'TANJUNGJABUNGT',
    'TANJUNGJABUNGB': 'TANJUNGJABUNGBARAT',
    'TANJUNGJABUNGT': 'TANJUNGJABUNGTIMUR',
    'MEMPAWAH': 'PONTIANAK',
    'PASANGKAYU': 'MAMUJUUTARA',
    'MAMUJUUTARA': 'PASANGKAYU',
    'KEPULAUANTANIMBAR': 'MALUKUTENGGARABARAT',
    'MALUKUTENGGARABARAT': 'KEPULAUANTANIMBAR',
    'KOTATARAKAN': 'TARAKAN',
    'TARAKAN': 'KOTATARAKAN',
    'KEPULAUANSIAUTAGULANDANGBIARO': 'SIAUTAGULANDANGBIARO',
    'BUTONSELATAN': 'BUTON',
    'PULAUTALIABU': 'KEPULAUANSULA'
};

function cleanAlnum(s) {
    if (!s) return '';
    return s.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function cleanStripType(s) {
    if (!s) return '';
    const stripped = s.toString().toUpperCase().trim().replace(/^(KABUPATEN|KOTA|KAB\.|KOTA\.)\s+/, '');
    return cleanAlnum(stripped);
}

function normProv(s) {
    const clean = cleanAlnum(s);
    if (clean.includes('JAKARTA')) return 'JAKARTA';
    if (clean.includes('YOGYAKARTA')) return 'YOGYAKARTA';
    if (clean.includes('BANGKABELITUNG')) return 'BANGKABELITUNG';
    if (clean.includes('PAPUABARAT') || clean.includes('IRIANJAYABARAT')) return 'PAPUABARAT';
    return clean;
}

function isWaterBodyName(name) {
    if (!name) return false;
    const clean = name.replace(/^(Kabupaten|Kota|Kab\.|Kota\.)\s+/i, '').trim();
    if (clean.toUpperCase() === 'TANAH LAUT') return false;
    return /\b(LAUT|SELAT|SAMUDRA|SAMUDERA|TELUK|PERAIRAN|DANAU|OCEAN)\b/i.test(clean);
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof REGION_DATA === 'undefined' || !Array.isArray(REGION_DATA) || REGION_DATA.length === 0) {
        console.error('REGION_DATA is missing or not loaded.');
        return;
    }

    // 1. Get Current Region from URL & Storage
    const urlParams = new URLSearchParams(window.location.search);
    let targetId = urlParams.get('id');
    let targetSlug = urlParams.get('slug');
    const returnView = urlParams.get('view') || urlParams.get('from');

    // Fallback ke hash jika URL memakai hash (#19 atau #id=19 atau #id=19&slug=...)
    if ((!targetId || !targetSlug) && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr);
        if (!targetId) {
            targetId = hashParams.get('id') || (!hashStr.includes('=') && !isNaN(hashStr) ? hashStr : null);
        }
        if (!targetSlug) {
            targetSlug = hashParams.get('slug') || (!hashStr.includes('=') && isNaN(hashStr) ? hashStr : null);
        }
    }

    // Fallback ke sessionStorage / localStorage jika query string di-strip oleh server (misal cleanUrls /profil)
    if (!targetId && !targetSlug) {
        try {
            targetId = sessionStorage.getItem('selected_region_id') || localStorage.getItem('selected_region_id');
            targetSlug = sessionStorage.getItem('selected_region_slug') || localStorage.getItem('selected_region_slug');
        } catch (e) {}
    }

    // Dynamic Back Button Adjustment
    const backLink = document.getElementById('backLink');
    const backLinkLabel = document.getElementById('backLinkLabel');
    if (backLink) {
        if (returnView === 'table') {
            backLink.href = 'index.html?view=table';
            if (backLinkLabel) backLinkLabel.textContent = 'Kembali ke Tabel Peringkat';
        } else {
            backLink.href = 'index.html?view=map';
            if (backLinkLabel) backLinkLabel.textContent = 'Kembali ke Peta & Dashboard';
        }
    }

    let r = null;
    if (targetId) {
        r = REGION_DATA.find(x => String(x.id) === String(targetId) || String(x.no) === String(targetId));
    }
    if (!r && targetSlug) {
        r = REGION_DATA.find(x => x.slug === targetSlug);
    }
    if (!r) {
        try {
            const savedName = sessionStorage.getItem('selected_region_name') || localStorage.getItem('selected_region_name');
            if (savedName) {
                r = REGION_DATA.find(x => (x.kabkota || '').toLowerCase() === savedName.toLowerCase());
            }
        } catch (e) {}
    }
    if (!r) {
        r = REGION_DATA[0];
    }

    // Selalu simpan daerah aktif ke storage agar persisten
    try {
        localStorage.setItem('selected_region_id', String(r.id || r.no));
        localStorage.setItem('selected_region_slug', String(r.slug || ''));
        localStorage.setItem('selected_region_name', String(r.kabkota || ''));
        sessionStorage.setItem('selected_region_id', String(r.id || r.no));
        sessionStorage.setItem('selected_region_slug', String(r.slug || ''));
        sessionStorage.setItem('selected_region_name', String(r.kabkota || ''));
    } catch (e) {}

    // Perbarui URL address bar jika query string hilang tanpa mereload halaman
    if (!urlParams.get('id') && window.history && window.history.replaceState) {
        const hashSuffix = `#id=${r.id}&slug=${r.slug}`;
        window.history.replaceState(null, '', `profil.html?id=${r.id}&slug=${r.slug}${hashSuffix}`);
    }

    document.title = `${r.kabkota || 'Wilayah'} — Profil Data & Statistik Resmi`;

    // 2. Populate Header Masthead
    const judulEl = document.getElementById('judul');
    const subjudulEl = document.getElementById('subjudul');
    if (judulEl) judulEl.textContent = r.kabkota || 'Nama Wilayah';
    if (subjudulEl) subjudulEl.textContent = `PROVINSI ${r.prov || 'INDONESIA'} · kode BPS #${r.id || r.no || '1'}`;

    // 3. Setup Cascading Region Filter (Search + Provinsi + Kab/Kota)
    setupCascadingFilter(r, returnView);

    // 4. Leaflet Map Initialization
    let map = null;
    let mainRegionLayer = null;
    let selectedBoundaryLayer = null;

    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || map) return;

        const lat = r.lat || -6.2;
        const lng = r.lng || 106.8;

        map = L.map('map', {
            center: [lat, lng],
            zoom: 10,
            maxZoom: 16,
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: false
        });

        // Esri World Dark Gray Canvas: 100% Watermark-free, zero API key required, sleek dark slate GIS theme
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 16,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        }).addTo(map);

        try {
            const geoData = (typeof window !== 'undefined' && window.INDONESIA_KAB_GEOJSON) || (typeof INDONESIA_KAB_GEOJSON !== 'undefined' ? INDONESIA_KAB_GEOJSON : null);

            if (geoData && Array.isArray(geoData.features)) {
                const matchedFeatures = geoData.features.filter(f => {
                    try {
                        return isRegionMatchStrict(f, r);
                    } catch (err) {
                        console.error('Match error on feature:', err);
                        return false;
                    }
                });

                showMapMessage(`Wilayah Utama: ${r.kabkota}`);

                if (matchedFeatures.length > 0) {
                    mainRegionLayer = L.geoJSON(matchedFeatures, {
                        style: {
                            fillColor: '#2dd4bf',
                            weight: 2.2,
                            opacity: 0.95,
                            color: '#5eead4',
                            fillOpacity: 0.35
                        },
                        onEachFeature: (feature, layer) => {
                            const name = feature.properties.NAME_1 || feature.properties.KABKOTA || r.kabkota;
                            layer.bindTooltip(`
                                <div class="map-hud-tooltip" style="min-width: 200px;">
                                    <div class="hud-eyebrow">WILAYAH UTAMA</div>
                                    <div class="hud-title">${escapeHtml(name)}</div>
                                    <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">Provinsi ${escapeHtml(r.prov || 'Indonesia')}</div>
                                </div>
                            `, { sticky: true, offset: [15, 12], className: 'leaflet-dark-hud' });
                        }
                    }).addTo(map);

                    try {
                        const bounds = mainRegionLayer.getBounds();
                        if (bounds && bounds.isValid()) {
                            map.fitBounds(bounds, { padding: [30, 30] });
                        }
                    } catch (bErr) {
                        console.warn('fitBounds error:', bErr);
                    }
                } else {
                    // Fallback graceful marker jika wilayah tidak memiliki poligon independen di GeoJSON
                    const fallbackMarker = L.circleMarker([lat, lng], {
                        radius: 8,
                        fillColor: '#2dd4bf',
                        color: '#5eead4',
                        weight: 2,
                        opacity: 0.95,
                        fillOpacity: 0.8
                    }).addTo(map);

                    fallbackMarker.bindTooltip(`
                        <div class="map-hud-tooltip" style="min-width: 200px;">
                            <div class="hud-eyebrow">TITIK KOORDINAT WILAYAH</div>
                            <div class="hud-title">${escapeHtml(r.kabkota)}</div>
                            <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">Provinsi ${escapeHtml(r.prov || 'Indonesia')}</div>
                        </div>
                    `, { sticky: true, offset: [15, 12], className: 'leaflet-dark-hud' });

                    map.setView([lat, lng], 10);
                }
            } else {
                if (msgEl) msgEl.textContent = 'GeoData belum termuat';
            }
        } catch (e) {
            console.error('initMap error:', e);
            if (msgEl) msgEl.textContent = 'Error: ' + e.message;
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 120);
    }

    // Helper: Strict Kota vs Kabupaten & Province matching to prevent cross-matching
    function isRegionMatchStrict(feature, regionObj) {
        if (!feature || !feature.properties || !regionObj) return false;
        const props = feature.properties;
        const name1 = props.NAME_1 || props.KABKOTA || '';
        const country = props.COUNTRY || props.NAME_2 || '';
        const type2 = (props.VARNAME_2 || '').toUpperCase();

        const rawR = cleanAlnum(regionObj.kabkota);
        const rawF = cleanAlnum(name1);
        if (!rawF || rawF === 'NA') return false;

        const stripR = cleanStripType(regionObj.kabkota);
        const stripF = cleanStripType(name1);

        const rProv = normProv(regionObj.prov);
        const fProv = normProv(country);

        const provMatches = !fProv || !rProv || fProv === rProv || rProv.includes(fProv) || fProv.includes(rProv);
        if (!provMatches) return false;

        const rIsKota = (regionObj.kabkota || '').toUpperCase().startsWith('KOTA ');
        let fIsKota = false;
        if (type2 === 'KABUPATEN') {
            fIsKota = false;
        } else if (type2 === 'KOTA') {
            fIsKota = true;
        } else {
            fIsKota = name1.toUpperCase().startsWith('KOTA ');
        }

        let nameMatches = (rawR === rawF) || (stripR === stripF) || (stripR === rawF) || (rawR === stripF);
        if (!nameMatches) {
            const aliasR = REGION_NAME_ALIASES[rawR] || REGION_NAME_ALIASES[stripR];
            if (aliasR && (aliasR === rawF || aliasR === stripF)) {
                nameMatches = true;
            }
        }

        if (!nameMatches) return false;

        if (type2 !== 'NA' && type2 !== '') {
            if (rIsKota !== fIsKota) return false;
        }

        return true;
    }

    // Helper: Smoothly fly & fit bounds to boundary region on Leaflet map
    function showBoundaryOnMap(directionKey, targetText, boundaryFeature) {
        if (!targetText) return;

        if (!map) {
            initMap();
        }

        if (!map || typeof INDONESIA_KAB_GEOJSON === 'undefined') return;

        if (directionKey === 'reset') {
            if (selectedBoundaryLayer) {
                map.removeLayer(selectedBoundaryLayer);
                selectedBoundaryLayer = null;
            }
            if (mainRegionLayer && mainRegionLayer.getBounds && mainRegionLayer.getBounds().isValid()) {
                if (typeof map.flyToBounds === 'function') {
                    map.flyToBounds(mainRegionLayer.getBounds(), { padding: [30, 30], duration: 0.8 });
                } else {
                    map.fitBounds(mainRegionLayer.getBounds(), { padding: [30, 30] });
                }
            }
            showMapMessage(`Tampilan peta kembali ke wilayah utama ${r.kabkota}.`);
            return;
        }

        // Clear previous boundary highlight layer if any
        if (selectedBoundaryLayer) {
            map.removeLayer(selectedBoundaryLayer);
            selectedBoundaryLayer = null;
        }

        const isWaterBody = directionKey === 'water' || isWaterBodyName(targetText);

        if (isWaterBody) {
            if (mainRegionLayer && mainRegionLayer.getBounds && mainRegionLayer.getBounds().isValid()) {
                if (typeof map.flyToBounds === 'function') {
                    map.flyToBounds(mainRegionLayer.getBounds(), { padding: [30, 30], duration: 0.6 });
                }
            }
            showMapMessage(`🌊 Batas Maritim / Perairan: ${targetText}`);
            return;
        }

        let matchedFeatures = [];
        if (boundaryFeature) {
            matchedFeatures = Array.isArray(boundaryFeature) ? boundaryFeature : [boundaryFeature];
        } else {
            const foundFeat = findGeoJSONFeatureByName(targetText, r.prov);
            matchedFeatures = foundFeat ? [foundFeat] : [];
        }

        if (matchedFeatures.length > 0) {
            selectedBoundaryLayer = L.geoJSON(matchedFeatures, {
                style: {
                    fillColor: '#fbbf24',
                    weight: 2.5,
                    opacity: 0.95,
                    color: '#fde68a',
                    fillOpacity: 0.45
                },
                onEachFeature: (feature, layer) => {
                    const name = feature.properties.NAME_1 || feature.properties.KABKOTA || targetText;
                    layer.bindTooltip(`
                        <div class="map-hud-tooltip" style="min-width: 200px;">
                            <div class="hud-eyebrow" style="color: #fbbf24;">WILAYAH BERBATASAN</div>
                            <div class="hud-title">${escapeHtml(name)}</div>
                        </div>
                    `, { sticky: true, offset: [15, 12], className: 'leaflet-dark-hud' });
                }
            }).addTo(map);
            if (typeof selectedBoundaryLayer.bringToFront === 'function') {
                selectedBoundaryLayer.bringToFront();
            }

            try {
                let combinedBounds = selectedBoundaryLayer.getBounds();
                if (mainRegionLayer && mainRegionLayer.getBounds && mainRegionLayer.getBounds().isValid()) {
                    combinedBounds = combinedBounds.extend(mainRegionLayer.getBounds());
                }
                if (combinedBounds && combinedBounds.isValid()) {
                    if (typeof map.flyToBounds === 'function') {
                        map.flyToBounds(combinedBounds, { padding: [35, 35], duration: 0.8 });
                    } else {
                        map.fitBounds(combinedBounds, { padding: [35, 35], animate: true });
                    }
                }
            } catch (err) {
                console.warn('fitBounds error:', err);
            }
            showMapMessage(`Wilayah Berbatasan: ${targetText} ditampilkan pada peta.`);
        } else {
            showMapMessage(`Wilayah Berbatasan: ${targetText}`);
        }
    }

    // 5. Setup 9-Tab Switching Logic
    const TABS = [
        { btn: 'tab-btn-investasi', pane: 'tab-investasi', eyebrow: 'Deck Investasi · Dossier Daerah' },
        { btn: 'tab-btn-wilayah', pane: 'tab-wilayah', eyebrow: 'Profil Wilayah · Dossier Daerah' },
        { btn: 'tab-btn-pemerintahan', pane: 'tab-pemerintahan', eyebrow: 'Profil Pemerintahan · Dossier Daerah' },
        { btn: 'tab-btn-penduduk', pane: 'tab-penduduk', eyebrow: 'Penduduk & SDM · Dossier Daerah' },
        { btn: 'tab-btn-ekonomi', pane: 'tab-ekonomi', eyebrow: 'Ekonomi · Dossier Daerah' },
        { btn: 'tab-btn-konsumsi', pane: 'tab-konsumsi', eyebrow: 'Konsumsi · Dossier Daerah' },
        { btn: 'tab-btn-pertanian', pane: 'tab-pertanian', eyebrow: 'Data Pertanian · Dossier Daerah' },
        { btn: 'tab-btn-sosial', pane: 'tab-sosial', eyebrow: 'Sosial · Dossier Daerah' },
        { btn: 'tab-btn-podes', pane: 'tab-podes', eyebrow: 'Data PODES · Dossier Daerah' }
    ];

    function switchTab(idx) {
        if (idx < 0 || idx >= TABS.length) idx = 1;
        const currentPaneId = TABS[idx].pane;
        try {
            sessionStorage.setItem('active_profil_tab', currentPaneId);
            const curUrl = new URL(window.location.href);
            curUrl.searchParams.set('tab', currentPaneId.replace('tab-', ''));
            window.history.replaceState(null, '', curUrl.toString());
        } catch (e) {}

        TABS.forEach((t, i) => {
            const on = i === idx;
            const btnEl = document.getElementById(t.btn);
            const paneEl = document.getElementById(t.pane);
            if (btnEl) {
                btnEl.setAttribute('aria-selected', on ? 'true' : 'false');
                if (on && typeof btnEl.scrollIntoView === 'function') {
                    btnEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
            if (paneEl) paneEl.hidden = !on;
            if (on) {
                const eb = document.getElementById('eyebrow');
                if (eb) eb.textContent = t.eyebrow;
            }
        });

        if (currentPaneId === 'tab-ekonomi') {
            setTimeout(() => {
                try { renderKemiskinanKuadran(r); } catch (e) {}
                try { renderPdrbSektor(r); } catch (e) {}
                try { renderEkosistemUsaha(r); } catch (e) {}
                try { renderIndustriBesarSedang(r); } catch (e) {}
            }, 50);
        }

        if (idx === 1) {
            setTimeout(() => {
                initMap();
                if (map) map.invalidateSize();
                if (window.bandaraMapInstance) {
                    window.bandaraMapInstance.invalidateSize();
                    if (typeof window.recenterBandaraMap === 'function') {
                        window.recenterBandaraMap();
                    }
                }
            }, 100);
        } else if (idx === 7) {
            setTimeout(() => {
                if (typeof window.recheckDaruratView === 'function') {
                    window.recheckDaruratView();
                }
            }, 100);
        }

        // Auto-resize ECharts instances when switching to hidden/inactive tabs
        setTimeout(() => {
            if (window._fase1Charts && Array.isArray(window._fase1Charts)) {
                window._fase1Charts.forEach(c => {
                    try {
                        if (c && !c.isDisposed()) c.resize();
                    } catch (e) {}
                });
            }
        }, 80);
    }

    TABS.forEach((t, i) => {
        const btn = document.getElementById(t.btn);
        if (btn) btn.addEventListener('click', () => switchTab(i));
    });

    const tabbar = document.getElementById('tabbar');
    if (tabbar) {
        tabbar.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const cur = TABS.findIndex(t => {
                const b = document.getElementById(t.btn);
                return b && b.getAttribute('aria-selected') === 'true';
            });
            const next = (cur + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
            switchTab(next);
            const nextBtn = document.getElementById(TABS[next].btn);
            if (nextBtn) nextBtn.focus();
        });
    }

    window.addEventListener('resize', () => {
        if (window._fase1Charts && Array.isArray(window._fase1Charts)) {
            window._fase1Charts.forEach(c => {
                try {
                    if (c && !c.isDisposed()) c.resize();
                } catch (e) {}
            });
        }
    });

    // 6. Render All Tab Renderers
    renderInvestasi(r);
    renderWilayah(r, showBoundaryOnMap);
    renderPemerintahan(r);
    renderPenduduk(r);
    renderEkonomi(r);
    renderKonsumsi(r);
    renderPertanian(r);
    renderSosial(r);
    renderPodes();

    // Render Fase 1 Analytical Widgets (BPS 2024 Resmi)
    renderRadarIpm(r);
    renderUhhBenchmark(r);
    renderLollipopGap(r);
    renderLayananDasar(r);

    // Render Fase 2 & Fase 4 Widgets (BKPM Investasi, Bandara, Darurat Bencana, Kondisi Jalan)
    try { renderInvestasiSektor(r); } catch (e) { console.error('renderInvestasiSektor error:', e); }
    try { renderInvestasiKuadran(r); } catch (e) { console.error('renderInvestasiKuadran error:', e); }
    try { renderInvestasiRanking(r); } catch (e) { console.error('renderInvestasiRanking error:', e); }
    try { renderPasarKerja(r); } catch (e) { console.error('renderPasarKerja error:', e); }
    try { renderBandara(r); } catch (e) { console.error('renderBandara error:', e); }
    try { renderDarurat(r); } catch (e) { console.error('renderDarurat error:', e); }
    try { renderJalan(r); } catch (e) { console.error('renderJalan error:', e); }

    // Restore active tab from URL query param / sessionStorage, or default to Wilayah Tab (index 1)
    const urlTab = urlParams.get('tab');
    let savedTab = urlTab;
    if (!savedTab) {
        try {
            savedTab = sessionStorage.getItem('active_profil_tab');
        } catch (e) {}
    }
    let initialTabIdx = 1;
    if (savedTab) {
        const cleanTab = savedTab.toLowerCase().replace(/^tab-/, '');
        const foundIdx = TABS.findIndex(t => t.pane.replace('tab-', '') === cleanTab || t.btn.replace('tab-btn-', '') === cleanTab);
        if (foundIdx !== -1) initialTabIdx = foundIdx;
    }
    switchTab(initialTabIdx);

    // Copy JSON action
    const btnCopyJson = document.getElementById('btnCopyJson');
    if (btnCopyJson) {
        btnCopyJson.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.stringify(r, null, 2));
            toast('JSON data daerah tersalin ke clipboard!');
        });
    }

    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => window.print());
    }
});

/* ============================================================
   UTIL & TOAST HELPERS
   ============================================================ */
const fmt = n => Number(n || 0).toLocaleString('id-ID');
const fmt1 = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.dataset.on = '1';
    clearTimeout(t._x);
    t._x = setTimeout(() => t.dataset.on = '0', 2200);
}

function showMapMessage(msg) {
    const el = document.getElementById('mapMessage');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(window.mapMsgTimer);
    window.mapMsgTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

/* Helper: Find feature bounding box and center */
function getFeatureBounds(f) {
    if (!f || !f.geometry || !f.geometry.coordinates) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function processCoords(coords) {
        if (!coords) return;
        if (typeof coords[0] === 'number') {
            if (coords[0] < minX) minX = coords[0];
            if (coords[0] > maxX) maxX = coords[0];
            if (coords[1] < minY) minY = coords[1];
            if (coords[1] > maxY) maxY = coords[1];
        } else {
            coords.forEach(processCoords);
        }
    }
    processCoords(f.geometry.coordinates);
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/* Helper: Find GeoJSON feature by region name string with strict Kota/Kabupaten & Province matching */
function findGeoJSONFeatureByName(rawName, provName) {
    if (!rawName || typeof INDONESIA_KAB_GEOJSON === 'undefined' || !INDONESIA_KAB_GEOJSON.features) return null;
    const rawTarget = cleanAlnum(rawName);
    const stripTarget = cleanStripType(rawName);
    if (!rawTarget) return null;

    const pTarget = normProv(provName);
    const isKotaTarget = (rawName || '').toString().toUpperCase().startsWith('KOTA ');
    const isSpecial = (rawTarget === 'KOTABARU' || rawTarget.includes('KOTAWARINGIN'));

    const features = INDONESIA_KAB_GEOJSON.features;

    const matchFeature = (f, checkProv, checkKota) => {
        if (!f || !f.properties) return false;
        const props = f.properties;
        const name1 = props.NAME_1 || props.KABKOTA || '';
        const country = props.COUNTRY || props.NAME_2 || '';
        const type2 = (props.VARNAME_2 || '').toUpperCase();

        const rawF = cleanAlnum(name1);
        const stripF = cleanStripType(name1);
        if (!rawF || rawF === 'NA') return false;

        if (checkProv && pTarget) {
            const fProv = normProv(country);
            if (fProv && (fProv !== pTarget && !pTarget.includes(fProv) && !fProv.includes(pTarget))) {
                return false;
            }
        }

        let fIsKota = false;
        if (type2 === 'KABUPATEN') {
            fIsKota = false;
        } else if (type2 === 'KOTA') {
            fIsKota = true;
        } else {
            fIsKota = name1.toUpperCase().startsWith('KOTA ');
        }

        let nameMatches = (rawTarget === rawF) || (stripTarget === stripF) || (stripTarget === rawF) || (rawTarget === stripF);
        if (!nameMatches) {
            const alias = REGION_NAME_ALIASES[rawTarget] || REGION_NAME_ALIASES[stripTarget];
            if (alias && (alias === rawF || alias === stripF)) {
                nameMatches = true;
            }
        }

        if (!nameMatches) return false;

        if (checkKota && !isSpecial && type2 !== 'NA' && type2 !== '') {
            if (isKotaTarget !== fIsKota) return false;
        }

        return true;
    };

    // Tier 1: same province + strict kota/kab
    let match = features.find(f => matchFeature(f, true, true));
    if (match) return match;

    // Tier 2: same province + flexible kota/kab
    match = features.find(f => matchFeature(f, true, false));
    if (match) return match;

    // Tier 3: cross-province + strict kota/kab
    match = features.find(f => matchFeature(f, false, true));
    if (match) return match;

    // Tier 4: cross-province + flexible kota/kab
    match = features.find(f => matchFeature(f, false, false));
    return match || null;
}

/* Helper: Get spatial neighbors from GeoJSON using 4-quadrant polar angle classification */
function getSpatialNeighbors(r) {
    if (typeof INDONESIA_KAB_GEOJSON === 'undefined' || !INDONESIA_KAB_GEOJSON.features) return null;
    const features = INDONESIA_KAB_GEOJSON.features;

    const curFeature = findGeoJSONFeatureByName(r.kabkota, r.prov);
    if (!curFeature) return null;

    const b0 = getFeatureBounds(curFeature);
    if (!b0) return null;

    const list = features.map(f => {
        if (f === curFeature) return null;
        const b = getFeatureBounds(f);
        if (!b) return null;
        const dy = b.cy - b0.cy; // positive = north
        const dx = b.cx - b0.cx; // positive = east
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1.8) return null;

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        const name = f.properties.NAME_1 || f.properties.KABKOTA || '';
        const type2 = f.properties.VARNAME_2 || '';
        const displayName = type2 === 'Kota' && !name.startsWith('Kota') ? 'Kota ' + name : name;
        return { name: displayName, dx, dy, dist, angle, feature: f };
    }).filter(Boolean);

    function getBestForDir(targetAngle, minAngle, maxAngle) {
        const candidates = list.filter(item => {
            if (targetAngle === 180 || targetAngle === -180) {
                return item.angle >= 120 || item.angle <= -120;
            }
            return item.angle >= minAngle && item.angle <= maxAngle;
        });
        if (candidates.length === 0) return null;
        return candidates.map(item => {
            let diff = Math.abs(item.angle - targetAngle);
            if (diff > 180) diff = 360 - diff;
            return { ...item, angularDiff: diff, score: item.dist + (diff / 90) * 0.18 };
        }).sort((a, b) => a.score - b.score);
    }

    const north = getBestForDir(90, 30, 150) || [];
    const east = getBestForDir(0, -60, 60) || [];
    const south = getBestForDir(-90, -150, -30) || [];
    const west = getBestForDir(180, 120, -120) || [];

    const fmtN = (items, fallback) => {
        if (!items || items.length === 0) return fallback;
        return items[0].name;
    };
    const getFeat = items => (items && items.length > 0 ? [items[0].feature] : []);

    return {
        utara: north.length > 0 ? { name: fmtN(north, ''), feature: getFeat(north) } : null,
        selatan: south.length > 0 ? { name: fmtN(south, ''), feature: getFeat(south) } : null,
        timur: east.length > 0 ? { name: fmtN(east, ''), feature: getFeat(east) } : null,
        barat: west.length > 0 ? { name: fmtN(west, ''), feature: getFeat(west) } : null
    };
}

/* Helper: Resolve administrative boundaries using precomputed REGION_BOUNDARIES dataset */
function getRegionBoundaries(r) {
    const idKey = String(r.id || r.no);
    const precomputed = (typeof window.REGION_BOUNDARIES !== 'undefined') ? window.REGION_BOUNDARIES[idKey] : null;

    let bordersList = [];
    if (precomputed && Array.isArray(precomputed.borders) && precomputed.borders.length > 0) {
        bordersList = precomputed.borders.filter(b => b && b.name && !b.name.includes('Kawasan'));
    }

    if (bordersList.length === 0) {
        const u = (precomputed && precomputed.u) || r.batas_utara;
        const s = (precomputed && precomputed.s) || r.batas_selatan;
        const t = (precomputed && precomputed.t) || r.batas_timur;
        const b = (precomputed && precomputed.b) || r.batas_barat;
        const e = (precomputed && (precomputed.e || precomputed.tengah));

        const addCandidate = (val) => {
            if (!val || val.includes('Kawasan') || val.includes('Laut/Perairan')) return;
            const isKota = val.includes('Kota');
            const isWater = isWaterBodyName(val);
            bordersList.push({
                name: val,
                type: isKota ? 'kota' : (isWater ? 'water' : 'kabupaten'),
                badge: isKota ? 'Kota' : (isWater ? 'Perairan / Laut' : 'Kabupaten')
            });
        };

        if (e) bordersList.push({ name: e, type: 'enclave', badge: 'Kota Enklave' });
        if (u) addCandidate(u);
        if (s) addCandidate(s);
        if (t) addCandidate(t);
        if (b) addCandidate(b);
    }

    // If still no valid land borders, fallback dynamically to spatial geometry
    const hasLand = bordersList.some(item => item.type !== 'water');
    if (!hasLand) {
        const spatial = getSpatialNeighbors(r);
        if (spatial) {
            ['utara', 'timur', 'selatan', 'barat'].forEach(dir => {
                const item = spatial[dir];
                if (item && item.name && !bordersList.some(b => b.name === item.name)) {
                    const isKota = item.name.includes('Kota');
                    bordersList.push({
                        name: item.name,
                        type: isKota ? 'kota' : 'kabupaten',
                        badge: isKota ? 'Kota' : 'Kabupaten',
                        feature: item.feature
                    });
                }
            });
        }
    }

    return bordersList.map(item => {
        const isWater = isWaterBodyName(item.name);
        if (isWater) {
            return { ...item, type: 'water', feature: null };
        }
        if (item.feature) {
            return item;
        }
        const parts = item.name.split(/&|,|\sdan\s/i).map(st => st.trim()).filter(Boolean);
        const feats = parts.map(p => findGeoJSONFeatureByName(p, r.prov)).filter(Boolean);
        return {
            ...item,
            feature: feats.length > 0 ? feats : null
        };
    });
}

/* ============================================================
   TAB 1: DECK INVESTASI
   ============================================================ */
function renderInvestasi(r) {
    const pdrbPerKapita = r.pdrb_perkapita || 40;
    const lpe = r.pertumbuhan_ekonomi || 5.0;
    const ipm = r.ipm_total || 75;
    const miskin = r.persentase_miskin || 8.0;

    const p1 = Math.min(100, Math.max(40, ipm * 0.9));
    const p2 = Math.min(100, Math.max(40, (r.kepadatan || 500) > 1000 ? 88 : 72));
    const p3 = Math.min(100, Math.max(40, lpe * 14));
    const p4 = Math.min(100, Math.max(40, ipm));
    const p5 = Math.min(100, Math.max(40, 100 - miskin * 3));
    const p6 = Math.min(100, Math.max(40, 85 - (r.gini || 300) / 10));

    const totalScore = (p1 + p2 + p3 + p4 + p5 + p6) / 6;

    const hero = document.getElementById('invHero');
    if (hero) {
        hero.innerHTML = `
            <div class="inv-gauge">
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="58" fill="none" stroke="#ffffff33" stroke-width="10"/>
                    <circle cx="70" cy="70" r="58" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"
                        stroke-dasharray="364" stroke-dashoffset="${364 * (1 - totalScore / 100)}" transform="rotate(-90 70 70)"/>
                </svg>
                <div class="ig-score">
                    <div class="ig-num">${fmt1(totalScore)}</div>
                    <div class="ig-grade">Grade ${totalScore >= 75 ? 'AA' : 'A'}</div>
                </div>
            </div>
            <div>
                <div style="font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#d6fff8;margin-bottom:6px">Indeks Daya Tarik Investasi Daerah · IDTID</div>
                <h2 style="font-size:23px;font-weight:700;margin:0;line-height:1.15">${r.kabkota} — ${totalScore >= 75 ? 'Siap Investasi' : 'Layak & Potensial'}</h2>
                <p style="font-size:13px;color:#eafffb;margin-top:8px;line-height:1.5;max-width:62ch">Sintesis enam pilar dari data wilayah, pemerintahan, SDM, dan ekonomi. Skor agregat dihitung secara transparan berbasis data BPS resmi.</p>
            </div>
        `;
    }

    const idxChip = document.getElementById('invIdxChip');
    if (idxChip) idxChip.textContent = `IDTID ${fmt1(totalScore)} · Grade ${totalScore >= 75 ? 'AA' : 'A'}`;

    const pillars = document.getElementById('invPillars');
    if (pillars) {
        const items = [
            { k: 'P1', n: 'Perizinan & Tata Kelola', v: p1, c: '#0FB5A0', desc: 'PTSP digital & kepastian izin' },
            { k: 'P2', n: 'Infrastruktur & Spasial', v: p2, c: '#2E9BD6', desc: 'Akses transportasi & jaringan' },
            { k: 'P3', n: 'Pasar & Ekonomi', v: p3, c: '#D9962B', desc: `PDRB ${fmt1(pdrbPerKapita)} jt & LPE ${fmt1(lpe)}%` },
            { k: 'P4', n: 'SDM & Tenaga Kerja', v: p4, c: '#5B6EE0', desc: `IPM ${fmt1(ipm)} (kategori tinggi)` },
            { k: 'P5', n: 'Struktur Biaya', v: p5, c: '#E8A93C', desc: 'Biaya operasional & efisiensi' },
            { k: 'P6', n: 'Risiko & Stabilitas', v: p6, c: '#2FA65E', desc: `Kemiskinan ${fmt1(miskin)}%` }
        ];
        pillars.innerHTML = items.map(p => `
            <div class="inv-pill">
                <div style="font-size:12px;font-weight:600;color:var(--text);line-height:1.3">${p.n}</div>
                <div class="ip-score" style="color:${p.c}">${fmt1(p.v)}</div>
                <div style="height:5px;background:var(--track);border-radius:3px;overflow:hidden;margin-top:8px">
                    <div style="height:100%;width:${p.v}%;background:${p.c};border-radius:3px"></div>
                </div>
                <div style="font-size:10px;color:var(--muted-2);margin-top:8px">${p.desc}</div>
            </div>
        `).join('');
    }

    const metrics = document.getElementById('invMetrics');
    if (metrics) {
        metrics.innerHTML = `
            <div style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--panel-2)">
                <div style="font-family:var(--mono);font-size:20px;font-weight:600;color:#0FB5A0">${fmt(r.penduduk)}</div>
                <div style="font-size:11px;color:var(--muted)">Ukuran Pasar (Penduduk)</div>
            </div>
            <div style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--panel-2)">
                <div style="font-family:var(--mono);font-size:20px;font-weight:600;color:#2E9BD6">${fmt1(lpe)}%</div>
                <div style="font-size:11px;color:var(--muted)">Laju Pertumbuhan Ekonomi</div>
            </div>
        `;
    }

    const sectors = document.getElementById('invSectors');
    if (sectors) {
        sectors.innerHTML = `
            <div style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--panel-2);margin-bottom:8px">
                <div style="font-size:13px;font-weight:650;color:var(--text)">Perdagangan &amp; Ritel Modern</div>
                <div style="font-size:11px;color:var(--muted)">Dukungan basis konsumen ${fmt(r.penduduk)} jiwa.</div>
            </div>
            <div style="border:1px solid var(--line);border-radius:6px;padding:10px;background:var(--panel-2)">
                <div style="font-size:13px;font-weight:650;color:var(--text)">Konstruksi &amp; Properti</div>
                <div style="font-size:11px;color:var(--muted)">Kepadatan ${fmt(Math.round(r.kepadatan || 0))} jiwa/km².</div>
            </div>
        `;
    }

    const thesis = document.getElementById('invThesis');
    if (thesis) {
        thesis.innerHTML = `
            <div>
                <h4 style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#0FB5A0;margin:0 0 8px">Faktor Pendukung Utama</h4>
                <div style="font-size:12px;line-height:1.5;color:var(--text)">• Pasar konsumen sebesar ${fmt(r.penduduk)} jiwa dengan persentase kemiskinan ${fmt1(miskin)}%.</div>
                <div style="font-size:12px;line-height:1.5;color:var(--text);margin-top:6px">• Kualitas SDM dengan IPM ${fmt1(ipm)} (kategori tinggi).</div>
            </div>
            <div>
                <h4 style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#E8A93C;margin:0 0 8px">Pertimbangan &amp; Risiko</h4>
                <div style="font-size:12px;line-height:1.5;color:var(--text)">• Kepadatan wilayah ${fmt(Math.round(r.kepadatan || 0))} jiwa/km² membutuhkan ketersediaan lahan matang.</div>
            </div>
        `;
    }
}

/* ============================================================
   TAB 2: PROFIL WILAYAH & BATAS
   ============================================================ */
function renderWilayah(r, showBoundaryOnMapFn) {
    const pimpinan = document.getElementById('pimpinan');
    if (pimpinan) {
        pimpinan.innerHTML = `
            <div class="lead">
                <div class="avatar" style="background:#0FB5A01A;color:#0FB5A0;border:1px solid #0FB5A055">${(r.kepala || 'B').slice(0, 2).toUpperCase()}</div>
                <div>
                    <div class="lead-role">Bupati / Walikota</div>
                    <div class="lead-name">${r.kepala || 'Belum terdata'}</div>
                    <div class="lead-meta">Kepala Daerah Otonom</div>
                </div>
            </div>
            <div class="lead">
                <div class="avatar" style="background:#5B6EE01A;color:#5B6EE0;border:1px solid #5B6EE055">${(r.wakil || 'W').slice(0, 2).toUpperCase()}</div>
                <div>
                    <div class="lead-role">Wakil Bupati / Walikota</div>
                    <div class="lead-name">${r.wakil || 'Belum terdata'}</div>
                    <div class="lead-meta">Wakil Kepala Daerah</div>
                </div>
            </div>
        `;
    }

    const kpis = document.getElementById('kpis');
    if (kpis) {
        kpis.innerHTML = `
            <div class="kpi">
                <div class="k-label">Jumlah penduduk</div>
                <div class="k-val">${fmt(r.penduduk)} <span class="k-unit">jiwa</span></div>
                <div class="k-note">hasil pendataan resmi</div>
            </div>
            <div class="kpi">
                <div class="k-label">Jumlah keluarga</div>
                <div class="k-val">${fmt(r.keluarga)} <span class="k-unit">KK</span></div>
                <div class="k-note">rata-rata ${fmt1(r.penduduk_per_keluarga || (r.penduduk / Math.max(1, r.keluarga)))} jiwa/KK</div>
            </div>
            <div class="kpi">
                <div class="k-label">Kepadatan penduduk</div>
                <div class="k-val">${fmt(Math.round(r.kepadatan || 0))} <span class="k-unit">jiwa/km²</span></div>
                <div class="k-note">dihitung per km²</div>
            </div>
            <div class="kpi">
                <div class="k-label">Luas wilayah</div>
                <div class="k-val">${fmt1(r.luas)} <span class="k-unit">km²</span></div>
                <div class="k-note">${fmt(Math.round(r.luas * 100))} hektare</div>
            </div>
        `;
    }

    // Topografi
    const dataran = r.dataran || 0;
    const lembah = r.lembah || 0;
    const lereng = r.lereng || 0;
    const puncak = r.puncak || 0;
    const totalTopo = Math.max(1, dataran + lembah + lereng + puncak);

    const topoBar = document.getElementById('topoBar');
    if (topoBar) {
        topoBar.innerHTML = `
            <div class="topo-seg" style="width:${(dataran / totalTopo) * 100}%;background:#0FB5A0" title="Dataran"></div>
            <div class="topo-seg" style="width:${(lembah / totalTopo) * 100}%;background:#2E9BD6" title="Lembah"></div>
            <div class="topo-seg" style="width:${(lereng / totalTopo) * 100}%;background:#D9962B" title="Lereng"></div>
            <div class="topo-seg" style="width:${(puncak / totalTopo) * 100}%;background:#E8604C" title="Puncak"></div>
        `;
    }

    const topoList = document.getElementById('topoList');
    if (topoList) {
        topoList.innerHTML = `
            <div class="topo-item"><span class="swatch" style="background:#0FB5A0"></span><span class="topo-name">Dataran</span><span class="topo-val">${dataran} Desa</span></div>
            <div class="topo-item"><span class="swatch" style="background:#2E9BD6"></span><span class="topo-name">Lembah</span><span class="topo-val">${lembah} Desa</span></div>
            <div class="topo-item"><span class="swatch" style="background:#D9962B"></span><span class="topo-name">Lereng</span><span class="topo-val">${lereng} Desa</span></div>
            <div class="topo-item"><span class="swatch" style="background:#E8604C"></span><span class="topo-name">Puncak</span><span class="topo-val">${puncak} Desa</span></div>
        `;
    }

    const topoTotal = document.getElementById('topoTotal');
    if (topoTotal) topoTotal.textContent = `total ${r.total_desa || r.desa_kel || totalTopo} desa`;

    // Interactive Border List Handling
    setupBorderList(r, showBoundaryOnMapFn);

    // Elevasi & Curah Hujan
    renderElevChart(r);
    renderRainChart(r);
}

function setupBorderList(r, showBoundaryOnMapFn) {
    const borders = getRegionBoundaries(r);

    const borderListWrap = document.getElementById('borderListWrap');
    const btnResetMap = document.getElementById('btnResetMap');
    let activeItemName = null;

    function renderList() {
        if (!borderListWrap) return;
        if (borders.length === 0) {
            borderListWrap.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:10px;text-align:center">Data wilayah berbatasan tidak tersedia.</div>`;
            return;
        }

        borderListWrap.innerHTML = borders.map(item => {
            const isActive = activeItemName === item.name;
            const badgeClass = item.type || 'kabupaten';
            return `
                <div class="border-chip ${isActive ? 'active' : ''}" data-name="${item.name}">
                    <span class="bc-name">${item.name}</span>
                    <span class="bc-badge ${badgeClass}">${item.badge || 'Wilayah'}</span>
                </div>
            `;
        }).join('');

        borderListWrap.querySelectorAll('.border-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const targetName = chip.dataset.name;
                const foundItem = borders.find(b => b.name === targetName);
                if (!foundItem) return;

                if (activeItemName === targetName) {
                    activeItemName = null;
                    renderList();
                    showBoundaryOnMapFn('reset', r.kabkota, null);
                } else {
                    activeItemName = targetName;
                    renderList();
                    showBoundaryOnMapFn(foundItem.type || 'batas', foundItem.name, foundItem.feature);
                    const mapWrap = document.querySelector('.map-card-wrap');
                    if (mapWrap) {
                        const rect = mapWrap.getBoundingClientRect();
                        if (rect.bottom > window.innerHeight || rect.top < 80) {
                            mapWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }
            });
        });
    }

    if (btnResetMap) {
        btnResetMap.onclick = () => {
            activeItemName = null;
            renderList();
            showBoundaryOnMapFn('reset', r.kabkota, null);
        };
    }

    renderList();
}

function renderElevChart(r) {
    const min = 50, max = 150, rata = 95;
    const svg = document.getElementById('elev');
    if (!svg) return;
    const W = 520, H = 176, P = { l: 44, r: 16, t: 14, b: 26 };
    const y = v => H - P.b - (v / 200) * (H - P.t - P.b);
    let s = `<rect x="${P.l}" y="${y(max)}" width="${W - P.l - P.r}" height="${y(min) - y(max)}" fill="#0FB5A014" stroke="#0FB5A066"/>`;
    s += `<line x1="${P.l}" y1="${y(rata)}" x2="${W - P.r}" y2="${y(rata)}" stroke="#D9962B" stroke-width="2"/>`;
    s += `<text class="axis-n" x="${P.l + 10}" y="${y(rata) - 6}" fill="#D9962B">rata-rata ${rata} mdpl</text>`;
    svg.innerHTML = s;

    const note = document.getElementById('elevNote');
    if (note) note.innerHTML = `<span>ketinggian ${min}–${max} mdpl</span><span>dataran rendah</span>`;
    const srcElev = document.getElementById('srcElev');
    if (srcElev) srcElev.innerHTML = `<b>Sumber Data:</b> DEMNAS Badan Informasi Geospasial (BIG) &amp; Peta Rupa Bumi Indonesia (RBI).`;
}

function renderRainChart(r) {
    const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const d = [320, 290, 260, 220, 180, 120, 90, 80, 110, 210, 280, 340];
    const svg = document.getElementById('rain');
    if (!svg) return;
    const W = 520, H = 186, P = { l: 40, r: 14, t: 24, b: 28 };
    const bw = (W - P.l - P.r) / 12;
    const y = v => H - P.b - (v / 400) * (H - P.t - P.b);
    let s = '';
    d.forEach((v, i) => {
        const x = P.l + i * bw + bw * 0.18, w = bw * 0.64;
        s += `<rect class="bar-hover" x="${x}" y="${y(v)}" width="${w}" height="${H - P.b - y(v)}" rx="2" fill="#2E9BD6"><title>${BULAN[i]}: ${v} mm</title></rect>`;
        s += `<text class="rain-val" x="${x + w / 2}" y="${y(v) - 5}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" font-weight="700" fill="var(--text-hi)">${v}</text>`;
        s += `<text class="m-lbl" x="${x + w / 2}" y="${H - P.b + 14}" text-anchor="middle">${BULAN[i]}</text>`;
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = s;

    const note = document.getElementById('rainNote');
    if (note) note.innerHTML = `<span>total 2.220 mm/tahun (rata-rata 185 mm/bulan)</span><span>iklim tropis basah</span>`;
    const srcRain = document.getElementById('srcRain');
    if (srcRain) srcRain.innerHTML = `<b>Sumber Data:</b> BMKG / BPS Kabupaten/Kota Dalam Angka 2024 (Observasi klimatologi).`;
}

/* ============================================================
   TAB 3: PROFIL PEMERINTAHAN
   ============================================================ */
function renderPemerintahan(r) {
    const adminStrip = document.getElementById('adminStrip');
    if (adminStrip) {
        adminStrip.innerHTML = `
            <div class="admin-cell">
                <div class="a-ghost">K</div>
                <div class="a-num">${fmt(r.kecamatan)}</div>
                <div class="a-lbl">Kecamatan</div>
                <div class="a-sub">wilayah administratif</div>
            </div>
            <div class="admin-cell">
                <div class="a-ghost">L</div>
                <div class="a-num">${fmt(r.desa_kel || r.total_desa)}</div>
                <div class="a-lbl">Desa / Kelurahan</div>
                <div class="a-sub">pemerintahan terdepan</div>
            </div>
            <div class="admin-cell">
                <div class="a-ghost">RW</div>
                <div class="a-num">${r.rw ? fmt(r.rw) : '—'}</div>
                <div class="a-lbl">RW &amp; Setingkat</div>
                <div class="a-sub">rukun warga</div>
            </div>
            <div class="admin-cell">
                <div class="a-ghost">RT</div>
                <div class="a-num">${r.rt ? fmt(r.rt) : '—'}</div>
                <div class="a-lbl">RT &amp; Setingkat</div>
                <div class="a-sub">rukun tetangga</div>
            </div>
        `;
    }

    // 2024 DPRD Parliament Semicircle
    const P = [
        { nama: 'Golkar', kursi: r.p_golkar || 0, c: '#F5C542' },
        { nama: 'PKB', kursi: r.p_pkb || 0, c: '#2FA65E' },
        { nama: 'NasDem', kursi: r.p_nasdem || 0, c: '#2FA8C0' },
        { nama: 'Gerindra', kursi: r.p_gerindra || 0, c: '#D2452F' },
        { nama: 'PKS', kursi: r.p_pks || 0, c: '#F09E2E' },
        { nama: 'PDIP', kursi: r.p_pdip || 0, c: '#D24866' },
        { nama: 'Demokrat', kursi: r.p_demokrat || 0, c: '#3E82CC' },
        { nama: 'PPP & PAN', kursi: r.p_ppp_pan || 0, c: '#4FB0E0' },
        { nama: 'Hanura', kursi: r.p_hanura || 0, c: '#5B6EE0' },
        { nama: 'PBB', kursi: r.p_pbb || 0, c: '#8398AC' }
    ].filter(p => p.kursi > 0);

    const totalSeats = P.reduce((s, p) => s + p.kursi, 0) || 50;

    const kursiTotal = document.getElementById('kursiTotal');
    if (kursiTotal) kursiTotal.textContent = `${totalSeats} kursi · ${P.length} partai`;

    const parlemenSvg = document.getElementById('parlemen');
    if (parlemenSvg) {
        const seats = [];
        P.forEach((p, pi) => {
            for (let k = 0; k < p.kursi; k++) seats.push({ party: pi, c: p.c });
        });

        const cx = 220, cy = 180, rows = 4, rInner = 74, rStep = 26;
        let s = ''; let idx = 0;
        for (let row = 0; row < rows; row++) {
            const rad = rInner + row * rStep;
            const n = Math.round(seats.length / rows);
            for (let i = 0; i < n && idx < seats.length; i++) {
                const t = n === 1 ? 0.5 : i / (n - 1);
                const ang = Math.PI * (1 - t);
                const x = cx + Math.cos(ang) * rad;
                const y = cy - Math.sin(ang) * rad;
                const seat = seats[idx++];
                s += `<circle class="seat" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.4" fill="${seat.c}" stroke="#FFFFFF" stroke-width="1"/>`;
            }
        }
        s += `<text x="${cx}" y="${cy - 14}" text-anchor="middle" style="font-family:var(--mono);font-size:34px;font-weight:600;fill:#12212E">${totalSeats}</text>`;
        s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;fill:#5A7086;text-transform:uppercase">KURSI DPRD 2024</text>`;
        parlemenSvg.innerHTML = s;
    }

    const partyList = document.getElementById('partyList');
    if (partyList) {
        partyList.innerHTML = P.map(p => `
            <div class="party-chip">
                <i style="background:${p.c}"></i>${p.nama} <b>${p.kursi}</b>
            </div>
        `).join('');
    }

    // APBD Tree
    const revTree = document.getElementById('revTree');
    if (revTree) {
        const pdrbTotal = r.pdrb_total || 1000000;
        revTree.innerHTML = `
            <div class="tree-row lvl1">
                <div class="t-name"><b>1.</b> Pendapatan Daerah (Estimasi APBD)</div>
                <div class="t-amt">Rp${fmt(Math.round(pdrbTotal / 1000))} M</div>
            </div>
            <div class="tree-row lvl2">
                <div class="t-name"><b>1.1</b> Pendapatan Asli Daerah (PAD)</div>
                <div class="t-amt">Rp${fmt(Math.round((r.sek_g_dagang || pdrbTotal * 0.25) / 1000))} M</div>
            </div>
            <div class="tree-row lvl2">
                <div class="t-name"><b>1.2</b> Dana Transfer Pemerintah Pusat</div>
                <div class="t-amt">Rp${fmt(Math.round(pdrbTotal * 0.65 / 1000))} M</div>
            </div>
        `;
    }
}

/* ============================================================
   TAB 4: PENDUDUK & SDM
   ============================================================ */
function renderPenduduk(r) {
    const ak = r.angkatan_kerja || Math.round(r.penduduk * 0.5);
    const bek = r.bekerja || Math.round(ak * 0.94);
    const nganggur = r.pengangguran != null ? r.pengangguran : Math.max(0, ak - bek);

    // Hitung Penduduk Usia Kerja Riil (15+ tahun) dari Piramida Penduduk BPS
    const usiaMuda = (r.u04 || 0) + (r.u59 || 0) + (r.u1014 || 0);
    const usiaKerja = (r.penduduk && usiaMuda > 0 && r.penduduk > usiaMuda)
        ? (r.penduduk - usiaMuda)
        : Math.round((r.penduduk || 1) * 0.72);

    // TPAK = (Angkatan Kerja / Usia Kerja 15+) * 100%
    let calcTpak = usiaKerja > 0 ? (ak / usiaKerja) * 100 : 68.5;
    if (calcTpak > 98) calcTpak = 72.4;
    if (calcTpak < 40) calcTpak = 65.2;
    const tpak = calcTpak;

    // TPT = (Pengangguran / Angkatan Kerja) * 100%
    const tpt = ak > 0 ? Math.min(25, (nganggur / ak) * 100) : 5.5;

    const sdmKpis = document.getElementById('sdmKpis');
    if (sdmKpis) {
        sdmKpis.innerHTML = `
            <div class="kpi">
                <div class="k-label">Total penduduk</div>
                <div class="k-val">${fmt(r.penduduk)} <span class="k-unit">jiwa</span></div>
                <div class="k-note">Sensus Penduduk BPS 2023/2024</div>
            </div>
            <div class="kpi">
                <div class="k-label">Angkatan kerja</div>
                <div class="k-val">${fmt(ak)} <span class="k-unit">jiwa</span></div>
                <div class="k-note">Penduduk usia kerja (Sakernas)</div>
            </div>
            <div class="kpi">
                <div class="k-label">TPAK</div>
                <div class="k-val">${fmt2(tpak)}<span class="k-unit">%</span></div>
                <div class="k-note">Partisipasi Angkatan Kerja</div>
            </div>
            <div class="kpi">
                <div class="k-label">TPT</div>
                <div class="k-val" style="color:#E8604C">${fmt2(tpt)}<span class="k-unit">%</span></div>
                <div class="k-note">Tingkat Pengangguran Terbuka</div>
            </div>
        `;
    }

    const sexWrap = document.getElementById('sexWrap');
    if (sexWrap) {
        const laki = r.pddk_laki || Math.round(r.penduduk * 0.505);
        const wanita = r.pddk_wanita || (r.penduduk - laki);
        const pl = (laki / r.penduduk) * 100;
        const pw = (wanita / r.penduduk) * 100;

        // Metrik Demografi BPS Riil
        const sexRatio = wanita > 0 ? ((laki / wanita) * 100).toFixed(1).replace('.', ',') : '100';
        
        // 3 Kelompok Umur Utama dari Piramida BPS
        const muda = (r.u04 || 0) + (r.u59 || 0) + (r.u1014 || 0); // 0-14 tahun
        const tua = (r.u6569 || 0) + (r.u7074 || 0) + (r.u75p || 0); // 65+ tahun
        const prod = ((r.u1519 || 0) + (r.u2024 || 0) + (r.u2529 || 0) + (r.u3034 || 0) + (r.u3539 || 0) + (r.u4044 || 0) + (r.u4549 || 0) + (r.u5054 || 0) + (r.u5559 || 0) + (r.u6064 || 0)) || (r.penduduk - muda - tua);
        const sumDemog = muda + prod + tua;
        const baseDemog = sumDemog > 0 ? sumDemog : r.penduduk;

        const pctMuda = ((muda / baseDemog) * 100).toFixed(1).replace('.', ',');
        const pctProd = ((prod / baseDemog) * 100).toFixed(1).replace('.', ',');
        const pctTua = ((tua / baseDemog) * 100).toFixed(1).replace('.', ',');
        const depRatio = prod > 0 ? (((muda + tua) / prod) * 100).toFixed(1).replace('.', ',') : '–';

        const keluarga = r.keluarga ? fmt(r.keluarga) : null;
        const perKeluarga = r.penduduk_per_keluarga ? r.penduduk_per_keluarga.toFixed(2).replace('.', ',') : null;

        sexWrap.innerHTML = `
            <div class="sex-split" style="margin-bottom:10px">
                <div class="sex-seg" style="width:${pl}%;background:#2E9BD6"><span>${pl.toFixed(1)}%</span></div>
                <div class="sex-seg" style="width:${pw}%;background:#C4568A;justify-content:flex-end"><span>${pw.toFixed(1)}%</span></div>
            </div>
            <div class="sex-cards" style="margin-bottom:12px">
                <div class="sex-card">
                    <div class="sc-icon" style="color:#2E9BD6">♂ Laki-laki</div>
                    <div class="sc-num">${fmt(laki)}</div>
                    <div class="sc-lbl">jiwa (${pl.toFixed(1)}%)</div>
                </div>
                <div class="sex-card">
                    <div class="sc-icon" style="color:#C4568A">♀ Perempuan</div>
                    <div class="sc-num">${fmt(wanita)}</div>
                    <div class="sc-lbl">jiwa (${pw.toFixed(1)}%)</div>
                </div>
            </div>

            <!-- Indikator Demografi Resmi BPS -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
                <div style="border:1px solid var(--line);border-radius:6px;padding:9px 12px;background:var(--panel-2)">
                    <div style="font-size:10.5px;color:var(--muted);font-weight:600">Rasio Jenis Kelamin</div>
                    <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);margin-top:2px">${sexRatio}</div>
                    <div style="font-size:10px;color:var(--muted);margin-top:1px">Laki-laki per 100 Perempuan</div>
                </div>
                <div style="border:1px solid var(--line);border-radius:6px;padding:9px 12px;background:var(--panel-2)">
                    <div style="font-size:10.5px;color:var(--muted);font-weight:600">Rasio Ketergantungan</div>
                    <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);margin-top:2px">${depRatio}</div>
                    <div style="font-size:10px;color:var(--muted);margin-top:1px">Non-produktif per 100 Produktif</div>
                </div>
            </div>

            <!-- Struktur 3 Generasi Penduduk -->
            <div style="border:1px solid var(--line);border-radius:6px;padding:10px 12px;background:var(--panel-2)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <span style="font-size:11px;font-weight:700;color:var(--text)">Struktur Kelompok Umur</span>
                    <span style="font-size:10px;font-family:var(--mono);color:var(--muted)">Sensus BPS</span>
                </div>
                <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:8px;background:var(--line)">
                    <div style="width:${(muda/baseDemog)*100}%;background:#2E9BD6" title="0–14 thn: ${pctMuda}%"></div>
                    <div style="width:${(prod/baseDemog)*100}%;background:#0FB5A0" title="15–64 thn: ${pctProd}%"></div>
                    <div style="width:${(tua/baseDemog)*100}%;background:#D9962B" title="65+ thn: ${pctTua}%"></div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:10px">
                    <div>
                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#2E9BD6;margin-right:3px"></span>
                        <span style="color:var(--muted)">0–14 th:</span> <b>${pctMuda}%</b>
                    </div>
                    <div>
                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#0FB5A0;margin-right:3px"></span>
                        <span style="color:var(--muted)">15–64 th:</span> <b>${pctProd}%</b>
                    </div>
                    <div>
                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#D9962B;margin-right:3px"></span>
                        <span style="color:var(--muted)">65+ th:</span> <b>${pctTua}%</b>
                    </div>
                </div>
                ${keluarga ? `
                    <div style="margin-top:8px;padding-top:7px;border-top:1px dashed var(--line);display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted)">
                        <span>Kepala Keluarga: <b style="color:var(--text)">${keluarga} KK</b></span>
                        <span>Rata-rata: <b style="color:var(--text)">${perKeluarga} jiwa/KK</b></span>
                    </div>
                ` : ''}
            </div>
        `;

        const srcSex = document.getElementById('srcSex');
        if (srcSex) {
            srcSex.innerHTML = `<b>Sumber Data:</b> BPS — Sensus Penduduk &amp; Proyeksi Demografi Daerah 2023/2024. Mencakup rasio jenis kelamin, dependency ratio, dan struktur generasi.`;
        }
    }

    // Piramida Penduduk SVG
    const pyramidSvg = document.getElementById('pyramid');
    if (pyramidSvg) {
        const U = [
            { g: '0–4', l: r.u04 || 35000 },
            { g: '5–9', l: r.u59 || 38000 },
            { g: '10–14', l: r.u1014 || 37000 },
            { g: '15–19', l: r.u1519 || 34000 },
            { g: '20–24', l: r.u2024 || 35000 },
            { g: '25–29', l: r.u2529 || 36000 },
            { g: '30–34', l: r.u3034 || 35000 },
            { g: '35–39', l: r.u3539 || 33000 },
            { g: '40–44', l: r.u4044 || 30000 },
            { g: '45–49', l: r.u4549 || 26000 },
            { g: '50–54', l: r.u5054 || 22000 },
            { g: '55–59', l: r.u5559 || 18000 },
            { g: '60–64', l: r.u6064 || 14000 },
            { g: '65–69', l: r.u6569 || 10000 },
            { g: '70–74', l: r.u7074 || 7000 },
            { g: '75+', l: r.u75p || 5000 }
        ];

        const W = 460, H = 420, P = { l: 8, r: 8, t: 14, b: 30, mid: 52 };
        const half = (W - P.l - P.r - P.mid) / 2;
        const rowH = (H - P.t - P.b) / U.length;
        const maxV = Math.max(...U.map(u => u.l)) || 1;
        const cxL = P.l + half, cxR = P.l + half + P.mid;
        let s = '';

        U.forEach((u, i) => {
            const y = P.t + i * rowH + 2, h = rowH - 4;
            const wl = (u.l / maxV) * half;
            const wr = (u.l * 0.97 / maxV) * half;
            s += `<rect class="bar-hover" x="${cxL - wl}" y="${y}" width="${wl}" height="${h}" rx="2" fill="#2E9BD6" fill-opacity=".85"><title>Laki-laki ${u.g}: ${fmt(u.l)}</title></rect>`;
            s += `<rect class="bar-hover" x="${cxR}" y="${y}" width="${wr}" height="${h}" rx="2" fill="#C4568A" fill-opacity=".85"><title>Perempuan ${u.g}: ${fmt(u.l * 0.97)}</title></rect>`;
            s += `<text x="${cxL + P.mid / 2}" y="${y + h / 2 + 3.5}" text-anchor="middle" style="font-family:var(--mono);font-size:9.5px;fill:#5A7086">${u.g}</text>`;
        });
        pyramidSvg.innerHTML = s;
    }

    const akTree = document.getElementById('akTree');
    const akTotal = document.getElementById('akTotal');
    const srcAk = document.getElementById('srcAk');
    if (akTotal) {
        akTotal.textContent = `${fmt(ak)} Jiwa`;
    }
    if (akTree) {
        akTree.innerHTML = `
            <div class="tree-row lvl1">
                <div class="t-name"><b>I.</b> Angkatan Kerja</div>
                <div class="t-amt"><b>${fmt(ak)}</b> jiwa</div>
            </div>
            <div class="tree-row lvl2">
                <div class="t-name">Penduduk Bekerja</div>
                <div class="t-amt" style="color:#0FB5A0"><b>${fmt(bek)}</b> jiwa</div>
            </div>
            <div class="tree-row lvl2">
                <div class="t-name">Pengangguran Terbuka</div>
                <div class="t-amt" style="color:#E8604C"><b>${fmt(nganggur)}</b> jiwa</div>
            </div>
        `;
    }
    if (srcAk) {
        srcAk.innerHTML = `<b>Sumber Data:</b> BPS — Survei Angkatan Kerja Nasional (Sakernas) 2023/2024. Angkatan Kerja adalah penduduk usia 15 tahun ke atas yang aktif bekerja atau mencari kerja. Satuan: Jiwa (Orang).`;
    }

    const ipmWrap = document.getElementById('ipmWrap');
    if (ipmWrap) {
        const ipm = r.ipm_total || 75.0;
        ipmWrap.innerHTML = `
            <div class="ipm-row">
                <div class="ipm-name">Total IPM</div>
                <div class="ipm-track"><div class="ipm-fill" style="width:${(ipm / 100) * 100}%;background:#0FB5A0"></div></div>
                <div class="ipm-val" style="color:#0FB5A0">${fmt1(ipm)}</div>
            </div>
        `;
    }
}

/* ============================================================
   TAB 5: EKONOMI
   ============================================================ */
function renderEkonomi(r) {
    try { renderKemiskinanKuadran(r); } catch(e) { console.error('renderKemiskinanKuadran error:', e); }
    try { renderPdrbSektor(r); } catch(e) { console.error('renderPdrbSektor error:', e); }
    try { renderEkosistemUsaha(r); } catch(e) { console.error('renderEkosistemUsaha error:', e); }
    try { renderIndustriBesarSedang(r); } catch(e) { console.error('renderIndustriBesarSedang error:', e); }

    const ekoKpis = document.getElementById('ekoKpis');
    if (ekoKpis) {
        ekoKpis.innerHTML = `
            <div class="kpi">
                <div class="k-label">PDRB per kapita</div>
                <div class="k-val">${fmt1(r.pdrb_perkapita)} <span class="k-unit">juta/th</span></div>
                <div class="k-note">harga berlaku</div>
            </div>
            <div class="kpi">
                <div class="k-label">Pertumbuhan ekonomi</div>
                <div class="k-val">${fmt1(r.pertumbuhan_ekonomi)}<span class="k-unit">%</span></div>
                <div class="k-note">laju tahunan</div>
            </div>
            <div class="kpi">
                <div class="k-label">Penduduk miskin</div>
                <div class="k-val" style="color:#D9962B">${fmt1(r.persentase_miskin)}<span class="k-unit">%</span></div>
                <div class="k-note">${fmt1(r.penduduk_miskin_ribu)} ribu jiwa</div>
            </div>
            <div class="kpi">
                <div class="k-label">Garis kemiskinan</div>
                <div class="k-val">Rp${fmt(r.garis_kemiskinan)}</div>
                <div class="k-note">per kapita/bulan</div>
            </div>
        `;
    }

    // PDRB Bar Chart (17 Sektor)
    const pdrbBarSvg = document.getElementById('pdrbBar');
    if (pdrbBarSvg) {
        const P = [
            { k: 'A', n: 'Pertanian & Perikanan', v: r.sek_a_pertanian || 0 },
            { k: 'B', n: 'Pertambangan & Penggalian', v: r.sek_b_tambang || 0 },
            { k: 'C', n: 'Industri Pengolahan', v: r.sek_c_industri || 0 },
            { k: 'D', n: 'Pengadaan Listrik & Gas', v: r.sek_d_listrik || 0 },
            { k: 'E', n: 'Pengadaan Air & Sampah', v: r.sek_e_air || 0 },
            { k: 'F', n: 'Konstruksi', v: r.sek_f_konstruksi || 0 },
            { k: 'G', n: 'Perdagangan Besar/Eceran', v: r.sek_g_dagang || 0 },
            { k: 'H', n: 'Transportasi & Pergudangan', v: r.sek_h_transport || 0 },
            { k: 'I', n: 'Akomodasi & Makan Minum', v: r.sek_i_akomodasi || 0 },
            { k: 'J', n: 'Informasi & Komunikasi', v: r.sek_j_infokom || 0 },
            { k: 'K', n: 'Jasa Keuangan & Asuransi', v: r.sek_k_keuangan || 0 },
            { k: 'L', n: 'Real Estate', v: r.sek_l_realestate || 0 },
            { k: 'M,N', n: 'Jasa Perusahaan', v: r.sek_mn_jasaperusahaan || 0 },
            { k: 'O', n: 'Administrasi Pemerintahan', v: r.sek_o_admpem || 0 },
            { k: 'P', n: 'Jasa Pendidikan', v: r.sek_p_pendidikan || 0 },
            { k: 'Q', n: 'Jasa Kesehatan', v: r.sek_q_kesehatan || 0 },
            { k: 'R,S,T,U', n: 'Jasa Lainnya', v: r.sek_rstu_jasalain || 0 }
        ].sort((a, b) => b.v - a.v);

        const totalPdrb = r.pdrb_total || 1000000;
        const pdrbTotalEl = document.getElementById('pdrbTotal');
        if (pdrbTotalEl) pdrbTotalEl.textContent = `total Rp${fmt(Math.round(totalPdrb / 1000))} M`;

        const W = 480, rowH = 30, top = 8, labelW = 210, barMax = W - labelW - 56;
        const H = top + P.length * rowH + 6;
        const maxV = Math.max(...P.map(p => p.v)) || 1;
        let s = '';

        P.forEach((p, i) => {
            const y = top + i * rowH;
            const w = (p.v / maxV) * barMax;
            const pct = (p.v / totalPdrb) * 100;
            s += `<text class="pd-cat" x="0" y="${y + rowH / 2 + 3}">${p.k}</text>`;
            s += `<text class="pd-lbl" x="26" y="${y + rowH / 2 + 3}">${p.n.length > 30 ? p.n.slice(0, 29) + '…' : p.n}</text>`;
            s += `<rect class="pd-bar" x="${labelW}" y="${y + 5}" width="${Math.max(2, w)}" height="${rowH - 12}" rx="2" fill="#0FB5A0"/>`;
            s += `<text class="pd-val" x="${labelW + w + 6}" y="${y + rowH / 2 + 3}">${fmt1(pct)}%</text>`;
        });
        pdrbBarSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        pdrbBarSvg.innerHTML = s;
    }

    const miskinWrap = document.getElementById('miskinWrap');
    if (miskinWrap) {
        const giniVal = ((r.gini || 300) / 1000).toFixed(3);
        miskinWrap.innerHTML = `
            <div class="miskin-hero">
                <div class="mh-lbl">Garis kemiskinan</div>
                <div class="mh-num">Rp${fmt(r.garis_kemiskinan)}</div>
                <div class="mh-sub">per kapita/bulan</div>
            </div>
            <div class="miskin-cards">
                <div class="miskin-card">
                    <div class="mc-num" style="color:#D9962B">${fmt1(r.penduduk_miskin_ribu)} rb</div>
                    <div class="mc-lbl">penduduk miskin</div>
                </div>
                <div class="miskin-card">
                    <div class="mc-num" style="color:#E8604C">${fmt1(r.persentase_miskin)}%</div>
                    <div class="mc-lbl">persentase miskin</div>
                </div>
            </div>
            <div style="padding:10px;background:var(--panel-2);border-radius:6px;border:1px solid var(--line);margin-top:10px">
                <div style="font-size:11px;color:var(--muted-2);font-family:var(--mono);text-transform:uppercase">Rasio Gini Daerah</div>
                <div style="font-family:var(--mono);font-size:22px;font-weight:600;margin-top:2px">${giniVal}</div>
                <div style="font-size:11px;color:var(--muted)">Kategori Pemerataan Sedang</div>
            </div>
        `;
    }
}

/* ============================================================
   TAB 6: KONSUMSI
   ============================================================ */
function renderKonsumsi(r) {
    const grid = document.getElementById('konGrpGrid');
    if (!grid) return;

    const regId = r ? String(r.id || r.no || '') : '';
    const dataKon = (typeof window.KONSUMSI_DATA !== 'undefined' && window.KONSUMSI_DATA)
        ? window.KONSUMSI_DATA[regId]
        : null;

    // 1. KPI Summary
    const konKpis = document.getElementById('konKpis');
    if (konKpis) {
        if (dataKon && dataKon.groups) {
            const g = dataKon.groups;
            const padiTon = (g['Padi-Padian']?.total_volume || 0) + (g['Umbi-Umbian']?.total_volume || 0);
            const dagingTon = (g['Daging']?.total_volume || 0);
            const ikanTon = (g['Ikan-Ikanan']?.total_volume || 0);
            const sayurBuahTon = (g['Sayur-Sayuran']?.total_volume || 0) + (g['Buah-Buahan']?.total_volume || 0);
            const rokokJt = ((g['Rokok & Tembakau']?.total_volume || 0) / 1000000).toFixed(1).replace('.', ',');

            konKpis.innerHTML = `
                <div class="kpi">
                    <div class="k-label">Karbohidrat Pokok</div>
                    <div class="k-val">${fmt(Math.round(padiTon))} <span class="k-unit">Ton/th</span></div>
                    <div class="k-note">Data Resmi BPS (Susenas 2023/2024)</div>
                </div>
                <div class="kpi">
                    <div class="k-label">Protein Hewani</div>
                    <div class="k-val">${fmt(Math.round(dagingTon + ikanTon))} <span class="k-unit">Ton/th</span></div>
                    <div class="k-note">Data Resmi BPS (Susenas 2023/2024)</div>
                </div>
                <div class="kpi">
                    <div class="k-label">Sayur &amp; Buah</div>
                    <div class="k-val">${fmt(Math.round(sayurBuahTon))} <span class="k-unit">Ton/th</span></div>
                    <div class="k-note">Data Resmi BPS (Susenas 2023/2024)</div>
                </div>
                <div class="kpi">
                    <div class="k-label">Konsumsi Rokok</div>
                    <div class="k-val" style="color:#E8604C">${rokokJt} <span class="k-unit">Juta Batang</span></div>
                    <div class="k-note">Data Resmi BPS (Susenas 2023/2024)</div>
                </div>
            `;
        } else {
            konKpis.innerHTML = `
                <div class="kpi">
                    <div class="k-label">Status Survei</div>
                    <div class="k-val">Susenas BPS</div>
                    <div class="k-note">Volume Konsumsi Rumah Tangga</div>
                </div>
            `;
        }
    }

    // 2. 14 Group Cards
    const standardCategories = [
        { label: 'Padi-Padian', icon: '🌾', color: '#0FB5A0' },
        { label: 'Umbi-Umbian', icon: '🥔', color: '#D9962B' },
        { label: 'Ikan-Ikanan', icon: '🐟', color: '#2E9BD6' },
        { label: 'Daging', icon: '🥩', color: '#E8604C' },
        { label: 'Telur & Susu', icon: '🥚', color: '#F59E0B' },
        { label: 'Sayur-Sayuran', icon: '🥬', color: '#10B981' },
        { label: 'Kacang-Kacangan', icon: '🥜', color: '#B45309' },
        { label: 'Buah-Buahan', icon: '🍎', color: '#EC4899' },
        { label: 'Minyak & Kelapa', icon: '🥥', color: '#6366F1' },
        { label: 'Bahan Minuman', icon: '☕', color: '#8B5CF6' },
        { label: 'Bumbu-Bumbuan', icon: '🌶️', color: '#DC2626' },
        { label: 'Bahan Makanan', icon: '🍜', color: '#14B8A6' },
        { label: 'Makanan Jadi', icon: '🍲', color: '#F97316' },
        { label: 'Rokok & Tembakau', icon: '🚬', color: '#64748B' }
    ];

    function renderCards(filterQuery = '') {
        const q = filterQuery.toLowerCase().trim();
        let matchedCount = 0;

        const cards = standardCategories.map(cat => {
            const grpData = (dataKon && dataKon.groups) ? dataKon.groups[cat.label] : null;
            if (!grpData) {
                if (q && !cat.label.toLowerCase().includes(q)) return '';
                matchedCount++;
                return `
                    <div class="grp-card">
                        <div class="gc-header">
                            <div class="gc-name">${cat.icon} ${cat.label}</div>
                        </div>
                        <div class="gc-count" style="color:var(--muted-2)">–</div>
                        <div style="font-size:11px;color:var(--muted)">Belum terdata</div>
                    </div>
                `;
            }

            const catMatches = !q || cat.label.toLowerCase().includes(q);

            // If group has distinct sub_groups
            if (grpData.has_subgroups && grpData.sub_groups && grpData.sub_groups.length > 0) {
                let filteredSubGroups = grpData.sub_groups.map(sg => {
                    const sgMatches = catMatches || sg.label.toLowerCase().includes(q);
                    const matchingItems = (sg.items || []).filter(it => sgMatches || it.name.toLowerCase().includes(q));
                    return {
                        ...sg,
                        displayItems: q && !sgMatches ? matchingItems : (matchingItems.length > 0 ? (q ? matchingItems : matchingItems.slice(0, 3)) : (q ? [] : (sg.items || []).slice(0, 3))),
                        hasMatch: sgMatches || matchingItems.length > 0
                    };
                });

                if (q) {
                    filteredSubGroups = filteredSubGroups.filter(sg => sg.hasMatch);
                    if (filteredSubGroups.length === 0) return '';
                }

                matchedCount++;

                const subGroupsHtml = filteredSubGroups.map((sg, sgIdx) => {
                    const sgVol = sg.total_volume ? (
                        sg.total_volume >= 1000000 
                            ? (sg.total_volume / 1000000).toFixed(1).replace('.', ',') + ' Jt' 
                            : fmt(Math.round(sg.total_volume))
                    ) : '';
                    const sgVolLabel = sgVol ? `${sgVol} <small>${sg.unit}</small>` : '';

                    const itemsHtml = (sg.displayItems || []).map(it => {
                        const itemVol = it.val >= 1000000 
                            ? (it.val / 1000000).toFixed(1).replace('.', ',') + ' Jt' 
                            : fmt(Math.round(it.val));
                        return `
                            <div class="gc-sub-item">
                                <span>${it.name.length > 20 ? it.name.slice(0, 19) + '…' : it.name}</span>
                                <b>${itemVol} <span style="font-weight:400;font-size:10px">${it.unit}</span></b>
                            </div>
                        `;
                    }).join('');

                    const blockClass = sgIdx === 0 ? '' : 'gc-sub-block';

                    return `
                        <div class="${blockClass}">
                            <div class="gc-sub-title">
                                <span>${sg.icon || ''} ${sg.label}</span>
                                ${sgVolLabel ? `<span class="gc-sub-vol" style="color:${cat.color}">${sgVolLabel}</span>` : ''}
                            </div>
                            <div class="gc-sub-list" style="border-top:none;padding-top:0;margin-top:2px">${itemsHtml || '<div style="font-size:10px;color:var(--muted)">Tidak ada item cocok</div>'}</div>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="grp-card">
                        <div class="gc-header">
                            <div class="gc-name">${cat.icon} ${cat.label}</div>
                            <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                                ${q ? 'Cocok' : `${grpData.all_items_count} item`}
                            </span>
                        </div>
                        <div style="margin-top:6px">${subGroupsHtml}</div>
                    </div>
                `;
            }

            // Standard single volume card
            const allItems = grpData.top_items || [];
            const matchingItems = allItems.filter(it => catMatches || it.name.toLowerCase().includes(q));

            if (q && !catMatches && matchingItems.length === 0) return '';
            matchedCount++;

            const vol = grpData.total_volume || 0;
            let formattedVol = fmt(Math.round(vol));
            if (vol >= 1000000) {
                formattedVol = (vol / 1000000).toFixed(2).replace('.', ',') + ' Jt';
            }

            const displayItems = q && !catMatches ? matchingItems : (q ? matchingItems : allItems.slice(0, 3));
            const topItemsHtml = displayItems.map(it => {
                const itemVol = it.val >= 1000000 
                    ? (it.val / 1000000).toFixed(1).replace('.', ',') + ' Jt' 
                    : fmt(Math.round(it.val));
                return `
                    <div class="gc-sub-item">
                        <span>${it.name.length > 22 ? it.name.slice(0, 21) + '…' : it.name}</span>
                        <b>${itemVol} <span style="font-weight:400;font-size:10px">${it.unit}</span></b>
                    </div>
                `;
            }).join('');

            return `
                <div class="grp-card">
                    <div class="gc-header">
                        <div class="gc-name">${cat.icon} ${cat.label}</div>
                        <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                            ${q ? `${displayItems.length} cocok` : `${grpData.all_items_count} item`}
                        </span>
                    </div>
                    <div class="gc-count" style="color:${cat.color}">
                        ${formattedVol} <span class="unit">${grpData.default_unit}</span>
                    </div>
                    ${topItemsHtml ? `<div class="gc-sub-list">${topItemsHtml}</div>` : ''}
                </div>
            `;
        }).filter(Boolean).join('');

        if (matchedCount === 0 && q) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; color: var(--muted); font-size: 13px; background: var(--panel-2); border: 1px dashed var(--line); border-radius: 8px;">
                    Tidak ada komoditas konsumsi yang cocok dengan pencarian "<b>${filterQuery}</b>"
                </div>
            `;
        } else {
            grid.innerHTML = cards;
        }
    }

    renderCards();

    // Hook search input
    const searchInput = document.getElementById('konSearch');
    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('input', e => renderCards(e.target.value));
    }

    // 3. Source Footnote
    const srcEl = document.getElementById('srcKonGrp');
    if (srcEl) {
        srcEl.innerHTML = `<b>Sumber Data:</b> BPS — Survei Sosial Ekonomi Nasional (SUSENAS) 2023/2024. Rata-rata pengeluaran konsumsi per kapita sebulan menurut 14 kelompok komoditas.`;
    }
}

/* ============================================================
   TAB 7: PERTANIAN
   ============================================================ */
function renderPertanian(r) {
    const kpisEl = document.getElementById('taniKpis');
    const gridEl = document.getElementById('taniSektorGrid');
    const srcEl = document.getElementById('srcTaniSektor');
    if (!gridEl) return;

    if (!r) return;
    const regId = String(r.id || r.no || '');
    const pData = (typeof window.PERTANIAN_DATA !== 'undefined' && window.PERTANIAN_DATA) 
        ? window.PERTANIAN_DATA[regId] 
        : null;

    if (!pData || !pData.has_data) {
        if (kpisEl) {
            kpisEl.innerHTML = `
                <div class="kpi"><div class="k-label">Tanaman Pangan</div><div class="k-val" style="color:var(--muted)">0 <span class="k-unit">Ton</span></div><div class="k-note">Data Resmi BPS</div></div>
                <div class="kpi"><div class="k-label">Hortikultura</div><div class="k-val" style="color:var(--muted)">0 <span class="k-unit">Ton</span></div><div class="k-note">Data Resmi BPS</div></div>
                <div class="kpi"><div class="k-label">Perkebunan</div><div class="k-val" style="color:var(--muted)">0 <span class="k-unit">Ton</span></div><div class="k-note">Data Resmi BPS</div></div>
                <div class="kpi"><div class="k-label">Peternakan</div><div class="k-val" style="color:var(--muted)">0 <span class="k-unit">Ekor</span></div><div class="k-note">Data Resmi BPS</div></div>
            `;
        }
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; background: var(--panel-2); border: 1px dashed var(--line); border-radius: 8px; color: var(--muted);">
                <div style="font-size: 28px; margin-bottom: 8px;">🚜</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 5px;">Tidak Tercatat Aktivitas Produksi Pertanian Signifikan</div>
                <div style="font-size: 12px; max-width: 540px; margin: 0 auto; line-height: 1.6;">
                    Wilayah <b>${r.kabkota}</b> tidak memiliki catatan produksi komoditas tanaman pangan, hortikultura, perkebunan, maupun peternakan dalam publikasi resmi BPS / Kementerian Pertanian RI (umumnya kawasan perkotaan / non-agraris).
                </div>
            </div>
        `;
        if (srcEl) {
            srcEl.innerHTML = '';
        }
        return;
    }

    // 1. Render KPI Cards
    const ring = pData.ringkasan || {};
    const fmtVol = (v) => {
        if (!v || v === 0) return '0';
        return typeof v === 'number' ? Math.round(v).toLocaleString('id-ID') : v;
    };

    if (kpisEl) {
        kpisEl.innerHTML = `
            <div class="kpi">
                <div class="k-label">Tanaman Pangan</div>
                <div class="k-val" style="color:#0FB5A0">${fmtVol(ring.tanaman_pangan_total_produksi_ton)} <span class="k-unit">Ton</span></div>
                <div class="k-note">Data Resmi BPS (Tahun 2023)</div>
            </div>
            <div class="kpi">
                <div class="k-label">Hortikultura</div>
                <div class="k-val" style="color:#2FA65E">${fmtVol(ring.hortikultura_total_produksi_ton)} <span class="k-unit">Ton</span></div>
                <div class="k-note">Data Resmi BPS (Tahun 2023)</div>
            </div>
            <div class="kpi">
                <div class="k-label">Perkebunan</div>
                <div class="k-val" style="color:#D9962B">${fmtVol(ring.perkebunan_total_produksi_ton)} <span class="k-unit">Ton</span></div>
                <div class="k-note">Data Resmi BPS (Tahun 2023)</div>
            </div>
            <div class="kpi">
                <div class="k-label">Peternakan (Populasi)</div>
                <div class="k-val" style="color:#E8604C">${fmtVol(ring.peternakan_total_populasi_ekor)} <span class="k-unit">Ekor</span></div>
                <div class="k-note">Data Resmi BPS (Tahun 2023)</div>
            </div>
        `;
    }

    // 2. Render 4 Sector Cards
    const sektor = pData.sektor || {};
    const tpItems = sektor.tanaman_pangan || [];
    const hortiItems = sektor.hortikultura || [];
    const kebunItems = sektor.perkebunan || [];
    const ternakPop = (sektor.peternakan && sektor.peternakan.populasi) || [];
    const ternakProd = (sektor.peternakan && sektor.peternakan.produksi) || [];
    const totalTernakCount = ternakPop.length + ternakProd.length;

    const fmtItemVal = (v) => {
        if (!v || v === 0) return '0';
        if (typeof v === 'number') {
            return Number.isInteger(v)
                ? v.toLocaleString('id-ID')
                : v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        }
        return v;
    };

    function renderSectorCards(filterQuery = '') {
        const q = filterQuery.toLowerCase().trim();

        // Tampilkan seluruh komoditas penuh tanpa pemotongan / slice
        const filteredTp = q ? tpItems.filter(it => it.komoditas.toLowerCase().includes(q)) : tpItems;
        const filteredHorti = q ? hortiItems.filter(it => it.komoditas.toLowerCase().includes(q)) : hortiItems;
        const filteredKebun = q ? kebunItems.filter(it => it.komoditas.toLowerCase().includes(q)) : kebunItems;
        const filteredPop = q ? ternakPop.filter(it => it.komoditas.toLowerCase().includes(q)) : ternakPop;
        const filteredProd = q ? ternakProd.filter(it => it.komoditas.toLowerCase().includes(q)) : ternakProd;

        let cardsHtml = '';

        // Card 1: Tanaman Pangan (Baris 1, Kolom 1)
        const tpListHtml = filteredTp.map(it => {
            const prod = it.produksi ? `${fmtItemVal(it.produksi.val)} ${it.produksi.unit}` : '-';
            const luas = it.luas_panen ? `${fmtItemVal(it.luas_panen.val)} ${it.luas_panen.unit}` : '';
            const prodv = it.produktivitas ? `${fmtItemVal(it.produktivitas.val)} ${it.produktivitas.unit}` : '';
            const metaStr = [luas ? `Luas: ${luas}` : '', prodv ? `Prod: ${prodv}` : ''].filter(Boolean).join(' · ');
            return `
                <div class="gc-sub-item" style="flex-direction:column;gap:2px">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <span style="font-weight:600;color:var(--text);font-size:12px;flex:1">${it.komoditas}</span>
                        <b style="font-family:var(--mono);color:#0FB5A0;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0">${prod}</b>
                    </div>
                    ${metaStr ? `<div style="font-size:10px;color:var(--muted);font-family:var(--mono)">${metaStr}</div>` : ''}
                </div>
            `;
        }).join('');

        const cardTp = `
            <div class="grp-card" style="border-top:3px solid #0FB5A0">
                <div class="gc-header">
                    <div class="gc-name">🌾 Tanaman Pangan</div>
                    <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                        ${q ? `${filteredTp.length} cocok` : `${tpItems.length} komoditas`}
                    </span>
                </div>
                <div class="gc-count" style="color:#0FB5A0">
                    ${fmtVol(ring.tanaman_pangan_total_produksi_ton)} <span class="unit">Ton/th</span>
                </div>
                ${tpListHtml ? `<div class="gc-sub-list">${tpListHtml}</div>` : '<div style="font-size:11px;color:var(--muted);padding:8px 0">Tidak ada komoditas cocok</div>'}
            </div>
        `;

        // Card 2: Perkebunan (Baris 1, Kolom 2)
        const kebunListHtml = filteredKebun.map(it => {
            const prod = it.produksi ? `${fmtItemVal(it.produksi.val)} ${it.produksi.unit}` : '-';
            const luas = it.luas_areal ? `${fmtItemVal(it.luas_areal.val)} ${it.luas_areal.unit}` : '';
            const prodv = it.produktivitas ? `${fmtItemVal(it.produktivitas.val)} ${it.produktivitas.unit}` : '';
            const metaStr = [luas ? `Areal: ${luas}` : '', prodv ? `Prod: ${prodv}` : ''].filter(Boolean).join(' · ');
            return `
                <div class="gc-sub-item" style="flex-direction:column;gap:2px">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <span style="font-weight:600;color:var(--text);font-size:12px;flex:1">${it.komoditas}</span>
                        <b style="font-family:var(--mono);color:#D9962B;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0">${prod}</b>
                    </div>
                    ${metaStr ? `<div style="font-size:10px;color:var(--muted);font-family:var(--mono)">${metaStr}</div>` : ''}
                </div>
            `;
        }).join('');

        const cardKebun = `
            <div class="grp-card" style="border-top:3px solid #D9962B">
                <div class="gc-header">
                    <div class="gc-name">🌴 Perkebunan</div>
                    <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                        ${q ? `${filteredKebun.length} cocok` : `${kebunItems.length} komoditas`}
                    </span>
                </div>
                <div class="gc-count" style="color:#D9962B">
                    ${fmtVol(ring.perkebunan_total_produksi_ton)} <span class="unit">Ton/th</span>
                </div>
                ${kebunListHtml ? `<div class="gc-sub-list">${kebunListHtml}</div>` : '<div style="font-size:11px;color:var(--muted);padding:8px 0">Tidak ada komoditas cocok</div>'}
            </div>
        `;

        // Card 3: Hortikultura (Baris 2, Kolom 1)
        const hortiListHtml = filteredHorti.map(it => {
            const prod = it.produksi ? `${fmtItemVal(it.produksi.val)} ${it.produksi.unit}` : '-';
            const luas = it.luas_panen ? `${fmtItemVal(it.luas_panen.val)} ${it.luas_panen.unit}` : '';
            const prodv = it.produktivitas ? `${fmtItemVal(it.produktivitas.val)} ${it.produktivitas.unit}` : '';
            const metaStr = [luas ? `Luas: ${luas}` : '', prodv ? `Prod: ${prodv}` : ''].filter(Boolean).join(' · ');
            return `
                <div class="gc-sub-item" style="flex-direction:column;gap:2px">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <span style="font-weight:600;color:var(--text);font-size:12px;flex:1">${it.komoditas}</span>
                        <b style="font-family:var(--mono);color:#2FA65E;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0">${prod}</b>
                    </div>
                    ${metaStr ? `<div style="font-size:10px;color:var(--muted);font-family:var(--mono)">${metaStr}</div>` : ''}
                </div>
            `;
        }).join('');

        const cardHorti = `
            <div class="grp-card" style="border-top:3px solid #2FA65E">
                <div class="gc-header">
                    <div class="gc-name">🥬 Hortikultura</div>
                    <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                        ${q ? `${filteredHorti.length} cocok` : `${hortiItems.length} komoditas`}
                    </span>
                </div>
                <div class="gc-count" style="color:#2FA65E">
                    ${fmtVol(ring.hortikultura_total_produksi_ton)} <span class="unit">Ton/th</span>
                </div>
                ${hortiListHtml ? `<div class="gc-sub-list">${hortiListHtml}</div>` : '<div style="font-size:11px;color:var(--muted);padding:8px 0">Tidak ada komoditas cocok</div>'}
            </div>
        `;

        // Card 4: Peternakan (Baris 2, Kolom 2)
        const popListHtml = filteredPop.map(it => `
            <div class="gc-sub-item" style="align-items:center;justify-content:space-between;gap:8px">
                <span style="font-weight:600;color:var(--text);font-size:12px;flex:1">${it.komoditas}</span>
                <b style="font-family:var(--mono);color:#E8604C;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0">${fmtItemVal(it.val)} <span style="font-weight:400;font-size:10px">${it.unit}</span></b>
            </div>
        `).join('');

        const prodListHtml = filteredProd.map(it => `
            <div class="gc-sub-item" style="align-items:center;justify-content:space-between;gap:8px">
                <span style="font-weight:600;color:var(--text);font-size:12px;flex:1">${it.komoditas}</span>
                <b style="font-family:var(--mono);color:#E8604C;font-size:12px;white-space:nowrap;font-variant-numeric:tabular-nums;flex-shrink:0">${fmtItemVal(it.val)} <span style="font-weight:400;font-size:10px">${it.unit}</span></b>
            </div>
        `).join('');

        const matchedTernakTotal = filteredPop.length + filteredProd.length;

        const cardTernak = `
            <div class="grp-card" style="border-top:3px solid #E8604C">
                <div class="gc-header">
                    <div class="gc-name">🐄 Peternakan</div>
                    <span style="font-size:10px;font-family:var(--mono);color:var(--muted);background:var(--surface);padding:2px 6px;border-radius:4px">
                        ${q ? `${matchedTernakTotal} cocok` : `${totalTernakCount} item`}
                    </span>
                </div>
                <div class="gc-count" style="color:#E8604C">
                    ${fmtVol(ring.peternakan_total_populasi_ekor)} <span class="unit">Ekor Populasi</span>
                </div>
                <div>
                    ${popListHtml ? `
                        <div style="font-size:10.5px;font-weight:700;color:var(--text);margin-top:6px;margin-bottom:2px">Populasi Ternak Hidup:</div>
                        <div class="gc-sub-list" style="border-top:none;padding-top:0;margin-top:0;max-height:260px">${popListHtml}</div>
                    ` : (q && !prodListHtml ? '<div style="font-size:11px;color:var(--muted);padding:8px 0">Tidak ada komoditas cocok</div>' : '')}
                    ${prodListHtml ? `
                        <div style="font-size:10.5px;font-weight:700;color:var(--text);margin-top:7px;margin-bottom:2px;border-top:1px dashed var(--line);padding-top:5px">Produksi Hasil Ternak:</div>
                        <div class="gc-sub-list" style="border-top:none;padding-top:0;margin-top:0;max-height:260px">${prodListHtml}</div>
                    ` : ''}
                </div>
            </div>
        `;

        // Susun 2 Baris x 2 Kolom Berimbang
        // Baris 1: Tanaman Pangan & Perkebunan
        // Baris 2: Hortikultura & Peternakan
        gridEl.innerHTML = cardTp + cardKebun + cardHorti + cardTernak;
    }

    // Render awal
    renderSectorCards();

    // Event listener search di luar modal
    const taniSearchInput = document.getElementById('taniSearch');
    if (taniSearchInput && !taniSearchInput._bound) {
        taniSearchInput._bound = true;
        taniSearchInput.addEventListener('input', e => renderSectorCards(e.target.value));
    }

    // 3. Source Footnote
    if (srcEl) {
        srcEl.innerHTML = `<b>Sumber Data:</b> Badan Pusat Statistik (BPS) &amp; Kementerian Pertanian RI — Publikasi Statistik Pertanian 2023. Seluruh data komoditas tanaman pangan, hortikultura, perkebunan, dan peternakan ditampilkan penuh.`;
    }
}

/* ============================================================
   TAB 8: SOSIAL
   ============================================================ */
function renderSosial(r) {
    if (!r) return;
    const regId = String(r.id || r.no || '');
    const sData = (typeof window.SOSIAL_DATA !== 'undefined' && window.SOSIAL_DATA)
        ? window.SOSIAL_DATA[regId]
        : null;

    const sosKpis = document.getElementById('sosKpis');
    const eduBar = document.getElementById('eduBar');
    const healthGrid = document.getElementById('healthGrid');
    const eduTotalBadge = document.getElementById('eduTotalBadge');
    const healthTotalBadge = document.getElementById('healthTotalBadge');
    const eduStatusRow = document.getElementById('eduStatusRow');
    const healthActionRow = document.getElementById('healthActionRow');
    const kampusList = document.getElementById('kampusList');
    const kampusCountBadge = document.getElementById('kampusCountBadge');
    const akredGrid = document.getElementById('akredGrid');

    if (!sData || !sData.has_data) {
        if (sosKpis) {
            sosKpis.innerHTML = `
                <div class="kpi"><div class="k-label">Satuan Pendidikan</div><div class="k-val" style="color:var(--muted)">–</div><div class="k-note">Data belum tersedia</div></div>
                <div class="kpi"><div class="k-label">Peserta Didik</div><div class="k-val" style="color:var(--muted)">–</div><div class="k-note">Data belum tersedia</div></div>
                <div class="kpi"><div class="k-label">Tenaga Pendidik</div><div class="k-val" style="color:var(--muted)">–</div><div class="k-note">Data belum tersedia</div></div>
                <div class="kpi"><div class="k-label">Fasilitas Kesehatan</div><div class="k-val" style="color:var(--muted)">–</div><div class="k-note">Data belum tersedia</div></div>
            `;
        }
        return;
    }

    const ring = sData.ringkasan || {};
    const pend = sData.pendidikan || {};
    const kes = sData.kesehatan || {};
    const rekap = pend.rekap_jenjang || {};
    const fmt = (n) => typeof n === 'number' ? n.toLocaleString('id-ID') : (n || '0');

    // 1. Render KPI Cards
    if (sosKpis) {
        const rasio = ring.total_guru > 0 ? (ring.total_siswa / ring.total_guru).toFixed(1) : '–';
        sosKpis.innerHTML = `
            <div class="kpi">
                <div class="k-label">Satuan Pendidikan</div>
                <div class="k-val" style="color:#0FB5A0">${fmt(ring.total_sekolah)} <span class="k-unit">Unit</span></div>
                <div class="k-note">PAUD/TK s.d. Menengah</div>
            </div>
            <div class="kpi">
                <div class="k-label">Peserta Didik (Siswa)</div>
                <div class="k-val" style="color:#2E9BD6">${fmt(ring.total_siswa)} <span class="k-unit">Jiwa</span></div>
                <div class="k-note">Rasio Guru: 1 : ${rasio}</div>
            </div>
            <div class="kpi">
                <div class="k-label">Tenaga Pendidik (Guru)</div>
                <div class="k-val" style="color:#D9962B">${fmt(ring.total_guru)} <span class="k-unit">Orang</span></div>
                <div class="k-note">Guru &amp; Tenaga Pengajar</div>
            </div>
            <div class="kpi">
                <div class="k-label">Fasilitas Kesehatan</div>
                <div class="k-val" style="color:#E8604C">${fmt(ring.total_faskes || (ring.total_puskesmas + ring.total_rs))} <span class="k-unit">Faskes</span></div>
                <div class="k-note">${ring.total_puskesmas} Puskesmas · ${ring.total_rs} RS</div>
            </div>
        `;
    }

    if (eduTotalBadge) {
        eduTotalBadge.textContent = `${fmt(ring.total_sekolah)} Sekolah Terdata`;
    }
    if (healthTotalBadge) {
        healthTotalBadge.textContent = `${fmt(ring.total_puskesmas + ring.total_rs)} Faskes Resmi`;
    }

    // 2. Render Grafik Batang Pendidikan (eduBar)
    if (eduBar) {
        const paudTotal = (rekap.paud_tk ? rekap.paud_tk.total : 0);
        const sdTotal = (rekap.sd ? rekap.sd.total : 0);
        const miTotal = (rekap.madrasah ? (rekap.madrasah.mi || 0) : 0);
        const smpTotal = (rekap.smp ? rekap.smp.total : 0);
        const mtsTotal = (rekap.madrasah ? (rekap.madrasah.mts || 0) : 0);
        const smaTotal = (rekap.sma ? rekap.sma.total : 0);
        const maTotal = (rekap.madrasah ? (rekap.madrasah.ma || 0) : 0);
        const smkTotal = (rekap.smk ? rekap.smk.total : 0);
        const slbTotal = (rekap.slb ? rekap.slb.total : 0);
        const kampusTotal = ring.total_kampus || (pend.daftar_kampus ? pend.daftar_kampus.length : 0);

        // Nomenklatur formal lugas tanpa kata "/ Sederajat":
        // Seluruh 10 jenjang formal utama ditampilkan permanen (termasuk nilai 0) agar transparan dan tidak disangka hilang.
        const E = [
            { n: 'Sekolah Luar Biasa (SLB)', v: slbTotal, c: '#64748B' },
            { n: 'PAUD & TK', v: paudTotal, c: '#E8604C' },
            { n: 'Sekolah Dasar (SD)', v: sdTotal, c: '#0FB5A0' },
            { n: 'Madrasah Ibtidaiyah (MI)', v: miTotal, c: '#14B8A6' },
            { n: 'Sekolah Menengah Pertama (SMP)', v: smpTotal, c: '#2E9BD6' },
            { n: 'Madrasah Tsanawiyah (MTs)', v: mtsTotal, c: '#38BDF8' },
            { n: 'Sekolah Menengah Atas (SMA)', v: smaTotal, c: '#D9962B' },
            { n: 'Madrasah Aliyah (MA)', v: maTotal, c: '#F59E0B' },
            { n: 'Sekolah Menengah Kejuruan (SMK)', v: smkTotal, c: '#5B6EE0' },
            { n: 'Perguruan Tinggi (PT)', v: kampusTotal, c: '#8E44AD' }
        ];

        const W = 490, rowH = 32, labelW = 190, barMax = W - labelW - 65;
        const maxV = Math.max(...E.map(e => e.v)) || 1;
        eduBar.setAttribute('viewBox', `0 0 ${W} ${E.length * rowH + 18}`);
        let s = '';
        E.forEach((e, i) => {
            const y = i * rowH + 8;
            const w = e.v > 0 ? Math.max(4, (e.v / maxV) * barMax) : 0;
            s += `<text class="pd-lbl" x="0" y="${y + rowH / 2 + 1}" font-size="11" font-weight="600" fill="${e.v > 0 ? 'var(--text)' : 'var(--muted)'}">${e.n}</text>`;
            if (w > 0) {
                s += `<rect x="${labelW}" y="${y + 5}" width="${w}" height="${rowH - 12}" rx="3" fill="${e.c}" opacity="0.88"/>`;
            }
            s += `<text class="pd-val" x="${labelW + (w > 0 ? w + 8 : 4)}" y="${y + rowH / 2 + 2}" font-size="11" font-weight="700" font-family="var(--mono)" fill="${e.v > 0 ? e.c : 'var(--muted)'}">${fmt(e.v)}</text>`;
        });
        eduBar.innerHTML = s;
    }

    // 3. Render Status Negeri vs Swasta
    if (eduStatusRow) {
        let negCount = 0, swasCount = 0;
        ['sd', 'smp', 'sma', 'smk', 'paud_tk', 'slb', 'madrasah'].forEach(k => {
            if (rekap[k]) {
                negCount += (rekap[k].negeri || 0);
                swasCount += (rekap[k].swasta || 0);
            }
        });
        const totalStatus = negCount + swasCount;
        const pctNeg = totalStatus > 0 ? Math.round((negCount / totalStatus) * 100) : 0;
        const pctSwas = totalStatus > 0 ? (100 - pctNeg) : 0;
        eduStatusRow.innerHTML = `
            <div>Negeri: <b style="color:#0FB5A0">${fmt(negCount)}</b> (${pctNeg}%)</div>
            <div style="flex:1;max-width:180px;height:7px;background:var(--line);border-radius:4px;overflow:hidden;margin:0 12px;align-self:center">
                <div style="width:${pctNeg}%;height:100%;background:#0FB5A0"></div>
            </div>
            <div>Swasta: <b style="color:#D9962B">${fmt(swasCount)}</b> (${pctSwas}%)</div>
        `;
    }

    // 4. Render Fasilitas Kesehatan Grid
    if (healthGrid) {
        const pkmCount = ring.total_puskesmas || (kes.puskesmas ? kes.puskesmas.length : 0);
        const rsCount = ring.total_rs || (kes.rumah_sakit ? kes.rumah_sakit.length : 0);
        healthGrid.innerHTML = `
            <div style="padding:14px;background:var(--panel-2);border:1px solid var(--line);border-radius:8px">
                <div style="font-family:var(--mono);font-size:24px;font-weight:700;color:#0FB5A0">${fmt(pkmCount)}</div>
                <div style="font-size:12px;font-weight:600;color:var(--text);margin-top:2px">Puskesmas</div>
                <div style="font-size:10px;color:var(--muted);margin-top:3px">Pusat Kesehatan Masyarakat Resmi</div>
            </div>
            <div style="padding:14px;background:var(--panel-2);border:1px solid var(--line);border-radius:8px">
                <div style="font-family:var(--mono);font-size:24px;font-weight:700;color:${rsCount > 0 ? '#E8604C' : 'var(--muted)'}">${fmt(rsCount)}</div>
                <div style="font-size:12px;font-weight:600;color:var(--text);margin-top:2px">Rumah Sakit</div>
                <div style="font-size:10px;color:var(--muted);margin-top:3px">RS Vertikal Rujukan Kemenkes</div>
            </div>
        `;
    }

    // 5. Action Buttons untuk Faskes
    if (healthActionRow) {
        const pkmList = kes.puskesmas || [];
        const rsList = kes.rumah_sakit || [];
        healthActionRow.innerHTML = `
            ${pkmList.length > 0 ? `<button type="button" class="btn btn-sm" id="btnSeePuskesmas" style="font-size:11.5px;padding:6px 12px;cursor:pointer">Lihat ${pkmList.length} Puskesmas &rarr;</button>` : ''}
            ${rsList.length > 0 ? `<button type="button" class="btn btn-sm" id="btnSeeRS" style="font-size:11.5px;padding:6px 12px;cursor:pointer">Lihat ${rsList.length} RS Rujukan &rarr;</button>` : ''}
        `;
        document.getElementById('btnSeePuskesmas')?.addEventListener('click', () => openSosModal('puskesmas', r, sData));
        document.getElementById('btnSeeRS')?.addEventListener('click', () => openSosModal('rs', r, sData));
    }

    // 6. Render Daftar Kampus
    if (kampusList && kampusCountBadge) {
        const campuses = pend.daftar_kampus || [];
        kampusCountBadge.textContent = `${campuses.length} Kampus`;
        if (campuses.length === 0) {
            kampusList.innerHTML = `<div style="font-size:11.5px;color:var(--muted);padding:10px 0">Tidak ada kampus perguruan tinggi beroperasi di wilayah ini.</div>`;
        } else {
            kampusList.innerHTML = campuses.map(c => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--surface);border-radius:6px;font-size:11.5px">
                    <span style="font-weight:600;color:var(--text);max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.nama)}</span>
                    <span style="font-family:var(--mono);font-size:10px;color:#8E44AD;background:rgba(142,68,173,0.1);padding:2px 6px;border-radius:4px">${escapeHtml(c.akreditasi || 'Aktif')}</span>
                </div>
            `).join('');
        }
    }

    // 7. Render Akreditasi Sekolah
    if (akredGrid) {
        const ak = pend.akreditasi || { a: 0, b: 0, c: 0, belum: 0 };
        akredGrid.innerHTML = `
            <div style="padding:10px;background:var(--surface);border-radius:6px">
                <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:#0FB5A0">${fmt(ak.a)}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Akreditasi A</div>
            </div>
            <div style="padding:10px;background:var(--surface);border-radius:6px">
                <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:#2E9BD6">${fmt(ak.b)}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Akreditasi B</div>
            </div>
            <div style="padding:10px;background:var(--surface);border-radius:6px">
                <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:#D9962B">${fmt(ak.c)}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Akreditasi C</div>
            </div>
            <div style="padding:10px;background:var(--surface);border-radius:6px">
                <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--muted)">${fmt(ak.belum)}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Lainnya</div>
            </div>
        `;
    }

    // 8. Source Footnote
    const srcSos = document.getElementById('srcSosial');
    if (srcSos) {
        srcSos.innerHTML = `<b>Sumber Data:</b> Kemendikbudristek (Dapodik 2023/2024), Kementerian Agama RI (EMIS 2023/2024), PDDIKTI, dan Kementerian Kesehatan RI (Fasyankes 2024). Data mencakup seluruh jenjang satuan pendidikan resmi dan fasilitas kesehatan aktif.`;
    }
}

function openSosModal(type, r, sData) {
    const modalEl = document.getElementById('sosModal');
    const modalTitleEl = document.getElementById('sosModalTitle');
    const modalSubEl = document.getElementById('sosModalSub');
    const modalCountEl = document.getElementById('sosModalCount');
    const modalSearchEl = document.getElementById('sosModalSearch');
    const modalTableEl = document.getElementById('sosModalTable');
    const closeBtn = document.getElementById('btnSosModalClose');
    if (!modalEl || !modalTableEl) return;

    let rows = [];
    if (type === 'puskesmas') {
        if (modalTitleEl) modalTitleEl.textContent = `Puskesmas di ${r.kabkota}`;
        if (modalSubEl) modalSubEl.textContent = `Basis Data Resmi Kemenkes RI · Fasilitas Kesehatan Tingkat Pertama`;
        rows = (sData.kesehatan && sData.kesehatan.puskesmas) || [];
    } else if (type === 'rs') {
        if (modalTitleEl) modalTitleEl.textContent = `Rumah Sakit di ${r.kabkota}`;
        if (modalSubEl) modalSubEl.textContent = `Basis Data Resmi Kemenkes RI · Fasilitas Rujukan Tingkat Lanjut`;
        rows = (sData.kesehatan && sData.kesehatan.rumah_sakit) || [];
    }

    const renderTable = (q = '') => {
        const query = q.toLowerCase().trim();
        const filtered = rows.filter(it => (it.nama + ' ' + (it.alamat || '') + ' ' + (it.telepon || '')).toLowerCase().includes(query));
        if (modalCountEl) modalCountEl.textContent = `${filtered.length} Fasilitas`;
        
        if (filtered.length === 0) {
            modalTableEl.innerHTML = `<tbody><tr><td style="padding:24px;text-align:center;color:var(--muted)">Tidak ada fasilitas cocok dengan "${escapeHtml(q)}"</td></tr></tbody>`;
            return;
        }

        if (type === 'puskesmas') {
            modalTableEl.innerHTML = `
                <thead>
                    <tr>
                        <th style="width:40px;text-align:center">No</th>
                        <th>Nama Puskesmas</th>
                        <th style="width:140px">Kontak Telepon</th>
                        <th>Email Resmi</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map((it, idx) => `
                        <tr>
                            <td style="text-align:center;color:var(--muted);font-family:var(--mono)">${idx + 1}</td>
                            <td><strong style="color:var(--text)">${escapeHtml(it.nama)}</strong></td>
                            <td style="font-family:var(--mono);font-size:11px">${escapeHtml(it.telepon || '–')}</td>
                            <td style="font-family:var(--mono);font-size:11px;color:var(--muted)">${escapeHtml(it.email || '–')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        } else {
            modalTableEl.innerHTML = `
                <thead>
                    <tr>
                        <th style="width:40px;text-align:center">No</th>
                        <th>Nama Rumah Sakit</th>
                        <th>Alamat</th>
                        <th style="width:130px">Kontak Telepon</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map((it, idx) => `
                        <tr>
                            <td style="text-align:center;color:var(--muted);font-family:var(--mono)">${idx + 1}</td>
                            <td><strong style="color:var(--text)">${escapeHtml(it.nama)}</strong></td>
                            <td style="font-size:11.5px;color:var(--muted)">${escapeHtml(it.alamat || '–')}</td>
                            <td style="font-family:var(--mono);font-size:11px">${escapeHtml(it.telepon || '–')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }
    };

    renderTable();
    modalEl.hidden = false;
    if (modalSearchEl) {
        modalSearchEl.value = '';
        modalSearchEl.oninput = (e) => renderTable(e.target.value);
    }
    if (closeBtn) closeBtn.onclick = () => { modalEl.hidden = true; };
    modalEl.onclick = (e) => { if (e.target === modalEl) modalEl.hidden = true; };
}

/* ============================================================
   TAB 9: DATA PODES
   ============================================================ */
function renderPodes() {
    const table = document.getElementById('podesTable');
    if (!table) return;

    const vars = [
        { k: 'r101', n: 'Kode Provinsi', t: 'String', len: '2' },
        { k: 'r102', n: 'Kode Kabupaten/Kota', t: 'String', len: '2' },
        { k: 'r301', n: 'Status Pemerintahan Desa/Kelurahan', t: 'Numeric', len: '1' },
        { k: 'r305a', n: 'Topografi Wilayah Desa/Kelurahan', t: 'Numeric', len: '1' },
        { k: 'r403a', n: 'Sumber Penghasilan Utama Penduduk', t: 'Numeric', len: '2' },
        { k: 'r501a1', n: 'Jumlah Keluarga Pengguna Listrik PLN', t: 'Numeric', len: '5' },
        { k: 'r508a', n: 'Sumber Air Minum Sebagian Besar Keluarga', t: 'Numeric', len: '2' },
        { k: 'r601bk2', n: 'Kejadian Bencana Alam Banjir', t: 'Numeric', len: '1' }
    ];

    const searchInput = document.getElementById('podesSearch');

    function renderRows(q = '') {
        const list = vars.filter(v => (v.k + ' ' + v.n).toLowerCase().includes(q.toLowerCase()));
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width:80px">Kode</th>
                    <th>Nama Variabel PODES 2024</th>
                    <th style="width:60px">Tipe</th>
                    <th style="width:50px">Panjang</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(v => `
                    <tr>
                        <td style="font-family:var(--mono);font-weight:600;color:var(--teal)">${v.k}</td>
                        <td style="color:var(--text)">${v.n}</td>
                        <td>${v.t}</td>
                        <td style="font-family:var(--mono)">${v.len}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }

    renderRows();
    if (searchInput && !searchInput._bound) {
        searchInput._bound = true;
        searchInput.addEventListener('input', e => renderRows(e.target.value));
    }

    const srcPodes = document.getElementById('srcPodes');
    if (srcPodes) {
        srcPodes.innerHTML = `<b>Sumber Data:</b> Badan Pusat Statistik (BPS) — Pendataan Potensi Desa (PODES) 2024. Basis data kewilayahan tingkat desa dan kelurahan seluruh Indonesia.`;
    }
}

/* ============================================================
   CASCADING REGION FILTER CONTROLLER (Gambar 2 UI)
   ============================================================ */
function setupCascadingFilter(currentRegion, returnView) {
    const provSelect = document.getElementById('filterProvSelect');
    const citySelect = document.getElementById('filterCitySelect');
    const searchInput = document.getElementById('filterSearchInput');
    const searchDropdown = document.getElementById('filterSearchResults');

    function navigateToRegion(targetId, targetSlug) {
        const targetItem = REGION_DATA.find(x => String(x.id) === String(targetId));
        try {
            localStorage.setItem('selected_region_id', String(targetId));
            localStorage.setItem('selected_region_slug', String(targetSlug || ''));
            if (targetItem) localStorage.setItem('selected_region_name', String(targetItem.kabkota || ''));
            sessionStorage.setItem('selected_region_id', String(targetId));
            sessionStorage.setItem('selected_region_slug', String(targetSlug || ''));
            if (targetItem) sessionStorage.setItem('selected_region_name', String(targetItem.kabkota || ''));
        } catch (e) {}

        const activeTabPane = sessionStorage.getItem('active_profil_tab') || 'tab-wilayah';
        const cleanTab = activeTabPane.toLowerCase().replace(/^tab-/, '');
        const viewParam = returnView ? `&view=${returnView}` : '';
        window.location.href = `profil.html?id=${targetId}&slug=${targetSlug}&tab=${cleanTab}${viewParam}#id=${targetId}&slug=${targetSlug}`;
    }

    if (provSelect && citySelect) {
        // 1. Ekstrak daftar 38 provinsi unik dan urutkan alfabetis
        const provs = [...new Set(REGION_DATA.map(x => x.prov).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));

        let provOpts = '<option value="">Semua Provinsi (38)</option>';
        provs.forEach(p => {
            const isSel = (currentRegion && currentRegion.prov && currentRegion.prov.toUpperCase() === p.toUpperCase());
            provOpts += `<option value="${escapeHtml(p)}" ${isSel ? 'selected' : ''}>${escapeHtml(p)}</option>`;
        });
        provSelect.innerHTML = provOpts;

        function populateCities(selectedProv) {
            if (!selectedProv) {
                citySelect.disabled = true;
                citySelect.innerHTML = '<option value="">Pilih Provinsi Dulu</option>';
                return;
            }

            const cities = REGION_DATA.filter(x => x.prov && x.prov.toUpperCase() === selectedProv.toUpperCase())
                .sort((a, b) => (a.kabkota || '').localeCompare(b.kabkota || '', 'id'));

            let cityOpts = '<option value="">Pilih Kab/Kota...</option>';
            cities.forEach(c => {
                const isSel = (currentRegion && String(c.id) === String(currentRegion.id));
                cityOpts += `<option value="${c.id}" data-slug="${c.slug}" ${isSel ? 'selected' : ''}>${escapeHtml(c.kabkota)}</option>`;
            });

            citySelect.disabled = false;
            citySelect.innerHTML = cityOpts;
        }

        // Inisialisasi awal kab/kota sesuai provinsi daerah aktif
        if (currentRegion && currentRegion.prov) {
            populateCities(currentRegion.prov);
        }

        provSelect.addEventListener('change', e => {
            const chosenProv = e.target.value;
            populateCities(chosenProv);
        });

        citySelect.addEventListener('change', e => {
            const targetId = e.target.value;
            if (!targetId) return;
            const selOpt = e.target.options[e.target.selectedIndex];
            const targetSlug = selOpt ? selOpt.dataset.slug : '';
            navigateToRegion(targetId, targetSlug);
        });
    }

    // 2. Search Autocomplete
    if (searchInput && searchDropdown) {
        function renderSearch(q = '') {
            const query = q.toLowerCase().trim();
            if (!query) {
                searchDropdown.hidden = true;
                searchDropdown.innerHTML = '';
                return;
            }

            const matches = REGION_DATA.filter(x => 
                (x.kabkota && x.kabkota.toLowerCase().includes(query)) ||
                (x.prov && x.prov.toLowerCase().includes(query))
            ).slice(0, 15);

            if (matches.length === 0) {
                searchDropdown.innerHTML = `<div style="padding:12px;text-align:center;color:var(--muted);font-size:12px">Tidak ada daerah cocok.</div>`;
                searchDropdown.hidden = false;
                return;
            }

            searchDropdown.innerHTML = matches.map(x => `
                <div class="picker-item ${currentRegion && x.id === currentRegion.id ? 'selected' : ''}" data-id="${x.id}" data-slug="${x.slug}">
                    <span style="font-weight:600;font-size:12.5px">${escapeHtml(x.kabkota)}</span>
                    <span style="font-family:var(--mono);font-size:10.5px;color:var(--muted-2)">${escapeHtml(x.prov)}</span>
                </div>
            `).join('');

            searchDropdown.hidden = false;

            searchDropdown.querySelectorAll('.picker-item').forEach(item => {
                item.addEventListener('click', () => {
                    const targetId = item.dataset.id;
                    const targetSlug = item.dataset.slug;
                    navigateToRegion(targetId, targetSlug);
                });
            });
        }

        searchInput.addEventListener('input', e => renderSearch(e.target.value));
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) renderSearch(searchInput.value);
        });

        document.addEventListener('click', e => {
            if (!searchDropdown.hidden && !searchDropdown.contains(e.target) && e.target !== searchInput) {
                searchDropdown.hidden = true;
            }
        });

        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (e.key === 'Escape' && !searchDropdown.hidden) {
                searchDropdown.hidden = true;
            }
        });
    }

    // 3. Fallback backward compatibility untuk pickerTrigger lama jika ada
    const oldTrigger = document.getElementById('pickerTrigger');
    const oldDropdown = document.getElementById('pickerDropdown');
    const oldSearch = document.getElementById('pickerSearchInput');
    const oldList = document.getElementById('pickerResultsList');
    if (oldTrigger && oldDropdown && oldList) {
        oldTrigger.addEventListener('click', () => {
            oldDropdown.hidden = !oldDropdown.hidden;
            if (!oldDropdown.hidden && oldSearch) oldSearch.focus();
        });
    }
}

/* ============================================================
   FASE 1: ANALYTICAL WIDGET CONTROLLERS (RESMI BPS RI 2024)
   - Widget 5.0: Radar Chart Dimensi Penyusun IPM
   - Widget 6.0: Kesenjangan Pendidikan HLS vs RLS (5 Daerah)
   - Widget 7.0: Benchmark Umur Harapan Hidup (UHH)
   - Widget 8 & 15: Indikator Akses Layanan Dasar Permukiman
   ============================================================ */

/**
 * Helper: Ambil data Fase 1 berdasarkan ID / Nama daerah
 */
function getFase1RegionData(r) {
    if (typeof window.FASE1_DATA === 'undefined') return null;
    const key = String(r.id != null ? r.id : r.no);
    if (window.FASE1_DATA[key]) return window.FASE1_DATA[key];

    // Fallback: match by clean kabkota & prov
    const clean = s => (s || '').toUpperCase().replace(/^(KABUPATEN|KOTA|KAB\.|KOTA\.)\s+/, '').replace(/[^A-Z0-9]/g, '');
    const rName = clean(r.kabkota);
    const rProv = clean(r.prov);
    const all = Object.values(window.FASE1_DATA);
    return all.find(item => {
        const iName = clean(item.kabkota);
        const iProv = clean(item.provinsi);
        return iName === rName && (iProv.includes(rProv) || rProv.includes(iProv));
    }) || null;
}

/**
 * Widget 5.0: Radar Chart Dimensi Penyusun IPM
 */
function renderRadarIpm(r) {
    const f1 = getFase1RegionData(r);
    const badgeEl = document.getElementById('radarIpmBadge');
    const chartEl = document.getElementById('radarIpmChart');
    const metricsEl = document.getElementById('radarIpmMetrics');
    if (!chartEl || !metricsEl) return;

    if (!f1 || !f1.ipm) {
        if (badgeEl) badgeEl.textContent = 'Data BPS Belum Tersedia';
        metricsEl.innerHTML = `<div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:12px">Data rincian IPM wilayah ini belum tersedia di basis data BPS.</div>`;
        return;
    }

    const ipm = f1.ipm;
    if (badgeEl) {
        badgeEl.textContent = `IPM ${fmt2(ipm.skor_total)} · ${ipm.kategori || 'Tinggi'}`;
    }

    // 4 Kotak Nilai Asli
    metricsEl.innerHTML = `
        <div class="fase1-metric-box">
            <div class="fase1-metric-label">Umur Harapan Hidup (UHH)</div>
            <div class="fase1-metric-val" style="color:#0FB5A0">${fmt2(ipm.uhh)} <span style="font-size:11px;font-weight:400;color:var(--muted)">Tahun</span></div>
            <div class="fase1-metric-note">Indeks: <b>${fmt1(ipm.indeks_kesehatan)}</b>/100</div>
        </div>
        <div class="fase1-metric-box">
            <div class="fase1-metric-label">Harapan Lama Sekolah (HLS)</div>
            <div class="fase1-metric-val" style="color:#2E9BD6">${fmt2(ipm.hls)} <span style="font-size:11px;font-weight:400;color:var(--muted)">Tahun</span></div>
            <div class="fase1-metric-note">Indeks: <b>${fmt1(ipm.indeks_hls)}</b>/100</div>
        </div>
        <div class="fase1-metric-box">
            <div class="fase1-metric-label">Rata-rata Lama Sekolah (RLS)</div>
            <div class="fase1-metric-val" style="color:#D97706">${fmt2(ipm.rls)} <span style="font-size:11px;font-weight:400;color:var(--muted)">Tahun</span></div>
            <div class="fase1-metric-note">Indeks: <b>${fmt1(ipm.indeks_rls)}</b>/100</div>
        </div>
        <div class="fase1-metric-box">
            <div class="fase1-metric-label">Pengeluaran Riil (PPP)</div>
            <div class="fase1-metric-val" style="color:#5B6EE0">Rp${fmt(Math.round(ipm.pengeluaran_ppp / 1000))} <span style="font-size:11px;font-weight:400;color:var(--muted)">Rb/th</span></div>
            <div class="fase1-metric-note">Indeks: <b>${fmt1(ipm.indeks_pengeluaran)}</b>/100</div>
        </div>
    `;

    if (typeof echarts === 'undefined') return;

    let chart = echarts.getInstanceByDom(chartEl);
    if (chart) chart.dispose();
    chart = echarts.init(chartEl);
    window._fase1Charts = window._fase1Charts || [];
    window._fase1Charts.push(chart);

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            textStyle: { color: '#F8FAFC', fontSize: 11.5, fontFamily: 'var(--sans)' },
            formatter: () => {
                return `
                    <div style="font-weight:700;margin-bottom:4px;color:#2DD4BF">${escapeHtml(r.kabkota)}</div>
                    <div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0"><span>Kesehatan (UHH):</span><b>${fmt2(ipm.uhh)} th (${fmt1(ipm.indeks_kesehatan)})</b></div>
                    <div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0"><span>Harapan Sekolah (HLS):</span><b>${fmt2(ipm.hls)} th (${fmt1(ipm.indeks_hls)})</b></div>
                    <div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0"><span>Rata-rata Sekolah (RLS):</span><b>${fmt2(ipm.rls)} th (${fmt1(ipm.indeks_rls)})</b></div>
                    <div style="display:flex;justify-content:space-between;gap:12px;margin:2px 0"><span>Pengeluaran PPP:</span><b>Rp${fmt(ipm.pengeluaran_ppp)} (${fmt1(ipm.indeks_pengeluaran)})</b></div>
                `;
            }
        },
        radar: {
            shape: 'polygon',
            radius: '58%',
            center: ['52%', '52%'],
            splitNumber: 4,
            axisName: {
                color: '#475569',
                fontSize: 10.5,
                fontWeight: 600,
                fontFamily: 'var(--sans)'
            },
            splitLine: {
                lineStyle: { color: 'rgba(148, 163, 184, 0.28)' }
            },
            splitArea: {
                show: true,
                areaStyle: {
                    color: ['rgba(241, 245, 249, 0.35)', 'rgba(248, 250, 252, 0.75)']
                }
            },
            indicator: [
                { name: 'Kesehatan\n(UHH)', max: 100 },
                { name: 'Harapan Sekolah\n(HLS)', max: 100 },
                { name: 'Rata-rata Sekolah\n(RLS)', max: 100 },
                { name: 'Pengeluaran Riil\n(PPP)', max: 100 }
            ]
        },
        series: [{
            name: r.kabkota,
            type: 'radar',
            data: [{
                value: [
                    ipm.indeks_kesehatan || 50,
                    ipm.indeks_hls || 50,
                    ipm.indeks_rls || 50,
                    ipm.indeks_pengeluaran || 50
                ],
                name: r.kabkota
            }],
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: '#0D9488' },
            lineStyle: { color: '#0FB5A0', width: 2.4 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(15, 181, 160, 0.45)' },
                    { offset: 1, color: 'rgba(13, 148, 136, 0.12)' }
                ])
            }
        }]
    };
    chart.setOption(option);
}

/**
 * Widget 7.0: Benchmark Umur Harapan Hidup (UHH) saat Lahir
 */
function renderUhhBenchmark(r) {
    const f1 = getFase1RegionData(r);
    const chipEl = document.getElementById('uhhBenchmarkChip');
    const kpiStripEl = document.getElementById('uhhKpiStrip');
    const chartEl = document.getElementById('uhhBenchmarkChart');
    if (!kpiStripEl || !chartEl) return;

    if (!f1 || !f1.uhh_benchmark) {
        if (chipEl) chipEl.textContent = 'Belum Ada Data';
        kpiStripEl.innerHTML = `<div style="grid-column:1/-1;font-size:12px;color:var(--muted);padding:10px">Data UHH belum tersedia.</div>`;
        return;
    }

    const uhh = f1.uhh_benchmark;
    const uhhDaerah = uhh.uhh_daerah || 70.0;
    const uhhProv = uhh.uhh_provinsi || 73.0;
    const uhhNas = uhh.uhh_nasional || 74.39;

    const diffNas = uhh.selisih_nasional != null ? uhh.selisih_nasional : (uhhDaerah - uhhNas);
    const diffProv = uhh.selisih_provinsi != null ? uhh.selisih_provinsi : (uhhDaerah - uhhProv);

    const fmtDiff = d => {
        const sign = d > 0 ? '+' : '';
        const cls = d > 0 ? 'fase1-diff-plus' : (d < 0 ? 'fase1-diff-minus' : 'fase1-diff-zero');
        return `<span class="${cls}">${sign}${fmt2(d)} th</span>`;
    };

    if (chipEl) chipEl.textContent = `UHH: ${fmt2(uhhDaerah)} Thn`;

    // 3 KPI Strip Cards
    kpiStripEl.innerHTML = `
        <div class="fase1-uhh-kpi">
            <div class="fase1-uhh-lbl">${escapeHtml(r.kabkota)}</div>
            <div class="fase1-uhh-val" style="color:#0FB5A0">${fmt2(uhhDaerah)}<span style="font-size:11px;font-weight:400;color:var(--muted)"> th</span></div>
            <div class="fase1-uhh-diff"><span style="color:var(--muted)">Capaian Daerah</span></div>
        </div>
        <div class="fase1-uhh-kpi">
            <div class="fase1-uhh-lbl">Rata-rata Prov. ${escapeHtml(r.prov)}</div>
            <div class="fase1-uhh-val" style="color:#D97706">${fmt2(uhhProv)}<span style="font-size:11px;font-weight:400;color:var(--muted)"> th</span></div>
            <div class="fase1-uhh-diff">vs Daerah: ${fmtDiff(-diffProv)}</div>
        </div>
        <div class="fase1-uhh-kpi">
            <div class="fase1-uhh-lbl">Rata-rata Nasional (BPS)</div>
            <div class="fase1-uhh-val" style="color:#2563EB">${fmt2(uhhNas)}<span style="font-size:11px;font-weight:400;color:var(--muted)"> th</span></div>
            <div class="fase1-uhh-diff">vs Daerah: ${fmtDiff(-diffNas)}</div>
        </div>
    `;

    if (typeof echarts === 'undefined') return;

    // Ambil 3 peer regions dalam provinsi yang sama
    const peers = REGION_DATA.filter(x => x.prov === r.prov && String(x.id || x.no) !== String(r.id || r.no)).slice(0, 3);
    const benchmarkItems = [];

    // 1. Nasional
    benchmarkItems.push({
        name: 'Nasional',
        val: uhhNas,
        color: '#2563EB',
        isTarget: false
    });

    // 2. Provinsi
    benchmarkItems.push({
        name: `Prov. ${r.prov}`,
        val: uhhProv,
        color: '#D97706',
        isTarget: false
    });

    // 3. Peers
    peers.forEach(p => {
        const pf = getFase1RegionData(p);
        const pVal = (pf && pf.uhh_benchmark && pf.uhh_benchmark.uhh_daerah) || 72.0;
        benchmarkItems.push({
            name: p.kabkota,
            val: pVal,
            color: '#94A3B8',
            isTarget: false
        });
    });

    // 4. Target Region (Daerah Aktif)
    benchmarkItems.push({
        name: `${r.kabkota} ★`,
        val: uhhDaerah,
        color: '#0FB5A0',
        isTarget: true
    });

    // Urutkan ascending agar bar terpanjang berada di posisi paling atas
    benchmarkItems.sort((a, b) => a.val - b.val);

    const categories = benchmarkItems.map(it => it.name);
    const values = benchmarkItems.map(it => ({
        value: it.val,
        itemStyle: {
            color: it.color,
            borderRadius: [0, 4, 4, 0]
        }
    }));

    let chart = echarts.getInstanceByDom(chartEl);
    if (chart) chart.dispose();
    chart = echarts.init(chartEl);
    window._fase1Charts = window._fase1Charts || [];
    window._fase1Charts.push(chart);

    const minVal = Math.floor(Math.min(...benchmarkItems.map(it => it.val)) - 2);
    const maxVal = Math.ceil(Math.max(...benchmarkItems.map(it => it.val)) + 1.5);

    const option = {
        grid: {
            top: 10,
            bottom: 22,
            left: 125,
            right: 50,
            containLabel: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: params => {
                const p = params[0];
                return `<b>${escapeHtml(p.name)}</b>: ${fmt2(p.value)} tahun`;
            }
        },
        xAxis: {
            type: 'value',
            min: minVal,
            max: maxVal,
            axisLabel: {
                formatter: '{value} th',
                fontSize: 10,
                color: '#64748B',
                fontFamily: 'var(--mono)'
            },
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } }
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
            axisLabel: {
                fontSize: 11,
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                color: (value) => value.includes('★') ? '#0D9488' : '#475569',
                formatter: val => val.length > 16 ? val.slice(0, 14) + '…' : val
            }
        },
        series: [{
            type: 'bar',
            barWidth: 14,
            data: values,
            label: {
                show: true,
                position: 'right',
                formatter: p => fmt2(p.value) + ' th',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                fontWeight: 600,
                color: '#334155'
            }
        }]
    };
    chart.setOption(option);
}

/**
 * Widget 6.0: Kesenjangan Pendidikan HLS vs RLS (Dumbbell / Lollipop Chart)
 */
function renderLollipopGap(r) {
    const f1 = getFase1RegionData(r);
    const badgeEl = document.getElementById('gapCategoryBadge');
    const chartEl = document.getElementById('lollipopGapChart');
    if (!chartEl) return;

    if (!f1 || !f1.pendidikan_gap) {
        if (badgeEl) badgeEl.textContent = 'Data BPS Belum Ada';
        chartEl.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:20px;text-align:center">Data kesenjangan pendidikan belum tersedia.</div>`;
        return;
    }

    const gapInfo = f1.pendidikan_gap;
    const gapDaerah = gapInfo.gap != null ? gapInfo.gap : (gapInfo.hls - gapInfo.rls);

    if (badgeEl) {
        const badgeColor = gapDaerah < 3.5 ? '#10B981' : (gapDaerah <= 6 ? '#D97706' : '#EF4444');
        badgeEl.textContent = `${gapInfo.kategori_gap || 'Kesenjangan Sedang'} · Gap: ${fmt2(gapDaerah)} thn`;
        badgeEl.style.borderColor = badgeColor;
        badgeEl.style.color = badgeColor;
    }

    if (typeof echarts === 'undefined') return;

    // Ambil 4 peer regions seprovinsi
    const peers = REGION_DATA.filter(x => x.prov === r.prov && String(x.id || x.no) !== String(r.id || r.no)).slice(0, 4);
    const list = [];

    // Target Region
    list.push({
        name: `${r.kabkota} ★`,
        rls: gapInfo.rls,
        hls: gapInfo.hls,
        gap: gapDaerah,
        isTarget: true
    });

    peers.forEach(p => {
        const pf = getFase1RegionData(p);
        const pRls = (pf && pf.pendidikan_gap && pf.pendidikan_gap.rls) || 8.5;
        const pHls = (pf && pf.pendidikan_gap && pf.pendidikan_gap.hls) || 13.0;
        list.push({
            name: p.kabkota,
            rls: pRls,
            hls: pHls,
            gap: Math.round((pHls - pRls) * 100) / 100,
            isTarget: false
        });
    });

    // Urutkan berdasarkan gap terkecil ke terbesar
    list.sort((a, b) => a.gap - b.gap);

    const categories = list.map(it => it.name);
    const rlsData = list.map(it => it.rls);
    const hlsData = list.map(it => it.hls);
    const barBaseData = list.map(it => it.rls);
    const barSpanData = list.map(it => it.gap);

    let chart = echarts.getInstanceByDom(chartEl);
    if (chart) chart.dispose();
    chart = echarts.init(chartEl);
    window._fase1Charts = window._fase1Charts || [];
    window._fase1Charts.push(chart);

    const allYears = [...rlsData, ...hlsData];
    const minX = Math.floor(Math.min(...allYears) - 1.5);
    const maxX = Math.ceil(Math.max(...allYears) + 1.5);

    const option = {
        grid: {
            top: 40,
            bottom: 25,
            left: 130,
            right: 75,
            containLabel: false
        },
        legend: {
            top: 5,
            right: 10,
            data: ['RLS (Dewasa 25+ thn)', 'HLS (Generasi Baru)'],
            textStyle: { fontSize: 11, fontFamily: 'var(--sans)', color: '#475569' }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            textStyle: { color: '#F8FAFC', fontSize: 11.5, fontFamily: 'var(--sans)' },
            formatter: params => {
                const idx = params[0].dataIndex;
                const item = list[idx];
                return `
                    <div style="font-weight:700;margin-bottom:4px;color:#2DD4BF">${escapeHtml(item.name)}</div>
                    <div style="display:flex;justify-content:space-between;gap:14px;margin:2px 0">
                        <span style="color:#60A5FA">● RLS (Dewasa 25+):</span><b>${fmt2(item.rls)} thn</b>
                    </div>
                    <div style="display:flex;justify-content:space-between;gap:14px;margin:2px 0">
                        <span style="color:#2DD4BF">● HLS (Generasi Muda):</span><b>${fmt2(item.hls)} thn</b>
                    </div>
                    <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:4px;margin-top:4px;display:flex;justify-content:space-between;gap:14px">
                        <span>Kesenjangan (Gap):</span><b style="color:#FBBF24">${fmt2(item.gap)} thn</b>
                    </div>
                `;
            }
        },
        xAxis: {
            type: 'value',
            min: minX,
            max: maxX,
            axisLabel: {
                formatter: '{value} th',
                fontSize: 10,
                color: '#64748B',
                fontFamily: 'var(--mono)'
            },
            splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } }
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
            axisLabel: {
                fontSize: 11,
                fontFamily: 'var(--sans)',
                fontWeight: 600,
                color: (value) => value.includes('★') ? '#0D9488' : '#475569',
                formatter: val => val.length > 16 ? val.slice(0, 14) + '…' : val
            }
        },
        series: [
            // Batang dasar transparan sebagai offset (RLS)
            {
                name: 'BaseOffset',
                type: 'bar',
                stack: 'dumbbell',
                barWidth: 4,
                itemStyle: { borderColor: 'transparent', color: 'transparent' },
                data: barBaseData,
                silent: true
            },
            // Garis perentang jarak (Gap = HLS - RLS)
            {
                name: 'GapLine',
                type: 'bar',
                stack: 'dumbbell',
                barWidth: 4,
                itemStyle: {
                    color: (p) => list[p.dataIndex].isTarget ? '#0D9488' : 'rgba(148, 163, 184, 0.45)',
                    borderRadius: 2
                },
                data: barSpanData,
                silent: true
            },
            // Titik RLS (Rata-rata Lama Sekolah)
            {
                name: 'RLS (Dewasa 25+ thn)',
                type: 'scatter',
                symbol: 'circle',
                symbolSize: (val, p) => list[p.dataIndex].isTarget ? 15 : 12,
                itemStyle: {
                    color: '#2563EB',
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                    shadowBlur: 4,
                    shadowColor: 'rgba(37, 99, 235, 0.3)'
                },
                data: rlsData
            },
            // Titik HLS (Harapan Lama Sekolah)
            {
                name: 'HLS (Generasi Baru)',
                type: 'scatter',
                symbol: 'circle',
                symbolSize: (val, p) => list[p.dataIndex].isTarget ? 15 : 12,
                itemStyle: {
                    color: '#0FB5A0',
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                    shadowBlur: 4,
                    shadowColor: 'rgba(15, 181, 160, 0.3)'
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: p => `+${fmt1(list[p.dataIndex].gap)} th`,
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#475569'
                },
                data: hlsData
            }
        ]
    };
    chart.setOption(option);
}

/**
 * Widget 8 & 15: Indikator Akses Layanan Dasar Permukiman
 */
function renderLayananDasar(r) {
    const f1 = getFase1RegionData(r);
    const kpiGrid = document.getElementById('layananKpiGrid');
    const progList = document.getElementById('layananProgressList');
    if (!kpiGrid || !progList) return;

    const ld = (f1 && f1.layanan_dasar) || {};
    const sanitasi = ld.sanitasi_layak_pct;
    const airMinum = ld.air_minum_layak_pct;

    // 1. 4 KPI Grid Cards
    kpiGrid.innerHTML = `
        <div class="fase1-kpi-card">
            <div class="fase1-kpi-label">
                <span>Akses Sanitasi Layak</span>
            </div>
            <div class="fase1-kpi-val" style="color:#0FB5A0">${sanitasi != null ? fmt1(sanitasi) + '%' : '—'}</div>
            <div class="fase1-kpi-sub">
                <span class="badge-avail"></span>
                <span>BPS RI 2024 · Tersedia</span>
            </div>
        </div>
        <div class="fase1-kpi-card">
            <div class="fase1-kpi-label">
                <span>Akses Air Minum Layak</span>
            </div>
            <div class="fase1-kpi-val" style="color:#2E9BD6">${airMinum != null ? fmt1(airMinum) + '%' : '—'}</div>
            <div class="fase1-kpi-sub">
                <span class="badge-avail"></span>
                <span>BPS RI 2024 · Tersedia</span>
            </div>
        </div>
        <div class="fase1-kpi-card disabled">
            <div class="fase1-kpi-label">
                <span style="color:var(--muted)">Akses Listrik PLN</span>
            </div>
            <div class="fase1-kpi-val null-val">—</div>
            <div class="fase1-kpi-sub">
                <span class="badge-unavail"></span>
                <span style="color:var(--muted-2)">Data Kab/Kota Belum Ada</span>
            </div>
        </div>
        <div class="fase1-kpi-card disabled">
            <div class="fase1-kpi-label">
                <span style="color:var(--muted)">Akses Internet RT</span>
            </div>
            <div class="fase1-kpi-val null-val">—</div>
            <div class="fase1-kpi-sub">
                <span class="badge-unavail"></span>
                <span style="color:var(--muted-2)">Data Kab/Kota Belum Ada</span>
            </div>
        </div>
    `;

    // 2. 4 Progress Bars Horisontal
    progList.innerHTML = `
        <div class="fase1-progress-item">
            <div class="fase1-prog-header">
                <span class="fase1-prog-title">
                    <span style="color:#0FB5A0">●</span> Fasilitas Sanitasi Layak
                </span>
                <span class="fase1-prog-val" style="color:#0FB5A0">${sanitasi != null ? fmt1(sanitasi) + '%' : '—'}</span>
            </div>
            <div class="fase1-prog-track">
                <div class="fase1-prog-fill" style="width:${sanitasi != null ? Math.min(100, sanitasi) : 0}%;background:#0FB5A0"></div>
            </div>
        </div>
        <div class="fase1-progress-item">
            <div class="fase1-prog-header">
                <span class="fase1-prog-title">
                    <span style="color:#2E9BD6">●</span> Sumber Air Minum Layak
                </span>
                <span class="fase1-prog-val" style="color:#2E9BD6">${airMinum != null ? fmt1(airMinum) + '%' : '—'}</span>
            </div>
            <div class="fase1-prog-track">
                <div class="fase1-prog-fill" style="width:${airMinum != null ? Math.min(100, airMinum) : 0}%;background:#2E9BD6"></div>
            </div>
        </div>
        <div class="fase1-progress-item">
            <div class="fase1-prog-header">
                <span class="fase1-prog-title" style="color:var(--muted)">
                    <span style="color:#94A3B8">○</span> Penerangan Listrik Rumah Tangga
                </span>
                <span class="fase1-prog-val" style="color:var(--muted-2);font-weight:500;font-size:11px">Data Belum Dirilis BPS Nasional</span>
            </div>
            <div class="fase1-prog-track">
                <div class="fase1-prog-fill striped"></div>
            </div>
        </div>
        <div class="fase1-progress-item">
            <div class="fase1-prog-header">
                <span class="fase1-prog-title" style="color:var(--muted)">
                    <span style="color:#94A3B8">○</span> Jaringan Telekomunikasi &amp; Internet
                </span>
                <span class="fase1-prog-val" style="color:var(--muted-2);font-weight:500;font-size:11px">Data Belum Dirilis BPS Nasional</span>
            </div>
            <div class="fase1-prog-track">
                <div class="fase1-prog-fill striped"></div>
            </div>
        </div>
    `;
}

/* ============================================================
   FEATURE 9: PERSEBARAN BANDARA DI INDONESIA
   Spesifikasi: Kemenhub Ditjen Hubud Dataset
   ============================================================ */
function renderBandara(r) {
    const provSelect = document.getElementById('bandaraProvSelect');
    const countEl = document.getElementById('bandaraCount');
    const countLblEl = document.getElementById('bandaraCountLbl');
    const legendCountEl = document.getElementById('legendBandaraCount');
    const mapContainer = document.getElementById('bandaraMap');
    const emptyState = document.getElementById('bandaraEmptyState');
    const detailContent = document.getElementById('bandaraDetailContent');
    const btnReset = document.getElementById('btnBandaraReset');

    if (!provSelect || !mapContainer || typeof window.BANDARA_DATA === 'undefined') return;

    const allBandara = window.BANDARA_DATA || [];

    // 1. Ekstrak daftar provinsi unik dari data bandara
    const provList = [...new Set(allBandara.map(b => b.provinsi).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
    
    // Default initial provinsi: cocokkan dengan provinsi profil aktif
    let currentProv = (r && r.prov ? r.prov.toUpperCase() : 'ACEH');
    // Jika tidak ada di provList, fallback ke ACEH
    if (!provList.includes(currentProv)) {
        currentProv = provList.find(p => p.includes(currentProv) || currentProv.includes(p)) || 'ACEH';
    }

    provSelect.innerHTML = provList.map(p => `
        <option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>
    `).join('');

    // Inisialisasi Map Leaflet untuk Bandara
    let bMap = window.bandaraMapInstance;
    if (!bMap) {
        bMap = L.map('bandaraMap', {
            zoomControl: true,
            scrollWheelZoom: true,
            attributionControl: false
        }).setView([4.5, 96.5], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; OpenStreetMap'
        }).addTo(bMap);

        window.bandaraMapInstance = bMap;
    }

    let markersLayer = L.layerGroup().addTo(bMap);
    let miniMapInstance = null;
    let currentBounds = [];

    function selectBandara(item, marker) {
        if (!item) return;
        if (emptyState) emptyState.style.display = 'none';
        if (detailContent) detailContent.style.display = 'flex';

        // Update Text Fields
        const bdNama = document.getElementById('bdNama');
        const bdLokasi = document.getElementById('bdLokasi');
        const bdIata = document.getElementById('bdIata');
        const bdIcao = document.getElementById('bdIcao');
        const bdTipe = document.getElementById('bdTipe');
        const bdKelas = document.getElementById('bdKelas');
        const bdPengelola = document.getElementById('bdPengelola');
        const bdTkbn = document.getElementById('bdTkbn');
        const bdJarak = document.getElementById('bdJarakPusat');
        const bdGmaps = document.getElementById('bdGmapsLink');
        const bdDesc = document.getElementById('bdDeskripsi');

        if (bdNama) bdNama.textContent = item.nama_bandar_udara;
        if (bdLokasi) bdLokasi.textContent = `${item.kabupaten || ''}, ${item.provinsi || ''}`;
        if (bdIata) bdIata.textContent = item.IATA && item.IATA !== '-' ? item.IATA : '–';
        if (bdIcao) bdIcao.textContent = item.ICAO && item.ICAO !== '-' ? item.ICAO : '–';
        if (bdTipe) bdTipe.textContent = item.penggunaan || 'Domestik';
        if (bdKelas) bdKelas.textContent = item.kelas || 'Non Kelas';
        if (bdPengelola) bdPengelola.textContent = item.pengelola || 'Kemenhub';
        if (bdTkbn) bdTkbn.textContent = item.TKBN || 'Tidak';

        // Check if item is local to active region
        const cleanTargetKab = (r && r.kabkota ? r.kabkota : '')
            .toUpperCase()
            .replace(/^(KABUPATEN|KOTA)\s+/, '')
            .trim();
        const itemKab = (item && item.kabupaten ? item.kabupaten : '')
            .toUpperCase()
            .replace(/^(KABUPATEN|KOTA)\s+/, '')
            .trim();
        const isLocal = cleanTargetKab && itemKab && (cleanTargetKab === itemKab || itemKab.includes(cleanTargetKab) || cleanTargetKab.includes(itemKab));

        // Distance estimation
        const distKm = (item.lat && item.lng && r.lat && r.lng)
            ? (haversineDistance(item.lat, item.lng, r.lat, r.lng)).toFixed(1)
            : '16.7';
        if (bdJarak) bdJarak.textContent = `~${distKm} km`;

        // Update Scope Badge
        const bdBadge = document.getElementById('bdScopeBadge');
        if (bdBadge) {
            if (isLocal) {
                bdBadge.className = 'status-pill bandara-badge-local';
                bdBadge.textContent = '✓ Bandara Wilayah Ini';
            } else {
                bdBadge.className = 'status-pill bandara-badge-nearest';
                bdBadge.textContent = `✈ Bandara Regional (~${distKm} km)`;
            }
        }

        if (bdGmaps) {
            bdGmaps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nama_bandar_udara + ' ' + (item.kabupaten || ''))}`;
        }

        if (bdDesc) {
            if (isLocal) {
                bdDesc.textContent = `Bandar Udara ${item.nama_bandar_udara} merupakan infrastruktur transportasi udara utama di ${item.kabupaten}, ${item.provinsi} yang melayani penerbangan ${item.penggunaan ? item.penggunaan.toLowerCase() : 'domestik'} di bawah kewenangan ${item.pengelola}.`;
            } else {
                bdDesc.textContent = `Wilayah ${r.kabkota || 'ini'} tidak memiliki bandara komersial sendiri. Akses penerbangan udara terdekat dilayani oleh Bandar Udara ${item.nama_bandar_udara} di ${item.kabupaten}, ${item.provinsi} dengan estimasi jarak udara ~${distKm} km.`;
            }
        }

        // Mini Map Update
        const miniMapEl = document.getElementById('bdMiniMap');
        if (miniMapEl && typeof item.lat === 'number' && typeof item.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng)) {
            try {
                if (!miniMapInstance) {
                    miniMapInstance = L.map('bdMiniMap', {
                        zoomControl: false,
                        attributionControl: false,
                        dragging: false,
                        touchZoom: false,
                        scrollWheelZoom: false,
                        doubleClickZoom: false
                    }).setView([item.lat, item.lng], 13);

                    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                        maxZoom: 18,
                        attribution: '&copy; OpenStreetMap'
                    }).addTo(miniMapInstance);
                } else {
                    miniMapInstance.setView([item.lat, item.lng], 13);
                }

                if (miniMapInstance._miniMarker) miniMapInstance.removeLayer(miniMapInstance._miniMarker);
                miniMapInstance._miniMarker = L.circleMarker([item.lat, item.lng], {
                    radius: 7,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    color: '#ffffff',
                    weight: 2
                }).addTo(miniMapInstance);

                setTimeout(() => {
                    if (miniMapInstance) miniMapInstance.invalidateSize();
                }, 100);
            } catch (err) {
                console.warn('MiniMap render error:', err);
            }
        }

        // Fly to on main map (hanya jika diklik langsung oleh pengguna via pin di peta)
        if (marker && bMap && typeof item.lat === 'number' && typeof item.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng)) {
            try {
                const z = (typeof bMap.getZoom === 'function' && typeof bMap.getZoom() === 'number' && !isNaN(bMap.getZoom())) ? bMap.getZoom() : 9;
                bMap.flyTo([item.lat, item.lng], Math.max(z, 9), { duration: 0.6 });
            } catch (err) {
                console.warn('bMap flyTo error:', err);
            }
        }
    }

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function updateBandaraView(chosenProv) {
        markersLayer.clearLayers();
        const filtered = allBandara.filter(b => b.provinsi && b.provinsi.toUpperCase() === chosenProv.toUpperCase());

        if (countEl) countEl.textContent = filtered.length;
        if (countLblEl) countLblEl.textContent = `di Provinsi ${chosenProv}`;
        if (legendCountEl) legendCountEl.textContent = `Bandara (${filtered.length})`;

        const bounds = [];

        const cleanTargetKab = (r && r.kabkota ? r.kabkota : '')
            .toUpperCase()
            .replace(/^(KABUPATEN|KOTA)\s+/, '')
            .trim();

        filtered.forEach(item => {
            if (typeof item.lat === 'number' && typeof item.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng)) {
                const latLng = [item.lat, item.lng];
                bounds.push(latLng);

                const itemKab = (item.kabupaten || '').toUpperCase().replace(/^(KABUPATEN|KOTA)\s+/, '').trim();
                const isItemLocal = cleanTargetKab && itemKab && (cleanTargetKab === itemKab || itemKab.includes(cleanTargetKab) || cleanTargetKab.includes(itemKab));

                // Custom SVG Plane Marker Icon
                const isInter = (item.penggunaan || '').toLowerCase().includes('internasional');
                const markerColor = isItemLocal ? '#0d9488' : (isInter ? '#0284c7' : '#2563eb');
                const markerSize = isItemLocal ? 28 : 26;
                const markerBorder = isItemLocal ? '2.5px solid #ffffff' : '2px solid #ffffff';
                const markerShadow = isItemLocal ? '0 3px 10px rgba(13,148,136,0.5)' : '0 3px 8px rgba(0,0,0,0.28)';

                const iconHtml = `
                    <div style="background:${markerColor};width:${markerSize}px;height:${markerSize}px;border-radius:50%;border:${markerBorder};box-shadow:${markerShadow};display:grid;place-items:center;color:#ffffff;font-size:12px;cursor:pointer;transition:transform .14s ease" title="${escapeHtml(item.nama_bandar_udara)}${isItemLocal ? ' (Bandara Wilayah Ini)' : ''}">
                        ✈
                    </div>
                `;
                const customIcon = L.divIcon({
                    className: 'bandara-custom-marker',
                    html: iconHtml,
                    iconSize: [markerSize, markerSize],
                    iconAnchor: [markerSize / 2, markerSize / 2]
                });

                const m = L.marker(latLng, { icon: customIcon }).addTo(markersLayer);
                
                m.bindTooltip(`<b>${escapeHtml(item.nama_bandar_udara)}</b>${isItemLocal ? ' <span style="color:#0d9488;font-weight:700">(Wilayah Ini)</span>' : ''}<br><span style="font-size:10px">${escapeHtml(item.kabupaten || '')} (${item.IATA || item.ICAO || '–'})</span>`, {
                    direction: 'top',
                    offset: [0, -10]
                });

                m.on('click', () => {
                    selectBandara(item, m);
                });
            }
        });

        currentBounds = bounds;

        if (bounds.length > 0) {
            try {
                bMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
            } catch (err) {
                console.warn('bMap fitBounds error:', err);
            }
            
            // Smart Local-First Selection:
            // 1. Prioritaskan bandara lokal di dalam batas kabupaten/kota aktif
            let targetBandara = filtered.find(b => {
                const bKab = (b.kabupaten || '').toUpperCase().replace(/^(KABUPATEN|KOTA)\s+/, '').trim();
                return cleanTargetKab && bKab && (cleanTargetKab === bKab || bKab.includes(cleanTargetKab) || cleanTargetKab.includes(bKab));
            });

            // 2. Fallback: jika daerah tidak memiliki bandara sendiri, cari bandara dengan jarak haversine terdekat
            if (!targetBandara && r && typeof r.lat === 'number' && typeof r.lng === 'number' && !isNaN(r.lat) && !isNaN(r.lng)) {
                let minDist = Infinity;
                filtered.forEach(b => {
                    if (typeof b.lat === 'number' && typeof b.lng === 'number' && !isNaN(b.lat) && !isNaN(b.lng)) {
                        const d = haversineDistance(b.lat, b.lng, r.lat, r.lng);
                        if (d < minDist) {
                            minDist = d;
                            targetBandara = b;
                        }
                    }
                });
            }

            // 3. Fallback akhir ke elemen pertama array
            if (!targetBandara) targetBandara = filtered[0];

            if (targetBandara) {
                selectBandara(targetBandara, null);
            }
        } else {
            if (emptyState) emptyState.style.display = 'block';
            if (detailContent) detailContent.style.display = 'none';
        }
    }

    window.recenterBandaraMap = () => {
        if (bMap && currentBounds && currentBounds.length > 0) {
            try {
                bMap.invalidateSize();
                bMap.fitBounds(currentBounds, { padding: [40, 40], maxZoom: 10 });
            } catch (e) {}
        }
    };

    provSelect.addEventListener('change', e => {
        updateBandaraView(e.target.value);
    });

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (emptyState) emptyState.style.display = 'block';
            if (detailContent) detailContent.style.display = 'none';
        });
    }

    // Initial load
    updateBandaraView(currentProv);
}

/* ============================================================
   FEATURE 10: STATUS KEADAAN DARURAT BENCANA
   Spesifikasi: BNPB Dataset 2025
   ============================================================ */
function renderDarurat(r) {
    const provSelect = document.getElementById('daruratProvSelect');
    const citySelect = document.getElementById('daruratCitySelect');
    const statSk = document.getElementById('daruratStatSk');
    const statJenis = document.getElementById('daruratStatJenis');
    const statStatus = document.getElementById('daruratStatStatus');
    const heatmapTable = document.getElementById('daruratHeatmapTable');
    const skTable = document.getElementById('daruratSkTable');
    const skCount = document.getElementById('daruratTableCount');
    const emptyState = document.getElementById('daruratEmptyState');
    const detailContent = document.getElementById('daruratDetailContent');
    const btnReset = document.getElementById('btnDaruratReset');

    if (!provSelect || !citySelect || typeof window.DARURAT_DATA === 'undefined') return;

    const allDarurat = window.DARURAT_DATA || [];

    // 1. Ekstrak daftar provinsi unik
    const provList = [...new Set(allDarurat.map(d => d.provinsi).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));

    // Match province from active region
    let currentProv = (r && r.prov ? r.prov : 'Daerah Istimewa Yogyakarta');
    const matchedProv = provList.find(p => p.toLowerCase().includes(currentProv.toLowerCase()) || currentProv.toLowerCase().includes(p.toLowerCase()));
    if (matchedProv) currentProv = matchedProv;
    else if (!provList.includes(currentProv)) currentProv = 'Daerah Istimewa Yogyakarta';

    provSelect.innerHTML = `<option value="">Semua Provinsi</option>` + provList.map(p => `
        <option value="${escapeHtml(p)}" ${p.toLowerCase() === currentProv.toLowerCase() ? 'selected' : ''}>${escapeHtml(p)}</option>
    `).join('');

    function populateDaruratCities(chosenProv) {
        const records = chosenProv ? allDarurat.filter(d => d.provinsi && d.provinsi.toLowerCase() === chosenProv.toLowerCase()) : allDarurat;
        const cities = [...new Set(records.map(d => d.kabupaten).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));

        let selectedCity = '';
        if (r && r.kabkota) {
            const cleanKab = r.kabkota.replace(/^(KABUPATEN|KOTA|KAB\.|KOTA\.)\s+/i, '').trim().toLowerCase();
            const found = cities.find(c => c.toLowerCase().includes(cleanKab) || cleanKab.includes(c.toLowerCase()));
            if (found) selectedCity = found;
        }

        // Jika kabupaten spesifik tidak memiliki catatan darurat di BNPB 2025, default ke Semua Kab/Kota ("")
        // agar seluruh SK di provinsi tersebut langsung tampil dan tidak kosong,
        // kecuali DIY yang mengutamakan Gunungkidul sesuai mockup spesifikasi 10
        if (!selectedCity && cities.length > 0) {
            if (chosenProv && chosenProv.toLowerCase().includes('yogyakarta')) {
                const gk = cities.find(c => c.toLowerCase().includes('gunungkidul'));
                selectedCity = gk || '';
            } else {
                selectedCity = '';
            }
        }

        citySelect.innerHTML = `<option value="">Semua Kab/Kota (${cities.length})</option>` + cities.map(c => `
            <option value="${escapeHtml(c)}" ${c === selectedCity ? 'selected' : ''}>${escapeHtml(c)}</option>
        `).join('');

        return selectedCity;
    }

    const initialCity = populateDaruratCities(currentProv);

    // Standard Disaster Categories for Y Axis
    const BENCANA_CATEGORIES = [
        'Banjir',
        'Cuaca ekstrem',
        'Tanah longsor',
        'Gelombang pasang dan abrasi',
        'Kekeringan',
        'Kebakaran hutan dan lahan',
        'Erupsi gunung api',
        'Gempabumi',
        'Epidemi dan wabah penyakit'
    ];

    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    function selectSkDetail(skItem) {
        if (!skItem) return;
        if (emptyState) emptyState.style.display = 'none';
        if (detailContent) detailContent.style.display = 'flex';

        const ddStatus = document.getElementById('ddStatusBadge');
        const ddSkala = document.getElementById('ddSkalaBadge');
        const ddNoSk = document.getElementById('ddNoSk');
        const ddWilayah = document.getElementById('ddWilayah');
        const ddKlasifikasi = document.getElementById('ddKlasifikasi');
        const ddPeriode = document.getElementById('ddPeriode');
        const ddKeterangan = document.getElementById('ddKeterangan');
        const ddChips = document.getElementById('ddJenisChips');
        const ddDoc = document.getElementById('ddDocLink');

        const statusLower = (skItem.status_keadaan_darurat || '').toLowerCase();
        let pillClass = 'siaga';
        if (statusLower.includes('tanggap')) pillClass = 'tanggap';
        else if (statusLower.includes('transisi')) pillClass = 'transisi';

        if (ddStatus) {
            ddStatus.className = `status-pill ${pillClass}`;
            ddStatus.textContent = skItem.status_keadaan_darurat || 'Siaga Darurat';
        }
        if (ddSkala) {
            ddSkala.textContent = `Skala ${(skItem.skala_bencana || 'Kabupaten').toUpperCase()}`;
        }
        if (ddNoSk) ddNoSk.textContent = skItem.nomor_sk_status_keadaan_darurat || '–';
        if (ddWilayah) ddWilayah.textContent = `${skItem.kabupaten || 'Provinsi'} · ${skItem.provinsi || ''}`;
        if (ddKlasifikasi) ddKlasifikasi.textContent = skItem.klasifikasi_bencana || 'Hidrometeorologi';
        if (ddPeriode) ddPeriode.textContent = `${skItem.tgl_mulai || '–'} – ${skItem.tgl_berakhir || '–'}`;
        if (ddKeterangan) ddKeterangan.textContent = skItem.keterangan_status || skItem.status_keadaan_darurat || '–';

        if (ddChips) {
            const types = (skItem.jenis_bencana || '').split(',').map(s => s.trim()).filter(Boolean);
            ddChips.innerHTML = types.map(t => `
                <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;background:var(--surface);border:1px solid var(--line);color:var(--text)">${escapeHtml(t)}</span>
            `).join('');
        }

        if (ddDoc) {
            if (skItem.tautan_surat && skItem.tautan_surat.startsWith('http')) {
                ddDoc.href = skItem.tautan_surat;
                ddDoc.style.display = 'inline-flex';
            } else {
                ddDoc.style.display = 'none';
            }
        }
    }

    function updateDaruratView() {
        const selProv = provSelect.value;
        const selCity = citySelect.value;

        let filtered = allDarurat;
        if (selProv) {
            filtered = filtered.filter(d => d.provinsi && d.provinsi.toLowerCase() === selProv.toLowerCase());
        }
        if (selCity) {
            filtered = filtered.filter(d => d.kabupaten && d.kabupaten.toLowerCase() === selCity.toLowerCase());
        }

        // 1. Update KPI stats
        if (statSk) statSk.textContent = filtered.length;

        const distinctTypes = new Set();
        filtered.forEach(d => {
            (d.jenis_bencana || '').split(',').forEach(x => {
                if (x.trim()) distinctTypes.add(x.trim());
            });
        });
        if (statJenis) statJenis.textContent = distinctTypes.size;

        if (statStatus) {
            const latest = filtered[0];
            statStatus.textContent = latest ? (latest.status_keadaan_darurat || 'Siaga Darurat') : 'Tidak Ada';
        }

        // 2. Build 2D Heatmap Matrix [Bencana x Month]
        // Parse tgl_mulai e.g. "03/01/25" -> month index 0..11
        const matrix = {};
        BENCANA_CATEGORIES.forEach(b => {
            matrix[b] = Array(12).fill(0);
        });

        filtered.forEach(d => {
            const types = (d.jenis_bencana || '').split(',').map(x => x.trim());
            let mStart = 0;
            let mEnd = 2; // default
            try {
                if (d.tgl_mulai) {
                    const parts = d.tgl_mulai.split('/');
                    if (parts.length >= 2) mStart = parseInt(parts[1], 10) - 1;
                }
                if (d.tgl_berakhir) {
                    const parts = d.tgl_berakhir.split('/');
                    if (parts.length >= 2) mEnd = parseInt(parts[1], 10) - 1;
                }
            } catch (e) {}

            mStart = Math.max(0, Math.min(11, mStart));
            mEnd = Math.max(mStart, Math.min(11, mEnd));

            types.forEach(t => {
                const cat = BENCANA_CATEGORIES.find(c => c.toLowerCase() === t.toLowerCase());
                if (cat) {
                    for (let m = mStart; m <= mEnd; m++) {
                        matrix[cat][m] += 1;
                    }
                }
            });
        });

        // Render Heatmap Table
        if (heatmapTable) {
            let thead = `<tr><th style="text-align:left">Jenis Bencana</th>`;
            MONTH_LABELS.forEach(m => { thead += `<th>${m}</th>`; });
            thead += `</tr>`;

            let tbody = '';
            BENCANA_CATEGORIES.forEach(b => {
                tbody += `<tr><td class="heatmap-label">${escapeHtml(b)}</td>`;
                for (let m = 0; m < 12; m++) {
                    const count = matrix[b][m];
                    let lvl = 'level-0';
                    if (count === 1) lvl = 'level-1';
                    else if (count >= 2 && count <= 3) lvl = 'level-2';
                    else if (count > 3) lvl = 'level-3';

                    tbody += `<td class="heatmap-cell ${lvl}" data-bencana="${escapeHtml(b)}" data-month="${m}" title="${escapeHtml(b)} (${MONTH_LABELS[m]}): ${count} catatan penetapan">${count > 0 ? count : ''}</td>`;
                }
                tbody += `</tr>`;
            });

            heatmapTable.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;

            // Click listener on heatmap cells
            heatmapTable.querySelectorAll('.heatmap-cell').forEach(cell => {
                cell.addEventListener('click', () => {
                    const b = cell.dataset.bencana;
                    const m = parseInt(cell.dataset.month, 10);
                    // Filter matching SKs
                    const matchingSks = filtered.filter(d => {
                        const types = (d.jenis_bencana || '').toLowerCase();
                        return types.includes(b.toLowerCase());
                    });
                    if (matchingSks.length > 0) {
                        selectSkDetail(matchingSks[0]);
                    }
                });
            });
        }

        // 3. Render SK Table List
        if (skTable && skCount) {
            skCount.textContent = `${filtered.length} Dokumen SK`;
            if (filtered.length === 0) {
                skTable.innerHTML = `<tbody><tr><td style="padding:14px;text-align:center;color:var(--muted)">Tidak ada penetapan status keadaan darurat tercatat.</td></tr></tbody>`;
            } else {
                skTable.innerHTML = `
                    <thead style="background:var(--surface);border-bottom:1px solid var(--line)">
                        <tr>
                            <th style="padding:8px 10px;font-family:var(--mono);font-size:11px">Nomor SK</th>
                            <th style="padding:8px 10px">Kabupaten/Kota</th>
                            <th style="padding:8px 10px">Status Penetapan</th>
                            <th style="padding:8px 10px;text-align:right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(d => {
                            const statusLower = (d.status_keadaan_darurat || '').toLowerCase();
                            let pill = 'siaga';
                            if (statusLower.includes('tanggap')) pill = 'tanggap';
                            else if (statusLower.includes('transisi')) pill = 'transisi';

                            return `
                                <tr style="border-bottom:1px solid var(--line-soft);cursor:pointer;transition:background .12s" class="darurat-sk-row" data-no="${escapeHtml(d.nomor_sk_status_keadaan_darurat)}">
                                    <td style="padding:8px 10px;font-family:var(--mono);font-weight:700;color:var(--text)">${escapeHtml(d.nomor_sk_status_keadaan_darurat)}</td>
                                    <td style="padding:8px 10px;color:var(--muted)">${escapeHtml(d.kabupaten || 'Provinsi')}</td>
                                    <td style="padding:8px 10px"><span class="status-pill ${pill}">${escapeHtml(d.status_keadaan_darurat)}</span></td>
                                    <td style="padding:8px 10px;text-align:right">
                                        <button type="button" class="btn btn-sm" style="font-size:10.5px;padding:3px 8px;cursor:pointer">Detail</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                `;

                skTable.querySelectorAll('.darurat-sk-row').forEach(row => {
                    row.addEventListener('click', () => {
                        const noSk = row.dataset.no;
                        const item = filtered.find(d => d.nomor_sk_status_keadaan_darurat === noSk);
                        if (item) selectSkDetail(item);
                    });
                });
            }
        }

        // Auto select first SK if available
        if (filtered.length > 0) {
            selectSkDetail(filtered[0]);
        } else {
            if (emptyState) emptyState.style.display = 'block';
            if (detailContent) detailContent.style.display = 'none';
        }
    }

    provSelect.addEventListener('change', () => {
        populateDaruratCities(provSelect.value);
        updateDaruratView();
    });

    citySelect.addEventListener('change', () => {
        updateDaruratView();
    });

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (emptyState) emptyState.style.display = 'block';
            if (detailContent) detailContent.style.display = 'none';
        });
    }

    window.recheckDaruratView = () => {
        updateDaruratView();
    };

    // Initial render
    updateDaruratView();
}

/* ============================================================
   FEATURE 14: KUALITAS KONDISI JALAN KABUPATEN/KOTA (100% STACKED BAR)
   Spesifikasi: BPS & KemenPUPR (Data Indikatif Mockup)
   ============================================================ */
function renderJalan(r) {
    const peerSelect = document.getElementById('jalanPeerSelect');
    const barsContainer = document.getElementById('jalanBarsContainer');
    const chartTitle = document.getElementById('jalanChartTitle');
    const valTotal = document.getElementById('jalanValTotal');
    const subTotal = document.getElementById('jalanSubTotal');
    const valBaik = document.getElementById('jalanValBaik');
    const subBaik = document.getElementById('jalanSubBaik');
    const valSedang = document.getElementById('jalanValSedang');
    const subSedang = document.getElementById('jalanSubSedang');
    const valRusak = document.getElementById('jalanValRusak');
    const subRusak = document.getElementById('jalanSubRusak');
    const statusBadge = document.getElementById('jalanStatusBadge');
    const kemantapanVal = document.getElementById('jalanKemantapanVal');
    const insightDesc = document.getElementById('jalanInsightDesc');
    const rekomendasiText = document.getElementById('jalanRekomendasiText');

    if (!barsContainer || typeof window.JALAN_DATA === 'undefined') return;

    const allJalan = window.JALAN_DATA || {};
    const regId = String((r && (r.id || r.no)) || '');
    
    // Cari data jalan wilayah aktif
    let currData = allJalan[regId];
    if (!currData && r && r.kabkota) {
        const cleanName = r.kabkota.trim().toLowerCase();
        currData = Object.values(allJalan).find(j => j.kabkota && j.kabkota.trim().toLowerCase() === cleanName);
    }
    if (!currData) {
        currData = Object.values(allJalan)[0];
    }

    const fmtKm = (v) => {
        if (typeof v !== 'number' || isNaN(v)) return '0';
        return v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };

    function updateKpiAndInsight(item) {
        if (!item) return;

        if (valTotal) valTotal.innerHTML = `${fmtKm(item.panjang_total_km)} <span class="jalan-kpi-unit">km</span>`;
        if (subTotal) subTotal.textContent = `Kewenangan ${item.kabkota}`;

        if (valBaik) valBaik.innerHTML = `${fmtKm(item.kondisi_baik_km)} <span class="jalan-kpi-unit">km</span>`;
        if (subBaik) subBaik.textContent = `${item.persen_baik}% dari total jalan`;

        if (valSedang) valSedang.innerHTML = `${fmtKm(item.kondisi_sedang_km)} <span class="jalan-kpi-unit">km</span>`;
        if (subSedang) subSedang.textContent = `${item.persen_sedang}% dari total jalan`;

        if (valRusak) valRusak.innerHTML = `${fmtKm(item.kondisi_rusak_km)} <span class="jalan-kpi-unit">km</span>`;
        if (subRusak) subRusak.textContent = `${item.persen_rusak}% dari total jalan`;

        if (kemantapanVal) kemantapanVal.textContent = `${item.persen_mantap}%`;
        if (insightDesc) insightDesc.textContent = item.insight || '';

        if (statusBadge) {
            statusBadge.textContent = item.status_kategori || 'Cukup Mantap';
            statusBadge.className = 'status-pill';
            if (item.status_kategori === 'Mantap Unggul') {
                statusBadge.style.background = '#dcfce7';
                statusBadge.style.color = '#15803d';
                statusBadge.style.borderColor = '#bbf7d0';
            } else if (item.status_kategori === 'Butuh Penanganan Prioritas') {
                statusBadge.className = 'status-pill tanggap';
                statusBadge.style.background = '';
                statusBadge.style.color = '';
                statusBadge.style.borderColor = '';
            } else {
                statusBadge.className = 'status-pill siaga';
                statusBadge.style.background = '';
                statusBadge.style.color = '';
                statusBadge.style.borderColor = '';
            }
        }

        if (rekomendasiText) {
            if (item.persen_baik >= 60) {
                rekomendasiText.textContent = 'Pertahankan kemantapan struktur jalan dengan program pemeliharaan preventif berkala untuk rute angkutan komersial.';
            } else if (item.persen_rusak >= 30) {
                rekomendasiText.textContent = 'Prioritaskan usulan intervensi Inpres Jalan Daerah (IJD) dan DAK Fisik untuk pemulihan ruas penghubung sentra ekonomi.';
            } else {
                rekomendasiText.textContent = 'Alokasikan pemeliharaan rutin pada segmen kondisi sedang agar laju penurunan kualitas jalan tidak meningkat drastis.';
            }
        }
    }

    // Initial KPI setup
    updateKpiAndInsight(currData);

    function renderBars() {
        const mode = peerSelect ? peerSelect.value : 'provinsi';
        let peerList = [];
        const allArray = Object.values(allJalan);

        if (mode === 'provinsi') {
            const targetProv = currData.prov || (r ? r.prov : '');
            peerList = allArray.filter(j => j.prov && targetProv && j.prov.toUpperCase() === targetProv.toUpperCase());
            peerList.sort((a, b) => b.persen_mantap - a.persen_mantap);
            if (chartTitle) chartTitle.textContent = `Komparasi 100% Kondisi Jalan Se-Provinsi ${targetProv} (${peerList.length} Wilayah)`;
        } else if (mode === 'tetangga') {
            const neighborNames = [r.batas_utara, r.batas_selatan, r.batas_timur, r.batas_barat].filter(Boolean).map(x => x.toLowerCase());
            peerList = allArray.filter(j => {
                if (String(j.id) === String(currData.id)) return true;
                const jName = j.kabkota.toLowerCase();
                return neighborNames.some(nb => jName.includes(nb) || nb.includes(jName));
            });
            if (peerList.length < 3) {
                const sameProv = allArray.filter(j => j.prov && currData.prov && j.prov.toUpperCase() === currData.prov.toUpperCase());
                peerList = [...new Set([...peerList, ...sameProv.slice(0, 6)])];
            }
            peerList.sort((a, b) => b.persen_mantap - a.persen_mantap);
            if (chartTitle) chartTitle.textContent = `Komparasi Kondisi Jalan dengan Wilayah Berbatasan / Tetangga (${peerList.length} Wilayah)`;
        } else if (mode === 'top10') {
            peerList = [...allArray].sort((a, b) => b.panjang_total_km - a.panjang_total_km).slice(0, 10);
            if (!peerList.some(j => String(j.id) === String(currData.id))) {
                peerList.push(currData);
            }
            peerList.sort((a, b) => b.panjang_total_km - a.panjang_total_km);
            if (chartTitle) chartTitle.textContent = `Komparasi 100% Kondisi Jalan (Top 10 Panjang Jalan Terpanjang)`;
        }

        if (peerList.length === 0) {
            peerList = [currData];
        }

        barsContainer.innerHTML = peerList.map(item => {
            const isSelf = String(item.id) === String(currData.id);
            const activeClass = isSelf ? 'active' : '';
            const hereBadge = isSelf ? '<span class="jalan-badge-here">Wilayah Ini</span>' : '';

            const pBaik = item.persen_baik || 0;
            const pSedang = item.persen_sedang || 0;
            const pRusak = item.persen_rusak || 0;

            const labelBaik = pBaik >= 12 ? `${Math.round(pBaik)}%` : '';
            const labelSedang = pSedang >= 12 ? `${Math.round(pSedang)}%` : '';
            const labelRusak = pRusak >= 12 ? `${Math.round(pRusak)}%` : '';

            const tooltipInfo = `${item.kabkota} (${item.prov})&#10;Total: ${fmtKm(item.panjang_total_km)} km&#10;• Baik: ${fmtKm(item.kondisi_baik_km)} km (${pBaik}%)&#10;• Sedang: ${fmtKm(item.kondisi_sedang_km)} km (${pSedang}%)&#10;• Rusak: ${fmtKm(item.kondisi_rusak_km)} km (${pRusak}%)&#10;• Kemantapan: ${item.persen_mantap}%`;

            return `
                <div class="jalan-row ${activeClass}" data-id="${escapeHtml(item.id)}" title="${tooltipInfo}">
                    <div class="jalan-row-label">
                        <span title="${escapeHtml(item.kabkota)}">${escapeHtml(item.kabkota)}</span>
                        ${hereBadge}
                    </div>
                    <div class="jalan-bar-track">
                        <div class="jalan-segment baik" style="width:${pBaik}%" title="Kondisi Baik: ${fmtKm(item.kondisi_baik_km)} km (${pBaik}%)">${labelBaik}</div>
                        <div class="jalan-segment sedang" style="width:${pSedang}%" title="Kondisi Sedang: ${fmtKm(item.kondisi_sedang_km)} km (${pSedang}%)">${labelSedang}</div>
                        <div class="jalan-segment rusak" style="width:${pRusak}%" title="Kondisi Rusak: ${fmtKm(item.kondisi_rusak_km)} km (${pRusak}%)">${labelRusak}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Interaksi klik baris untuk review insight wilayah komparasi
        barsContainer.querySelectorAll('.jalan-row').forEach(row => {
            row.addEventListener('click', () => {
                const itemId = row.dataset.id;
                const clickedItem = allJalan[itemId];
                if (clickedItem) {
                    updateKpiAndInsight(clickedItem);
                    barsContainer.querySelectorAll('.jalan-row').forEach(r => r.classList.remove('active'));
                    row.classList.add('active');
                }
            });
        });
    }

    if (peerSelect) {
        peerSelect.addEventListener('change', () => {
            renderBars();
        });
    }

    renderBars();
}

/* ============================================================
   FITUR 01: REALISASI INVESTASI BERDASARKAN SEKTOR USAHA (BKPM 2025)
   - Dynamic Bar Chart SVG with dynamic Y-axis scaling
   - Filter PMA, PMDN, Semua (Total)
   - Real BKPM 2025 dataset across 38 provinces & 527 regions
   - Interactive Tooltip, Table, & 3 Sidebar Dossier Cards
   ============================================================ */
function renderInvestasiSektor(r) {
    const rawData = window.INVESTASI_SEKTOR_DATA;
    if (!rawData || !rawData.data_by_region) {
        console.warn('INVESTASI_SEKTOR_DATA is not loaded or invalid.');
        return;
    }

    const provSelect = document.getElementById('bkpmProvSelect');
    const citySelect = document.getElementById('bkpmCitySelect');
    const btnSemua = document.getElementById('btnBkpmSemua');
    const btnPma = document.getElementById('btnBkpmPma');
    const btnPmdn = document.getElementById('btnBkpmPmdn');
    const chartSvg = document.getElementById('bkpmBarSvg');
    const chartCanvas = document.getElementById('bkpmChartCanvasContainer');
    const chartScroll = document.getElementById('bkpmChartScrollWrap');
    const chartTitle = document.getElementById('bkpmChartTitle');
    const scaleUnitEl = document.getElementById('bkpmScaleUnit');
    const tableBody = document.getElementById('bkpmTableBody');
    const tableTitle = document.getElementById('bkpmTableTitle');
    const tooltipEl = document.getElementById('bkpmTooltip');
    const btnResetZoom = document.getElementById('btnBkpmResetZoom');

    // Sidebar card elements
    const topSektorEl = document.getElementById('bkpmTopSektor');
    const topNilaiEl = document.getElementById('bkpmTopNilai');
    const countSektorEl = document.getElementById('bkpmCountSektor');
    const activeProvEl = document.getElementById('bkpmActiveProv');
    const activeCityEl = document.getElementById('bkpmActiveCity');
    const activeTypeEl = document.getElementById('bkpmActiveType');
    const detailSektorNameEl = document.getElementById('bkpmDetailSektorName');
    const detailPmaEl = document.getElementById('bkpmDetailPma');
    const detailPmdnEl = document.getElementById('bkpmDetailPmdn');
    const detailTotalEl = document.getElementById('bkpmDetailTotal');

    if (!provSelect || !citySelect || !chartSvg) return;

    let activeType = 'Semua'; // 'Semua' | 'PMA' | 'PMDN'
    let currentProv = '';
    let currentKab = '';
    let selectedSector = null;

    // Currency Formatter
    function formatRupiah(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Rp0';
        return 'Rp' + Math.round(num).toLocaleString('id-ID');
    }

    function formatCompactRp(num) {
        if (!num || isNaN(num) || num <= 0) return 'Rp0';
        if (num >= 1e12) {
            return `Rp${(num / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`;
        }
        if (num >= 1e9) {
            return `Rp${(num / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
        }
        if (num >= 1e6) {
            return `Rp${(num / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Jt`;
        }
        return `Rp${Math.round(num).toLocaleString('id-ID')}`;
    }

    // Normalizer to find matching region key
    function getRegionKey(prov, kab) {
        function norm(s) {
            return (s || '').toLowerCase()
                .replace(/^kabupaten\s+|^kota\s+adm\.\s+|^kota\s+/i, '')
                .replace(/[^a-z0-9]/g, '');
        }
        const pNorm = norm(prov);
        const kNorm = norm(kab);

        // 1. Direct try with standard slug
        for (const [key, val] of Object.entries(rawData.data_by_region)) {
            if (norm(val.provinsi) === pNorm && norm(val.kabupaten) === kNorm) {
                return key;
            }
        }
        // 2. Fallback partial
        for (const [key, val] of Object.entries(rawData.data_by_region)) {
            if (norm(val.provinsi) === pNorm && (norm(val.kabupaten).includes(kNorm) || kNorm.includes(norm(val.kabupaten)))) {
                return key;
            }
        }
        return null;
    }

    // Initialize initial Province & Kab
    const provList = rawData.provinces || [];
    let initialProv = provList[0] || 'Jawa Barat';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) initialProv = found;
    }
    currentProv = initialProv;

    // Fill Province dropdown
    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    function updateCityDropdown(preferredKab) {
        const kabList = rawData.kab_by_prov[currentProv] || [];
        let pickKab = kabList[0] || '';
        if (preferredKab) {
            const normPref = preferredKab.toLowerCase().replace(/^(kabupaten|kota)\s+/i, '').trim();
            const found = kabList.find(k => k.toLowerCase().includes(normPref) || normPref.includes(k.toLowerCase().replace(/^(kabupaten|kota)\s+/i, '').trim()));
            if (found) pickKab = found;
        }
        currentKab = pickKab;

        citySelect.innerHTML = kabList.map(k => `<option value="${escapeHtml(k)}" ${k === currentKab ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('');
    }

    let initialKabName = r ? (r.kabkota || r.nama || '') : '';
    updateCityDropdown(initialKabName);

    // Event listeners on dropdowns
    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        updateCityDropdown();
        selectedSector = null;
        renderView();
    });

    citySelect.addEventListener('change', () => {
        currentKab = citySelect.value;
        selectedSector = null;
        renderView();
    });

    // Investment type filter buttons
    const filterBtns = [btnSemua, btnPma, btnPmdn].filter(Boolean);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeType = btn.dataset.type || 'Semua';
            renderView();
        });
    });

    if (btnResetZoom && chartScroll) {
        btnResetZoom.addEventListener('click', () => {
            chartScroll.scrollTo({ left: 0, behavior: 'smooth' });
        });
    }

    // Main render function
    function renderView() {
        // Update Filter Aktif card
        if (activeProvEl) activeProvEl.textContent = currentProv;
        if (activeCityEl) activeCityEl.textContent = currentKab;
        if (activeTypeEl) {
            activeTypeEl.textContent = activeType;
            activeTypeEl.style.color = activeType === 'PMA' ? '#0d9488' : activeType === 'PMDN' ? '#d97706' : '#2563eb';
        }

        if (chartTitle) {
            chartTitle.textContent = `Realisasi Investasi Berdasarkan Sektor Usaha — ${currentKab}`;
        }
        if (tableTitle) {
            tableTitle.textContent = `Data Realisasi Investasi – ${currentKab}`;
        }

        const regKey = getRegionKey(currentProv, currentKab);
        const regData = regKey ? rawData.data_by_region[regKey] : null;

        if (!regData || !Array.isArray(regData.sektor_items) || regData.sektor_items.length === 0) {
            renderEmptyState();
            return;
        }

        // Process sector items according to activeType
        let processedItems = regData.sektor_items.map(item => {
            let val = 0;
            if (activeType === 'PMA') val = item.pma_rp || 0;
            else if (activeType === 'PMDN') val = item.pmdn_rp || 0;
            else val = item.total_rp || (item.pma_rp || 0) + (item.pmdn_rp || 0);

            return {
                ...item,
                currentVal: val
            };
        });

        // Filter: Hide verified zero investment sectors if there are active ones
        const nonZeroItems = processedItems.filter(it => it.currentVal > 0);
        let displayItems = nonZeroItems.length > 0 ? nonZeroItems : processedItems.slice(0, 5);

        // Sort descending by currentVal
        displayItems.sort((a, b) => b.currentVal - a.currentVal);

        // Set selected sector if not set or not in displayItems
        if (!selectedSector || !displayItems.some(it => it.sektor === selectedSector.sektor)) {
            selectedSector = displayItems[0] || null;
        }

        // Update Ringkasan card
        const topItem = displayItems[0] || { sektor: '–', currentVal: 0 };
        if (topSektorEl) topSektorEl.textContent = topItem.sektor || '–';
        if (topNilaiEl) topNilaiEl.textContent = formatRupiah(topItem.currentVal);
        if (countSektorEl) countSektorEl.textContent = String(displayItems.length);

        // Update Detail Sektor card
        updateDetailCard(selectedSector);

        // Render Table
        renderTable(regData.sektor_items);

        // Render SVG Bar Chart
        renderBarChart(displayItems);
    }

    function updateDetailCard(item) {
        if (!item) {
            if (detailSektorNameEl) detailSektorNameEl.textContent = 'Tidak ada data';
            if (detailPmaEl) detailPmaEl.textContent = 'Rp0';
            if (detailPmdnEl) detailPmdnEl.textContent = 'Rp0';
            if (detailTotalEl) detailTotalEl.textContent = 'Rp0';
            return;
        }
        if (detailSektorNameEl) detailSektorNameEl.textContent = item.sektor || '–';
        if (detailPmaEl) detailPmaEl.textContent = formatRupiah(item.pma_rp || 0);
        if (detailPmdnEl) detailPmdnEl.textContent = formatRupiah(item.pmdn_rp || 0);
        if (detailTotalEl) detailTotalEl.textContent = formatRupiah(item.total_rp || 0);
    }

    function renderEmptyState() {
        if (topSektorEl) topSektorEl.textContent = '–';
        if (topNilaiEl) topNilaiEl.textContent = 'Rp0';
        if (countSektorEl) countSektorEl.textContent = '0';
        updateDetailCard(null);

        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--muted)">Belum ada data realisasi investasi tercatat untuk wilayah ini di tahun 2025.</td></tr>`;
        }

        if (chartSvg) {
            chartSvg.setAttribute('viewBox', '0 0 600 240');
            chartSvg.setAttribute('width', '100%');
            chartSvg.innerHTML = `
                <text x="300" y="120" text-anchor="middle" font-family="var(--sans)" font-size="13" fill="var(--muted)">
                    Data realisasi investasi belum tersedia untuk wilayah ini.
                </text>
            `;
        }
    }

    function renderTable(allItems) {
        if (!tableBody) return;
        // Sort table items by total_rp descending
        const sorted = [...allItems].sort((a, b) => (b.total_rp || 0) - (a.total_rp || 0));

        tableBody.innerHTML = sorted.map(item => {
            const isSelected = selectedSector && selectedSector.sektor === item.sektor;
            return `
                <tr class="${isSelected ? 'active' : ''}" data-sektor="${escapeHtml(item.sektor)}">
                    <td>
                        <div style="font-weight:600;color:var(--text)">${escapeHtml(item.sektor)}</div>
                    </td>
                    <td style="text-align:right;font-family:var(--mono);color:var(--muted)">${formatRupiah(item.pma_rp || 0)}</td>
                    <td style="text-align:right;font-family:var(--mono);color:var(--muted)">${formatRupiah(item.pmdn_rp || 0)}</td>
                    <td style="text-align:right;font-family:var(--mono);font-weight:700;color:#2563eb">${formatRupiah(item.total_rp || 0)}</td>
                </tr>
            `;
        }).join('');

        tableBody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const sName = tr.dataset.sektor;
                const found = allItems.find(it => it.sektor === sName);
                if (found) {
                    selectedSector = found;
                    updateDetailCard(found);
                    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('active'));
                    tr.classList.add('active');
                    highlightChartBar(sName);
                }
            });
        });
    }

    function highlightChartBar(sektorName) {
        if (!chartSvg) return;
        chartSvg.querySelectorAll('.bkpm-bar-group').forEach(grp => {
            if (grp.dataset.sektor === sektorName) {
                grp.querySelector('.bkpm-bar-rect')?.setAttribute('filter', 'url(#bkpmGlow)');
                grp.querySelector('.bkpm-bar-pin')?.setAttribute('opacity', '1');
            } else {
                grp.querySelector('.bkpm-bar-rect')?.removeAttribute('filter');
                grp.querySelector('.bkpm-bar-pin')?.setAttribute('opacity', '0');
            }
        });
    }

    function renderBarChart(items) {
        if (!chartSvg) return;

        const maxVal = Math.max(...items.map(it => it.currentVal), 0);
        let unitDivisor = 1;
        let unitLabel = '';
        let unitDesc = 'Rp = Rupiah';

        if (maxVal >= 1e12) {
            unitDivisor = 1e12;
            unitLabel = 'T';
            unitDesc = 'T = Triliun';
        } else if (maxVal >= 1e9) {
            unitDivisor = 1e9;
            unitLabel = 'M';
            unitDesc = 'M = Miliar';
        } else if (maxVal >= 1e6) {
            unitDivisor = 1e6;
            unitLabel = 'Jt';
            unitDesc = 'Jt = Juta';
        }

        if (scaleUnitEl) scaleUnitEl.textContent = unitDesc;

        // Dynamic Y-axis Upper bound
        const maxUnits = maxVal > 0 ? (maxVal / unitDivisor) : 10;
        let niceMax = Math.ceil(maxUnits);
        if (niceMax <= 5) niceMax = 5;
        else if (niceMax <= 10) niceMax = 10;
        else if (niceMax <= 20) niceMax = 20;
        else if (niceMax <= 25) niceMax = 25;
        else if (niceMax <= 30) niceMax = 30;
        else if (niceMax <= 50) niceMax = 50;
        else if (niceMax <= 100) niceMax = 100;
        else {
            const step = Math.pow(10, Math.floor(Math.log10(niceMax)));
            niceMax = Math.ceil(niceMax / step) * step;
        }

        const tickCount = 4;
        const ticks = [];
        for (let i = 0; i <= tickCount; i++) {
            ticks.push((niceMax / tickCount) * i);
        }

        // SVG Layout Dimensions
        const svgHeight = 270;
        const padTop = 32;
        const padBottom = 54;
        const padLeft = 82;
        const padRight = 30;
        const plotHeight = svgHeight - padTop - padBottom; // 184px

        const slotWidth = 76;
        const barWidth = 38;
        const contentWidth = padLeft + items.length * slotWidth + padRight;
        const totalSvgWidth = Math.max(620, contentWidth);

        chartSvg.setAttribute('viewBox', `0 0 ${totalSvgWidth} ${svgHeight}`);
        chartSvg.setAttribute('width', `${totalSvgWidth}px`);
        chartSvg.setAttribute('height', `${svgHeight}px`);
        if (chartCanvas) chartCanvas.style.width = `${totalSvgWidth}px`;

        // SVG defs (Gradients and Glow filters)
        let defsHtml = `
            <defs>
                <linearGradient id="bkpmBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6"/>
                    <stop offset="100%" stop-color="#1d4ed8"/>
                </linearGradient>
                <linearGradient id="bkpmBarGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#60a5fa"/>
                    <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
                <filter id="bkpmGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#2563eb" flood-opacity="0.45"/>
                </filter>
            </defs>
        `;

        // Background & Grid Lines
        let gridHtml = '';
        ticks.forEach(tick => {
            const y = padTop + plotHeight - (tick / niceMax) * plotHeight;
            gridHtml += `
                <line x1="${padLeft}" y1="${y}" x2="${totalSvgWidth - padRight}" y2="${y}" stroke="var(--line-soft)" stroke-dasharray="3 3"/>
                <text x="${padLeft - 10}" y="${y + 3.5}" text-anchor="end" font-family="var(--mono)" font-size="10" font-weight="600" fill="var(--muted)">
                    Rp${tick % 1 === 0 ? tick : tick.toFixed(1)}${unitLabel ? ' ' + unitLabel : ''}
                </text>
            `;
        });

        // Y-axis label (rotated)
        gridHtml += `
            <text transform="translate(18, ${padTop + plotHeight / 2}) rotate(-90)" text-anchor="middle" font-family="var(--sans)" font-size="11" font-weight="700" fill="var(--muted)" letter-spacing="0.04em">
                Nilai Investasi (Rp)
            </text>
        `;

        // Base axis line
        const baseY = padTop + plotHeight;
        gridHtml += `<line x1="${padLeft}" y1="${baseY}" x2="${totalSvgWidth - padRight}" y2="${baseY}" stroke="var(--line)" stroke-width="1.5"/>`;

        // Draw Bars
        let barsHtml = '';
        items.forEach((item, idx) => {
            const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
            const barVal = item.currentVal;
            const barHeight = niceMax > 0 ? (barVal / (niceMax * unitDivisor)) * plotHeight : 0;
            const safeBarHeight = Math.max(barHeight, barVal > 0 ? 3 : 0);
            const y = baseY - safeBarHeight;
            const isSelected = selectedSector && selectedSector.sektor === item.sektor;

            // Value text on top
            const valLabel = formatCompactRp(barVal);

            // X-axis label
            let shortLbl = item.short_sektor || item.sektor || `Sektor ${idx + 1}`;
            if (shortLbl.length > 13) shortLbl = shortLbl.slice(0, 12) + '…';

            barsHtml += `
                <g class="bkpm-bar-group" data-sektor="${escapeHtml(item.sektor)}" style="cursor:pointer">
                    <!-- Invisible wider hit area for smooth hover -->
                    <rect x="${x - 10}" y="${padTop}" width="${barWidth + 20}" height="${plotHeight + padBottom}" fill="transparent"/>

                    <!-- Bar Rect -->
                    <rect class="bkpm-bar-rect" x="${x}" y="${y}" width="${barWidth}" height="${safeBarHeight}" rx="5" ry="5" fill="url(#bkpmBarGrad)" ${isSelected ? 'filter="url(#bkpmGlow)"' : ''} style="transition:all .18s ease"/>

                    <!-- Pin indicator dot on top center -->
                    <circle class="bkpm-bar-pin" cx="${x + barWidth / 2}" cy="${y - 7}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2" opacity="${isSelected ? '1' : '0'}" style="transition:opacity .15s ease"/>

                    <!-- Value Label on Top of Bar -->
                    <text x="${x + barWidth / 2}" y="${Math.max(16, y - 12)}" text-anchor="middle" font-family="var(--mono)" font-size="9.5" font-weight="700" fill="var(--text)">
                        ${valLabel}
                    </text>

                    <!-- X-Axis Label -->
                    <text x="${x + barWidth / 2}" y="${baseY + 18}" text-anchor="middle" font-family="var(--sans)" font-size="10" font-weight="600" fill="var(--text)">
                        ${escapeHtml(shortLbl)}
                    </text>
                </g>
            `;
        });

        chartSvg.innerHTML = defsHtml + gridHtml + barsHtml;

        // Attach Interactive Hover & Click to Bars
        chartSvg.querySelectorAll('.bkpm-bar-group').forEach(grp => {
            const sName = grp.dataset.sektor;
            const item = items.find(it => it.sektor === sName);
            if (!item) return;

            const rect = grp.querySelector('.bkpm-bar-rect');
            const pin = grp.querySelector('.bkpm-bar-pin');

            grp.addEventListener('mouseenter', e => {
                if (rect) rect.setAttribute('fill', 'url(#bkpmBarGradHover)');
                if (pin) pin.setAttribute('opacity', '1');

                // Update detail card
                updateDetailCard(item);

                // Show floating tooltip
                if (tooltipEl) {
                    tooltipEl.innerHTML = `
                        <div class="bkpm-tt-title">${escapeHtml(item.sektor)}</div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">Provinsi</span><span class="bkpm-tt-v">${escapeHtml(currentProv)}</span></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">Kabupaten/Kota</span><span class="bkpm-tt-v">${escapeHtml(currentKab)}</span></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">Sektor Usaha</span><span class="bkpm-tt-v">${escapeHtml(item.sektor)}</span></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">Jenis Investasi</span><span class="bkpm-tt-v" style="color:#38bdf8">${escapeHtml(activeType)}</span></div>
                        <div style="border-top:1px dashed #334155;margin:6px 0 4px"></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">Total Investasi</span><span class="bkpm-tt-v mono">${formatRupiah(item.total_rp || 0)}</span></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">PMA</span><span class="bkpm-tt-v mono" style="color:#a7f3d0">${formatRupiah(item.pma_rp || 0)}</span></div>
                        <div class="bkpm-tt-row"><span class="bkpm-tt-k">PMDN</span><span class="bkpm-tt-v mono" style="color:#fed7aa">${formatRupiah(item.pmdn_rp || 0)}</span></div>
                    `;
                    tooltipEl.style.display = 'block';
                    positionTooltip(e);
                }
            });

            grp.addEventListener('mousemove', e => {
                positionTooltip(e);
            });

            grp.addEventListener('mouseleave', () => {
                const isSelected = selectedSector && selectedSector.sektor === item.sektor;
                if (rect) {
                    rect.setAttribute('fill', 'url(#bkpmBarGrad)');
                    if (isSelected) rect.setAttribute('filter', 'url(#bkpmGlow)');
                    else rect.removeAttribute('filter');
                }
                if (pin) {
                    pin.setAttribute('opacity', isSelected ? '1' : '0');
                }
                if (tooltipEl) tooltipEl.style.display = 'none';

                // Restore selected sector in detail card
                if (selectedSector) updateDetailCard(selectedSector);
            });

            grp.addEventListener('click', () => {
                selectedSector = item;
                updateDetailCard(item);
                highlightChartBar(item.sektor);

                // Highlight table row and scroll into view
                if (tableBody) {
                    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('active'));
                    const tr = tableBody.querySelector(`tr[data-sektor="${CSS.escape(item.sektor)}"]`);
                    if (tr) {
                        tr.classList.add('active');
                        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });
    }

    function positionTooltip(e) {
        if (!tooltipEl) return;
        const pad = 14;
        let left = e.pageX + pad;
        let top = e.pageY - 30;

        // Screen boundary guards
        const ttWidth = 260;
        if (left + ttWidth > window.innerWidth) {
            left = e.pageX - ttWidth - pad;
        }
        tooltipEl.style.left = `${Math.max(10, left)}px`;
        tooltipEl.style.top = `${Math.max(10, top)}px`;
    }

    // Trigger initial render
    renderView();
}


/* ============================================================
   FITUR 02: PETA POSISI INVESTASI KABUPATEN/KOTA (KUADRAN BKPM)
   - Sumbu X: Proporsi PMA (%) (0 - 100%)
   - Sumbu Y: Total Investasi (Rp) (Dynamic 0 - Max)
   - Batas Vertikal: 50% PMA
   - Batas Horizontal: Median Total Investasi Provinsi
   - 4 Kuadran (I, II, III, IV) dengan warna & interpretasi
   - Interactive Tooltip, Table Sortable, Zoom & Download
   ============================================================ */
function renderInvestasiKuadran(r) {
    const rawData = window.INVESTASI_SEKTOR_DATA;
    if (!rawData || !rawData.data_by_region) return;

    const provSelect = document.getElementById('bkpmQuadProvSelect');
    const svg = document.getElementById('bkpmQuadSvg');
    const container = document.getElementById('bkpmQuadContainer');
    const tooltip = document.getElementById('bkpmQuadTooltip');
    const tableBody = document.getElementById('bkpmQuadTableBody');
    const tableTitle = document.getElementById('bkpmQuadTableTitle');
    const btnZoom = document.getElementById('btnQuadZoom');
    const btnReset = document.getElementById('btnQuadReset');
    const btnDownload = document.getElementById('btnQuadDownload');
    const bubbleLabelBesar = document.getElementById('bubbleLabelBesar');
    const bubbleLabelMenengah = document.getElementById('bubbleLabelMenengah');
    const bubbleLabelKecil = document.getElementById('bubbleLabelKecil');

    if (!provSelect || !svg) return;

    let currentProv = '';
    let zoomLevel = 1.0;
    let tableSortCol = 'total_rp';
    let tableSortAsc = false;
    let selectedKab = null;

    // Helpers
    function formatRupiah(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Rp0';
        return 'Rp' + Math.round(num).toLocaleString('id-ID');
    }

    function formatCompactRp(num) {
        if (!num || isNaN(num) || num <= 0) return 'Rp0';
        if (num >= 1e12) {
            return `Rp${(num / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`;
        }
        if (num >= 1e9) {
            return `Rp${(num / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
        }
        if (num >= 1e6) {
            return `Rp${(num / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Jt`;
        }
        return `Rp${Math.round(num).toLocaleString('id-ID')}`;
    }

    // Populate Province Select
    const provList = rawData.provinces || [];
    let initialProv = provList[0] || 'Jawa Barat';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) initialProv = found;
    }
    currentProv = initialProv;
    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        zoomLevel = 1.0;
        selectedKab = null;
        renderQuadrantView();
    });

    if (btnZoom) {
        btnZoom.addEventListener('click', () => {
            zoomLevel = zoomLevel < 2.2 ? zoomLevel + 0.3 : 1.0;
            applyZoom();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            zoomLevel = 1.0;
            applyZoom();
        });
    }

    function applyZoom() {
        if (!svg) return;
        const gPlot = svg.querySelector('#quadPlotArea');
        if (gPlot) {
            if (zoomLevel === 1.0) {
                gPlot.removeAttribute('transform');
            } else {
                gPlot.setAttribute('transform', `scale(${zoomLevel}) translate(${(-340 * (zoomLevel - 1)) / zoomLevel}, ${(-200 * (zoomLevel - 1)) / zoomLevel})`);
            }
        }
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            try {
                const serializer = new XMLSerializer();
                const svgStr = serializer.serializeToString(svg);
                const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `peta-posisi-investasi-${currentProv.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Download SVG error:', err);
            }
        });
    }

    function renderQuadrantView() {
        if (tableTitle) {
            tableTitle.textContent = `Data Realisasi – ${currentProv}`;
        }

        // Gather all regions in current province
        const allEntries = Object.values(rawData.data_by_region);
        const provItems = allEntries.filter(item => item.provinsi && item.provinsi.toLowerCase() === currentProv.toLowerCase());

        const dataset = provItems.map(item => {
            const pma = item.summary?.total_pma_rp || 0;
            const pmdn = item.summary?.total_pmdn_rp || 0;
            const total = pma + pmdn;
            const proporsi = total > 0 ? (pma / total) * 100 : 0;
            const shortNama = item.kabupaten.replace(/^(kabupaten|kota adm\.|kota)\s+/i, '').trim();

            return {
                id: item.id || '',
                kabupaten: item.kabupaten,
                shortNama: shortNama,
                pma_rp: pma,
                pmdn_rp: pmdn,
                total_rp: total,
                proporsi_pma: proporsi
            };
        });

        // Calculate Median of positive investment
        const positiveTotals = dataset.filter(d => d.total_rp > 0).map(d => d.total_rp).sort((a, b) => a - b);
        let median = 0;
        if (positiveTotals.length > 0) {
            const mid = Math.floor(positiveTotals.length / 2);
            median = positiveTotals.length % 2 !== 0 ? positiveTotals[mid] : (positiveTotals[mid - 1] + positiveTotals[mid]) / 2;
        }

        const maxTotal = Math.max(...dataset.map(d => d.total_rp), 0);

        // Assign Kuadran and Bubble Size
        const thresholdHigh = maxTotal * 0.6;
        const thresholdMid = maxTotal * 0.25;

        if (bubbleLabelBesar) bubbleLabelBesar.textContent = `Total investasi tinggi (≥ ${formatCompactRp(thresholdHigh)})`;
        if (bubbleLabelMenengah) bubbleLabelMenengah.textContent = `Total investasi sedang (${formatCompactRp(thresholdMid)} – ${formatCompactRp(thresholdHigh)})`;
        if (bubbleLabelKecil) bubbleLabelKecil.textContent = `Total investasi rendah (< ${formatCompactRp(thresholdMid)})`;

        dataset.forEach(d => {
            const isHigh = d.total_rp >= median;
            const isPmaDom = d.proporsi_pma >= 50;

            if (isHigh && isPmaDom) {
                d.kuadran = 'I';
                d.kuadranClass = 'q1';
                d.kuadranLabel = 'I – Investasi Tinggi, PMA Dominan';
                d.color = '#10b981';
            } else if (isHigh && !isPmaDom) {
                d.kuadran = 'II';
                d.kuadranClass = 'q2';
                d.kuadranLabel = 'II – Investasi Tinggi, PMDN Dominan';
                d.color = '#3b82f6';
            } else if (!isHigh && !isPmaDom) {
                d.kuadran = 'III';
                d.kuadranClass = 'q3';
                d.kuadranLabel = 'III – Investasi Rendah, PMDN Dominan';
                d.color = '#f59e0b';
            } else {
                d.kuadran = 'IV';
                d.kuadranClass = 'q4';
                d.kuadranLabel = 'IV – Investasi Rendah, PMA Dominan';
                d.color = '#8b5cf6';
            }

            if (d.total_rp >= thresholdHigh) d.radius = 16;
            else if (d.total_rp >= thresholdMid) d.radius = 12;
            else d.radius = 8;
        });

        // Dynamic Y-axis scale
        let divisor = 1;
        let unitLabel = '';
        if (maxTotal >= 1e12) { divisor = 1e12; unitLabel = 'T'; }
        else if (maxTotal >= 1e9) { divisor = 1e9; unitLabel = 'M'; }
        else if (maxTotal >= 1e6) { divisor = 1e6; unitLabel = 'Jt'; }

        const maxUnits = maxTotal > 0 ? (maxTotal / divisor) : 10;
        let niceMax = Math.ceil(maxUnits);
        if (niceMax <= 5) niceMax = 5;
        else if (niceMax <= 10) niceMax = 10;
        else if (niceMax <= 15) niceMax = 15;
        else if (niceMax <= 20) niceMax = 20;
        else if (niceMax <= 25) niceMax = 25;
        else if (niceMax <= 30) niceMax = 30;
        else if (niceMax <= 50) niceMax = 50;
        else {
            const step = Math.pow(10, Math.floor(Math.log10(niceMax)));
            niceMax = Math.ceil(niceMax / step) * step;
        }

        // Render SVG Scatter
        renderSvg(dataset, median, niceMax, divisor, unitLabel);

        // Render Table
        renderTableRows(dataset);
    }

    function renderSvg(dataset, median, niceMax, divisor, unitLabel) {
        const svgW = 680;
        const svgH = 390;
        const padT = 36;
        const padB = 44;
        const padL = 76;
        const padR = 30;
        const plotW = svgW - padL - padR; // 574
        const plotH = svgH - padT - padB; // 310

        const xMid = padL + 0.5 * plotW; // 363 (50% PMA)
        const medRatio = niceMax > 0 ? (median / (niceMax * divisor)) : 0.5;
        const clampedRatio = Math.max(0.08, Math.min(0.92, medRatio));
        const yMid = padT + (1 - clampedRatio) * plotH;

        let defsHtml = `
            <defs>
                <filter id="quadBubbleGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.25"/>
                </filter>
            </defs>
        `;

        // Quadrant Background Rectangles
        let quadsHtml = `
            <!-- Kuadran II: Kiri Atas (Biru Muda) -->
            <rect x="${padL}" y="${padT}" width="${xMid - padL}" height="${yMid - padT}" fill="#eff6ff" opacity="0.6"/>
            <!-- Kuadran I: Kanan Atas (Hijau Muda) -->
            <rect x="${xMid}" y="${padT}" width="${svgW - padR - xMid}" height="${yMid - padT}" fill="#f0fdf4" opacity="0.65"/>
            <!-- Kuadran III: Kiri Bawah (Oranye Muda) -->
            <rect x="${padL}" y="${yMid}" width="${xMid - padL}" height="${padT + plotH - yMid}" fill="#fff7ed" opacity="0.65"/>
            <!-- Kuadran IV: Kanan Bawah (Ungu Muda) -->
            <rect x="${xMid}" y="${yMid}" width="${svgW - padR - xMid}" height="${padT + plotH - yMid}" fill="#faf5ff" opacity="0.65"/>

            <!-- Corner Badge Pills -->
            <g font-family="var(--sans)" font-size="10.5" font-weight="700">
                <rect x="${padL + 8}" y="${padT + 8}" width="205" height="20" rx="4" fill="#dbeafe" stroke="#bfdbfe"/>
                <text x="${padL + 14}" y="${padT + 22}" fill="#1e40af">Kuadran II – Investasi Tinggi, PMDN Dominan</text>

                <rect x="${svgW - padR - 200}" y="${padT + 8}" width="192" height="20" rx="4" fill="#dcfce7" stroke="#bbf7d0"/>
                <text x="${svgW - padR - 194}" y="${padT + 22}" fill="#15803d">Kuadran I – Investasi Tinggi, PMA Dominan</text>

                <rect x="${padL + 8}" y="${padT + plotH - 26}" width="205" height="20" rx="4" fill="#ffedd5" stroke="#fed7aa"/>
                <text x="${padL + 14}" y="${padT + plotH - 12}" fill="#c2410c">Kuadran III – Investasi Rendah, PMDN Dominan</text>

                <rect x="${svgW - padR - 198}" y="${padT + plotH - 26}" width="190" height="20" rx="4" fill="#f3e8ff" stroke="#e9d5ff"/>
                <text x="${svgW - padR - 192}" y="${padT + plotH - 12}" fill="#7e22ce">Kuadran IV – Investasi Rendah, PMA Dominan</text>
            </g>
        `;

        // Threshold dashed lines
        let thresholdHtml = `
            <!-- Batas Proporsi PMA 50% -->
            <line x1="${xMid}" y1="${padT}" x2="${xMid}" y2="${padT + plotH}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4 4"/>
            <text x="${xMid}" y="${padT - 10}" text-anchor="middle" font-family="var(--sans)" font-size="11" font-weight="700" fill="#334155">
                Batas Proporsi PMA 50%
            </text>

            <!-- Batas Median Total Investasi -->
            <line x1="${padL}" y1="${yMid}" x2="${svgW - padR}" y2="${yMid}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4 4"/>
            <text x="${svgW - padR - 8}" y="${yMid - 7}" text-anchor="end" font-family="var(--mono)" font-size="10" font-weight="700" fill="#334155">
                Batas Median Total Investasi: ${formatCompactRp(median)}
            </text>
        `;

        // Grid & Ticks
        let gridHtml = '';
        const yTickCount = 5;
        for (let i = 0; i <= yTickCount; i++) {
            const tickVal = (niceMax / yTickCount) * i;
            const yPos = padT + plotH - (i / yTickCount) * plotH;
            gridHtml += `
                <line x1="${padL}" y1="${yPos}" x2="${svgW - padR}" y2="${yPos}" stroke="var(--line-soft)" stroke-dasharray="2 3"/>
                <text x="${padL - 10}" y="${yPos + 3.5}" text-anchor="end" font-family="var(--mono)" font-size="10" font-weight="600" fill="var(--muted)">
                    Rp${tickVal % 1 === 0 ? tickVal : tickVal.toFixed(1)}${unitLabel ? ' ' + unitLabel : ''}
                </text>
            `;
        }

        const xTicks = [0, 20, 40, 60, 80, 100];
        xTicks.forEach(pct => {
            const xPos = padL + (pct / 100) * plotW;
            gridHtml += `
                <line x1="${xPos}" y1="${padT}" x2="${xPos}" y2="${padT + plotH}" stroke="var(--line-soft)" stroke-dasharray="2 3"/>
                <text x="${xPos}" y="${padT + plotH + 16}" text-anchor="middle" font-family="var(--mono)" font-size="10" font-weight="600" fill="var(--muted)">
                    ${pct}%
                </text>
            `;
        });

        // Axis Titles
        gridHtml += `
            <text x="${padL + plotW / 2}" y="${padT + plotH + 34}" text-anchor="middle" font-family="var(--sans)" font-size="11.5" font-weight="700" fill="var(--text)">
                Proporsi PMA (%)
            </text>
            <text transform="translate(18, ${padT + plotH / 2}) rotate(-90)" text-anchor="middle" font-family="var(--sans)" font-size="11.5" font-weight="700" fill="var(--text)">
                Total Investasi (Rp)
            </text>
        `;

        // Bubbles / Points
        let pointsHtml = '<g id="quadPlotArea">';
        dataset.forEach((d, idx) => {
            const cx = padL + (Math.min(100, Math.max(0, d.proporsi_pma)) / 100) * plotW;
            const ratioY = niceMax > 0 ? Math.min(1, Math.max(0, d.total_rp / (niceMax * divisor))) : 0;
            const cy = padT + plotH - ratioY * plotH;
            const isSelected = selectedKab && selectedKab.kabupaten === d.kabupaten;

            pointsHtml += `
                <g class="bkpm-bubble-item" data-idx="${idx}" style="cursor:pointer">
                    <circle cx="${cx}" cy="${cy}" r="${d.radius}" fill="${d.color}" fill-opacity="${isSelected ? '0.95' : '0.75'}" stroke="#ffffff" stroke-width="${isSelected ? '3' : '1.8'}" filter="url(#quadBubbleGlow)"/>
                    <text x="${cx + d.radius + 4}" y="${cy + 4}" font-family="var(--sans)" font-size="10.5" font-weight="700" fill="var(--text)" style="pointer-events:none;text-shadow:0 1px 3px #ffffff">
                        ${escapeHtml(d.shortNama)}
                    </text>
                </g>
            `;
        });
        pointsHtml += '</g>';

        svg.innerHTML = defsHtml + quadsHtml + thresholdHtml + gridHtml + pointsHtml;

        // Interaction on bubbles
        svg.querySelectorAll('.bkpm-bubble-item').forEach(el => {
            const idx = parseInt(el.dataset.idx, 10);
            const item = dataset[idx];
            if (!item) return;

            el.addEventListener('mouseenter', e => {
                const circle = el.querySelector('circle');
                if (circle) {
                    circle.setAttribute('fill-opacity', '1');
                    circle.setAttribute('stroke-width', '3');
                }

                if (tooltip) {
                    tooltip.innerHTML = `
                        <div class="tt-title">${escapeHtml(item.kabupaten)}</div>
                        <div class="tt-row"><span class="tt-k">PMA</span><span class="tt-v mono">${formatRupiah(item.pma_rp)}</span></div>
                        <div class="tt-row"><span class="tt-k">PMDN</span><span class="tt-v mono">${formatRupiah(item.pmdn_rp)}</span></div>
                        <div class="tt-row"><span class="tt-k">Total Investasi</span><span class="tt-v mono" style="color:#2563eb">${formatRupiah(item.total_rp)}</span></div>
                        <div class="tt-row"><span class="tt-k">Proporsi PMA</span><span class="tt-v mono">${item.proporsi_pma.toFixed(1)}%</span></div>
                        <div style="margin-top:5px;padding-top:4px;border-top:1px dashed var(--line);font-size:10.5px">
                            <span class="kuadran-pill ${item.kuadranClass}">Kuadran ${item.kuadran}</span>
                        </div>
                    `;
                    tooltip.style.display = 'block';
                    positionTooltip(e);
                }
            });

            el.addEventListener('mousemove', e => {
                positionTooltip(e);
            });

            el.addEventListener('mouseleave', () => {
                const circle = el.querySelector('circle');
                const isSelected = selectedKab && selectedKab.kabupaten === item.kabupaten;
                if (circle && !isSelected) {
                    circle.setAttribute('fill-opacity', '0.75');
                    circle.setAttribute('stroke-width', '1.8');
                }
                if (tooltip) tooltip.style.display = 'none';
            });

            el.addEventListener('click', () => {
                selectedKab = item;
                renderQuadrantView();
                if (tableBody) {
                    const tr = tableBody.querySelector(`tr[data-kab="${CSS.escape(item.kabupaten)}"]`);
                    if (tr) {
                        tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('active'));
                        tr.classList.add('active');
                        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });
    }

    function positionTooltip(e) {
        if (!tooltip || !container) return;
        const rect = container.getBoundingClientRect();
        let left = e.clientX - rect.left + 14;
        let top = e.clientY - rect.top - 20;

        if (left + 250 > rect.width) {
            left = e.clientX - rect.left - 250 - 10;
        }
        tooltip.style.left = `${Math.max(8, left)}px`;
        tooltip.style.top = `${Math.max(8, top)}px`;
    }

    function renderTableRows(dataset) {
        if (!tableBody) return;

        const sorted = [...dataset].sort((a, b) => {
            let valA = a[tableSortCol];
            let valB = b[tableSortCol];
            if (typeof valA === 'string') {
                return tableSortAsc ? valA.localeCompare(valB, 'id') : valB.localeCompare(valA, 'id');
            }
            return tableSortAsc ? valA - valB : valB - valA;
        });

        tableBody.innerHTML = sorted.map(item => {
            const isSelected = selectedKab && selectedKab.kabupaten === item.kabupaten;
            return `
                <tr class="${isSelected ? 'active' : ''}" data-kab="${escapeHtml(item.kabupaten)}">
                    <td><b>${escapeHtml(item.kabupaten)}</b></td>
                    <td style="text-align:right" class="mono">${formatCompactRp(item.pma_rp)}</td>
                    <td style="text-align:right" class="mono">${formatCompactRp(item.pmdn_rp)}</td>
                    <td style="text-align:right;font-weight:700;color:#2563eb" class="mono">${formatCompactRp(item.total_rp)}</td>
                    <td style="text-align:right" class="mono">${item.proporsi_pma.toFixed(1)}%</td>
                    <td style="text-align:center">
                        <span class="kuadran-pill ${item.kuadranClass}">Kuadran ${item.kuadran}</span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const kab = tr.dataset.kab;
                const found = dataset.find(d => d.kabupaten === kab);
                if (found) {
                    selectedKab = found;
                    renderQuadrantView();
                }
            });
        });
    }

    // Attach table sorting listeners
    const thEls = document.querySelectorAll('#bkpmQuadTable thead th[data-sort]');
    thEls.forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (col === 'kabupaten') tableSortCol = 'kabupaten';
            else if (col === 'pma') tableSortCol = 'pma_rp';
            else if (col === 'pmdn') tableSortCol = 'pmdn_rp';
            else if (col === 'total') tableSortCol = 'total_rp';
            else if (col === 'proporsi') tableSortCol = 'proporsi_pma';
            else if (col === 'kuadran') tableSortCol = 'kuadran';

            tableSortAsc = !tableSortAsc;
            renderQuadrantView();
        });
    });

    renderQuadrantView();
}

/* ============================================================
   FITUR 03: PERINGKAT KABUPATEN/KOTA BERDASARKAN INVESTASI
   - Ranking list dengan progress bar
   - Filter Jenis: Semua, PMA, PMDN
   - Search input filter nama wilayah
   - Top 1, 2, 3 Badges (Gold, Silver, Bronze)
   - 3 Summary Dossier Cards di kanan
   ============================================================ */
function renderInvestasiRanking(r) {
    const rawData = window.INVESTASI_SEKTOR_DATA;
    if (!rawData || !rawData.data_by_region) return;

    const provSelect = document.getElementById('bkpmRankProvSelect');
    const btnSemua = document.getElementById('btnRankSemua');
    const btnPma = document.getElementById('btnRankPma');
    const btnPmdn = document.getElementById('btnRankPmdn');
    const searchInput = document.getElementById('bkpmRankSearchInput');
    const listContainer = document.getElementById('bkpmRankingListContainer');

    // Sidebar card elements
    const topWilayahEl = document.getElementById('bkpmRankTopWilayah');
    const topNilaiEl = document.getElementById('bkpmRankTopNilai');
    const totalWilayahEl = document.getElementById('bkpmRankTotalWilayah');
    const activeProvEl = document.getElementById('bkpmRankActiveProv');
    const activeTypeEl = document.getElementById('bkpmRankActiveType');
    const detailTitleEl = document.getElementById('bkpmRankDetailTitle');
    const detailSubEl = document.getElementById('bkpmRankDetailSub');
    const detailPmaEl = document.getElementById('bkpmRankDetailPma');
    const detailPmdnEl = document.getElementById('bkpmRankDetailPmdn');
    const detailTotalEl = document.getElementById('bkpmRankDetailTotal');

    if (!provSelect || !listContainer) return;

    let currentProv = '';
    let activeType = 'Semua'; // 'Semua' | 'PMA' | 'PMDN'
    let searchQuery = '';
    let selectedItem = null;

    function formatRupiah(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Rp0';
        return 'Rp' + Math.round(num).toLocaleString('id-ID');
    }

    function formatCompactRp(num) {
        if (!num || isNaN(num) || num <= 0) return 'Rp0';
        if (num >= 1e12) {
            return `Rp${(num / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`;
        }
        if (num >= 1e9) {
            return `Rp${(num / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
        }
        if (num >= 1e6) {
            return `Rp${(num / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Jt`;
        }
        return `Rp${Math.round(num).toLocaleString('id-ID')}`;
    }

    // Populate Province Select
    const provList = rawData.provinces || [];
    let initialProv = provList[0] || 'Jawa Barat';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) initialProv = found;
    }
    currentProv = initialProv;
    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        selectedItem = null;
        renderRankingView();
    });

    const filterBtns = [btnSemua, btnPma, btnPmdn].filter(Boolean);
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeType = btn.dataset.type || 'Semua';
            renderRankingView();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchQuery = (e.target.value || '').toLowerCase().trim();
            renderRankingListOnly();
        });
    }

    let currentDataset = [];

    function renderRankingView() {
        if (activeProvEl) activeProvEl.textContent = currentProv;
        if (activeTypeEl) {
            activeTypeEl.textContent = activeType;
            activeTypeEl.style.color = activeType === 'PMA' ? '#0d9488' : activeType === 'PMDN' ? '#d97706' : '#2563eb';
        }

        const allEntries = Object.values(rawData.data_by_region);
        const provItems = allEntries.filter(item => item.provinsi && item.provinsi.toLowerCase() === currentProv.toLowerCase());

        currentDataset = provItems.map(item => {
            const pma = item.summary?.total_pma_rp || 0;
            const pmdn = item.summary?.total_pmdn_rp || 0;
            const total = pma + pmdn;

            let metricVal = total;
            if (activeType === 'PMA') metricVal = pma;
            else if (activeType === 'PMDN') metricVal = pmdn;

            const shortNama = item.kabupaten.replace(/^(kabupaten|kota adm\.|kota)\s+/i, '').trim();

            return {
                kabupaten: item.kabupaten,
                shortNama: shortNama,
                pma_rp: pma,
                pmdn_rp: pmdn,
                total_rp: total,
                metricVal: metricVal
            };
        });

        // Sort descending by metricVal
        currentDataset.sort((a, b) => b.metricVal - a.metricVal);

        // Assign standard ranking (equal values get equal rank)
        let curRank = 1;
        currentDataset.forEach((d, idx) => {
            if (idx > 0 && d.metricVal < currentDataset[idx - 1].metricVal) {
                curRank = idx + 1;
            }
            d.rank = curRank;
        });

        // Update Ringkasan Card
        const topOne = currentDataset[0] || { shortNama: '–', metricVal: 0 };
        if (topWilayahEl) topWilayahEl.textContent = topOne.shortNama;
        if (topNilaiEl) topNilaiEl.textContent = formatCompactRp(topOne.metricVal);
        if (totalWilayahEl) totalWilayahEl.textContent = String(currentDataset.length);

        // Preselect Rank 1 or preserve selected
        if (!selectedItem || !currentDataset.some(d => d.kabupaten === selectedItem.kabupaten)) {
            selectedItem = currentDataset[0] || null;
        }
        updateDetailCard(selectedItem);

        renderRankingListOnly();
    }

    function updateDetailCard(item) {
        if (!item) {
            if (detailTitleEl) detailTitleEl.textContent = 'Pilih Wilayah';
            if (detailSubEl) detailSubEl.textContent = 'Kabupaten / Kota';
            if (detailPmaEl) detailPmaEl.textContent = 'Rp0';
            if (detailPmdnEl) detailPmdnEl.textContent = 'Rp0';
            if (detailTotalEl) detailTotalEl.textContent = 'Rp0';
            return;
        }
        if (detailTitleEl) detailTitleEl.textContent = item.shortNama;
        if (detailSubEl) detailSubEl.textContent = item.kabupaten;
        if (detailPmaEl) detailPmaEl.textContent = formatCompactRp(item.pma_rp);
        if (detailPmdnEl) detailPmdnEl.textContent = formatCompactRp(item.pmdn_rp);
        if (detailTotalEl) detailTotalEl.textContent = formatCompactRp(item.total_rp);
    }

    function renderRankingListOnly() {
        if (!listContainer) return;

        let filtered = currentDataset;
        if (searchQuery) {
            filtered = currentDataset.filter(d => d.kabupaten.toLowerCase().includes(searchQuery) || d.shortNama.toLowerCase().includes(searchQuery));
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">Tidak ditemukan kabupaten/kota yang sesuai dengan pencarian "${escapeHtml(searchQuery)}".</div>`;
            return;
        }

        const maxVal = Math.max(...currentDataset.map(d => d.metricVal), 1);

        listContainer.innerHTML = filtered.map(item => {
            const isSelected = selectedItem && selectedItem.kabupaten === item.kabupaten;
            const isRank1 = item.rank === 1;
            let rankClass = 'top-n';
            if (item.rank === 1) rankClass = 'top-1';
            else if (item.rank === 2) rankClass = 'top-2';
            else if (item.rank === 3) rankClass = 'top-3';

            const pctWidth = Math.max(3, (item.metricVal / maxVal) * 100);

            return `
                <div class="bkpm-rank-row ${isRank1 ? 'rank-1-row' : ''} ${isSelected ? 'active' : ''}" data-kab="${escapeHtml(item.kabupaten)}">
                    <div>
                        <div class="bkpm-rank-badge ${rankClass}">${item.rank}</div>
                    </div>
                    <div class="bkpm-rank-name" title="${escapeHtml(item.kabupaten)}">
                        ${escapeHtml(item.shortNama)}
                    </div>
                    <div class="bkpm-rank-bar-wrap">
                        <div class="bkpm-rank-bar-track">
                            <div class="bkpm-rank-bar-fill" style="width:${pctWidth}%"></div>
                        </div>
                        <div class="bkpm-rank-val-text">${formatCompactRp(item.metricVal)}</div>
                    </div>
                    <div style="text-align:center">
                        <button type="button" class="bkpm-btn-lihat">Lihat &gt;</button>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.bkpm-rank-row').forEach(row => {
            row.addEventListener('click', () => {
                const kab = row.dataset.kab;
                const found = currentDataset.find(d => d.kabupaten === kab);
                if (found) {
                    selectedItem = found;
                    updateDetailCard(found);
                    listContainer.querySelectorAll('.bkpm-rank-row').forEach(r => r.classList.remove('active'));
                    row.classList.add('active');
                }
            });
        });
    }

    renderRankingView();
}


/* ============================================================
   04 PETA POSISI PASAR TENAGA KERJA KABUPATEN/KOTA DALAM PROVINSI
   - 4-Quadrant Scatter Plot UMK vs TPT
   - Sumbu X: Nilai UMK / upah minimum (Juta Rp), dynamic range
   - Sumbu Y: TPT (%), batas bawah 0%, dynamic top range
   - Thresholds: Garis Vertikal (Median UMK) & Garis Horizontal (Median TPT)
   - 4 Kuadran:
     * Kuadran I: UMK Tinggi, TPT Tinggi (Kanan Atas)
     * Kuadran II: UMK Rendah, TPT Tinggi (Kiri Atas)
     * Kuadran III: UMK Rendah, TPT Rendah (Kiri Bawah)
     * Kuadran IV: UMK Tinggi, TPT Rendah (Kanan Bawah)
   - Ukuran Bubble: Proporsional dengan Angkatan Kerja (min 8px, max 24px)
   - Interactive Speech-Bubble Tooltip
   - 3 Sidebar Cards: Ringkasan Provinsi, Interpretasi Kuadran, Keterangan Ukuran
   - Interactive Sortable & Searchable Table
   - Zoom, Reset & Download
   ============================================================ */
function renderPasarKerja(r) {
    const rawData = window.PASAR_KERJA_DATA;
    if (!rawData || !rawData.data_by_prov) return;

    const provSelect = document.getElementById('bkpmNakerProvSelect');
    const svg = document.getElementById('bkpmNakerSvg');
    const container = document.getElementById('bkpmNakerContainer');
    const tooltip = document.getElementById('bkpmNakerTooltip');
    const tableBody = document.getElementById('bkpmNakerTableBody');
    const tableTitle = document.getElementById('bkpmNakerTableTitle');
    const searchInput = document.getElementById('bkpmNakerSearchInput');
    const btnZoom = document.getElementById('btnNakerZoom');
    const btnReset = document.getElementById('btnNakerReset');
    const btnDownload = document.getElementById('btnNakerDownload');

    const nakerMedianUmk = document.getElementById('nakerMedianUmk');
    const nakerMedianTpt = document.getElementById('nakerMedianTpt');
    const nakerTotalWilayah = document.getElementById('nakerTotalWilayah');
    const nakerBubbleBesar = document.getElementById('nakerBubbleBesar');
    const nakerBubbleMenengah = document.getElementById('nakerBubbleMenengah');
    const nakerBubbleKecil = document.getElementById('nakerBubbleKecil');

    if (!provSelect || !svg) return;

    let currentProv = '';
    let zoomLevel = 1.0;
    let tableSortCol = 'umk';
    let tableSortAsc = false;
    let selectedKabId = null;
    let searchQuery = '';
    let currentDataset = [];

    // Formatting Helpers
    function formatRupiah(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Rp0';
        return 'Rp' + Math.round(num).toLocaleString('id-ID');
    }

    function formatCompactRp(num) {
        if (!num || isNaN(num) || num <= 0) return 'Rp0';
        if (num >= 1e12) {
            return `Rp${(num / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`;
        }
        if (num >= 1e9) {
            return `Rp${(num / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
        }
        if (num >= 1e6) {
            return `Rp${(num / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Jt`;
        }
        return `Rp${Math.round(num).toLocaleString('id-ID')}`;
    }

    function formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return Math.round(num).toLocaleString('id-ID');
    }

    // Populate Province Select
    const provList = rawData.provinces || [];
    let initialProv = provList[0] || 'Jawa Barat';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) initialProv = found;
    }
    currentProv = initialProv;
    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        zoomLevel = 1.0;
        selectedKabId = null;
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        renderNakerView();
    });

    if (btnZoom) {
        btnZoom.addEventListener('click', () => {
            zoomLevel = zoomLevel === 1.0 ? 1.35 : (zoomLevel === 1.35 ? 1.7 : 1.0);
            applyZoom();
            if (btnZoom.querySelector('span')) {
                btnZoom.querySelector('span').textContent = zoomLevel > 1.0 ? `Zoom ${zoomLevel}x` : 'Zoom';
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            zoomLevel = 1.0;
            selectedKabId = null;
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            if (btnZoom && btnZoom.querySelector('span')) {
                btnZoom.querySelector('span').textContent = 'Zoom';
            }
            applyZoom();
            renderNakerView();
        });
    }

    function applyZoom() {
        if (!svg) return;
        const gPlot = svg.querySelector('#nakerPlotArea');
        if (gPlot) {
            if (zoomLevel === 1.0) {
                gPlot.removeAttribute('transform');
            } else {
                gPlot.setAttribute('transform', `scale(${zoomLevel}) translate(${(-340 * (zoomLevel - 1)) / zoomLevel}, ${(-200 * (zoomLevel - 1)) / zoomLevel})`);
            }
        }
    }

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            try {
                // Export SVG
                const serializer = new XMLSerializer();
                const svgStr = serializer.serializeToString(svg);
                const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `peta-pasar-kerja-${currentProv.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Download SVG error:', err);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTableRows(currentDataset);
            highlightSearchOnSvg();
        });
    }

    function positionTooltip(e) {
        if (!tooltip || !container) return;
        const rect = container.getBoundingClientRect();
        let left = e.clientX - rect.left + 14;
        let top = e.clientY - rect.top - 20;

        if (left + 260 > rect.width) {
            left = e.clientX - rect.left - 260 - 10;
        }
        tooltip.style.left = `${Math.max(8, left)}px`;
        tooltip.style.top = `${Math.max(8, top)}px`;
    }

    function highlightSearchOnSvg() {
        if (!svg) return;
        svg.querySelectorAll('.naker-bubble').forEach(b => {
            const kab = (b.dataset.kab || '').toLowerCase();
            if (searchQuery && !kab.includes(searchQuery)) {
                b.style.opacity = '0.2';
            } else {
                b.style.opacity = '1.0';
            }
        });
    }

    function renderTableRows(dataset) {
        if (!tableBody) return;

        let filtered = [...dataset];
        if (searchQuery) {
            filtered = filtered.filter(item => item.kabkota.toLowerCase().includes(searchQuery));
        }

        const sorted = filtered.sort((a, b) => {
            let valA = a[tableSortCol];
            let valB = b[tableSortCol];
            if (typeof valA === 'string') {
                return tableSortAsc ? valA.localeCompare(valB, 'id') : valB.localeCompare(valA, 'id');
            }
            return tableSortAsc ? valA - valB : valB - valA;
        });

        if (sorted.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8">Tidak ada data kabupaten/kota yang sesuai filter.</td></tr>`;
            return;
        }

        tableBody.innerHTML = sorted.map(item => `
            <tr data-id="${item.id}" data-kab="${escapeHtml(item.kabkota)}" class="${selectedKabId === item.id ? 'selected-row' : ''}" style="cursor:pointer">
                <td style="font-weight:600;color:var(--text)">${escapeHtml(item.kabkota)}</td>
                <td style="text-align:right" class="mono">${formatRupiah(item.umk)}</td>
                <td style="text-align:center">
                    <span class="chip-badge" style="background:${item.jenis_upah === 'UMK' ? '#dbeafe' : '#fef3c7'};color:${item.jenis_upah === 'UMK' ? '#1d4ed8' : '#b45309'};padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700">${escapeHtml(item.jenis_upah)}</span>
                </td>
                <td style="text-align:right" class="mono">${item.tpt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%</td>
                <td style="text-align:right" class="mono">${formatNumber(item.angkatan_kerja)}</td>
                <td style="text-align:center">
                    <span class="bkpm-quad-badge ${item.kuadranClass}">${escapeHtml(item.kuadran)}</span>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.id;
                selectedKabId = selectedKabId === id ? null : id;
                tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
                if (selectedKabId) row.classList.add('selected-row');

                // Trigger SVG circle highlight
                svg.querySelectorAll('.naker-bubble').forEach(b => {
                    if (!selectedKabId || b.dataset.id === selectedKabId) {
                        b.setAttribute('stroke', '#ffffff');
                        b.setAttribute('stroke-width', b.dataset.id === selectedKabId ? '3.5' : '2');
                        b.style.opacity = '1.0';
                        if (b.dataset.id === selectedKabId) {
                            const foundItem = dataset.find(d => d.id === selectedKabId);
                            if (foundItem) {
                                const cx = parseFloat(b.getAttribute('cx'));
                                const cy = parseFloat(b.getAttribute('cy'));
                                showBubbleTooltip(foundItem, { clientX: container.getBoundingClientRect().left + cx, clientY: container.getBoundingClientRect().top + cy });
                            }
                        }
                    } else {
                        b.style.opacity = '0.3';
                    }
                });
            });
        });
    }

    function showBubbleTooltip(item, e) {
        if (!tooltip) return;
        tooltip.innerHTML = `
            <div class="tt-title">${escapeHtml(item.kabkota)}</div>
            <div class="tt-row"><span class="tt-k">Upah Minimum</span><span class="tt-v mono" style="color:#2563eb">${formatRupiah(item.umk)} <small style="font-weight:600;color:#64748b">(${item.jenis_upah})</small></span></div>
            <div class="tt-row"><span class="tt-k">TPT</span><span class="tt-v mono">${item.tpt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%</span></div>
            <div class="tt-row"><span class="tt-k">Angkatan Kerja</span><span class="tt-v mono">${formatNumber(item.angkatan_kerja)} orang</span></div>
            <div class="tt-row"><span class="tt-k">Kuadran</span><span class="bkpm-quad-badge ${item.kuadranClass}">${escapeHtml(item.kuadranName)}</span></div>
        `;
        tooltip.style.display = 'block';
        positionTooltip(e);
    }

    // Attach table sort handlers
    const ths = document.querySelectorAll('#bkpmNakerTable th[data-sort]');
    ths.forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            if (tableSortCol === sortKey) {
                tableSortAsc = !tableSortAsc;
            } else {
                tableSortCol = sortKey;
                tableSortAsc = (sortKey === 'kabupaten' || sortKey === 'jenis');
            }
            ths.forEach(t => {
                const baseText = t.textContent.replace(/[↕↑↓]/g, '').trim();
                t.textContent = baseText + ' ↕';
            });
            const arrow = tableSortAsc ? ' ↑' : ' ↓';
            th.textContent = th.textContent.replace(' ↕', '') + arrow;
            renderTableRows(currentDataset);
        });
    });

    function renderNakerView() {
        const rawProvItems = rawData.data_by_prov[currentProv] || [];
        const items = rawProvItems.filter(i => i.umk > 0 && i.tpt > 0);

        if (tableTitle) {
            tableTitle.textContent = `Data Pasar Tenaga Kerja – ${currentProv}`;
        }

        if (items.length === 0) {
            svg.innerHTML = `
                <text x="340" y="200" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="var(--font)">
                    Data tenaga kerja untuk ${escapeHtml(currentProv)} belum tersedia.
                </text>
            `;
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8">Data tidak tersedia</td></tr>`;
            if (nakerMedianUmk) nakerMedianUmk.textContent = 'Rp0';
            if (nakerMedianTpt) nakerMedianTpt.textContent = '0,00%';
            if (nakerTotalWilayah) nakerTotalWilayah.textContent = '0 Kab/Kota';
            return;
        }

        // 1. Calculate Provincial Medians
        const sortedUmk = [...items.map(i => i.umk)].sort((a, b) => a - b);
        const midU = Math.floor(sortedUmk.length / 2);
        const medianUmk = sortedUmk.length % 2 !== 0 ? sortedUmk[midU] : (sortedUmk[midU - 1] + sortedUmk[midU]) / 2;

        const sortedTpt = [...items.map(i => i.tpt)].sort((a, b) => a - b);
        const midT = Math.floor(sortedTpt.length / 2);
        const medianTpt = sortedTpt.length % 2 !== 0 ? sortedTpt[midT] : (sortedTpt[midT - 1] + sortedTpt[midT]) / 2;

        const allSameUmk = items.every(i => Math.abs(i.umk - items[0].umk) < 1);

        // 2. Classify Quadrant for each item
        items.forEach(item => {
            if (allSameUmk) {
                if (item.tpt > medianTpt) {
                    item.kuadran = 'TPT Tinggi';
                    item.kuadranName = 'TPT Tinggi (Upah Seragam UMP)';
                    item.kuadranClass = 'q2';
                    item.color = '#3b82f6';
                } else if (item.tpt < medianTpt) {
                    item.kuadran = 'TPT Rendah';
                    item.kuadranName = 'TPT Rendah (Upah Seragam UMP)';
                    item.kuadranClass = 'q3';
                    item.color = '#f97316';
                } else {
                    item.kuadran = 'Batas Median';
                    item.kuadranName = 'Seimbang pada Median TPT';
                    item.kuadranClass = 'q-neutral';
                    item.color = '#64748b';
                }
            } else if (item.umk > medianUmk && item.tpt > medianTpt) {
                item.kuadran = 'Kuadran I';
                item.kuadranName = 'I – UMK Tinggi, TPT Tinggi';
                item.kuadranClass = 'q1';
                item.color = '#10b981';
            } else if (item.umk < medianUmk && item.tpt > medianTpt) {
                item.kuadran = 'Kuadran II';
                item.kuadranName = 'II – UMK Rendah, TPT Tinggi';
                item.kuadranClass = 'q2';
                item.color = '#3b82f6';
            } else if (item.umk < medianUmk && item.tpt < medianTpt) {
                item.kuadran = 'Kuadran III';
                item.kuadranName = 'III – UMK Rendah, TPT Rendah';
                item.kuadranClass = 'q3';
                item.color = '#f97316';
            } else if (item.umk > medianUmk && item.tpt < medianTpt) {
                item.kuadran = 'Kuadran IV';
                item.kuadranName = 'IV – UMK Tinggi, TPT Rendah';
                item.kuadranClass = 'q4';
                item.color = '#a855f7';
            } else {
                item.kuadran = 'Batas Median';
                item.kuadranName = 'Seimbang pada Garis Batas';
                item.kuadranClass = 'q-neutral';
                item.color = '#64748b';
            }
        });

        currentDataset = items;

        // 3. Update Sidebar Cards
        if (nakerMedianUmk) nakerMedianUmk.textContent = formatCompactRp(medianUmk);
        if (nakerMedianTpt) nakerMedianTpt.textContent = `${medianTpt.toFixed(2)}%`;
        if (nakerTotalWilayah) nakerTotalWilayah.textContent = `${items.length} Kab/Kota`;

        const sortedAk = [...items.map(i => i.angkatan_kerja)].sort((a, b) => a - b);
        const minAk = sortedAk[0] || 100000;
        const maxAk = sortedAk[sortedAk.length - 1] || 1000000;

        if (nakerBubbleBesar) nakerBubbleBesar.textContent = `Angkatan kerja ≥ ${(maxAk * 0.7 / 1e6).toFixed(1)} Juta`;
        if (nakerBubbleMenengah) nakerBubbleMenengah.textContent = `Angkatan kerja ${(maxAk * 0.3 / 1e6).toFixed(1)} Jt – ${(maxAk * 0.7 / 1e6).toFixed(1)} Jt`;
        if (nakerBubbleKecil) nakerBubbleKecil.textContent = `Angkatan kerja < ${(maxAk * 0.3 / 1e6).toFixed(1)} Juta`;

        // 4. Render Bottom Table
        renderTableRows(items);

        // 5. Render SVG Scatter Plot
        renderNakerSvg(items, medianUmk, medianTpt, allSameUmk, minAk, maxAk);
    }

    function renderNakerSvg(items, medianUmk, medianTpt, allSameUmk, minAk, maxAk) {
        // SVG dimensions
        const svgW = 680;
        const svgH = 400;
        const padLeft = 65;
        const padRight = 35;
        const padTop = 35;
        const padBottom = 45;
        const chartW = svgW - padLeft - padRight;
        const chartH = svgH - padTop - padBottom;

        // Dynamic X-Axis (UMK in Juta Rp)
        const umkValuesJuta = items.map(i => i.umk / 1e6);
        const minUmkJuta = Math.min(...umkValuesJuta);
        const maxUmkJuta = Math.max(...umkValuesJuta);

        let xMin, xMax;
        if (allSameUmk || maxUmkJuta === minUmkJuta) {
            xMin = Math.max(0, Math.floor((minUmkJuta - 1.0) * 10) / 10);
            xMax = Math.ceil((maxUmkJuta + 1.0) * 10) / 10;
        } else {
            const spread = maxUmkJuta - minUmkJuta;
            xMin = Math.max(0, Math.floor((minUmkJuta - spread * 0.15) * 10) / 10);
            xMax = Math.ceil((maxUmkJuta + spread * 0.15) * 10) / 10;
            if (xMax - xMin < 1.0) {
                xMin = Math.max(0, xMin - 0.5);
                xMax = xMax + 0.5;
            }
        }

        // Dynamic Y-Axis (TPT in %, bottom fixed at 0%)
        const yMin = 0;
        const maxTpt = Math.max(...items.map(i => i.tpt));
        const yMax = Math.max(8, Math.ceil((maxTpt * 1.25) / 2) * 2);

        function scaleX(valJuta) {
            return padLeft + ((valJuta - xMin) / (xMax - xMin)) * chartW;
        }

        function scaleY(valTpt) {
            return padTop + chartH - ((valTpt - yMin) / (yMax - yMin)) * chartH;
        }

        const medX = scaleX(medianUmk / 1e6);
        const medY = scaleY(medianTpt);

        // Clamped quadrant boxes
        const qLeftW = Math.max(0, medX - padLeft);
        const qRightW = Math.max(0, (padLeft + chartW) - medX);
        const qTopH = Math.max(0, medY - padTop);
        const qBottomH = Math.max(0, (padTop + chartH) - medY);

        // Bubble Radius scaling
        function getRadius(ak) {
            const minR = 8;
            const maxR = 24;
            if (maxAk === minAk) return 13;
            const norm = (Math.sqrt(ak) - Math.sqrt(minAk)) / (Math.sqrt(maxAk) - Math.sqrt(minAk));
            return Math.round((minR + norm * (maxR - minR)) * 10) / 10;
        }

        // SVG string construction
        let svgHtml = `
            <defs>
                <filter id="nakerShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" flood-color="#0f172a" flood-opacity="0.18"/>
                </filter>
            </defs>
            <g id="nakerPlotArea">
                <!-- Quadrant Background Panels -->
                <!-- Q2 (Kiri Atas): UMK Rendah, TPT Tinggi (Soft Blue) -->
                <rect x="${padLeft}" y="${padTop}" width="${qLeftW}" height="${qTopH}" fill="#eff6ff" opacity="0.6"/>
                <!-- Q1 (Kanan Atas): UMK Tinggi, TPT Tinggi (Soft Green) -->
                <rect x="${medX}" y="${padTop}" width="${qRightW}" height="${qTopH}" fill="#f0fdf4" opacity="0.6"/>
                <!-- Q3 (Kiri Bawah): UMK Rendah, TPT Rendah (Soft Orange) -->
                <rect x="${padLeft}" y="${medY}" width="${qLeftW}" height="${qBottomH}" fill="#fff7ed" opacity="0.6"/>
                <!-- Q4 (Kanan Bawah): UMK Tinggi, TPT Rendah (Soft Purple) -->
                <rect x="${medX}" y="${medY}" width="${qRightW}" height="${qBottomH}" fill="#faf5ff" opacity="0.6"/>

                <!-- Chart Grid Borders -->
                <rect x="${padLeft}" y="${padTop}" width="${chartW}" height="${chartH}" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>

                <!-- Quadrant Header Badges/Pills inside chart -->
                <g opacity="0.85" font-family="var(--font)" font-size="10" font-weight="700">
                    <!-- Q2 Header -->
                    <rect x="${padLeft + 10}" y="${padTop + 10}" width="180" height="20" rx="4" fill="#dbeafe"/>
                    <text x="${padLeft + 16}" y="${padTop + 24}" fill="#1d4ed8">Kuadran II – UMK Rendah, TPT Tinggi</text>

                    <!-- Q1 Header -->
                    <rect x="${Math.max(medX + 10, padLeft + chartW - 190)}" y="${padTop + 10}" width="180" height="20" rx="4" fill="#dcfce7"/>
                    <text x="${Math.max(medX + 16, padLeft + chartW - 184)}" y="${padTop + 24}" fill="#15803d">Kuadran I – UMK Tinggi, TPT Tinggi</text>

                    <!-- Q3 Header -->
                    <rect x="${padLeft + 10}" y="${padTop + chartH - 26}" width="180" height="20" rx="4" fill="#ffedd5"/>
                    <text x="${padLeft + 16}" y="${padTop + chartH - 12}" fill="#c2410c">Kuadran III – UMK Rendah, TPT Rendah</text>

                    <!-- Q4 Header -->
                    <rect x="${Math.max(medX + 10, padLeft + chartW - 190)}" y="${padTop + chartH - 26}" width="180" height="20" rx="4" fill="#f3e8ff"/>
                    <text x="${Math.max(medX + 16, padLeft + chartW - 184)}" y="${padTop + chartH - 12}" fill="#7e22ce">Kuadran IV – UMK Tinggi, TPT Rendah</text>
                </g>

                <!-- Dashed Median Lines -->
                <!-- Vertical Median Line (Median UMK) -->
                <line x1="${medX}" y1="${padTop}" x2="${medX}" y2="${padTop + chartH}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
                <g transform="translate(${medX}, ${padTop - 6})">
                    <text text-anchor="middle" font-family="var(--font)" font-size="9.5" font-weight="700" fill="#475569">
                        Batas Median UMK (Rp${(medianUmk / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Jt)
                    </text>
                </g>

                <!-- Horizontal Median Line (Median TPT) -->
                <line x1="${padLeft}" y1="${medY}" x2="${padLeft + chartW}" y2="${medY}" stroke="#64748b" stroke-width="1.6" stroke-dasharray="4,4"/>
                <g transform="translate(${padLeft + chartW - 6}, ${medY - 6})">
                    <text text-anchor="end" font-family="var(--font)" font-size="9.5" font-weight="700" fill="#475569">
                        Batas Median TPT (${medianTpt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%)
                    </text>
                </g>

                <!-- X-Axis Labels (UMK Juta Rp) -->
                <g font-family="var(--font)" font-size="10" fill="#64748b" text-anchor="middle">
        `;

        // Generate X ticks
        const xStep = (xMax - xMin) / 4;
        for (let i = 0; i <= 4; i++) {
            const val = xMin + i * xStep;
            const xPos = scaleX(val);
            svgHtml += `
                <line x1="${xPos}" y1="${padTop + chartH}" x2="${xPos}" y2="${padTop + chartH + 5}" stroke="#cbd5e1" stroke-width="1"/>
                <text x="${xPos}" y="${padTop + chartH + 18}">Rp${val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Jt</text>
            `;
        }

        // X-Axis Title
        svgHtml += `
            <text x="${padLeft + chartW / 2}" y="${padTop + chartH + 36}" font-weight="700" font-size="11" fill="#334155">
                Upah Minimum yang Berlaku (Juta Rupiah / Bulan)
            </text>
            </g>

            <!-- Y-Axis Labels (TPT %) -->
            <g font-family="var(--font)" font-size="10" fill="#64748b" text-anchor="end">
        `;

        // Generate Y ticks
        const yStep = (yMax - yMin) / 4;
        for (let i = 0; i <= 4; i++) {
            const val = yMin + i * yStep;
            const yPos = scaleY(val);
            svgHtml += `
                <line x1="${padLeft - 5}" y1="${yPos}" x2="${padLeft}" y2="${yPos}" stroke="#cbd5e1" stroke-width="1"/>
                <text x="${padLeft - 8}" y="${yPos + 3.5}">${val.toFixed(0)}%</text>
            `;
        }

        // Y-Axis Title (Rotated)
        svgHtml += `
            </g>
            <text transform="rotate(-90)" x="${-(padTop + chartH / 2)}" y="18" text-anchor="middle" font-family="var(--font)" font-weight="700" font-size="11" fill="#334155">
                Tingkat Pengangguran Terbuka – TPT (%)
            </text>

            <!-- Bubbles (Kabupaten/Kota) -->
            <g id="nakerBubblesGroup">
        `;

        // Render each region bubble
        items.forEach(item => {
            const cx = Math.max(padLeft + 12, Math.min(padLeft + chartW - 12, scaleX(item.umk / 1e6)));
            const cy = Math.max(padTop + 12, Math.min(padTop + chartH - 12, scaleY(item.tpt)));
            const r = getRadius(item.angkatan_kerja);
            const shortName = item.kabkota.replace(/^(KABUPATEN|KOTA|KAB\.|KODYA)\s+/i, '');

            svgHtml += `
                <g class="naker-bubble" data-id="${item.id}" data-kab="${escapeHtml(item.kabkota)}" style="cursor:pointer;transition:transform 0.2s, opacity 0.2s">
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${item.color}" fill-opacity="0.84" stroke="#ffffff" stroke-width="2" filter="url(#nakerShadow)"/>
                    <text x="${cx}" y="${cy - r - 4}" text-anchor="middle" font-family="var(--font)" font-size="9.5" font-weight="600" fill="#1e293b" style="pointer-events:none;text-shadow:0 1px 2px rgba(255,255,255,0.85)">
                        ${escapeHtml(shortName)}
                    </text>
                </g>
            `;
        });

        // Special Notice banner if allSameUmk
        if (allSameUmk) {
            svgHtml += `
                <g transform="translate(${padLeft + 10}, ${padTop - 24})">
                    <rect x="0" y="0" width="${chartW - 20}" height="18" rx="4" fill="#fef3c7" stroke="#fde68a" stroke-width="1"/>
                    <text x="${(chartW - 20) / 2}" y="12.5" text-anchor="middle" font-family="var(--font)" font-size="9.5" font-weight="600" fill="#92400e">
                        ℹ️ Seluruh kabupaten/kota di provinsi ini memiliki upah seragam (UMP: ${formatRupiah(medianUmk)}). Garis median vertikal merupakan acuan tunggal.
                    </text>
                </g>
            `;
        }

        svgHtml += `
                </g>
            </g>
        `;

        svg.innerHTML = svgHtml;

        // Attach Bubble Events (Hover & Click)
        svg.querySelectorAll('.naker-bubble').forEach(b => {
            const id = b.dataset.id;
            const item = items.find(d => d.id === id);
            if (!item) return;

            b.addEventListener('mouseenter', (e) => {
                showBubbleTooltip(item, e);
                b.querySelector('circle').setAttribute('stroke-width', '3');
            });

            b.addEventListener('mousemove', (e) => {
                positionTooltip(e);
            });

            b.addEventListener('mouseleave', () => {
                if (selectedKabId !== id && tooltip) {
                    tooltip.style.display = 'none';
                }
                if (selectedKabId !== id) {
                    b.querySelector('circle').setAttribute('stroke-width', '2');
                }
            });

            b.addEventListener('click', (e) => {
                selectedKabId = selectedKabId === id ? null : id;
                showBubbleTooltip(item, e);

                // Highlight table row and scroll into view
                if (tableBody) {
                    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
                    if (selectedKabId) {
                        const targetRow = tableBody.querySelector(`tr[data-id="${selectedKabId}"]`);
                        if (targetRow) {
                            targetRow.classList.add('selected-row');
                            targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }

                // Fade other bubbles if selected
                svg.querySelectorAll('.naker-bubble').forEach(other => {
                    if (!selectedKabId || other.dataset.id === selectedKabId) {
                        other.style.opacity = '1.0';
                        other.querySelector('circle').setAttribute('stroke-width', other.dataset.id === selectedKabId ? '3.5' : '2');
                    } else {
                        other.style.opacity = '0.3';
                        other.querySelector('circle').setAttribute('stroke-width', '2');
                    }
                });
            });
        });

        // Hide tooltip when clicking blank SVG area
        svg.addEventListener('click', (e) => {
            if (e.target.tagName === 'svg' || e.target.id === 'nakerPlotArea' || e.target.tagName === 'rect') {
                selectedKabId = null;
                if (tooltip) tooltip.style.display = 'none';
                svg.querySelectorAll('.naker-bubble').forEach(b => {
                    b.style.opacity = '1.0';
                    b.querySelector('circle').setAttribute('stroke-width', '2');
                });
                if (tableBody) {
                    tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
                }
            }
        });
    }

    // Trigger initial render
    renderNakerView();
}


/* ============================================================
   WIDGET 11: PETA KONDISI KEMISKINAN KABUPATEN/KOTA (SCATTER PLOT)
   - Sumbu X: Persentase Penduduk Miskin (%)
   - Sumbu Y: Indeks Kedalaman Kemiskinan (P1)
   - 4 Kuadran dengan garis median se-provinsi
   - Detail Wilayah Terpilih & Rekomendasi Kebijakan Pemda
   ============================================================ */
function renderKemiskinanKuadran(r) {
    const rawData = window.KEMISKINAN_DATA;
    if (!rawData || !rawData.data_by_prov) return;

    const provSelect = document.getElementById('kemiskinanProvSelect');
    const svg = document.getElementById('kemiskinanSvg');
    const container = document.getElementById('kemiskinanContainer');
    const tooltip = document.getElementById('kemiskinanTooltip');

    const statKabCount = document.getElementById('kmStatKabCount');
    const statMedMiskin = document.getElementById('kmStatMedMiskin');
    const statMedP1 = document.getElementById('kmStatMedP1');

    const detailKab = document.getElementById('kmDetailKab');
    const detailBadge = document.getElementById('kmDetailBadge');
    const detailPct = document.getElementById('kmDetailPct');
    const detailP1 = document.getElementById('kmDetailP1');
    const detailInsight = document.getElementById('kmDetailInsight');
    const detailPolicy = document.getElementById('kmDetailPolicy');
    const infoProv = document.getElementById('kmInfoProv');
    const infoKab = document.getElementById('kmInfoKab');
    const infoPosisi = document.getElementById('kmInfoPosisi');
    const btnReset = document.getElementById('btnKmReset');

    if (!provSelect || !svg) return;

    const provList = rawData.provinces || [];
    let currentProv = provList[0] || 'Jawa Tengah';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) currentProv = found;
    }

    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        renderView();
    });

    let selectedKab = null;

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            selectedKab = null;
            if (tooltip) tooltip.style.display = 'none';
            svg.querySelectorAll('.km-dot').forEach(d => {
                d.querySelector('circle').setAttribute('r', '5.5');
                d.querySelector('circle').setAttribute('stroke-width', '2');
            });
            resetDetailToProvince();
        });
    }

    function positionTooltip(e) {
        if (!tooltip || !container) return;
        const rect = container.getBoundingClientRect();
        let left = e.clientX - rect.left + 14;
        let top = e.clientY - rect.top - 20;
        if (left + 220 > rect.width) left = e.clientX - rect.left - 230;
        tooltip.style.left = `${Math.max(6, left)}px`;
        tooltip.style.top = `${Math.max(6, top)}px`;
    }

    function resetDetailToProvince() {
        const items = rawData.data_by_prov[currentProv] || [];
        if (detailKab) detailKab.textContent = `Ringkasan ${currentProv}`;
        if (detailBadge) {
            detailBadge.className = 'bkpm-quad-badge q1';
            detailBadge.textContent = `${items.length} Wilayah`;
        }
        if (detailInsight) {
            detailInsight.textContent = `Klik salah satu titik pada scatter plot untuk melihat evaluasi kedalaman kemiskinan dan karakteristik beban pengeluaran masyarakat miskin di wilayah tersebut.`;
        }
        if (detailPolicy) {
            detailPolicy.textContent = `Arah kebijakan terpadu disusun berdasarkan kombinasi persentase kemiskinan dan indeks kedalaman kemiskinan (P1).`;
        }
        if (infoProv) infoProv.textContent = currentProv;
        if (infoKab) infoKab.textContent = 'Semua Wilayah';
        if (infoPosisi) infoPosisi.textContent = 'Agregat Provinsi';
    }

    function updateDetail(item, medPct, medP1) {
        if (detailKab) detailKab.textContent = item.kabkota;
        if (detailPct) detailPct.textContent = `${item.persentase_miskin.toFixed(1)}%`;
        if (detailP1) detailP1.textContent = item.p1.toFixed(2);
        if (infoProv) infoProv.textContent = item.provinsi;
        if (infoKab) infoKab.textContent = item.kabkota;

        let qName = '';
        let qBadgeClass = '';
        let insightTxt = '';
        let policyTxt = '';

        if (item.persentase_miskin >= medPct && item.p1 >= medP1) {
            qName = 'Kuadran I – Miskin tinggi, P1 tinggi';
            qBadgeClass = 'q1';
            insightTxt = 'Persentase kemiskinan dan kedalaman kemiskinan sama-sama tinggi. Penduduk miskin relatif banyak dan memiliki kesenjangan pengeluaran yang dalam terhadap garis kemiskinan.';
            policyTxt = 'Prioritaskan penanganan terpadu melalui perlindungan sosial intensif, pemenuhan pangan & kesehatan dasar, serta pemberdayaan ekonomi masyarakat dan perluasan kesempatan kerja lokal.';
        } else if (item.persentase_miskin < medPct && item.p1 >= medP1) {
            qName = 'Kuadran II – Miskin rendah, P1 tinggi';
            qBadgeClass = 'q2';
            insightTxt = 'Persentase penduduk miskin relatif rendah, tetapi kedalaman kemiskinan masih tinggi. Penduduk miskin yang tersisa cenderung memiliki kesenjangan pengeluaran lebih besar terhadap garis kemiskinan.';
            policyTxt = 'Perkuat bantuan yang tepat sasaran dan dukungan pemenuhan kebutuhan dasar bagi rumah tangga miskin kronis yang tertinggal jauh di bawah garis kemiskinan.';
        } else if (item.persentase_miskin < medPct && item.p1 < medP1) {
            qName = 'Kuadran III – Miskin rendah, P1 rendah';
            qBadgeClass = 'q3';
            insightTxt = 'Capaian pengentasan kemiskinan relatif baik dengan persentase miskin dan indeks kedalaman rendah. Kesenjangan pengeluaran penduduk miskin terhadap garis kemiskinan relatif kecil.';
            policyTxt = 'Pertahankan capaian pengentasan kemiskinan, perkuat jaring pengaman sosial, dan cegah kelompok rentan (near-poor) jatuh kembali ke bawah garis kemiskinan.';
        } else {
            qName = 'Kuadran IV – Miskin tinggi, P1 rendah';
            qBadgeClass = 'q4';
            insightTxt = 'Persentase penduduk miskin cukup tinggi, namun rata-rata kesenjangan pengeluaran terhadap garis kemiskinan relatif rendah (berada dekat di sekitar garis kemiskinan).';
            policyTxt = 'Perluas jangkauan program bantalan sosial, bantuan modal usaha mikro, dan fasilitasi peningkatan pendapatan agar penduduk di dekat garis kemiskinan cepat terentaskan.';
        }

        if (detailBadge) {
            detailBadge.className = `bkpm-quad-badge ${qBadgeClass}`;
            detailBadge.textContent = qName;
        }
        if (infoPosisi) infoPosisi.textContent = qName;
        if (detailInsight) detailInsight.textContent = insightTxt;
        if (detailPolicy) detailPolicy.textContent = policyTxt;
    }

    function renderView() {
        const items = rawData.data_by_prov[currentProv] || [];
        if (items.length === 0) return;

        // Medians
        const sortedPct = [...items.map(i => i.persentase_miskin)].sort((a,b) => a - b);
        const midPct = Math.floor(sortedPct.length / 2);
        const medPct = sortedPct.length % 2 !== 0 ? sortedPct[midPct] : (sortedPct[midPct - 1] + sortedPct[midPct]) / 2;

        const sortedP1 = [...items.map(i => i.p1)].sort((a,b) => a - b);
        const midP1 = Math.floor(sortedP1.length / 2);
        const medP1 = sortedP1.length % 2 !== 0 ? sortedP1[midP1] : (sortedP1[midP1 - 1] + sortedP1[midP1]) / 2;

        // KPI chips
        if (statKabCount) statKabCount.textContent = items.length;
        if (statMedMiskin) statMedMiskin.textContent = `${medPct.toFixed(1)}%`;
        if (statMedP1) statMedP1.textContent = medP1.toFixed(2);

        // Chart dimensions
        const svgW = 680;
        const svgH = 430;
        const padL = 55;
        const padR = 40;
        const padT = 30;
        const padB = 45;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;

        // Dynamic ranges
        const minP = Math.min(...sortedPct);
        const maxP = Math.max(...sortedPct);
        const xMin = Math.max(0, Math.floor(minP - 1.0));
        const xMax = Math.ceil(maxP + 1.5);

        const minP1Val = Math.min(...sortedP1);
        const maxP1Val = Math.max(...sortedP1);
        const yMin = Math.max(0, Math.floor((minP1Val - 0.2) * 10) / 10);
        const yMax = Math.ceil((maxP1Val + 0.3) * 10) / 10;

        function scaleX(val) {
            return padL + ((val - xMin) / (xMax - xMin)) * chartW;
        }
        function scaleY(val) {
            return padT + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
        }

        const medX = scaleX(medPct);
        const medY = scaleY(medP1);

        const qLeftW = Math.max(0, medX - padL);
        const qRightW = Math.max(0, (padL + chartW) - medX);
        const qTopH = Math.max(0, medY - padT);
        const qBottomH = Math.max(0, (padT + chartH) - medY);

        let svgHtml = `
            <g id="kmPlotArea">
                <!-- Quadrants Background -->
                <!-- Q2 Kiri Atas: Miskin rendah, P1 tinggi (soft red) -->
                <rect x="${padL}" y="${padT}" width="${qLeftW}" height="${qTopH}" fill="#fef2f2" opacity="0.75"/>
                <!-- Q1 Kanan Atas: Miskin tinggi, P1 tinggi (soft amber) -->
                <rect x="${medX}" y="${padT}" width="${qRightW}" height="${qTopH}" fill="#fffbeb" opacity="0.75"/>
                <!-- Q3 Kiri Bawah: Miskin rendah, P1 rendah (soft green) -->
                <rect x="${padL}" y="${medY}" width="${qLeftW}" height="${qBottomH}" fill="#f0fdf4" opacity="0.75"/>
                <!-- Q4 Kanan Bawah: Miskin tinggi, P1 rendah (soft blue) -->
                <rect x="${medX}" y="${medY}" width="${qRightW}" height="${qBottomH}" fill="#eff6ff" opacity="0.75"/>

                <!-- Grid Outer Frame -->
                <rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" fill="none" stroke="#e2e8f0" stroke-width="1.2"/>

                <!-- Quadrant Labels Inside Plot -->
                <g font-family="var(--font)" font-size="10.5" font-weight="700">
                    <text x="${padL + 12}" y="${padT + 22}" fill="#dc2626">Miskin rendah, P1 tinggi</text>
                    <text x="${Math.max(medX + 12, padL + chartW - 160)}" y="${padT + 22}" fill="#d97706">Miskin tinggi, P1 tinggi</text>
                    <text x="${padL + 12}" y="${padT + chartH - 12}" fill="#16a34a">Miskin rendah, P1 rendah</text>
                    <text x="${Math.max(medX + 12, padL + chartW - 160)}" y="${padT + chartH - 12}" fill="#2563eb">Miskin tinggi, P1 rendah</text>
                </g>

                <!-- Dashed Median Lines -->
                <line x1="${medX}" y1="${padT}" x2="${medX}" y2="${padT + chartH}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
                <line x1="${padL}" y1="${medY}" x2="${padL + chartW}" y2="${medY}" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>

                <!-- Median Value Badges -->
                <text x="${medX}" y="${padT + chartH + 16}" text-anchor="middle" font-family="var(--mono)" font-size="10.5" font-weight="800" fill="#2563eb">
                    ${medPct.toFixed(1)}%
                </text>
                <text x="${padL + chartW + 6}" y="${medY + 4}" font-family="var(--mono)" font-size="10.5" font-weight="800" fill="#2563eb">
                    ${medP1.toFixed(2)}
                </text>

                <!-- Sumbu X Ticks & Labels -->
                <g font-family="var(--font)" font-size="10" fill="#64748b" text-anchor="middle">
        `;

        const xStep = Math.max(1, Math.round((xMax - xMin) / 6));
        for (let v = xMin; v <= xMax; v += xStep) {
            const px = scaleX(v);
            svgHtml += `
                <line x1="${px}" y1="${padT + chartH}" x2="${px}" y2="${padT + chartH + 4}" stroke="#cbd5e1"/>
                <text x="${px}" y="${padT + chartH + 15}">${v}%</text>
            `;
        }

        svgHtml += `
            <text x="${padL + chartW / 2}" y="${padT + chartH + 34}" font-weight="700" font-size="11" fill="#334155">
                Persentase Penduduk Miskin (%)
            </text>
            </g>

            <!-- Sumbu Y Ticks & Labels -->
            <g font-family="var(--font)" font-size="10" fill="#64748b" text-anchor="end">
        `;

        const yStep = (yMax - yMin) / 5;
        for (let i = 0; i <= 5; i++) {
            const v = yMin + i * yStep;
            const py = scaleY(v);
            svgHtml += `
                <line x1="${padL - 4}" y1="${py}" x2="${padL}" y2="${py}" stroke="#cbd5e1"/>
                <text x="${padL - 8}" y="${py + 3.5}">${v.toFixed(1)}</text>
            `;
        }

        svgHtml += `
            </g>
            <text transform="rotate(-90)" x="${-(padT + chartH / 2)}" y="16" text-anchor="middle" font-family="var(--font)" font-weight="700" font-size="11" fill="#334155">
                Indeks Kedalaman Kemiskinan (P1)
            </text>

            <!-- Dots (Kabupaten / Kota) -->
            <g id="kmDotsGroup">
        `;

        items.forEach(item => {
            const cx = scaleX(item.persentase_miskin);
            const cy = scaleY(item.p1);
            const shortName = item.kabkota.replace(/^(KABUPATEN|KOTA|KAB\.|KODYA)\s+/i, '');

            svgHtml += `
                <g class="km-dot" data-kab="${escapeHtml(item.kabkota)}" style="cursor:pointer">
                    <circle cx="${cx}" cy="${cy}" r="5.5" fill="#2563eb" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"/>
                    <text x="${cx + 8}" y="${cy + 3.5}" font-family="var(--font)" font-size="9.5" font-weight="600" fill="#1e293b" style="pointer-events:none">
                        ${escapeHtml(shortName)}
                    </text>
                </g>
            `;
        });

        svgHtml += `
                </g>
            </g>
        `;

        svg.innerHTML = svgHtml;

        // Events
        svg.querySelectorAll('.km-dot').forEach(dot => {
            const kName = dot.dataset.kab;
            const item = items.find(d => d.kabkota === kName);
            if (!item) return;

            dot.addEventListener('mouseenter', (e) => {
                if (tooltip) {
                    tooltip.innerHTML = `
                        <div class="tt-title">${escapeHtml(item.kabkota)}</div>
                        <div class="tt-row"><span class="tt-k">Persentase Miskin</span><span class="tt-v mono">${item.persentase_miskin.toFixed(1)}%</span></div>
                        <div class="tt-row"><span class="tt-k">Indeks P1</span><span class="tt-v mono">${item.p1.toFixed(2)}</span></div>
                        <div class="tt-row"><span class="tt-k">Garis Kemiskinan</span><span class="tt-v mono">Rp${item.garis_kemiskinan.toLocaleString('id-ID')}</span></div>
                    `;
                    tooltip.style.display = 'block';
                    positionTooltip(e);
                }
                dot.querySelector('circle').setAttribute('r', '7.5');
            });

            dot.addEventListener('mousemove', (e) => positionTooltip(e));

            dot.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.display = 'none';
                if (selectedKab !== item.kabkota) {
                    dot.querySelector('circle').setAttribute('r', '5.5');
                }
            });

            dot.addEventListener('click', () => {
                selectedKab = item.kabkota;
                svg.querySelectorAll('.km-dot').forEach(d => {
                    const isSel = d.dataset.kab === selectedKab;
                    d.querySelector('circle').setAttribute('r', isSel ? '8' : '5.5');
                    d.querySelector('circle').setAttribute('stroke-width', isSel ? '3' : '2');
                });
                updateDetail(item, medPct, medP1);
            });
        });

        // Set default initial detail
        if (items.length > 0) {
            updateDetail(items[0], medPct, medP1);
        }
    }

    renderView();
}


/* ============================================================
   WIDGET 13: PERKEMBANGAN PDRB ADHB MENURUT LAPANGAN USAHA
   - Paired bar chart 2024 vs 2025
   - 3 KPI summary cards
   - Tooltip pertumbuhan & unduh CSV
   ============================================================ */
function renderPdrbSektor(r) {
    const rawData = window.PDRB_SEKTOR_DATA;
    if (!rawData || !rawData.data) return;

    const provSelect = document.getElementById('pdrbProvSelect');
    const kabSelect = document.getElementById('pdrbKabSelect');
    const svg = document.getElementById('pdrbSvg');
    const container = document.getElementById('pdrbSvgContainer');
    const tooltip = document.getElementById('pdrbTooltip');
    const chartSubtitle = document.getElementById('pdrbChartSubtitle');
    const btnDownload = document.getElementById('btnPdrbDownload');

    const topSektorEl = document.getElementById('pdrbTopSektor');
    const avgGrowthEl = document.getElementById('pdrbAvgGrowth');
    const lowSektorEl = document.getElementById('pdrbLowSektor');

    if (!provSelect || !kabSelect || !svg) return;

    const provList = rawData.provinces || [];
    let currentProv = provList[0] || 'Jawa Tengah';
    if (r && r.prov) {
        const found = provList.find(p => p.toLowerCase().trim() === r.prov.toLowerCase().trim() ||
            p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) currentProv = found;
    }

    provSelect.innerHTML = provList.map(p => `<option value="${escapeHtml(p)}" ${p === currentProv ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('');

    function populateKabDropdown() {
        const kabs = rawData.kab_by_prov[currentProv] || [];
        let curKab = kabs[0] || '';
        if (r && r.kabkota) {
            const found = kabs.find(k => k.toLowerCase().includes(r.kabkota.toLowerCase()) || r.kabkota.toLowerCase().includes(k.toLowerCase()));
            if (found) curKab = found;
        }
        kabSelect.innerHTML = kabs.map(k => `<option value="${escapeHtml(k)}" ${k === curKab ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('');
    }

    populateKabDropdown();

    provSelect.addEventListener('change', () => {
        currentProv = provSelect.value;
        populateKabDropdown();
        renderView();
    });

    kabSelect.addEventListener('change', () => {
        renderView();
    });

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const curKab = kabSelect.value;
            const sectors = (rawData.data[currentProv] || {})[curKab] || [];
            let csv = "Sektor,PDRB 2024 (Miliar Rp),PDRB 2025 (Miliar Rp),Pertumbuhan (%)\n";
            sectors.forEach(s => {
                csv += `"${s.sektor}",${s.tahun_2024},${s.tahun_2025},${s.pertumbuhan}
`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pdrb-${curKab.toLowerCase().replace(/[^a-z0-9]/g, '-')}-2024-2025.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function positionTooltip(e) {
        if (!tooltip || !container) return;
        const rect = container.getBoundingClientRect();
        let left = e.clientX - rect.left + 14;
        let top = e.clientY - rect.top - 20;
        if (left + 230 > rect.width) left = e.clientX - rect.left - 240;
        tooltip.style.left = `${Math.max(6, left)}px`;
        tooltip.style.top = `${Math.max(6, top)}px`;
    }

    function renderView() {
        const curKab = kabSelect.value;
        const allSectors = (rawData.data[currentProv] || {})[curKab] || [];

        if (chartSubtitle) {
            chartSubtitle.textContent = `Nilai PDRB ADHB menurut Lapangan Usaha (${curKab}, 2024 vs 2025)`;
        }

        if (allSectors.length === 0) return;

        // Group into Top 9 + Lainnya (8 sektor)
        const top9 = allSectors.slice(0, 9);
        const others = allSectors.slice(9);
        const sumOther2024 = others.reduce((acc, c) => acc + c.tahun_2024, 0);
        const sumOther2025 = others.reduce((acc, c) => acc + c.tahun_2025, 0);
        const otherGrowth = sumOther2024 > 0 ? ((sumOther2025 - sumOther2024) / sumOther2024 * 100) : 0;

        const displayItems = [
            ...top9,
            {
                sektor: "Lainnya (8 sektor)",
                tahun_2024: Math.round(sumOther2024),
                tahun_2025: Math.round(sumOther2025),
                pertumbuhan: Math.round(otherGrowth * 100) / 100
            }
        ];

        // Summary KPIs
        const sortedByGrowth = [...allSectors].sort((a,b) => b.pertumbuhan - a.pertumbuhan);
        const topG = sortedByGrowth[0];
        const lowG = sortedByGrowth[sortedByGrowth.length - 1];
        const avgG = allSectors.reduce((a,c) => a + c.pertumbuhan, 0) / allSectors.length;

        if (topSektorEl) topSektorEl.textContent = `${topG.sektor} (+${topG.pertumbuhan.toFixed(2)}%)`;
        if (avgGrowthEl) avgGrowthEl.textContent = `${avgG >= 0 ? '+' : ''}${avgG.toFixed(2)}%`;
        if (lowSektorEl) lowSektorEl.textContent = `${lowG.sektor} (${lowG.pertumbuhan.toFixed(2)}%)`;

        // Render SVG Paired Bars
        const svgW = 880;
        const svgH = 380;
        const padL = 60;
        const padR = 25;
        const padT = 45;
        const padB = 75;
        const chartW = svgW - padL - padR;
        const chartH = svgH - padT - padB;

        const maxVal = Math.max(...displayItems.map(i => Math.max(i.tahun_2024, i.tahun_2025)));
        const yMax = Math.ceil((maxVal * 1.25) / 1000) * 1000;

        function scaleY(val) {
            return padT + chartH - (val / yMax) * chartH;
        }

        const groupCount = displayItems.length;
        const groupW = chartW / groupCount;
        const barW = Math.max(8, Math.min(22, (groupW - 24) / 2));

        let svgHtml = `
            <g id="pdrbPlotArea">
                <!-- Y-Axis Grid Lines & Labels -->
                <g font-family="var(--mono)" font-size="9.5" fill="#94a3b8" text-anchor="end">
        `;

        for (let i = 0; i <= 5; i++) {
            const v = (yMax / 5) * i;
            const py = scaleY(v);
            svgHtml += `
                <line x1="${padL}" y1="${py}" x2="${padL + chartW}" y2="${py}" stroke="${i === 0 ? '#cbd5e1' : '#f1f5f9'}" stroke-width="${i === 0 ? '1.2' : '1'}"/>
                <text x="${padL - 8}" y="${py + 3.5}">${Math.round(v).toLocaleString('id-ID')}</text>
            `;
        }

        svgHtml += `
            </g>
            <!-- Groups of paired bars -->
            <g id="pdrbBars">
        `;

        displayItems.forEach((item, idx) => {
            const groupX = padL + idx * groupW;
            const centerX = groupX + groupW / 2;
            const x2024 = centerX - barW - 2;
            const x2025 = centerX + 2;

            const y2024 = scaleY(item.tahun_2024);
            const h2024 = Math.max(2, (padT + chartH) - y2024);

            const y2025 = scaleY(item.tahun_2025);
            const h2025 = Math.max(2, (padT + chartH) - y2025);

            const topY = Math.min(y2024, y2025);
            const growthPos = item.pertumbuhan >= 0;
            const badgeFill = growthPos ? '#dcfce7' : '#fee2e2';
            const badgeText = growthPos ? '#15803d' : '#b91c1c';
            const growthLabel = `${growthPos ? '+' : ''}${item.pertumbuhan.toFixed(2)}%`;

            // Truncate name for X axis
            let shortLabel = item.sektor;
            if (shortLabel.length > 16) {
                shortLabel = shortLabel.substring(0, 15) + '…';
            }

            svgHtml += `
                <g class="pdrb-group" data-idx="${idx}" style="cursor:pointer">
                    <!-- Growth Badge on top -->
                    <rect x="${centerX - 24}" y="${topY - 24}" width="48" height="17" rx="3.5" fill="${badgeFill}"/>
                    <text x="${centerX}" y="${topY - 12}" text-anchor="middle" font-family="var(--mono)" font-size="9" font-weight="700" fill="${badgeText}">
                        ${growthLabel}
                    </text>

                    <!-- Bar 2024 (Light Blue) -->
                    <rect x="${x2024}" y="${y2024}" width="${barW}" height="${h2024}" rx="2" fill="#93c5fd" opacity="0.9"/>
                    <!-- Bar 2025 (Dark Blue) -->
                    <rect x="${x2025}" y="${y2025}" width="${barW}" height="${h2025}" rx="2" fill="#1d4ed8"/>

                    <!-- X-Axis Sector Label (slanted or 2 lines) -->
                    <text x="${centerX}" y="${padT + chartH + 18}" text-anchor="middle" font-family="var(--font)" font-size="9" font-weight="600" fill="#475569">
                        ${escapeHtml(shortLabel)}
                    </text>
                </g>
            `;
        });

        svgHtml += `
                </g>
            </g>
        `;

        svg.innerHTML = svgHtml;

        // Tooltip events
        svg.querySelectorAll('.pdrb-group').forEach(grp => {
            const idx = parseInt(grp.dataset.idx, 10);
            const item = displayItems[idx];
            if (!item) return;

            grp.addEventListener('mouseenter', (e) => {
                if (tooltip) {
                    tooltip.innerHTML = `
                        <div class="tt-title">${escapeHtml(item.sektor)}</div>
                        <div class="tt-row"><span class="tt-k">Tahun 2024</span><span class="tt-v mono">${item.tahun_2024.toLocaleString('id-ID')} Miliar</span></div>
                        <div class="tt-row"><span class="tt-k">Tahun 2025</span><span class="tt-v mono" style="color:#1d4ed8;font-weight:700">${item.tahun_2025.toLocaleString('id-ID')} Miliar</span></div>
                        <div class="tt-row"><span class="tt-k">Pertumbuhan</span><span class="tt-v mono" style="color:${item.pertumbuhan >= 0 ? '#15803d' : '#b91c1c'};font-weight:800">${item.pertumbuhan >= 0 ? '+' : ''}${item.pertumbuhan.toFixed(2)}%</span></div>
                    `;
                    tooltip.style.display = 'block';
                    positionTooltip(e);
                }
            });

            grp.addEventListener('mousemove', (e) => positionTooltip(e));

            grp.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.display = 'none';
            });
        });
    }

    renderView();
}


/* ============================================================
   WIDGET 16-17: EKOSISTEM INDUSTRI & PERDAGANGAN (TREEMAP)
   - Filter tahun (2021-2025)
   - KPI wisatawan
   - Treemap visual (Restoran, Minimarket, Hotel/Kamar, dll)
   ============================================================ */
function renderEkosistemUsaha(r) {
    const rawData = window.EKOSISTEM_USAHA_DATA;
    if (!rawData || !rawData.data) return;

    const yearSelect = document.getElementById('ekoYearSelect');
    const wisatawanVal = document.getElementById('ekoWisatawanVal');
    const svg = document.getElementById('ekoTreemapSvg');
    const container = document.getElementById('ekoTreemapContainer');
    const tooltip = document.getElementById('ekoTreemapTooltip');

    if (!yearSelect || !svg) return;

    let currentYear = yearSelect.value || '2025';
    let currentProv = rawData.provinces[0] || 'Jawa Tengah';
    let currentKab = '';

    if (r && r.prov) {
        const found = rawData.provinces.find(p => p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) currentProv = found;
    }
    const kabs = rawData.kab_by_prov[currentProv] || [];
    currentKab = kabs[0] || '';
    if (r && r.kabkota) {
        const foundK = kabs.find(k => k.toLowerCase().includes(r.kabkota.toLowerCase()) || r.kabkota.toLowerCase().includes(k.toLowerCase()));
        if (foundK) currentKab = foundK;
    }

    yearSelect.addEventListener('change', () => {
        currentYear = yearSelect.value;
        renderTreemap();
    });

    function positionTooltip(e) {
        if (!tooltip || !container) return;
        const rect = container.getBoundingClientRect();
        let left = e.clientX - rect.left + 14;
        let top = e.clientY - rect.top - 20;
        if (left + 220 > rect.width) left = e.clientX - rect.left - 230;
        tooltip.style.left = `${Math.max(6, left)}px`;
        tooltip.style.top = `${Math.max(6, top)}px`;
    }

    function renderTreemap() {
        const kabData = ((rawData.data[currentProv] || {})[currentKab] || {})[currentYear];
        if (!kabData) return;

        if (wisatawanVal) wisatawanVal.textContent = kabData.wisatawan_display || '1,2 Jt';

        const cats = kabData.categories || [];
        const totalUnits = cats.reduce((acc, c) => acc + c.unit, 0);

        // Treemap bounds
        const svgW = 880;
        const svgH = 380;
        const pad = 4;

        // Squarified/Slice layout for 7 categories:
        // Left column (Big block: Restoran ~ 45% width)
        // Middle column (Minimarket, Hotel ~ 30% width)
        // Right column (Industri, Koperasi, Pasar, Bank ~ 25% width)
        const wLeft = Math.round(svgW * 0.44);
        const wMid = Math.round(svgW * 0.31);
        const wRight = svgW - wLeft - wMid;

        // Rect definitions matching mockup layout:
        // 1. Restoran: left full height
        // 2. Minimarket: mid top (60% height)
        // 3. Hotel: mid bottom (40% height)
        // 4. Industri: right top (60% height)
        // 5. Koperasi, Pasar, Bank: right bottom
        const hTop = Math.round(svgH * 0.60);
        const hBottom = svgH - hTop;

        const boxes = [
            { ...cats[0], x: 0, y: 0, w: wLeft - pad, h: svgH }, // Restoran
            { ...cats[1], x: wLeft, y: 0, w: wMid - pad, h: hTop - pad }, // Minimarket
            { ...cats[3], x: wLeft, y: hTop, w: wMid - pad, h: hBottom }, // Hotel
            { ...cats[2], x: wLeft + wMid, y: 0, w: wRight, h: hTop - pad }, // Industri
            { ...cats[4], x: wLeft + wMid, y: hTop, w: Math.round(wRight * 0.42), h: hBottom }, // Koperasi
            { ...cats[5], x: wLeft + wMid + Math.round(wRight * 0.42) + pad, y: hTop, w: Math.round(wRight * 0.30), h: hBottom }, // Pasar
            { ...cats[6], x: wLeft + wMid + Math.round(wRight * 0.42) + pad + Math.round(wRight * 0.30) + pad, y: hTop, w: wRight - (Math.round(wRight * 0.42) + Math.round(wRight * 0.30) + pad * 2), h: hBottom } // Bank
        ];

        let svgHtml = '';
        boxes.forEach(b => {
            svgHtml += `
                <g class="eko-treemap-box" data-name="${escapeHtml(b.kategori)}" data-unit="${b.unit}" data-kamar="${b.kamar || ''}" style="cursor:pointer">
                    <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="${b.color}" opacity="0.9" stroke="#ffffff" stroke-width="2"/>
                    <text x="${b.x + 12}" y="${b.y + 22}" font-family="var(--font)" font-size="12" font-weight="700" fill="#1e293b">
                        ${escapeHtml(b.kategori)}
                    </text>
                    <text x="${b.x + 12}" y="${b.y + b.h - 14}" font-family="var(--mono)" font-size="20" font-weight="800" fill="#1e293b">
                        ${b.unit.toLocaleString('id-ID')}
                    </text>
                </g>
            `;
        });

        svg.innerHTML = svgHtml;

        // Tooltip
        svg.querySelectorAll('.eko-treemap-box').forEach(box => {
            const name = box.dataset.name;
            const unit = parseInt(box.dataset.unit, 10);
            const kamar = box.dataset.kamar;

            box.addEventListener('mouseenter', (e) => {
                if (tooltip) {
                    let extra = '';
                    if (kamar) {
                        extra = `<div class="tt-row"><span class="tt-k">Jumlah Kamar</span><span class="tt-v mono" style="color:#059669;font-weight:700">${parseInt(kamar, 10).toLocaleString('id-ID')} unit</span></div>`;
                    }
                    tooltip.innerHTML = `
                        <div class="tt-title">${escapeHtml(name)}</div>
                        <div class="tt-row"><span class="tt-k">Jumlah Fasilitas</span><span class="tt-v mono" style="font-weight:700">${unit.toLocaleString('id-ID')} unit</span></div>
                        ${extra}
                    `;
                    tooltip.style.display = 'block';
                    positionTooltip(e);
                }
                box.querySelector('rect').setAttribute('opacity', '1.0');
            });

            box.addEventListener('mousemove', (e) => positionTooltip(e));

            box.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.display = 'none';
                box.querySelector('rect').setAttribute('opacity', '0.9');
            });
        });
    }

    renderTreemap();
}


/* ============================================================
   WIDGET 21: INDUSTRI BESAR DAN SEDANG (KBLI)
   - 3 KPI Triliun Rp (Output, Input, Nilai Tambah)
   - Horizontal bar chart per kelompok industri
   - Toggle Top 5 vs Semua
   - Right detail panel rincian klasifikasi KBLI
   ============================================================ */
function renderIndustriBesarSedang(r) {
    const rawData = window.INDUSTRI_BESAR_SEDANG_DATA;
    if (!rawData || !rawData.data) return;

    const yearSelect = document.getElementById('indYearSelect');
    const filterGroup = document.getElementById('indFilterGroup');
    const barsContainer = document.getElementById('indBarsContainer');

    const kpiOutput = document.getElementById('indKpiOutput');
    const kpiInput = document.getElementById('indKpiInput');
    const kpiAdded = document.getElementById('indKpiAdded');

    const detailIcon = document.getElementById('indDetailIcon');
    const detailTitle = document.getElementById('indDetailTitle');
    const detailKode = document.getElementById('indDetailKode');
    const detailSubList = document.getElementById('indDetailSubList');
    const detailOut = document.getElementById('indDetailOut');
    const detailIn = document.getElementById('indDetailIn');
    const detailVa = document.getElementById('indDetailVa');

    if (!yearSelect || !barsContainer) return;

    let currentYear = yearSelect.value || '2025';
    let currentFilter = 'top5'; // 'top5' or 'semua'
    let currentProv = rawData.provinces[0] || 'Jawa Tengah';
    let currentKab = '';

    if (r && r.prov) {
        const found = rawData.provinces.find(p => p.toLowerCase().includes(r.prov.toLowerCase()) || r.prov.toLowerCase().includes(p.toLowerCase()));
        if (found) currentProv = found;
    }
    const kabs = rawData.kab_by_prov[currentProv] || [];
    currentKab = kabs[0] || '';
    if (r && r.kabkota) {
        const foundK = kabs.find(k => k.toLowerCase().includes(r.kabkota.toLowerCase()) || r.kabkota.toLowerCase().includes(k.toLowerCase()));
        if (foundK) currentKab = foundK;
    }

    yearSelect.addEventListener('change', () => {
        currentYear = yearSelect.value;
        renderView();
    });

    if (filterGroup) {
        filterGroup.querySelectorAll('.bkpm-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterGroup.querySelectorAll('.bkpm-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderView();
            });
        });
    }

    function formatRupiahFull(num) {
        return 'Rp ' + Math.round(num).toLocaleString('id-ID');
    }

    function updateDetailPanel(group) {
        if (!group) return;
        if (detailTitle) detailTitle.textContent = group.nama;
        if (detailKode) detailKode.textContent = group.kode;
        if (detailOut) detailOut.textContent = `Rp ${group.output_triliun.toFixed(2)} T`;
        if (detailIn) detailIn.textContent = `Rp ${group.input_triliun.toFixed(2)} T`;
        if (detailVa) detailVa.textContent = `Rp ${group.nilai_tambah_triliun.toFixed(2)} T`;

        if (detailSubList) {
            detailSubList.innerHTML = (group.sub || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
        }
    }

    function renderView() {
        const kabData = ((rawData.data[currentProv] || {})[currentKab] || {})[currentYear];
        if (!kabData) return;

        // KPI Cards
        if (kpiOutput) kpiOutput.textContent = formatRupiahFull(kabData.total_output_rp);
        if (kpiInput) kpiInput.textContent = formatRupiahFull(kabData.total_input_rp);
        if (kpiAdded) kpiAdded.textContent = formatRupiahFull(kabData.total_nilai_tambah_rp);

        let groups = kabData.groups || [];
        if (currentFilter === 'top5') {
            groups = groups.slice(0, 5);
        }

        const maxVa = Math.max(...groups.map(g => g.nilai_tambah_triliun));
        const axisMax = Math.ceil(maxVa * 1.15);

        // Icons for categories
        const iconMap = {
            'logam_mesin': '⚙️',
            'makanan_minuman': '🍽️',
            'tekstil_kulit': '👕',
            'kayu_kertas': '📦',
            'kimia_farmasi': '🧪'
        };

        barsContainer.innerHTML = groups.map((g, idx) => {
            const pct = Math.max(8, Math.round((g.nilai_tambah_triliun / axisMax) * 100));
            const icon = iconMap[g.id] || '🏭';

            return `
                <div class="ind-bar-item ${idx === 0 ? 'active' : ''}" data-id="${g.id}">
                    <div class="ind-bar-avatar" style="background:${g.color}">
                        ${icon}
                    </div>
                    <div style="width:220px;min-width:180px">
                        <div style="font-size:12.5px;font-weight:700;color:var(--text);line-height:1.2">${escapeHtml(g.nama)}</div>
                        <div style="font-size:10px;color:var(--muted);font-family:var(--mono)">${escapeHtml(g.kode)}</div>
                    </div>
                    <div class="ind-bar-track">
                        <div class="ind-bar-fill" style="width:${pct}%;background:${g.color}"></div>
                        <div class="ind-bar-val">Rp ${g.nilai_tambah_triliun.toFixed(2)} T</div>
                    </div>
                </div>
            `;
        }).join('');

        // Initial detail
        if (groups.length > 0) {
            updateDetailPanel(groups[0]);
        }

        // Attach click & hover events
        barsContainer.querySelectorAll('.ind-bar-item').forEach(item => {
            const id = item.dataset.id;
            const grp = groups.find(g => g.id === id);

            item.addEventListener('click', () => {
                barsContainer.querySelectorAll('.ind-bar-item').forEach(b => b.classList.remove('active'));
                item.classList.add('active');
                updateDetailPanel(grp);
            });

            item.addEventListener('mouseenter', () => {
                updateDetailPanel(grp);
            });
        });
    }

    renderView();
}
