// Single source of truth for the cafe.
// Both the marketing site components and the chatbot system prompt
// consume this file, so the bot's answers never drift from what's on screen.

export const cafe = {
  name: "Bramble & Brew",
  tagline: "Slow coffee. Real conversations.",
  shortDescription:
    "A third-wave specialty coffee shop in Galway's Latin Quarter, roasting our own beans since 2022.",
  address: {
    street: "14 Quay Street",
    city: "Galway",
    postcode: "H91 X234",
    country: "Ireland",
    full: "14 Quay Street, Galway, H91 X234, Ireland",
  },
  hours: [
    { label: "Monday – Friday", time: "7:00 — 18:00" },
    { label: "Saturday – Sunday", time: "8:00 — 19:00" },
  ],
  phone: "+353 91 555 0142",
  email: "hello@brambleandbrew.ie",
  socials: {
    instagram: "https://instagram.com/brambleandbrew",
    twitter: "https://twitter.com/brambleandbrew",
  },
  opened: "2022",
  cuppingPrice: 15,
} as const;

export type MenuItem = {
  name: string;
  price: number;
  description?: string;
  signature?: boolean;
};

export const menu: {
  espresso: MenuItem[];
  filter: MenuItem[];
  other: MenuItem[];
} = {
  espresso: [
    {
      name: "House Espresso",
      price: 3.2,
      description: "Honey-sweet, with notes of toasted hazelnut and milk chocolate.",
      signature: true,
    },
    { name: "Macchiato", price: 3.4 },
    { name: "Cortado", price: 3.8, description: "Equal parts espresso and steamed milk." },
    {
      name: "Flat White",
      price: 4.0,
      description: "Two ristretto shots and silky microfoam. Our most-ordered drink.",
      signature: true,
    },
    { name: "Cappuccino", price: 4.0 },
    { name: "Latte", price: 4.2 },
  ],
  filter: [
    {
      name: "V60 Pour Over",
      price: 4.5,
      description: "Single-origin, brewed to order. Ask the barista what's on bar today.",
      signature: true,
    },
    { name: "Chemex (for two)", price: 8.0, description: "Clean, tea-like cup. Brewed tableside." },
    {
      name: "AeroPress",
      price: 4.3,
      description: "Punchy, full-bodied. Great with our Brazil Cerrado.",
    },
    {
      name: "Cold Brew",
      price: 4.5,
      description: "Steeped 18 hours. Smooth, low acidity, served over a single sphere of ice.",
    },
    { name: "Batch Brew", price: 3.5 },
  ],
  other: [
    { name: "Hot Chocolate", price: 4.2, description: "Made with 70% Valrhona dark chocolate." },
    { name: "Chai Latte", price: 4.3, description: "House-spiced. Cardamom-forward." },
    { name: "Matcha Latte", price: 4.5 },
    { name: "Loose-leaf Tea", price: 3.5 },
    { name: "Pastry of the day", price: 3.8, description: "From Aniar Bakery, two blocks over." },
  ],
};

export type Bean = {
  id: string;
  name: string;
  origin: string;
  process: string;
  altitude: string;
  tastingNotes: string[];
  description: string;
  sizes: { grams: number; price: number }[];
};

export const beans: Bean[] = [
  {
    id: "ethiopia-yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    origin: "Gedeo Zone, Ethiopia",
    process: "Washed",
    altitude: "1,900 – 2,100 masl",
    tastingNotes: ["Bergamot", "Jasmine", "White peach"],
    description:
      "Bright and floral. Brews like a cup of citrus tea — best as a V60 or AeroPress.",
    sizes: [
      { grams: 250, price: 14 },
      { grams: 500, price: 26 },
      { grams: 1000, price: 48 },
    ],
  },
  {
    id: "colombia-huila",
    name: "Colombia Huila",
    origin: "Pitalito, Huila",
    process: "Washed",
    altitude: "1,750 – 1,950 masl",
    tastingNotes: ["Red apple", "Toffee", "Cocoa nib"],
    description:
      "Balanced and approachable. Our go-to espresso base — sweet and forgiving.",
    sizes: [
      { grams: 250, price: 13 },
      { grams: 500, price: 24 },
      { grams: 1000, price: 44 },
    ],
  },
  {
    id: "brazil-cerrado",
    name: "Brazil Cerrado",
    origin: "Cerrado Mineiro",
    process: "Natural",
    altitude: "1,100 – 1,250 masl",
    tastingNotes: ["Hazelnut", "Milk chocolate", "Brown sugar"],
    description:
      "Rich, chocolatey, low acidity. Outstanding in milk drinks and AeroPress.",
    sizes: [
      { grams: 250, price: 12 },
      { grams: 500, price: 22 },
      { grams: 1000, price: 40 },
    ],
  },
];

export const faqs = [
  { q: "Do you have oat milk?", a: "Yes — Oatly Barista, no upcharge." },
  {
    q: "Gluten-free pastries?",
    a: "Usually one or two from Aniar Bakery. Ask the team at the counter for today's selection.",
  },
  { q: "Vegan options?", a: "Yes — all milk drinks can be made with oat, soy, or coconut. Most pastries have a vegan alternative." },
  { q: "Wifi?", a: "Free wifi for guests. Ask for the password at the counter." },
  {
    q: "Laptop-friendly?",
    a: "Weekdays are great for working. Weekends get busy, so we ask laptops to wrap up around 11am to free tables for brunch.",
  },
  { q: "Reservations?", a: "Walk-ins only — no reservations needed for the cafe." },
  { q: "Pet-friendly?", a: "Well-behaved dogs are very welcome. Water bowls by the door." },
  {
    q: "Cupping sessions?",
    a: `Every Sunday at 10am. €${cafe.cuppingPrice} per person, ~75 minutes, four coffees on the table. Book via this chat.`,
  },
] as const;
