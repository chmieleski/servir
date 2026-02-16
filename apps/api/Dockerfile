FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/server/core/package.json libs/server/core/package.json
COPY libs/server/core-billing/package.json libs/server/core-billing/package.json
COPY libs/server/core-auth/package.json libs/server/core-auth/package.json
COPY libs/server/data-access/package.json libs/server/data-access/package.json
COPY libs/server/feature-access/package.json libs/server/feature-access/package.json
COPY libs/server/feature-billing/package.json libs/server/feature-billing/package.json
COPY libs/server/feature-health/package.json libs/server/feature-health/package.json
COPY libs/shared/config/package.json libs/shared/config/package.json
COPY libs/shared/contracts/package.json libs/shared/contracts/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm nx build @servir/api --configuration=production

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /workspace
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
