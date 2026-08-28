export type Role = "ADMIN" | "OWNER";

export type PassengerCategory = "REGULAR" | "STUDENT" | "PWD" | "SENIOR" | "CHILD_UNDER_7";

/** Fare rules editable by the Owner from /owner. Discounts are fractions (0.2 = 20%). */
export interface FareConfig {
  baseFarePerRide: number;
  studentDiscount: number;
  pwdDiscount: number;
  seniorDiscount: number;
  childDiscount: number;
}

/** Seed value only — the live rules always come from the FareSetting table. */
export const DEFAULT_FARE_CONFIG: FareConfig = {
  baseFarePerRide: 120,
  studentDiscount: 0.2,
  pwdDiscount: 0.2,
  seniorDiscount: 0.2,
  childDiscount: 0.5,
};

export function discountRateForCategory(config: FareConfig, category: PassengerCategory): number {
  switch (category) {
    case "REGULAR":
      return 0;
    case "STUDENT":
      return config.studentDiscount;
    case "PWD":
      return config.pwdDiscount;
    case "SENIOR":
      return config.seniorDiscount;
    case "CHILD_UNDER_7":
      return config.childDiscount;
  }
}

/** Categories that require a document/ID reference number and expiry date for the discount to
 * apply. REGULAR has no discount to verify; CHILD_UNDER_7 is verified by age, not ID. */
export const ID_PROOF_REQUIRED_CATEGORIES: readonly PassengerCategory[] = ["STUDENT", "PWD", "SENIOR"];

export type PaymentMethod = "CASH" | "GCASH" | "CARD";

/** Payment methods that require a reference/terminal number to be recorded. */
export const PAYMENT_REF_REQUIRED_METHODS: readonly PaymentMethod[] = ["GCASH", "CARD"];

export function calculateFare(config: FareConfig, category: PassengerCategory, rides: number) {
  const discountRate = discountRateForCategory(config, category);
  const baseFare = config.baseFarePerRide * rides;
  const discountAmount = baseFare * discountRate;
  const totalFee = baseFare - discountAmount;
  return { baseFare, discountRate, discountAmount, totalFee };
}

export type ScanResult = "OK" | "NO_RIDES_REMAINING" | "INVALID";

export interface ScanRequest {
  qrToken: string;
  gateId: string;
}

export interface ScanResponse {
  result: ScanResult;
  passengerId?: string;
  passengerName?: string;
  category?: PassengerCategory;
  remainingRides?: number;
  scannedAt?: string;
}

export interface PassengerCacheEntry {
  passengerId: string;
  fullName: string;
  category: PassengerCategory;
  remainingRides: number;
}

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
}

/** Redis key layout shared between the API's write path and read path. */
export const redisKeys = {
  passenger: (qrToken: string) => `passenger:${qrToken}`,
} as const;
