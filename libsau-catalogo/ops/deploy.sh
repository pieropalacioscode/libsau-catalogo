#!/usr/bin/env bash
# deploy.sh <cliente> [--check|--rollback]
#   (sin opción)  valida, construye la imagen, la sube al VPS, recrea el contenedor y prueba
#   --check       solo valida y muestra qué haría (no cambia nada)
#   --rollback    vuelve a la imagen y al compose anteriores
# Variables opcionales:
#   LIBSAU_VPS    destino SSH (por defecto cabo@10.248.73.1, por WireGuard)
#   TAKEOVER      contenedor que hoy ocupa el puerto: se detiene justo antes de arrancar el nuevo
#                 (migración del LIBPREP viejo; si algo falla, se vuelve a arrancar solo)
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
source "$ROOT/ops/lib.sh"

CLIENT=${1:?uso: deploy.sh <cliente> [--check|--rollback]}
MODE=${2:-deploy}
case $MODE in deploy|--check|--rollback|--local) ;; *) die "opción desconocida: $MODE" ;; esac
TAKEOVER=${TAKEOVER:-}
[ -z "$TAKEOVER" ] || [[ $TAKEOVER =~ ^[a-zA-Z0-9_.-]+$ ]] || die "TAKEOVER inválido"

load_client "$CLIENT" "$ROOT"

VPS=${LIBSAU_VPS:-cabo@10.248.73.1}
DIR=/opt/ladmincabo/web/$SLUG
IMAGE=ladmincabo-web:$SLUG
CONTAINER=ladmincabo-web-$SLUG-web-1
REV=${GIT_REV:-sin-git}
rsh() { ssh -o BatchMode=yes -o ConnectTimeout=8 "$VPS" "$@"; }

render() {
  sed -e "s|@SLUG@|$SLUG|g" -e "s|@PORT@|$PORT|g" \
      -e "s|@MEM_LIMIT@|$MEM_LIMIT|g" -e "s|@CPUS@|$CPUS|g" \
      "$ROOT/ops/compose.tmpl.yml"
}

port_owner() {  # contenedor que publica $PORT; "(fuera de Docker)" si es otro proceso; nada si está libre
  local n o
  n=$(rsh "ss -tlnH 'sport = :$PORT' | wc -l")
  [ "${n:-0}" -gt 0 ] || return 0
  o=$(rsh "sudo docker ps --filter publish=$PORT --format '{{.Names}}'")
  echo "${o:-(fuera de Docker)}"
}

wait_healthy() {
  local i st
  for i in $(seq 1 24); do
    st=$(rsh "sudo docker inspect -f '{{.State.Health.Status}}' $CONTAINER 2>/dev/null" || true)
    if [ "$st" = healthy ]; then echo "   contenedor healthy"; return 0; fi
    sleep 5
  done
  return 1
}

rollback() {
  rsh "sudo docker image inspect $IMAGE-prev >/dev/null 2>&1" || die "no hay imagen $IMAGE-prev a la que volver"
  rsh "cd $DIR && { [ ! -f docker-compose.yml.prev ] || sudo cp -p docker-compose.yml.prev docker-compose.yml; } && sudo docker tag $IMAGE-prev $IMAGE && sudo docker compose up -d --force-recreate"
}

undo_takeover() {
  [ -n "$TAKEOVER" ] || return 1
  rsh "cd $DIR && sudo docker compose down; sudo docker start $TAKEOVER" >/dev/null
}

build_image() {
  docker build -t "$IMAGE" --label "revision=$REV" \
    --build-arg "NEXT_PUBLIC_API_URL=$API_URL" \
    --build-arg "NEXT_PUBLIC_NEGOCIO_SLUG=$SLUG" \
    --build-arg "SITE_URL=https://$DOMAIN" \
    --build-arg "SITE_TITLE=$SITE_TITLE" \
    --build-arg "SITE_DESCRIPTION=$SITE_DESCRIPTION" \
    --build-arg "SITE_TAGLINE=$SITE_TAGLINE" \
    "$ROOT" 2>&1 | tail -6
}

if [ "$MODE" = --local ]; then
  docker info >/dev/null 2>&1 || die "Docker no responde: abre Docker Desktop y espera a que diga running"
  W=$(mktemp -d)
  trap 'docker compose -f "$W/docker-compose.yml" down >/dev/null 2>&1 || true; rm -rf "$W"' EXIT
  echo "== local 1/3 Construyendo $IMAGE (revisión $REV)"
  build_image
  echo "== local 2/3 Arrancando con el mismo compose que producción (puerto $PORT de esta máquina)"
  render > "$W/docker-compose.yml"
  docker compose -f "$W/docker-compose.yml" up -d
  ok=0
  for i in $(seq 1 24); do
    if [ "$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null)" = healthy ]; then ok=1; break; fi
    sleep 5
  done
  if [ "$ok" != 1 ]; then docker logs --tail 20 "$CONTAINER" 2>&1; die "no llegó a healthy en local"; fi
  SMOKE=$ROOT/clients/$SLUG.smoke.sh
  [ -f "$SMOKE" ] || SMOKE=$ROOT/ops/smoke-generic.sh
  echo "== local 3/3 Pruebas ($(basename "$SMOKE")) contra http://127.0.0.1:$PORT"
  out=$(bash "$SMOKE" "http://127.0.0.1:$PORT" || true)
  echo "$out" | grep -E '^FALLA|^TODO OK|^HAY FALLAS' || true
  echo "== registros del contenedor (no debe haber errores de escritura ni EROFS)"
  docker logs --tail 15 "$CONTAINER" 2>&1
  docker inspect -f 'usuario={{.Config.User}} solo-lectura={{.HostConfig.ReadonlyRootfs}} caps-quitadas={{.HostConfig.CapDrop}} seguridad={{.HostConfig.SecurityOpt}} pids={{.HostConfig.PidsLimit}}' "$CONTAINER"
  echo "$out" | grep -q '^TODO OK' || die "pruebas locales con fallas"
  if docker logs "$CONTAINER" 2>&1 | grep -qE 'EROFS|ENOENT|EACCES|Failed to'; then die "errores en los registros del contenedor (ver arriba)"; fi
  echo "== LOCAL OK: imagen y compose funcionan; no se tocó el VPS"
  exit 0
