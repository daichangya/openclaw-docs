---
read_when:
    - Protokoll-Schemas oder Codegen aktualisieren
summary: TypeBox-Schemas als Single Source of Truth für das Gateway-Protokoll
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T12:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox als Single Source of Truth für das Protokoll

Zuletzt aktualisiert: 2026-01-10

TypeBox ist eine TypeScript-first-Schema-Bibliothek. Wir verwenden sie, um das **Gateway-
WebSocket-Protokoll** zu definieren (Handshake, Anfrage/Antwort, Server-Ereignisse). Diese Schemas
steuern die **Laufzeitvalidierung**, den **JSON-Schema-Export** und den **Swift-Codegen** für
die macOS-App. Eine einzige Quelle der Wahrheit; alles andere wird generiert.

Wenn Sie den übergeordneten Protokollkontext möchten, beginnen Sie mit
[Gateway architecture](/concepts/architecture).

## Mentales Modell (30 Sekunden)

Jede Gateway-WS-Nachricht ist einer von drei Frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Der erste Frame **muss** eine `connect`-Anfrage sein. Danach können Clients
Methoden aufrufen (z. B. `health`, `send`, `chat.send`) und Ereignisse abonnieren (z. B.
`presence`, `tick`, `agent`).

Verbindungsablauf (minimal):

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
| Messaging    | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | Nebeneffekte benötigen `idempotencyKey` |
| Chat         | `chat.history`, `chat.send`, `chat.abort`                  | WebChat verwendet diese            |
| Sitzungen    | `sessions.list`, `sessions.patch`, `sessions.delete`       | Sitzungsverwaltung                 |
| Automatisierung | `wake`, `cron.list`, `cron.run`, `cron.runs`            | Wake + Cron-Steuerung              |
| Knoten       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway-WS + Knotenaktionen        |
| Ereignisse   | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | Server-Push                        |

Das maßgebliche beworbene **Discovery**-Inventar befindet sich in
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Wo die Schemas liegen

- Quelle: `src/gateway/protocol/schema.ts`
- Laufzeitvalidatoren (AJV): `src/gateway/protocol/index.ts`
- Beworbene Feature-/Discovery-Registry: `src/gateway/server-methods-list.ts`
- Server-Handshake + Methodendispatch: `src/gateway/server.impl.ts`
- Knoten-Client: `src/gateway/client.ts`
- Generiertes JSON-Schema: `dist/protocol.schema.json`
- Generierte Swift-Modelle: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Aktuelle Pipeline

- `pnpm protocol:gen`
  - schreibt JSON Schema (draft‑07) nach `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - generiert Swift-Gateway-Modelle
- `pnpm protocol:check`
  - führt beide Generatoren aus und prüft, ob die Ausgabe eingecheckt ist

## Wie die Schemas zur Laufzeit verwendet werden

- **Serverseitig**: Jeder eingehende Frame wird mit AJV validiert. Der Handshake akzeptiert nur
  eine `connect`-Anfrage, deren Parameter zu `ConnectParams` passen.
- **Clientseitig**: Der JS-Client validiert Ereignis- und Antwort-Frames, bevor
  er sie verwendet.
- **Feature-Discovery**: Das Gateway sendet ein konservatives `features.methods`
  und eine `features.events`-Liste in `hello-ok` aus `listGatewayMethods()` und
  `GATEWAY_EVENTS`.
- Diese Discovery-Liste ist kein generierter Dump jedes aufrufbaren Hilfsprogramms in
  `coreGatewayHandlers`; einige Hilfs-RPCs werden in
  `src/gateway/server-methods/*.ts` implementiert, ohne in der beworbenen
  Feature-Liste aufgezählt zu sein.

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

Hello-ok-Antwort:

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

Anfrage + Antwort:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Ereignis:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimaler Client (Node.js)

Kleinster nützlicher Ablauf: connect + health.

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

## Durchgearbeitetes Beispiel: eine Methode Ende-zu-Ende hinzufügen

Beispiel: eine neue Anfrage `system.echo` hinzufügen, die `{ ok: true, text }` zurückgibt.

1. **Schema (Single Source of Truth)**

Zu `src/gateway/protocol/schema.ts` hinzufügen:

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

Beides zu `ProtocolSchemas` hinzufügen und Typen exportieren:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validierung**

In `src/gateway/protocol/index.ts` einen AJV-Validator exportieren:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Serververhalten**

Einen Handler in `src/gateway/server-methods/system.ts` hinzufügen:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

In `src/gateway/server-methods.ts` registrieren (führt `systemHandlers` bereits zusammen),
dann `"system.echo"` zur Eingabe von `listGatewayMethods` in
`src/gateway/server-methods-list.ts` hinzufügen.

Wenn die Methode von Operator- oder Knoten-Clients aufrufbar sein soll, klassifizieren Sie sie außerdem in
`src/gateway/method-scopes.ts`, damit Scope-Durchsetzung und Feature-
Bewerbung in `hello-ok` synchron bleiben.

4. **Neu generieren**

```bash
pnpm protocol:check
```

5. **Tests + Dokumentation**

Einen Servertest in `src/gateway/server.*.test.ts` hinzufügen und die Methode in der Dokumentation vermerken.

## Verhalten des Swift-Codegens

Der Swift-Generator erzeugt:

- `GatewayFrame`-Enum mit Fällen `req`, `res`, `event` und `unknown`
- Stark typisierte Payload-Structs/-Enums
- `ErrorCode`-Werte und `GATEWAY_PROTOCOL_VERSION`

Unbekannte Frame-Typen werden für Vorwärtskompatibilität als rohe Payloads beibehalten.

## Versionierung + Kompatibilität

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Die Swift-Modelle behalten unbekannte Frame-Typen bei, damit ältere Clients nicht brechen.

## Schema-Muster und Konventionen

- Die meisten Objekte verwenden `additionalProperties: false` für strikte Payloads.
- `NonEmptyString` ist der Standard für IDs und Methoden-/Ereignisnamen.
- Das Top-Level-`GatewayFrame` verwendet einen **Discriminator** auf `type`.
- Methoden mit Nebeneffekten erfordern in den Parametern normalerweise einen `idempotencyKey`
  (Beispiel: `send`, `poll`, `agent`, `chat.send`).
- `agent` akzeptiert optionale `internalEvents` für runtime-generierten Orchestrierungskontext
  (zum Beispiel Übergabe bei Abschluss von Subagent-/Cron-Aufgaben); behandeln Sie dies als interne API-Oberfläche.

## Live-Schema-JSON

Das generierte JSON Schema befindet sich im Repository unter `dist/protocol.schema.json`. Die
veröffentlichte Rohdatei ist typischerweise verfügbar unter:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Wenn Sie Schemas ändern

1. Die TypeBox-Schemas aktualisieren.
2. Die Methode/das Ereignis in `src/gateway/server-methods-list.ts` registrieren.
3. `src/gateway/method-scopes.ts` aktualisieren, wenn das neue RPC eine Scope-Klassifizierung für Operator oder
   Knoten benötigt.
4. `pnpm protocol:check` ausführen.
5. Das neu generierte Schema + die Swift-Modelle committen.
