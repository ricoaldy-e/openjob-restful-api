exports.up = (pgm) => {
  pgm.addColumns('applications', {
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('applications', ['created_at']);
};
