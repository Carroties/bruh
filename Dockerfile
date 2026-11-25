FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci
COPY . .
RUN npm run db:generate
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["sh", "-c", "npm run db:migrate && npm start"]
