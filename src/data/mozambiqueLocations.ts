export interface DistrictInfo {
  name: string;
  lat: number;
  lng: number;
}

export interface ProvinceInfo {
  name: string;
  capital: string;
  districts: DistrictInfo[];
  mainCrops: string[];
  lat: number;
  lng: number;
}

export const MOZAMBIQUE_PROVINCES: ProvinceInfo[] = [
  {
    name: "Maputo Cidade",
    capital: "Maputo",
    lat: -25.9692,
    lng: 32.5732,
    mainCrops: ["Hortaliças", "Tomate", "Alface", "Couve", "Pimento"],
    districts: [
      { name: "KaMpfumo", lat: -25.968, lng: 32.573 },
      { name: "Nlhamankulu", lat: -25.952, lng: 32.562 },
      { name: "KaMaxaquene", lat: -25.938, lng: 32.589 },
      { name: "KaMavota", lat: -25.885, lng: 32.618 },
      { name: "KaMubukwana", lat: -25.881, lng: 32.545 },
      { name: "KaTembe", lat: -26.02, lng: 32.55 },
      { name: "KaNyaka", lat: -25.98, lng: 32.91 },
    ],
  },
  {
    name: "Maputo Província",
    capital: "Matola",
    lat: -25.5,
    lng: 32.4,
    mainCrops: ["Mandioca", "Milho", "Tomate", "Batata-doce", "Banana", "Hortaliças"],
    districts: [
      { name: "Marracuene", lat: -25.733, lng: 32.683 },
      { name: "Manhiça", lat: -25.4, lng: 32.8 },
      { name: "Boane", lat: -26.04, lng: 32.33 },
      { name: "Matola", lat: -25.96, lng: 32.46 },
      { name: "Namaacha", lat: -25.97, lng: 32.02 },
      { name: "Moamba", lat: -25.6, lng: 32.24 },
      { name: "Magude", lat: -25.02, lng: 32.65 },
      { name: "Matutuíne", lat: -26.5, lng: 32.7 },
    ],
  },
  {
    name: "Gaza",
    capital: "Xai-Xai",
    lat: -23.8,
    lng: 32.8,
    mainCrops: ["Arroz", "Milho", "Mandioca", "Feijão-frade", "Abóbora", "Melancia"],
    districts: [
      { name: "Xai-Xai", lat: -25.04, lng: 33.64 },
      { name: "Chokwé", lat: -24.52, lng: 32.98 },
      { name: "Chibuto", lat: -24.68, lng: 33.53 },
      { name: "Bilene", lat: -25.2, lng: 33.25 },
      { name: "Limpopo", lat: -25.0, lng: 33.5 },
      { name: "Mandlakazi", lat: -24.3, lng: 33.95 },
      { name: "Guijá", lat: -24.35, lng: 33.0 },
      { name: "Mabalane", lat: -23.8, lng: 32.6 },
    ],
  },
  {
    name: "Inhambane",
    capital: "Inhambane",
    lat: -22.8,
    lng: 35.0,
    mainCrops: ["Coco", "Caju", "Mandioca", "Citrinos", "Amendoim"],
    districts: [
      { name: "Inhambane Cidade", lat: -23.86, lng: 35.38 },
      { name: "Maxixe", lat: -23.85, lng: 35.34 },
      { name: "Vilankulo", lat: -22.0, lng: 35.31 },
      { name: "Massinga", lat: -23.33, lng: 35.38 },
      { name: "Morrumbene", lat: -23.65, lng: 35.33 },
      { name: "Inharrime", lat: -24.48, lng: 35.03 },
      { name: "Homoíne", lat: -23.88, lng: 35.13 },
      { name: "Zavala", lat: -24.68, lng: 34.62 },
    ],
  },
  {
    name: "Sofala",
    capital: "Beira",
    lat: -19.5,
    lng: 34.5,
    mainCrops: ["Arroz", "Açúcar", "Milho", "Feijão", "Banana", "Ananás"],
    districts: [
      { name: "Beira", lat: -19.84, lng: 34.83 },
      { name: "Dondo", lat: -19.61, lng: 34.74 },
      { name: "Búzi", lat: -19.88, lng: 34.6 },
      { name: "Nhamatanda", lat: -19.26, lng: 34.21 },
      { name: "Gorongosa", lat: -18.68, lng: 34.07 },
      { name: "Caia", lat: -17.83, lng: 35.34 },
      { name: "Cheringoma", lat: -18.7, lng: 35.0 },
    ],
  },
  {
    name: "Manica",
    capital: "Chimoio",
    lat: -19.0,
    lng: 33.2,
    mainCrops: ["Milho", "Manga", "Lichia", "Macadâmia", "Batata-reno", "Tabaco"],
    districts: [
      { name: "Chimoio", lat: -19.11, lng: 33.48 },
      { name: "Manica", lat: -18.93, lng: 32.87 },
      { name: "Gondola", lat: -19.08, lng: 33.65 },
      { name: "Bárue", lat: -17.83, lng: 33.17 },
      { name: "Sussundenga", lat: -19.4, lng: 33.28 },
      { name: "Mossurize", lat: -20.45, lng: 32.82 },
    ],
  },
  {
    name: "Tete",
    capital: "Tete",
    lat: -15.8,
    lng: 33.0,
    mainCrops: ["Milho", "Feijão-nhemba", "Tabaco", "Algodão", "Gado Bovino e Caprino"],
    districts: [
      { name: "Tete Cidade", lat: -16.15, lng: 33.58 },
      { name: "Moatize", lat: -16.11, lng: 33.73 },
      { name: "Angónia", lat: -14.71, lng: 34.36 },
      { name: "Tsangano", lat: -15.18, lng: 34.48 },
      { name: "Cahora Bassa", lat: -15.61, lng: 32.61 },
      { name: "Changara", lat: -16.53, lng: 33.2 },
    ],
  },
  {
    name: "Zambézia",
    capital: "Quelimane",
    lat: -16.5,
    lng: 37.0,
    mainCrops: ["Chá", "Coco", "Arroz", "Mandioca", "Batata-doce", "Feijão"],
    districts: [
      { name: "Quelimane", lat: -17.87, lng: 36.88 },
      { name: "Gurúè", lat: -15.46, lng: 36.98 },
      { name: "Mocuba", lat: -16.83, lng: 36.98 },
      { name: "Milange", lat: -16.19, lng: 35.77 },
      { name: "Nicoadala", lat: -17.6, lng: 36.8 },
      { name: "Alto Molócuè", lat: -15.63, lng: 37.68 },
    ],
  },
  {
    name: "Nampula",
    capital: "Nampula",
    lat: -15.1,
    lng: 39.2,
    mainCrops: ["Caju", "Mandioca", "Algodão", "Amendoim", "Milho", "Feijão-boer"],
    districts: [
      { name: "Nampula Cidade", lat: -15.11, lng: 39.26 },
      { name: "Nacala-Porto", lat: -14.56, lng: 40.68 },
      { name: "Angoche", lat: -16.23, lng: 39.9 },
      { name: "Monapo", lat: -14.93, lng: 40.42 },
      { name: "Ribáuè", lat: -14.96, lng: 38.31 },
      { name: "Ilha de Moçambique", lat: -15.03, lng: 40.73 },
      { name: "Meconta", lat: -15.02, lng: 39.78 },
    ],
  },
  {
    name: "Cabo Delgado",
    capital: "Pemba",
    lat: -12.5,
    lng: 39.5,
    mainCrops: ["Mandioca", "Algodão", "Milho", "Feijão", "Sésamo"],
    districts: [
      { name: "Pemba", lat: -12.97, lng: 40.51 },
      { name: "Montepuez", lat: -13.12, lng: 38.99 },
      { name: "Chiúre", lat: -13.52, lng: 39.85 },
      { name: "Ancuabe", lat: -12.98, lng: 39.85 },
      { name: "Mueda", lat: -11.63, lng: 39.61 },
      { name: "Palma", lat: -10.78, lng: 40.47 },
    ],
  },
  {
    name: "Niassa",
    capital: "Lichinga",
    lat: -13.0,
    lng: 36.0,
    mainCrops: ["Milho", "Feijão", "Batata-reno", "Trigo", "Castanha de Caju"],
    districts: [
      { name: "Lichinga", lat: -13.31, lng: 35.24 },
      { name: "Cuamba", lat: -14.8, lng: 36.53 },
      { name: "Mandimba", lat: -14.35, lng: 35.65 },
      { name: "Marrupa", lat: -13.18, lng: 37.5 },
      { name: "Sanga", lat: -12.5, lng: 35.3 },
    ],
  },
];

export const PRODUCT_CATEGORIES = [
  "Cereais",
  "Hortaliças",
  "Frutas",
  "Tubérculos",
  "Leguminosas",
  "Animais/Aves",
  "Outros",
] as const;
