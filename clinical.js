const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function submitClinicalTest(userId, meetingId, testType, details = '') {
  try {
    const testId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO clinical_tests (id, user_id, meeting_id, test_type, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(testId, userId, meetingId, testType, details);

    return { success: true, testId };
  } catch (error) {
    console.error('Error submitting clinical test:', error);
    return { success: false, error: error.message };
  }
}

function getClinicalTestsForUser(userId, limit = 100) {
  try {
    const tests = db.prepare(`
      SELECT id, meeting_id as meetingId, test_type as testType, details, result_summary as resultSummary,
             status, created_at as createdAt, completed_at as completedAt
      FROM clinical_tests
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    return tests || [];
  } catch (error) {
    console.error('Error fetching clinical tests:', error);
    return [];
  }
}

module.exports = {
  submitClinicalTest,
  getClinicalTestsForUser
};
