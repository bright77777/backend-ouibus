function generateArray(n, totalseat) {
  if (n > totalseat - 1 || n < 1) {
    throw new Error('n must be between 1 and totalseat - 1');
  }

  const set = new Set();
  while (set.size < n) {
    set.add(Math.floor(Math.random() * (totalseat - 1)) + 2);
  }

  const resultArray = Array.from(set);
  return resultArray;
}

module.exports = { generateArray };
