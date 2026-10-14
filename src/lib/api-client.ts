/**
 * Cliente HTTP centralizado para a API Spring Boot.
 * Configure VITE_API_BASE_URL no .env.local. Em produção, prefira um proxy same-origin.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message); this.name = "ApiError";
  }
}
type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message = typeof body === "object" && body !== null && "message" in body
      ? String(body.message) : `Falha na API (${response.status})`;
    throw new ApiError(message, response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
export type ApiCustomer = {
  id: string; name: string; whatsapp?: string | null; cpf?: string | null; address?: string | null;
  preferredSize?: string | null; birthDate?: string | null; notes?: string | null;
  avTotal?: number; avBalance?: number; avDueDate?: string | null;
};
export type ApiProduct = {
  id: string; name: string; category?: string | null; price: number; minStock?: number;
  photo?: string | null; barcode?: string | null; unit?: string | null; cost?: number; margin?: number;
  wholesale?: number; supplier?: string | null; brand?: string | null; reference?: string | null;
  location?: string | null; inactive?: boolean;
};
export type ApiVariation = { id: string; productId: string; color: string; size: string; quantity: number; minStock: number };
export type ApiSaleItem = {
  id?: string; productId?: string; variationId?: string; productName?: string; color?: string; size?: string;
  quantity: number; unitPrice: number; total?: number;
};
export type ApiAvPayment = {
  id: string; amount: string | number; balanceBefore: string | number; balanceAfter: string | number;
  method: "PIX" | "CASH" | "DEBIT" | "CREDIT" | "TRANSFER" | "OTHER"; paidAt: string; notes?: string | null;
};
export type ApiAvAccount = {
  id: string; customerId: string; customerName: string; description: string;
  originalAmount: string | number; currentBalance: string | number; createdAt: string;
  dueDate?: string | null; status: "ACTIVE" | "PAID" | "OVERDUE"; payments: ApiAvPayment[];
};
export type ApiSale = {
  id: string; number?: number; date?: string; customerId?: string | null; customerName?: string | null;
  seller?: string | null; total: number; subtotal?: number; discount?: number; amountPaid?: number;
  paymentMethod?: string | null; items: ApiSaleItem[];
};
export const storeService = {
  health: () => request<{ status: string; timestamp?: string }>("/health"),
  customers: {
    list: () => request<ApiCustomer[]>("/customers"),
    get: (id: string) => request<ApiCustomer>(`/customers/${encodeURIComponent(id)}`),
    create: (customer: Omit<ApiCustomer, "id">) => request<ApiCustomer>("/customers", { method: "POST", body: customer }),
    update: (id: string, customer: Partial<ApiCustomer>) => request<ApiCustomer>(`/customers/${encodeURIComponent(id)}`, { method: "PUT", body: customer }),
    remove: (id: string) => request<void>(`/customers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  },
  products: {
    list: () => request<ApiProduct[]>("/products"),
    get: (id: string) => request<ApiProduct>(`/products/${encodeURIComponent(id)}`),
    create: (product: Omit<ApiProduct, "id">) => request<ApiProduct>("/products", { method: "POST", body: product }),
    update: (id: string, product: Partial<ApiProduct>) => request<ApiProduct>(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: product }),
    remove: (id: string) => request<void>(`/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
    variations: (productId: string) => request<ApiVariation[]>(`/products/${encodeURIComponent(productId)}/variations`),
    addVariation: (productId: string, variation: { color: string; size: string; quantity: number; minStock: number }) =>
      request<ApiVariation>(`/products/${encodeURIComponent(productId)}/variations`, { method: "POST", body: variation }),
    adjustStock: (productId: string, variationId: string, quantity: number, operation: "entrada" | "saida") =>
      request<ApiVariation>(`/products/${encodeURIComponent(productId)}/variations/${encodeURIComponent(variationId)}/stock`, { method: "PATCH", body: { quantity, operation } }),
  },
  sales: {
    list: () => request<ApiSale[]>("/sales"),
    get: (id: string) => request<ApiSale>(`/sales/${encodeURIComponent(id)}`),
    create: (sale: Omit<ApiSale, "id">) => request<ApiSale>("/sales", { method: "POST", body: sale }),
  },
};
