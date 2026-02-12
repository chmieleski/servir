FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY libs/web/feature-home/package.json libs/web/feature-home/package.json
COPY libs/web/ui/package.json libs/web/ui/package.json
COPY libs/shared/config/package.json libs/shared/config/package.json
COPY libs/shared/contracts/package.json libs/shared/contracts/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm nx build @servir/web

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
WORKDIR /workspace
COPY --from=build /workspace ./
EXPOSE 3000
CMD ["pnpm", "--dir", "apps/web", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
