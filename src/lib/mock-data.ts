export type Size = "PP" | "P" | "M" | "G" | "GG" | "36" | "38" | "40" | "42" | "44" | "46" | "48";

export type Variation = {
  color: string;
  size: Size;
  qty: number;
  reserved: number;
  inBag: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  minStock: number;
  photo: string;
  tags: string[];
  variations: Variation[];
};

export type Purchase = {
  id: string;
  date: string;
  items: string;
  price: number;
  method: string;
};

export type AvPayment = {
  id: string;
  date: string;
  amount: number;
  method: string;
  balanceAfter: number;
};

export type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  cpf: string;
  address: string;
  preferredSize: Size;
  av: {
    total: number;
    balance: number;
    dueDate: string;
  } | null;
  payments: AvPayment[];
  purchases: Purchase[];
};

export type Reservation = {
  id: string;
  kind: "reserva" | "bag";
  customer: string;
  items: string;
  value: number;
  until: string;
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/500`;

export const products: Product[] = [
  {
    id: "p1",
    name: "Regata Canelada",
    category: "Blusas",
    price: 59.9,
    minStock: 4,
    photo: img("regata"),
    tags: ["basica", "verao"],
    variations: [
      { color: "Preta", size: "P", qty: 6, reserved: 1, inBag: 0 },
      { color: "Preta", size: "M", qty: 3, reserved: 0, inBag: 2 },
      { color: "Branca", size: "M", qty: 0, reserved: 0, inBag: 0 },
      { color: "Branca", size: "G", qty: 8, reserved: 0, inBag: 0 },
    ],
  },
  {
    id: "p2",
    name: "Calça Jeans Wide Leg",
    category: "Calças",
    price: 189.9,
    minStock: 3,
    photo: img("jeans"),
    tags: ["jeans", "premium"],
    variations: [
      { color: "Azul Claro", size: "38", qty: 2, reserved: 1, inBag: 0 },
      { color: "Azul Claro", size: "40", qty: 5, reserved: 0, inBag: 1 },
      { color: "Azul Escuro", size: "42", qty: 1, reserved: 0, inBag: 0 },
      { color: "Azul Escuro", size: "44", qty: 0, reserved: 0, inBag: 0 },
    ],
  },
  {
    id: "p3",
    name: "Vestido Midi Fluido",
    category: "Vestidos",
    price: 229.0,
    minStock: 2,
    photo: img("vestido"),
    tags: ["festa", "verao"],
    variations: [
      { color: "Verde Oliva", size: "P", qty: 4, reserved: 0, inBag: 0 },
      { color: "Verde Oliva", size: "M", qty: 1, reserved: 1, inBag: 0 },
      { color: "Vinho", size: "G", qty: 3, reserved: 0, inBag: 0 },
    ],
  },
  {
    id: "p4",
    name: "Cropped Tricot",
    category: "Blusas",
    price: 89.9,
    minStock: 5,
    photo: img("cropped"),
    tags: ["inverno"],
    variations: [
      { color: "Bege", size: "PP", qty: 2, reserved: 0, inBag: 0 },
      { color: "Bege", size: "P", qty: 2, reserved: 0, inBag: 1 },
      { color: "Preta", size: "M", qty: 7, reserved: 0, inBag: 0 },
    ],
  },
  {
    id: "p5",
    name: "Saia Plissada Midi",
    category: "Saias",
    price: 139.9,
    minStock: 4,
    photo: img("saia"),
    tags: ["trabalho"],
    variations: [
      { color: "Preta", size: "36", qty: 1, reserved: 0, inBag: 0 },
      { color: "Preta", size: "38", qty: 3, reserved: 1, inBag: 0 },
      { color: "Caramelo", size: "40", qty: 2, reserved: 0, inBag: 0 },
    ],
  },
];

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Maria Oliveira",
    whatsapp: "5585999120045",
    cpf: "042.118.330-11",
    address: "Rua das Acácias, 210 - Aldeota, Fortaleza/CE",
    preferredSize: "M",
    av: { total: 620, balance: 270, dueDate: "2026-09-10" },
    payments: [
      { id: "ap1", date: "2026-08-05T10:24:00", amount: 200, method: "Pix", balanceAfter: 420 },
      { id: "ap2", date: "2026-08-21T16:08:00", amount: 150, method: "Dinheiro", balanceAfter: 270 },
    ],
    purchases: [
      { id: "pu1", date: "2026-07-28T14:12:00", items: "Vestido Midi Verde Oliva M", price: 229, method: "Ficha (AV)" },
      { id: "pu2", date: "2026-08-02T11:40:00", items: "Calça Wide Leg 40, Regata Preta M", price: 249.8, method: "Ficha (AV)" },
      { id: "pu3", date: "2026-08-19T18:02:00", items: "Cropped Tricot Bege P", price: 89.9, method: "Cartão Crédito" },
    ],
  },
  {
    id: "c2",
    name: "Juliana Prado",
    whatsapp: "5585988771230",
    cpf: "710.442.980-05",
    address: "Av. Beira Mar, 1200 - Meireles, Fortaleza/CE",
    preferredSize: "P",
    av: { total: 430, balance: 430, dueDate: "2026-08-15" },
    payments: [],
    purchases: [
      { id: "pu4", date: "2026-07-15T09:31:00", items: "Saia Plissada Preta 38, Cropped Preto M", price: 229.8, method: "Ficha (AV)" },
      { id: "pu5", date: "2026-07-16T19:05:00", items: "Regata Branca G x2", price: 119.8, method: "Ficha (AV)" },
    ],
  },
  {
    id: "c3",
    name: "Camila Souza",
    whatsapp: "5585997654321",
    cpf: "388.229.110-72",
    address: "Rua Pereira Filgueiras, 88 - Centro, Fortaleza/CE",
    preferredSize: "G",
    av: null,
    payments: [
      { id: "ap3", date: "2026-08-28T15:47:00", amount: 310, method: "Pix", balanceAfter: 0 },
    ],
    purchases: [
      { id: "pu6", date: "2026-08-28T15:40:00", items: "Vestido Midi Vinho G", price: 229, method: "Pix" },
      { id: "pu7", date: "2026-06-11T17:20:00", items: "Calça Wide Leg 42", price: 189.9, method: "Débito" },
    ],
  },
  {
    id: "c4",
    name: "Renata Lima",
    whatsapp: "5585994411882",
    cpf: "155.900.223-40",
    address: "Rua Ana Bilhar, 45 - Varjota, Fortaleza/CE",
    preferredSize: "38",
    av: { total: 980, balance: 180, dueDate: "2026-09-22" },
    payments: [
      { id: "ap4", date: "2026-08-01T12:00:00", amount: 500, method: "Pix", balanceAfter: 480 },
      { id: "ap5", date: "2026-08-25T09:12:00", amount: 300, method: "Cartão Débito", balanceAfter: 180 },
    ],
    purchases: [
      { id: "pu8", date: "2026-07-30T10:00:00", items: "Kit 4 peças verão", price: 980, method: "Ficha (AV)" },
    ],
  },
  {
    id: "c5",
    name: "Patrícia Gomes",
    whatsapp: "5585993330011",
    cpf: "900.334.221-18",
    address: "Rua Silva Jatahy, 300 - Meireles, Fortaleza/CE",
    preferredSize: "GG",
    av: { total: 250, balance: 250, dueDate: "2026-07-30" },
    payments: [],
    purchases: [
      { id: "pu9", date: "2026-06-30T13:15:00", items: "Saia Caramelo 40, Regata Preta P", price: 199.8, method: "Ficha (AV)" },
    ],
  },
];

export const reservations: Reservation[] = [
  { id: "r1", kind: "reserva", customer: "Maria Oliveira", items: "Regata Preta P", value: 59.9, until: "2026-09-04" },
  { id: "r2", kind: "reserva", customer: "Renata Lima", items: "Calça Wide Leg 38", value: 189.9, until: "2026-09-05" },
  { id: "r3", kind: "reserva", customer: "Camila Souza", items: "Vestido Midi Oliva M", value: 229, until: "2026-09-06" },
  { id: "r4", kind: "bag", customer: "Juliana Prado", items: "Regata Preta M x2, Cropped Bege P", value: 209.7, until: "2026-09-03" },
  { id: "r5", kind: "bag", customer: "Patrícia Gomes", items: "Calça Wide Leg 40", value: 189.9, until: "2026-09-04" },
];

export const stores = ["Loja Centro", "Loja Aldeota", "Loja Shopping Norte"];
