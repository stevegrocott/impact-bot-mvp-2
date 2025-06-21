-- Update test user with correct password hash
UPDATE users 
SET password_hash = '$2a$12$DJVJIu4wjbQe4O5J7FfxLu4/q7VfHmoFT9rmL6l3.J3UjCZiHMyzG'
WHERE email = 'test@test.com';