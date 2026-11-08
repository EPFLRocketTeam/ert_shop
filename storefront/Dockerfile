# Next.js storefront.
# The production build (`next build`) runs when the container STARTS, not when
# the image is built: Next.js needs the running backend and its publishable key
# to prerender pages, and those only exist once the backend is up.
# See docker-entrypoint.sh.
FROM node:22-alpine
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN node .yarn/releases/yarn-4.12.0.cjs install --immutable
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["docker-entrypoint.sh"]
