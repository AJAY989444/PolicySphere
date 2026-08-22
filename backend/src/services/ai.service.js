const prisma = require('../config/db');

class AIService {
  /**
   * Process natural language query and recommend matched policies or FAQ response.
   */
  static async processChatQuery(userMessage, conversationHistory = []) {
    const text = userMessage.toLowerCase();

    // Fetch active policies for matching
    const policies = await prisma.insurancePolicy.findMany({
      where: { isActive: true },
    });

    let reply = '';
    let recommendedPolicies = [];

    // Category detection
    let matchedCategory = null;
    if (text.includes('health') || text.includes('hospital') || text.includes('medical') || text.includes('doctor')) {
      matchedCategory = 'HEALTH';
    } else if (text.includes('life') || text.includes('term') || text.includes('death') || text.includes('family security')) {
      matchedCategory = 'LIFE';
    } else if (text.includes('motor') || text.includes('car') || text.includes('bike') || text.includes('vehicle') || text.includes('auto')) {
      matchedCategory = 'MOTOR';
    } else if (text.includes('travel') || text.includes('flight') || text.includes('trip') || text.includes('abroad')) {
      matchedCategory = 'TRAVEL';
    } else if (text.includes('home') || text.includes('house') || text.includes('tenant') || text.includes('rent')) {
      matchedCategory = 'HOME';
    }

    // FAQ Intent handling
    if (text.includes('claim') || text.includes('how to claim')) {
      reply = "To submit an insurance claim on PolicySphere:\n1. Go to the Claims page from your top menu.\n2. Click 'Submit New Claim' and select your active policy.\n3. Upload incident details and evidence documents.\n4. Our advisor team will review and update your status within 24 hours!";
    } else if (text.includes('tax') || text.includes('80c') || text.includes('deduction')) {
      reply = "Yes! Insurance policies on PolicySphere offer substantial tax savings:\n• Health Insurance: Deduction up to ₹25,000 under Section 80D.\n• Life Insurance: Premiums tax-exempt up to ₹1,50,000 under Section 80C.\n• You can download your official tax certificate directly from your Dashboard!";
    } else if (text.includes('certificate') || text.includes('download')) {
      reply = "You can view and download your official Digital Policy Certificate anytime! Go to your Dashboard, locate your active policy, and click the 'Certificate' button to view or print as PDF.";
    } else if (matchedCategory) {
      recommendedPolicies = policies.filter((p) => p.category === matchedCategory).slice(0, 3);
      reply = `Here are our top recommended **${matchedCategory}** insurance plans tailored for your needs:`;
    } else if (text.includes('cheap') || text.includes('affordable') || text.includes('budget') || text.includes('low premium')) {
      recommendedPolicies = [...policies].sort((a, b) => a.premium - b.premium).slice(0, 3);
      reply = "Here are our most budget-friendly insurance plans offering maximum value at low annual premiums:";
    } else {
      // Default intelligent response with curated recommendations
      recommendedPolicies = policies.slice(0, 3);
      reply = "Hello! I am **SphereAI**, your 24/7 personal insurance advisor. I can help you find the best coverage, calculate instant quotes, explain claim procedures, or answer tax benefit questions. Here are a few top-rated plans you might like:";
    }

    return {
      reply,
      recommendedPolicies: recommendedPolicies.map((p) => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        category: p.category,
        premium: p.premium,
        coverageAmount: p.coverageAmount,
        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
      })),
    };
  }
}

module.exports = AIService;
