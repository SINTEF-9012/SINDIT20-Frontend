# Use an official Node.js image as the base
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the project (optional for Svelte, React, Vue, etc.)
RUN npm run build

# Expose the port on which your app will run
EXPOSE 5173

# Command to run your application
CMD ["npm", "run", "dev"]
