# Stage 1: Build the Angular application
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build:prod

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy built assets from build stage
COPY --from=build /app/dist/ndr-korelasyon-motoru-frontend /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]