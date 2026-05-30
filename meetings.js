const { v4: uuidv4 } = require('uuid');
const db = require('./db');

// Create a new meeting
function createMeeting(ownerId, name, isPrivate = false, maxParticipants = 100) {
  try {
    const meetingId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO meetings (id, owner_id, name, is_private, max_participants)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(meetingId, ownerId, name, isPrivate ? 1 : 0, maxParticipants);
    
    return { success: true, meetingId };
  } catch (error) {
    console.error('Error creating meeting:', error);
    return { success: false, error: error.message };
  }
}

// Get meeting by ID
function getMeeting(meetingId) {
  try {
    const meeting = db.prepare(`
      SELECT * FROM meetings WHERE id = ?
    `).get(meetingId);
    return meeting || null;
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return null;
  }
}

// Add participant to meeting
function addParticipant(meetingId, userId) {
  try {
    const stmt = db.prepare(`
      INSERT INTO meeting_participants (meeting_id, user_id)
      VALUES (?, ?)
    `);
    
    stmt.run(meetingId, userId);
    return { success: true };
  } catch (error) {
    console.error('Error adding participant:', error);
    return { success: false, error: error.message };
  }
}

// Remove participant from meeting
function removeParticipant(meetingId, userId) {
  try {
    const stmt = db.prepare(`
      UPDATE meeting_participants 
      SET left_at = CURRENT_TIMESTAMP,
          duration_minutes = CAST((julianday(CURRENT_TIMESTAMP) - julianday(joined_at)) * 1440 AS INTEGER)
      WHERE meeting_id = ? AND user_id = ? AND left_at IS NULL
    `);
    
    stmt.run(meetingId, userId);
    return { success: true };
  } catch (error) {
    console.error('Error removing participant:', error);
    return { success: false, error: error.message };
  }
}

// Get active participants in a meeting
function getActiveParticipants(meetingId) {
  try {
    const participants = db.prepare(`
      SELECT mp.user_id, u.display_name, u.username, mp.joined_at
      FROM meeting_participants mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.meeting_id = ? AND mp.left_at IS NULL
    `).all(meetingId);
    
    return participants || [];
  } catch (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
}

// End meeting
function endMeeting(meetingId) {
  try {
    const stmt = db.prepare(`
      UPDATE meetings 
      SET ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(meetingId);
    return { success: true };
  } catch (error) {
    console.error('Error ending meeting:', error);
    return { success: false, error: error.message };
  }
}

// Get user's meeting history
function getUserMeetingHistory(userId, limit = 50) {
  try {
    const meetings = db.prepare(`
      SELECT DISTINCT m.id, m.name, m.owner_id, m.created_at, m.ended_at,
             CAST((julianday(COALESCE(m.ended_at, CURRENT_TIMESTAMP)) - julianday(m.created_at)) * 1440 AS INTEGER) as duration_minutes,
             COUNT(DISTINCT mp.user_id) as participant_count
      FROM meetings m
      LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE m.owner_id = ? OR m.id IN (
        SELECT meeting_id FROM meeting_participants WHERE user_id = ?
      )
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(userId, userId, limit);
    
    return meetings || [];
  } catch (error) {
    console.error('Error fetching meeting history:', error);
    return [];
  }
}

module.exports = {
  createMeeting,
  getMeeting,
  addParticipant,
  removeParticipant,
  getActiveParticipants,
  endMeeting,
  getUserMeetingHistory
};
