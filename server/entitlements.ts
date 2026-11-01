import { TRPCError } from "@trpc/server";
import type { SubscriptionEntitlement } from "../drizzle/schema";
import { getSubscriptionEntitlement } from "./db";

export type StoryboardExportAccess = {
  allowed: boolean;
  state: "active" | "configuration_required" | "no_active_subscription" | "cancelled" | "expired" | "payment_overdue";
  message: string;
};

/**
 * This is deliberately server-only. A future payment connector may set this
 * environment value only after its provider, prices, and webhook verification are configured.
 * Its absence is not an entitlement and must never be replaced with a client flag.
 */
export function isSubscriptionProviderConfigured(): boolean {
  return Boolean(process.env.STORYBOARD_SUBSCRIPTION_PROVIDER?.trim());
}

export function evaluateStoryboardExportAccess(
  entitlement: SubscriptionEntitlement | undefined,
  options: { providerConfigured: boolean; now?: Date },
): StoryboardExportAccess {
  if (!options.providerConfigured) {
    return { allowed: false, state: "configuration_required", message: "إعداد شراء اشتراك برو داخل التطبيق مطلوب قبل إتاحة التصدير." };
  }

  if (!entitlement) {
    return { allowed: false, state: "no_active_subscription", message: "يتطلب تصدير Storyboard اشتراك برو نشطاً ومتحققاً على الخادم." };
  }

  if (entitlement.status === "cancelled") {
    return { allowed: false, state: "cancelled", message: "تم إلغاء اشتراك برو؛ جدد الاشتراك عبر بوابة الشراء المعتمدة." };
  }

  if (entitlement.status === "past_due" || entitlement.status === "unpaid") {
    return { allowed: false, state: "payment_overdue", message: "اشتراك برو غير مكتمل الدفع؛ حدّث وسيلة الدفع عبر بوابة الشراء المعتمدة." };
  }

  const now = options.now ?? new Date();
  if (entitlement.status !== "active" || entitlement.currentPeriodEndsAt.getTime() <= now.getTime()) {
    return { allowed: false, state: "expired", message: "انتهت صلاحية اشتراك برو؛ جدده عبر بوابة الشراء المعتمدة." };
  }

  return { allowed: true, state: "active", message: "اشتراك برو نشط ويمكنه تصدير Storyboard." };
}

export async function getStoryboardExportAccess(userId: number): Promise<StoryboardExportAccess> {
  const entitlement = await getSubscriptionEntitlement(userId);
  return evaluateStoryboardExportAccess(entitlement, { providerConfigured: isSubscriptionProviderConfigured() });
}

export async function requireStoryboardExportAccess(userId: number): Promise<void> {
  const access = await getStoryboardExportAccess(userId);
  if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: access.message });
}
