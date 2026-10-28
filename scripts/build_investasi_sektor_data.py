"""
Builder Dataset Realisasi Investasi Berdasarkan Sektor Usaha (BKPM 2025)
Sumber: Kementerian Investasi dan Hilirisasi / BKPM RI
Output:
- assets/js/data/investasi-sektor-data.js (window.INVESTASI_SEKTOR_DATA)
- data/json/investasi-sektor-data.json
"""

import csv
import json
import os
import re

base_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(base_dir, '..'))
csv_path = os.path.join(root_dir, 'data-mentah', 'bkpm', 'Nilai_PMA_dan_PMDN_Tahun_2025.csv')
data_json_path = os.path.join(root_dir, 'data', 'json', 'data.json')
output_json_path = os.path.join(root_dir, 'data', 'json', 'investasi-sektor-data.json')
output_js_path = os.path.join(root_dir, 'assets', 'js', 'data', 'investasi-sektor-data.js')

# Load 514 regional master data
with open(data_json_path, 'r', encoding='utf-8') as f:
    master_regions = json.load(f)

def clean_key(s):
    if not s:
        return ""
    s = str(s).lower()
    s = re.sub(r'^(kabupaten|kab\.|kota|provinsi|prov\.)\s*', '', s)
    s = s.replace('kab.', '').replace('kota', '').replace('kabupaten', '')
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

# Mapping ID & Master
region_by_key = {}
for r in master_regions:
    reg_id = str(r.get('id') or r.get('no'))
    k = clean_key(r.get('kabkota', ''))
    p = clean_key(r.get('prov', ''))
    region_by_key[(p, k)] = reg_id
    region_by_key[k] = reg_id

# 23 Sektor BKPM standard list
SECTOR_SHORT_NAMES = {
    'Hotel dan Restoran': 'Hotel & Resto',
    'Industri  Mesin, Elektronik, Instrumen Kedokteran, Peralatan Listrik, Presisi, Optik dan Jam': 'Mesin & Elektronik',
    'Industri Barang dari Kulit dan Alas Kaki': 'Kulit & Alas Kaki',
    'Industri Karet dan Plastik': 'Karet & Plastik',
    'Industri Kayu': 'Industri Kayu',
    'Industri Kendaraan Bermotor dan Alat Transportasi Lain': 'Otomotif & Transpor',
    'Industri Kertas dan Percetakan': 'Kertas & Percetakan',
    'Industri Kimia Dan Farmasi': 'Kimia & Farmasi',
    'Industri Lainnya': 'Industri Lainnya',
    'Industri Logam Dasar, Barang Logam, Bukan Mesin dan Peralatannya': 'Logam Dasar',
    'Industri Makanan': 'Industri Makanan',
    'Industri Mineral Non Logam': 'Mineral Non Logam',
    'Industri Tekstil': 'Industri Tekstil',
    'Jasa Lainnya': 'Jasa Lainnya',
    'Kehutanan': 'Kehutanan',
    'Konstruksi': 'Konstruksi',
    'Listrik, Gas dan Air': 'Listrik, Gas, Air',
    'Perdagangan dan Reparasi': 'Perdagangan & Reparasi',
    'Perikanan': 'Perikanan',
    'Pertambangan': 'Pertambangan',
    'Perumahan, Kawasan Industri dan Perkantoran': 'Properti & Kawasan',
    'Tanaman Pangan, Perkebunan, dan Peternakan': 'Perkebunan & Pangan',
    'Transportasi, Gudang dan Telekomunikasi': 'Transpor & Gudang'
}

print(f"Reading CSV from {csv_path}...")

