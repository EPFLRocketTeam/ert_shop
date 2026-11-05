# Medusa backend - one image for both the "server" and "worker" containers
# (MEDUSA_WORKER_MODE decides which role a container plays).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN node .yarn/releases/yarn-4.12.0.cjs install --immutable
COPY . .
RUN node .yarn/releases/yarn-4.12.0.cjs build

FROM node:22-alpine
ENV NODE_ENV=production
# `medusa build` outputs a standalone server (incl. built admin) in .medusa/server
WORKDIR /app
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev --no-audit --no-fund
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 9000
ENTRYPOINT ["docker-entrypoint.sh"]
