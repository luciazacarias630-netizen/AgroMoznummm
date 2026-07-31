import { Product } from "../types";

export interface CropMatch {
  keywords: string[];
  name: string;
  category: Product["category"];
  imageUrl: string;
  defaultUnit: string;
  suggestedPrice: number;
}

export const CROP_DATABASE: CropMatch[] = [
  {
    keywords: ["tomate", "tomato", "tomatoes", "tomates"],
    name: "Tomate Fresco",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "caixa (20kg)",
    suggestedPrice: 350,
  },
  {
    keywords: ["pimento", "pimentao", "pimenta", "pepper", "peppers"],
    name: "Pimento Verde",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 400,
  },
  {
    keywords: ["milho", "maize", "corn", "fuba"],
    name: "Milho Amarelo / Branco",
    category: "Cereais",
    imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (50kg)",
    suggestedPrice: 1200,
  },
  {
    keywords: ["batata reno", "batata", "potato", "potatoes"],
    name: "Batata Reno",
    category: "Tubérculos",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 280,
  },
  {
    keywords: ["batata doce", "sweet potato"],
    name: "Batata Doce",
    category: "Tubérculos",
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (20kg)",
    suggestedPrice: 320,
  },
  {
    keywords: ["mandioca", "cassava", "yuca"],
    name: "Mandioca Fresca",
    category: "Tubérculos",
    imageUrl: "https://images.unsplash.com/photo-1627918663806-031f0e41f7e0?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (50kg)",
    suggestedPrice: 750,
  },
  {
    keywords: ["cebola", "onion", "cebolas"],
    name: "Cebola Roxa / Branca",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 450,
  },
  {
    keywords: ["alface", "lettuce"],
    name: "Alface Crespa",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "molho (10 un)",
    suggestedPrice: 150,
  },
  {
    keywords: ["repolho", "cabbage", "couve"],
    name: "Repolho Verde",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (25kg)",
    suggestedPrice: 300,
  },
  {
    keywords: ["cenoura", "carrot", "cenouras"],
    name: "Cenoura Doce",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 380,
  },
  {
    keywords: ["feijao", "feijão", "beans", "nhemba", "jugo"],
    name: "Feijão Manteiga / Nhemba",
    category: "Leguminosas",
    imageUrl: "https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (20kg)",
    suggestedPrice: 1500,
  },
  {
    keywords: ["melancia", "watermelon"],
    name: "Melancia Doce",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "unidade (~8kg)",
    suggestedPrice: 180,
  },
  {
    keywords: ["banana", "bananas"],
    name: "Banana Matooke / Mesa",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "cacho (~15kg)",
    suggestedPrice: 350,
  },
  {
    keywords: ["abacaxi", "ananas", "ananás", "pineapple"],
    name: "Abacaxi Doce",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "caixa (12 un)",
    suggestedPrice: 400,
  },
  {
    keywords: ["manga", "mango", "mangas"],
    name: "Manga Tommy / Manteiga",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "caixa (10kg)",
    suggestedPrice: 300,
  },
  {
    keywords: ["mamao", "mamão", "papaya"],
    name: "Mamão Formosa",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "caixa (10 un)",
    suggestedPrice: 250,
  },
  {
    keywords: ["galinha", "frango", "chicken", "aves", "caipira"],
    name: "Galinha Caipira Viva",
    category: "Animais/Aves",
    imageUrl: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "unidade",
    suggestedPrice: 450,
  },
  {
    keywords: ["ovos", "ovo", "eggs"],
    name: "Ovos Caipiras / Frescos",
    category: "Animais/Aves",
    imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "carteira (30 un)",
    suggestedPrice: 240,
  },
  {
    keywords: ["amendoim", "peanut", "peanuts"],
    name: "Amendoim Torrado / Cru",
    category: "Leguminosas",
    imageUrl: "https://images.unsplash.com/photo-1567892320421-1c657571ea48?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (20kg)",
    suggestedPrice: 1100,
  },
  {
    keywords: ["abobora", "abóbora", "pumpkin"],
    name: "Abóbora Menina",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "unidade",
    suggestedPrice: 120,
  },
  {
    keywords: ["castanha", "caju", "cashew"],
    name: "Castanha de Caju",
    category: "Outros",
    imageUrl: "https://images.unsplash.com/photo-1509358271058-acd02cc93898?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "kg",
    suggestedPrice: 500,
  },
  {
    keywords: ["arroz", "rice"],
    name: "Arroz Nacional",
    category: "Cereais",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (25kg)",
    suggestedPrice: 1350,
  },
  {
    keywords: ["gengibre", "ginger"],
    name: "Gengibre Fresco",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "kg",
    suggestedPrice: 200,
  },
  {
    keywords: ["alho", "garlic"],
    name: "Alho Roxo",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (5kg)",
    suggestedPrice: 600,
  },
  {
    keywords: ["limao", "limão", "lemon", "lime"],
    name: "Limão Taiti",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1534531141161-e41d133a897d?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 220,
  },
  {
    keywords: ["laranja", "orange"],
    name: "Laranja Doce",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (10kg)",
    suggestedPrice: 250,
  },
  {
    keywords: ["gergelim", "sesame"],
    name: "Gergelim Branco / Castanho",
    category: "Outros",
    imageUrl: "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "saco (50kg)",
    suggestedPrice: 2800,
  },
  {
    keywords: ["piripiri", "pimenta", "chili", "chilli", "malagueta"],
    name: "Piripiri / Pimenta Malagueta",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "kg",
    suggestedPrice: 350,
  },
  {
    keywords: ["abacate", "avocado"],
    name: "Abacate Manteiga",
    category: "Frutas",
    imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "caixa (10kg)",
    suggestedPrice: 400,
  },
  {
    keywords: ["couve", "kale"],
    name: "Couve Tronchuda / Galega",
    category: "Hortaliças",
    imageUrl: "https://images.unsplash.com/photo-1524179091875-bf98a9a6ae57?auto=format&fit=crop&q=80&w=800",
    defaultUnit: "molho (10 un)",
    suggestedPrice: 120,
  },
];

