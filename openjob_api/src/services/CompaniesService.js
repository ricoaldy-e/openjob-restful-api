const { nanoid } = require('nanoid');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');

class CompaniesService {
  async addCompany({ name, location, description }) {
    const id = `company-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO companies (id, name, location, description) VALUES ($1, $2, $3, $4) RETURNING id',
      values: [id, name, location, description],
    };
    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getCompanies() {
    const result = await pool.query('SELECT * FROM companies');
    return result.rows;
  }

  async getCompanyById(id) {
    const query = {
      text: 'SELECT * FROM companies WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Company not found');
    }

    return result.rows[0];
  }

  async editCompanyById(id, { name, location, description }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (location !== undefined) { fields.push(`location = $${idx++}`); values.push(location); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }

    if (fields.length === 0) {
      throw new NotFoundError('Company not found');
    }

    values.push(id);
    const query = {
      text: `UPDATE companies SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id`,
      values,
    };

    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Company not found');
    }
  }

  async deleteCompanyById(id) {
    const query = {
      text: 'DELETE FROM companies WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Company not found');
    }
  }
}

module.exports = CompaniesService;
