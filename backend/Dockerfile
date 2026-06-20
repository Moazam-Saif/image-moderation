# ── Backend Dockerfile ───────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

# Uploads directory — created at runtime by the app, but ensure it exists
# and is writable in case the image runs as a non-root user later
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/app.js"]
