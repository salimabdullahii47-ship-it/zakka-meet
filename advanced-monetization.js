// ==========================================
// === ADVANCED MONETIZATION MODULE ===
// ==========================================

const pricingTiers = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      maxParticipants: 2,
      recordingEnabled: false,
      maxDuration: 60, // minutes
      aiSubtitles: false,
      phoneIntegration: false,
      sectorModules: []
    }
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    billingCycle: 'month',
    features: {
      maxParticipants: 10,
      recordingEnabled: true,
      maxDuration: 480,
      aiSubtitles: true,
      phoneIntegration: false,
      sectorModules: []
    }
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 29.99,
    billingCycle: 'month',
    features: {
      maxParticipants: 100,
      recordingEnabled: true,
      maxDuration: null,
      aiSubtitles: true,
      phoneIntegration: true,
      sectorModules: ['education', 'healthcare']
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99.99,
    billingCycle: 'month',
    features: {
      maxParticipants: 1000,
      recordingEnabled: true,
      maxDuration: null,
      aiSubtitles: true,
      phoneIntegration: true,
      sectorModules: ['education', 'healthcare', 'finance', 'communication'],
      customBranding: true,
      apiAccess: true,
      dedicatedSupport: true
    }
  }
};

class MonetizationEngine {
  constructor() {
    this.subscriptions = {};
    this.transactions = [];
    this.users = {};
    this.microTransactions = [];
    this.usageMeters = {};
    this.escrowAccounts = {};
    this.splitPayments = [];
    this.whiteLabelLicenses = [];
  }

  // ========== SUBSCRIPTION MANAGEMENT ==========
  async createSubscription(userId, tierId, paymentMethodId) {
    const tier = pricingTiers[tierId] || pricingTiers.BASIC;
    
    const subscription = {
      id: `sub-${Date.now()}`,
      userId: userId,
      tier: tierId,
      price: tier.price,
      features: tier.features,
      status: 'active',
      startDate: new Date().toISOString(),
      renewalDate: this.calculateRenewalDate(tier.billingCycle),
      autoRenew: true,
      paymentMethodId: paymentMethodId
    };

    this.subscriptions[userId] = subscription;
    
    // Create initial transaction
    const transaction = {
      id: `txn-${Date.now()}`,
      type: 'subscription',
      amount: tier.price,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString(),
      relatedSubscription: subscription.id
    };
    
    this.transactions.push(transaction);
    
    return subscription;
  }

  calculateRenewalDate(billingCycle) {
    const date = new Date();
    if (billingCycle === 'month') date.setMonth(date.getMonth() + 1);
    else if (billingCycle === 'year') date.setFullYear(date.getFullYear() + 1);
    return date.toISOString();
  }

  upgradeSubscription(userId, newTierId) {
    const oldSub = this.subscriptions[userId];
    const newTier = pricingTiers[newTierId];
    
    if (oldSub && newTier) {
      const priceDifference = newTier.price - oldSub.price;
      
      oldSub.tier = newTierId;
      oldSub.features = newTier.features;
      oldSub.price = newTier.price;
      
      if (priceDifference > 0) {
        // Charge difference
        this.logTransaction(userId, 'upgrade', priceDifference, `Upgrade to ${newTierId}`);
      }
      
      return oldSub;
    }
  }