fi

echo "== 0/5 Comprobaciones: $SLUG -> https://$DOMAIN (puerto $PORT, destino $VPS)"
rsh true 2>/dev/null || die "sin acceso SSH a $VPS (¿WireGuard activo? ¿ssh-add?)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/public/$SLUG/filtros" || true)
[ "$code" = 200 ] || die "la API no conoce el negocio '$SLUG' (HTTP $code): créalo primero"

owner=$(port_owner)
if [ -n "$owner" ] && [ "$owner" != "$CONTAINER" ] && [ "$owner" != "$TAKEOVER" ]; then
  if [ "$MODE" = --check ]; then
    echo "   AVISO: el puerto $PORT lo tiene $owner. Para migrar desde ese contenedor: TAKEOVER=$owner"
  else
    die "el puerto $PORT ya lo usa: $owner"
  fi
fi

if [ "$MODE" = --check ]; then
  echo "== compose que se instalaría en $DIR/docker-compose.yml"; render
  if rsh "test -f /etc/nginx/sites-available/ladmincabo-$SLUG.conf"; then
    echo "   nginx: ladmincabo-$SLUG.conf existe"
  else
    echo "   AVISO: falta /etc/nginx/sites-available/ladmincabo-$SLUG.conf"
  fi
  echo "Todo en orden; no se cambió nada."
  exit 0
fi

if [ "$MODE" = --rollback ]; then
  rollback
  wait_healthy || die "tras el rollback el contenedor no llegó a healthy"
  exit 0
fi

docker info >/dev/null 2>&1 || die "Docker no responde: abre Docker Desktop y espera a que diga running"

echo "== 1/5 Construyendo $IMAGE (revisión $REV)"
build_image

echo "== 2/5 Subiendo la imagen (la actual pasa a $IMAGE-prev)"
rsh "sudo docker image inspect $IMAGE >/dev/null 2>&1 && sudo docker tag $IMAGE $IMAGE-prev || true"
docker save "$IMAGE" | gzip | rsh 'gunzip | sudo docker load' | tail -1

echo "== 3/5 Instalando el compose"
rsh "sudo install -d -m 755 $DIR && { [ ! -f $DIR/docker-compose.yml ] || sudo cp -p $DIR/docker-compose.yml $DIR/docker-compose.yml.prev; }"
render | rsh "sudo tee $DIR/docker-compose.yml >/dev/null"

echo "== 4/5 Arrancando"
[ -z "$TAKEOVER" ] || { echo "   deteniendo $TAKEOVER"; rsh "sudo docker stop $TAKEOVER >/dev/null"; }
rsh "cd $DIR && sudo docker compose up -d --force-recreate"

echo "== 5/5 Verificando"
if ! wait_healthy; then
  rsh "sudo docker logs --tail 15 $CONTAINER 2>&1" || true
  if undo_takeover; then die "no llegó a healthy; se volvió a arrancar $TAKEOVER"
  elif rsh "sudo docker image inspect $IMAGE-prev >/dev/null 2>&1"; then rollback; die "no llegó a healthy; se volvió a la versión anterior"
  else die "no llegó a healthy y no hay versión anterior"; fi
fi

SMOKE=$ROOT/clients/$SLUG.smoke.sh
[ -f "$SMOKE" ] || SMOKE=$ROOT/ops/smoke-generic.sh
echo "   pruebas ($(basename "$SMOKE")) contra el contenedor"
out=$(rsh "bash -s -- http://127.0.0.1:$PORT" < "$SMOKE" || true)
echo "$out" | grep -E '^FALLA|^TODO OK|^HAY FALLAS' || true
if echo "$out" | grep -q '^TODO OK'; then
  echo "== LISTO: $SLUG (revisión $REV)"
  echo "   Prueba pública: bash $SMOKE https://$DOMAIN"
else
  echo "== HAY PRUEBAS FALLIDAS; el contenedor nuevo sigue sirviendo."
  if [ -n "$TAKEOVER" ]; then
    echo "   Para volver al anterior: ssh $VPS 'cd $DIR && sudo docker compose down; sudo docker start $TAKEOVER'"
  else
    echo "   Para volver atrás: bash ops/deploy.sh $SLUG --rollback"
  fi
  exit 1
fi
