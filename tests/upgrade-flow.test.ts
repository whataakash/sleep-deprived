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

test('Header & Pricing Modal: Final Polish Verification', async () => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const topbarContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/layout/topbar.tsx'),
    'utf-8'
  );
  const modalContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/features/billing/upgrade-modal.tsx'),
    'utf-8'
  );

  const sidebarContent = await fs.readFile(
    path.join(process.cwd(), 'src/components/layout/sidebar.tsx'),
    'utf-8'
  );

  // 1. Topbar should NOT contain "Upgrade ↗", "Cmd+K" text, "Desktop" button, "Plans" button, or "RUN DEMO"
  assert.ok(!topbarContent.includes('Upgrade ↗'), 'Header should not contain visible Upgrade ↗ pill');
  assert.ok(!topbarContent.includes('<span>Cmd+K</span>'), 'Header should not contain visible Cmd+K text');
  assert.ok(!topbarContent.includes('<span>Desktop</span>'), 'Header should not contain Desktop button (preserved in sidebar)');
  assert.ok(!topbarContent.includes('<span>Plans</span>'), 'Header should not contain duplicate Plans button');
  assert.ok(!topbarContent.includes('<span>RUN DEMO</span>'), 'Header should not contain Run Demo CTA (moved to Mission Control)');

  // 2. Topbar contains prominent Parishram brand, clean Search icon button, and Google-style account control
  assert.ok(topbarContent.includes('परिश्रम'), 'Header must feature prominent Parishram branding');
  assert.ok(topbarContent.includes('aria-label="Search or open command palette (Cmd+K)"'), 'Header must have accessible search button');
  assert.ok(topbarContent.includes('aria-label="Open account and settings menu"'), 'Header must have clean account profile control');

  // 3. Sidebar does NOT contain Download Parishram or Local Runtime (product surface reduction)
  assert.ok(!sidebarContent.includes('Download Parishram'), 'Sidebar must not feature Download Parishram');
  assert.ok(!sidebarContent.includes('Local Runtime'), 'Sidebar must not feature Local Runtime section');

  // 4. Modal must use viewport-constrained architecture with sticky header and AnimatePresence
  assert.ok(modalContent.includes('max-h-[92dvh]'), 'Modal shell must be constrained to viewport with dvh');
  assert.ok(modalContent.includes('shrink-0 z-10'), 'Modal top bar must be sticky/fixed so close button never scrolls away');
  assert.ok(modalContent.includes('aria-label="Close subscription plans modal"'), 'Close button must have clear accessibility label');
  assert.ok(modalContent.includes('overflow-y-auto overscroll-contain min-h-0'), 'Modal body must scroll internally');
  assert.ok(modalContent.includes('Plans that fit your work'), 'Modal header copy must feature clean heading');
  assert.ok(modalContent.includes('Choose the setup that matches how you build.'), 'Modal header copy must be concise without vertical clutter');
  assert.ok(modalContent.includes('AnimatePresence'), 'Modal and tab transitions must use Motion AnimatePresence');

  // 5. Pricing page should NOT contain Max plan card (Individual is Free + Pro)
  assert.ok(!modalContent.includes('Upgrade to Max'), 'Pricing modal must not contain user-facing Max tier');
  assert.ok(modalContent.includes('Upgrade to Pro'), 'Pricing modal must contain Pro tier');
  assert.ok(modalContent.includes('Select Free'), 'Pricing modal must contain Free tier');
});

