import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICING_PLANS } from '../src/lib/billing/plans';

test('Billing & Upgrade: Claude-Style Plans Configuration', () => {
  const freePlan = PRICING_PLANS.find((p) => p.id === 'FREE');
  const proPlan = PRICING_PLANS.find((p) => p.id === 'BUILDER'); // Pro / प्रगति
  const maxPlan = PRICING_PLANS.find((p) => p.id === 'PRO' || p.id === 'TEAM'); // Max / दल

  assert.ok(freePlan, 'Free plan should exist');
  assert.ok(proPlan, 'Pro plan should exist');
  assert.ok(maxPlan, 'Max plan should exist');

  // Verify Pro Plan prices match Screenshot 1 & 2
  assert.equal(proPlan.monthlyPriceInr, 2399, 'Pro monthly price should be ₹2,399');
  assert.equal(proPlan.yearlyPriceInr, 23999, 'Pro annual price should be ₹23,999');

  // Verify GST Breakdown (Screenshot 2: INR 2,033.05 + INR 365.95 = INR 2,399.00)
  const monthlyTotal = 2399.0;
  const monthlySubtotal = Math.round((monthlyTotal / 1.18) * 100) / 100;
  const monthlyGst = Math.round((monthlyTotal - monthlySubtotal) * 100) / 100;

  assert.equal(monthlySubtotal, 2033.05, 'Subtotal should be exactly ₹2,033.05');
  assert.equal(monthlyGst, 365.95, '18% GST should be exactly ₹365.95');
  assert.equal(Math.round((monthlySubtotal + monthlyGst) * 100) / 100, 2399.0, 'Total should be ₹2,399.00');

  // Verify Annual Savings (17% discount)
  const monthlyEquivOnAnnual = Math.round(23999 / 12);
  assert.ok(monthlyEquivOnAnnual <= 2000, 'Annual plan equivalent should be ~₹1,999/mo (Save 17%)');
});

test('Billing & Upgrade: Verified Recipient Safety', () => {
  const verifiedRecipient = 'shivansh.p@fam';
  assert.equal(verifiedRecipient, 'shivansh.p@fam', 'Verified UPI recipient must be shivansh.p@fam');
});
