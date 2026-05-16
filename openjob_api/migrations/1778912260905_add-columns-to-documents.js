exports.up = (pgm) => {
  pgm.addColumns('documents', {
    original_name: { type: 'VARCHAR(255)' },
    size: { type: 'INTEGER' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('documents', ['original_name', 'size']);
};
