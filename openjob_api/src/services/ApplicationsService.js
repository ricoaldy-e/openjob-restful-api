const { nanoid } = require('nanoid');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');
const ClientError = require('../exceptions/ClientError');

class ApplicationsService {
  async addApplication({ user_id, job_id, status = 'pending' }) {
    const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1', [job_id]);
    if (!jobCheck.rows.length) {
      throw new ClientError('Job not found');
    }

    const dupCheck = await pool.query(
      'SELECT id FROM applications WHERE user_id = $1 AND job_id = $2',
      [user_id, job_id],
    );
    if (dupCheck.rows.length > 0) {
      throw new ClientError('You have already applied for this job');
    }

    const id = `app-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO applications (id, user_id, job_id, status) VALUES ($1, $2, $3, $4) RETURNING id, user_id, job_id, status',
      values: [id, user_id, job_id, status],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getApplications() {
    const result = await pool.query(`
      SELECT a.id, a.user_id, a.job_id, a.status, a.created_at,
             j.title, j.description AS job_description, j.company_id, j.category_id,
             j.job_type, j.experience_level, j.location_type,
             j.location_city
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
    `);
    return result.rows;
  }

  async getApplicationById(id) {
    const query = {
      text: `SELECT a.id, a.user_id, a.job_id, a.status, a.created_at,
                    j.title, j.description AS job_description, j.company_id, j.category_id,
                    j.job_type, j.experience_level, j.location_type,
                    j.location_city
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = $1`,
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Application not found');
    }

    return result.rows[0];
  }

  async getApplicationsByUserId(userId) {
    const query = {
      text: `SELECT a.id, a.user_id, a.job_id, a.status, a.created_at,
                    j.title, j.description AS job_description, j.company_id, j.category_id,
                    j.job_type, j.experience_level, j.location_type,
                    j.location_city
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.user_id = $1`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getApplicationsByJobId(jobId) {
    const query = {
      text: `SELECT a.id, a.user_id, a.job_id, a.status, a.created_at,
                    j.title, j.description AS job_description, j.company_id, j.category_id,
                    j.job_type, j.experience_level, j.location_type,
                    j.location_city
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.job_id = $1`,
      values: [jobId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async editApplicationById(id, { status }) {
    const query = {
      text: 'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, user_id, job_id',
      values: [status, id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Application not found');
    }

    return result.rows[0];
  }

  async deleteApplicationById(id) {
    const query = {
      text: 'DELETE FROM applications WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Application not found');
    }
  }

  async getApplicationsByUserIdWithJobs(userId) {
    const query = {
      text: `SELECT a.id, a.user_id, a.job_id, a.status, a.created_at,
                    j.title, j.description, j.company_id, j.category_id,
                    j.job_type, j.experience_level, j.location_type,
                    j.location_city, j.salary_min, j.salary_max
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.user_id = $1`,
      values: [userId],
    };
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = ApplicationsService;
