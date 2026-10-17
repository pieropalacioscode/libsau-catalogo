# ops/lib.sh — funciones comunes de despliegue. Se carga con `source`.

die() { echo "ERROR: $*" >&2; exit 1; }

# Lee clients/<slug>.env SIN ejecutarlo (solo CLAVE=valor con claves permitidas) y lo valida.
# Deja SLUG, DOMAIN, PORT, API_URL, SITE_*, MEM_LIMIT y CPUS como variables.
load_client() {
  local slug=$1 root=$2 file line k v other dom
  [[ $slug =~ ^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$ ]] || die "slug inválido '$slug' (minúsculas, números y guiones)"
  file=$root/clients/$slug.env
  [ -f "$file" ] || die "no existe $file"

  SLUG="" DOMAIN="" PORT="" API_URL="" SITE_TITLE="" SITE_DESCRIPTION="" SITE_TAGLINE=""
  MEM_LIMIT=384m CPUS=0.5
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    case $line in ''|'#'*) continue ;; esac
    [[ $line == *=* ]] || die "$file: línea sin '=': $line"
    k=${line%%=*}
    v=${line#*=}
    case $k in
      SLUG|DOMAIN|PORT|API_URL|SITE_TITLE|SITE_DESCRIPTION|SITE_TAGLINE|MEM_LIMIT|CPUS) printf -v "$k" '%s' "$v" ;;
      *) die "$file: clave no permitida '$k'" ;;
    esac
  done < "$file"

  [ "$SLUG" = "$slug" ] || die "$file: SLUG='$SLUG' no coincide con el nombre del archivo"
  [[ $DOMAIN =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || die "$file: DOMAIN inválido"
  [[ $PORT =~ ^30(0[1-9]|[1-9][0-9])$ ]] || die "$file: PORT debe estar entre 3001 y 3099"
  [[ $API_URL =~ ^https://[a-z0-9.-]+$ ]] || die "$file: API_URL debe ser https://dominio, sin barra final"
  [[ $MEM_LIMIT =~ ^[0-9]{2,4}m$ ]] || die "$file: MEM_LIMIT debe ser como 384m"
  [[ $CPUS =~ ^[0-9](\.[0-9]{1,2})?$ ]] || die "$file: CPUS debe ser como 0.5"
  for k in SITE_TITLE SITE_DESCRIPTION SITE_TAGLINE; do
    v=${!k}
    [ -n "$v" ] || die "$file: falta $k"
    [ "${#v}" -le 300 ] || die "$file: $k pasa de 300 caracteres"
    if [[ $v =~ [[:cntrl:]] ]]; then die "$file: $k tiene caracteres de control"; fi
  done

  dom=${DOMAIN//./\\.}
  for other in "$root"/clients/*.env; do
    [ "$other" = "$file" ] && continue
    if grep -qE "^PORT=$PORT[[:space:]]*$" "$other"; then die "el puerto $PORT ya lo usa $(basename "$other")"; fi
    if grep -qE "^DOMAIN=$dom[[:space:]]*$" "$other"; then die "el dominio $DOMAIN ya lo usa $(basename "$other")"; fi
  done
  return 0
}
