const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'json', 'data.json');
const geoPath = path.join(__dirname, '..', 'data', 'geojson', 'indonesia-kab.json');

const regData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

const cleanAlnum = s => (s || '').toString().toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();

const cleanStripType = s => (s || '').toString().toUpperCase()
    .replace(/^(KABUPATEN|KOTA|KAB\.|KOTA\.)\s+/, '')
    .replace(/[^A-Z0-9]/g, '')
    .trim();

const cleanStr = cleanStripType;

// Extract all coordinate pairs from GeoJSON geometry
function getFeatureCoords(f) {
    const coords = [];
    if (!f || !f.geometry || !f.geometry.coordinates) return coords;
    function extract(arr) {
        if (!arr || arr.length === 0) return;
        if (typeof arr[0] === 'number') {
            coords.push(arr);
        } else {
            arr.forEach(extract);
        }
    }
    extract(f.geometry.coordinates);
    return coords;
}

// Calculate minimum Euclidean distance between polygon boundary coordinates
function minCoordDistance(coords1, coords2) {
    let minDist = Infinity;
    const step1 = Math.max(1, Math.floor(coords1.length / 200));
    const step2 = Math.max(1, Math.floor(coords2.length / 200));

    for (let i = 0; i < coords1.length; i += step1) {
        const [x1, y1] = coords1[i];
        for (let j = 0; j < coords2.length; j += step2) {
            const [x2, y2] = coords2[j];
            const dx = x1 - x2;
            const dy = y1 - y2;
            const d = dx * dx + dy * dy;
            if (d < minDist) {
                minDist = d;
                if (minDist === 0) return 0;
            }
        }
    }
    return Math.sqrt(minDist);
}

// Helper: Calculate bounding box
function getFeatureBounds(f) {
    const coords = getFeatureCoords(f);
    if (coords.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    coords.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    });
    return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

function isWaterBodyName(name) {
    if (!name) return false;
    const clean = name.replace(/^(Kabupaten|Kota|Kab\.|Kota\.)\s+/i, '').trim();
    if (clean.toUpperCase() === 'TANAH LAUT') return false;
    return /\b(LAUT|SELAT|SAMUDRA|SAMUDERA|TELUK|PERAIRAN|DANAU|OCEAN)\b/i.test(clean);
}

// Clean raw boundary text from BPS data
function cleanBpsText(text) {
    if (!text) return null;
    let str = text.toString().trim();
    if (!str || str.toLowerCase() === 'null') return null;

    // Check if sea/water body (including Danau, avoiding false matches on 'Selatan' or 'Tanah Laut')
    if (isWaterBodyName(str)) {
        return str.replace(/^Kab\.\s+/i, '').replace(/^Kota\s+/i, '').trim();
    }

    // Split multiple regions (e.g. "Kab. Muara Enim dan Kab. Ogan Ilir" -> ["Kab. Muara Enim", "Kab. Ogan Ilir"])
    const parts = str.split(/&|,|\sdan\s/i).map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return null;

    // Pick first clean region name
    let primary = parts[0];
    primary = primary.replace(/^Kab\.\s+/i, 'Kabupaten ')
                     .replace(/^Kabupaten\s+/i, 'Kabupaten ')
                     .replace(/^Kota\s+/i, 'Kota ')
                     .trim();

    return primary;
}

