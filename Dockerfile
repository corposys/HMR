# Frontend Dockerfile - Development with Vite
FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency files first (for better caching)
COPY package*.json ./

# Install dependencies (this creates node_modules in container)
RUN npm install

# Copy only necessary files (not node_modules, handled by volume)
COPY index.html ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY src ./src
COPY public ./public 2>/dev/null || true
COPY components.json ./

# Create vite temp directory
RUN mkdir -p node_modules/.vite-temp && \
    chown -R node:node /app/node_modules/.vite-temp

# Non-root user
USER node

EXPOSE 5173

# Healthcheck with proper dependency verification
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

# Development command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]