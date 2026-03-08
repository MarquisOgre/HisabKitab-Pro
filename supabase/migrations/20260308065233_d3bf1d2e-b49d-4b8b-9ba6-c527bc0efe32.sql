
-- Clean up duplicate marquisogre profile with null user_id
DELETE FROM public.profiles WHERE email = 'marquisogre@gmail.com' AND (user_id IS NULL OR user_id != 'b2505138-5df3-4cf9-b2e7-795ff6f7124d');

-- Update marquisogre's user_roles to have correct user_id
UPDATE public.user_roles SET user_id = 'b2505138-5df3-4cf9-b2e7-795ff6f7124d' WHERE user_id = '8b5bb7bc-7dae-435a-8573-afcc2d7b7084';
