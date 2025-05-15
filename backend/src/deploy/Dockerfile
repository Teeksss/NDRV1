FROM node:18-alpine As build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production


FROM node:18-alpine As production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy built assets from the build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Create log directory
RUN mkdir -p logs

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]