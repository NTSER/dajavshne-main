
import { 
  Gamepad2, 
  Monitor, 
  Headphones, 
  Zap, 
  Target,
  Coffee,
  Users,
  Trophy
} from "lucide-react";

export const categories = [
  {
    id: "Gaming Arena",
    name: "Gaming Arena",
    icon: Trophy,
    color: "#EC4899",
    description: "Professional esports venues"
  },
  {
    id: "Gaming Lounge",
    name: "Gaming Lounge",
    icon: Monitor,
    color: "#3B82F6", 
    description: "High-end PC gaming setups"
  },
  {
    id: "Console Room",
    name: "Console Room",
    icon: Gamepad2,
    color: "#8B5CF6",
    description: "PS5, Xbox Series X/S"
  },
  {
    id: "VR Zone",
    name: "VR Zone",
    icon: Headphones,
    color: "#06B6D4",
    description: "Virtual reality experiences"
  },
  {
    id: "Arcade",
    name: "Arcade",
    icon: Zap,
    color: "#F97316",
    description: "Classic arcade games"
  }
];

export const popularVenues = [
  {
    id: "1",
    name: "Pro Gamer Hub",
    category: "Gaming Arena", 
    location: "Esports Complex, Tbilisi",
    rating: 4.9,
    reviewCount: 89,
    price: "45",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
    amenities: ["High-end PCs", "Mechanical Keyboards", "WiFi", "Parking"],
    description: "Professional gaming setup for serious competitors",
    coordinates: { lat: 41.7151, lng: 44.7937 },
    services: [
      { name: "Gaming PC (RTX 4080)", price: 45, duration: "per hour" },
      { name: "Private Room", price: 120, duration: "per hour" },
      { name: "Tournament Setup", price: 80, duration: "per hour" }
    ],
    images: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop"
    ],
    reviews: [
      {
        id: "1",
        author: "Giorgi Nakhutsrishvili",
        rating: 5,
        comment: "Best gaming setup in Tbilisi! Professional equipment and great atmosphere.",
        date: "2024-01-15"
      },
      {
        id: "2", 
        author: "Ana Kvaratskhelia",
        rating: 5,
        comment: "Perfect for competitive gaming. High-end specs and comfortable environment.",
        date: "2024-01-10"
      }
    ]
  },
  {
    id: "2",
    name: "VR Galaxy Tbilisi",
    category: "VR Zone",
    location: "Saburtalo District, Tbilisi",
    rating: 4.8,
    reviewCount: 76,
    price: "35",
    image: "https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=400&h=300&fit=crop",
    amenities: ["VR Headsets", "Guide", "WiFi", "Parking"],
    description: "Immersive VR experiences with the latest headsets and games.",
    coordinates: { lat: 41.7370, lng: 44.7632 },
    services: [
      { name: "VR Session (1 Player)", price: 35, duration: "per hour" },
      { name: "VR Party (4 Players)", price: 120, duration: "per hour" },
      { name: "VR Experience Package", price: 180, duration: "2 hours" }
    ],
    images: [
      "https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&h=600&fit=crop"
    ],
    reviews: [
      {
        id: "1",
        author: "Levan Beridze",
        rating: 5,
        comment: "ფანტასტიკური VR გამოცდილება! პერსონალი ძალიან თავაზიანია.",
        date: "2024-01-12"
      }
    ]
  },
  {
    id: "3",
    name: "Retro Arcade Batumi",
    category: "Arcade",
    location: "Old Boulevard, Batumi",
    rating: 4.7,
    reviewCount: 134,
    price: "20",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    amenities: ["Classic Games", "Snacks", "Tokens", "WiFi"],
    description: "Classic arcade games from the 80s and 90s in a nostalgic seaside setting.",
    coordinates: { lat: 41.6168, lng: 41.6367 },
    services: [
      { name: "Arcade Access", price: 20, duration: "per hour" },
      { name: "Token Package (50)", price: 30, duration: "one-time" },
      { name: "Birthday Party Package", price: 200, duration: "3 hours" }
    ],
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop"
    ],
    reviews: [
      {
        id: "1",
        author: "Nino Janelidze",
        rating: 5,
        comment: "ძალიან კარგი ადგილია ბავშვობის მოგონებების გასახსენებლად!",
        date: "2024-01-08"
      }
    ]
  },
  {
    id: "4",
    name: "Console Kingdom",
    category: "Gaming Lounge",
    location: "Vake District, Tbilisi", 
    rating: 4.6,
    reviewCount: 167,
    price: "25",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
    amenities: ["PS5", "Xbox Series X", "Nintendo Switch", "Snacks"],
    description: "Latest console gaming with PS5, Xbox Series X, and Nintendo Switch.",
    coordinates: { lat: 41.7225, lng: 44.7925 },
    services: [
      { name: "Console Gaming", price: 25, duration: "per hour" },
      { name: "Private Gaming Room", price: 60, duration: "per hour" },
      { name: "Tournament Entry", price: 80, duration: "one-time" }
    ],
    images: [
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&h=600&fit=crop"
    ],
    reviews: [
      {
        id: "1",
        author: "David Khutsishvili",
        rating: 4,
        comment: "კარგი კონსოლების არჩევანი. შეიძლება უკეთესი სავარძლები ყოფილიყო.",
        date: "2024-01-05"
      }
    ]
  }
];
