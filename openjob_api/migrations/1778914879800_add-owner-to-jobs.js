exports.up = (pgm) => {
  pgm.addColumns('jobs', {
    owner: {
      type: 'VARCHAR(50)',
      references: '"users"',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('jobs', ['owner']);
};
