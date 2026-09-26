import { NextRequest, NextResponse } from 'next/server';
import { PaymentProvider } from '@/lib/billing/payment-provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, paymentReference, action } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    if (action === 'cancel') {
      await PaymentProvider.cancelPayment(sessionId);
      return NextResponse.json({
        verified: false,
        status: 'PAYMENT_CANCELLED',
      });
    }

    const verification = await PaymentProvider.verifyPayment(sessionId, paymentReference);

    return NextResponse.json(verification);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Server verification failed', verified: false },
      { status: 500 }
    );
  }
}