# Aggregation: data[prov][kab][sektor] = {'pma': 0.0, 'pmdn': 0.0, 'count': 0}
aggregated = {}
prov_list = set()
kab_by_prov = {}

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        prov = (row.get('Provinsi') or '').strip()
        kab = (row.get('Kab/Kot') or '').strip()
        sektor = (row.get('Sektor Usaha') or '').strip()
        status_pm = (row.get('Status PM') or '').strip().upper()
        
        try:
            val_triliun = float(row.get('Nilai Investasi Rp Triliun') or 0.0)
        except ValueError:
            val_triliun = 0.0
            
        # Convert Triliun to Rupiah: * 10^12
        val_rp = val_triliun * 1_000_000_000_000.0
        
        if not prov or not kab:
            continue
            
        prov_list.add(prov)
        if prov not in kab_by_prov:
            kab_by_prov[prov] = set()
        kab_by_prov[prov].add(kab)
        
        if prov not in aggregated:
            aggregated[prov] = {}
        if kab not in aggregated[prov]:
            aggregated[prov][kab] = {}
        if sektor not in aggregated[prov][kab]:
            aggregated[prov][kab][sektor] = {'pma': 0.0, 'pmdn': 0.0, 'records': 0}
            
        if status_pm == 'PMA':
            aggregated[prov][kab][sektor]['pma'] += val_rp
        else:
            aggregated[prov][kab][sektor]['pmdn'] += val_rp
            
        aggregated[prov][kab][sektor]['records'] += 1

print(f"Aggregated {len(prov_list)} provinces, {sum(len(v) for v in kab_by_prov.values())} kab/kota.")

# Build Final Structure
final_data = {
    "provinces": sorted(list(prov_list)),
    "kab_by_prov": {p: sorted(list(kabs)) for p, kabs in kab_by_prov.items()},
    "data_by_region": {}, # key: prov_kab lowercase
    "data_by_id": {} # key: reg_id
}

for prov, kabs in aggregated.items():
    p_clean = clean_key(prov)
    for kab, sektors in kabs.items():
        k_clean = clean_key(kab)
        
        # Build sector list
        sektor_items = []
        tot_pma = 0.0
        tot_pmdn = 0.0
        
        for s_name, s_data in sektors.items():
            pma = round(s_data['pma'], 2)
            pmdn = round(s_data['pmdn'], 2)
            tot = round(pma + pmdn, 2)
            tot_pma += pma
            tot_pmdn += pmdn
            
            sektor_items.append({
                "sektor": s_name,
                "short_sektor": SECTOR_SHORT_NAMES.get(s_name, s_name[:18]),
                "pma_rp": pma,
                "pmdn_rp": pmdn,
                "total_rp": tot,
                "has_data": s_data['records'] > 0
            })
            
        # Sort sectors by total_rp descending
        sektor_items.sort(key=lambda x: x['total_rp'], reverse=True)
        
        tot_investasi = round(tot_pma + tot_pmdn, 2)
        top_s = sektor_items[0] if sektor_items else None
        active_count = sum(1 for s in sektor_items if s['total_rp'] > 0)
        
        item_obj = {
            "provinsi": prov,
            "kabupaten": kab,
            "sektor_items": sektor_items,
            "summary": {
                "total_pma_rp": tot_pma,
                "total_pmdn_rp": tot_pmdn,
                "total_investasi_rp": tot_investasi,
                "sektor_tertinggi": top_s['sektor'] if top_s else "–",
                "nilai_tertinggi": top_s['total_rp'] if top_s else 0,
                "jumlah_sektor_tampil": len(sektor_items),
                "jumlah_sektor_aktif": active_count
            }
        }
        
        reg_key = f"{p_clean}_{k_clean}"
        final_data["data_by_region"][reg_key] = item_obj
        
        # Match with master reg_id
        matched_id = region_by_key.get((p_clean, k_clean)) or region_by_key.get(k_clean)
        if matched_id:
            final_data["data_by_id"][str(matched_id)] = item_obj

print(f"Total mapped to ID: {len(final_data['data_by_id'])} regions.")

# Write JSON
with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(final_data, f, indent=2, ensure_ascii=False)

# Write JS
with open(output_js_path, 'w', encoding='utf-8') as f:
    f.write("window.INVESTASI_SEKTOR_DATA = ")
    json.dump(final_data, f, ensure_ascii=False)
    f.write(";\n")

print(f"Files written:")
print(f"- {output_json_path}")
print(f"- {output_js_path}")
