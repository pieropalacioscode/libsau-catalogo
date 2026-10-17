const test = require("node:test");
const assert = require("node:assert/strict");
const text = require("../.test-out/text.js");
const { highlight } = require("../.test-out/highlight.js");
const s = require("../.test-out/suggest.js");
const { createLimiter } = require("../.test-out/rate-limit.js");

test("plain y foldKey", () => {
  assert.equal(text.plain("Álgebra Ñandú"), "algebra nandu");
  assert.equal(text.foldKey("Álgebra"), "algebra");
  assert.equal(text.foldKey("a📚b").length, 3); // un emoji = una unidad
});

test("highlight: sin tildes, varias palabras, solapes", () => {
  assert.deepEqual(highlight("Álgebra Lineal", "alge"), [
    { text: "Álge", hit: true },
    { text: "bra Lineal", hit: false },
  ]);
  assert.deepEqual(highlight("Álgebra Lineal", "lineal alg"), [
    { text: "Álg", hit: true },
    { text: "ebra ", hit: false },
    { text: "Lineal", hit: true },
  ]);
  assert.deepEqual(highlight("Álgebra", "alg geb"), [
    { text: "Álgeb", hit: true },
    { text: "ra", hit: false },
  ]);
});

test("highlight: casos límite y emoji", () => {
  assert.deepEqual(highlight("", "x"), []);
  assert.deepEqual(highlight("Hola", ""), [{ text: "Hola", hit: false }]);
  assert.deepEqual(highlight("Hola", "zzz"), [{ text: "Hola", hit: false }]);
  const name = "Libro 📚 álgebra";
  const segs = highlight(name, "alg");
  assert.equal(segs.map((x) => x.text).join(""), name);
  assert.deepEqual(segs, [
    { text: "Libro 📚 ", hit: false },
    { text: "álg", hit: true },
    { text: "ebra", hit: false },
  ]);
});

test("suggestKey", () => {
  assert.equal(s.suggestKey(" Á "), null);
  assert.equal(s.suggestKey(""), null);
  assert.equal(s.suggestKey("ál"), "al");
  assert.equal(s.suggestKey("  Álgebra   lineal "), "algebra lineal");
  assert.equal([...s.suggestKey("ñ".repeat(150))].length, 100);
});

test("LruCache: orden, tamaño y expiración", () => {
  const c = new s.LruCache(2, 1000);
  c.set("a", 1, 0);
  c.set("b", 2, 0);
  assert.equal(c.get("a", 1), 1); // a pasa a ser el más reciente
  c.set("c", 3, 2);
  assert.equal(c.get("b", 3), undefined); // b era el más antiguo
  assert.equal(c.get("a", 3), 1);
  assert.equal(c.get("a", 1500), undefined); // expiró
});

test("limitador: bloquea, avisa y se reinicia", () => {
  const l = createLimiter(3, 1000);
  for (let i = 0; i < 3; i++) assert.equal(l.allow("ip", i).ok, true);
  const r = l.allow("ip", 3);
  assert.equal(r.ok, false);
  assert.equal(r.retryAfter, 1);
  assert.equal(l.allow("otra", 3).ok, true); // otra clave no se ve afectada
  assert.equal(l.allow("ip", 1000).ok, true); // ventana nueva
  const tiny = createLimiter(1, 1000, 2); // el tope de claves no rompe nada
  for (const k of ["a", "b", "c", "d"]) assert.equal(tiny.allow(k, 0).ok, true);
});
