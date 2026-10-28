"""
Generator Data Kualitas Infrastruktur Jalan Kabupaten/Kota di Indonesia (BPS & KemenPUPR)
Menghasilkan:
- assets/js/data/jalan-data.js (window.JALAN_DATA)
- data/json/jalan-data.json

Variabel:
- id / no / kabkota / prov
- panjang_total_km: total panjang jalan kewenangan kab/kota
- kondisi_baik_km: panjang jalan kondisi baik (km)
- kondisi_sedang_km: panjang jalan kondisi sedang (km)
- kondisi_rusak_km: panjang jalan kondisi rusak (km)
- persen_baik, persen_sedang, persen_rusak (total 100%)
- tingkat_kemantapan: (baik + sedang) / total * 100
"""

import json
import os
import hashlib

base_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(base_dir, '..'))
data_json_path = os.path.join(root_dir, 'data', 'json', 'data.json')
output_json_path = os.path.join(root_dir, 'data', 'json', 'jalan-data.json')
output_js_path = os.path.join(root_dir, 'assets', 'js', 'data', 'jalan-data.js')

with open(data_json_path, 'r', encoding='utf-8') as f:
    region_list = json.load(f)

print(f"Loaded {len(region_list)} regions from {data_json_path}")

jalan_dict = {}

for r in region_list:
    reg_id = str(r.get('id') or r.get('no'))
    kabkota = r.get('kabkota', '')
    prov = r.get('prov', '')
    luas = float(r.get('luas') or 1000)
    total_desa = int(r.get('total_desa') or 50)
    
    # Deterministik pseudo-random berdasarkan hash id
    h = hashlib.md5(f"{reg_id}_{kabkota}_{prov}".encode('utf-8')).hexdigest()
    val_norm1 = int(h[:4], 16) / 65535.0
    val_norm2 = int(h[4:8], 16) / 65535.0
    val_norm3 = int(h[8:12], 16) / 65535.0
    
    is_kota = 'KOTA' in kabkota.upper() and 'KABUPATEN' not in kabkota.upper()
    is_jawa_bali = any(p in prov.upper() for p in ['JAWA', 'JAKARTA', 'BANTEN', 'YOGYAKARTA', 'BALI'])
    
    # Base panjang total jalan kabupaten (km)
    if is_kota:
        base_len = 220 + (total_desa * 4.2) + (val_norm1 * 180)
    else:
        # Kabupaten: proporsional terhadap luas dan jumlah desa
        base_len = 380 + (total_desa * 2.1) + ((luas ** 0.38) * 45) + (val_norm1 * 320)
    
    total_km = round(base_len, 1)
    
    # Proporsi kondisi jalan: Baik, Sedang, Rusak
    if is_jawa_bali and is_kota:
        # Kota di Jawa/Bali: infrastruktur mantap sangat tinggi
        p_baik = 0.65 + (val_norm2 * 0.18) # 65% - 83%
        p_sedang = 0.12 + (val_norm3 * 0.12) # 12% - 24%
    elif is_jawa_bali and not is_kota:
        # Kabupaten di Jawa/Bali
        p_baik = 0.52 + (val_norm2 * 0.18) # 52% - 70%
        p_sedang = 0.18 + (val_norm3 * 0.12) # 18% - 30%
    elif not is_jawa_bali and is_kota:
        # Kota luar Jawa
        p_baik = 0.55 + (val_norm2 * 0.18) # 55% - 73%
        p_sedang = 0.18 + (val_norm3 * 0.12) # 18% - 30%
    else:
        # Kabupaten luar Jawa (Kalimantan, Sumatera, Sulawesi, Papua, dll.)
        p_baik = 0.36 + (val_norm2 * 0.22) # 36% - 58%
        p_sedang = 0.22 + (val_norm3 * 0.14) # 22% - 36%
        
    p_rusak = max(0.05, 1.0 - (p_baik + p_sedang))
    # Normalisasi agar pas 100%
    sum_p = p_baik + p_sedang + p_rusak
    p_baik = p_baik / sum_p
    p_sedang = p_sedang / sum_p
    p_rusak = p_rusak / sum_p
    
    baik_km = round(total_km * p_baik, 1)
    sedang_km = round(total_km * p_sedang, 1)
    rusak_km = round(total_km - baik_km - sedang_km, 1)
    if rusak_km < 0:
        rusak_km = 0.0
        
    pct_baik = round((baik_km / total_km) * 100, 1)
    pct_sedang = round((sedang_km / total_km) * 100, 1)
    pct_rusak = round(100.0 - pct_baik - pct_sedang, 1)
    mantap_pct = round(pct_baik + pct_sedang, 1)
    
    # Kategori insight interpretasi
    if pct_baik >= 60.0:
        insight = "Kondisi jalan berkategori Baik mendominasi wilayah ini (>=60%), mengindikasikan konektivitas mantap yang sangat memadai untuk mobilitas angkutan komersial dan kelancaran rantai pasok industri."
        status_kategori = "Mantap Unggul"
    elif pct_rusak >= 30.0:
        insight = "Proporsi jalan rusak tergolong signifikan (>=30%), memerlukan prioritas alokasi pemeliharaan berkala dan peningkatan struktur perkerasan jalan guna mengatasi hambatan logistik komoditas."
        status_kategori = "Butuh Penanganan Prioritas"
    else:
        insight = "Kualitas jalan didominasi perpaduan kondisi Baik dan Sedang. Perlu pengawasan rutin pada ruas kondisi Sedang agar tidak terdegradasi menjadi rusak saat curah hujan tinggi."
        status_kategori = "Cukup Mantap"
        
    jalan_dict[reg_id] = {
        "id": reg_id,
        "kabkota": kabkota,
        "prov": prov,
        "panjang_total_km": total_km,
        "kondisi_baik_km": baik_km,
        "kondisi_sedang_km": sedang_km,
        "kondisi_rusak_km": rusak_km,
        "persen_baik": pct_baik,
        "persen_sedang": pct_sedang,
        "persen_rusak": pct_rusak,
        "persen_mantap": mantap_pct,
        "status_kategori": status_kategori,
        "insight": insight,
        "sumber": "BPS / Kementerian PUPR (Statistik Transportasi Darat) — Data Indikatif Mockup"
    }

# Save JSON
with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(jalan_dict, f, indent=2, ensure_ascii=False)

# Save JS Global
with open(output_js_path, 'w', encoding='utf-8') as f:
    f.write("window.JALAN_DATA = ")
    json.dump(jalan_dict, f, indent=2, ensure_ascii=False)
    f.write(";\n")

print(f"Successfully generated road quality data for {len(jalan_dict)} regions.")
print(f"- JSON: {output_json_path}")
print(f"- JS: {output_js_path}")
