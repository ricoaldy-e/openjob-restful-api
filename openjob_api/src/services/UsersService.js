const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const pool = require('../utils/pool');
const NotFoundError = require('../exceptions/NotFoundError');
const ClientError = require('../exceptions/ClientError');

class UsersService {
  async addUser({ name, email, password, role = 'user' }) {
    const checkQuery = {
      text: 'SELECT id FROM users WHERE email = $1',
      values: [email],
    };
    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows.length > 0) {
      throw new ClientError('Email already exists');
    }

    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = {
      text: 'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, email, hashedPassword, role],
    };

    const result = await pool.query(query);
    return result.rows[0].id;
  }

  async getUserById(id) {
    const query = {
      text: 'SELECT id, name, email, role FROM users WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  async verifyUserCredential(email, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE email = $1',
      values: [email],
    };

    const result = await pool.query(query);

    if (!result.rows.length) {
      throw new ClientError('Invalid credentials', 401);
    }

    const { id, password: hashedPassword } = result.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new ClientError('Invalid credentials', 401);
    }

    return id;
  }
}

module.exports = UsersService;
