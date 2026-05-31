// ==========================================
// === ACCESSIBILITY MODULE ===
// ==========================================

const accessibilityModes = {
  highContrast: false,
  largeText: false,
  screenReaderMode: false,
  reduceMotion: false,
  colorBlindMode: 'normal', // normal, protanopia, deuteranopia, tritanopia
  fontSize: 16,
  fontFamily: 'sans-serif',
  lineHeight: 1.5,
  letterSpacing: 0
};

const chromaticVisionModes = {
  normal: { name: 'Normal Vision', filters: 'none' },
  protanopia: { name: 'Red Blind', filters: 'url(#protanopia-filter)' },
  deuteranopia: { name: 'Green Blind', filters: 'url(#deuteranopia-filter)' },
  tritanopia: { name: 'Blue Blind', filters: 'url(#tritanopia-filter)' },
  achromatopsia: { name: 'Complete Color Blindness', filters: 'grayscale(1)' }
};

const hapticPatterns = {
  success: [50, 100, 50],      // tap, rest, tap
  error: [200, 100, 200],      // long, rest, long
  warning: [100, 50, 100, 50, 100], // pattern
  notification: [30, 30, 30],  // quick triple tap
  heartbeat: [100, 100, 100, 100, 200] // da-da-DUM
};

const acousticPitchScaling = {
  low: 0.8,
  normal: 1.0,
  high: 1.2,
  veryHigh: 1.5
};

function saveAccessibilityPreferences(prefs) {
  localStorage.setItem('zakka_accessibility', JSON.stringify(prefs));
}

function loadAccessibilityPreferences() {
  const saved = localStorage.getItem('zakka_accessibility');
  return saved ? JSON.parse(saved) : accessibilityModes;
}

function applyAccessibilityMode(mode, enabled) {
  const prefs = loadAccessibilityPreferences();
  prefs[mode] = enabled;
  saveAccessibilityPreferences(prefs);
  
  // Apply to DOM
  if (mode === 'highContrast') {
    document.body.classList.toggle('high-contrast', enabled);
  } else if (mode === 'largeText') {
    document.body.classList.toggle('large-text', enabled);
  } else if (mode === 'screenReaderMode') {
    document.body.classList.toggle('sr-mode', enabled);
  } else if (mode === 'reduceMotion') {
    document.body.classList.toggle('reduce-motion', enabled);
  }
}

function setColorBlindMode(mode) {
  const prefs = loadAccessibilityPreferences();
  prefs.colorBlindMode = mode;
  saveAccessibilityPreferences(prefs);
  
  const html = document.documentElement;
  Object.keys(chromaticVisionModes).forEach(m => {
    html.classList.remove(`vision-${m}`);
  });
  html.classList.add(`vision-${mode}`);
}

function triggerHapticFeedback(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function setAcousticPitchScale(scale) {
  // Apply pitch transformation to audio elements
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.playbackRate = acousticPitchScaling[scale] || 1.0;
  });
}

module.exports = {
  accessibilityModes,
  chromaticVisionModes,
  hapticPatterns,
  acousticPitchScaling,
  saveAccessibilityPreferences,
  loadAccessibilityPreferences,
  applyAccessibilityMode,
  setColorBlindMode,
  triggerHapticFeedback,
  setAcousticPitchScale
};
