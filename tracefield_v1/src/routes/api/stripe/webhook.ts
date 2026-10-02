import {verifyStripeSignature} from '@/lib/billing/stripe-signature';
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import type { Plan } from "@/lib/account/entitlements";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secretKey?.startsWith("sk_test_") || !webhookSecret) return new Response("Billing webhook is not configured", { status: 503 });

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing Stripe signature", { status: 400 });
        const body = await request.text();
        if (!(await verifyStripeSignature(body, signature, webhookSecret))) {
          return new Response("Invalid Stripe signature", { status: 400 });
        }

        let event: StripeEvent;
        try {
          event = JSON.parse(body) as StripeEvent;
        } catch {
          return new Response("Invalid event payload", { status: 400 });
        }

        if(event.livemode || !event.id) return new Response('Test events only',{status:400});
        const sql = await getSql();
        const previous=await sql.query<{id:string}>("select id from tracefield_stripe_events where id=$1",[event.id]);
        if(previous.length) return new Response('ok',{status:200});

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as StripeCheckoutSession;
          const plan = normalizePlan(session.metadata?.plan);
          const email = session.customer_details?.email ?? session.customer_email ?? null;
          let userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
          if (!userId && email) {
            const users = await sql<{ id: string }>`
              select "id" as id from "user" where lower("email") = lower(${email}) limit 1
            `;
            userId = users[0]?.id ?? null;
          }
          const subscriptionId = idOf(session.subscription);
          if (userId && plan && subscriptionId) {
            const subscription = await retrieveSubscription(secretKey, subscriptionId);
            await upsertSubscription(sql, userId, plan, subscription);
          }
        }

        if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
          const eventSubscription = event.data.object as StripeSubscription;
          const subscription = await retrieveSubscription(secretKey,eventSubscription.id);
          const rows = await sql<{ user_id: string; plan: Plan }>`
            select user_id, plan from tracefield_subscriptions
            where stripe_subscription_id = ${subscription.id}
            limit 1
          `;
          const userId = subscription.metadata?.user_id ?? rows[0]?.user_id ?? null;
          const plan = normalizePlan(subscription.metadata?.plan) ?? normalizePlan(rows[0]?.plan) ?? null;
          if (userId && plan) await upsertSubscription(sql, userId, plan, subscription);
        }

        await sql.query("insert into tracefield_stripe_events(id) values($1) on conflict do nothing",[event.id]);
        return new Response("ok", { status: 200 });
      },
    },
  },
});

type Sql = Awaited<ReturnType<typeof getSql>>;

type StripeEvent = {
  id: string;
  livemode: boolean;
  type: string;
  data: { object: unknown };
};

type StripeCheckoutSession = {
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  subscription?: string | { id?: string } | null;
};

type StripeSubscription = {
  id: string;
  status: string;
  customer: string | { id: string };
  metadata?: Record<string, string> | null;
  current_period_end?: number;
  items?: { data?: Array<{ current_period_end?: number; price?: { id?: string } }> };
};

function normalizePlan(value: string | undefined | null): Exclude<Plan, "free"> | null {
  return value === "plus" || value === "creator" || value === "studio" ? "plus" : null;
}

function idOf(value: StripeCheckoutSession["subscription"]): string | null {
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

async function retrieveSubscription(secret: string, subscriptionId: string): Promise<StripeSubscription> {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = (await response.json()) as StripeSubscription & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? "Could not retrieve Stripe subscription");
  return data;
}

async function upsertSubscription(
  sql: Sql,
  userId: string,
  plan: Exclude<Plan, "free">,
  subscription: StripeSubscription,
) {
  const currentPeriodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end ?? null;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const status = subscription.status;
  const effectivePlan: Plan = status === "canceled" || status === "incomplete_expired" ? "free" : plan;

  await sql`
    insert into tracefield_subscriptions
      (user_id, plan, status, stripe_customer_id, stripe_subscription_id, stripe_price_id, current_period_end, updated_at)
    values
      (${userId}, ${effectivePlan}, ${status}, ${customerId}, ${subscription.id}, ${priceId}, ${currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null}, now())
    on conflict (user_id) do update set
      plan = excluded.plan,
      status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      stripe_price_id = excluded.stripe_price_id,
      current_period_end = excluded.current_period_end,
      updated_at = now()
  `;
}

