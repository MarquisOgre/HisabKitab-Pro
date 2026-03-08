
-- Delete all data for admin@gmail.com (user_id: c7822b21-5514-496f-9152-670d2e043864)
DELETE FROM active_sessions WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864';
DELETE FROM user_roles WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864' OR parent_user_id = 'c7822b21-5514-496f-9152-670d2e043864';
DELETE FROM business_settings WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864';
DELETE FROM businesses WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864';
DELETE FROM license_settings WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864' OR user_email = 'admin@gmail.com';
DELETE FROM profiles WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864';
DELETE FROM notifications WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864';

-- Also delete the auth user
DELETE FROM auth.users WHERE id = 'c7822b21-5514-496f-9152-670d2e043864';
