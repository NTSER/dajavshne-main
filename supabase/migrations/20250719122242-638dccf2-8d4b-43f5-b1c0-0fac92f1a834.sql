-- Insert Georgian gaming venues into the venues table with proper UUIDs
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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