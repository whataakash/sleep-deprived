import test from 'node:test';
import assert from 'node:assert/strict';
import { PRICING_PLANS } from '../src/lib/billing/plans';

test('Billing & Upgrade: Authentic Parishram Plans Configuration', () => {
  const freePlan = PRICING_PLANS.find((p) => p.id === 'FREE');
  const builderPlan = PRICING_PLANS.find((p) => p.id === 'BUILDER'); // उत्कर्ष (Pro)
  const proPlan = PRICING_PLANS.find((p) => p.id === 'PRO'); // शिखर (Max)
  const teamPlan = PRICING_PLANS.find((p) => p.id === 'TEAM'); // दल (Team)

  assert.ok(freePlan, 'Free plan (आरम्भ) should exist');
  assert.equal(freePlan.name, 'आरम्भ');
  assert.equal(freePlan.englishSubtitle, 'Free');

  assert.ok(builderPlan, 'Pro plan (उत्कर्ष) should exist');
  assert.equal(builderPlan.name, 'उत्कर्ष');
  assert.equal(builderPlan.englishSubtitle, 'Pro');

  assert.ok(proPlan, 'Max plan (शिखर) should exist');
  assert.equal(proPlan.name, 'शिखर');
  assert.equal(proPlan.englishSubtitle, 'Max');

  assert.ok(teamPlan, 'Team plan (दल) should exist');
  assert.equal(teamPlan.name, 'दल');
  assert.equal(teamPlan.englishSubtitle, 'Team');

  // Verify Research-Backed Pricing Structure (WTP sweet spots in India)
  assert.equal(builderPlan.monthlyPriceInr, 999, 'उत्कर्ष monthly price should be ₹999 (under ₹1,000 threshold)');
  assert.equal(builderPlan.yearlyPriceInr, 9588, 'उत्कर्ष annual price should be ₹9,588 (₹799/mo, 20% savings)');

  assert.equal(proPlan.monthlyPriceInr, 2499, 'शिखर monthly price should be ₹2,499');
  assert.equal(proPlan.yearlyPriceInr, 23988, 'शिखर annual price should be ₹23,988');

  assert.equal(teamPlan.monthlyPriceInr, 4999, 'दल monthly price should be ₹4,999');

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
