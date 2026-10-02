"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CheckBox,
  DataTable,
  Flex,
  Skeleton,
  Small,
  type TDataTableColumn,
  TextField,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import EntitlementsEditor, {
  toEntitlementValues,
} from "@/components/entitlements-editor";
import type { TEntitlementsDraft } from "@/components/entitlements-editor/types";
import SettingsCard from "@/components/settings-card";
import WideTable from "@/components/wide-table";
import { useAuth } from "@/providers/auth-provider";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import {
  adminBillingApi,
  type TAdminPlan,
  type TAdminPlanPrice,
} from "@/utils/admin-api";
import { ADMIN_PLANS_PATH } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { formatMoney } from "@/utils/pricing";
import {
  SAdminPlanPageFields,
  SAdminPlanPagePriceField,
} from "@/views/admin-plan-page/styles";
import ValueSelect from "@/components/value-select";

const PERIODS: TAdminPlanPrice["period"][] = ["MONTHLY", "QUARTERLY", "YEARLY"];

/**
 * A price as the table shows it. The table searches the text of each
 * column, so every column's key holds what it displays.
 */
type TPriceRow = TAdminPlanPrice & {
  priceText: string;
  periodText: string;
  statusText: string;
  paddle: string;
};

/** Where a price stands with Paddle. */
const paddleStatus = (price: TAdminPlanPrice, prices: TAdminPlanPrice[]) =>
  price.providerPriceId ??
  (price.currency === "EUR"
    ? "Not synced yet"
    : prices.some(
          (each) =>
            each.active &&
            each.currency === "EUR" &&
            each.period === price.period,
        )
      ? "Sent as a country price"
      : "Needs a EUR price for this period");

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

type TDetails = {
  name: string;
  description: string;
  isPublic: boolean;
  archived: boolean;
  sortOrder: string;
};

const detailsOf = (plan: TAdminPlan): TDetails => ({
  name: plan.name,
  description: plan.description ?? "",
  isPublic: plan.isPublic,
  archived: !!plan.archivedAt,
  sortOrder: String(plan.sortOrder),
});

/**
 * One plan: its name and visibility, features and limits, and prices.
 * Super admins edit; admins only look.
 */
