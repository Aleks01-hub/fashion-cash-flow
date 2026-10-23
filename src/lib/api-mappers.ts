import type { AvPlan, Customer, Product, Purchase, AvPayment, Variation, ProductDetails } from "./mock-data";

/** Backend DTOs. JSON columns preserve fields used by the UI while the schema is migrated. */
export type ApiProduct = {
  id: string;
  name: string;
  category?: string | null;
  price: number;
  minStock?: number;
  photo?: string | null;
  barcode?: string | null;
  unit?: string | null;
  cost?: number;
  margin?: number;
  wholesale?: number;
  supplier?: string | null;
  brand?: string | null;
  reference?: string | null;
  location?: string | null;
  inactive?: boolean;
  tagsJson?: string | null;
  variationsJson?: string | null;
  detailsJson?: string | null;
};

export type ApiCustomer = {
  id: string;
  name: string;
  whatsapp: string;
  cpf?: string | null;
  address?: string | null;
  preferredSize?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  avTotal?: number;
  avBalance?: number;
  avDueDate?: string | null;
  paymentsJson?: string | null;
  purchasesJson?: string | null;
  avPlanJson?: string | null;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function productFromApi(row: ApiProduct): Product {
  const details = parseJson<ProductDetails | undefined>(row.detailsJson, undefined);
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "Sem categoria",
    price: Number(row.price ?? 0),
    minStock: Number(row.minStock ?? 0),
    photo: row.photo ?? "",
    tags: parseJson<string[]>(row.tagsJson, []),
    variations: parseJson<Variation[]>(row.variationsJson, []),
    ...(details ? { details } : {}),
  };
}

export function productToApi(product: Product): Omit<ApiProduct, "id"> {
  return {
    name: product.name,
    category: product.category,
    price: product.price,
    minStock: product.minStock,
    photo: product.photo,
    tagsJson: JSON.stringify(product.tags ?? []),
    variationsJson: JSON.stringify(product.variations ?? []),
    detailsJson: product.details ? JSON.stringify(product.details) : null,
    barcode: product.details?.barcode ?? null,
    unit: product.details?.unit ?? null,
    cost: product.details?.cost ?? 0,
    margin: product.details?.margin ?? 0,
    wholesale: product.details?.wholesale ?? 0,
    supplier: product.details?.supplier ?? null,
    brand: product.details?.brand ?? null,
    reference: product.details?.reference ?? null,
    location: product.details?.location ?? null,
    inactive: product.details?.inactive ?? false,
  };
}

export function customerFromApi(row: ApiCustomer): Customer {
  const preferredSize = row.preferredSize || "M";
  const av = row.avTotal || row.avBalance || row.avDueDate
    ? {
        total: Number(row.avTotal ?? 0),
        balance: Number(row.avBalance ?? 0),
        dueDate: row.avDueDate ?? "",
        plan: parseJson<{ plan?: AvPlan | null } | null>(row.avPlanJson, null)?.plan ?? undefined,
      }
    : null;
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    cpf: row.cpf ?? "",
    address: row.address ?? "",
    preferredSize: preferredSize as Customer["preferredSize"],
    birthDate: row.birthDate ?? "",
    notes: row.notes ?? "",
    av,
    payments: parseJson<AvPayment[]>(row.paymentsJson, []),
    purchases: parseJson<Purchase[]>(row.purchasesJson, []),
  };
}

export function customerToApi(customer: Customer): Omit<ApiCustomer, "id"> {
  return {
    name: customer.name,
    whatsapp: customer.whatsapp,
    cpf: customer.cpf,
    address: customer.address,
    preferredSize: customer.preferredSize,
    birthDate: customer.birthDate || null,
    notes: customer.notes ?? null,
    avTotal: customer.av?.total ?? 0,
    avBalance: customer.av?.balance ?? 0,
    avDueDate: customer.av?.dueDate || null,
    paymentsJson: JSON.stringify(customer.payments ?? []),
    purchasesJson: JSON.stringify(customer.purchases ?? []),
    avPlanJson: JSON.stringify({ plan: customer.av?.plan ?? null }),
  };
}
