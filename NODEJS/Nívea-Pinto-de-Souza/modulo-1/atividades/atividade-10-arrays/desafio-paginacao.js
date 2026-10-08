function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

const items = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: `Serviço ${index + 1}`,
}));

console.log("Página 1:", paginate(items, 1, 10));
console.log("Página 2:", paginate(items, 2, 10));
console.log("Página 3:", paginate(items, 3, 10));
