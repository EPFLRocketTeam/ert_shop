# Next.js storefront. NEXT_PUBLIC_* values are inlined at build time,
# so they must be passed as build args (Dokploy: "Build-time variables").
FROM node:22-alpine AS build
WORKDIR /app
ARG MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION=ch
ARG NEXT_PUBLIC_STRIPE_KEY
ENV MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN node .yarn/releases/yarn-4.12.0.cjs install --immutable
COPY . .
RUN node .yarn/releases/yarn-4.12.0.cjs build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app ./
EXPOSE 8000
CMD ["node", ".yarn/releases/yarn-4.12.0.cjs", "start"]
