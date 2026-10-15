const test = require("node:test");
const assert = require("node:assert/strict");
const c = require("../.test-out/catalog-query.js");

const plain = (s) => ({ ...s, filters: Object.entries(s.filters) });

test("sin parámetros: estado vacío y sin redirección", () => {
  const { state, needsRedirect } = c.parseCatalogQuery({});
  assert.equal(needsRedirect, false);
  assert.deepEqual(plain(state), { q: "", page: 1, sort: null, filters: [], minPrice: null, maxPrice: null });
});

test("q se normaliza, se recorta y un q vacío redirige", () => {
  let r = c.parseCatalogQuery({ q: "  hola   mundo " });
  assert.equal(r.state.q, "hola mundo");
  assert.equal(r.needsRedirect, true);
  r = c.parseCatalogQuery({ q: "ñ".repeat(150) });
  assert.equal([...r.state.q].length, 100);
  assert.equal(c.parseCatalogQuery({ q: "" }).needsRedirect, true);
  assert.equal(c.parseCatalogQuery({ q: "lobo" }).needsRedirect, false);
});

test("pagina: válida sin redirección; inválida o redundante redirige a la 1", () => {
  const cases = [["2", 2, false], ["1", 1, true], ["abc", 1, true], ["0", 1, true],
    ["-3", 1, true], ["02", 2, true], ["999999", 1, true]];
  for (const [raw, page, redirect] of cases) {
    const r = c.parseCatalogQuery({ pagina: raw });
    assert.equal(r.state.page, page, `pagina=${raw}`);
    assert.equal(r.needsRedirect, redirect, `pagina=${raw} redirect`);
  }
  assert.equal(c.parseCatalogQuery({ pagina: ["2", "3"] }).needsRedirect, true);
});

test("orden: lista blanca; relevance solo con búsqueda", () => {
  assert.equal(c.parseCatalogQuery({ orden: "price_asc" }).needsRedirect, false);
  let r = c.parseCatalogQuery({ orden: "hack" });
  assert.equal(r.state.sort, null);
  assert.equal(r.needsRedirect, true);
  r = c.parseCatalogQuery({ orden: "relevance" });
  assert.equal(r.state.sort, null);
  assert.equal(r.needsRedirect, true);
  r = c.parseCatalogQuery({ q: "lobo", orden: "relevance" });
  assert.equal(r.state.sort, "relevance");
  assert.equal(r.needsRedirect, false);
});

test("filtros: valor con ':', inválidos descartados, duplicados y topes", () => {
  let r = c.parseCatalogQuery({ f: ["Título:Parte 1: inicio", "x", ":v", "n:", "Título:Parte 1: inicio"] });
  assert.deepEqual(Object.entries(r.state.filters), [["Título", ["Parte 1: inicio"]]]);

  const groups = Array.from({ length: 8 }, (_, i) => `a${i}:x`);
  assert.equal(Object.keys(c.parseCatalogQuery({ f: groups }).state.filters).length, 6);

  const values = Array.from({ length: 15 }, (_, i) => `a:v${i}`);
  assert.equal(c.parseCatalogQuery({ f: values }).state.filters.a.length, 10);

  r = c.parseCatalogQuery({ f: ["__proto__:x"] });
  assert.deepEqual(Object.entries(r.state.filters), [["__proto__", ["x"]]]);
  assert.equal({}.x, undefined);

  r = c.parseCatalogQuery({ f: ["Editorial:Norma", "Editorial:Alfaguara"] });
  assert.equal(r.needsRedirect, true); // la forma canónica ordena los valores
});

test("precios: válidos, invertidos se intercambian, inválidos se descartan", () => {
  let r = c.parseCatalogQuery({ precio_min: "10", precio_max: "30" });
  assert.equal(r.needsRedirect, false);
  r = c.parseCatalogQuery({ precio_min: "30", precio_max: "10" });
  assert.deepEqual([r.state.minPrice, r.state.maxPrice], [10, 30]);
  assert.equal(r.needsRedirect, true);
  r = c.parseCatalogQuery({ precio_min: "abc", precio_max: "-5" });
  assert.deepEqual([r.state.minPrice, r.state.maxPrice], [null, null]);
});

