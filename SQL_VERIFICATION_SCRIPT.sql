-- Multi-Tenancy Verification Script
-- Run this after Liquibase migration to verify tenant setup
-- Database: PostgreSQL

-- ============================================
-- 1. Verify Tenant Table Exists
-- ============================================
SELECT 'Tenant Table' as Check, COUNT(*) as count FROM tenant;

-- Expected output:
-- Check        | count
-- Tenant Table | 1


-- ============================================
-- 2. Verify Default Tenant
-- ============================================
SELECT id, name, slug, created_at, updated_at
FROM tenant
WHERE id = 'a8d5c7e1-1234-5678-9abc-def012345678';

-- Expected output:
-- id                                   | name                    | slug                    | created_at  | updated_at
-- a8d5c7e1-1234-5678-9abc-def012345678 | L'Ajoie de mieux vivre  | ajoie-de-mieux-vivre    | 2026-01-24  | 2026-01-24


-- ============================================
-- 3. Verify User Tenant Columns
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'jhi_user'
AND column_name IN ('tenant_id', 'tenant_owner', 'tenant_member_status')
ORDER BY ordinal_position;

-- Expected output:
-- column_name            | data_type | is_nullable | column_default
-- tenant_id              | uuid      | NO          | NULL
-- tenant_owner           | boolean   | NO          | false
-- tenant_member_status   | character | NO          | ACTIVE


-- ============================================
-- 4. Verify All Users Assigned to Tenant
-- ============================================
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as assigned_users,
       COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as unassigned_users
FROM jhi_user;

-- Expected output:
-- total_users | assigned_users | unassigned_users
-- N           | N              | 0

-- Show which users are assigned:
SELECT id, login, tenant_id, tenant_owner, tenant_member_status
FROM jhi_user
ORDER BY login;


-- ============================================
-- 5. Verify Admin User is Tenant Owner
-- ============================================
SELECT login, tenant_id, tenant_owner, tenant_member_status
FROM jhi_user
WHERE login = 'admin';

-- Expected output:
-- login | tenant_id                            | tenant_owner | tenant_member_status
-- admin | a8d5c7e1-1234-5678-9abc-def012345678 | true         | ACTIVE


-- ============================================
-- 6. Verify Foreign Key Constraints
-- ============================================
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE constraint_name LIKE 'fk_%__tenant_id%'
ORDER BY table_name;

-- Expected output:
-- constraint_name                | table_name    | column_name
-- fk_salon__tenant_id            | salon         | tenant_id
-- fk_exhibitor__tenant_id        | exhibitor     | tenant_id
-- fk_stand__tenant_id            | stand         | tenant_id
-- fk_conference__tenant_id       | conference    | tenant_id
-- fk_invoice__tenant_id          | invoice       | tenant_id
-- fk_participation__tenant_id    | participation | tenant_id
-- fk_payment__tenant_id          | payment       | tenant_id
-- fk_workshop__tenant_id         | workshop      | tenant_id
-- fk_floor_plan_salon__tenant_id | floor_plan_salon | tenant_id
-- fk_address__tenant_id          | address       | tenant_id
-- fk_price_stand_salon__tenant_id| price_stand_salon | tenant_id
-- fk_user__tenant_id             | jhi_user      | tenant_id


-- ============================================
-- 7. Verify Indexes on tenant_id
-- ============================================
SELECT tablename, indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_%_tenant_id%'
ORDER BY tablename;

-- Expected output (one index per table):
-- tablename        | indexname
-- salon            | idx_salon_tenant_id
-- exhibitor        | idx_exhibitor_tenant_id
-- stand            | idx_stand_tenant_id
-- conference       | idx_conference_tenant_id
-- invoice          | idx_invoice_tenant_id
-- participation    | idx_participation_tenant_id
-- payment          | idx_payment_tenant_id
-- workshop         | idx_workshop_tenant_id
-- floor_plan_salon | idx_floor_plan_salon_tenant_id
-- address          | idx_address_tenant_id
-- price_stand_salon| idx_price_stand_salon_tenant_id
-- jhi_user         | idx_user_tenant_id
-- tenant           | idx_tenant_slug


-- ============================================
-- 8. Verify All Business Entities Have tenant_id
-- ============================================
-- Check each critical table for tenant_id column
DO $$
DECLARE
    v_table TEXT;
    v_has_tenant_id BOOLEAN;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'salon',
        'exhibitor',
        'stand',
        'conference',
        'invoice',
        'participation',
        'payment',
        'workshop',
        'floor_plan_salon',
        'address',
        'price_stand_salon'
    ] LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = v_table AND column_name = 'tenant_id'
        ) INTO v_has_tenant_id;

        IF v_has_tenant_id THEN
            RAISE NOTICE '✓ % has tenant_id column', v_table;
        ELSE
            RAISE NOTICE '✗ % MISSING tenant_id column', v_table;
        END IF;
    END LOOP;
