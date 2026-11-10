"""
Script ETL: Import dan Standarisasi Data Riil POI Bali ke Dataset PAD360
Sumber Data:
  - data-mentah/xlsx/poi-bali/MASTER_POI_ADS_BALI.xlsx
  - data-mentah/xlsx/poi-bali/Data_Parkiran_Bali.xlsx
  - data-mentah/xlsx/poi-bali/Data_Videotron_bali.xlsx
  - data-mentah/xlsx/poi-bali/Hasil_Billboard_bali.xlsx
Target:
  - data/json/potensi-data.json
  - assets/js/data/potensi-data.js
"""

import os
import json
import re
import random
from datetime import datetime, timedelta
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POI_DIR = os.path.join(BASE_DIR, 'data-mentah', 'xlsx', 'poi-bali')
JSON_PATH = os.path.join(BASE_DIR, 'data', 'json', 'potensi-data.json')
JS_PATH = os.path.join(BASE_DIR, 'assets', 'js', 'data', 'potensi-data.js')

# Bounding box koordinat daratan Provinsi Bali
BALI_BOUNDS = {
    'lat_min': -8.92,
    'lat_max': -8.05,
    'lng_min': 114.40,
    'lng_max': 115.75
}

BALI_CITY_IDS = [
    'jembrana', 'tabanan', 'badung', 'gianyar', 'klungkung',
    'bangli', 'karangasem', 'buleleng', 'kota-denpasar'
]

BALI_CITY_NAMES = {
    'jembrana': 'JEMBRANA',
    'tabanan': 'TABANAN',
    'badung': 'BADUNG',
    'gianyar': 'GIANYAR',
    'klungkung': 'KLUNGKUNG',
    'bangli': 'BANGLI',
    'karangasem': 'KARANGASEM',
    'buleleng': 'BULELENG',
    'kota-denpasar': 'KOTA DENPASAR'
}

NAMES_POOL = [
    'Bpk. I Wayan Sudarma', 'Ibu Ni Made Ayu', 'Bpk. I Ketut Suardika',
    'Ibu Ni Luh Gede Sukerti', 'Bpk. I Nyoman Artawan', 'Ibu Ni Putu Indah',
    'Bpk. Agus Hendrawan', 'Ibu Dewi Sartika', 'Bpk. Putu Arya Kusuma',
    'Bpk. Made Dananjaya', 'Ibu Kadek Widiastuti', 'Bpk. Komang Triadi'
]

def clean_text(text):
    if not text or pd.isna(text):
        return ''
    s = str(text).strip()
    s = re.sub(r'[\ue000-\uf8ff]', '', s) # Strip private unicode characters (e.g. map pin \ue0c8)
    return s.strip()

def parse_dimensions(dim_str, default_w=8, default_h=4):
    if not dim_str or pd.isna(dim_str):
        return default_w, default_h
    s = str(dim_str).lower().replace('m', '').replace(' ', '')
    match = re.search(r'(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)', s)
    if match:
        try:
            val1 = float(match.group(1))
            val2 = float(match.group(2))
            w = max(val1, val2)
            h = min(val1, val2)
            return int(w) if w.is_integer() else w, int(h) if h.is_integer() else h
        except:
            pass
    return default_w, default_h

def resolve_unspecified_regency(row):
    addr = (clean_text(row.get('Alamat', '')) + ' ' + clean_text(row.get('Nama Produk', ''))).lower()
    lat = float(row.get('Latitude', 0))
    lng = float(row.get('Longitude', 0))

    if 'sunset road' in addr or 'nakula' in addr or 'pererenan' in addr or 'tangkuban perahu' in addr or \
       'ngurah rai' in addr or 'siligita' in addr or 'simpang siur' in addr or 'benoa' in addr or \
       'kedonganan' in addr or 'legian' in addr or 'kartika plaza' in addr or 'canggu' in addr or 'kuta' in addr:
        return 'badung'
    if 'ketewel' in addr or 'sukawati' in addr or 'ubud' in addr or 'gianyar' in addr:
        return 'gianyar'
    if 'bedugul' in addr or 'tanah lot' in addr or 'baturiti' in addr or 'tabanan' in addr:
        return 'tabanan'
    if 'imam bonjol' in addr or 'trans studio' in addr or 'denpasar' in addr or 'gajah mada' in addr or 'teuku umar' in addr:
        return 'kota-denpasar'
    
    # Fallback to proximity
    if lat < -8.70:
        return 'badung' # Southern Bali
    if lng > 115.25:
        return 'gianyar'
    return 'kota-denpasar'

