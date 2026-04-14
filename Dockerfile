FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/web ./apps/web
COPY tsconfig.json ./

RUN npm install
RUN cd apps/web && npm run build

EXPOSE 3000
CMD ["npm", "run", "preview", "--workspace=web"]