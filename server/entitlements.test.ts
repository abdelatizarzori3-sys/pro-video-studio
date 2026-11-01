import { describe, expect, it } from "vitest";
import type { SubscriptionEntitlement } from "../drizzle/schema";
import { evaluateStoryboardExportAccess } from "./entitlements";

const now = new Date("2026-10-31T08:00:00.000Z");
const activeEntitlement: SubscriptionEntitlement = {
  id: 1,
  userId: 42,
  provider: "provider-under-test",
  providerCustomerId: "customer_1",
  providerSubscriptionId: "subscription_1",
  status: "active",
  currentPeriodEndsAt: new Date("2026-11-30T08:00:00.000Z"),
  verifiedAt: new Date("2026-10-30T08:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
};

describe("Storyboard Pro entitlement", () => {
  it("fails closed while the payment connector is not configured", () => {
    expect(evaluateStoryboardExportAccess(activeEntitlement, { providerConfigured: false, now })).toMatchObject({ allowed: false, state: "configuration_required" });
  });

  it("allows only a current, verified active entitlement after provider configuration", () => {
    expect(evaluateStoryboardExportAccess(activeEntitlement, { providerConfigured: true, now })).toMatchObject({ allowed: true, state: "active" });
  });

  it("denies missing, expired, cancelled, and overdue subscriptions", () => {
    expect(evaluateStoryboardExportAccess(undefined, { providerConfigured: true, now })).toMatchObject({ allowed: false, state: "no_active_subscription" });
    expect(evaluateStoryboardExportAccess({ ...activeEntitlement, currentPeriodEndsAt: now }, { providerConfigured: true, now })).toMatchObject({ allowed: false, state: "expired" });
    expect(evaluateStoryboardExportAccess({ ...activeEntitlement, status: "cancelled" }, { providerConfigured: true, now })).toMatchObject({ allowed: false, state: "cancelled" });
    expect(evaluateStoryboardExportAccess({ ...activeEntitlement, status: "past_due" }, { providerConfigured: true, now })).toMatchObject({ allowed: false, state: "payment_overdue" });
  });
});