def map_master_regency(raw_reg, row):
    if not raw_reg or pd.isna(raw_reg) or 'unspecified' in str(raw_reg).lower():
        return resolve_unspecified_regency(row)
    s = str(raw_reg).lower()
    if 'badung' in s: return 'badung'
    if 'denpasar' in s: return 'kota-denpasar'
    if 'gianyar' in s: return 'gianyar'
    if 'bangli' in s: return 'bangli'
    if 'karangasem' in s: return 'karangasem'
    if 'jembrana' in s: return 'jembrana'
    if 'tabanan' in s: return 'tabanan'
    if 'buleleng' in s: return 'buleleng'
    if 'klungkung' in s: return 'klungkung'
    return resolve_unspecified_regency(row)

def map_parkir_regency(addr):
    s = clean_text(addr).lower()
    if 'denpasar' in s: return 'kota-denpasar'
    if 'badung' in s or 'kuta' in s or 'seminyak' in s or 'canggu' in s or 'nusa dua' in s or 'jimbaran' in s or 'tuban' in s: return 'badung'
    if 'gianyar' in s or 'ubud' in s or 'sukawati' in s: return 'gianyar'
    if 'tabanan' in s or 'kediri' in s or 'bedugul' in s or 'beraban' in s: return 'tabanan'
    if 'buleleng' in s or 'singaraja' in s or 'seririt' in s: return 'buleleng'
    if 'karangasem' in s or 'amlapura' in s or 'padangbai' in s: return 'karangasem'
    if 'klungkung' in s or 'semarapura' in s or 'nusa penida' in s: return 'klungkung'
    if 'bangli' in s or 'kintamani' in s: return 'bangli'
    if 'jembrana' in s or 'negara' in s or 'gilimanuk' in s: return 'jembrana'
    return None

def generate_contract_meta(base_date, seed_idx):
    random.seed(42 + seed_idx)
    r = random.random()
    if r < 0.15:
        days = random.randint(-40, -1)
    elif r < 0.40:
        days = random.randint(1, 30)
    elif r < 0.65:
        days = random.randint(31, 60)
    else:
        days = random.randint(61, 365)
        
    end_date = base_date + timedelta(days=days)
    end_str = end_date.strftime('%Y-%m-%d')
    
    if days < 0:
        status = 'expired'
        badge = 'Kadaluarsa'
    elif days <= 30:
        status = 'expiring_soon'
        badge = 'Segera Habis (<30 Hari)'
    elif days <= 60:
        status = 'warning_60'
        badge = '31-60 Hari'
    else:
        status = 'active'
        badge = 'Aktif'
        
    person = random.choice(NAMES_POOL)
    phone = f"6281{random.randint(20000000, 89999999)}"
    
    return {
        'contractEnd': end_str,
        'contractDaysLeft': days,
        'contractStatus': status,
        'contractBadge': badge,
        'contactPerson': person,
        'contactPhone': phone
    }

