import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface FeedbackRow {
  type: string;
  message: string;
  screen_path?: string | null;
  url?: string | null;
  user_agent?: string | null;
  app_version?: string | null;
  viewport?: string | null;
  referrer?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  can_contact?: boolean;
  email?: string | null;
  severity?: string | null;
  steps_to_reproduce?: string | null;
  expected_result?: string | null;
  actual_result?: string | null;
  user_intent?: string | null;
  expectation?: string | null;
  problem_solved?: string | null;
  target_user?: string | null;
  value_rating?: string | null;
  screenshot_url?: string | null;
  ip_hash?: string | null;
}

export async function insertFeedback(row: FeedbackRow): Promise<string | null> {
  try {
    const result = await pool.query(
      `INSERT INTO feedback (
        type, message, screen_path, url, user_agent, app_version,
        viewport, referrer, user_id, session_id,
        can_contact, email,
        severity, steps_to_reproduce, expected_result, actual_result,
        user_intent, expectation,
        problem_solved, target_user, value_rating,
        screenshot_url, ip_hash
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING id`,
      [
        row.type, row.message, row.screen_path, row.url, row.user_agent, row.app_version,
        row.viewport, row.referrer, row.user_id, row.session_id,
        row.can_contact || false, row.email,
        row.severity, row.steps_to_reproduce, row.expected_result, row.actual_result,
        row.user_intent, row.expectation,
        row.problem_solved, row.target_user, row.value_rating,
        row.screenshot_url, row.ip_hash,
      ]
    );
    return result.rows[0]?.id || null;
  } catch (err) {
    console.error('Feedback DB insert error:', err);
    return null;
  }
}

export async function markEmailFailed(id: string): Promise<void> {
  try {
    await pool.query('UPDATE feedback SET email_sent = false WHERE id = $1', [id]);
  } catch (err) {
    console.error('Feedback email_sent update error:', err);
  }
}

export async function getRecentFeedback(limit = 50): Promise<any[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM feedback ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (err) {
    console.error('Feedback fetch error:', err);
    return [];
  }
}
