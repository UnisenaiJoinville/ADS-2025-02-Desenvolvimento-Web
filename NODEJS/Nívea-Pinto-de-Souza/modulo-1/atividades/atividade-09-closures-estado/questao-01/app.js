function createSequence(start) {
  let value = start;

  return function () {
    value += 1;
    return value;
  };
}

const nextNumber = createSequence(10);

console.log(nextNumber());
console.log(nextNumber());
console.log(nextNumber());