// Capital & Metro Dictionary Overrides
const OVERRIDES = {
    '112': { u: 'Kabupaten Banyuasin', s: 'Kabupaten Ogan Ilir', t: 'Kabupaten Banyuasin', b: 'Kabupaten Muara Enim' }, // Palembang
    '158': { u: 'Kota Jakarta Utara', s: 'Kota Jakarta Selatan', t: 'Kota Jakarta Timur', b: 'Kota Jakarta Barat' }, // Jakarta Pusat
    '159': { u: 'Laut Jawa', s: 'Kota Jakarta Pusat', t: 'Kabupaten Bekasi', b: 'Kota Jakarta Barat' }, // Jakarta Utara
    '160': { u: 'Kota Jakarta Utara', s: 'Kota Tangerang Selatan', t: 'Kota Jakarta Pusat', b: 'Kota Tangerang' }, // Jakarta Barat
    '161': { u: 'Kota Jakarta Pusat', s: 'Kota Depok', t: 'Kota Jakarta Timur', b: 'Kota Tangerang Selatan' }, // Jakarta Selatan
    '162': { u: 'Kota Jakarta Utara', s: 'Kota Depok', t: 'Kota Bekasi', b: 'Kota Jakarta Pusat' }, // Jakarta Timur
    '193': { u: 'Kota Semarang & Kabupaten Demak', s: 'Kabupaten Boyolali', t: 'Kabupaten Grobogan', b: 'Kabupaten Temanggung & Kabupaten Kendal', e: 'Kota Salatiga' }, // Kabupaten Semarang
    '213': { u: 'Laut Jawa', s: 'Kabupaten Semarang', t: 'Kabupaten Demak', b: 'Kabupaten Kendal', e: null }, // Kota Semarang
    '242': { u: 'Kabupaten Pasuruan', s: 'Samudra Hindia', t: 'Kabupaten Lumajang', b: 'Kabupaten Blitar', e: 'Kota Malang' }, // Kabupaten Malang
    '346': { u: 'Kabupaten Paser', s: 'Laut Jawa', t: 'Selat Makassar', b: 'Kabupaten Tanah Bumbu & Kabupaten Banjar', e: null } // Kotabaru
};

const TRUE_ENCLAVES = {
    'MALANG': 'Kota Malang',
    'BOGOR': 'Kota Bogor',
    'SUKABUMI': 'Kota Sukabumi',
    'KEDIRI': 'Kota Kediri',
    'BLITAR': 'Kota Blitar',
    'MAGELANG': 'Kota Magelang',
    'SEMARANG': 'Kota Salatiga',
    'MOJOKERTO': 'Kota Mojokerto',
    'TASIKMALAYA': 'Kota Tasikmalaya',
    'MUARA ENIM': 'Kota Prabumulih',
    'SIMALUNGUN': 'Kota Pematangsiantar'
};

const ALIASES = {
    'TOBA': 'TOBASAMOSIR', 'TOBASAMOSIR': 'TOBA',
    'PAKPAKBHARAT': 'PAKPAKBARAT', 'PAKPAKBARAT': 'PAKPAKBHARAT',
    'TANJUNGJABUNGBARAT': 'TANJUNGJABUNGB', 'TANJUNGJABUNGTIMUR': 'TANJUNGJABUNGT',
    'TANJUNGJABUNGB': 'TANJUNGJABUNGBARAT', 'TANJUNGJABUNGT': 'TANJUNGJABUNGTIMUR',
    'MEMPAWAH': 'PONTIANAK',
    'KOTABARU': 'KOTABARU',
    'KOTATARAKAN': 'TARAKAN', 'TARAKAN': 'KOTATARAKAN',
    'PASANGKAYU': 'MAMUJUUTARA', 'MAMUJUUTARA': 'PASANGKAYU',
    'KEPULAUANTANIMBAR': 'MALUKUTENGGARABARAT', 'MALUKUTENGGARABARAT': 'KEPULAUANTANIMBAR'
};

const PEMEKARAN_PARENTS = {
    '110': 'Muara Enim', // PALI
    '111': 'Musi Rawas', // Musi Rawas Utara
    '138': 'Lampung Barat', // Pesisir Barat
    '179': 'Ciamis', // Pangandaran
    '297': 'Belu', // Malaka
    '356': 'Kutai Barat', // Mahakam Ulu
    '387': 'Banggai Kepulauan', // Banggai Laut
    '397': 'Morowali', // Morowali Utara
    '424': 'Kolaka', // Kolaka Timur
    '434': 'Konawe', // Konawe Kepulauan
    '435': 'Muna', // Muna Barat
    '436': 'Buton', // Buton Tengah
    '437': 'Buton', // Buton Selatan
    '451': 'Mamuju', // Mamuju Tengah
    '470': 'Kepulauan Sula', // Pulau Taliabu
    '473': 'Manokwari', // Manokwari Selatan
    '479': 'Manokwari' // Pegunungan Arfak
};

