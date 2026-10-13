FROM oven/bun:1.4-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run asn && bun run build

FROM oven/bun:1.4-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY --from=build /app/asn.sqlite ./
# The catalogue and the scan worker are read from source at runtime.
COPY src ./src
RUN mkdir /data
# The adapter binds loopback unless told otherwise, which nothing outside the container can reach.
ENV HOST=0.0.0.0 DATABASE_PATH=/data/scorecard.db
EXPOSE 38572
CMD ["bun", "run", "dist/server/entry.mjs"]
