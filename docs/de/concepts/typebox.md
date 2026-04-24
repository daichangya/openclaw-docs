---
read_when:
    - Protokoll-Schemas oder Codegen aktualisieren
summary: TypeBox-Schemas als einzige Quelle der Wahrheit für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T06:35:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox als einzige Quelle der Wahrheit für das Gateway-Protokoll

Zuletzt aktualisiert: 2026-01-10

TypeBox ist eine TypeScript-first-Schemabibliothek. Wir verwenden sie, um das **Gateway-
WebSocket-Protokoll** zu definieren (Handshake, Request/Response, Server-Ereignisse). Diese Schemata
steuern **Laufzeitvalidierung**, **JSON-Schema-Export** und **Swift-Codegen** für
die macOS-App. Eine einzige Quelle der Wahrheit; alles andere wird generiert.

Wenn Sie den Protokollkontext auf höherer Ebene möchten, beginnen Sie mit
[Gateway architecture](/de/concepts/architecture).

## Denkmodell (30 Sekunden)

Jede Gateway-WS-Nachricht ist einer von drei Frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Der erste Frame **muss** ein `connect`-Request sein. Danach können Clients
Methoden aufrufen (z. B. `health`, `send`, `chat.send`) und Ereignisse abonnieren (z. B.
`presence`, `tick`, `agent`).

Verbindungsfluss (minimal):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Häufige Methoden + Ereignisse:

| Kategorie    | Beispiele                                                  | Hinweise                           |
| ------------ | ---------------------------------------------------------- | ---------------------------------- |
| Core         | `connect`, `health`, `status`                              | `connect` muss zuerst kommen       |
| Messaging    | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Seiteneffekte benötigen `idempotencyKey` |
| Chat         | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese            |
| Sitzungen    | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsverwaltung                 |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`            | Wake + Cron-Steuerung              |
| Nodes        | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS + Node-Aktionen         |
| Ereignisse   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                        |

Das maßgebliche beworbene **Discovery**-Inventar befindet sich in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Wo die Schemata liegen

- Quelle: `src/gateway/protocol/schema.ts`
- Laufzeitvalidatoren (AJV): `src/gateway/protocol/index.ts`
- Beworbene Feature-/Discovery-Registry: `src/gateway/server-methods-list.ts`
- Server-Handshake + Methoden-Dispatch: `src/gateway/server.impl.ts`
- Node-Client: `src/gateway/client.ts`
- Generiertes JSON-Schema: `dist/protocol.schema.json`
- Generierte Swift-Modelle: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen`
  - schreibt JSON-Schema (draft‑07) nach `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generiert Swift-Gateway-Modelle
- `pnpm protocol:check`
  - führt beide Generatoren aus und prüft, ob die Ausgabe committet ist

## Wie die Schemata zur Laufzeit verwendet werden

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake
  akzeptiert nur einen `connect`-Request, dessen Parameter zu `ConnectParams` passen.
- **Clientseitig**: Der JS-Client validiert Event- und Response-Frames, bevor
  sie verwendet werden.
- **Feature-Discovery**: Das Gateway sendet in `hello-ok` eine konservative Liste
  `features.methods` und `features.events` aus `listGatewayMethods()` und
  `GATEWAY_EVENTS`.
- Diese Discovery-Liste ist kein generierter Dump aller aufrufbaren Hilfsfunktionen in
  `coreGatewayHandlers`; einige Hilfs-RPCs sind in
  `src/gateway/server-methods/*.ts` implementiert, ohne in der beworbenen
  Feature-Liste aufgeführt zu sein.

## Beispiel-Frames

Connect (erste Nachricht):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok-Response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + Response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimaler Client (Node.js)

Kleinster sinnvoller Ablauf: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Durchgearbeitetes Beispiel: Eine Methode Ende-zu-Ende hinzufügen

Beispiel: Fügen Sie einen neuen Request `system.echo` hinzu, der `{ ok: true, text }` zurückgibt.

1. **Schema (Quelle der Wahrheit)**

Fügen Sie zu `src/gateway/protocol/schema.ts` hinzu:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Fügen Sie beide zu `ProtocolSchemas` hinzu und exportieren Sie die Typen:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validierung**

Exportieren Sie in `src/gateway/protocol/index.ts` einen AJV-Validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Serververhalten**

Fügen Sie einen Handler in `src/gateway/server-methods/system.ts` hinzu:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Registrieren Sie ihn in `src/gateway/server-methods.ts` (führt `systemHandlers` bereits zusammen),
und fügen Sie dann `"system.echo"` zum Input von `listGatewayMethods` in
`src/gateway/server-methods-list.ts` hinzu.

Wenn die Methode von Operator- oder Node-Clients aufrufbar sein soll, klassifizieren Sie sie außerdem in
`src/gateway/method-scopes.ts`, damit Scope-Durchsetzung und Feature-
Bewerbung in `hello-ok` ausgerichtet bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests + Dokumentation**

Fügen Sie einen Servertest in `src/gateway/server.*.test.ts` hinzu und vermerken Sie die Methode in der Dokumentation.

## Verhalten des Swift-Codegen

Der Swift-Generator erzeugt:

- `GatewayFrame`-Enum mit den Fällen `req`, `res`, `event` und `unknown`
- Stark typisierte Payload-Structs/-Enums
- `ErrorCode`-Werte und `GATEWAY_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden für Vorwärtskompatibilität als rohe Payloads beibehalten.

## Versionierung + Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, um ältere Clients nicht zu beschädigen.

## Schema-Muster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikte Payloads.
- `NonEmptyString` ist der Standard für IDs und Methoden-/Ereignisnamen.
- Das Top-Level-`GatewayFrame` verwendet einen **Discriminator** auf `type`.
- Methoden mit Seiteneffekten benötigen in den Parametern normalerweise einen `idempotencyKey`
  (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optionale `internalEvents` für laufzeitgenerierten Orchestrierungskontext
  (zum Beispiel Handoff nach Abschluss von Subagent-/Cron-Aufgaben); behandeln Sie dies als interne API-Oberfläche.

## Live-Schema-JSON

Das generierte JSON-Schema befindet sich im Repository unter `dist/protocol.schema.json`. Die
veröffentlichte Rohdatei ist normalerweise verfügbar unter:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemata ändern

1. Aktualisieren Sie die TypeBox-Schemata.
2. Registrieren Sie die Methode/das Ereignis in `src/gateway/server-methods-list.ts`.
3. Aktualisieren Sie `src/gateway/method-scopes.ts`, wenn das neue RPC eine Scope-Klassifizierung für Operator oder
   Node benötigt.
4. Führen Sie `pnpm protocol:check` aus.
5. Committen Sie das neu generierte Schema + die Swift-Modelle.

## Verwandt

- [Rich output protocol](/de/reference/rich-output-protocol)
- [RPC adapters](/de/reference/rpc)
