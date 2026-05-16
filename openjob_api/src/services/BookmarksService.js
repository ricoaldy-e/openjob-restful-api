const { nanoid } = require('nanoid');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');

class BookmarksService {
  async addBookmark({ user_id, job_id }) {
    const id = `bookmark-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO bookmarks (id, user_id, job_id) VALUES ($1, $2, $3) RETURNING id',
      values: [id, user_id, job_id],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getBookmarksByUserId(userId) {
    const query = {
      text: `SELECT b.id, b.user_id, b.job_id, b.created_at,
                    j.company_id, j.category_id, j.title, j.description,
                    j.job_type, j.experience_level, j.location_type,
                    j.location_city, j.salary_min, j.salary_max,
                    j.is_salary_visible, j.status,
                    c.name AS company_name, c.location AS company_location
             FROM bookmarks b
             JOIN jobs j ON b.job_id = j.id
             JOIN companies c ON j.company_id = c.id
             WHERE b.user_id = $1`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getBookmarkById(id) {
    const query = {
      text: 'SELECT * FROM bookmarks WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Bookmark not found');
    }

    return result.rows[0];
  }

  async deleteBookmarkByUserAndJob(userId, jobId) {
    const query = {
      text: 'DELETE FROM bookmarks WHERE user_id = $1 AND job_id = $2 RETURNING id',
      values: [userId, jobId],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Bookmark not found');
    }
  }
}

module.exports = BookmarksService;
