import type {
  AuthUser,
  FareConfig,
  PassengerCategory,
  PaymentMethod,
  ScanRequest,
  ScanResponse,
} from "@vessel/shared";
import { clearSession, getStoredToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

class ApiError extends Error {}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Session expired");
  }
  return res;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message ?? "Invalid username or password");
  }
  return res.json();
}

export async function submitScan(body: ScanRequest): Promise<ScanResponse> {
  return apiJson<ScanResponse>("/scan", { method: "POST", body: JSON.stringify(body) });
}

export interface ScanFeedItem {
  id: string;
  passengerName: string;
  category: PassengerCategory;
  remainingRides: number;
  scannedAt: string;
}

export interface ScanFeed {
  boardedToday: number;
  recent: ScanFeedItem[];
}

export async function fetchScanFeed(): Promise<ScanFeed> {
  return apiJson<ScanFeed>("/scan/feed");
}

export async function fetchFareSettings(): Promise<FareConfig> {
  return apiJson<FareConfig>("/fare-settings");
}

export async function updateFareSettings(body: {
  baseFarePerRide: number;
  studentDiscountPercent: number;
  pwdDiscountPercent: number;
  seniorDiscountPercent: number;
  childDiscountPercent: number;
}): Promise<FareConfig> {
  return apiJson<FareConfig>("/fare-settings", { method: "PUT", body: JSON.stringify(body) });
}

export interface Passenger {
  id: string;
  fullName: string;
  category: PassengerCategory;
  idNumber?: string | null;
  idExpiry?: string | null;
  email?: string | null;
  phone?: string | null;
  totalRides: number;
  remainingRides: number;
  feePaid: number;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  qrToken: string;
  createdAt: string;
  lastActivityAt: string;
}

export async function fetchPassengers(): Promise<Passenger[]> {
  return apiJson<Passenger[]>("/passengers");
}

export interface PaymentLogEntry {
  id: string;
  type: "REGISTRATION" | "TOPUP";
  ridesAdded: number;
  amount: number;
  baseFare: number;
  discountRate: number;
  discountAmount: number;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  operatorName: string;
  createdAt: string;
}

export interface PassengerDetail extends Passenger {
  paymentLogs: PaymentLogEntry[];
}

export async function fetchPassengerDetail(id: string): Promise<PassengerDetail> {
  return apiJson<PassengerDetail>(`/passengers/${id}`);
}

export type { PaymentMethod };

export async function registerPassenger(body: {
  fullName: string;
  category: PassengerCategory;
  idNumber?: string;
  idExpiry?: string;
  email?: string;
  phone?: string;
  ridesPurchased: number;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
}): Promise<Passenger> {
  return apiJson<Passenger>("/passengers", { method: "POST", body: JSON.stringify(body) });
}

export async function topUpPassenger(
  passengerId: string,
  body: { ridesPurchased: number; paymentMethod?: PaymentMethod; paymentRef?: string },
): Promise<Passenger> {
  return apiJson<Passenger>(`/passengers/${passengerId}/topup`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface CargoEntry {
  id: string;
  cargoType: string;
  weight: number;
  fee: number;
  vehiclePlate?: string | null;
  createdAt: string;
}

export async function fetchCargoEntries(): Promise<CargoEntry[]> {
  return apiJson<CargoEntry[]>("/cargo");
}

export async function createCargoEntry(body: {
  cargoType: string;
  weight: number;
  fee: number;
  vehiclePlate?: string;
}): Promise<CargoEntry> {
  return apiJson<CargoEntry>("/cargo", { method: "POST", body: JSON.stringify(body) });
}

export interface ExpenseLog {
  id: string;
  category: string;
  amount: number;
  description?: string | null;
  createdAt: string;
}

export async function fetchExpenses(): Promise<ExpenseLog[]> {
  return apiJson<ExpenseLog[]>("/expenses");
}

export async function createExpense(body: {
  category: string;
  amount: number;
  description?: string;
}): Promise<ExpenseLog> {
  return apiJson<ExpenseLog>("/expenses", { method: "POST", body: JSON.stringify(body) });
}

export interface ReportSummary {
  passengerRevenue: number;
  cargoRevenue: number;
  totalExpenses: number;
  grossRevenue: number;
  netProfit: number;
  activeRidesBalance: number;
  passengerCount: number;
  cargoTotalsByType: { cargoType: string; weight: number; fee: number; count: number }[];
  expenseBreakdown: { category: string; amount: number }[];
}

export async function fetchSummary(): Promise<ReportSummary> {
  return apiJson<ReportSummary>("/reports/summary");
}

export type ActivityType = "PASSENGER_REGISTRATION" | "PASSENGER_TOPUP" | "CARGO" | "EXPENSE" | "GATE_SCAN";

export interface ActivityEvent {
  type: ActivityType;
  id: string;
  label: string;
  amount: number;
  operatorName: string;
  createdAt: string;
}

export async function fetchActivity(): Promise<ActivityEvent[]> {
  return apiJson<ActivityEvent[]>("/reports/activity");
}

export interface DailyBreakdown {
  date: string;
  ticketRevenue: number;
  cargoRevenue: number;
  expenses: number;
  net: number;
}

export async function fetchDailyBreakdown(): Promise<DailyBreakdown[]> {
  return apiJson<DailyBreakdown[]>("/reports/daily");
}
