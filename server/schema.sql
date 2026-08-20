-- Schema for AB Pereira site
CREATE DATABASE IF NOT EXISTS abpereira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE abpereira;

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  tag VARCHAR(128),
  image TEXT,
  description TEXT,
  full_description TEXT,
  pricing_note TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(64),
  service VARCHAR(255),
  date_info TEXT,
  notes TEXT,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(128) PRIMARY KEY,
  value TEXT
);
