# Multi-stage build to keep the final image small and aligned with Bun 1.3.4
FROM oven/bun:1.3.4 AS base
WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install

COPY src ./src

EXPOSE 3000
ENV PORT=3000

CMD ["bun", "run", "src/index.ts"]