END $$;

-- Expected output:
-- ✓ salon has tenant_id column
-- ✓ exhibitor has tenant_id column
-- ✓ stand has tenant_id column
-- ... etc


-- ============================================
-- 9. Count Records by Tenant (Sanity Check)
-- ============================================
SELECT 'tenant' as table_name, COUNT(*) as count FROM tenant
UNION ALL SELECT 'jhi_user', COUNT(*) FROM jhi_user
UNION ALL SELECT 'salon', COUNT(*) FROM salon
UNION ALL SELECT 'exhibitor', COUNT(*) FROM exhibitor
UNION ALL SELECT 'stand', COUNT(*) FROM stand
UNION ALL SELECT 'conference', COUNT(*) FROM conference
UNION ALL SELECT 'invoice', COUNT(*) FROM invoice
UNION ALL SELECT 'participation', COUNT(*) FROM participation
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'workshop', COUNT(*) FROM workshop
UNION ALL SELECT 'floor_plan_salon', COUNT(*) FROM floor_plan_salon
UNION ALL SELECT 'address', COUNT(*) FROM address
UNION ALL SELECT 'price_stand_salon', COUNT(*) FROM price_stand_salon
ORDER BY table_name;


-- ============================================
-- 10. Verify No NULL tenant_id in Non-Null Columns
-- ============================================
-- Check for any NULL tenant_id in tables where it should NOT be NULL
DO $$
DECLARE
    v_table TEXT;
    v_null_count INTEGER;
BEGIN
    FOREACH v_table IN ARRAY ARRAY[
        'salon',
        'exhibitor',
        'stand',
        'conference',
        'invoice',
        'participation',
        'payment',
        'workshop',
        'floor_plan_salon',
        'address',
        'price_stand_salon',
        'jhi_user'
    ] LOOP
        EXECUTE 'SELECT COUNT(*) FROM ' || v_table || ' WHERE tenant_id IS NULL'
        INTO v_null_count;

        IF v_null_count = 0 THEN
            RAISE NOTICE '✓ % - All records have tenant_id', v_table;
        ELSE
            RAISE NOTICE '✗ % - % records with NULL tenant_id', v_table, v_null_count;
        END IF;
    END LOOP;
END $$;

-- Expected output:
-- ✓ salon - All records have tenant_id
-- ✓ exhibitor - All records have tenant_id
-- ... etc


-- ============================================
-- 11. Verify NOT NULL Constraints
-- ============================================
SELECT table_name, column_name, is_nullable
FROM information_schema.columns
WHERE column_name = 'tenant_id'
ORDER BY table_name;

-- All should show is_nullable = 'NO'


-- ============================================
-- 12. Summary Report
-- ============================================
WITH verification AS (
    SELECT 'Tenant table exists' as check_name,
           CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as result
    FROM tenant

    UNION ALL

    SELECT 'Default tenant exists',
           CASE WHEN EXISTS(
               SELECT 1 FROM tenant
               WHERE id = 'a8d5c7e1-1234-5678-9abc-def012345678'
           ) THEN 'PASS' ELSE 'FAIL' END

    UNION ALL

    SELECT 'All users have tenant_id',
           CASE WHEN NOT EXISTS(
               SELECT 1 FROM jhi_user WHERE tenant_id IS NULL
           ) THEN 'PASS' ELSE 'FAIL' END

    UNION ALL

    SELECT 'Admin user is owner',
           CASE WHEN EXISTS(
               SELECT 1 FROM jhi_user
               WHERE login = 'admin' AND tenant_owner = true
           ) THEN 'PASS' ELSE 'FAIL' END

    UNION ALL

    SELECT 'Tenant FKs exist',
           CASE WHEN (
               SELECT COUNT(*) FROM information_schema.key_column_usage
               WHERE constraint_name LIKE 'fk_%__tenant_id%'
           ) >= 11 THEN 'PASS' ELSE 'FAIL' END
)
SELECT * FROM verification;

-- Expected output:
-- check_name                          | result
-- Tenant table exists                 | PASS
-- Default tenant exists               | PASS
-- All users have tenant_id            | PASS
-- Admin user is owner                 | PASS
-- Tenant FKs exist                    | PASS
