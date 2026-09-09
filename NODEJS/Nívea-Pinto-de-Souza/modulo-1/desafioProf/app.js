function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return items.slice(start, end);
}

const items = Array.from(
  { length: 25 },
  (_, index) => ({
    id: index + 1,
    name: `Serviço ${index + 1}`
  })
);

console.log(paginate(items, 1, 10));
console.log(paginate(items, 2, 10));
console.log(paginate(items, 3, 10));