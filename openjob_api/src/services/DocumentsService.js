const { nanoid } = require('nanoid');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');

class DocumentsService {
  async addDocument({ filename, url, original_name, size }) {
    const id = `doc-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO documents (id, filename, url, original_name, size) VALUES ($1, $2, $3, $4, $5) RETURNING id, filename, original_name, size',
      values: [id, filename, url, original_name, size],
    };
    const result = await pool.query(query);
    return result.rows[0];
  }

  async getDocuments() {
    const result = await pool.query('SELECT * FROM documents');
    return result.rows;
  }

  async getDocumentById(id) {
    const query = {
      text: 'SELECT * FROM documents WHERE id = $1',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Document not found');
    }

    return result.rows[0];
  }

  async deleteDocumentById(id) {
    const query = {
      text: 'DELETE FROM documents WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Document not found');
    }
  }
}

module.exports = DocumentsService;
