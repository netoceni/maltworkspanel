import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
import test from "node:test";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const html = readFileSync(join(publicDirectory, "index.html"), "utf8");
const headers = readFileSync(join(publicDirectory, "_headers"), "utf8");

function localAssetPath(url) {
  return join(publicDirectory, url.split(/[?#]/u, 1)[0].replace(/^\//u, ""));
}

function assetReferences() {
  return [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["'](\/[^"']+)["']/gu)]
    .map((match) => match[1]);
}

function entrypointSource() {
  const script = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["'](\/[^"']+)["']/gu)]
    .map((match) => match[1])
    .find((name) => name.endsWith(".js") || name.includes(".js?"));
  assert.ok(script, "index.html precisa referenciar o JavaScript da aplicação");
  return readFileSync(localAssetPath(script), "utf8");
}

test("todos os arquivos referenciados pelo HTML existem", () => {
  const referenced = assetReferences();
  assert.ok(referenced.length > 1, "nenhuma referência de recursos locais encontrada");
  for (const url of referenced) {
    assert.ok(existsSync(localAssetPath(url)), "arquivo local ausente: " + url);
  }
});

test("JavaScript da aplicação tem sintaxe válida", () => {
  const source = entrypointSource();
  assert.doesNotThrow(() => new Script(source, { filename: "Maltworks UI entrypoint" }));
});

test("IDs de HTML são únicos e correspondem ao cache da interface", () => {
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gu)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, "IDs duplicados no HTML");

  const source = entrypointSource();
  const cache = source.match(
    /for\s*\(\s*const\s+id\s+of\s*\[([\s\S]+?)\]\s*\)\s*\{?\s*elements\[id\]/u,
  );
  assert.ok(cache, "declaracao do cache de elementos nao encontrada");
  const references = [...cache[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]);
  assert.ok(references.length >= 20, "cache de elementos inesperadamente vazio");
  const htmlIds = new Set(ids);
  assert.deepEqual(references.filter((id) => !htmlIds.has(id)), [], "IDs referenciados sem elemento HTML");
});

test("cabeçalhos de segurança essenciais continuam configurados", () => {
  assert.match(headers, /Content-Security-Policy:/u);
  assert.match(headers, /frame-ancestors 'none'/u);
  assert.match(headers, /X-Content-Type-Options: nosniff/u);
  assert.match(headers, /Cache-Control: no-store/u);
});
