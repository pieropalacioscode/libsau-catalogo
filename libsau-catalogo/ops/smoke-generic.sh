#!/usr/bin/env bash
# Comprobaciones que valen para cualquier cliente. Uso: smoke-generic.sh URL_BASE
H=${1:?uso: smoke-generic.sh URL_BASE}
FAIL=0
code()  { curl -s -o /dev/null -w "%{http_code}" "$H$1"; }
body()  { curl -s "$H$1"; }
check() { if [ "$2" = "$3" ]; then echo "ok     $1"; else echo "FALLA  $1: obtuve [$2], esperaba [$3]"; FAIL=1; fi; }

check "portada 200"                       "$(code /)" 200
check "robots.txt 200"                    "$(code /robots.txt)" 200
check "sitemap.xml 200"                   "$(code /sitemap.xml)" 200
check "pagina fuera de rango -> 404"      "$(code '/?pagina=99999')" 404
check "pagina=1 redirige"                 "$(code '/?pagina=1')" 307
check "orden invalido redirige"           "$(code '/?orden=hack')" 307
check "categoria inexistente 404"         "$(code '/categoria/no-existe-xyz')" 404
check "portada sin noindex"               "$(body / | grep -ci noindex)" 0
n=$(body '/?q=zzzz' | grep -ci noindex)
check "busqueda con noindex"              "$([ "$n" -ge 1 ] && echo si || echo no)" si
check "buscar: 200"                       "$(code '/api/buscar?q=ab')" 200
check "buscar: 1 letra no consulta"       "$(body '/api/buscar?q=a' | grep -c '"items":\[\]')" 1
check "buscar: no expone sku/costo/stock" "$(body '/api/buscar?q=ab' | grep -ciE '"(sku|cost|stock)"')" 0

[ $FAIL = 0 ] && echo "TODO OK" || echo "HAY FALLAS"
exit $FAIL
