// Exécuter : node lib/format.test.js
const assert = require("assert");

async function run() {
  const { hasValue, withValues, withLinks } = await import("./format.js");

  assert.strictEqual(hasValue({ value: 3 }), true);
  assert.strictEqual(hasValue({ value: null }), false);
  assert.strictEqual(hasValue({ value: undefined }), false);
  assert.strictEqual(hasValue({ value: NaN }), false);
  assert.strictEqual(hasValue(null), false);

  assert.deepStrictEqual(
    withValues({ a: { value: 1 }, b: { value: null }, c: { value: 2 } }),
    [{ value: 1 }, { value: 2 }]
  );

  assert.deepStrictEqual(
    withLinks([{ title: "A", url: "u1" }, { title: null, url: "u2" }, {}]),
    [{ title: "A", url: "u1" }]
  );

  console.log("lib/format.test.js — OK (7 assertions)");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
