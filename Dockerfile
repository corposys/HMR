# Frontend Dockerfile - Development with Vite
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Puerto de desarrollo de Vite
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5173', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Comando de desarrollo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
