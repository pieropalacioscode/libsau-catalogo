#!/usr/bin/env bash
# deploy-vps.sh — construye la imagen del sitio de LIBPREP, la sube al VPS por SSH
# y recrea el contenedor. Se corre desde WSL, dentro de libsau-catalogo:
#
#   bash deploy-vps.sh
#
# Solo contiene valores públicos (no hay claves ni contraseñas).
set -euo pipefail
cd "$(dirname "$0")"

VPS="root@179.197.71.5"
IMAGE="libsau-web:libprep"
SITE="https://libprep.docentesmart.com"

[ -f Dockerfile ] && [ -f .dockerignore ] || { echo "Faltan Dockerfile o .dockerignore"; exit 1; }

echo "== 1/4 Construyendo $IMAGE"
docker build -t "$IMAGE" \
  --build-arg NEXT_PUBLIC_API_URL=https://catalogo-api.docentesmart.com \
  --build-arg NEXT_PUBLIC_NEGOCIO_SLUG=libprep \
  --build-arg SITE_URL="$SITE" \
  --build-arg SITE_TITLE="LIBPREP | Libros infantiles, educativos y literatura bajo demanda" \
  --build-arg SITE_DESCRIPTION="Encuentra libros infantiles, educativos, escolares y literatura en LIBPREP. Preparamos tu libro bajo demanda y lo entregamos listo para leer." \
  --build-arg SITE_TAGLINE="Encuentra el libro que buscas. Nosotros lo preparamos" \
  . 2>&1 | tail -6

echo "== 2/4 Subiendo la imagen al VPS"
ssh "$VPS" 'docker tag libsau-web:libprep libsau-web:libprep-prev 2>/dev/null || true'
docker save "$IMAGE" | gzip | ssh "$VPS" 'gunzip | docker load'

echo "== 3/4 Recreando el contenedor"
ssh "$VPS" 'cd /opt/libsau-web && docker compose up -d --force-recreate && sleep 10 && docker compose ps'

echo "== 4/4 Verificando $SITE"
curl -s "$SITE/" | grep -oE '<title>[^<]*</title>'
curl -s -o /dev/null -w "robots.txt: %{http_code}\n" "$SITE/robots.txt"
curl -s -o /dev/null -w "sitemap.xml: %{http_code}\n" "$SITE/sitemap.xml"