# Development image: Node with the project's dependencies; the source is mounted at /app.
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 5173
CMD ["sh", "-c", "npx vite --host 0.0.0.0 --port ${DEV_PORT:-5173}"]
