import Stripe from 'stripe';
import dotenv from 'dotenv';
import db from './db.js';

dotenv.config();

// ---------------------------------------------------------------------------
// Stripe Client
// ---------------------------------------------------------------------------

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ---------------------------------------------------------------------------
// Plan definitions (server-side mirror of src/types/plans.ts)
// ---------------------------------------------------------------------------

interface PlanDef {
    name: string;
    price: number; // JPY (zero-decimal)
    description: string;
}

const PAID_PLANS: Record<string, PlanDef> = {
    starter: { name: 'スタータープラン', price: 2980, description: 'Bot 10個 / 1日25投稿' },
    advanced: { name: 'アドバンスプラン', price: 4980, description: 'Bot 30個 / 1日25投稿' },
    advanced_20: { name: 'アドバンスプラン＋20', price: 6980, description: 'Bot 50個 / 1日25投稿' },
    advanced_70: { name: 'アドバンスプラン＋70', price: 10980, description: 'Bot 100個 / 1日25投稿' },
    advanced_170: { name: 'アドバンスプラン＋170', price: 19800, description: 'Bot 200個 / 1日25投稿' },
};

// ---------------------------------------------------------------------------
// Plan <-> Price ID mapping (loaded from DB)
// ---------------------------------------------------------------------------

// Runtime mapping: plan key -> Stripe Price ID
export const PLAN_PRICE_MAP: Record<string, string> = {};
// Reverse mapping: Stripe Price ID -> plan key
export const PRICE_PLAN_MAP: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Auto-create Stripe products & prices if not yet registered
// ---------------------------------------------------------------------------

export async function initializeStripePrices(): Promise<void> {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('[Stripe] No STRIPE_SECRET_KEY configured, skipping initialization.');
        return;
    }

    console.log('[Stripe] Initializing products and prices...');

    // Create stripe_prices table if not exists
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS stripe_prices (
                plan_key TEXT PRIMARY KEY,
                stripe_product_id TEXT NOT NULL,
                stripe_price_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch {
        // Already exists
    }

    for (const [planKey, plan] of Object.entries(PAID_PLANS)) {
        // Check if already registered in local DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing: any = db.prepare(
            'SELECT stripe_price_id FROM stripe_prices WHERE plan_key = ?'
        ).get(planKey);

        if (existing) {
            // Verify the price still exists on Stripe AND has the correct amount
            try {
                const stripePrice = await stripe.prices.retrieve(existing.stripe_price_id);
                if (stripePrice.unit_amount !== plan.price) {
                    console.log(`[Stripe] Plan "${planKey}" price changed (${stripePrice.unit_amount} -> ${plan.price}). Re-creating...`);
                    // Archive old price on Stripe
                    try { await stripe.prices.update(existing.stripe_price_id, { active: false }); } catch (e) { console.warn('[Stripe] price archive failed:', e); }
                    db.prepare('DELETE FROM stripe_prices WHERE plan_key = ?').run(planKey);
                } else {
                    PLAN_PRICE_MAP[planKey] = existing.stripe_price_id;
                    PRICE_PLAN_MAP[existing.stripe_price_id] = planKey;
                    console.log(`[Stripe] Plan "${planKey}" verified on Stripe: ${existing.stripe_price_id}`);
                    continue;
                }
            } catch (verifyErr: any) {
                console.warn(`[Stripe] Plan "${planKey}" price ${existing.stripe_price_id} NOT found on Stripe (${verifyErr?.message}). Re-creating...`);
                // Delete stale local record so it gets re-created below
                db.prepare('DELETE FROM stripe_prices WHERE plan_key = ?').run(planKey);
            }
        }

        try {
            // Create Stripe Product
            const product = await stripe.products.create({
                name: `ポスット - ${plan.name}`,
                description: plan.description,
                metadata: { posutto_plan: planKey },
            });

            // Create Stripe Price (recurring monthly, JPY)
            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: plan.price, // JPY is zero-decimal
                currency: 'jpy',
                recurring: { interval: 'month' },
                metadata: { posutto_plan: planKey },
            });

            // Save to local DB
            db.prepare(
                'INSERT INTO stripe_prices (plan_key, stripe_product_id, stripe_price_id) VALUES (?, ?, ?)'
            ).run(planKey, product.id, price.id);

            PLAN_PRICE_MAP[planKey] = price.id;
            PRICE_PLAN_MAP[price.id] = planKey;

            console.log(`[Stripe] Created product & price for "${planKey}": ${price.id} (¥${plan.price}/month)`);
        } catch (err) {
            console.error(`[Stripe] Failed to create product/price for "${planKey}":`, err);
        }
    }

    console.log('[Stripe] Price initialization complete.');
    console.log('[Stripe] PLAN_PRICE_MAP:', PLAN_PRICE_MAP);
}
