-- ============================================================
-- Fresh Start: Clear all synced data
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- This wipes all mobile app synced data so the website starts
-- fresh. Your profiles (accounts) are NOT affected.
-- ============================================================

DELETE FROM ghub_utang_transactions;
DELETE FROM ghub_utang;
DELETE FROM ghub_activity_logs;
DELETE FROM ghub_shifts;
DELETE FROM ghub_sales;
DELETE FROM ghub_expenses;
DELETE FROM ghub_daily_summary;
DELETE FROM ghub_inventory_levels;
DELETE FROM ghub_categories;
DELETE FROM ghub_settings;
DELETE FROM ghub_users;

SELECT 'All ghub tables cleared. Fresh start ready!' AS status;
