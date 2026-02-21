INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'mirrorai2050@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;