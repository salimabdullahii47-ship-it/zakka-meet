// ==========================================
// === AI BEHAVIORAL ANALYTICS MODULE ===
// ==========================================

class AIBehavioralAnalytics {
  constructor() {
    this.userBehavior = {};
    this.sessionAnalytics = [];
    this.engagementMetrics = {};
    this.predictions = [];
    this.anomalyDetection = [];
    this.recommendations = {};
  }

  // Track User Behavior
  trackUserActivity(userId, activityType, metadata = {}) {
    if (!this.userBehavior[userId]) {
      this.userBehavior[userId] = {
        totalSessions: 0,
        activities: [],
        engagementScore: 0,
        lastActive: null,
        deviceInfo: {}
      };
    }

    const activity = {
      id: `activity-${Date.now()}`,
      type: activityType, // 'login', 'call', 'message', 'setting_change', etc.
      timestamp: new Date().toISOString(),
      metadata: metadata,
      duration: metadata.duration || 0
    };

    this.userBehavior[userId].activities.push(activity);
    this.userBehavior[userId].lastActive = new Date().toISOString();

    return activity;
  }

  // Analyze Engagement Patterns
  analyzeEngagementPatterns(userId) {
    const user = this.userBehavior[userId];
    if (!user) return null;

    const activities = user.activities;
    const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const activityTypes = {};
    const timeDistribution = {};

    activities.forEach(activity => {
      activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
      
      const hour = new Date(activity.timestamp).getHours();
      timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;
    });

    const engagement = {
      userId: userId,
      analysisDate: new Date().toISOString(),
      metrics: {
        totalActivities: activities.length,
        totalDuration: totalDuration,
        averageSessionDuration: totalDuration / Math.max(1, activities.length),
        activityFrequency: activityTypes,
        peakHours: Object.entries(timeDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour, count]) => ({ hour: parseInt(hour), count })),
        engagementScore: Math.min(100, (activities.length / 10) * 100) // Normalize to 0-100
      },
      patterns: {
        isPowerUser: activities.length > 50,
        isRegularUser: activities.length > 10 && activities.length <= 50,
        isInactiveUser: activities.length <= 10,
        preferredTimes: Object.entries(timeDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([hour]) => `${hour}:00`)
      }
    };

    this.engagementMetrics[userId] = engagement;
    return engagement;
  }

  // Predict User Churn Risk
  predictChurnRisk(userId) {
    const user = this.userBehavior[userId];
    if (!user) return { riskScore: 0, risk: 'unknown' };

    const lastActive = new Date(user.lastActive);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const recentActivities = user.activities.slice(-10).length;

    let riskScore = 0;

    // Factors that increase churn risk
    if (daysSinceActive > 30) riskScore += 40;
    else if (daysSinceActive > 14) riskScore += 20;
    else if (daysSinceActive > 7) riskScore += 10;

    if (recentActivities < 2) riskScore += 30;
    else if (recentActivities < 5) riskScore += 15;

    if (user.activities.length < 5) riskScore += 20;

    const prediction = {
      userId: userId,
      churnRiskScore: Math.min(100, riskScore),
      churnRisk: riskScore > 60 ? 'high' : riskScore > 35 ? 'medium' : 'low',
      recommendedActions: this.getRetentionRecommendations(riskScore),
      predictedChurnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: 0.75
    };

    this.predictions.push(prediction);
    return prediction;
  }

  getRetentionRecommendations(riskScore) {
    if (riskScore > 60) {
      return [
        'Send personalized onboarding email',
        'Offer premium feature trial',
        'Schedule direct support call',
        'Provide exclusive discount'
      ];
    } else if (riskScore > 35) {
      return [
        'Send feature update newsletter',
        'Highlight new capabilities',
        'Suggest relevant use cases'
      ];
    }
    return ['Continue regular engagement'];
  }

  // Anomaly Detection
  detectAnomalies(userId) {
    const user = this.userBehavior[userId];
    if (!user || user.activities.length < 10) return [];

    const anomalies = [];
    const recentActivities = user.activities.slice(-10);
    const avgDuration = recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / recentActivities.length;

    recentActivities.forEach(activity => {
      // Anomaly 1: Unusually long session
      if ((activity.duration || 0) > avgDuration * 3) {
        anomalies.push({
          type: 'long_session',
          activity: activity.id,
          severity: 'low',
          description: `Unusually long ${activity.type} session detected`
        });
      }

      // Anomaly 2: Unusual time of activity
      const hour = new Date(activity.timestamp).getHours();
      if (hour < 6 || hour > 23) {
        anomalies.push({
          type: 'unusual_time',
          activity: activity.id,
          severity: 'low',
          description: `Activity at unusual time: ${hour}:00`
        });
      }

      // Anomaly 3: Multiple failed attempts
      if (activity.metadata && activity.metadata.failed) {
        anomalies.push({
          type: 'failed_attempt',
          activity: activity.id,
          severity: 'medium',
          description: 'Multiple failed authentication attempts'
        });
      }
    });

    this.anomalyDetection.push({
      userId: userId,
      timestamp: new Date().toISOString(),
      anomalies: anomalies
    });

    return anomalies;
  }

  // AI-Powered Recommendations
  generateAIRecommendations(userId) {
    const engagement = this.engagementMetrics[userId];
    const user = this.userBehavior[userId];

    if (!user) return [];

    const recommendations = [];

    // Feature recommendations based on usage
    const usedFeatures = Object.keys(user.activities.reduce((acc, a) => {
      acc[a.type] = true;
      return acc;
    }, {}));

    if (!usedFeatures.includes('screenshare')) {
      recommendations.push({
        feature: 'Screen Sharing',
        reason: 'Enhance collaboration in your meetings',
        value: 'high',
        priority: 1
      });
    }

    if (!usedFeatures.includes('recording')) {
      recommendations.push({
        feature: 'Meeting Recording',
        reason: 'Save important meetings for future reference',
        value: 'high',
        priority: 2
      });
    }

    if (engagement && engagement.patterns.isPowerUser && !usedFeatures.includes('api_access')) {
      recommendations.push({
        feature: 'API Access',
        reason: 'Automate workflows as a power user',
        value: 'high',
        priority: 1
      });
    }

    this.recommendations[userId] = recommendations;
    return recommendations;
  }

  // User Segmentation
  segmentUsers() {
    const segments = {
      powerUsers: [],
      regularUsers: [],
      occasionalUsers: [],
      inactiveUsers: [],
      atRiskUsers: []
    };

    Object.entries(this.engagementMetrics).forEach(([userId, metrics]) => {
      const score = metrics.metrics.engagementScore;
      
      if (score >= 80) {
        segments.powerUsers.push(userId);
      } else if (score >= 50) {
        segments.regularUsers.push(userId);
      } else if (score >= 20) {
        segments.occasionalUsers.push(userId);
      } else {
        segments.inactiveUsers.push(userId);
      }

      // Add churn risk
      const churnRisk = this.predictions.find(p => p.userId === userId);
      if (churnRisk && churnRisk.churnRisk === 'high') {
        segments.atRiskUsers.push(userId);
      }
    });

    return segments;
  }

  // Session Quality Analysis
  analyzeSessionQuality(sessionId, metrics) {
    const quality = {
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
      metrics: {
        connectionStability: metrics.packetLoss ? (100 - metrics.packetLoss) : 95,
        audioQuality: metrics.audioMOS || 4.5, // Mean Opinion Score
        videoQuality: metrics.videoFPS || 30,
        latency: metrics.latency || 50, // ms
        jitter: metrics.jitter || 10 // ms
      },
      overallQualityScore: 0,
      recommendations: []
    };

    // Calculate overall quality
    const scores = [
      quality.metrics.connectionStability,
      quality.metrics.audioQuality * 20,
      Math.min(quality.metrics.videoQuality, 30),
      Math.max(0, 100 - quality.metrics.latency),
      Math.max(0, 100 - quality.metrics.jitter)
    ];

    quality.overallQualityScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);

    // Generate recommendations
    if (quality.metrics.connectionStability < 90) {
      quality.recommendations.push('Check your network connection');
    }
    if (quality.metrics.latency > 100) {
      quality.recommendations.push('High latency detected - try moving closer to router');
    }
    if (quality.metrics.jitter > 30) {
      quality.recommendations.push('Network instability detected - reduce other network usage');
    }

    return quality;
  }

  // Get Insights Dashboard
  getInsightsDashboard(userId) {
    return {
      userId: userId,
      generatedAt: new Date().toISOString(),
      engagementMetrics: this.engagementMetrics[userId] || null,
      churnRiskPrediction: this.predictions.find(p => p.userId === userId) || null,
      anomalies: this.anomalyDetection.filter(a => a.userId === userId),
      recommendations: this.recommendations[userId] || [],
      segments: this.segmentUsers()
    };
  }
}

module.exports = {
  AIBehavioralAnalytics,
  analyticsEngine: new AIBehavioralAnalytics()
};
