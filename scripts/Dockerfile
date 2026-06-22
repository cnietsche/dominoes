FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY validate-ws.mjs ./
CMD ["node", "validate-ws.mjs"]