/**
 * Given a text typed by the farmer, automatically matches the best agricultural image,
 * category, and standardized name.
 */
export function findMatchingCropByText(text: string): CropMatch | null {
  if (!text || text.trim().length < 2) return null;
  const clean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const item of CROP_DATABASE) {
    for (const kw of item.keywords) {
      const cleanKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (clean.includes(cleanKw) || cleanKw.includes(clean)) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Simulated AI Crop Vision Scanner that analyzes camera/input image or product name
 * and returns high-confidence detection with photo, crop name, category, and unit.
 */
export async function simulateAICropScan(
  queryOrName?: string
): Promise<{
  imageUrl: string;
  detectedName: string;
  category: Product["category"];
  suggestedUnit: string;
  suggestedPrice: number;
  confidence: number;
}> {
  // Simulate AI network latency / scanner processing delay (800ms)
  await new Promise((res) => setTimeout(res, 850));

  if (queryOrName) {
    const match = findMatchingCropByText(queryOrName);
    if (match) {
      return {
        imageUrl: match.imageUrl,
        detectedName: match.name,
        category: match.category,
        suggestedUnit: match.defaultUnit,
        suggestedPrice: match.suggestedPrice,
        confidence: 98.4,
      };
    }
  }

  // Pick a random crop from database if no query match
  const randomCrop = CROP_DATABASE[Math.floor(Math.random() * CROP_DATABASE.length)];
  return {
    imageUrl: randomCrop.imageUrl,
    detectedName: randomCrop.name,
    category: randomCrop.category,
    suggestedUnit: randomCrop.defaultUnit,
    suggestedPrice: randomCrop.suggestedPrice,
    confidence: 96.2,
  };
}
