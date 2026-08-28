import { prisma } from "@vessel/db";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const registerReportRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/summary", { preHandler: app.requireRole(["OWNER"]) }, async () => {
    const [paymentLogs, cargoEntries, expenses, passengers] = await Promise.all([
      prisma.paymentLog.findMany(),
      prisma.cargoEntry.findMany(),
      prisma.expenseLog.findMany(),
      prisma.passenger.findMany({ select: { remainingRides: true } }),
    ]);

    const passengerRevenue = paymentLogs.reduce((sum, p) => sum + p.amount, 0);
    const cargoRevenue = cargoEntries.reduce((sum, c) => sum + c.fee, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossRevenue = passengerRevenue + cargoRevenue;
    const netProfit = grossRevenue - totalExpenses;
    const activeRidesBalance = passengers.reduce((sum, p) => sum + p.remainingRides, 0);

    const cargoTotalsByType = Object.entries(
      cargoEntries.reduce<Record<string, { weight: number; fee: number; count: number }>>(
        (acc, c) => {
          const bucket = (acc[c.cargoType] ??= { weight: 0, fee: 0, count: 0 });
          bucket.weight += c.weight;
          bucket.fee += c.fee;
          bucket.count += 1;
          return acc;
        },
        {},
      ),
    ).map(([cargoType, totals]) => ({ cargoType, ...totals }));

    const expenseBreakdown = Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      }, {}),
    ).map(([category, amount]) => ({ category, amount }));

    return {
      passengerRevenue,
      cargoRevenue,
      totalExpenses,
      grossRevenue,
      netProfit,
      activeRidesBalance,
      passengerCount: passengers.length,
      cargoTotalsByType,
      expenseBreakdown,
    };
  });

  app.get("/activity", { preHandler: app.requireRole(["OWNER"]) }, async () => {
    const [paymentLogs, cargoEntries, expenses, scanEvents] = await Promise.all([
      prisma.paymentLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { passenger: true, createdBy: true },
      }),
      prisma.cargoEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { createdBy: true },
      }),
      prisma.expenseLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { createdBy: true },
      }),
      prisma.scanEvent.findMany({
        orderBy: { scannedAt: "desc" },
        take: 50,
        include: { passenger: true, createdBy: true },
      }),
    ]);

    const events = [
      ...paymentLogs.map((pl) => ({
        type:
          pl.type === "REGISTRATION"
            ? ("PASSENGER_REGISTRATION" as const)
            : ("PASSENGER_TOPUP" as const),
        id: pl.id,
        label: `${pl.passenger.fullName} — ${pl.ridesAdded} rides`,
        amount: pl.amount,
        operatorName: pl.createdBy?.username ?? "System",
        createdAt: pl.createdAt,
      })),
      ...cargoEntries.map((c) => ({
        type: "CARGO" as const,
        id: c.id,
        label: `${c.cargoType} — ${c.weight}kg${c.vehiclePlate ? ` (${c.vehiclePlate})` : ""}`,
        amount: c.fee,
        operatorName: c.createdBy?.username ?? "System",
        createdAt: c.createdAt,
      })),
      ...expenses.map((e) => ({
        type: "EXPENSE" as const,
        id: e.id,
        label: e.description ? `${e.category} — ${e.description}` : e.category,
        amount: -e.amount,
        operatorName: e.createdBy?.username ?? "System",
        createdAt: e.createdAt,
      })),
      ...scanEvents.map((s) => ({
        type: "GATE_SCAN" as const,
        id: s.id,
        label: s.passenger
          ? `${s.passenger.fullName} — ${s.outcome.replace(/_/g, " ")} @ ${s.gateId}`
          : `Unrecognized pass — ${s.outcome} @ ${s.gateId}`,
        amount: 0,
        operatorName: s.createdBy?.username ?? "System",
        createdAt: s.scannedAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return events.slice(0, 50);
  });

  // Admin needs this for the /admin dashboard's revenue trend chart. It's just
  // date-bucketed totals (no operator names or per-transaction detail), and
  // Admin can already derive the same aggregate totals from the raw
  // passengers/cargo/expenses lists it has access to, so gating this
  // specifically to Owner added no real protection.
  app.get("/daily", { preHandler: app.authenticate }, async () => {
    const [paymentLogs, cargoEntries, expenses] = await Promise.all([
      prisma.paymentLog.findMany({ select: { amount: true, createdAt: true } }),
      prisma.cargoEntry.findMany({ select: { fee: true, createdAt: true } }),
      prisma.expenseLog.findMany({ select: { amount: true, createdAt: true } }),
    ]);

    const days = new Map<
      string,
      { date: string; ticketRevenue: number; cargoRevenue: number; expenses: number }
    >();
    function bucket(date: Date) {
      const key = dateKey(date);
      let entry = days.get(key);
      if (!entry) {
        entry = { date: key, ticketRevenue: 0, cargoRevenue: 0, expenses: 0 };
        days.set(key, entry);
      }
      return entry;
    }

    for (const p of paymentLogs) bucket(p.createdAt).ticketRevenue += p.amount;
    for (const c of cargoEntries) bucket(c.createdAt).cargoRevenue += c.fee;
    for (const e of expenses) bucket(e.createdAt).expenses += e.amount;

    return Array.from(days.values())
      .map((d) => ({ ...d, net: d.ticketRevenue + d.cargoRevenue - d.expenses }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  });
};
