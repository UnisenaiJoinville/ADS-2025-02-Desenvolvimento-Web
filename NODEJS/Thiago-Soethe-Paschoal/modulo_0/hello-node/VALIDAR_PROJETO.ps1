npm install
npx ts-node src/index.ts
npm run typecheck
npm run lint
npm run format:check

docker build -t hello-node .
docker run --rm hello-node
