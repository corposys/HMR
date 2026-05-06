# Frontend Dockerfile - Development with Vite
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY components.json ./
COPY src ./src
COPY public ./public

RUN mkdir -p node_modules/.vite && \
    chown -R node:node /app

USER node

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]