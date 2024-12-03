# Use an official Node.js image as the base
FROM node:22-alpine AS build

ENV VITE_SINDIT_BACKEND_API=http://0.0.0.0:9017 \
    VITE_SINDIT_BACKEND_API_BASE_URI=http://

# Set the working directory inside the container
WORKDIR /app

COPY package*.json ./
RUN rm -rf node_modules
RUN rm -rf build
COPY . .
RUN npm install
RUN npm run build

# Use node to serve the app
FROM node:lts-slim AS runtime

WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/build ./build
RUN npm install --omit=dev

# Expose the port the app runs on
EXPOSE 5173

# Start the app
ENTRYPOINT ["npm", "run", "start"]
