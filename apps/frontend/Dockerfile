FROM node:18-alpine

WORKDIR /app/apps/frontend

RUN npm install -g pnpm

# Copy package files
COPY apps/frontend/package.json ./package.json

# Install dependencies directly in frontend folder
RUN pnpm install

# Copy source code
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
COPY apps/frontend/next.config.js ./
COPY apps/frontend/tsconfig.json ./
COPY apps/frontend/tailwind.config.ts ./
COPY apps/frontend/postcss.config.js ./

EXPOSE 3000

CMD ["pnpm", "run", "dev"]