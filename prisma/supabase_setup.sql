-- ====================================================================
-- SCRIPT INITIALIZATION DATABASE SIDDEEQ CYCLE WORKS (SUPABASE)
-- Jalankan skrip ini langsung di menu SQL Editor Supabase Anda.
-- ====================================================================

-- 1. Pembuatan Tabel 'users' (Data Karyawan & Autentikasi)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'KASIR', -- KASIR, ADMIN_AKUNTANSI, MANAJER_OWNER
    is_email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(50),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pembuatan Tabel 'products' (Data Inventaris Produk & Sparepart)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    purchase_price NUMERIC(15, 2) NOT NULL,
    sale_price NUMERIC(15, 2) NOT NULL,
    stock_qty INT NOT NULL
);

-- 3. Pembuatan Tabel 'transactions' (Log Transaksi POS Kasir)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- TUNAI, MURABAHAH, QRIS, TRANSFER
    customer_phone VARCHAR(50),
    transfer_reference VARCHAR(255),
    digital_signature TEXT, -- Menyimpan data URL base64 tanda tangan akad
    items JSONB NOT NULL -- Menyimpan array item belanja secara terstruktur
);

-- ====================================================================
-- PENGATURAN HAK AKSES (Row Level Security / RLS)
-- Matikan RLS agar Anon API Key dapat langsung membaca & menulis data.
-- ====================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PENGISIAN DATA DUMMY AWAL (SEEDING)
-- ====================================================================

-- Hapus data lama untuk mencegah duplikasi jika dijalankan ulang
TRUNCATE TABLE users, products, transactions RESTART IDENTITY;

-- Seed Data Pengguna (Karyawan & Manajer Default)
INSERT INTO users (username, email, password_hash, role, is_email_verified)
VALUES 
(
  'admin', 
  'admin@siddeeqcycle.com', 
  '7b8f2693ca20004fb1e8a75c1608b7e2:4f7dd8137113eb848b8c68a0210e17fc9ca19f3759b7aa2ab4437a4b294fc45466791746a9a5bf12196bcb22b1b30f8a52d19123fb3b831483424a7e91f671c2', 
  'MANAJER_OWNER', 
  TRUE
),
(
  'Galih', 
  'galih@siddeeqcycleworks.com', 
  'bb61c89ddcadda8bf0c13d2737db97e3:6f9aee5d9e2f69605ceec9d46158bb454249fd9ae0c648be039170ca3c85dd2f3f2b0099aef45c58d3683c673dbd09570551326cdfc67be087c29648725fd59f', 
  'MANAJER_OWNER', 
  TRUE
);

-- Seed Data Produk Sparepart & Unit Sepeda
INSERT INTO products (sku, name, purchase_price, sale_price, stock_qty)
VALUES 
-- Spareparts
('SC-BAN-001', 'Ban Luar Swallow Gravel 700x38c', 120000.00, 175000.00, 15),
('SC-RAN-002', 'Rantai Shimano HG-54 10 Speed', 180000.00, 240000.00, 8),
('SC-BRA-003', 'Kampas Rem Hidrolik Shimano B01S', 45000.00, 75000.00, 22),
('SC-CRK-004', 'Crankset Litepro Hollowtech II', 350000.00, 490000.00, 3),

-- Unit Sepeda (Bicycle Units)
('SC-BYC-005', 'Sepeda Gravel Polygon Bend R2', 8500000.00, 11000000.00, 4),
('SC-BYC-006', 'Sepeda Lipat United Trifold 3S Single Speed', 3200000.00, 4100000.00, 5),
('SC-BYC-007', 'Sepeda MTB Genio M-341 XC 27.5', 1500000.00, 2100000.00, 6);

-- Seed Data Transaksi Lama (Restore dari mock_sales_db.json)
INSERT INTO transactions (id, invoice_number, transaction_date, total_amount, payment_method, customer_phone, transfer_reference, digital_signature, items)
VALUES
(1, 'INV/20260517/0001', '2026-05-17 10:00:00+00', 175000.00, 'TUNAI', '08123456789', NULL, NULL, '[{"productId": 1, "productName": "Ban Luar Swallow Gravel 700x38c", "sku": "SC-BAN-001", "qty": 1, "price": 175000}]'::jsonb),
(2, 'INV/20260518/0001', '2026-05-18 14:20:00+00', 240000.00, 'MURABAHAH', '08571234567', NULL, 'mock_signature_data_url', '[{"productId": 2, "productName": "Rantai Shimano HG-54 10 Speed", "sku": "SC-RAN-002", "qty": 1, "price": 240000}]'::jsonb),
(3, 'INV/20260519/0001', '2026-05-19 09:15:00+00', 75000.00, 'TUNAI', '08129999888', NULL, NULL, '[{"productId": 3, "productName": "Kampas Rem Hidrolik Shimano B01S", "sku": "SC-BRA-003", "qty": 1, "price": 75000}]'::jsonb),
(4, 'INV/20260520/0001', '2026-05-20 11:45:00+00', 490000.00, 'TUNAI', '08781234567', NULL, NULL, '[{"productId": 4, "productName": "Crankset Litepro Hollowtech II", "sku": "SC-CRK-004", "qty": 1, "price": 490000}]'::jsonb),
(5, 'INV/20260521/0001', '2026-05-21 16:30:00+00', 175000.00, 'MURABAHAH', '08111222333', NULL, 'mock_signature_data_url', '[{"productId": 1, "productName": "Ban Luar Swallow Gravel 700x38c", "sku": "SC-BAN-001", "qty": 1, "price": 175000}]'::jsonb),
(6, 'INV/20260522/0001', '2026-05-22 13:00:00+00', 150000.00, 'TUNAI', '08122334455', NULL, NULL, '[{"productId": 3, "productName": "Kampas Rem Hidrolik Shimano B01S", "sku": "SC-BRA-003", "qty": 2, "price": 75000}]'::jsonb),
(7, 'INV/20260523/0001', '2026-05-23 08:00:00+00', 175000.00, 'TUNAI', '08133445566', NULL, NULL, '[{"productId": 1, "productName": "Ban Luar Swallow Gravel 700x38c", "sku": "SC-BAN-001", "qty": 1, "price": 175000}]'::jsonb),
(8, 'INV/20260605/3592', '2026-06-05 13:58:25.297+00', 350000.00, 'TRANSFER', '082114534671', 'BSI 1234567891 Galih', NULL, '[{"productId": 1, "productName": "Ban Luar Swallow Gravel 700x38c", "sku": "SC-BAN-001", "qty": 2, "price": 175000}]'::jsonb),
(9, 'INV/20260605/8706', '2026-06-05 15:44:24.804+00', 240000.00, 'TUNAI', '082114534671', NULL, NULL, '[{"productId": 2, "productName": "Rantai Shimano HG-54 10 Speed", "sku": "SC-RAN-002", "qty": 1, "price": 240000}]'::jsonb);

-- Sinkronisasi sequence primary key serial pada Postgres
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

