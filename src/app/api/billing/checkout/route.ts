import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider } from '@/lib/billing/payment-provider';
import { PlanTier } from '@/types/billing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, currency, billingCycle, email } = body;

    if (!planId || !['BUILDER', 'PRO', 'TEAM'].includes(planId)) {
      return NextResponse.json({ error: 'Valid paid planId (BUILDER, PRO, TEAM) required' }, { status: 400 });
    }

    const session = await PaymentProvider.createCheckout({
      planId: planId as PlanTier,
      currency: currency || 'INR',
      billingCycle: billingCycle || 'monthly',
      userEmail: email,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize payment session' },
      { status: 500 }
    );
  }
}
