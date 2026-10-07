# Dockerfile — sitio de catálogo (Next.js standalone). Contexto: la carpeta libsau-catalogo.

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Valores fijados en el build (las páginas se generan aquí con datos reales de la API).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_NEGOCIO_SLUG
ARG SITE_URL
ARG SITE_TITLE
ARG SITE_DESCRIPTION
ARG SITE_TAGLINE
ENV NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    NEXT_PUBLIC_NEGOCIO_SLUG="$NEXT_PUBLIC_NEGOCIO_SLUG" \
    SITE_URL="$SITE_URL" \
    SITE_TITLE="$SITE_TITLE" \
    SITE_DESCRIPTION="$SITE_DESCRIPTION" \
    SITE_TAGLINE="$SITE_TAGLINE" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Las ARG de la etapa builder no se heredan: se redeclaran aquí para que
# el servidor en marcha (revalidate: 60) siga viendo estos valores.
ARG SITE_URL
ARG SITE_TITLE
ARG SITE_DESCRIPTION
ARG SITE_TAGLINE
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    SITE_URL="$SITE_URL" \
    SITE_TITLE="$SITE_TITLE" \
    SITE_DESCRIPTION="$SITE_DESCRIPTION" \
    SITE_TAGLINE="$SITE_TAGLINE"

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 3000
CMD ["node", "server.js"]