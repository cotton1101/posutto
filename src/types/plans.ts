export type PlanType = 'free' | 'starter' | 'advanced' | 'advanced_20' | 'advanced_70' | 'advanced_170';

export interface PlanDetails {
    name: string;
    price: number;
    maxBots: number;
    maxTweetsPerDayPerBot: number;
}

export interface SubscriptionInfo {
    plan: PlanType;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'none';
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
    free: {
        name: 'フリープラン',
        price: 0,
        maxBots: 1,
        maxTweetsPerDayPerBot: 5,
    },
    starter: {
        name: 'スタータープラン',
        price: 2980,
        maxBots: 10,
        maxTweetsPerDayPerBot: 25,
    },
    advanced: {
        name: 'アドバンスプラン',
        price: 4980,
        maxBots: 30,
        maxTweetsPerDayPerBot: 25,
    },
    advanced_20: {
        name: 'アドバンスプラン＋20',
        price: 6980,
        maxBots: 50,
        maxTweetsPerDayPerBot: 25,
    },
    advanced_70: {
        name: 'アドバンスプラン＋70',
        price: 10980,
        maxBots: 100,
        maxTweetsPerDayPerBot: 25,
    },
    advanced_170: {
        name: 'アドバンスプラン＋170',
        price: 19800,
        maxBots: 200,
        maxTweetsPerDayPerBot: 25,
    },
};
