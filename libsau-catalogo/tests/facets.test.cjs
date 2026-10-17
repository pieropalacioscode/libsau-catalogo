const test = require("node:test");
const assert = require("node:assert/strict");
const cq = require("../.test-out/catalog-query.js");
const f = require("../.test-out/facets.js");

const attrs = [
  { name: "Autor", values: [{ value: "A", count: 3 }] },
  { name: "Impresión", values: [{ value: "A color", count: 9 }, { value: "B/N", count: 2 }] },
  { name: "Editorial", values: [{ value: "Bruño", count: 5 }] },
];
const opts = { hide: [], order: ["Editorial", "Impresión"], labels: {} };

test("prepareFacets: orden de la configuración y resto en el orden de la API", () => {
  const names = f.prepareFacets(attrs, cq.emptyState(), opts).map((g) => g.name);
  assert.deepEqual(names, ["Editorial", "Impresión", "Autor"]);
});

test("prepareFacets: ocultos, etiquetas y nombres como 'constructor'", () => {
  const extra = [...attrs, { name: "constructor", values: [{ value: "x", count: 1 }] }];
  const groups = f.prepareFacets(extra, cq.emptyState(), { hide: ["Autor"], order: [], labels: { Editorial: "Casa editorial" } });
  assert.deepEqual(groups.map((g) => g.name), ["Impresión", "Editorial", "constructor"]);
  assert.equal(groups.find((g) => g.name === "Editorial").label, "Casa editorial");
  assert.equal(groups.find((g) => g.name === "constructor").label, "constructor");
});

test("prepareFacets: un valor elegido que ya no aparece se conserva con conteo 0", () => {
  const state = cq.toggleFilter(cq.emptyState(), "Editorial", "Planeta");
  const g = f.prepareFacets(attrs, state, opts).find((x) => x.name === "Editorial");
  assert.deepEqual(g.values, [{ value: "Bruño", count: 5 }, { value: "Planeta", count: 0 }]);
  assert.equal(g.selected, 1);
});

test("activeFilterCount", () => {
  assert.equal(f.activeFilterCount(cq.emptyState()), 0);
  let s = cq.toggleFilter(cq.emptyState(), "Editorial", "Bruño");
  s = cq.toggleFilter(s, "Editorial", "Norma");
  s = cq.nextState(s, { minPrice: 10 });
  assert.equal(f.activeFilterCount(s), 3);
});

test("hasPriceRange", () => {
  assert.equal(f.hasPriceRange({ min: 6, max: 35 }), true);
  assert.equal(f.hasPriceRange({ min: 5, max: 5 }), false);
});
