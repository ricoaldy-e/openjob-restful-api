const { nanoid } = require('nanoid');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');

class JobsService {
  async addJob(payload) {
    const id = `job-${nanoid(16)}`;
    const {
      company_id, category_id, title, description,
      job_type, experience_level, location_type, location_city,
      owner,
    } = payload;

    const query = {
      text: `INSERT INTO jobs (id, company_id, category_id, title, description, job_type, experience_level, location_type, location_city, salary_min, salary_max, is_salary_visible, status, owner)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      values: [id, company_id, category_id, title, description,
        job_type || null, experience_level || null, location_type || null, location_city || null,
        salary_min || null, salary_max || null,
        is_salary_visible !== undefined ? is_salary_visible : true,
        status || null, owner],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getJobs({ title, companyName } = {}) {
    let queryText = `SELECT jobs.*
                     FROM jobs
                     LEFT JOIN companies ON jobs.company_id = companies.id`;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (title && title.trim() !== '') {
      conditions.push(`jobs.title ILIKE $${idx++}`);
      values.push(`%${title}%`);
    }

    if (companyName && companyName.trim() !== '') {
      conditions.push(`companies.name ILIKE $${idx++}`);
      values.push(`%${companyName}%`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await pool.query({ text: queryText, values });
    return result.rows;
  }

  async getJobById(id) {
    const query = {
      text: `SELECT * FROM jobs WHERE id = $1`,
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Job not found');
    }

    return result.rows[0];
  }

  async getJobsByCompanyId(companyId) {
    const query = {
      text: 'SELECT * FROM jobs WHERE company_id = $1',
      values: [companyId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async getJobsByCategoryId(categoryId) {
    const query = {
      text: 'SELECT * FROM jobs WHERE category_id = $1',
      values: [categoryId],
    };
    const result = await pool.query(query);
    return result.rows;
  }

  async editJobById(id, payload) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = ['title', 'description', 'company_id', 'category_id', 'job_type', 'experience_level', 'location_type', 'location_city', 'salary_min', 'salary_max', 'is_salary_visible', 'status'];

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(payload[field]);
      }
    }

    if (fields.length === 0) {
      throw new NotFoundError('Job not found');
    }

    values.push(id);
    const query = {
      text: `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
      values,
    };

    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Job not found');
    }
  }

  async deleteJobById(id) {
    const query = {
      text: 'DELETE FROM jobs WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Job not found');
    }
  }
}

module.exports = JobsService;
