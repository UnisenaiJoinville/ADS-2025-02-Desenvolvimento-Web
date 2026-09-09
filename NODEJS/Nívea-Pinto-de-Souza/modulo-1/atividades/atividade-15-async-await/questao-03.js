async function doubleValue() {
  const value = await Promise.resolve(42);
  return value * 2;
}

console.log(await doubleValue()); // 84
