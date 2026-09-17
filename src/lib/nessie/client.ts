import { nessieFixture } from "@/lib/nessie/fixture";
import type { NessieDomainStatus, NessieSnapshot } from "@/lib/types";

const NESSIE_HOST = "https://api.nessieisreal.com";

type Settled<T> = { status: NessieDomainStatus; value: T };

async function nessieGet<T>(path: string, key: string): Promise<T> {
  const url = `${NESSIE_HOST}${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

async function settled<T>(promise: Promise<T>, fallback: T): Promise<Settled<T>> {
  try {
    const value = await promise;
    const empty = Array.isArray(value) && value.length === 0;
    return { status: empty ? "empty" : "fulfilled", value };
  } catch {
    return { status: "rejected", value: fallback };
  }
}

type RawCustomer = {
  _id: string;
  first_name: string;
  last_name: string;
  address?: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
};

type RawAccount = {
  _id: string;
  type: string;
  nickname: string;
  balance: number;
  rewards?: number;
  customer_id: string;
};

type RawBill = {
  _id: string;
  status: string;
  payee: string;
  nickname?: string;
  payment_date: string;
  recurring_date?: number;
  payment_amount: number;
};

type RawDeposit = {
  _id: string;
  type: string;
  transaction_date: string;
  status: string;
  amount: number;
  description?: string;
};

type RawPurchase = {
  _id: string;
  merchant_id?: string;
  purchase_date: string;
  amount: number;
  status: string;
  description?: string;
};

function formatAddress(address: RawCustomer["address"]): string {
  if (!address) return "No address on file";
  const line = [address.street_number, address.street_name].filter(Boolean).join(" ");
  const city = [address.city, address.state, address.zip].filter(Boolean).join(" ");
  return [line, city].filter(Boolean).join(", ");
}

export async function fetchNessieSnapshot(customerId?: string): Promise<NessieSnapshot> {
  const key = process.env.NESSIE_API_KEY;
  if (!key) return nessieFixture();

  try {
    let resolvedCustomerId = customerId || process.env.NESSIE_CUSTOMER_ID;
    if (!resolvedCustomerId) {
      const customers = await nessieGet<RawCustomer[]>("/customers", key);
      resolvedCustomerId = customers[0]?._id;
    }
    if (!resolvedCustomerId) {
      const fixture = nessieFixture();
      fixture.warning =
        "Nessie key is present but this key has no customers yet. Showing the bundled fixture.";
      return fixture;
    }

    const customerResult = await settled(
      nessieGet<RawCustomer>(`/customers/${resolvedCustomerId}`, key),
      null as RawCustomer | null,
    );
    const accountsResult = await settled(
      nessieGet<RawAccount[]>(`/customers/${resolvedCustomerId}/accounts`, key),
      [] as RawAccount[],
    );

    const bills: NessieSnapshot["bills"] = [];
    const deposits: NessieSnapshot["deposits"] = [];
    const purchases: NessieSnapshot["purchases"] = [];
    let billsStatus: NessieDomainStatus = "empty";
    let depositsStatus: NessieDomainStatus = "empty";
    let purchasesStatus: NessieDomainStatus = "empty";

    const perAccount = await Promise.allSettled(
      accountsResult.value.map(async (account) => {
        const [billRes, depositRes, purchaseRes] = await Promise.allSettled([
          nessieGet<RawBill[]>(`/accounts/${account._id}/bills`, key),
          nessieGet<RawDeposit[]>(`/accounts/${account._id}/deposits`, key),
          nessieGet<RawPurchase[]>(`/accounts/${account._id}/purchases`, key),
        ]);
        return { account, billRes, depositRes, purchaseRes };
      }),
    );

    for (const result of perAccount) {
      if (result.status !== "fulfilled") continue;
      const { account, billRes, depositRes, purchaseRes } = result.value;
      if (billRes.status === "fulfilled") {
        billsStatus = billRes.value.length ? "fulfilled" : billsStatus === "fulfilled" ? "fulfilled" : "empty";
        for (const bill of billRes.value) {
          bills.push({
            id: bill._id,
            accountId: account._id,
            status: bill.status,
            payee: bill.payee,
            nickname: bill.nickname,
            paymentDate: bill.payment_date,
            recurringDate: bill.recurring_date,
            paymentAmount: bill.payment_amount,
          });
        }
      } else {
        billsStatus = "rejected";
      }
      if (depositRes.status === "fulfilled") {
        depositsStatus =
          depositRes.value.length ? "fulfilled" : depositsStatus === "fulfilled" ? "fulfilled" : "empty";
        for (const deposit of depositRes.value) {
          deposits.push({
            id: deposit._id,
            accountId: account._id,
            type: deposit.type,
            transactionDate: deposit.transaction_date,
            status: deposit.status,
            amount: deposit.amount,
            description: deposit.description,
          });
        }
      } else {
        depositsStatus = "rejected";
      }
      if (purchaseRes.status === "fulfilled") {
        purchasesStatus =
          purchaseRes.value.length ? "fulfilled" : purchasesStatus === "fulfilled" ? "fulfilled" : "empty";
        for (const purchase of purchaseRes.value) {
          purchases.push({
            id: purchase._id,
            accountId: account._id,
            merchantId: purchase.merchant_id,
            purchaseDate: purchase.purchase_date,
            amount: purchase.amount,
            status: purchase.status,
            description: purchase.description,
          });
        }
      } else {
        purchasesStatus = "rejected";
      }
    }

    const customer = customerResult.value;

    return {
      source: "nessie",
      fetchedAt: new Date().toISOString(),
      customerId: resolvedCustomerId,
      domains: {
        customer: customerResult.status,
        accounts: accountsResult.status,
        bills: billsStatus,
        deposits: depositsStatus,
        purchases: purchasesStatus,
      },
      customer: customer
        ? {
            id: customer._id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            address: formatAddress(customer.address),
          }
        : null,
      accounts: accountsResult.value.map((account) => ({
        id: account._id,
        type: account.type,
        nickname: account.nickname,
        balance: account.balance,
        rewards: account.rewards ?? 0,
        customerId: account.customer_id,
      })),
      bills,
      deposits,
      purchases,
    };
  } catch (error) {
    const fixture = nessieFixture();
    fixture.warning = `Live Nessie request failed (${error instanceof Error ? error.message : "unknown error"}). Showing the bundled fixture instead.`;
    return fixture;
  }
}
