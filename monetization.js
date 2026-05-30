const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create payment transaction
async function createTransaction(userId, amount, type, description = '') {
  try {
    const transactionId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO transactions (id, user_id, amount, type, description, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `);
    
    stmt.run(transactionId, userId, amount, type, description);
    return { success: true, transactionId };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: error.message };
  }
}

// Process Stripe payment
async function processStripePayment(userId, amount, description) {
  try {
    // This is a placeholder - in production, you'd create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        description
      }
    });

    const transactionId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO transactions (id, user_id, amount, stripe_transaction_id, type, description, status)
      VALUES (?, ?, ?, ?, 'payment', ?, 'pending')
    `);
    
    stmt.run(transactionId, userId, amount, paymentIntent.id, description);
    
    return { 
      success: true, 
      transactionId,
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {
    console.error('Error processing Stripe payment:', error);
    return { success: false, error: error.message };
  }
}

// Complete transaction
function completeTransaction(transactionId) {
  try {
    const stmt = db.prepare(`
      UPDATE transactions 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(transactionId);
    return { success: true };
  } catch (error) {
    console.error('Error completing transaction:', error);
    return { success: false, error: error.message };
  }
}

// Get user transactions
function getUserTransactions(userId, limit = 50) {
  try {
    const transactions = db.prepare(`
      SELECT id, amount, currency, type, status, description, created_at, completed_at
      FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
    
    return transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Calculate usage metrics for billing
function calculateUserUsageMetrics(userId, startDate, endDate) {
  try {
    const metrics = db.prepare(`
      SELECT 
        COUNT(DISTINCT ch.id) as total_calls,
        SUM(ch.duration_seconds) as total_duration_seconds,
        COUNT(DISTINCT r.id) as total_recordings,
        SUM(r.file_size_mb) as total_storage_mb,
        COUNT(DISTINCT m.id) as total_meetings
      FROM meetings m
      LEFT JOIN call_history ch ON m.owner_id = ch.caller_id OR m.owner_id = ch.recipient_id
      LEFT JOIN recordings r ON m.id = r.meeting_id
      WHERE m.owner_id = ? 
        AND m.created_at BETWEEN ? AND ?
    `).get(userId, startDate, endDate);
    
    return metrics || {};
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {};
  }
}

// Pricing plans
const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxParticipants: 2,
    maxMeetingDuration: 40,
    storageGB: 1,
    features: ['Basic video/audio', 'Chat', 'Screen sharing']
  },
  pro: {
    name: 'Professional',
    price: 9.99,
    maxParticipants: 100,
    maxMeetingDuration: null,
    storageGB: 100,
    features: ['All Free features', 'Recording', 'Virtual backgrounds', 'Calendar integration', 'Priority support']
  },
  business: {
    name: 'Business',
    price: 19.99,
    maxParticipants: 500,
    maxMeetingDuration: null,
    storageGB: 500,
    features: ['All Pro features', 'Breakout rooms', 'Analytics', 'API access', 'Dedicated support']
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    maxParticipants: 5000,
    maxMeetingDuration: null,
    storageGB: 5000,
    features: ['All Business features', 'Custom branding', 'SSO', 'Advanced analytics', 'Dedicated account manager']
  }
};

// Get pricing plan
function getPricingPlan(planName) {
  return PRICING_PLANS[planName] || PRICING_PLANS.free;
}

module.exports = {
  createTransaction,
  processStripePayment,
  completeTransaction,
  getUserTransactions,
  calculateUserUsageMetrics,
  PRICING_PLANS,
  getPricingPlan
};
