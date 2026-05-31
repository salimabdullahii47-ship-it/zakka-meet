const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function logConversation(userId, roomId, topic, notes, relatedObject = '', metadata = null) {
  try {
    const entryId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO conversation_logs (id, user_id, room_id, topic, notes, related_object, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(entryId, userId, roomId, topic, notes, relatedObject, metadata ? JSON.stringify(metadata) : null);

    return { success: true, entryId };
  } catch (error) {
    console.error('Error logging conversation:', error);
    return { success: false, error: error.message };
  }
}

function getConversationsForUser(userId, limit = 100) {
  try {
    const conversations = db.prepare(`
      SELECT id, room_id, topic, notes, related_object as relatedObject, metadata, started_at, ended_at
      FROM conversation_logs
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).all(userId, limit);

    return conversations.map(entry => ({
      ...entry,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null
    }));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

module.exports = {
  logConversation,
  getConversationsForUser
};
