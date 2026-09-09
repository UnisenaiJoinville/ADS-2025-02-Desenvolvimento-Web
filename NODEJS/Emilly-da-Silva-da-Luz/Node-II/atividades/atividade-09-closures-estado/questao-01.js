function createSequence(start) {
  let value = start;
  return function next() {
    value += 1;
    return value;
  };
}

const nextNumber = createSequence(10);
console.log(nextNumber()); // 11
console.log(nextNumber()); // 12
console.log(nextNumber()); // 13
