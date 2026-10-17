#!/usr/bin/env bash
# Uso: smoke.sh URL_BASE   (catálogo de LIBPREP: 61 productos, 24 por página)
H=${1:?uso: smoke.sh URL_BASE}
FAIL=0
code()  { curl -s -o /dev/null -w "%{http_code}" "$H$1"; }
cards() { curl -s "$H$1" | grep -o 'href="/productos/[^"]*"' | sort -u | wc -l | tr -d ' '; }
has()   { curl -s "$H$1" | grep -c "$2" | tr -d ' '; }
# Cuenta etiquetas <meta robots ... noindex>, no líneas: Next parte el HTML en varios fragmentos.
tag()   { curl -s "$H$1" | grep -o '<meta name="robots"[^>]*noindex' | wc -l | tr -d ' '; }
check() { if [ "$2" = "$3" ]; then echo "ok     $1"; else echo "FALLA  $1: obtuve [$2], esperaba [$3]"; FAIL=1; fi; }

check "portada 200"                      "$(code /)" 200
check "portada: 24 tarjetas"             "$(cards /)" 24
check "pagina 2: 24 tarjetas"            "$(cards '/?pagina=2')" 24
check "pagina 3: 13 tarjetas"            "$(cards '/?pagina=3')" 13
check "pagina 4 fuera de rango -> 404"   "$(code '/?pagina=4')" 404
check "pagina=1 redirige"                "$(code '/?pagina=1')" 307
check "orden invalido redirige"          "$(code '/?orden=hack')" 307
check "portada sin noindex"              "$(tag /)" 0
check "busqueda con noindex"             "$(tag '/?q=lobo')" 1
check "pagina 2 con canonical propio"    "$(has '/?pagina=2' 'rel=\"canonical\" href=\"[^\"]*pagina=2\"')" 1
check "pagina 1 con rel=next"            "$(has / 'rel=\"next\"')" 1
check "pagina 2 con rel=prev"            "$(has '/?pagina=2' 'rel=\"prev\"')" 1
check "pagina 2 con aria-current"        "$(has '/?pagina=2' 'aria-current=\"page\"')" 1
check "caja de busqueda en el encabezado" "$(has / 'name=\"q\"')" 1
check "busqueda sin resultados: 200"     "$(code '/?q=zzzzqqq')" 200
check "categoria existente 200"          "$(code /categoria/ciencia-para-ninos)" 200
check "categoria: 1 tarjeta"             "$(cards /categoria/ciencia-para-ninos)" 1
check "categoria inexistente 404"        "$(code /categoria/no-existe)" 404
check "categoria pagina 2 fuera de rango" "$(code '/categoria/ciencia-para-ninos?pagina=2')" 404
check "id viejo sigue en 308"            "$(code /productos/1)" 308
check "ficha de producto 200"            "$(code /productos/caperucita-roja-arianna-candell)" 200
api()   { curl -s "$H$1"; }
check "buscar: 200"                      "$(code '/api/buscar?q=cientificas')" 200
check "buscar: encuentra el libro"       "$(api '/api/buscar?q=cientificas' | grep -c 'cientificas-del-peru')" 1
check "buscar: con tildes (científicas)" "$(api '/api/buscar?q=cient%C3%ADficas' | grep -c 'cientificas-del-peru')" 1
check "buscar: 1 letra no consulta"      "$(api '/api/buscar?q=a' | grep -c '"items":\[\]')" 1
check "buscar: sugiere categoria"        "$(api '/api/buscar?q=ciencia' | grep -c 'ciencia-para-ninos')" 1
check "buscar: no expone sku/costo/stock" "$(api '/api/buscar?q=cientificas' | grep -ciE '"(sku|cost|stock)"')" 0
check "filtros: boton hamburguesa"        "$(api '/' | grep -o 'aria-haspopup="dialog"' | wc -l)" 1
check "filtros: panel ofrece Editorial"   "$(api '/' | grep -o 'value="Editorial:Bruño"' | wc -l)" 1
check "filtros: sin filtro no hay casillas marcadas" "$(api '/' | grep -o 'checked=""' | wc -l)" 0
check "filtros: la casilla elegida sale marcada"     "$(api '/?f=Editorial:Bru%C3%B1o' | grep -o 'checked=""' | wc -l)" 1
check "filtros: Editorial:Bruño reduce el listado"   "$(n=$(api '/?f=Editorial:Bru%C3%B1o' | grep -o 'href="/productos/[^"]*"' | sort -u | wc -l); [ "$n" -ge 1 ] && [ "$n" -lt 24 ] && echo ok || echo "no($n)")" ok
check "filtros: f invalido redirige"      "$(curl -s -o /dev/null -w '%{http_code}' "$H/?f=sinvalor")" 307
check "filtros: precio invertido redirige" "$(curl -s -o /dev/null -w '%{http_code}' "$H/?precio_min=20&precio_max=10")" 307
[ $FAIL = 0 ] && echo "TODO OK" || echo "HAY FALLAS"