const AdminPlanPage = ({ id }: { id: string }) => {
  const auth = useAuth();
  const confirm = useConfirm();
  const [plan, setPlan] = useState<TAdminPlan | { error: string }>();
  const [details, setDetails] = useState<TDetails>();
  const [entitlements, setEntitlements] = useState<TEntitlementsDraft>();
  const [newPrice, setNewPrice] = useState({
    period: "MONTHLY" as TAdminPlanPrice["period"],
    currency: "EUR",
    amount: "",
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<
    { success: string } | { error: string }
  >();
  const canEdit =
    auth.status === "signed-in" && auth.user.role === "SUPER_ADMIN";

  const load = useCallback(
    () =>
      adminBillingApi.plans().then(
        (plans) => {
          const found = plans.find((each) => each.id === id);
          if (!found) return setPlan({ error: "Plan not found" });
          setPlan(found);
          setDetails(detailsOf(found));
          setEntitlements({ features: found.features, limits: found.limits });
        },
        (error: unknown) => setPlan({ error: messageOf(error) }),
      ),
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!plan || !details || !entitlements) {
    if (plan && "error" in plan) {
      return (
        <Alert color="error" variant="subtle">
          {plan.error}
        </Alert>
      );
    }
    return <Skeleton width="100%" height={480} radius="lg" aria-busy />;
  }
  if ("error" in plan) return null;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
      await load();
      setNotice({ success });
    } catch (error) {
      setNotice({ error: messageOf(error) });
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(
      () =>
        adminBillingApi.updatePlan(plan.id, {
          name: details.name.trim(),
          description: details.description.trim(),
          isPublic: details.isPublic,
          archived: details.archived,
          sortOrder: Number(details.sortOrder) || 0,
          ...toEntitlementValues(entitlements),
        }),
      "Plan saved. It applies at once to everyone on it.",
    );

  const onAddPrice = async () => {
    const cents = Math.round(Number(newPrice.amount) * 100);
    if (!(cents > 0)) {
      setNotice({ error: "Enter a price above 0, e.g. 12.99." });
      return;
    }
    await run(
      () =>
        adminBillingApi.addPrice(plan.id, {
          period: newPrice.period,
          currency: newPrice.currency.trim().toUpperCase(),
          amountCents: cents,
        }),
      "Price added. Sync to Paddle on the Plans page to start selling it.",
    );
    setNewPrice((current) => ({ ...current, amount: "" }));
  };

  const onRetire = async (price: TAdminPlanPrice) => {
    try {
      await confirm({
        title: `Stop selling ${formatMoney(price.amountCents / 100, price.currency)} / ${price.period.toLowerCase()}?`,
        description: "People paying it keep it. New buyers can't choose it.",
        confirmLabel: "Stop selling",
        color: "error",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    await run(() => adminBillingApi.retirePrice(price.id), "Price retired.");
  };

  const priceColumns: TDataTableColumn<TPriceRow>[] = [
    { id: "price", key: "priceText", name: "Price" },
    { id: "period", key: "periodText", name: "Period" },
    { id: "status", key: "statusText", name: "Status" },
    { id: "paddle", key: "paddle", name: "Paddle" },
    ...(canEdit
      ? [
          {
            id: "retire",
            key: "id",
            name: "",
            renderCell: ({ row }) =>
              row.active && (
                <Button size="sm" disabled={busy} onClick={() => onRetire(row)}>
                  Stop selling
                </Button>
              ),
          } satisfies TDataTableColumn<TPriceRow>,
        ]
      : []),
  ];

  return (
    <Flex direction="column" gap={5}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Small color="secondary">
          {plan.subscriptions}{" "}
          {plan.subscriptions === 1 ? "account is" : "accounts are"} on this
          plan. Changes to features and limits apply to them at once.
        </Small>
        <Button as={ButtonLink} href={ADMIN_PLANS_PATH} variant="ghost">
          All plans
        </Button>
      </Flex>
      {notice && (
        <Alert
          color={"error" in notice ? "error" : "success"}
          variant="subtle"
          onClose={() => setNotice(undefined)}
        >
          {"error" in notice ? notice.error : notice.success}
        </Alert>
      )}

      <SettingsCard
        title="Plan"
        description={`Key "${plan.key}" is fixed; code and the database use it.`}
        actions={
          canEdit && (
            <Button
              variant="solid"
              color="primary"
              disabled={busy}
              onClick={onSave}
            >
              Save plan
            </Button>
          )
        }
      >
        <SAdminPlanPageFields direction="column" gap={4}>
          <TextField
            label="Name"
            size="sm"
            variant="subtle"
            disabled={!canEdit}
            value={details.name}
            onChange={(event) =>
              setDetails({ ...details, name: event.target.value })
            }
          />
          <TextField
            label="Description"
            size="sm"
            variant="subtle"
            disabled={!canEdit}
            value={details.description}
            onChange={(event) =>
              setDetails({ ...details, description: event.target.value })
            }
          />
          <TextField
            label="Order on the pricing page"
            type="number"
            size="sm"
            variant="subtle"
            disabled={!canEdit}
            value={details.sortOrder}
            onChange={(event) =>
              setDetails({ ...details, sortOrder: event.target.value })
            }
          />
          <CheckBox
            size="sm"
            label="Shown on the pricing page"
            disabled={!canEdit}
            checked={details.isPublic}
            onChange={(event) =>
              setDetails({ ...details, isPublic: event.target.checked })
            }
          />
          {!plan.isDefault && (
            <CheckBox
              size="sm"
              label="Archived (not sold; people on it keep it)"
              disabled={!canEdit}
              checked={details.archived}
              onChange={(event) =>
                setDetails({ ...details, archived: event.target.checked })
              }
            />
          )}
        </SAdminPlanPageFields>
        <EntitlementsEditor
          value={entitlements}
          onChange={setEntitlements}
          disabled={!canEdit}
          emptyLimitHint="0"
        />
      </SettingsCard>

      <WideTable minWidth={620}>
        <DataTable
          columns={priceColumns}
          data={plan.prices.map((price): TPriceRow => ({
            ...price,
            priceText: formatMoney(price.amountCents / 100, price.currency),
            periodText: price.period.toLowerCase(),
            statusText: price.active ? "Selling" : "Retired",
            paddle: paddleStatus(price, plan.prices),
          }))}
          size="sm"
          radius="lg"
          title="Prices"
          description={
            plan.isDefault
              ? "The default plan is free, so it has no prices."
              : "A price is never changed once someone may be paying it. Add a new one instead: it replaces the one for the same period and currency for new buyers."
          }
          searchPlaceholder="Search by amount, period or status"
        />
      </WideTable>

      {canEdit && !plan.isDefault && (
        <SettingsCard
          title="Add a price"
          description="Then sync to Paddle on the Plans page to start selling it."
        >
          <Flex gap={3} align="flex-end" wrap="wrap">
            <SAdminPlanPagePriceField width={160}>
              <ValueSelect
                label="Period"
                size="sm"
                variant="subtle"
                value={newPrice.period}
                options={PERIODS.map((value) => ({
                  value,
                  label: value.toLowerCase(),
                }))}
                onChange={(_, value) =>
                  setNewPrice({
                    ...newPrice,
                    period: value as TAdminPlanPrice["period"],
                  })
                }
              />
            </SAdminPlanPagePriceField>
            <SAdminPlanPagePriceField width={100}>
              <TextField
                label="Currency"
                size="sm"
                variant="subtle"
                maxLength={3}
                value={newPrice.currency}
                onChange={(event) =>
                  setNewPrice({
                    ...newPrice,
                    currency: event.target.value.toUpperCase(),
                  })
                }
              />
            </SAdminPlanPagePriceField>
            <SAdminPlanPagePriceField width={140}>
              <TextField
                label="Amount"
                size="sm"
                variant="subtle"
                inputMode="decimal"
                placeholder="12.99"
                value={newPrice.amount}
                onChange={(event) =>
                  setNewPrice({ ...newPrice, amount: event.target.value })
                }
              />
            </SAdminPlanPagePriceField>
            <Button disabled={busy || !newPrice.amount} onClick={onAddPrice}>
              Add price
            </Button>
          </Flex>
        </SettingsCard>
      )}
    </Flex>
  );
};

export default AdminPlanPage;