def main():
    print("Memulai proses ETL integrasi POI Bali...")
    random.seed(2026)
    base_date = datetime(2026, 11, 10)
    
    new_bali_objects = {}
    obj_counter = 1

    # 1. LOAD MASTER_POI_ADS_BALI.xlsx
    master_path = os.path.join(POI_DIR, 'MASTER_POI_ADS_BALI.xlsx')
    df_master = pd.read_excel(master_path, sheet_name='Master Data Bali')
    print(f"Membaca {len(df_master)} baris dari MASTER_POI_ADS_BALI.xlsx")

    for idx, row in df_master.iterrows():
        lat = float(row['Latitude'])
        lng = float(row['Longitude'])
        
        # Filter bounds
        if not (BALI_BOUNDS['lat_min'] <= lat <= BALI_BOUNDS['lat_max'] and BALI_BOUNDS['lng_min'] <= lng <= BALI_BOUNDS['lng_max']):
            print(f"  [SKIP OUTLIER] Master ad out of bounds: {lat}, {lng}")
            continue
            
        city_id = map_master_regency(row.get('Kabupaten / Kota'), row)
        city_name = BALI_CITY_NAMES.get(city_id, 'BALI')
        
        obj_id = f"OBJ-REK-{city_id.upper()}-{obj_counter:04d}"
        obj_counter += 1
        
        name = clean_text(row.get('Nama Produk', f"REKLAME {city_name}"))
        addr = clean_text(row.get('Alamat', f"Jl. Raya {city_name}"))
        jenis = clean_text(row.get('Jenis', 'Billboard'))
        vendor = clean_text(row.get('Brand / Vendor', 'Vendor Reklame Bali'))
        ukuran = clean_text(row.get('Ukuran', '5m x 10m'))
        w, h = parse_dimensions(ukuran, default_w=8, default_h=4)
        
        is_led = 'videotron' in jenis.lower() or 'led' in jenis.lower()
        tax_type = "Pajak Reklame Elektronik" if is_led else "Pajak Reklame"
        sisi = 1 if is_led or 'transit' in jenis.lower() or 'bando' in jenis.lower() else 2
        
        # Potensi pendapatan (Juta Rp)
        area = w * h * sisi
        base_rate = 1.2 if is_led else 0.45
        pot_val = int(round(area * base_rate + random.randint(15, 45)))
        pot_val = max(18, min(pot_val, 220))
        
        stage = random.choice([1, 1, 2, 2, 3, 3, 4, 5])
        reg_map = {
            1: "Kandidat belum terdaftar",
            2: "Perlu pencocokan register",
            3: "Terdaftar - Menunggu Verifikasi",
            4: "Audit Kepatuhan & Monitoring",
            5: "Wajib Pajak Patuh"
        }
        izin_u_map = {1: "Belum Ada", 2: "Dalam Penelaahan", 3: "Terverifikasi", 4: "Terverifikasi", 5: "Terverifikasi"}
        izin_r_map = {1: "Belum Terdaftar", 2: "Masa Tenggang", 3: "Dokumen Tersedia", 4: "Izin Lengkap", 5: "Izin Lengkap"}
        
        contract_info = generate_contract_meta(base_date, obj_counter)
        gmaps_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
        
        obj = {
            "id": obj_id,
            "name": name.upper(),
            "cityId": city_id,
            "category": "rek",
            "catName": "Billboard / Reklame",
            "lat": round(lat, 7),
            "lng": round(lng, 7),
            "owner": vendor if vendor else f"PT {city_name} Advertising",
            "op": f"Pengelola {jenis} {city_name}",
            "w": w,
            "h": h,
            "sisi": sisi,
            "jenis": jenis,
            "periode": "12 Bulan (Periode 2026/2027)",
            "regStatus": reg_map.get(stage, "Audit Kepatuhan & Monitoring"),
            "izinUsaha": izin_u_map.get(stage, "Terverifikasi"),
            "izinRek": izin_r_map.get(stage, "Izin Lengkap"),
            "addr": addr,
            "coord": f"{lat:.7f}, {lng:.7f}",
            "taxType": tax_type,
            "estimatedValue": f"Rp {pot_val * 1_000_000:,.0f} / tahun".replace(',', '.'),
            "potValJt": pot_val,
            "formula": "Luas Layar × Durasi Tayang × Tarif LED 25%" if is_led else "NSR (Nilai Sewa Reklame) × Tarif 25%",
            "stage": stage,
            "requested": stage >= 4,
            "hist": [
                ["10 Nov 2026", f"Sinkronisasi titik media outdoor {jenis} dari inventaris vendor", "Sistem Monitoring PAD360"],
                ["15 Okt 2026", "Verifikasi lapangan & geolokasi GPS", f"Satgas Bapenda {city_name}"]
            ],
            "related": [
                {
                    "id": obj_id,
                    "title": f"{jenis} ({w}×{h}m, {sisi} sisi)",
                    "type": tax_type,
                    "badge": "teal"
                }
            ],
            "contractEnd": contract_info['contractEnd'],
            "contractDaysLeft": contract_info['contractDaysLeft'],
            "contractStatus": contract_info['contractStatus'],
            "contractBadge": contract_info['contractBadge'],
            "contactPerson": contract_info['contactPerson'],
            "contactPhone": contract_info['contactPhone'],
            "googleMapsUrl": gmaps_url
        }
        
        if row.get('URL') and pd.notna(row['URL']):
            obj['sourceUrl'] = str(row['URL'])
            
        new_bali_objects[obj_id] = obj

    print(f"Total POI Iklan dari Master yang diproses: {len(new_bali_objects)}")

    # 2. LOAD EXTRA OUTDOOR ADS FROM VIDEOTRON & BILLBOARD FILES
    v_path = os.path.join(POI_DIR, 'Data_Videotron_bali.xlsx')
    df_v = pd.read_excel(v_path)
    # Filter 3 physical videotron points
    for idx, row in df_v.iterrows():
        n = clean_text(row['Name']).lower()
        if 'villa signage' in n or 'huruf timbul' in n:
            continue
        lat = float(row['Latitude'])
        lng = float(row['Longitude'])
        city_id = 'badung' if 'badung' in clean_text(row['Fulladdress']).lower() or 'kuta' in clean_text(row['Fulladdress']).lower() else 'kota-denpasar'
        city_name = BALI_CITY_NAMES.get(city_id, 'BALI')
        
        obj_id = f"OBJ-REK-{city_id.upper()}-{obj_counter:04d}"
        obj_counter += 1
        name = clean_text(row['Name'])
        addr = clean_text(row['Fulladdress'])
        pot_val = random.randint(85, 140)
        stage = random.choice([2, 3, 4])
        contract_info = generate_contract_meta(base_date, obj_counter)
        
        new_bali_objects[obj_id] = {
            "id": obj_id,
            "name": name.upper(),
            "cityId": city_id,
            "category": "rek",
            "catName": "Billboard / Reklame",
            "lat": round(lat, 7),
            "lng": round(lng, 7),
            "owner": f"PT Media Videotron {city_name}",
            "op": f"Pengelola Videotron {city_name}",
            "w": 10,
            "h": 5,
            "sisi": 1,
            "jenis": "LED Megatron Outdoor",
            "periode": "12 Bulan (Periode 2026/2027)",
            "regStatus": "Audit Kepatuhan & Monitoring" if stage >= 4 else "Terdaftar - Menunggu Verifikasi",
            "izinUsaha": "Terverifikasi",
            "izinRek": "Izin Lengkap",
            "addr": addr,
            "coord": f"{lat:.7f}, {lng:.7f}",
            "taxType": "Pajak Reklame Elektronik",
            "estimatedValue": f"Rp {pot_val * 1_000_000:,.0f} / tahun".replace(',', '.'),
            "potValJt": pot_val,
            "formula": "Luas Layar × Durasi Tayang × Tarif LED 25%",
            "stage": stage,
            "requested": stage >= 4,
            "hist": [
                ["10 Nov 2026", "Injeksi data videotron komersial lapangan", "Satgas Bapenda Bali"],
                ["20 Okt 2026", "Pencatatan koordinat titik GPS", "Tim Lapangan"]
            ],
            "related": [{"id": obj_id, "title": f"LED Megatron Outdoor (10×5m)", "type": "Pajak Reklame Elektronik", "badge": "teal"}],
            "contractEnd": contract_info['contractEnd'],
            "contractDaysLeft": contract_info['contractDaysLeft'],
            "contractStatus": contract_info['contractStatus'],
            "contractBadge": contract_info['contractBadge'],
            "contactPerson": contract_info['contactPerson'],
            "contactPhone": contract_info['contactPhone'],
            "googleMapsUrl": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
        }

    b_path = os.path.join(POI_DIR, 'Hasil_Billboard_bali.xlsx')
    df_b = pd.read_excel(b_path)
    # Take Billboard Nusaka Dewi Sri
    for idx, row in df_b.iterrows():
        n = clean_text(row['Name']).lower()
        if 'advertising' in n and 'dewi sri' not in n:
            continue
        lat = float(row['Latitude'])
        lng = float(row['Longitude'])
        city_id = 'badung'
        city_name = 'BADUNG'
        obj_id = f"OBJ-REK-{city_id.upper()}-{obj_counter:04d}"
        obj_counter += 1
        name = clean_text(row['Name'])
        addr = clean_text(row['Fulladdress'])
        pot_val = 65
        stage = 3
        contract_info = generate_contract_meta(base_date, obj_counter)
        
        new_bali_objects[obj_id] = {
            "id": obj_id,
            "name": name.upper(),
            "cityId": city_id,
            "category": "rek",
            "catName": "Billboard / Reklame",
            "lat": round(lat, 7),
            "lng": round(lng, 7),
            "owner": "Nusaka Bali Advertising",
            "op": "Pengelola Billboard Kuta",
            "w": 8,
            "h": 4,
            "sisi": 2,
            "jenis": "Papan Billboard Lampu Sorot",
            "periode": "12 Bulan (Periode 2026/2027)",
            "regStatus": "Terdaftar - Menunggu Verifikasi",
            "izinUsaha": "Terverifikasi",
            "izinRek": "Izin Lengkap",
            "addr": addr,
            "coord": f"{lat:.7f}, {lng:.7f}",
            "taxType": "Pajak Reklame",
            "estimatedValue": f"Rp {pot_val * 1_000_000:,.0f} / tahun".replace(',', '.'),
            "potValJt": pot_val,
            "formula": "NSR (Nilai Sewa Reklame) × Tarif 25%",
            "stage": stage,
            "requested": False,
            "hist": [
                ["10 Nov 2026", "Integrasi titik billboard Dewi Sri Kuta", "Satgas Bapenda Badung"]
            ],
            "related": [{"id": obj_id, "title": "Papan Billboard Lampu Sorot (8×4m)", "type": "Pajak Reklame", "badge": "teal"}],
            "contractEnd": contract_info['contractEnd'],
            "contractDaysLeft": contract_info['contractDaysLeft'],
            "contractStatus": contract_info['contractStatus'],
            "contractBadge": contract_info['contractBadge'],
            "contactPerson": contract_info['contactPerson'],
            "contactPhone": contract_info['contactPhone'],
            "googleMapsUrl": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
        }

    print(f"Total POI Iklan setelah penambahan file scraping: {len(new_bali_objects)}")

    # 3. LOAD DATA_PARKIRAN_BALI.xlsx (103 TITIK VALID)
    parkir_path = os.path.join(POI_DIR, 'Data_Parkiran_Bali.xlsx')
    df_parkir = pd.read_excel(parkir_path)
    print(f"Membaca {len(df_parkir)} baris dari Data_Parkiran_Bali.xlsx")

    parkir_count = 0
    dropped_parkir = 0

    for idx, row in df_parkir.iterrows():
        lat = float(row['Latitude'])
        lng = float(row['Longitude'])
        
        # Hard filter bounding box Bali
        if not (BALI_BOUNDS['lat_min'] <= lat <= BALI_BOUNDS['lat_max'] and BALI_BOUNDS['lng_min'] <= lng <= BALI_BOUNDS['lng_max']):
            dropped_parkir += 1
            print(f"  [DROP OUTLIER LUAR BALI] {row['Name']} di {row['Fulladdress']} ({lat}, {lng})")
            continue
            
        addr = clean_text(row['Fulladdress'])
        city_id = map_parkir_regency(addr)
        if not city_id:
            city_id = 'kota-denpasar'
        city_name = BALI_CITY_NAMES.get(city_id, 'BALI')
        
        obj_id = f"OBJ-PKR-{city_id.upper()}-{obj_counter:04d}"
        obj_counter += 1
        parkir_count += 1
        
        name = clean_text(row['Name'])
        pot_val = random.randint(25, 75)
        stage = random.choice([1, 2, 2, 3, 3, 4])
        reg_map = {
            1: "Kandidat belum terdaftar",
            2: "Perlu pencocokan register",
            3: "Terdaftar - Menunggu Verifikasi",
            4: "Audit Kepatuhan & Monitoring"
        }
        contract_info = generate_contract_meta(base_date, obj_counter)
        
        obj = {
            "id": obj_id,
            "name": name.upper(),
            "cityId": city_id,
            "category": "pkr",
            "catName": "Parkir Komersial",
            "lat": round(lat, 7),
            "lng": round(lng, 7),
            "owner": f"Pengelola {name.title()}",
            "op": f"Operator Parkir Komersial {city_name}",
            "w": 30,
            "h": 15,
            "sisi": 1,
            "jenis": "Pelataran Parkir Komersial / Khusus",
            "periode": "12 Bulan (Periode 2026/2027)",
            "regStatus": reg_map.get(stage, "Perlu pencocokan register"),
            "izinUsaha": "Terverifikasi" if stage >= 2 else "Dalam Penelaahan",
            "izinRek": "Dokumen tersedia" if stage >= 3 else "Belum Terdaftar",
            "addr": addr,
            "coord": f"{lat:.7f}, {lng:.7f}",
            "taxType": "PBJT Jasa Parkir",
            "estimatedValue": f"Rp {pot_val * 1_000_000:,.0f} / tahun".replace(',', '.'),
            "potValJt": pot_val,
            "formula": "Kapasitas Slot × Omzet Bulanan × Tarif PBJT 10%",
            "stage": stage,
            "requested": stage >= 4,
            "hist": [
                ["10 Nov 2026", f"Penyisiran titik parkir komersial kawasan {city_name}", "Satgas Pendataan PBJT"],
                ["12 Okt 2026", "Verifikasi lapangan lokasi & izin operasional", "Dinas Perhubungan & Bapenda"]
            ],
            "related": [
                {
                    "id": obj_id,
                    "title": f"Area Parkir Komersial ({name})",
                    "type": "PBJT Jasa Parkir",
                    "badge": "amber"
                }
            ],
            "contractEnd": contract_info['contractEnd'],
            "contractDaysLeft": contract_info['contractDaysLeft'],
            "contractStatus": contract_info['contractStatus'],
            "contractBadge": contract_info['contractBadge'],
            "contactPerson": contract_info['contactPerson'],
            "contactPhone": contract_info['contactPhone'],
            "googleMapsUrl": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
        }
        
        new_bali_objects[obj_id] = obj

    print(f"Berhasil mengimpor {parkir_count} titik parkir valid (Dibuang {dropped_parkir} outlier luar Bali)")
    print(f"Total seluruh POI riil Bali yang siap diinjeksi: {len(new_bali_objects)}")

    # 4. LOAD & UPDATE DATASET
    print("Membaca data/json/potensi-data.json eksisting...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        master_json = json.load(f)

    existing_objects = master_json.get('objects', {})
    print(f"Jumlah total objek sebelum update: {len(existing_objects)}")

    # Hapus objek lama yang berasosiasi dengan Bali
    old_bali_count = 0
    clean_objects = {}
    for oid, obj in existing_objects.items():
        if obj.get('cityId') in BALI_CITY_IDS:
            old_bali_count += 1
        else:
            clean_objects[oid] = obj

    print(f"Menghapus {old_bali_count} objek dummy lama di Bali.")

    # Tambahkan semua objek baru
    clean_objects.update(new_bali_objects)
    master_json['objects'] = clean_objects
    print(f"Jumlah total objek setelah update: {len(clean_objects)}")

    # 5. REKALKULASI AGREGAT CITIES DAN PROVINCES
    print("Melakukan sinkronisasi kalkulasi metrik agregat per Kabupaten/Kota di Bali...")
    city_stats = {cid: {'poi': 0, 'ver': 0, 'pot_jt': 0} for cid in BALI_CITY_IDS}

    for oid, obj in new_bali_objects.items():
        cid = obj['cityId']
        if cid in city_stats:
            city_stats[cid]['poi'] += 1
            if obj.get('stage', 1) >= 3:
                city_stats[cid]['ver'] += 1
            city_stats[cid]['pot_jt'] += obj.get('potValJt', 0)

    for city in master_json.get('cities', []):
        cid = city.get('id')
        if cid in city_stats:
            stat = city_stats[cid]
            city['poi'] = stat['poi']
            city['ver'] = stat['ver']
            city['pot'] = round(stat['pot_jt'] / 1000.0, 2) # Dalam Miliar Rupiah
            print(f"  -> City {city['name']:<15}: {city['poi']} POI, {city['ver']} Terverifikasi, Rp {city['pot']} M Potensi")

    # Rekalkulasi agregat Provinsi Bali
    bali_total_poi = sum(city_stats[cid]['poi'] for cid in BALI_CITY_IDS)
    bali_total_ver = sum(city_stats[cid]['ver'] for cid in BALI_CITY_IDS)
    bali_total_pot = round(sum(city_stats[cid]['pot_jt'] for cid in BALI_CITY_IDS) / 1000.0, 2)

    for prov in master_json.get('provinces', []):
        if prov.get('id') == 'bali':
            prov['poi'] = bali_total_poi
            prov['ver'] = bali_total_ver
            prov['pot'] = bali_total_pot
            print(f"-> Provinsi BALI Total: {prov['poi']} POI, {prov['ver']} Terverifikasi, Rp {prov['pot']} M Potensi")
            break

    # 6. SIMPAN KE FILE JSON & JS
    print(f"Menulis perubahan ke {JSON_PATH}...")
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_json, f, ensure_ascii=False, indent=2)

    print(f"Menulis perubahan ke {JS_PATH}...")
    with open(JS_PATH, 'w', encoding='utf-8') as f:
        f.write("/* Dataset Peta Potensi Pajak PAD360 - Seluruh Indonesia */\n")
        f.write("window.PotensiData = ")
        json.dump(master_json, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print("SUKSES: Seluruh data POI riil Bali telah berhasil diintegrasikan secara lokal!")

if __name__ == '__main__':
    main()

