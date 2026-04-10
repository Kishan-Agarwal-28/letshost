FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY . .

ENV NODE_ENV=production
ENV ENV=production
ENV OTEL_SERVICE_NAME=letshost-backend
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
ENV LOG_LEVEL=info

EXPOSE 3000

CMD [ "npm", "start" ]