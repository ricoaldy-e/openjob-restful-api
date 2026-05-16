exports.up = (pgm) => {
  pgm.addColumns('companies', {
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addColumns('categories', {
    description: { type: 'TEXT' },
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.addColumns('bookmarks', {
    created_at: { type: 'TIMESTAMP', notNull: true, default: pgm.func('NOW()') },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('companies', ['created_at', 'updated_at']);
  pgm.dropColumns('categories', ['description', 'created_at']);
  pgm.dropColumns('bookmarks', ['created_at']);
};