  // ========== MICRO-TRANSACTIONS ==========
  async processMicroTransaction(userId, itemId, amount, itemType) {
    const transaction = {
      id: `micro-${Date.now()}`,
      userId: userId,
      itemId: itemId,
      itemType: itemType, // 'premium_filter', 'ai_feature', 'storage', etc.
      amount: amount,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    this.microTransactions.push(transaction);
    
    // Record usage
    if (!this.users[userId]) this.users[userId] = { balance: 0 };
    this.users[userId].balance += amount;
    
    return transaction;
  }

  // ========== USAGE-BASED METERING ==========
  initializeUsageMeter(userId) {
    if (!this.usageMeters[userId]) {
      this.usageMeters[userId] = {
        recordingMinutes: 0,
        storageGB: 0,
        phoneCallMinutes: 0,
        aiTranscriptionMinutes: 0,
        apiRequests: 0,
        currentPeriodStart: new Date().toISOString(),
        costs: {}
      };
    }
  }

  recordUsage(userId, metricType, amount) {
    this.initializeUsageMeter(userId);
    
    const meter = this.usageMeters[userId];
    
    switch(metricType) {
      case 'recording':
        meter.recordingMinutes += amount;
        meter.costs.recording = (meter.recordingMinutes * 0.10); // $0.10 per minute
        break;
      case 'storage':
        meter.storageGB += amount;
        meter.costs.storage = (meter.storageGB * 0.50); // $0.50 per GB
        break;
      case 'phonecall':
        meter.phoneCallMinutes += amount;
        meter.costs.phonecall = (meter.phoneCallMinutes * 0.05); // $0.05 per minute
        break;
      case 'transcription':
        meter.aiTranscriptionMinutes += amount;
        meter.costs.transcription = (meter.aiTranscriptionMinutes * 0.25); // $0.25 per minute
        break;
      case 'api':
        meter.apiRequests += amount;
        meter.costs.api = Math.max(0, (meter.apiRequests - 10000) * 0.001); // $0.001 per request over 10k
        break;
    }
    
    return meter;
  }

  calculateUsageBill(userId) {
    const meter = this.usageMeters[userId];
    if (!meter) return 0;
    
    const totalCost = Object.values(meter.costs).reduce((a, b) => a + b, 0);
    return parseFloat(totalCost.toFixed(2));
  }

  // ========== PREMIUM FEATURE TOGGLES ==========
  getFeatureAccess(userId, featureName) {
    const subscription = this.subscriptions[userId];
    if (!subscription) return false;
    
    return subscription.features[featureName] || false;
  }

  hasFeatureAccess(userId, featureName) {
    return this.getFeatureAccess(userId, featureName);
  }

  // ========== SPLIT PAYMENT / ESCROW ==========
  async initializeEscrow(paymentId, amount, parties) {
    const escrow = {
      id: `escrow-${Date.now()}`,
      paymentId: paymentId,
      totalAmount: amount,
      parties: parties.map(p => ({
        userId: p.userId,
        percentage: p.percentage,
        amount: (amount * p.percentage / 100),
        status: 'held'
      })),
      status: 'held',
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.escrowAccounts[escrow.id] = escrow;
    return escrow;
  }

  async releaseSplitPayment(escrowId, releaseCondition = 'manual') {
    const escrow = this.escrowAccounts[escrowId];
    if (!escrow) return null;

    escrow.status = 'released';
    escrow.completedAt = new Date().toISOString();

    // Distribute funds to parties
    escrow.parties.forEach(party => {
      this.logTransaction(party.userId, 'escrow_release', party.amount, `Split payment release`);
    });

    return escrow;
  }

  // ========== WHITE LABEL LICENSING ==========
  createWhiteLabelLicense(partnerName, features, expirationDate) {
    const license = {
      id: `wl-${Date.now()}`,
      partnerName: partnerName,
      customDomain: `${partnerName.toLowerCase().replace(/\s/g, '-')}.zakkameet.com`,
      features: features,
      status: 'active',
      createdAt: new Date().toISOString(),
      expirationDate: expirationDate,
      licenseKey: this.generateLicenseKey(),
      usersLimit: 10000,
      branding: {
        logo: null,
        colors: {},
        customTerms: null
      }
    };

    this.whiteLabelLicenses.push(license);
    return license;
  }

  generateLicenseKey() {
    return 'WL-' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // ========== TRANSACTION LOGGING ==========
  logTransaction(userId, type, amount, description) {
    const transaction = {
      id: `txn-${Date.now()}`,
      userId: userId,
      type: type,
      amount: amount,
      description: description,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    this.transactions.push(transaction);
    return transaction;
  }

  getUserTransactionHistory(userId) {
    return this.transactions.filter(t => t.userId === userId);
  }

  // ========== REVENUE ANALYTICS ==========
  getMonthlyRecurringRevenue(month = null) {
    const date = month ? new Date(month) : new Date();
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    
    return Object.values(this.subscriptions)
      .filter(sub => new Date(sub.startDate).getMonth() === monthNum)
      .reduce((total, sub) => total + sub.price, 0);
  }

  getTotalRevenue() {
    return this.transactions
      .filter(t => t.status === 'completed')
      .reduce((total, txn) => total + txn.amount, 0);
  }

  getRevenueByType() {
    const breakdown = {};
    this.transactions.forEach(txn => {
      if (!breakdown[txn.type]) breakdown[txn.type] = 0;
      breakdown[txn.type] += txn.amount;
    });
    return breakdown;
  }
}

module.exports = {
  pricingTiers,
  MonetizationEngine,
  monetizationEngine: new MonetizationEngine()
};
