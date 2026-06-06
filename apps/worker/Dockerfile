FROM node:22-slim
RUN apt-get update && apt-get install -y ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN npm install && npm run build -w @studio/core && npm run build -w @studio/worker
CMD ["node", "apps/worker/dist/index.js", "serve"]
