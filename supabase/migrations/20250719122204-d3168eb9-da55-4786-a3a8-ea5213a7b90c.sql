-- Insert Georgian gaming venues into the venues table
INSERT INTO public.venues (
  id,
  name,
  category,
  location,
  rating,
  review_count,
  price,
  images,
  amenities,
  description
) VALUES 
(
  'pro-gamer-hub-tbilisi',
  'Pro Gamer Hub',
  'Gaming Arena',
  'Esports Complex, Tbilisi',
  4.9,
  89,
  45,
  ARRAY[
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop'
  ],
  ARRAY['High-end PCs', 'Mechanical Keyboards', 'WiFi', 'Parking'],
  'Professional gaming setup for serious competitors'
),
(
  'vr-galaxy-tbilisi',
  'VR Galaxy Tbilisi',
  'VR Zone',
  'Saburtalo District, Tbilisi',
  4.8,
  76,
  35,
  ARRAY[
    'https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&h=600&fit=crop'
  ],
  ARRAY['VR Headsets', 'Guide', 'WiFi', 'Parking'],
  'Immersive VR experiences with the latest headsets and games'
),
(
  'retro-arcade-batumi',
  'Retro Arcade Batumi',
  'Arcade',
  'Old Boulevard, Batumi',
  4.7,
  134,
  20,
  ARRAY[
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
  ],
  ARRAY['Classic Games', 'Snacks', 'Tokens', 'WiFi'],
  'Classic arcade games from the 80s and 90s in a nostalgic seaside setting'
),
(
  'console-kingdom-tbilisi',
  'Console Kingdom',
  'Gaming Lounge',
  'Vake District, Tbilisi',
  4.6,
  167,
  25,
  ARRAY[
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=600&fit=crop'
  ],
  ARRAY['PS5', 'Xbox Series X', 'Nintendo Switch', 'Snacks'],
  'Latest console gaming with PS5, Xbox Series X, and Nintendo Switch'
),
(
  'cyber-cafe-rustavi',
  'Cyber Cafe Rustavi',
  'Gaming Lounge',
  'Central Square, Rustavi',
  4.5,
  92,
  18,
  ARRAY[
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop'
  ],
  ARRAY['Gaming PCs', 'WiFi', 'Snacks', 'AC'],
  'Modern gaming cafe with comfortable seating and good specs'
),
(
  'esports-arena-kutaisi',
  'Esports Arena Kutaisi',
  'Gaming Arena',
  'University District, Kutaisi',
  4.8,
  156,
  30,
  ARRAY[
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'
  ],
  ARRAY['Professional Setup', 'Tournament Ready', 'Streaming', 'WiFi'],
  'Professional esports arena for competitive gaming and tournaments'
);

-- Insert corresponding venue services
INSERT INTO public.venue_services (
  venue_id,
  name,
  price,
  duration,
  description
) VALUES 
-- Pro Gamer Hub services
('pro-gamer-hub-tbilisi', 'Gaming PC (RTX 4080)', 45, 'per hour', 'High-end gaming PC with RTX 4080'),
('pro-gamer-hub-tbilisi', 'Private Room', 120, 'per hour', 'Private gaming room for groups'),
('pro-gamer-hub-tbilisi', 'Tournament Setup', 80, 'per hour', 'Professional tournament setup'),

-- VR Galaxy services
('vr-galaxy-tbilisi', 'VR Session (1 Player)', 35, 'per hour', 'Individual VR gaming session'),
('vr-galaxy-tbilisi', 'VR Party (4 Players)', 120, 'per hour', 'Group VR experience for 4 players'),
('vr-galaxy-tbilisi', 'VR Experience Package', 180, '2 hours', 'Extended VR experience package'),

-- Retro Arcade services
('retro-arcade-batumi', 'Arcade Access', 20, 'per hour', 'Full access to all arcade games'),
('retro-arcade-batumi', 'Token Package (50)', 30, 'one-time', '50 tokens for arcade games'),
('retro-arcade-batumi', 'Birthday Party Package', 200, '3 hours', 'Complete birthday party package'),

-- Console Kingdom services
('console-kingdom-tbilisi', 'Console Gaming', 25, 'per hour', 'Access to PS5, Xbox Series X, Nintendo Switch'),
('console-kingdom-tbilisi', 'Private Gaming Room', 60, 'per hour', 'Private room with multiple consoles'),
('console-kingdom-tbilisi', 'Tournament Entry', 80, 'one-time', 'Entry fee for gaming tournaments'),

-- Cyber Cafe services
('cyber-cafe-rustavi', 'PC Gaming', 18, 'per hour', 'Standard PC gaming access'),
('cyber-cafe-rustavi', 'Premium PC', 25, 'per hour', 'High-spec PC gaming'),

-- Esports Arena services
('esports-arena-kutaisi', 'Training Session', 30, 'per hour', 'Professional training setup'),
('esports-arena-kutaisi', 'Tournament Practice', 50, 'per hour', 'Tournament-level practice session');