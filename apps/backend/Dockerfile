FROM node:18-alpine

WORKDIR /app/apps/backend

RUN npm install -g pnpm @nestjs/cli

# Copy package files
COPY apps/backend/package.json ./package.json

# Install dependencies directly in backend folder
RUN pnpm install

# Copy source code
COPY apps/backend/src ./src
COPY apps/backend/tsconfig*.json ./
COPY apps/backend/nest-cli.json ./
COPY apps/backend/drizzle.config.ts ./

EXPOSE 3001

CMD ["npx", "nest", "start", "--watch"]