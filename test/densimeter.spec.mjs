import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../public/app-5.20.0.js", import.meta.url), "utf8");
const context = { window: { location: { hostname: "localhost" } }, document: { addEventListener() {} } };
const model = new Script(source + ";densimeterModel").runInNewContext(context);
const now = 1794595893;
const reading = { index: 32, sessionId: "28050cabefb7cb5d", sequence: 3,
  sampledAt: now, intervalSeconds: 1800, batteryMv: 4120, temperatureMc: 25875,
  angleMdeg: 69552, rssi: -65, gravitySg: null, calibrationRevision: 0 };
const snapshot = { deviceId: "MW-000000000001", state: {
  densimeter: { sensorId: 16356134, readings: [reading] },
} };

test("sensor asleep between 30-minute readings stays current despite frequent Controller heartbeats", () => {
  const result = model(snapshot, null, now + 1200, true);
  assert.equal(result.status, "ENTRE LEITURAS");
  assert.equal(result.nextExpected, now + 1800);
  assert.equal(result.reading.gravitySg, null);
  assert.equal(model(snapshot, null, now + 2200, true).status, "LEITURA ATRASADA");
  assert.equal(model(snapshot, null, now + 100, false).status, "CONTROLLER SEM CONEXÃO");
});
test("cloud reconnection cannot make an old or unsynchronized sensor sample fresh", () => {
  assert.equal(model({ ...snapshot, receivedAt: now + 9000 }, null, now + 9000, true).status, "LEITURA ATRASADA");
  const unknown = structuredClone(snapshot); unknown.state.densimeter.readings[0].sampledAt = 0;
  assert.equal(model(unknown, null, now, true).status, "HORÁRIO A CONFERIR");
});
test("no sensor, old firmware and first sample are distinct states", () => {
  assert.equal(model({ state: {} }, null, now).status, "AGUARDANDO DADOS");
  assert.equal(model({ state: { densimeter: null } }, null, now).status, "SEM DENSÍMETRO");
  assert.equal(model({ state: { densimeter: { sensorId: 1, readings: [] } } }, null, now).status, "AGUARDANDO PRIMEIRA LEITURA");
});
test("history is deduplicated and never mixed across Controller or sensor", () => {
  const cached = { deviceId: snapshot.deviceId, sensorId: 16356134,
    readings: [reading, { ...reading, index: 31, sequence: 2, sampledAt: now - 1800 }] };
  assert.equal(model(snapshot, cached, now).readings.length, 2);
  assert.equal(model(snapshot, { ...cached, deviceId: "other" }, now).readings.length, 1);
  assert.equal(model(snapshot, { ...cached, sensorId: 1 }, now).readings.length, 1);
});
