exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    name: { type: 'VARCHAR(255)', notNull: true },
    email: { type: 'VARCHAR(255)', notNull: true, unique: true },
    password: { type: 'TEXT', notNull: true },
    role: { type: 'VARCHAR(50)', notNull: true, default: "'user'" },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