const MARITIME_OVERRIDES = {
    '148': [
        { name: 'Kota Batam', type: 'kota', badge: 'Kota' },
        { name: 'Kota Tanjungpinang', type: 'kota', badge: 'Kota' },
        { name: 'Kabupaten Kepulauan Meranti', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Selat Malaka', type: 'water', badge: 'Perairan / Selat' }
    ], // Karimun
    '150': [
        { name: 'Kabupaten Kepulauan Anambas', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Natuna Utara', type: 'water', badge: 'Perairan / Laut' },
        { name: 'Laut Natuna', type: 'water', badge: 'Perairan / Laut' }
    ], // Natuna
    '151': [
        { name: 'Kota Tanjungpinang', type: 'kota', badge: 'Kota' },
        { name: 'Kota Batam', type: 'kota', badge: 'Kota' },
        { name: 'Laut Natuna', type: 'water', badge: 'Perairan / Laut' }
    ], // Lingga
    '152': [
        { name: 'Kabupaten Natuna', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Natuna Utara', type: 'water', badge: 'Perairan / Laut' },
        { name: 'Laut Natuna', type: 'water', badge: 'Perairan / Laut' }
    ], // Kepulauan Anambas
    '153': [
        { name: 'Kota Tanjungpinang', type: 'kota', badge: 'Kota' },
        { name: 'Kabupaten Bintan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Karimun', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Selat Singapura', type: 'water', badge: 'Perairan / Selat' }
    ], // Batam
    '346': [
        { name: 'Kabupaten Tanah Bumbu', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Paser', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Balangan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Banjar', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Hulu Sungai Tengah', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Hulu Sungai Selatan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Selat Makassar', type: 'water', badge: 'Perairan / Selat' },
        { name: 'Laut Jawa', type: 'water', badge: 'Perairan / Laut' }
    ], // Kotabaru
    '370': [
        { name: 'Kabupaten Bulungan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Nunukan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Sulawesi', type: 'water', badge: 'Perairan / Laut' }
    ], // Tarakan
    '375': [
        { name: 'Kabupaten Kepulauan Siau Tagulandang Biaro', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Sulawesi', type: 'water', badge: 'Perairan / Laut' },
        { name: 'Laut Maluku', type: 'water', badge: 'Perairan / Laut' }
    ], // Sangihe
    '376': [
        { name: 'Kabupaten Kepulauan Sangihe', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Samudra Pasifik', type: 'water', badge: 'Perairan / Samudra' },
        { name: 'Laut Maluku', type: 'water', badge: 'Perairan / Laut' }
    ], // Talaud
    '380': [
        { name: 'Kabupaten Kepulauan Sangihe', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Minahasa Utara', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Sulawesi', type: 'water', badge: 'Perairan / Laut' }
    ], // Sitaro
    '403': [
        { name: 'Kabupaten Bulukumba', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Bantaeng', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Flores', type: 'water', badge: 'Perairan / Laut' }
    ], // Kepulauan Selayar
    '431': [
        { name: 'Kabupaten Buton', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Buton Selatan', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Banda', type: 'water', badge: 'Perairan / Laut' },
        { name: 'Laut Flores', type: 'water', badge: 'Perairan / Laut' }
    ], // Wakatobi
    '456': [
        { name: 'Kabupaten Maluku Tenggara', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Arafura', type: 'water', badge: 'Perairan / Laut' }
    ], // Kepulauan Aru
    '465': [
        { name: 'Kabupaten Pulau Taliabu', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Banda', type: 'water', badge: 'Perairan / Laut' },
        { name: 'Laut Maluku', type: 'water', badge: 'Perairan / Laut' }
    ], // Kepulauan Sula
    '469': [
        { name: 'Kabupaten Halmahera Utara', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Samudra Pasifik', type: 'water', badge: 'Perairan / Samudra' },
        { name: 'Laut Halmahera', type: 'water', badge: 'Perairan / Laut' }
    ], // Pulau Morotai
    '471': [
        { name: 'Kota Tidore Kepulauan', type: 'kota', badge: 'Kota' },
        { name: 'Kabupaten Halmahera Barat', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Laut Maluku', type: 'water', badge: 'Perairan / Laut' }
    ], // Kota Ternate
    '489': [
        { name: 'Kabupaten Biak Numfor', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Kabupaten Waropen', type: 'kabupaten', badge: 'Kabupaten' },
        { name: 'Teluk Cenderawasih', type: 'water', badge: 'Perairan / Teluk' }
    ] // Kepulauan Yapen
};

const normProv = s => {
    let clean = cleanAlnum(s);
    if (clean.includes('JAKARTA')) return 'JAKARTA';
    if (clean.includes('YOGYAKARTA')) return 'YOGYAKARTA';
    if (clean.includes('BANGKABELITUNG')) return 'BANGKABELITUNG';
    if (clean.includes('PAPUABARAT') || clean.includes('IRIANJAYABARAT')) return 'PAPUABARAT';
    return clean;
};

// Pre-process all feature coordinates & bounds for optimization
const preparedFeatures = geoData.features.map(f => ({
    feature: f,
    coords: getFeatureCoords(f),
    bounds: getFeatureBounds(f),
    name: f.properties ? (f.properties.NAME_1 || f.properties.KABKOTA || '') : '',
    type2: f.properties ? (f.properties.VARNAME_2 || '') : '',
    country: f.properties ? (f.properties.COUNTRY || f.properties.NAME_2 || '') : ''
})).filter(pf => pf.coords.length > 0 && pf.bounds);

function findStrictGeoFeature(rObj) {
    if (!rObj) return null;
    const rid = String(rObj.id || rObj.no || '');
    if (PEMEKARAN_PARENTS[rid]) {
        const pName = PEMEKARAN_PARENTS[rid];
        const pPf = preparedFeatures.find(pf => cleanAlnum(pf.name) === cleanAlnum(pName));
        if (pPf) return pPf.feature;
    }

    const rawTarget = cleanAlnum(rObj.kabkota);
    const stripTarget = cleanStripType(rObj.kabkota);
    const provClean = normProv(rObj.prov);
    const rIsKota = (rObj.kabkota || '').toUpperCase().startsWith('KOTA ');
    const isSpecial = (rawTarget === 'KOTABARU' || rawTarget.includes('KOTAWARINGIN'));

    let match = preparedFeatures.find(pf => {
        const name1 = pf.name;
        const country = pf.country;
        const type2 = (pf.type2 || '').toUpperCase();
        let fIsKota = false;
        if (type2 === 'KABUPATEN') fIsKota = false;
        else if (type2 === 'KOTA') fIsKota = true;
        else fIsKota = name1.toUpperCase().startsWith('KOTA ');

        const rawF = cleanAlnum(name1);
        const stripF = cleanStripType(name1);
        const cClean = normProv(country);

        const nameMatches = (rawTarget === rawF) || (stripTarget === stripF) || (rawTarget === stripF) || (stripTarget === rawF);
        let finalNameMatch = nameMatches;
        if (!finalNameMatch) {
            const alias = ALIASES[rawTarget] || ALIASES[stripTarget];
            if (alias && (alias === rawF || alias === stripF)) {
                finalNameMatch = true;
            }
        }
        if (!finalNameMatch) return false;

        const provMatches = !cClean || !provClean || cClean === provClean || cClean.includes(provClean) || provClean.includes(cClean);
        if (!provMatches) return false;

        if (!isSpecial && type2 !== 'NA' && type2 !== '') {
            if (rIsKota !== fIsKota) return false;
        }

        return true;
    });

    return match ? match.feature : null;
}

function getTrueEnclave(r) {
    if (!r || !r.kabkota || r.kabkota.toUpperCase().startsWith('KOTA ')) return null;
    const regClean = cleanStripType(r.kabkota);
    if (!regClean) return null;
    if (TRUE_ENCLAVES[regClean]) return TRUE_ENCLAVES[regClean];

    const matchingKota = regData.find(k => k.prov === r.prov && cleanStripType(k.kabkota) === regClean && k.kabkota.toUpperCase().startsWith('KOTA '));
    if (matchingKota) {
        const fReg = findStrictGeoFeature(r);
        const fCity = findStrictGeoFeature(matchingKota);
        if (fReg && fCity) {
            const bR = getFeatureBounds(fReg);
            const bC = getFeatureBounds(fCity);
            if (bR && bC) {
                const w = bR.maxX - bR.minX;
                const h = bR.maxY - bR.minY;
                const inX = bC.cx > (bR.minX + 0.15 * w) && bC.cx < (bR.maxX - 0.15 * w);
                const inY = bC.cy > (bR.minY + 0.15 * h) && bC.cy < (bR.maxY - 0.15 * h);
                if (inX && inY) {
                    return matchingKota.kabkota.toUpperCase().startsWith('KOTA ') ? matchingKota.kabkota : 'Kota ' + matchingKota.kabkota;
                }
            }
        }
    }
    return null;
}

// Spatial fallback calculation using angular deviation scoring
function computeSpatialFallback(r, enclaveName) {
    const curFeature = findStrictGeoFeature(r);
    const southOceanProvs = ['JAWA TIMUR', 'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA BARAT', 'BANTEN', 'BALI', 'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR', 'SUMATERA BARAT', 'BENGKULU', 'LAMPUNG'];
    const northOceanProvs = ['JAWA TIMUR', 'JAWA TENGAH', 'JAWA BARAT', 'BANTEN', 'DKI JAKARTA'];

    const defaultSouth = southOceanProvs.includes(r.prov) ? 'Samudra Hindia' : (r.prov.includes('KALIMANTAN') ? 'Laut Jawa' : `Laut/Perairan Selatan Prov. ${r.prov}`);
    const defaultNorth = northOceanProvs.includes(r.prov) ? 'Laut Jawa' : `Laut/Perairan Utara Prov. ${r.prov}`;

    if (!curFeature) return { u: defaultNorth, s: defaultSouth, t: null, b: null };

    const b0 = getFeatureBounds(curFeature);
    if (!b0) return { u: defaultNorth, s: defaultSouth, t: null, b: null };

    const cleanEnclave = enclaveName ? cleanStripType(enclaveName) : null;

    const list = preparedFeatures.map(pf => {
        if (pf.feature === curFeature) return null;
        const name = pf.name;
        const type2 = pf.type2 || '';
        const fClean = cleanStripType(name);

        if (cleanEnclave && fClean === cleanEnclave) return null;

        const b = pf.bounds;
        if (!b) return null;

        const dy = b.cy - b0.cy;
        const dx = b.cx - b0.cx;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 2.5) return null;

        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const displayName = (type2 === 'Kota' || name.startsWith('Kota')) && !name.startsWith('Kota ') ? 'Kota ' + name : (name.startsWith('Kabupaten ') || name.startsWith('Kota ') ? name : 'Kabupaten ' + name);
        return { name: displayName, dist, angle };
    }).filter(Boolean);

    function getBestForAngle(targetAngle, minA, maxA) {
        const cand = list.filter(item => {
            if (targetAngle === 180 || targetAngle === -180) return item.angle >= 120 || item.angle <= -120;
            return item.angle >= minA && item.angle <= maxA;
        });
        if (cand.length === 0) return null;
        return cand.map(item => {
            let diff = Math.abs(item.angle - targetAngle);
            if (diff > 180) diff = 360 - diff;
            return { ...item, score: item.dist + (diff / 90) * 0.18 };
        }).sort((a, b) => a.score - b.score)[0];
    }

    const nBest = getBestForAngle(90, 30, 150);
    const eBest = getBestForAngle(0, -60, 60);
    const sBest = getBestForAngle(-90, -150, -30);
    const wBest = getBestForAngle(180, 120, -120);

    return {
        u: nBest ? nBest.name : defaultNorth,
        s: sBest ? sBest.name : defaultSouth,
        t: eBest ? eBest.name : (r.prov.includes('KALIMANTAN') ? 'Selat Makassar' : null),
        b: wBest ? wBest.name : null
    };
}

function computeBordersList(r) {
    const borders = [];
    const addedNames = new Set();
    const rid = String(r.id || r.no || '');

    function addBorderItem(name, type, badge) {
        if (!name || name === 'null' || name.includes('Kawasan')) return;
        let cleanN = name.trim();
        if (cleanN.startsWith('Kab. ')) cleanN = cleanN.replace(/^Kab\.\s+/i, 'Kabupaten ');
        if (cleanN.startsWith('Kota.')) cleanN = cleanN.replace(/^Kota\.\s+/i, 'Kota ');
        const key = cleanAlnum(cleanN);
        if (addedNames.has(key)) return;

        // Skip adding the main region itself as its own neighbor
        const isMainKota = (r.kabkota || '').toUpperCase().startsWith('KOTA ');
        const itemIsKota = cleanN.toUpperCase().startsWith('KOTA ');
        if (cleanStripType(cleanN) === cleanStripType(r.kabkota) && isMainKota === itemIsKota) return;

        addedNames.add(key);
        borders.push({ name: cleanN, type, badge });
    }

    // 1. Check Custom Maritime / Island Overrides First
    if (MARITIME_OVERRIDES[rid]) {
        MARITIME_OVERRIDES[rid].forEach(item => {
            addBorderItem(item.name, item.type, item.badge);
        });
        return borders;
    }

    // 2. Check Enclave
    const enclaveName = getTrueEnclave(r);
    if (enclaveName) {
        addBorderItem(enclaveName, 'enclave', 'Kota Enklave');
    }

    // 3. Strict Spatial Adjacency Check
    const curFeature = findStrictGeoFeature(r);
    if (curFeature) {
        const pfTarget = preparedFeatures.find(pf => pf.feature === curFeature);
        if (pfTarget) {
            const b0 = pfTarget.bounds;
            const list = preparedFeatures.map(pf => {
                if (pf.feature === curFeature) return null;
                const b = pf.bounds;

                // Bounding box check with buffer
                if (b0.minX - 0.04 > b.maxX || b0.maxX + 0.04 < b.minX ||
                    b0.minY - 0.04 > b.maxY || b0.maxY + 0.04 < b.minY) {
                    return null;
                }

                const dist = minCoordDistance(pfTarget.coords, pf.coords);
                // Physical boundary touching threshold
                if (dist > 0.035) return null;

                const name = pf.name;
                const isKota = (pf.type2 === 'Kota' || name.startsWith('Kota'));
                const displayName = isKota && !name.startsWith('Kota ') ? 'Kota ' + name : (name.startsWith('Kabupaten ') || name.startsWith('Kota ') ? name : 'Kabupaten ' + name);
                const isEnclave = enclaveName && cleanStripType(displayName) === cleanStripType(enclaveName);

                return {
                    name: displayName,
                    dist,
                    type: isEnclave ? 'enclave' : (isKota ? 'kota' : 'kabupaten'),
                    badge: isEnclave ? 'Kota Enklave' : (isKota ? 'Kota' : 'Kabupaten')
                };
            }).filter(Boolean).sort((a, b) => a.dist - b.dist);

            list.forEach(item => {
                addBorderItem(item.name, item.type, item.badge);
            });
        }
    }

    // 4. Add Water / Ocean bodies from BPS Text boundaries
    [r.batas_utara, r.batas_timur, r.batas_selatan, r.batas_barat].forEach(b => {
        if (!b) return;
        const clean = cleanBpsText(b);
        if (!clean) return;
        if (isWaterBodyName(clean)) {
            addBorderItem(clean, 'water', 'Perairan / Laut');
        }
    });

    // 5. Ocean fallback if coastal province
    const southOceanProvs = ['JAWA TIMUR', 'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA BARAT', 'BANTEN', 'BALI', 'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR', 'SUMATERA BARAT', 'BENGKULU', 'LAMPUNG'];
    const northOceanProvs = ['JAWA TIMUR', 'JAWA TENGAH', 'JAWA BARAT', 'BANTEN', 'DKI JAKARTA'];
    if (southOceanProvs.includes(r.prov) && (r.batas_selatan && r.batas_selatan.toUpperCase().includes('SAMUDRA') || !r.batas_selatan)) {
        if (![...addedNames].some(n => n.includes('SAMUDRA') || n.includes('LAUT'))) {
            addBorderItem('Samudra Hindia', 'water', 'Perairan / Samudra');
        }
    }
    if (northOceanProvs.includes(r.prov) && (r.batas_utara && r.batas_utara.toUpperCase().includes('LAUT') || !r.batas_utara)) {
        if (![...addedNames].some(n => n.includes('SAMUDRA') || n.includes('LAUT'))) {
            addBorderItem('Laut Jawa', 'water', 'Perairan / Laut');
        }
    }

    // 6. If region is a pemekaran child, ensure parent is included
    if (PEMEKARAN_PARENTS[rid]) {
        addBorderItem(`Kabupaten ${PEMEKARAN_PARENTS[rid]}`, 'kabupaten', 'Kabupaten');
    }

    return borders;
}

const RESULT = {};

regData.forEach(r => {
    const idKey = String(r.id || r.no);
    const override = OVERRIDES[idKey];
    const enclaveName = getTrueEnclave(r);

    let uClean = cleanBpsText(r.batas_utara);
    let sClean = cleanBpsText(r.batas_selatan);
    let tClean = cleanBpsText(r.batas_timur);
    let bClean = cleanBpsText(r.batas_barat);

    if (enclaveName) {
        const encClean = cleanStripType(enclaveName);
        if (uClean && cleanStripType(uClean) === encClean) uClean = null;
        if (sClean && cleanStripType(sClean) === encClean) sClean = null;
        if (tClean && cleanStripType(tClean) === encClean) tClean = null;
        if (bClean && cleanStripType(bClean) === encClean) bClean = null;
    }

    const spatialFallback = computeSpatialFallback(r, enclaveName);

    RESULT[idKey] = {
        name: r.kabkota,
        prov: r.prov,
        u: override ? override.u : (uClean || spatialFallback.u),
        s: override ? override.s : (sClean || spatialFallback.s),
        t: override ? override.t : (tClean || spatialFallback.t),
        b: override ? override.b : (bClean || spatialFallback.b),
        e: override ? (typeof override.e !== 'undefined' ? override.e : enclaveName) : enclaveName,
        borders: computeBordersList(r)
    };
});

// Output JSON file
fs.writeFileSync(path.join(__dirname, '..', 'data', 'geojson', 'region-boundaries.json'), JSON.stringify(RESULT, null, 2), 'utf8');

// Output JS file for zero-CORS script tag inclusion
const jsContent = `window.REGION_BOUNDARIES = ${JSON.stringify(RESULT, null, 2)};`;
fs.writeFileSync(path.join(__dirname, '..', 'assets', 'js', 'data', 'region-boundaries.js'), jsContent, 'utf8');

console.log('Successfully built region-boundaries.json & region-boundaries.js for', Object.keys(RESULT).length, 'regions.');
