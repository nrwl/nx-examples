const fs = require('fs');
const path = require('path');

/**
 * @param {number} n
 */
function* range(n) {
  for (let i = 0; i < n; i++) {
    yield i;
  }
}

const base = 'dist/node_modules';

fs.mkdirSync(base, { recursive: true });

for (const i of range(100)) {
  fs.mkdirSync(`${base}/repro${i}/node_modules`, { recursive: true });
  for (const j of range(i)) {
    const target = `repro${j}`;
    const directory = `${base}/repro${i}/node_modules`;
    fs.symlinkSync(
      path.relative(directory, `${base}/${target}`),
      `${directory}/${target}`
    );
  }
}
