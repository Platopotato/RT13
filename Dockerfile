# Use Node 18 as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application (if needed)
RUN npm run build

# Create production image
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data

# Create app directory and data volume
WORKDIR /app
RUN mkdir -p /data && \
    chown -R node:node /data

# Create a non-root user for security
USER node

# Copy built application from builder stage
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/server.js ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/lib ./lib
COPY --from=builder --chown=node:node /app/components ./components
COPY --from=builder --chown=node:node /app/*.ts ./
COPY --from=builder --chown=node:node /app/*.tsx ./

# Create volume for persistent data
VOLUME ["/data"]

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
