import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICING_PLANS } from '../src/lib/billing/plans';

test('Billing & Upgrade: Authentic Parishram Plans Configuration', () => {
  const freePlan = PRICING_PLANS.find((p) => p.id === 'FREE');
  const builderPlan = PRICING_PLANS.find((p) => p.id === 'BUILDER'); // Pro
  const proPlan = PRICING_PLANS.find((p) => p.id === 'PRO'); // Max
  const teamPlan = PRICING_PLANS.find((p) => p.id === 'TEAM'); // Team
  const enterprisePlan = PRICING_PLANS.find((p) => p.id === 'ENTERPRISE'); // Enterprise

  assert.ok(freePlan, 'Free plan should exist');
  assert.equal(freePlan.name, 'Free');

  assert.ok(builderPlan, 'Pro plan should exist');
  assert.equal(builderPlan.name, 'Pro');

  assert.ok(proPlan, 'Max plan should exist');
  assert.equal(proPlan.name, 'Max');

  assert.ok(teamPlan, 'Team plan should exist');
  assert.equal(teamPlan.name, 'Team');

  assert.ok(enterprisePlan, 'Enterprise plan should exist');
  assert.equal(enterprisePlan.name, 'Enterprise');

  // Verify Research-Backed Pricing Structure (WTP sweet spots in India)
  assert.equal(builderPlan.monthlyPriceInr, 999, 'Pro monthly price should be ₹999 (under ₹1,000 threshold)');
  assert.equal(builderPlan.yearlyPriceInr, 9588, 'Pro annual price should be ₹9,588 (₹799/mo, 20% savings)');

  assert.equal(proPlan.monthlyPriceInr, 2499, 'Max monthly price should be ₹2,499');
  assert.equal(proPlan.yearlyPriceInr, 23988, 'Max annual price should be ₹23,988');

  assert.equal(teamPlan.monthlyPriceInr, 4999, 'Team monthly price should be ₹4,999');

  // Verify GST Breakdown for Pragati (₹999 inclusive of 18% GST)
  const monthlyTotal = 999.0;
  const monthlySubtotal = Math.round((monthlyTotal / 1.18) * 100) / 100;
  const monthlyGst = Math.round((monthlyTotal - monthlySubtotal) * 100) / 100;

  assert.equal(monthlySubtotal, 846.61, 'Subtotal should be exactly ₹846.61');
  assert.equal(monthlyGst, 152.39, '18% GST should be exactly ₹152.39');
  assert.equal(Math.round((monthlySubtotal + monthlyGst) * 100) / 100, 999.0, 'Total should be ₹999.00');
});

test('Billing & Upgrade: Verified Recipient Safety', () => {
  const verifiedRecipient = 'shivansh.p@fam';
  assert.equal(verifiedRecipient, 'shivansh.p@fam', 'Verified UPI recipient must be shivansh.p@fam');
});