test("parámetros ajenos (utm, fbclid) no provocan redirección", () => {
  const r = c.parseCatalogQuery({ utm_source: "fb", fbclid: "x", q: "lobo" });
  assert.equal(r.needsRedirect, false);
});

test("catalogHref usa siempre el orden canónico", () => {
  const raw = { q: "lobo", f: ["Editorial:Alfaguara"], precio_min: "10", orden: "name", pagina: "3" };
  const { state, needsRedirect } = c.parseCatalogQuery(raw);
  assert.equal(needsRedirect, false);
  assert.equal(
    c.catalogHref("/categoria/cuentos", state),
    "/categoria/cuentos?q=lobo&f=Editorial%3AAlfaguara&precio_min=10&orden=name&pagina=3",
  );
  assert.equal(c.catalogHref("/", c.emptyState()), "/");
});

test("nextState vuelve a la página 1; toggleFilter agrega y quita", () => {
  const base = c.parseCatalogQuery({ q: "lobo", orden: "relevance", pagina: "3" }).state;
  assert.equal(c.nextState(base, { sort: "name" }).page, 1);
  assert.equal(c.nextState(base, { page: 2 }).page, 2);
  assert.equal(c.nextState(base, { q: "" }).sort, null);

  let s = c.toggleFilter(base, "Editorial", "Norma");
  assert.deepEqual(Object.entries(s.filters), [["Editorial", ["Norma"]]]);
  assert.equal(s.page, 1);
  s = c.toggleFilter(s, "Editorial", "Norma");
  assert.deepEqual(Object.entries(s.filters), []);
});

test("parámetros de la API", () => {
  const { state } = c.parseCatalogQuery({ q: "lobo", f: ["Editorial:Norma", "Editorial:Alfaguara"], precio_min: "10", orden: "name", pagina: "2" });
  const p = c.toApiParams(state, { categorySlug: "cuentos", limit: 24 });
  assert.equal(p.get("limit"), "24");
  assert.equal(p.get("page"), "2");
  assert.equal(p.get("category"), "cuentos");
  assert.equal(p.get("sort"), "name");
  assert.equal(p.get("min_price"), "10");
  assert.deepEqual(p.getAll("f"), ["Editorial:Alfaguara", "Editorial:Norma"]);
  const f = c.toFacetParams(state, "cuentos");
  assert.equal(f.get("page"), null);
  assert.equal(f.get("limit"), null);
  assert.equal(f.get("sort"), null);
  assert.equal(f.get("category"), "cuentos");
});

test("solo las vistas simples se cachean", () => {
  assert.equal(c.isCacheable(c.emptyState()), true);
  assert.equal(c.isCacheable(c.parseCatalogQuery({ q: "x" }).state), false);
  assert.equal(c.isCacheable(c.parseCatalogQuery({ f: "A:b" }).state), false);
  assert.equal(c.isCacheable(c.parseCatalogQuery({ precio_min: "5" }).state), false);
});

test("paginador", () => {
  assert.deepEqual(c.pageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(c.pageWindow(5, 9), [1, "gap", 4, 5, 6, "gap", 9]);
  assert.deepEqual(c.pageWindow(1, 9), [1, 2, 3, 4, "gap", 9]);
  assert.deepEqual(c.pageWindow(4, 9), [1, 2, 3, 4, 5, "gap", 9]);
  assert.deepEqual(c.pageWindow(9, 9), [1, "gap", 6, 7, 8, 9]);
  assert.equal(c.totalPages(0, 24), 1);
  assert.equal(c.totalPages(61, 24), 3);
  assert.equal(c.totalPages(48, 24), 2);
});
