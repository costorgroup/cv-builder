import type { TAccountOverview } from "@repo/cv-core";

const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });
const formatDate = (iso: string) => longDate.format(new Date(iso));

/**
 * One line on where the subscription stands, e.g. "Renews on October 30,
 * 2026" or "Your Premium plan has ended"; undefined when there's nothing to
 * add (a free plan with no end).
 */
export const subscriptionStatusText = ({
  plan,
  subscription,
}: Pick<TAccountOverview, "plan" | "subscription">): string | undefined => {
  if (!subscription) return undefined;
  const { status, currentPeriodEnd, cancelAtPeriodEnd, trialEndsAt } =
    subscription;

  // The subscription's plan no longer applies; the user is on the default.
  if (subscription.plan.key !== plan.key) {
    return `Your ${subscription.plan.name} plan has ended`;
  }
  switch (status) {
    case "TRIALING":
      return trialEndsAt
        ? `Free trial until ${formatDate(trialEndsAt)}`
        : "Free trial";
    case "PAST_DUE":
      return "Payment failed. Update your payment details to keep your plan.";
    case "CANCELED":
      return currentPeriodEnd
        ? `Ends on ${formatDate(currentPeriodEnd)}`
        : "Canceled";
    case "EXPIRED":
      return "Expired";
    case "ACTIVE":
      if (!currentPeriodEnd) return undefined;
      return cancelAtPeriodEnd
        ? `Ends on ${formatDate(currentPeriodEnd)}`
        : `Renews on ${formatDate(currentPeriodEnd)}`;
  }
};
