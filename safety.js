// ==========================================
// === SAFETY & ALERTS MODULE ===
// ==========================================

const alertTypes = {
  CRITICAL_DANGER: 'critical_danger',
  ENVIRONMENTAL_HAZARD: 'environmental_hazard',
  GEOFENCE_BREACH: 'geofence_breach',
  INTRUSION_ALERT: 'intrusion_alert',
  ASSET_THREAT: 'asset_threat',
  AUTOMATED_SOS: 'automated_sos',
  MEDICAL_EMERGENCY: 'medical_emergency'
};

const hazardCategories = {
  FIRE: 'fire',
  FLOOD: 'flood',
  EARTHQUAKE: 'earthquake',
  TOXIC_GAS: 'toxic_gas',
  WEATHER_EXTREME: 'weather_extreme',
  POWER_OUTAGE: 'power_outage',
  NETWORK_FAILURE: 'network_failure'
};

class SafetyManager {
  constructor() {
    this.activeAlerts = [];
    this.geofences = [];
    this.emergencyContacts = [];
    this.assetTracking = {};
    this.sosHistory = [];
    this.deviceLocation = null;
  }

  // ========== CRITICAL DANGER ALERTS ==========
  async triggerCriticalDangerAlert(severity, description, location) {
    const alert = {
      id: `alert-${Date.now()}`,
      type: alertTypes.CRITICAL_DANGER,
      severity: severity, // 'low', 'medium', 'high', 'critical'
      description: description,
      location: location || this.deviceLocation,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    this.activeAlerts.push(alert);
    this.broadcastAlert(alert);
    this.notifyEmergencyContacts(alert);
    this.logAlertToServer(alert);
    
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 100, 500, 100, 500]); // SOS pattern
    }
    
    return alert;
  }

  // ========== ENVIRONMENTAL HAZARD BROADCAST ==========
  async broadcastEnvironmentalHazard(hazardType, severity, affectedArea, details) {
    const hazard = {
      id: `hazard-${Date.now()}`,
      type: alertTypes.ENVIRONMENTAL_HAZARD,
      hazardType: hazardType, // fire, flood, earthquake, etc.
      severity: severity,
      affectedArea: affectedArea,
      details: details,
      timestamp: new Date().toISOString(),
      broadcasted: false
    };
    
    this.activeAlerts.push(hazard);
    
    // Broadcast to all meeting participants
    this.broadcastToRoom(hazard);
    
    // Alert local emergency services (mock)
    this.alertEmergencyServices(hazard);
    
    return hazard;
  }

  // ========== GEOFENCE BREACH DETECTION ==========
  setGeofence(id, latitude, longitude, radiusMeters, name = 'Geofence') {
    const geofence = {
      id: id,
      latitude: latitude,
      longitude: longitude,
      radius: radiusMeters,
      name: name,
      createdAt: new Date().toISOString(),
      breachAlerts: []
    };
    this.geofences.push(geofence);
  }

  async checkGeofenceBreach(currentLat, currentLon) {
    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(
        geofence.latitude, geofence.longitude,
        currentLat, currentLon
      );
      
      if (distance > geofence.radius) {
        const breachAlert = {
          id: `breach-${Date.now()}`,
          type: alertTypes.GEOFENCE_BREACH,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          distanceMeters: distance,
          userLocation: { lat: currentLat, lon: currentLon },
          timestamp: new Date().toISOString()
        };
        
        geofence.breachAlerts.push(breachAlert);
        this.activeAlerts.push(breachAlert);
        this.notifyGeofenceBreach(breachAlert);
        
        return breachAlert;
      }
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ========== INTRUSION & ASSET THREAT ALERTS ==========
  async triggerIntrusionAlert(location, severity, details) {
    const alert = {
      id: `intrusion-${Date.now()}`,
      type: alertTypes.INTRUSION_ALERT,
      severity: severity,
      location: location,
      details: details,
      timestamp: new Date().toISOString(),
      respondedAt: null
    };
    
    this.activeAlerts.push(alert);
    this.broadcastAlert(alert);
    this.notifySecurityTeam(alert);
    
    return alert;
  }

  async triggerAssetThreatAlert(assetId, threatType, severity) {
    const alert = {
      id: `asset-threat-${Date.now()}`,
      type: alertTypes.ASSET_THREAT,
      assetId: assetId,
      threatType: threatType, // theft, damage, unauthorized_access
      severity: severity,
      timestamp: new Date().toISOString()
    };
    
    this.activeAlerts.push(alert);
    this.broadcastAlert(alert);
    
    return alert;
  }

  // ========== AUTOMATED SOS BROADCAST ==========
  async triggerAutomatedSOS(reason, emergencyType = 'general') {
    const sos = {
      id: `sos-${Date.now()}`,
      type: alertTypes.AUTOMATED_SOS,
      reason: reason,
      emergencyType: emergencyType, // medical, security, fire, environmental
      userLocation: this.deviceLocation,
      timestamp: new Date().toISOString(),
      status: 'active',
      respondents: []
    };
    
    this.sosHistory.push(sos);
    this.activeAlerts.push(sos);
    
    // Broadcast SOS to all connected users
    this.broadcastSOSToAll(sos);
    
    // Auto-call emergency services
    this.callEmergencyServices(sos);
    
    // Send SOS signal
    this.sendSOSSignal(sos);
    
    return sos;
  }

  // ========== HELPER FUNCTIONS ==========
  broadcastAlert(alert) {
    // This will be integrated with Socket.IO
    console.log('🚨 Broadcasting alert:', alert);
  }

  broadcastToRoom(hazard) {
    console.log('📢 Broadcasting environmental hazard to room:', hazard);
  }

  notifyEmergencyContacts(alert) {
    console.log('📞 Notifying emergency contacts:', this.emergencyContacts);
  }

  notifyGeofenceBreach(alert) {
    console.log('🚨 Geofence breach detected:', alert);
  }

  notifySecurityTeam(alert) {
    console.log('🛡️ Security team notified:', alert);
  }

  broadcastSOSToAll(sos) {
    console.log('🆘 SOS broadcast to all users:', sos);
  }

  callEmergencyServices(sos) {
    console.log('📞 Calling emergency services for:', sos);
  }

  sendSOSSignal(sos) {
    console.log('📡 SOS signal transmitted:', sos);
  }

  alertEmergencyServices(hazard) {
    console.log('🚒 Emergency services alerted:', hazard);
  }

  logAlertToServer(alert) {
    console.log('📊 Alert logged to server:', alert);
  }

  // ========== MEDICAL EMERGENCY ==========
  async triggerMedicalEmergency(symptoms, severity) {
    const alert = {
      id: `medical-${Date.now()}`,
      type: alertTypes.MEDICAL_EMERGENCY,
      symptoms: symptoms,
      severity: severity, // mild, moderate, severe, critical
      timestamp: new Date().toISOString()
    };
    
    this.activeAlerts.push(alert);
    this.notifyEmergencyContacts(alert);
    
    return alert;
  }

  getActiveAlerts() {
    return this.activeAlerts.filter(a => a.status !== 'resolved');
  }

  resolveAlert(alertId) {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
    }
  }
}

module.exports = {
  SafetyManager,
  alertTypes,
  hazardCategories,
  safetyManager: new SafetyManager()
};
