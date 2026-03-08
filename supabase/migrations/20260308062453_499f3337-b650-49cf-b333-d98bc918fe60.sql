
-- Insert admin role for SuperAdmin
INSERT INTO public.user_roles (id, user_id, role, created_at)
VALUES (gen_random_uuid()::text, 'c7822b21-5514-496f-9152-670d2e043864', 'admin', now());
