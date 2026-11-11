/* ============================================================
   Portal Data Indonesia — Potensi Pajak Controller (potensi.js)
   Mengatur visualisasi titik POI, koridor jalan, zoom interaktif,
   sidebar kontrol, dan panel detail objek berbasis bukti PAD360.
   ============================================================ */

(function () {
    const fmt = (n) => (n !== null && n !== undefined ? Number(n).toLocaleString('id-ID') : '0');
    const rp = (v) => {
        if (!v) return 'Rp 0';
        if (v >= 1) return 'Rp ' + v.toFixed(2).replace('.', ',') + ' M';
        return 'Rp ' + Math.round(v * 1000) + ' Jt';
    };

    function formatDisplayName(rawName) {
        if (!rawName) return '';
        const s = rawName.trim();
        const overrides = {
            'KEPULAUAN BANGKA BELITUNG': 'Babel',
            'KEPULAUAN RIAU': 'Kep. Riau',
            'NUSA TENGGARA BARAT': 'NTB',
            'NUSA TENGGARA TIMUR': 'NTT',
            'DI YOGYAKARTA': 'DIY',
            'DKI JAKARTA': 'DKI',
            'JAWA BARAT': 'Jabar',
            'JAWA TENGAH': 'Jateng',
            'JAWA TIMUR': 'Jatim',
            'BANTEN': 'Banten',
            'SUMATERA UTARA': 'Sumut',
            'SUMATERA BARAT': 'Sumbar',
            'SUMATERA SELATAN': 'Sumsel',
            'SULAWESI UTARA': 'Sulut',
            'SULAWESI SELATAN': 'Sulsel',
            'SULAWESI TENGGARA': 'Sultra',
            'SULAWESI TENGAH': 'Sulteng',
            'SULAWESI BARAT': 'Sulbar',
            'KALIMANTAN TIMUR': 'Kaltim',
            'KALIMANTAN BARAT': 'Kalbar',
            'KALIMANTAN SELATAN': 'Kalsel',
            'KALIMANTAN TENGAH': 'Kalteng',
            'KALIMANTAN UTARA': 'Kaltara',
            'MALUKU UTARA': 'Malut',
            'PAPUA BARAT DAYA': 'Papua B.Daya',
            'PAPUA PEGUNUNGAN': 'Papua Peg.',
            'PAPUA SELATAN': 'Papua Sel.',
            'PAPUA TENGAH': 'Papua Tgh.'
        };
        if (overrides[s.toUpperCase()]) return overrides[s.toUpperCase()];
        const clean = s.replace(/^(KAB\.|KOTA)\s+/i, '');
        return clean.toLowerCase().replace(/(?:^|\s|-)\S/g, (char) => char.toUpperCase());
    }

    const ISLAND_REGIONS = [
        {
            id: 'sumatera',
            name: 'Wilayah Sumatera',
            shortName: 'Sumatera',
            lat: 0.5,
            lng: 101.5,
            zoom: 6.2,
            provIds: [
                'aceh', 'sumatera-utara', 'sumatera-barat', 'riau', 'kepulauan-riau',
                'jambi', 'sumatera-selatan', 'kepulauan-bangka-belitung', 'bengkulu', 'lampung'
            ]
        },
        {
            id: 'jawa',
            name: 'Wilayah Jawa',
            shortName: 'Jawa',
            lat: -7.2,
            lng: 109.8,
            zoom: 7.2,
            provIds: ['banten', 'dki-jakarta', 'jawa-barat', 'jawa-tengah', 'di-yogyakarta', 'jawa-timur']
        },
        {
            id: 'kalimantan',
            name: 'Wilayah Kalimantan',
            shortName: 'Kalimantan',
            lat: -0.2,
            lng: 114.0,
            zoom: 6.2,
            provIds: ['kalimantan-barat', 'kalimantan-tengah', 'kalimantan-selatan', 'kalimantan-timur', 'kalimantan-utara']
        },
        {
            id: 'sulawesi',
            name: 'Wilayah Sulawesi',
            shortName: 'Sulawesi',
            lat: -1.8,
            lng: 121.0,
            zoom: 6.2,
            provIds: ['sulawesi-utara', 'gorontalo', 'sulawesi-tengah', 'sulawesi-barat', 'sulawesi-selatan', 'sulawesi-tenggara']
        },
        {
            id: 'bali-nusa-tenggara',
            name: 'Bali & Nusa Tenggara',
            shortName: 'Bali & NT',
            lat: -8.6,
            lng: 118.5,
            zoom: 6.8,
            provIds: ['bali', 'nusa-tenggara-barat', 'nusa-tenggara-timur']
        },
        {
            id: 'maluku',
            name: 'Wilayah Maluku',
            shortName: 'Maluku',
            lat: -2.8,
            lng: 128.5,
            zoom: 6.5,
            provIds: ['maluku-utara', 'maluku']
        },
        {
            id: 'papua',
            name: 'Wilayah Papua',
            shortName: 'Papua',
            lat: -4.0,
            lng: 137.5,
            zoom: 6.2,
            provIds: ['papua-barat-daya', 'papua-barat', 'papua-tengah', 'papua-pegunungan', 'papua-selatan', 'papua']
        }
    ];

    class PotensiController {
        constructor() {
            this.map = null;
            this.active = false;
            this.data = null;
            this.state = {
                scope: 'nasional', // 'nasional' | 'pulau' | 'provinsi' | 'kota' | 'koridor'
                selectedIsland: null,
                selectedProv: null,
                selectedCity: null,
                selectedCorridor: null,
                selectedObject: null,
                categoryFilter: 'all',
                statusFilter: 'all'
            };

            this.tableState = {
                page: 1,
                pageSize: 25,
                contractFilter: 'all',
                kpiFilter: 'all',
                searchQuery: '',
                sortField: 'contract',
                sortAsc: true
            };

            this.layers = {
                clusters: L.layerGroup(),
                poiMarkers: L.layerGroup(),
                corridors: L.layerGroup(),
                checkpoints: L.layerGroup(),
                cityBoundary: L.layerGroup()
            };
        }

        init(map) {
            this.map = map;
            window.PotensiCtrl = this;
            this._isFlying = false;
            this.loadData().then(() => {
                this.renderHeaderFilters();
            });
            this.setupUI();
            this.initTable();
            this.bindEvents();
            this.setupSemanticZoom();
            this.renderHeaderFilters();
        }

        getData() {
            if (this.data) return this.data;
            if (typeof window !== 'undefined' && window.PotensiData) return window.PotensiData;
            return { provinces: [], cities: [], categories: [], corridors: {}, objects: {} };
        }

        async loadData() {
            this.data = typeof window !== 'undefined' && window.PotensiData ? window.PotensiData : null;
            try {
                const res = await fetch('data/json/potensi-data.json');
                if (res.ok) {
                    this.data = await res.json();
                    window.PotensiData = this.data;
                    this.renderHeaderFilters();
                    if (this.active) {
                        this.renderSidebar();
                        this.renderMapLayers();
                    }
                }
            } catch (e) {
                // Fallback to preloaded script object when running via file://
            }
        }

        setupUI() {
            this.btnModeProfil = document.getElementById('btnModeProfil');
            this.btnModePotensi = document.getElementById('btnModePotensi');
            this.modeSwitcherWrap = document.getElementById('modeSwitcherWrap');
            this.profilHeaderSearch = document.getElementById('profilHeaderSearch');
            this.potensiHeaderWrap = document.getElementById('potensiHeaderWrap');
            this.headerProvSelect = document.getElementById('potensiProvSelect');
            this.headerCitySelect = document.getElementById('potensiCitySelect');
            this.potensiSearchInput = document.getElementById('potensiSearchInput');
            this.potensiSearchClear = document.getElementById('potensiSearchClear');
            this.potensiSearchResults = document.getElementById('potensiSearchResults');
            this.sidebarProfileView = document.getElementById('sidebarProfileView');
            this.sidebarPotensiView = document.getElementById('sidebarPotensiView');
            this.profileContextStrip = document.getElementById('mapContextStrip');
            this.potensiContextStrip = document.getElementById('potensiContextStrip');
            this.profileMapLegend = document.getElementById('mapLegend');
            this.potensiMapLegend = document.getElementById('potensiMapLegend');
            this.mapContextStrip = this.potensiContextStrip;
            this.mapLegend = this.potensiMapLegend;
            this.regionPanel = document.getElementById('regionPanel');
            this.rpContent = document.getElementById('rpContent');
        }

        renderHeaderFilters() {
            const provSelect = this.headerProvSelect || document.getElementById('potensiProvSelect');
            const citySelect = this.headerCitySelect || document.getElementById('potensiCitySelect');
            if (!provSelect || !citySelect) return;

            const data = this.getData();
            const provs = data.provinces || [];
            const curIsland = this.state.selectedIsland;
            const curProv = this.state.selectedProv;
            const curCity = this.state.selectedCity;
            
            // Batasi provinsi sesuai pulau yang aktif jika ada
            const availableProvs = curIsland ? provs.filter((p) => curIsland.provIds.includes(p.id)) : provs;
            const citiesInProv = curProv ? (data.cities || []).filter((c) => c.provId === curProv.id) : [];

            // Update Province options
            const provDefaultLabel = curIsland ? `Semua Provinsi di ${curIsland.name} (${availableProvs.length})` : `Semua Provinsi (${provs.length})`;
            provSelect.innerHTML = `
                <option value="" ${!curProv ? 'selected' : ''}>${provDefaultLabel}</option>
                ${availableProvs.map((p) => `<option value="${p.id}" ${curProv && p.id === curProv.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            `;

            // Update City options
            if (!curProv) {
                citySelect.disabled = true;
                citySelect.style.opacity = '0.65';
                citySelect.style.cursor = 'not-allowed';
                citySelect.innerHTML = `<option value="" selected>Pilih Provinsi Dulu</option>`;
            } else {
                citySelect.disabled = false;
                citySelect.style.opacity = '1';
                citySelect.style.cursor = 'pointer';
                citySelect.innerHTML = `
                    <option value="" ${!curCity ? 'selected' : ''}>Semua Kab/Kota (${citiesInProv.length})</option>
                    ${citiesInProv.map((c) => `<option value="${c.id}" ${curCity && c.id === curCity.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                `;
            }
        }

        setupHeaderSearch() {
            const searchInput = this.potensiSearchInput || document.getElementById('potensiSearchInput');
            const searchClear = this.potensiSearchClear || document.getElementById('potensiSearchClear');
            const searchResults = this.potensiSearchResults || document.getElementById('potensiSearchResults');
            if (!searchInput || !searchResults) return;

            const handleSearch = () => {
                const data = this.getData();
                const q = searchInput.value.trim().toLowerCase();
                if (!q) {
                    if (searchClear) searchClear.style.display = 'none';
                    searchResults.innerHTML = '';
                    searchResults.classList.remove('open');
                    return;
                }
                if (searchClear) searchClear.style.display = 'flex';

                // Search across all 514 cities & 38 provinces
                const matchedCities = (data.cities || []).filter((c) => {
                    const provName = ((data.provinces || []).find((p) => p.id === c.provId)?.name || '').toLowerCase();
                    return c.name.toLowerCase().includes(q) || provName.includes(q) || c.id.toLowerCase().includes(q);
                }).slice(0, 15);

                if (!matchedCities.length) {
                    searchResults.innerHTML = `
                        <div class="pot-search-empty">
                            <div>Tidak ada wilayah cocok "<b>${q}</b>"</div>
                            <button type="button" class="empty-action-link" onclick="const inp=document.getElementById('potensiSearchInput'); if(inp){ inp.value=''; inp.focus(); } const res=document.getElementById('potensiSearchResults'); if(res){ res.classList.remove('open'); }">Bersihkan Pencarian</button>
                        </div>
                    `;
                    searchResults.classList.add('open');
                    return;
                }

                searchResults.innerHTML = matchedCities
                    .map((c) => {
                        const prov = (data.provinces || []).find((p) => p.id === c.provId);
                        const provName = prov ? prov.name : '';
                        return `
                        <button type="button" class="potensi-search-item" data-city="${c.id}" data-prov="${c.provId}">
                            <div class="pot-search-info">
                                <span class="pot-search-name">${c.name}</span>
                                <span class="pot-search-prov">${provName}</span>
                            </div>
                            <span class="pot-search-badge">${c.poi} POI</span>
                        </button>
                    `;
                    })
                    .join('');

                searchResults.classList.add('open');

                searchResults.querySelectorAll('.potensi-search-item').forEach((item) => {
                    item.addEventListener('click', () => {
                        const cId = item.dataset.city;
                        searchInput.value = '';
                        if (searchClear) searchClear.style.display = 'none';
                        searchResults.innerHTML = '';
                        searchResults.classList.remove('open');
                        this.selectCity(cId, true);
                    });
                });
            };

            searchInput.addEventListener('input', handleSearch);
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim()) handleSearch();
            });

            searchClear?.addEventListener('click', () => {
                searchInput.value = '';
                searchClear.style.display = 'none';
                searchResults.innerHTML = '';
                searchResults.classList.remove('open');
                searchInput.focus();
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.potensi-header-search')) {
                    searchResults.classList.remove('open');
                }
            });
        }

        bindEvents() {
            this.btnModeProfil?.addEventListener('click', () => this.setMode('profil'));
            this.btnModePotensi?.addEventListener('click', () => this.setMode('potensi'));

            // Top Header Filter Event Listeners
            this.headerProvSelect?.addEventListener('change', (e) => {
                const provId = e.target.value;
                this.selectProvince(provId);
            });

            this.headerCitySelect?.addEventListener('change', (e) => {
                const cityId = e.target.value;
                this.selectCity(cityId);
            });

            this.setupHeaderSearch();

            // Listen to view switcher changes (table vs map)
            const btnViewTable = document.getElementById('btnViewTable');
            const btnViewMap = document.getElementById('btnViewMap');

            btnViewTable?.addEventListener('click', () => {
                this.closeDetailPanel();
                if (typeof window.closeProfilePanel === 'function') window.closeProfilePanel();
                if (this.potensiHeaderWrap) this.potensiHeaderWrap.style.display = this.active ? 'flex' : 'none';
                if (this.active) {
                    this.renderSidebar();
                    this.renderTable();
                }
            });

            btnViewMap?.addEventListener('click', () => {
                this.closeDetailPanel();
                if (typeof window.closeProfilePanel === 'function') window.closeProfilePanel();
                if (this.modeSwitcherWrap) this.modeSwitcherWrap.style.display = 'flex';
                if (this.potensiHeaderWrap) this.potensiHeaderWrap.style.display = this.active ? 'flex' : 'none';
                if (this.active) {
                    this.renderSidebar();
                    this.renderMapLayers();
                    this.updateContextStrip();
                    this.updateLegend();
                }
            });
        }

        closeDetailPanel(immediateClear = false) {
            if (this.regionPanel) {
                this.regionPanel.classList.remove('open');
            }
            this.state.selectedObject = null;
            if (this._rpClearTimer) clearTimeout(this._rpClearTimer);
            if (immediateClear) {
                if (this.rpContent) this.rpContent.innerHTML = '';
            } else {
                this._rpClearTimer = setTimeout(() => {
                    if (this.regionPanel && !this.regionPanel.classList.contains('open') && this.rpContent) {
                        this.rpContent.innerHTML = '';
                    }
                }, 360);
            }
        }

        setMode(mode) {
            // Tutup sidebar kanan secara otomatis saat beralih mode (Opsi 1: Auto-Close & Reset Total)
            this.closeDetailPanel();
            if (typeof window.closeProfilePanel === 'function') {
                window.closeProfilePanel();
            }

            const data = this.getData();
            const tableViewWrap = document.getElementById('tableViewWrap');
            const potensiTableViewWrap = document.getElementById('potensiTableViewWrap');
            const isTableView = tableViewWrap?.classList.contains('active') || potensiTableViewWrap?.classList.contains('active');

            if (mode === 'potensi') {
                this.active = true;
                this.btnModePotensi?.classList.add('active');
                this.btnModeProfil?.classList.remove('active');

                // Show top header potensi controls (search + dropdowns) and hide generic profil search
                if (this.potensiHeaderWrap) this.potensiHeaderWrap.style.display = 'flex';
                if (this.profilHeaderSearch) this.profilHeaderSearch.style.display = 'none';

                // Switch sidebars
                if (this.sidebarProfileView) this.sidebarProfileView.style.display = 'none';
                if (this.sidebarPotensiView) this.sidebarPotensiView.style.display = 'flex';

                // SELALU render sidebar potensi saat masuk ke mode potensi (baik mode tabel maupun map)
                this.renderSidebar();

                if (isTableView) {
                    tableViewWrap?.classList.remove('active');
                    potensiTableViewWrap?.classList.add('active');
                    if (this.potensiContextStrip) this.potensiContextStrip.style.display = 'none';
                    if (this.potensiMapLegend) this.potensiMapLegend.style.display = 'none';
                    if (this.profileContextStrip) this.profileContextStrip.style.display = 'none';
                    if (this.profileMapLegend) this.profileMapLegend.style.display = 'none';
                    this.renderTable();
                } else {
                    // Hide standard geojson choropleth if any
                    if (window.profileGeojsonLayer && this.map && this.map.hasLayer(window.profileGeojsonLayer)) {
                        this.map.removeLayer(window.profileGeojsonLayer);
                    }

                    // Tampilkan status strip dan legenda khusus PAD360, sembunyikan profil BPS
                    if (this.potensiContextStrip) this.potensiContextStrip.style.display = 'flex';
                    if (this.potensiMapLegend) this.potensiMapLegend.style.display = 'block';
                    if (this.profileContextStrip) this.profileContextStrip.style.display = 'none';
                    if (this.profileMapLegend) this.profileMapLegend.style.display = 'none';

                    // If no province is selected, start at national view
                    if (!this.state.selectedProv && !this.state.selectedCity) {
                        this.state.scope = 'nasional';
                        if (this.map) this.map.flyTo([-2.5, 118], 5, { duration: 1.0 });
                    }

                    this.renderMapLayers();
                    this.updateContextStrip();
                    this.updateLegend();
                }
            } else {
                this.active = false;
                this.btnModeProfil?.classList.add('active');
                this.btnModePotensi?.classList.remove('active');

                // Hide top header potensi controls and restore generic profil search
                if (this.potensiHeaderWrap) this.potensiHeaderWrap.style.display = 'none';
                if (this.profilHeaderSearch) this.profilHeaderSearch.style.display = '';

                // Switch sidebars
                if (this.sidebarPotensiView) this.sidebarPotensiView.style.display = 'none';
                if (this.sidebarProfileView) this.sidebarProfileView.style.display = 'flex';

                // Bersihkan layer potensi secara total tanpa syarat
                this.clearLayersFromMap();

                // Sembunyikan elemen potensi
                if (this.potensiContextStrip) this.potensiContextStrip.style.display = 'none';
                if (this.potensiMapLegend) this.potensiMapLegend.style.display = 'none';

                if (isTableView) {
                    potensiTableViewWrap?.classList.remove('active');
                    tableViewWrap?.classList.add('active');
                    if (this.profileContextStrip) this.profileContextStrip.style.display = 'none';
                    if (this.profileMapLegend) this.profileMapLegend.style.display = 'none';
                    if (typeof window.setViewMode === 'function') {
                        window.setViewMode('table');
                    } else if (typeof window.renderProfileTable === 'function') {
                        window.renderProfileTable();
                    } else if (typeof window.renderTable === 'function') {
                        window.renderTable();
                    }
                    if (typeof window.restoreProfileView === 'function') {
                        window.restoreProfileView();
                    }
                } else {
                    // Tampilkan kembali status strip dan legenda profil daerah
                    if (this.profileContextStrip) this.profileContextStrip.style.display = 'flex';
                    if (this.profileMapLegend) this.profileMapLegend.style.display = 'block';

                    // Restore penuh tampilan profil daerah menggunakan helper global atau manual fallback
                    if (typeof window.restoreProfileView === 'function') {
                        window.restoreProfileView();
                    } else {
                        if (window.profileGeojsonLayer && this.map && !this.map.hasLayer(window.profileGeojsonLayer)) {
                            this.map.addLayer(window.profileGeojsonLayer);
                        }
                        if (window.updateProfileContext) window.updateProfileContext();
                        if (window.updateProfileLegend) window.updateProfileLegend();
                    }
                }
            }
        }

        clearLayersFromMap() {
            Object.values(this.layers).forEach((layer) => {
                if (this.map && this.map.hasLayer(layer)) {
                    this.map.removeLayer(layer);
                }
                layer.clearLayers();
            });
        }

        setupSemanticZoom() {
            if (!this.map || this._semanticZoomBound) return;
            this._semanticZoomBound = true;
            let zoomDebounceTimer = null;

            const handleZoomOrMove = () => {
                if (!this.active) return;
                if (this._isFlying) return;
                if (this.isTableViewActive()) return;

                const zoom = this.map.getZoom();
                const bounds = this.map.getBounds().pad(0.12);
                this.onSemanticZoomChange(zoom, bounds);
            };

            this.map.on('zoomend', () => {
                clearTimeout(zoomDebounceTimer);
                zoomDebounceTimer = setTimeout(handleZoomOrMove, 150);
            });

            this.map.on('moveend', () => {
                clearTimeout(zoomDebounceTimer);
                zoomDebounceTimer = setTimeout(handleZoomOrMove, 200);
            });
        }

        isTableViewActive() {
            const tableViewWrap = document.getElementById('tableViewWrap');
            const potensiTableViewWrap = document.getElementById('potensiTableViewWrap');
            return (tableViewWrap && tableViewWrap.classList.contains('active')) ||
                   (potensiTableViewWrap && potensiTableViewWrap.classList.contains('active'));
        }

        findNearestCity(latlng) {
            const data = this.getData();
            if (!data.cities || !data.cities.length) return null;
            let minD = Infinity;
            let nearest = null;
            const target = L.latLng(latlng);
            data.cities.forEach((c) => {
                const d = target.distanceTo([c.lat, c.lng]);
                if (d < minD) {
                    minD = d;
                    nearest = c;
                }
            });
            return nearest;
        }

        findNearestProvince(latlng) {
            const data = this.getData();
            if (!data.provinces || !data.provinces.length) return null;
            let minD = Infinity;
            let nearest = null;
            const target = L.latLng(latlng);
            data.provinces.forEach((p) => {
                const d = target.distanceTo([p.lat, p.lng]);
                if (d < minD) {
                    minD = d;
                    nearest = p;
                }
            });
            return nearest;
        }

        onSemanticZoomChange(zoom, bounds) {
            if (!this.active || !this.map) return;
            const data = this.getData();
            const center = this.map.getCenter();

            // Level 1: Zoom <= 5.5 (Nasional)
            if (zoom <= 5.5) {
                if (this.state.scope !== 'nasional' || this.state.selectedCity || this.state.selectedProv || this.state.selectedIsland) {
                    this.state.scope = 'nasional';
                    this.state.selectedIsland = null;
                    this.state.selectedProv = null;
                    this.state.selectedCity = null;
                    this.state.selectedCorridor = null;
                    this.state.selectedObject = null;
                    this.renderHeaderFilters();
                    this.renderSidebar();
                    this.updateContextStrip();
                }
                this.renderMapLayers();
                return;
            }

            // Level 2: Zoom 5.6 - 8.5 (Scope Provinsi / Antar Provinsi)
            if (zoom > 5.5 && zoom <= 8.5) {
                let stateChanged = false;
                if (this.state.selectedCity) {
                    this.state.selectedCity = null;
                    this.state.selectedCorridor = null;
                    this.state.selectedObject = null;
                    stateChanged = true;
                }

                if (this.state.scope !== 'pulau') {
                    if (this.state.selectedProv && !bounds.contains([this.state.selectedProv.lat, this.state.selectedProv.lng])) {
                        const nearestProv = this.findNearestProvince(center);
                        if (nearestProv) {
                            this.state.selectedProv = nearestProv;
                            this.state.selectedIsland = ISLAND_REGIONS.find((i) => i.provIds.includes(nearestProv.id)) || null;
                            stateChanged = true;
                        }
                    }
                }

                if (this.state.selectedProv && this.state.scope !== 'provinsi') {
                    this.state.scope = 'provinsi';
                    stateChanged = true;
                }

                if (stateChanged) {
                    this.renderHeaderFilters();
                    this.renderSidebar();
                    this.updateContextStrip();
                }
                this.renderMapLayers();
                return;
            }

            // Level 3: Zoom 8.6 - 11.0 (Scope Kabupaten / Kota Overview)
            if (zoom > 8.5 && zoom <= 11.0) {
                let stateChanged = false;
                if (!this.state.selectedProv) {
                    const nearestProv = this.findNearestProvince(center);
                    if (nearestProv) {
                        this.state.selectedProv = nearestProv;
                        this.state.selectedIsland = ISLAND_REGIONS.find((i) => i.provIds.includes(nearestProv.id)) || null;
                        stateChanged = true;
                    }
                }

                if (this.state.scope !== 'kota_overview') {
                    this.state.scope = 'kota_overview';
                    stateChanged = true;
                }

                if (stateChanged) {
                    this.renderHeaderFilters();
                    this.updateContextStrip();
                }
                this.renderMapLayers();
                return;
            }

            // Level 4: Zoom > 11.0 (Detail Lapangan: POI & Koridor)
            if (zoom > 11.0) {
                let stateChanged = false;
                if (!this.state.selectedCity) {
                    const nearestCity = this.findNearestCity(center);
                    if (nearestCity) {
                        this.state.selectedCity = nearestCity;
                        const prov = (data.provinces || []).find((p) => p.id === nearestCity.provId);
                        this.state.selectedProv = prov || null;
                        this.state.selectedIsland = prov ? ISLAND_REGIONS.find((i) => i.provIds.includes(prov.id)) || null : null;
                        stateChanged = true;
                    }
                }

                if (this.state.scope !== 'kota' && this.state.scope !== 'koridor') {
                    this.state.scope = 'kota';
                    stateChanged = true;
                }

                if (stateChanged) {
                    this.renderHeaderFilters();
                    this.renderSidebar();
                    this.updateContextStrip();
                }
                this.renderMapLayers();
            }
        }

        selectIsland(islandId, fly = true) {
            this.closeDetailPanel();
            if (!islandId) {
                this.state.scope = 'nasional';
                this.state.selectedIsland = null;
                this.state.selectedProv = null;
                this.state.selectedCity = null;
                this.state.selectedCorridor = null;
                this.state.selectedObject = null;
                if (fly && this.map) {
                    this._isFlying = true;
                    this.map.flyTo([-2.5, 118], 5, { duration: 1.2 });
                    setTimeout(() => { this._isFlying = false; }, 1350);
                }
                this.renderHeaderFilters();
                this.renderSidebar();
                this.renderMapLayers();
                this.updateContextStrip();
                this.renderTable();
                return;
            }
            const isl = ISLAND_REGIONS.find((i) => i.id === islandId);
            if (!isl) return;
            this.state.selectedIsland = isl;
            this.state.selectedProv = null;
            this.state.selectedCity = null;
            this.state.selectedCorridor = null;
            this.state.selectedObject = null;
            this.state.scope = 'pulau';
            this.tableState.page = 1;

            if (fly && this.map) {
                this._isFlying = true;
                const data = this.getData();
                const provsInIsland = data.provinces.filter((p) => isl.provIds.includes(p.id));
                if (provsInIsland.length > 0) {
                    const bounds = L.latLngBounds(provsInIsland.map((p) => [p.lat, p.lng]));
                    this.map.flyToBounds(bounds.pad(0.2), { duration: 1.2 });
                } else {
                    this.map.flyTo([isl.lat, isl.lng], isl.zoom || 6.5, { duration: 1.2 });
                }
                setTimeout(() => { this._isFlying = false; }, 1350);
            }

            this.renderHeaderFilters();
            this.renderSidebar();
            this.renderMapLayers();
            this.updateContextStrip();
            this.renderTable();
        }

        selectProvince(provId, fly = true) {
            this.closeDetailPanel();
            if (!provId) {
                this.state.selectedProv = null;
                this.state.selectedCity = null;
                this.state.selectedCorridor = null;
                this.state.selectedObject = null;
                this.tableState.page = 1;
                if (this.state.selectedIsland) {
                    this.state.scope = 'pulau';
                    if (fly && this.map) {
                        this._isFlying = true;
                        this.map.flyTo([this.state.selectedIsland.lat, this.state.selectedIsland.lng], this.state.selectedIsland.zoom || 6.5, { duration: 1.2 });
                        setTimeout(() => { this._isFlying = false; }, 1350);
                    }
                } else {
                    this.state.scope = 'nasional';
                    if (fly && this.map) {
                        this._isFlying = true;
                        this.map.flyTo([-2.5, 118], 5, { duration: 1.2 });
                        setTimeout(() => { this._isFlying = false; }, 1350);
                    }
                }
                this.renderHeaderFilters();
                this.renderSidebar();
                this.renderMapLayers();
                this.updateContextStrip();
                this.renderTable();
                return;
            }
            const data = this.getData();
            const prov = data.provinces.find((p) => p.id === provId);
            if (!prov) return;

            // Automatically resolve parent island
            const isl = ISLAND_REGIONS.find((i) => i.provIds.includes(prov.id));
            this.state.selectedIsland = isl || null;
            this.state.selectedProv = prov;
            this.state.selectedCity = null; // Leave kabupaten/kota unselected
            this.state.selectedCorridor = null;
            this.state.selectedObject = null;
            this.state.scope = 'provinsi';
            this.tableState.page = 1;

            if (fly && this.map) {
                this._isFlying = true;
                const citiesInProv = data.cities.filter((c) => c.provId === prov.id);
                if (citiesInProv.length > 0) {
                    const bounds = L.latLngBounds(citiesInProv.map((c) => [c.lat, c.lng]));
                    this.map.flyToBounds(bounds.pad(0.18), { duration: 1.2 });
                } else {
                    this.map.flyTo([prov.lat, prov.lng], 7.5, { duration: 1.2 });
                }
                setTimeout(() => { this._isFlying = false; }, 1350);
            }
            this.renderHeaderFilters();
            this.renderSidebar();
            this.renderMapLayers();
            this.updateContextStrip();
            this.renderTable();
        }

        selectCity(cityId, fly = true) {
            if (!cityId) {
                this.state.selectedCity = null;
                this.state.selectedCorridor = null;
                this.state.selectedObject = null;
                this.tableState.page = 1;
                if (this.state.selectedProv) {
                    this.state.scope = 'provinsi';
                    if (fly && this.map) {
                        this._isFlying = true;
                        this.map.flyTo([this.state.selectedProv.lat, this.state.selectedProv.lng], 7.5, { duration: 1.2 });
                        setTimeout(() => { this._isFlying = false; }, 1350);
                    }
                } else if (this.state.selectedIsland) {
                    this.state.scope = 'pulau';
                    if (fly && this.map) {
                        this._isFlying = true;
                        this.map.flyTo([this.state.selectedIsland.lat, this.state.selectedIsland.lng], this.state.selectedIsland.zoom || 6.5, { duration: 1.2 });
                        setTimeout(() => { this._isFlying = false; }, 1350);
                    }
                } else {
                    this.state.scope = 'nasional';
                    if (fly && this.map) {
                        this._isFlying = true;
                        this.map.flyTo([-2.5, 118], 5, { duration: 1.2 });
                        setTimeout(() => { this._isFlying = false; }, 1350);
                    }
                }
                this.renderHeaderFilters();
                this.renderSidebar();
                this.renderMapLayers();
                this.updateContextStrip();
                this.renderTable();
                return;
            }
            const data = this.getData();
            const city = data.cities.find((c) => c.id === cityId);
            if (!city) return;
            const prov = data.provinces.find((p) => p.id === city.provId);
            const isl = prov ? ISLAND_REGIONS.find((i) => i.provIds.includes(prov.id)) : null;

            this.state.scope = 'kota';
            this.state.selectedIsland = isl || null;
            this.state.selectedProv = prov || null;
            this.state.selectedCity = city;
            this.state.selectedCorridor = null;
            this.state.selectedObject = null;
            this.tableState.page = 1;

            if (fly && this.map) {
                this._isFlying = true;
                this.map.flyTo([city.lat, city.lng], city.zoom || 13, { duration: 1.2 });
                setTimeout(() => { this._isFlying = false; }, 1350);
            }
            this.renderHeaderFilters();
            this.renderSidebar();
            this.renderMapLayers();
            this.updateContextStrip();
            this.renderTable();
        }

        selectCorridor(corrId) {
            const data = this.getData();
            const corr = data.corridors[corrId];
            if (!corr) return;
            this.state.scope = 'koridor';
            this.state.selectedCorridor = corr;
            this.tableState.page = 1;

            const routeCoords = corr.path || corr.route;
            if (routeCoords && routeCoords.length && this.map) {
                const bounds = L.latLngBounds(routeCoords);
                this.map.flyToBounds(bounds.pad(0.4), { duration: 1.0 });
            }
            this.renderSidebar();
            this.renderMapLayers();
            this.updateContextStrip();
            this.renderTable();
        }

        selectObject(objId) {
            const data = this.getData();
            const obj = data.objects[objId];
            if (!obj) return;

            // Toggle zoom out jika objek aktif yang sama diklik kembali
            if (this.state.selectedObject && this.state.selectedObject.id === obj.id && this.state.selectedCity) {
                this.state.selectedObject = null;
                this.closeDetailPanel();
                if (this.map && this.state.selectedCity.lat && this.state.selectedCity.lng) {
                    this.map.flyTo([this.state.selectedCity.lat, this.state.selectedCity.lng], this.state.selectedCity.zoom || 13, { duration: 0.9 });
                }
                this.renderMapLayers();
                return;
            }

            this.state.selectedObject = obj;

            if (this.map && obj.lat && obj.lng) {
                this.map.flyTo([obj.lat, obj.lng], 16, { duration: 0.8 });
            }
            this.renderMapLayers();
            this.renderDetailPanel(obj);
        }

        async fetchRoadSnappedRoute(corridor, polyline, cpMarkers) {
            if (!corridor || !corridor.checkpoints || corridor.checkpoints.length < 2) return;
            if (corridor._snappedPath && corridor._snappedPath.length) return corridor._snappedPath;
            if (corridor._fetchingRoute) return;
            corridor._fetchingRoute = true;

            try {
                const coordsStr = corridor.checkpoints.map((cp) => `${cp.lng},${cp.lat}`).join(';');
                const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
                const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
                if (!res.ok) return;
                const json = await res.json();
                if (json.code === 'Ok' && json.routes && json.routes[0]) {
                    const roadCoords = json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                    corridor._snappedPath = roadCoords;

                    if (json.routes[0].distance) {
                        corridor.length = `${(json.routes[0].distance / 1000).toFixed(1).replace('.', ',')} km`;
                    }

                    // Snap checkpoint positions directly onto nearest road surface
                    if (json.waypoints && json.waypoints.length === corridor.checkpoints.length) {
                        json.waypoints.forEach((wp, idx) => {
                            if (wp && wp.location) {
                                corridor.checkpoints[idx].lat = wp.location[1];
                                corridor.checkpoints[idx].lng = wp.location[0];
                                if (cpMarkers && cpMarkers[idx]) {
                                    cpMarkers[idx].setLatLng([wp.location[1], wp.location[0]]);
                                }
                            }
                        });
                    }

                    if (polyline) {
                        polyline.setLatLngs(roadCoords);
                    }
                }
            } catch (err) {
                // Silently fallback to initial coordinates if offline
            } finally {
                corridor._fetchingRoute = false;
            }
        }

        renderMapLayers() {
            if (!this.active || !this.map) return;
            this.clearLayersFromMap();

            // Add layers back
            Object.values(this.layers).forEach((layer) => {
                if (!this.map.hasLayer(layer)) {
                    this.map.addLayer(layer);
                }
            });

            const data = this.getData();
            const zoom = this.map.getZoom();
            const bounds = this.map.getBounds().pad(0.12);
            const currentCity = this.state.selectedCity;
            const currentProv = this.state.selectedProv;
            const currentIsland = this.state.selectedIsland;

            // Level 1: Nasional (Zoom <= 5.5 saat tidak ada provinsi atau kota aktif)
            if (zoom <= 5.5 && !currentCity && !currentProv) {
                ISLAND_REGIONS.forEach((isl) => {
                    const provsInIsland = (data.provinces || []).filter((p) => isl.provIds.includes(p.id));
                    const totalPoi = provsInIsland.reduce((s, p) => s + (p.poi || 0), 0);

                    const iconHtml = `
                        <div class="potensi-cluster-stick-pin island-variant">
                            <div class="cluster-stick-badge">
                                <span class="poi-count">${totalPoi}</span>
                                <span class="poi-unit">POI</span>
                            </div>
                            <div class="cluster-stick-label" title="${isl.name}">${isl.shortName || isl.name}</div>
                            <div class="cluster-stick-stem"></div>
                            <div class="cluster-stick-ground"></div>
                        </div>
                    `;
                    const customIcon = L.divIcon({
                        className: 'potensi-cluster-wrapper',
                        html: iconHtml,
                        iconSize: [70, 72],
                        iconAnchor: [35, 67]
                    });

                    const marker = L.marker([isl.lat, isl.lng], { icon: customIcon });
                    marker.on('click', () => {
                        this.selectIsland(isl.id);
                    });
                    this.layers.clusters.addLayer(marker);
                });
                return;
            }

            // Level 4: DETAIL LAPANGAN (Zoom > 11.0 ATAU selectedCity aktif)
            if (currentCity || zoom > 11.0) {
                const activeCity = currentCity || this.findNearestCity(this.map.getCenter());
                if (activeCity) {
                    (data.cities || [])
                        .filter((c) => c.id !== activeCity.id && bounds.contains([c.lat, c.lng]))
                        .forEach((otherCity, idx) => {
                            const shortName = formatDisplayName(otherCity.name);
                            const isEven = idx % 2 === 0;
                            const stemClass = isEven ? '' : 'stem-mid';
                            const h = isEven ? 60 : 68;
                            const anchorY = isEven ? 55 : 63;

                            const otherIconHtml = `
                                <div class="potensi-cluster-stick-pin neighbor-variant ${stemClass}">
                                    <div class="cluster-stick-badge">
                                        <span class="poi-count">${otherCity.poi}</span>
                                    </div>
                                    <div class="cluster-stick-label" title="${otherCity.name}">${shortName}</div>
                                    <div class="cluster-stick-stem"></div>
                                    <div class="cluster-stick-ground"></div>
                                </div>
                            `;
                            const otherIcon = L.divIcon({
                                className: 'potensi-cluster-wrapper',
                                html: otherIconHtml,
                                iconSize: [50, h],
                                iconAnchor: [25, anchorY]
                            });
                            const otherMarker = L.marker([otherCity.lat, otherCity.lng], { icon: otherIcon });
                            otherMarker.on('click', () => {
                                this.selectCity(otherCity.id);
                            });
                            this.layers.clusters.addLayer(otherMarker);
                        });

                    Object.values(data.corridors || {})
                        .filter((c) => c.cityId === activeCity.id)
                        .forEach((c) => {
                            const isSelected = this.state.selectedCorridor?.id === c.id;
                            const routeCoords = c._snappedPath || c.path || c.route || [];
                            if (!routeCoords.length) return;

                            const polyline = L.polyline(routeCoords, {
                                color: isSelected ? '#cf1e2e' : c.color || '#0d9488',
                                weight: isSelected ? 7 : 5,
                                opacity: isSelected ? 0.95 : 0.75,
                                dashArray: isSelected ? null : '6, 6',
                                lineCap: 'round',
                                lineJoin: 'round'
                            });

                            polyline.on('click', () => {
                                this.selectCorridor(c.id);
                            });
                            polyline.bindTooltip(`<b>${c.name}</b> (${c.length || c.km || '1,8 km'})<br>${c.status || 'Aktif'}`, { sticky: true });
                            this.layers.corridors.addLayer(polyline);

                            const cpMarkers = {};

                            if (isSelected && c.checkpoints) {
                                c.checkpoints.forEach((cp, idx) => {
                                    const isDone = cp.done !== undefined ? cp.done : cp.status === 'done';
                                    const num = cp.num || cp.n || '1';
                                    const label = cp.title || cp.label || 'Checkpoint';
                                    const cpIconHtml = `
                                        <div class="potensi-cp-marker ${isDone ? 'done' : 'pending'}">
                                            <span>${num}</span>
                                        </div>
                                    `;
                                    const cpIcon = L.divIcon({
                                        className: 'potensi-cp-wrapper',
                                        html: cpIconHtml,
                                        iconSize: [28, 28],
                                        iconAnchor: [14, 14]
                                    });

                                    const cpMarker = L.marker([cp.lat, cp.lng], { icon: cpIcon });
                                    cpMarker.on('click', () => {
                                        this.renderCheckpointDetail(cp, c);
                                    });
                                    cpMarker.bindTooltip(`<b>Checkpoint ${num}</b>: ${label}<br>${isDone ? 'Sudah diperiksa' : 'Belum diperiksa'}`, {
                                        direction: 'top',
                                        offset: [0, -14]
                                    });
                                    this.layers.checkpoints.addLayer(cpMarker);
                                    cpMarkers[idx] = cpMarker;
                                });
                            }

                            if (!c._snappedPath) {
                                this.fetchRoadSnappedRoute(c, polyline, cpMarkers);
                            }
                        });

                    Object.values(data.objects || {})
                        .filter((o) => o.cityId === activeCity.id)
                        .forEach((o) => {
                            if (this.state.categoryFilter !== 'all' && o.category !== this.state.categoryFilter) {
                                return;
                            }

                            const catMeta = (data.categories || []).find((cat) => cat.id === o.category) || { color: '#0d9488', tag: 'POI' };
                            const isObjSelected = this.state.selectedObject?.id === o.id;

                            const poiIconHtml = `
                                <div class="potensi-stick-pin ${isObjSelected ? 'selected' : ''}" style="--pin-color: ${catMeta.color};">
                                    <div class="stick-pin-head">
                                        <span class="stick-pin-badge">${catMeta.tag || 'POI'}</span>
                                    </div>
                                    <div class="stick-pin-stem"></div>
                                    <div class="stick-pin-ground"></div>
                                </div>
                            `;

                            const poiIcon = L.divIcon({
                                className: 'potensi-pin-wrapper',
                                html: poiIconHtml,
                                iconSize: [40, 52],
                                iconAnchor: [20, 47]
                            });

                            const poiMarker = L.marker([o.lat, o.lng], { icon: poiIcon });
                            poiMarker.on('click', () => {
                                this.selectObject(o.id);
                            });

                            poiMarker.bindTooltip(
                                `<b>${o.name}</b><br><span style="color:${catMeta.color}">●</span> ${o.catName}<br>${o.addr}<br><b>${o.estimatedValue}</b>`,
                                { direction: 'top', offset: [0, -48] }
                            );

                            this.layers.poiMarkers.addLayer(poiMarker);
                        });
                    return;
                }
            }

            // Level 3: KABUPATEN / KOTA OVERVIEW
            // Diprioritaskan jika selectedProv aktif (State Priority) ATAU zoom sudah berada di 8.6 - 11.0
            if (currentProv || (zoom > 8.5 && zoom <= 11.0)) {
                let citiesToRender = [];
                if (currentProv) {
                    citiesToRender = (data.cities || []).filter((c) => c.provId === currentProv.id);
                } else {
                    citiesToRender = (data.cities || []).filter((c) => bounds.contains([c.lat, c.lng]));
                }

                citiesToRender.forEach((city, idx) => {
                    const shortName = formatDisplayName(city.name);
                    const isEven = idx % 2 === 0;
                    const isSelected = currentCity && currentCity.id === city.id;
                    const stemClass = isEven ? '' : 'stem-mid';
                    const h = isEven ? 64 : 72;
                    const anchorY = isEven ? 59 : 67;

                    const iconHtml = `
                        <div class="potensi-cluster-stick-pin city-variant ${isSelected ? 'selected' : ''} ${stemClass}">
                            <div class="cluster-stick-badge">
                                <span class="poi-count">${city.poi}</span>
                                <span class="poi-unit">POI</span>
                            </div>
                            <div class="cluster-stick-label" title="${city.name}">${shortName}</div>
                            <div class="cluster-stick-stem"></div>
                            <div class="cluster-stick-ground"></div>
                        </div>
                    `;
                    const customIcon = L.divIcon({
                        className: 'potensi-cluster-wrapper',
                        html: iconHtml,
                        iconSize: [54, h],
                        iconAnchor: [27, anchorY]
                    });

                    const marker = L.marker([city.lat, city.lng], { icon: customIcon });
                    marker.on('click', () => {
                        this.selectCity(city.id);
                    });
                    this.layers.clusters.addLayer(marker);
                });

                // Macro-Micro Layering: jika scope provinsi aktif dan zoom masih <= 8.5,
                // tampilkan juga pin cluster provinsi tetangga di sekitar layar agar user tidak kehilangan konteks
                if (currentProv && zoom <= 8.5) {
                    const neighborProvs = (data.provinces || []).filter(
                        (p) => p.id !== currentProv.id && bounds.contains([p.lat, p.lng])
                    );
                    neighborProvs.forEach((p, idx) => {
                        const shortName = formatDisplayName(p.name);
                        const isEven = idx % 2 === 0;
                        const stemClass = isEven ? '' : 'stem-mid';
                        const h = isEven ? 64 : 72;
                        const anchorY = isEven ? 59 : 67;

                        const iconHtml = `
                            <div class="potensi-cluster-stick-pin ${stemClass}">
                                <div class="cluster-stick-badge">
                                    <span class="poi-count">${p.poi}</span>
                                    <span class="poi-unit">POI</span>
                                </div>
                                <div class="cluster-stick-label" title="${p.name}">${shortName}</div>
                                <div class="cluster-stick-stem"></div>
                                <div class="cluster-stick-ground"></div>
                            </div>
                        `;
                        const customIcon = L.divIcon({
                            className: 'potensi-cluster-wrapper',
                            html: iconHtml,
                            iconSize: [54, h],
                            iconAnchor: [27, anchorY]
                        });

                        const marker = L.marker([p.lat, p.lng], { icon: customIcon });
                        marker.on('click', () => {
                            this.selectProvince(p.id);
                        });
                        this.layers.clusters.addLayer(marker);
                    });
                }
                return;
            }

            // Level 2: PROVINSI (Zoom 5.6 - 8.5 saat tidak ada kuncian provinsi aktif)
            let provsToRender = (data.provinces || []).filter((p) => bounds.contains([p.lat, p.lng]));
            if (provsToRender.length === 0) {
                if (currentIsland) {
                    provsToRender = (data.provinces || []).filter((p) => currentIsland.provIds.includes(p.id));
                } else {
                    provsToRender = data.provinces || [];
                }
            }

            provsToRender.forEach((p, idx) => {
                const shortName = formatDisplayName(p.name);
                const isEven = idx % 2 === 0;
                const stemClass = isEven ? '' : 'stem-mid';
                const h = isEven ? 64 : 72;
                const anchorY = isEven ? 59 : 67;

                const iconHtml = `
                    <div class="potensi-cluster-stick-pin ${stemClass}">
                        <div class="cluster-stick-badge">
                            <span class="poi-count">${p.poi}</span>
                            <span class="poi-unit">POI</span>
                        </div>
                        <div class="cluster-stick-label" title="${p.name}">${shortName}</div>
                        <div class="cluster-stick-stem"></div>
                        <div class="cluster-stick-ground"></div>
                    </div>
                `;
                const customIcon = L.divIcon({
                    className: 'potensi-cluster-wrapper',
                    html: iconHtml,
                    iconSize: [54, h],
                    iconAnchor: [27, anchorY]
                });

                const marker = L.marker([p.lat, p.lng], { icon: customIcon });
                marker.on('click', () => {
                    this.selectProvince(p.id);
                });
                this.layers.clusters.addLayer(marker);
            });
        }

        renderSidebar() {
            if (!this.sidebarPotensiView) return;

            const data = this.getData();
            const provs = data.provinces || [];
            const curIsland = this.state.selectedIsland;
            const curProv = this.state.selectedProv;
            const curCity = this.state.selectedCity;

            // Filter provinces by island if selected
            const provsInIsland = curIsland ? provs.filter((p) => curIsland.provIds.includes(p.id)) : provs;
            const citiesInProv = curProv ? data.cities.filter((c) => c.provId === curProv.id) : [];
            const corridorsInCity = curCity ? Object.values(data.corridors).filter((c) => c.cityId === curCity.id) : [];
            const objectsInCity = curCity ? Object.values(data.objects).filter((o) => o.cityId === curCity.id) : [];

            // Compute active metrics based on hierarchy level
            let totalPoi = 0;
            let perluVerif = 0;
            let potFinansial = 0;

            if (curCity) {
                totalPoi = curCity.poi;
                perluVerif = curCity.ver;
                potFinansial = curCity.pot;
            } else if (curProv) {
                totalPoi = curProv.poi;
                perluVerif = curProv.ver;
                potFinansial = curProv.pot;
            } else if (curIsland) {
                totalPoi = provsInIsland.reduce((s, p) => s + (p.poi || 0), 0);
                perluVerif = provsInIsland.reduce((s, p) => s + (p.ver || 0), 0);
                potFinansial = provsInIsland.reduce((s, p) => s + (p.pot || 0), 0);
            } else {
                totalPoi = provs.reduce((s, p) => s + (p.poi || 0), 0);
                perluVerif = provs.reduce((s, p) => s + (p.ver || 0), 0);
                potFinansial = provs.reduce((s, p) => s + (p.pot || 0), 0);
            }

            this.sidebarPotensiView.innerHTML = `
                <!-- 1. Breadcrumbs Scope (Sticky Header) -->
                <div class="sidebar-section potensi-scope-section">
                    <div class="potensi-scope-bar">
                        ${
                            !curIsland && !curProv && !curCity
                                ? `<span class="scope-crumb active">Nasional</span>`
                                : curIsland && !curProv && !curCity
                                ? `<button type="button" class="scope-crumb" id="btnScopeNasional">Nasional</button><span class="crumb-sep">›</span><span class="scope-crumb active">${curIsland.shortName || curIsland.name}</span>`
                                : curProv && !curCity
                                ? `<button type="button" class="scope-crumb" id="btnScopeNasional">Nasional</button><span class="crumb-sep">›</span>${curIsland ? `<button type="button" class="scope-crumb" id="btnScopeIsland">${curIsland.shortName || curIsland.name}</button><span class="crumb-sep">›</span>` : ''}<span class="scope-crumb active" title="${curProv.name}">${formatDisplayName(curProv.name)}</span>`
                                : `<button type="button" class="scope-crumb" id="btnScopeNasional">Nasional</button><span class="crumb-sep">›</span>${curIsland ? `<button type="button" class="scope-crumb" id="btnScopeIsland">${curIsland.shortName || curIsland.name}</button><span class="crumb-sep">›</span>` : ''}<button type="button" class="scope-crumb" id="btnScopeProv" title="${curProv ? curProv.name : 'Provinsi'}">${curProv ? formatDisplayName(curProv.name) : 'Provinsi'}</button><span class="crumb-sep">›</span><span class="scope-crumb active" title="${curCity.name}">${formatDisplayName(curCity.name)}</span>`
                        }
                    </div>
                </div>

                <!-- 2. KPI Potensi Pajak (PAD360) -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <span class="section-tag">${curCity ? `Indikasi Potensi: ${curCity.name}` : curProv ? `Indikasi Potensi: Provinsi ${curProv.name}` : curIsland ? `Indikasi Potensi: ${curIsland.name}` : `Indikasi Potensi: Nasional (38 Provinsi)`}</span>
                    </div>
                    <div class="potensi-kpi-grid">
                        <div class="pot-kpi-card ${this.tableState.kpiFilter === 'all' ? 'active' : ''}" id="kpiCardAllPoi" style="cursor: pointer; transition: all 0.2s;" title="Klik untuk menampilkan semua titik POI">
                            <span class="pot-kpi-val" style="color: #0d9488;">${fmt(totalPoi)}</span>
                            <span class="pot-kpi-lbl">POI Terpetakan</span>
                        </div>
                        <div class="pot-kpi-card ${this.tableState.kpiFilter === 'unverified' ? 'active' : ''}" id="kpiCardUnverified" style="cursor: pointer; transition: all 0.2s; ${this.tableState.kpiFilter === 'unverified' ? 'border: 2px solid #d97706; background: #fffbeb;' : ''}" title="Klik untuk menyaring objek yang perlu verifikasi">
                            <span class="pot-kpi-val" style="color: #d97706;">${fmt(perluVerif)}</span>
                            <span class="pot-kpi-lbl">Perlu Verifikasi</span>
                        </div>
                        <div class="pot-kpi-card wide">
                            <span class="pot-kpi-val" style="color: #0369a1;">${rp(potFinansial)}</span>
                            <span class="pot-kpi-lbl">Potensi Indikatif / Tahun</span>
                            <span class="pot-kpi-sub">${curCity ? 'Asumsi dasar pengenaan tarif Perda Bapenda' : curProv ? `Akumulasi ${citiesInProv.length} kabupaten & kota` : curIsland ? `Akumulasi ${provsInIsland.length} provinsi di ${curIsland.name}` : 'Akumulasi 514 kabupaten & kota se-Indonesia'}</span>
                        </div>
                    </div>
                </div>

                <!-- 4. Filter Kategori Objek / POI -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <span class="section-tag">Filter Kategori POI</span>
                    </div>
                    <div class="potensi-cat-pills">
                        <button type="button" class="pot-cat-pill ${this.state.categoryFilter === 'all' ? 'active' : ''}" data-cat="all">
                            Semua
                        </button>
                        ${(data.categories || [])
                            .map(
                                (c) => `
                            <button type="button" class="pot-cat-pill ${this.state.categoryFilter === c.id ? 'active' : ''}" data-cat="${c.id}">
                                <span class="cat-dot" style="background:${c.color};"></span> ${c.name || c.label}
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                ${
                    !curIsland && !curProv && !curCity
                        ? `
                <!-- Level 0: 7 Wilayah Utama Indonesia -->
                <div class="sidebar-section" style="flex: 1;">
                    <div class="section-header">
                        <span class="section-tag">7 Wilayah Utama Indonesia</span>
                    </div>
                    <p style="font-size: 11.5px; color: var(--text-mid); margin: 0 0 8px;">
                        Pilih salah satu wilayah di bawah atau klik pin di peta untuk eksplorasi provinsi:
                    </p>
                    <div class="potensi-object-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${ISLAND_REGIONS.map((isl) => {
                            const islandProvs = provs.filter((p) => isl.provIds.includes(p.id));
                            const pCount = islandProvs.reduce((s, p) => s + (p.poi || 0), 0);
                            const pPot = islandProvs.reduce((s, p) => s + (p.pot || 0), 0);
                            return `
                                <div class="pot-corr-card" data-island-pick="${isl.id}" style="cursor: pointer;">
                                    <div class="corr-header">
                                        <b style="font-size: 12.5px;">${isl.name}</b>
                                        <span class="corr-badge" style="background: #ccfbf1; color: #0f766e;">${isl.provIds.length} Provinsi</span>
                                    </div>
                                    <div class="corr-lead">${pCount} Titik POI Terpetakan</div>
                                    <div class="corr-meta" style="margin-top: 4px;">
                                        <span>Estimasi: <b>${rp(pPot)}</b></span>
                                        <span class="corr-progress" style="background: #e0f2fe; color: #0369a1;">Lihat Wilayah →</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `
                        : curIsland && !curProv
                        ? `
                <!-- Level 1: Daftar Provinsi di Wilayah Terpilih -->
                <div class="sidebar-section" style="flex: 1;">
                    <div class="section-header">
                        <span class="section-tag">Provinsi di ${curIsland.name} (${provsInIsland.length})</span>
                    </div>
                    <p style="font-size: 11.5px; color: var(--text-mid); margin: 0 0 8px;">
                        Pilih provinsi di bawah atau klik titik pin di peta untuk eksplorasi kabupaten/kota:
                    </p>
                    <div class="potensi-object-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${provsInIsland
                            .map(
                                (p) => `
                            <div class="pot-corr-card" data-prov-pick="${p.id}" style="cursor: pointer;">
                                <div class="corr-header">
                                    <b style="font-size: 12.5px;">${p.name}</b>
                                    <span class="corr-badge" style="background: #ccfbf1; color: #0f766e;">${p.poi} POI</span>
                                </div>
                                <div class="corr-meta" style="margin-top: 4px;">
                                    <span>Estimasi: <b>${rp(p.pot)}</b></span>
                                    <span class="corr-progress" style="background: #e0f2fe; color: #0369a1;">${p.ver} Verifikasi</span>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>
                `
                        : curProv && !curCity
                        ? `
                <!-- Level 2: Daftar Kabupaten & Kota di Provinsi Terpilih -->
                <div class="sidebar-section" style="flex: 1;">
                    <div class="section-header">
                        <span class="section-tag">Kabupaten &amp; Kota (${citiesInProv.length})</span>
                    </div>
                    <p style="font-size: 11.5px; color: var(--text-mid); margin: 0 0 8px;">
                        Pilih salah satu daerah di bawah atau klik titik pin di peta untuk melihat detail titik POI &amp; koridor:
                    </p>
                    <div class="potensi-object-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${citiesInProv
                            .map(
                                (c) => `
                            <div class="pot-corr-card" data-city-pick="${c.id}" style="cursor: pointer;">
                                <div class="corr-header">
                                    <b style="font-size: 12.5px;">${c.name}</b>
                                    <span class="corr-badge" style="background: #ccfbf1; color: #0f766e;">${c.poi} POI</span>
                                </div>
                                <div class="corr-meta" style="margin-top: 4px;">
                                    <span>Estimasi: <b>${rp(c.pot)}</b></span>
                                    <span class="corr-progress" style="background: #e0f2fe; color: #0369a1;">${c.ver} Verifikasi</span>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>
                `
                        : `
                <!-- Level 3: Antrean Koridor Prioritas & POI Objek di Kota Terpilih -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <span class="section-tag">Koridor Penyisiran Lapangan</span>
                    </div>
                    <p style="font-size: 11.5px; color: var(--text-mid); margin: 0 0 8px;">
                        Pilih koridor jalan di ${curCity.name} untuk melihat titik pemeriksaan (*checkpoint*):
                    </p>
                    <div class="potensi-corridor-list">
                        ${corridorsInCity
                            .map((c) => {
                                const isSel = this.state.selectedCorridor?.id === c.id;
                                const checkedCount = (c.checkpoints || []).filter((cp) => cp.status === 'done' || cp.done).length;
                                return `
                                <div class="pot-corr-card ${isSel ? 'active' : ''}" data-corr="${c.id}">
                                    <div class="corr-header">
                                        <b>${c.name}</b>
                                        <span class="corr-badge">${c.length || c.km || '1,8 km'}</span>
                                    </div>
                                    <span class="corr-lead">${c.scope || c.lead || 'Jalan Protokol'}</span>
                                    <div class="corr-meta">
                                        <span>${c.status || 'Aktif'}</span>
                                        <span class="corr-progress">${checkedCount}/${(c.checkpoints || []).length} Titik</span>
                                    </div>
                                </div>
                            `;
                            })
                            .join('')}
                    </div>
                </div>

                <div class="sidebar-section" style="flex: 1;">
                    <div class="section-header">
                        <span class="section-tag">Titik Objek Terdata (${objectsInCity.length})</span>
                    </div>
                    <div class="potensi-object-list" style="display: flex; flex-direction: column; gap: 8px;">
                        ${objectsInCity
                            .map((obj) => {
                                const isSel = this.state.selectedObject?.id === obj.id;
                                const catMeta = data.categories.find((c) => c.id === obj.category) || { color: '#0d9488', tag: 'POI' };
                                return `
                                <div class="pot-corr-card ${isSel ? 'active' : ''}" data-obj="${obj.id}" style="cursor: pointer;">
                                    <div class="corr-header">
                                        <b style="font-size: 12px;">${obj.name}</b>
                                        <span class="corr-badge" style="background: ${catMeta.color}22; color: ${catMeta.color}; border: 1px solid ${catMeta.color}44;">${catMeta.tag}</span>
                                    </div>
                                    <span class="corr-lead">${obj.addr}</span>
                                    <div class="corr-meta" style="margin-top: 4px;">
                                        <span style="font-weight: 600; color: #0f766e;">${obj.estimatedValue}</span>
                                        <span class="corr-progress" style="background: #e0f2fe; color: #0369a1;">Tahap ${obj.stage}</span>
                                    </div>
                                </div>
                            `;
                            })
                            .join('')}
                    </div>
                </div>
                `
                }
            `;

            this.renderHeaderFilters();

            document.getElementById('btnScopeNasional')?.addEventListener('click', () => {
                this.selectIsland(null, true);
            });

            document.getElementById('btnScopeIsland')?.addEventListener('click', () => {
                if (curIsland) this.selectIsland(curIsland.id, true);
            });

            document.getElementById('btnScopeProv')?.addEventListener('click', () => {
                if (curProv) this.selectProvince(curProv.id, true);
            });

            document.getElementById('kpiCardAllPoi')?.addEventListener('click', () => {
                this.tableState.kpiFilter = 'all';
                this.tableState.page = 1;
                this.renderSidebar();
                this.renderTable();
            });

            document.getElementById('kpiCardUnverified')?.addEventListener('click', () => {
                this.tableState.kpiFilter = (this.tableState.kpiFilter === 'unverified') ? 'all' : 'unverified';
                this.tableState.page = 1;
                this.renderSidebar();
                this.renderTable();
            });

            this.sidebarPotensiView.querySelectorAll('.pot-cat-pill').forEach((btn) => {
                btn.addEventListener('click', () => {
                    this.state.categoryFilter = btn.dataset.cat;
                    this.tableState.page = 1;
                    this.renderSidebar();
                    this.renderMapLayers();
                    this.renderTable();
                });
            });

            this.sidebarPotensiView.querySelectorAll('.pot-corr-card[data-island-pick]').forEach((card) => {
                card.addEventListener('click', () => {
                    this.selectIsland(card.dataset.islandPick);
                });
            });

            this.sidebarPotensiView.querySelectorAll('.pot-corr-card[data-prov-pick]').forEach((card) => {
                card.addEventListener('click', () => {
                    this.selectProvince(card.dataset.provPick);
                });
            });

            this.sidebarPotensiView.querySelectorAll('.pot-corr-card[data-city-pick]').forEach((card) => {
                card.addEventListener('click', () => {
                    this.selectCity(card.dataset.cityPick);
                });
            });

            this.sidebarPotensiView.querySelectorAll('.pot-corr-card[data-corr]').forEach((card) => {
                card.addEventListener('click', () => {
                    this.selectCorridor(card.dataset.corr);
                });
            });

            this.sidebarPotensiView.querySelectorAll('.pot-corr-card[data-obj]').forEach((card) => {
                card.addEventListener('click', () => {
                    this.selectObject(card.dataset.obj);
                });
            });
        }

        updateContextStrip() {
            if (!this.potensiContextStrip) {
                this.potensiContextStrip = document.getElementById('potensiContextStrip');
            }
            const strip = this.potensiContextStrip;
            if (!strip) return;

            const mainLabel = strip.querySelector('#potensiMainLabel') || strip.querySelector('span:nth-child(2)');
            const subLabel = strip.querySelector('#potensiSubLabel') || strip.querySelector('.sub-tag');
            const zoom = this.map ? this.map.getZoom() : 5;

            if (mainLabel) {
                if (this.state.selectedCity && zoom > 11.0) {
                    mainLabel.innerHTML = `Mode Potensi: <b>${this.state.selectedCity.name}</b>`;
                } else if (zoom > 8.5 && zoom <= 11.0) {
                    const provName = this.state.selectedProv ? ` (${this.state.selectedProv.name})` : '';
                    mainLabel.innerHTML = `Mode Potensi: <b>Gugusan Kab/Kota${provName}</b>`;
                } else if (this.state.selectedProv && zoom > 5.5) {
                    mainLabel.innerHTML = `Mode Potensi: <b>Provinsi ${this.state.selectedProv.name}</b>`;
                } else if (this.state.selectedIsland && zoom > 5.5) {
                    mainLabel.innerHTML = `Mode Potensi: <b>${this.state.selectedIsland.name}</b>`;
                } else {
                    mainLabel.innerHTML = `Mode Potensi: <b>Peta Sebaran Potensi Nasional</b>`;
                }
            }

            if (subLabel) {
                if (this.state.selectedCorridor && zoom > 11.0) {
                    subLabel.textContent = `${this.state.selectedCorridor.name} • ${this.state.selectedCorridor.length || this.state.selectedCorridor.km || '1,8 km'}`;
                } else if (this.state.selectedCity && zoom > 11.0) {
                    subLabel.textContent = `${this.state.selectedCity.poi} Titik POI • Estimasi ${rp(this.state.selectedCity.pot)}`;
                } else if (zoom > 8.5 && zoom <= 11.0) {
                    subLabel.textContent = `Tingkat Agregasi Kab/Kota • Zoom ${zoom.toFixed(1)}`;
                } else if (this.state.selectedProv && zoom > 5.5) {
                    subLabel.textContent = `${this.state.selectedProv.poi} Titik POI • Estimasi ${rp(this.state.selectedProv.pot)}`;
                } else if (this.state.selectedIsland && zoom > 5.5) {
                    subLabel.textContent = `${this.state.selectedIsland.name} • ${this.state.selectedIsland.provIds.length} Provinsi`;
                } else {
                    subLabel.textContent = '7 Wilayah Utama • 514 Kabupaten & Kota';
                }
            }
        }

        updateLegend() {
            if (!this.potensiMapLegend) {
                this.potensiMapLegend = document.getElementById('potensiMapLegend');
            }
            if (this.potensiMapLegend) {
                if (this.active && !this.isTableViewActive()) {
                    this.potensiMapLegend.style.display = 'block';
                } else {
                    this.potensiMapLegend.style.display = 'none';
                }
            }
        }

        renderDetailPanel(obj) {
            if (!this.regionPanel || !this.rpContent) return;
            if (this._rpClearTimer) clearTimeout(this._rpClearTimer);
            this.state.selectedObject = obj;
            this.rpContent.scrollTop = 0;

            const data = this.getData();
            const city = data.cities.find((c) => c.id === obj.cityId);
            const prov = city ? data.provinces.find((p) => p.id === city.provId) : null;
            const regionLabel = city ? `${city.name}${prov ? ', ' + prov.name : ''}` : obj.cityId;

            const stepperFlow = ['Impor POI', 'Prioritas', 'Survei & Bukti', 'Validasi Objek', 'Tindak Lanjut', 'Realisasi'];

            const daysLeft = obj.contractDaysLeft !== undefined ? obj.contractDaysLeft : 999;
            let contractBadgeHtml = '';
            if (daysLeft < 0) {
                contractBadgeHtml = `<span style="font-size:10px;font-weight:700;padding:2px 7px;background:#fee2e2;color:#b91c1c;border-radius:4px;">Kadaluarsa (${Math.abs(daysLeft)} hari lalu)</span>`;
            } else if (daysLeft <= 30) {
                contractBadgeHtml = `<span style="font-size:10px;font-weight:700;padding:2px 7px;background:#fef3c7;color:#b45309;border-radius:4px;">Sisa ${daysLeft} Hari</span>`;
            } else if (daysLeft <= 60) {
                contractBadgeHtml = `<span style="font-size:10px;font-weight:600;padding:2px 7px;background:#e0f2fe;color:#0369a1;border-radius:4px;">Sisa ${daysLeft} Hari</span>`;
            } else {
                contractBadgeHtml = `<span style="font-size:10px;font-weight:600;padding:2px 7px;background:#d1fae5;color:#065f46;border-radius:4px;">Aktif (${daysLeft} Hari)</span>`;
            }

            // WhatsApp link & message
            const cleanPhone = String(obj.contactPhone || '6281234567890').replace(/\D/g, '');
            const cityLabel = (obj.cityId || '').toUpperCase();
            const waMsg = `Halo ${obj.contactPerson || 'Bpk/Ibu Pengelola'},\n\nKami dari Tim Rekonsiliasi & Pendataan Pajak Daerah (PAD360) wilayah ${cityLabel}. Berdasarkan catatan sistem kami, izin/kontrak sewa untuk objek "${obj.name}" di lokasi ${obj.addr || '-'} tercatat berakhir pada ${obj.contractEnd || '-'} (${daysLeft < 0 ? 'sudah lewat jatuh tempo' : daysLeft + ' hari lagi'}).\n\nMohon konfirmasi terkait rencana perpanjangan izin dan pemenuhan kewajiban pajak daerah tersebut. Terima kasih.`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
            const gmapsLink = obj.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${obj.lat || 0},${obj.lng || 0}`;

            // Google Maps Review & Rating Data
            const ratingVal = (obj.gmapsRating || 4.7).toFixed(1);
            const totalReviews = obj.gmapsTotalReviews || 84;
            const starCount = Math.round(obj.gmapsRating || 4.7);
            const starIcons = `${ratingVal} / 5.0`;
            const reviewsList = obj.gmapsReviews && obj.gmapsReviews.length > 0 ? obj.gmapsReviews : [
                {
                    author: 'Rian Pratama',
                    badge: 'Local Guide · Level 7',
                    rating: 5,
                    time: '2 minggu lalu',
                    text: 'Penerangan lampu LED megatron sangat terang dan kontras tinggi di malam hari. Titik persimpangan strategis dan ramai lalu lintas.'
                },
                {
                    author: 'Siti Rahma',
                    badge: 'Local Guide · Level 5',
                    rating: 5,
                    time: '1 bulan lalu',
                    text: 'Posisi objek menghadap langsung ke arus utama kendaraan dari arah pusat kota. Sangat eye-catching dan visibilitas tinggi.'
                }
            ];

            const reviewsHtml = reviewsList.map(r => `
                <div style="background: #ffffff; border: 1px solid var(--line-light, #f1f5f9); border-radius: 6px; padding: 9px 11px; font-size: 11.5px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                        <div>
                            <strong style="color: var(--text-hi); font-size: 11.5px;">${escapeHtml(r.author)}</strong>
                            <span style="font-size: 10px; color: var(--text-mid); margin-left: 4px;">• ${escapeHtml(r.badge || 'Pengunjung')}</span>
                        </div>
                        <span style="color: #d97706; font-size: 11px; font-weight: 700; font-family: var(--font-mono);">${(r.rating || 5).toFixed(1)} / 5.0</span>
                    </div>
                    <div style="font-size: 10px; color: var(--text-low); margin-bottom: 4px;">${escapeHtml(r.time || 'Baru saja')}</div>
                    <p style="margin: 0; color: var(--text-mid); line-height: 1.45; font-size: 11px;">"${escapeHtml(r.text)}"</p>
                </div>
            `).join('');

            this.rpContent.innerHTML = `
                <div class="rp-type-tag" style="background:#ccfbf1; color:#0f766e;">${obj.catName}</div>
                <div class="rp-prov">${obj.id} • ${regionLabel}</div>
                <h2 class="rp-name" style="font-size: 18px; margin-bottom: 6px;">${obj.name}</h2>
                
                <!-- Mockup Foto Objek / Board -->
                <div class="potensi-obj-photo">
                    <div class="board-mockup">
                        <span>${obj.name}</span>
                    </div>
                    <span class="photo-caption">Ilustrasi Bukti Lapangan • ${obj.addr}</span>
                </div>

                <!-- Spotlight Potensi Finansial -->
                <div class="rp-spotlight" style="background: linear-gradient(135deg, #f0fdfa, #e0f2fe); border-color: #99f6e4;">
                    <div class="sp-label">${obj.taxType} (Estimasi)</div>
                    <div class="sp-val" style="color: #0f766e; font-size: 18px;">${obj.estimatedValue}</div>
                    <div class="sp-compare" style="font-size: 11px;">Dasar: ${obj.formula}</div>
                </div>

                <!-- Card Masa Kontrak / Izin & Aksi Cepat -->
                <div style="margin: 10px 0 6px; padding: 12px; background: ${daysLeft <= 30 ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${daysLeft <= 30 ? '#fde68a' : '#bbf7d0'}; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 11px; font-weight: 700; color: ${daysLeft <= 30 ? '#92400e' : '#166534'}; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${daysLeft < 0 ? 'Kontrak Jatuh Tempo' : daysLeft <= 30 ? 'Masa Kontrak Segera Habis' : 'Masa Kontrak / Izin'}
                        </span>
                        ${contractBadgeHtml}
                    </div>
                    <div style="font-size: 11.5px; color: var(--text-mid); line-height: 1.4; margin-bottom: 10px;">
                        Jatuh tempo: <b style="color: var(--text-hi); font-family: var(--font-mono); font-size: 12px;">${escapeHtml(obj.contractEnd || '–')}</b> &bull; Pengelola: <b>${escapeHtml(obj.contactPerson || obj.owner || '–')}</b>
                    </div>
                    <div style="display: flex;">
                        ${daysLeft <= 30 ? `
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: #25D366; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; box-shadow: 0 1px 3px rgba(37,211,102,0.3);" title="Hubungi ${obj.contactPerson || 'Pengelola'} via WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Hubungi WhatsApp
                        </a>` : `
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; background: #ffffff; color: #334155; border: 1px solid var(--line); border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;" title="Kirim Pesan WhatsApp">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Hubungi Pengelola
                        </a>`}
                    </div>
                </div>

                <!-- Spesifikasi Fisik & Legalitas -->
                <div class="potensi-spec-card">
                    <div class="spec-row"><span>Masa Kontrak / Izin</span><b style="font-family: var(--font-mono); font-size: 12.5px;">${escapeHtml(obj.contractEnd || '–')}</b></div>
                    <div class="spec-row"><span>Status Kontrak</span><div>${contractBadgeHtml}</div></div>
                    <div class="spec-row"><span>Dimensi Fisik</span><b>${obj.w} × ${obj.h} meter (${obj.w * obj.h} m²)</b></div>
                    <div class="spec-row"><span>Jenis / Sisi</span><b>${obj.jenis} (${obj.sisi} Sisi)</b></div>
                    <div class="spec-row"><span>Pemilik / Operator</span><b>${obj.owner}</b></div>
                    <div class="spec-row"><span>Periode Pajak</span><b>${obj.periode}</b></div>
                    <div class="spec-row"><span>Status Register</span><b style="color:${obj.regStatus.includes('Cocok') || obj.regStatus.includes('Tervalidasi') ? '#0d9488' : '#d97706'}">${obj.regStatus}</b></div>
                    <div class="spec-row"><span>Izin Usaha / Lokasi</span><b>${obj.izinUsaha}</b></div>
                    <div class="spec-row"><span>Izin Tayang / Reklame</span><b>${escapeHtml(obj.izinRek || '–')}</b></div>
                    <div class="spec-row"><span>Kontak Pengelola</span><b>${escapeHtml(obj.contactPerson || obj.owner || '–')}</b></div>
                    <div class="spec-row"><span>No. Telepon / WA</span><b style="font-family: var(--font-mono);">${escapeHtml(obj.contactPhone || '–')}</b></div>
                </div>

                <!-- Ulasan & Rating Google Maps Mendalam -->
                <div class="potensi-gmaps-card" style="margin-top: 12px; background: #ffffff; border: 1px solid var(--line); border-radius: var(--radius-s, 8px); padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align: middle;">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <b style="font-size: 12px; color: var(--text-hi);">Ulasan &amp; Rating Google Maps</b>
                        </div>
                        <span style="font-size: 10px; font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 7px; border-radius: 4px;">Terverifikasi Publik</span>
                    </div>

                    <!-- Rating Summary -->
                    <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 10px;">
                        <div style="text-align: center; min-width: 54px;">
                            <div style="font-size: 24px; font-weight: 800; color: var(--text-hi); line-height: 1;">${ratingVal}</div>
                            <div style="color: #f59e0b; font-size: 11px; margin-top: 3px; letter-spacing: 1px;">${starIcons}</div>
                        </div>
                        <div style="flex: 1; border-left: 1px solid var(--line); padding-left: 10px;">
                            <div style="font-size: 11px; font-weight: 700; color: var(--text-hi);">Basis ${totalReviews} Ulasan Pengunjung</div>
                            <div style="font-size: 10px; color: var(--text-mid); margin-top: 2px; line-height: 1.35;">
                                Titik lokasi ramai, strategis, dan keterlihatan publik tinggi.
                            </div>
                        </div>
                    </div>

                    <!-- Review Snippets List -->
                    <div style="display: flex; flex-direction: column; gap: 7px;">
                        ${reviewsHtml}
                    </div>

                    <!-- Button direct ke Google Maps -->
                    <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; margin-top: 10px; padding: 7px 10px; background: #f1f5f9; color: #1e293b; border: 1px solid var(--line); border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; transition: all 0.15s;">
                        <span>Buka Ulasan Lengkap di Google Maps</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>

                <!-- 6 Tahap Alur Kasus -->
                <div style="margin: 14px 0 8px;">
                    <b style="font-size: 12px; color: var(--text-hi);">Alur Verifikasi Objek</b>
                    <div class="potensi-stepper">
                        ${stepperFlow
                            .map((step, idx) => {
                                const isDone = idx < obj.stage;
                                const isNow = idx === obj.stage;
                                return `
                                <div class="step-item ${isDone ? 'done' : isNow ? 'now' : ''}">
                                    <span class="step-num">${idx + 1}</span>
                                    <span class="step-lbl">${step}</span>
                                </div>
                            `;
                            })
                            .join('')}
                    </div>
                </div>

                <!-- Objek Terkait di Lokasi Sama -->
                ${
                    obj.related && obj.related.length
                        ? `
                    <div style="margin: 14px 0 8px;">
                        <b style="font-size: 12px; color: var(--text-hi);">Objek Terkait di Titik Ini</b>
                        <div class="potensi-related-list">
                            ${obj.related
                                .map(
                                    (rel) => `
                                <div class="rel-item">
                                    <span><b>${rel.id}</b> · ${rel.title}</span>
                                    <span class="rel-badge ${rel.badge}">${rel.type}</span>
                                </div>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                `
                        : ''
                }

                <!-- Riwayat Observasi Lapangan -->
                <div style="margin: 14px 0 8px;">
                    <b style="font-size: 12px; color: var(--text-hi);">Riwayat Observasi & Bukti</b>
                    <div class="potensi-timeline">
                        ${(obj.hist || [])
                            .map(
                                (h) => `
                            <div class="tl-row">
                                <span class="tl-date">${h[0]}</span>
                                <div class="tl-body">
                                    <b>${h[1]}</b>
                                    <small>${h[2]}</small>
                                </div>
                            </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Action Button: Update Data -->
                <button type="button" class="btn btn-primary" id="btnOpenUpdateModal" style="width: 100%; margin-top: 16px; justify-content: center; background: #0f766e; border-color: #0f766e; font-weight: 700;">
                    Update Data Objek (Pajak & Izin)
                </button>
            `;

            this.regionPanel.classList.add('open');

            document.getElementById('btnOpenUpdateModal')?.addEventListener('click', () => {
                this.openUpdateModal(obj);
            });
        }

        openUpdateModal(obj) {
            let modal = document.getElementById('potensiUpdateModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'potensiUpdateModal';
                modal.className = 'potensi-modal-backdrop';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div class="potensi-modal-dialog">
                    <div class="potensi-modal-header">
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase;">Update Status & Data Objek</span>
                            <h3 style="margin-top: 2px;">${obj.name} (${obj.id})</h3>
                        </div>
                        <button type="button" class="potensi-modal-close" id="btnCloseUpdateModal" aria-label="Tutup">&times;</button>
                    </div>

                    <form id="potensiUpdateForm" class="potensi-modal-body">
                        <div class="potensi-form-group">
                            <label for="updRegStatus">Status Register / Status Pajak</label>
                            <select id="updRegStatus" class="potensi-form-control">
                                <option value="Tervalidasi / Lunas Bayar Pajak" ${obj.regStatus.includes('Tervalidasi') || obj.regStatus.includes('Cocok') ? 'selected' : ''}>Tervalidasi / Lunas Bayar Pajak</option>
                                <option value="Penetapan SKPD (Surat Ketetapan)" ${obj.regStatus.includes('SKPD') ? 'selected' : ''}>Penetapan SKPD / Menunggu Pembayaran</option>
                                <option value="Perlu Pencocokan Register" ${obj.regStatus.includes('Perlu') ? 'selected' : ''}>Perlu Pencocokan Register</option>
                                <option value="Kandidat Baru (Belum Terdaftar)" ${obj.regStatus.includes('Kandidat') ? 'selected' : ''}>Kandidat Baru (Belum Terdaftar)</option>
                                <option value="Bukan Objek Pajak" ${obj.regStatus.includes('Bukan') ? 'selected' : ''}>Bukan Objek Pajak</option>
                            </select>
                        </div>

                        <div class="potensi-form-group">
                            <label for="updIzinUsaha">Status Izin Usaha / Reklame</label>
                            <select id="updIzinUsaha" class="potensi-form-control">
                                <option value="Terverifikasi" ${obj.izinUsaha === 'Terverifikasi' ? 'selected' : ''}>Terverifikasi / Izin Lengkap</option>
                                <option value="Dokumen Diunggah" ${obj.izinUsaha.includes('Dokumen') ? 'selected' : ''}>Dokumen Diunggah (Proses Telaah)</option>
                                <option value="Belum diverifikasi" ${obj.izinUsaha.includes('Belum') ? 'selected' : ''}>Belum Diverifikasi</option>
                                <option value="Tidak Ada Izin" ${obj.izinUsaha.includes('Tidak') ? 'selected' : ''}>Tidak Ada Izin / Ilegal</option>
                            </select>
                        </div>

                        <div class="potensi-form-group">
                            <label for="updStage">Tahapan Alur Verifikasi</label>
                            <select id="updStage" class="potensi-form-control">
                                <option value="1" ${obj.stage === 1 ? 'selected' : ''}>Tahap 1: Impor POI Awal</option>
                                <option value="2" ${obj.stage === 2 ? 'selected' : ''}>Tahap 2: Penentuan Prioritas</option>
                                <option value="3" ${obj.stage === 3 ? 'selected' : ''}>Tahap 3: Survei Lapangan & Bukti</option>
                                <option value="4" ${obj.stage === 4 ? 'selected' : ''}>Tahap 4: Validasi Objek & Ukuran</option>
                                <option value="5" ${obj.stage === 5 ? 'selected' : ''}>Tahap 5: Tindak Lanjut Bapenda / SKPD</option>
                                <option value="6" ${obj.stage >= 6 ? 'selected' : ''}>Tahap 6: Realisasi Pembayaran Kas Daerah</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div class="potensi-form-group">
                                <label for="updW">Lebar (Meter)</label>
                                <input type="number" id="updW" class="potensi-form-control" value="${obj.w}" min="1" step="0.5">
                            </div>
                            <div class="potensi-form-group">
                                <label for="updH">Tinggi / Panjang (Meter)</label>
                                <input type="number" id="updH" class="potensi-form-control" value="${obj.h}" min="1" step="0.5">
                            </div>
                        </div>

                        <div class="potensi-form-group">
                            <label for="updContractEnd">Tanggal Berakhir Kontrak / Izin</label>
                            <input type="date" id="updContractEnd" class="potensi-form-control" value="${obj.contractEnd || ''}">
                        </div>

                        <div class="potensi-form-group">
                            <label for="updReason">Alasan Perubahan / Catatan Verifikasi</label>
                            <textarea id="updReason" class="potensi-form-control" rows="2" placeholder="Contoh: Wajib pajak sudah melunasi SKPD nomor 0192/BAPENDA dan izin diperpanjang."></textarea>
                        </div>
                    </form>

                    <div class="potensi-modal-footer">
                        <button type="button" class="btn" id="btnCancelUpdateModal" style="background: var(--surface); border: 1px solid var(--line);">Batal</button>
                        <button type="submit" form="potensiUpdateForm" class="btn btn-primary" style="background:#0f766e; border-color:#0f766e; font-weight:700;">Simpan Perubahan Data</button>
                    </div>
                </div>
            `;

            modal.classList.add('open');

            const closeModal = () => {
                modal.classList.remove('open');
            };

            modal.querySelector('#btnCloseUpdateModal')?.addEventListener('click', closeModal);
            modal.querySelector('#btnCancelUpdateModal')?.addEventListener('click', closeModal);

            modal.querySelector('#potensiUpdateForm')?.addEventListener('submit', (e) => {
                e.preventDefault();
                const newReg = modal.querySelector('#updRegStatus').value;
                const newIzin = modal.querySelector('#updIzinUsaha').value;
                const newStage = parseInt(modal.querySelector('#updStage').value, 10) || obj.stage;
                const newW = parseFloat(modal.querySelector('#updW').value) || obj.w;
                const newH = parseFloat(modal.querySelector('#updH').value) || obj.h;
                const newContractEnd = modal.querySelector('#updContractEnd')?.value || obj.contractEnd;
                const reason = modal.querySelector('#updReason').value.trim() || 'Pembaruan status kepatuhan pajak & izin oleh Admin.';

                // Update Object state
                obj.regStatus = newReg;
                obj.izinUsaha = newIzin;
                obj.stage = newStage;
                obj.w = newW;
                obj.h = newH;
                if (newContractEnd) {
                    obj.contractEnd = newContractEnd;
                    const today = new Date();
                    const endDate = new Date(newContractEnd);
                    const diffTime = endDate - today;
                    obj.contractDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (obj.contractDaysLeft < 0) {
                        obj.contractStatus = 'Kadaluarsa';
                    } else if (obj.contractDaysLeft <= 30) {
                        obj.contractStatus = 'Segera Habis';
                    } else {
                        obj.contractStatus = 'Aktif';
                    }
                }

                const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                obj.hist = obj.hist || [];
                obj.hist.unshift([
                    todayStr,
                    `Status diperbarui: ${newReg} (${newIzin}) - Kontrak: ${obj.contractEnd}`,
                    `Admin Bapenda · ${reason}`
                ]);

                closeModal();
                this.renderDetailPanel(obj);
                this.renderMapLayers();
                this.renderTable();
            });
        }

        renderCheckpointDetail(cp, corridor) {
            if (!this.regionPanel || !this.rpContent) return;
            if (this._rpClearTimer) clearTimeout(this._rpClearTimer);
            this.state.selectedObject = { type: 'checkpoint', cp, corridor };
            this.rpContent.scrollTop = 0;
            const num = cp.num || cp.n || '1';
            const label = cp.title || cp.label || 'Checkpoint';

            this.rpContent.innerHTML = `
                <div class="rp-type-tag" style="background:#fef3c7; color:#b45309;">Titik Checkpoint</div>
                <div class="rp-prov">Checkpoint ${num} • ${corridor.name}</div>
                <h2 class="rp-name" style="font-size: 18px; margin-bottom: 6px;">${label}</h2>

                <div class="potensi-spec-card" style="margin-top: 12px;">
                    <div class="spec-row"><span>Status</span><b>${isDone ? 'Sudah Diperiksa' : 'Belum Diperiksa'}</b></div>
                    <div class="spec-row"><span>Koridor</span><b>${corridor.name}</b></div>
                    <div class="spec-row"><span>Catatan</span><b>${cp.note || 'Tidak ada catatan tambahan.'}</b></div>
                </div>

                <div style="padding: 16px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; margin-top: 14px; font-size: 12px; color: var(--text-mid);">
                    Titik pengawasan fisik tim lapangan untuk mencocokkan izin reklame, parkir, dan PBB di sepanjang rute.
                </div>
            `;

            this.regionPanel.classList.add('open');
        }

        initTable() {
            const btnAll = document.getElementById('btnContractAll');
            const btnSoon = document.getElementById('btnContractExpiringSoon');
            const btnWarn60 = document.getElementById('btnContractWarning60');
            const btnExpired = document.getElementById('btnContractExpired');

            const setQuickFilter = (type) => {
                this.tableState.contractFilter = type;
                this.tableState.page = 1;
                [btnAll, btnSoon, btnWarn60, btnExpired].forEach(b => b?.classList.remove('active'));
                if (type === 'all') btnAll?.classList.add('active');
                else if (type === 'expiring_soon') btnSoon?.classList.add('active');
                else if (type === 'warning_60') btnWarn60?.classList.add('active');
                else if (type === 'expired') btnExpired?.classList.add('active');
                this.renderTable();
            };

            btnAll?.addEventListener('click', () => setQuickFilter('all'));
            btnSoon?.addEventListener('click', () => setQuickFilter('expiring_soon'));
            btnWarn60?.addEventListener('click', () => setQuickFilter('warning_60'));
            btnExpired?.addEventListener('click', () => setQuickFilter('expired'));

            // Realtime Search Input Handler
            const searchInput = document.getElementById('potensiTableSearchInput');
            const searchClear = document.getElementById('potensiTableSearchClear');

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const val = e.target.value.trim();
                    this.tableState.searchQuery = val;
                    this.tableState.page = 1;
                    if (searchClear) searchClear.style.display = val ? 'block' : 'none';
                    this.renderTable();
                });

                searchClear?.addEventListener('click', () => {
                    searchInput.value = '';
                    this.tableState.searchQuery = '';
                    this.tableState.page = 1;
                    searchClear.style.display = 'none';
                    searchInput.focus();
                    this.renderTable();
                });
            }

            // Interactive Column Sorting Listener on Header
            const thead = document.querySelector('#potensiDataTable thead');
            thead?.querySelectorAll('th[data-potensi-sort]').forEach(th => {
                th.addEventListener('click', () => {
                    const sortKey = th.getAttribute('data-potensi-sort');
                    if (!sortKey) return;

                    if (this.tableState.sortField === sortKey) {
                        this.tableState.sortAsc = !this.tableState.sortAsc;
                    } else {
                        this.tableState.sortField = sortKey;
                        // Default descending for numeric value (highest first), ascending for others
                        this.tableState.sortAsc = (sortKey === 'value') ? false : true;
                    }
                    this.tableState.page = 1;
                    this.renderTable();
                });
            });

            // Event delegation untuk tombol detail & reset search pada tabel potensi
            const tbody = document.getElementById('potensiTableBody');
            tbody?.addEventListener('click', (e) => {
                const btnDetail = e.target.closest('.btn-detail-poi');
                if (btnDetail) {
                    const oid = btnDetail.getAttribute('data-obj-id');
                    const data = this.getData();
                    const obj = data.objects ? data.objects[oid] : null;
                    if (obj) this.renderDetailPanel(obj);
                    return;
                }

                const btnReset = e.target.closest('#btnResetTableSearch');
                if (btnReset && searchInput) {
                    searchInput.value = '';
                    this.tableState.searchQuery = '';
                    this.tableState.page = 1;
                    if (searchClear) searchClear.style.display = 'none';
                    this.renderTable();
                }
            });
        }

        updateTableSortIcons() {
            const curField = this.tableState.sortField;
            const curAsc = this.tableState.sortAsc;

            ['name', 'category', 'value', 'contract'].forEach(f => {
                const th = document.querySelector(`#potensiDataTable th[data-potensi-sort="${f}"]`);
                const icon = document.getElementById(`sortIcon_${f}`);
                if (!th || !icon) return;

                if (curField === f) {
                    th.classList.add('sort-active');
                    icon.textContent = curAsc ? '▲' : '▼';
                    icon.style.opacity = '1';
                } else {
                    th.classList.remove('sort-active');
                    icon.textContent = '↕';
                    icon.style.opacity = '0.4';
                }
            });
        }

        renderTable() {
            const tbody = document.getElementById('potensiTableBody');
            const countLabel = document.getElementById('potensiTableCountLabel');
            const pageInfo = document.getElementById('potensiPageInfo');
            const pageBtns = document.getElementById('potensiPageBtns');
            if (!tbody) return;

            // Sinkronkan indikator visual panah sorting pada header tabel
            this.updateTableSortIcons();

            const data = this.getData();
            const allObjs = Object.values(data.objects || {});

            // Filter Wilayah (Tersinkronisasi Lengkap: Kota -> Provinsi -> Pulau -> Nasional)
            let filtered = allObjs;
            let scopeLabel = 'Nasional (Seluruh Indonesia)';
            if (this.state.selectedCity) {
                filtered = filtered.filter(o => o.cityId === this.state.selectedCity.id);
                scopeLabel = `${this.state.selectedCity.name}, ${this.state.selectedProv?.name || ''}`;
            } else if (this.state.selectedProv) {
                const provCityIds = (data.cities || []).filter(c => c.provId === this.state.selectedProv.id).map(c => c.id);
                filtered = filtered.filter(o => provCityIds.includes(o.cityId));
                scopeLabel = `Provinsi ${this.state.selectedProv.name}`;
            } else if (this.state.selectedIsland) {
                const islandProvIds = this.state.selectedIsland.provIds || [];
                const islandCityIds = (data.cities || []).filter(c => islandProvIds.includes(c.provId)).map(c => c.id);
                filtered = filtered.filter(o => islandCityIds.includes(o.cityId));
                scopeLabel = `${this.state.selectedIsland.name} (${islandProvIds.length} Provinsi)`;
            }

            // Filter Kategori POI (dari Sidebar)
            let catLabel = '';
            if (this.state.categoryFilter && this.state.categoryFilter !== 'all') {
                filtered = filtered.filter(o => o.category === this.state.categoryFilter);
                const matchedCat = (data.categories || []).find(c => c.id === this.state.categoryFilter);
                catLabel = matchedCat ? ` · Kategori ${matchedCat.name || matchedCat.label}` : ` · Kategori ${this.state.categoryFilter.toUpperCase()}`;
            }

            // Filter KPI Verifikasi (dari Sidebar KPI Card)
            let kpiLabel = '';
            if (this.tableState.kpiFilter === 'unverified') {
                filtered = filtered.filter(o => o.stage <= 2 || (o.regStatus && (o.regStatus.toLowerCase().includes('kandidat') || o.regStatus.toLowerCase().includes('perlu'))));
                kpiLabel = ' · Perlu Verifikasi';
            }

            // Filter Quick Status Kontrak
            let contractLabel = '';
            if (this.tableState.contractFilter === 'expiring_soon') {
                filtered = filtered.filter(o => (o.contractDaysLeft >= 0 && o.contractDaysLeft <= 30));
                contractLabel = ' · Segera Habis (≤ 30 Hari)';
            } else if (this.tableState.contractFilter === 'warning_60') {
                filtered = filtered.filter(o => (o.contractDaysLeft > 30 && o.contractDaysLeft <= 60));
                contractLabel = ' · Sisa 31-60 Hari';
            } else if (this.tableState.contractFilter === 'expired') {
                filtered = filtered.filter(o => (o.contractDaysLeft < 0));
                contractLabel = ' · Kadaluarsa';
            }

            // Filter Pencarian Teks Objek (Nama Objek, Alamat/Jalan, Pengelola/Pemilik, Jenis, ID)
            let searchLabel = '';
            if (this.tableState.searchQuery) {
                const q = this.tableState.searchQuery.toLowerCase();
                filtered = filtered.filter(o =>
                    (o.name && o.name.toLowerCase().includes(q)) ||
                    (o.addr && o.addr.toLowerCase().includes(q)) ||
                    (o.contactPerson && o.contactPerson.toLowerCase().includes(q)) ||
                    (o.owner && o.owner.toLowerCase().includes(q)) ||
                    (o.jenis && o.jenis.toLowerCase().includes(q)) ||
                    (o.id && o.id.toLowerCase().includes(q))
                );
                searchLabel = ` · Pencarian: "${this.tableState.searchQuery}"`;
            }

            // Interactive Column Sorting
            const sortField = this.tableState.sortField || 'contract';
            const sortAsc = this.tableState.sortAsc !== false;

            filtered.sort((a, b) => {
                let res = 0;
                if (sortField === 'name') {
                    res = (a.name || '').localeCompare(b.name || '', 'id');
                } else if (sortField === 'category') {
                    const catA = a.catName || a.category || '';
                    const catB = b.catName || b.category || '';
                    res = catA.localeCompare(catB, 'id');
                } else if (sortField === 'value') {
                    const valA = a.potValJt !== undefined ? a.potValJt : 0;
                    const valB = b.potValJt !== undefined ? b.potValJt : 0;
                    res = valA - valB;
                } else if (sortField === 'contract' || sortField === 'contractDaysLeft') {
                    const daysA = a.contractDaysLeft !== undefined ? a.contractDaysLeft : 999;
                    const daysB = b.contractDaysLeft !== undefined ? b.contractDaysLeft : 999;
                    res = daysA - daysB;
                }
                return sortAsc ? res : -res;
            });

            const totalRows = filtered.length;
            const pageSize = this.tableState.pageSize || 25;
            const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

            if (this.tableState.page > totalPages) this.tableState.page = totalPages;
            if (this.tableState.page < 1) this.tableState.page = 1;

            const curPage = this.tableState.page;
            const startIdx = (curPage - 1) * pageSize;
            const pageItems = filtered.slice(startIdx, startIdx + pageSize);

            if (countLabel) {
                countLabel.textContent = `Menampilkan ${totalRows.toLocaleString('id-ID')} objek potensi · ${scopeLabel}${catLabel}${kpiLabel}${contractLabel}${searchLabel}`;
            }

            if (pageInfo) {
                pageInfo.textContent = `Halaman ${curPage} dari ${totalPages} (Total ${totalRows.toLocaleString('id-ID')} objek)`;
            }

            if (pageItems.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center;padding:40px 20px;color:var(--text-mid);">
                            <div style="font-size: 14px; font-weight: 700; margin-bottom: 6px; color: var(--text-hi);">Tidak ada objek potensi yang cocok</div>
                            <div style="font-size: 12px; margin-bottom: 12px;">Filter aktif: ${scopeLabel}${catLabel}${kpiLabel}${contractLabel}${searchLabel}</div>
                            ${this.tableState.searchQuery ? `
                            <button type="button" id="btnResetTableSearch" style="padding: 6px 14px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid var(--line); background: #ffffff; cursor: pointer; color: var(--merah); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                                ✕ Reset Pencarian
                            </button>` : ''}
                        </td>
                    </tr>
                `;
                if (pageBtns) pageBtns.innerHTML = '';
                return;
            }

            const catColors = {
                rek: { bg: '#e0f2fe', color: '#0369a1', label: 'Reklame' },
                pkr: { bg: '#fef3c7', color: '#b45309', label: 'Parkir' },
                mall: { bg: '#ede9fe', color: '#6d28d9', label: 'Mall & Belanja' },
                pab: { bg: '#dbeafe', color: '#1d4ed8', label: 'Pabrik & Gudang' },
                tmn: { bg: '#d1fae5', color: '#065f46', label: 'Ruang Publik' }
            };

            const rowsHtml = pageItems.map((item, idx) => {
                const no = startIdx + idx + 1;
                const catCfg = catColors[item.category] || { bg: '#e2e8f0', color: '#334155', label: item.catName || 'Objek' };
                const daysLeft = item.contractDaysLeft !== undefined ? item.contractDaysLeft : 999;

                // Status Kontrak Badge
                let contractBadgeHtml = '';
                if (daysLeft < 0) {
                    contractBadgeHtml = `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;background:#fee2e2;color:#b91c1c;border-radius:4px;white-space:nowrap;">Kadaluarsa (${Math.abs(daysLeft)}h lalu)</span>`;
                } else if (daysLeft <= 30) {
                    contractBadgeHtml = `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;background:#fef3c7;color:#b45309;border-radius:4px;white-space:nowrap;">Sisa ${daysLeft} Hari</span>`;
                } else if (daysLeft <= 60) {
                    contractBadgeHtml = `<span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;background:#e0f2fe;color:#0369a1;border-radius:4px;white-space:nowrap;">Sisa ${daysLeft} Hari</span>`;
                } else {
                    contractBadgeHtml = `<span style="display:inline-block;font-size:10px;font-weight:600;padding:2px 7px;background:#d1fae5;color:#065f46;border-radius:4px;white-space:nowrap;">Aktif (${daysLeft} Hari)</span>`;
                }

                // WhatsApp Action (HANYA MUNCUL JIKA KONTRAK <= 30 HARI ATAU KADALUARSA)
                let contactActionHtml = '';
                if (daysLeft <= 30) {
                    const cleanPhone = String(item.contactPhone || '6281234567890').replace(/\D/g, '');
                    const cityLabel = (item.cityId || '').toUpperCase();
                    const waMsg = `Halo ${item.contactPerson || 'Bpk/Ibu Pengelola'},\n\nKami dari Tim Rekonsiliasi & Pendataan Pajak Daerah (PAD360) wilayah ${cityLabel}. Berdasarkan catatan sistem kami, izin/kontrak sewa untuk objek "${item.name}" di lokasi ${item.addr || '-'} tercatat berakhir pada ${item.contractEnd || '-'} (${daysLeft < 0 ? 'sudah lewat jatuh tempo' : daysLeft + ' hari lagi'}).\n\nMohon konfirmasi terkait rencana perpanjangan izin dan pemenuhan kewajiban pajak daerah tersebut. Terima kasih.`;
                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

                    contactActionHtml = `
                        <div style="display:inline-flex;align-items:center;gap:5px;justify-content:center;">
                            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:5px 8px;background:#25D366;color:#ffffff;border-radius:5px;font-size:11px;font-weight:700;text-decoration:none;box-shadow:0 1px 3px rgba(37,211,102,0.3);white-space:nowrap;" title="Hubungi ${item.contactPerson || 'Pengelola'} via WhatsApp">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                <span>WhatsApp</span>
                            </a>
                            <button type="button" class="btn-detail-poi" data-obj-id="${item.id}" style="padding:5px 7px;background:var(--surface);border:1px solid var(--line);border-radius:5px;font-size:11px;cursor:pointer;color:var(--text-hi);display:inline-flex;align-items:center;justify-content:center;" title="Lihat Detail Objek"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="10" r="3"/></svg></button>
                        </div>
                    `;
                } else {
                    contactActionHtml = `
                        <div style="display:inline-flex;align-items:center;gap:5px;justify-content:center;">
                            <span style="font-size:10.5px;color:var(--text-low);font-weight:600;padding:3px 7px;background:var(--surface);border-radius:4px;border:1px solid var(--line-light);white-space:nowrap;">Kontrak Aktif</span>
                            <button type="button" class="btn-detail-poi" data-obj-id="${item.id}" style="padding:5px 7px;background:var(--surface);border:1px solid var(--line);border-radius:5px;font-size:11px;cursor:pointer;color:var(--text-hi);display:inline-flex;align-items:center;justify-content:center;" title="Lihat Detail Objek"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="10" r="3"/></svg></button>
                        </div>
                    `;
                }

                // Google Maps Direct Link (Inline bersama alamat)
                const gmapsLink = item.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${item.lat || 0},${item.lng || 0}`;

                // Pisahkan nilai estimasi rupiah dan periode waktu
                const valParts = (item.estimatedValue || '–').split('/');
                const valRupiah = valParts[0].trim();
                const valPeriode = valParts.length > 1 ? `/${valParts[1].trim()}` : '';

                return `
                    <tr>
                        <td style="text-align:center;font-family:var(--font-mono);color:var(--text-low);font-weight:600;">${no}</td>
                        <td>
                            <div style="font-weight:700;color:var(--text-hi);font-size:12px;line-height:1.35;margin-bottom:3px;">${escapeHtml(item.name)}</div>
                            <div style="font-size:11px;color:var(--text-mid);line-height:1.35;display:flex;align-items:flex-start;gap:4px;">
                                <span style="flex-shrink:0;color:var(--teal);display:inline-flex;align-items:center;margin-top:1px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                                <span>${escapeHtml(item.addr || '-')} <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:2px;color:var(--merah);font-size:10px;font-weight:700;text-decoration:none;margin-left:3px;padding:0px 4px;background:var(--merah-bg);border-radius:3px;border:1px solid rgba(197,34,31,0.2);white-space:nowrap;" title="Buka Titik Koordinat di Google Maps">Peta ↗</a></span>
                            </div>
                            <div style="font-size:10.5px;color:var(--text-low);margin-top:2px;">Pengelola: <b style="color:var(--text-mid);">${escapeHtml(item.contactPerson || item.owner || '-')}</b></div>
                        </td>
                        <td>
                            <span style="display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;background:${catCfg.bg};color:${catCfg.color};white-space:nowrap;">${catCfg.label}</span>
                            <div style="font-size:11px;color:var(--text-mid);margin-top:2px;line-height:1.25;">${escapeHtml(item.jenis || '-')}</div>
                        </td>
                        <td style="text-align:right;">
                            <div style="font-family:var(--font-mono);font-weight:700;font-size:12px;color:var(--text-hi);white-space:nowrap;">${escapeHtml(valRupiah)}</div>
                            <div style="font-size:10px;color:var(--text-low);margin-top:1px;white-space:nowrap;">${escapeHtml(valPeriode || '/ tahun')}</div>
                        </td>
                        <td>
                            <div style="font-family:var(--font-mono);font-size:11.5px;font-weight:700;color:var(--text-hi);">${escapeHtml(item.contractEnd || '–')}</div>
                            <div style="margin-top:2px;">${contractBadgeHtml}</div>
                        </td>
                        <td style="text-align:center;">
                            ${contactActionHtml}
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = rowsHtml;

            // Render Pagination Buttons
            if (pageBtns) {
                let btnsHtml = `
                    <button type="button" class="btn-prev-page" style="padding:4px 10px;font-size:11.5px;background:var(--surface);border:1px solid var(--line);border-radius:5px;cursor:pointer;" ${curPage === 1 ? 'disabled' : ''}>&larr; Sebelumnya</button>
                `;

                // Tampilkan beberapa tombol nomor
                const maxButtons = 5;
                let startPage = Math.max(1, curPage - 2);
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                if (endPage - startPage < maxButtons - 1) {
                    startPage = Math.max(1, endPage - maxButtons + 1);
                }

                for (let p = startPage; p <= endPage; p++) {
                    const isActive = p === curPage;
                    btnsHtml += `
                        <button type="button" class="btn-page-num" data-page="${p}" style="padding:4px 9px;font-size:11.5px;border-radius:5px;cursor:pointer;border:1px solid var(--line);${isActive ? 'background:var(--merah);color:#fff;font-weight:700;' : 'background:var(--surface);color:var(--text);'}">${p}</button>
                    `;
                }

                btnsHtml += `
                    <button type="button" class="btn-next-page" style="padding:4px 10px;font-size:11.5px;background:var(--surface);border:1px solid var(--line);border-radius:5px;cursor:pointer;" ${curPage === totalPages ? 'disabled' : ''}>Selanjutnya &rarr;</button>
                `;

                pageBtns.innerHTML = btnsHtml;

                // Event listener pagination
                pageBtns.querySelector('.btn-prev-page')?.addEventListener('click', () => {
                    if (this.tableState.page > 1) {
                        this.tableState.page--;
                        this.renderTable();
                    }
                });

                pageBtns.querySelector('.btn-next-page')?.addEventListener('click', () => {
                    if (this.tableState.page < totalPages) {
                        this.tableState.page++;
                        this.renderTable();
                    }
                });

                pageBtns.querySelectorAll('.btn-page-num').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetPage = parseInt(e.target.getAttribute('data-page'), 10);
                        if (targetPage && targetPage !== this.tableState.page) {
                            this.tableState.page = targetPage;
                            this.renderTable();
                        }
                    });
                });
            }
        }
    }

    window.PotensiController = PotensiController;
})();

