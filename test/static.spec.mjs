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

test("painel seleciona API e WebSocket do ambiente correto", () => {
  const source = entrypointSource();
  for (const [hostname, apiBase, admin] of [
    ["localhost", "http://127.0.0.1:8787", "http://127.0.0.1:8791/"],
    ["app-staging.maltworks.com.br", "https://api-staging.maltworks.com.br", "https://admin-staging.maltworks.com.br"],
    ["app.maltworks.com.br", "https://api.maltworks.com.br", "https://admin.maltworks.com.br"],
  ]) {
    const actual = new Script(source + ";({ API_BASE, REALTIME_BASE, ADMIN_URL });").runInNewContext({
      window: { location: { hostname } }, document: { addEventListener() {} },
    });
    assert.equal(actual.API_BASE, apiBase);
    assert.equal(actual.REALTIME_BASE, apiBase.replace(/^http/u, "ws"));
    assert.equal(actual.ADMIN_URL, admin);
    const connectSources = headers.match(/connect-src ([^;]+)/u)[1].split(/\s+/u);
    assert.ok(connectSources.includes(actual.API_BASE));
    assert.ok(connectSources.includes(actual.REALTIME_BASE));
  }
});

test("CSV agregado preserva medias, extremos e contagens sem inventar estados ON/OFF", async () => {
  let download;
  const toast = { textContent: "", classList: { add() {}, remove() {} } };
  const fixture = [{
    bucketStart: 1_800_000_000, samples: 8,
    refrigeratorValue: 18.5, refrigeratorMin: 17, refrigeratorMax: 20,
    thermalWellValue: 18.4, thermalWellMin: 16.9, thermalWellMax: 19.9,
    setpoint: 18, setpointMin: 18, setpointMax: 18,
    coolingSamples: 5, heatingSamples: 0, alarmSamples: 2, rssi: -55,
  }];
  new Script(entrypointSource() + `
    elements.toast = toast;
    state.historySource = "d1_aggregate";
    state.history = fixture;
    exportHistoryCsv();
  `).runInNewContext({
    window: { location: { hostname: "localhost" }, setTimeout() { return 0; } },
    document: { addEventListener() {}, createElement() { return { click() {}, remove() {} }; }, body: { append() {} } },
    URL: { createObjectURL(blob) { download = blob; return "blob:local-test"; }, revokeObjectURL() {} },
    Blob, toast, fixture,
  });
  const csv = await download.text();
  const [header, row] = csv.replace(/^\uFEFF/u, "").trim().split("\r\n");
  assert.equal(header.split(";").length, 15);
  assert.match(header, /geladeira_min_c;geladeira_max_c/u);
  assert.equal(row, "2027-01-15T08:00:00.000Z;8;18.5;17;20;18.4;16.9;19.9;18;18;18;5;0;2;-55");
  assert.doesNotMatch(csv, /\b(?:ON|OFF)\b/u);
});
