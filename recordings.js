const { v4: uuidv4 } = require('uuid');
const db = require('./db');

// Save recording
function saveRecording(meetingId, userId, filePath, fileSizeMb, durationSeconds) {
  try {
    const recordingId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO recordings (id, meeting_id, user_id, file_path, file_size_mb, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(recordingId, meetingId, userId, filePath, fileSizeMb, durationSeconds);
    return { success: true, recordingId };
  } catch (error) {
    console.error('Error saving recording:', error);
    return { success: false, error: error.message };
  }
}

// Get user's recordings
function getUserRecordings(userId, limit = 50) {
  try {
    const recordings = db.prepare(`
      SELECT r.id, r.meeting_id, r.file_path, r.file_size_mb, r.duration_seconds,
             r.created_at, m.name as meeting_name
      FROM recordings r
      JOIN meetings m ON r.meeting_id = m.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(userId, limit);
    
    return recordings || [];
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return [];
  }
}

// Get recording by ID
function getRecording(recordingId) {
  try {
    const recording = db.prepare(`
      SELECT * FROM recordings WHERE id = ?
    `).get(recordingId);
    
    return recording || null;
  } catch (error) {
    console.error('Error fetching recording:', error);
    return null;
  }
}

// Delete recording
function deleteRecording(recordingId) {
  try {
    const stmt = db.prepare('DELETE FROM recordings WHERE id = ?');
    stmt.run(recordingId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting recording:', error);
    return { success: false, error: error.message };
  }
}

// Log call history
function logCallHistory(callerId, recipientId, meetingId, durationSeconds, recordingId = null) {
  try {
    const callId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO call_history (id, caller_id, recipient_id, meeting_id, duration_seconds, recording_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'completed')
    `);
    
    stmt.run(callId, callerId, recipientId, meetingId, durationSeconds, recordingId);
    return { success: true, callId };
  } catch (error) {
    console.error('Error logging call:', error);
    return { success: false, error: error.message };
  }
}

// Get call history for user
function getCallHistory(userId, limit = 50) {
  try {
    const calls = db.prepare(`
      SELECT ch.id, ch.caller_id, ch.recipient_id, ch.meeting_id, ch.duration_seconds,
             ch.created_at, ch.status, ch.recording_id,
             CASE 
               WHEN ch.caller_id = ? THEN u2.display_name
               ELSE u1.display_name
             END as other_user_name,
             m.name as meeting_name
      FROM call_history ch
      LEFT JOIN users u1 ON ch.caller_id = u1.id
      LEFT JOIN users u2 ON ch.recipient_id = u2.id
      LEFT JOIN meetings m ON ch.meeting_id = m.id
      WHERE ch.caller_id = ? OR ch.recipient_id = ?
      ORDER BY ch.created_at DESC
      LIMIT ?
    `).all(userId, userId, userId, limit);
    
    return calls || [];
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
}

module.exports = {
  saveRecording,
  getUserRecordings,
  getRecording,
  deleteRecording,
  logCallHistory,
  getCallHistory
};
