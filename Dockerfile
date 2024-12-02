# See https://khromov.se/dockerizing-your-sveltekit-applications-a-practical-guide/

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
ENV VITE_SINDIT_BACKEND_API=http://0.0.0.0:9017 \
    VITE_SINDIT_BACKEND_API_BASE_URI=http://
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
