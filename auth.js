const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'zakka-meet-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

// Generate unique user ID
function generateUserId() {
  return uuidv4();
}

// Generate JWT for a user
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Hash password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Register user
async function registerUser(username, email, password, displayName = null) {
  try {
    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    const userId = generateUserId();
    const passwordHash = await hashPassword(password);

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(userId, username, email, passwordHash, displayName || username);

    // Create user preferences
    const prefStmt = db.prepare(`
      INSERT INTO user_preferences (user_id) VALUES (?)
    `);
    prefStmt.run(userId);

    return { 
      success: true, 
      userId,
      message: 'User registered successfully'
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user
async function loginUser(email, password) {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return { success: false, error: 'Invalid password' };
    }

    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      userId: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        gender: user.gender,
        language: user.language,
        timezone: user.timezone
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Get user by ID
function getUserById(userId) {
  try {
    const user = db.prepare(`
      SELECT id, username, email, display_name as displayName, 
             gender, language, timezone, created_at
      FROM users WHERE id = ?
    `).get(userId);
    return user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Update user preferences
function updateUserPreferences(userId, preferences) {
  try {
    const updates = [];
    const values = [];
    
    Object.keys(preferences).forEach(key => {
      if (key !== 'user_id') {
        updates.push(`${key} = ?`);
        values.push(preferences[key]);
      }
    });
    
    values.push(userId);
    
    const query = `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { success: false, error: error.message };
  }
}

// Get user preferences
function getUserPreferences(userId) {
  try {
    const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
    return prefs || null;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const verification = verifyToken(token);
  if (!verification.valid) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.userId = verification.decoded.userId;
  next();
}

module.exports = {
  generateUserId,
  hashPassword,
  verifyPassword,
  registerUser,
  loginUser,
  generateToken,
  verifyToken,
  getUserById,
  updateUserPreferences,
  getUserPreferences,
  authenticateToken
};
