---
read_when:
    - Integration von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt `/v1/chat/completions` vom Gateway bereitstellen
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T12:43:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Das Gateway von OpenClaw kann einen kleinen OpenAI-kompatiblen Endpunkt für Chat Completions bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateways aktiviert ist, stellt sie außerdem Folgendes bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Intern werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing/Berechtigungen/Konfiguration Ihrem Gateway entsprechen.

## Authentifizierung

Verwendet die Gateway-Auth-Konfiguration.

Gängige HTTP-Auth-Pfade:

- Auth mit gemeinsamem Geheimnis (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige HTTP-Auth mit Identitätsträger (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitäts-Header einfügen lassen
- offene Auth bei privatem Ingress (`gateway.auth.mode="none"`):
  kein Auth-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gesetzt ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gesetzt ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gesetzt ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle außerhalb von Loopback kommen; Proxys
  auf demselben Host mit Loopback erfüllen diesen Modus nicht.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Auth-Fehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollständigem Operatorzugriff** für die Gateway-Instanz.

- Bearer-Auth über HTTP ist hier kein enges per-Benutzer-Scopes-Modell.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie eine Eigentümer-/Operator-Anmeldeinformation behandelt werden.
- Anfragen laufen durch denselben Agent-Pfad der Kontrollebene wie vertrauenswürdige Operatoraktionen.
- Auf diesem Endpunkt gibt es keine separate Nicht-Eigentümer-/Pro-Benutzer-Tool-Grenze; sobald ein Aufrufer hier die Gateway-Auth besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für dieses Gateway.
- Bei Auth-Modi mit gemeinsamem Geheimnis (`token` und `password`) stellt der Endpunkt die normalen vollständigen Standardwerte für Operatoren wieder her, auch wenn der Aufrufer einen engeren Header `x-openclaw-scopes` sendet.
- Vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"`) beachten `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Standard-Umfangssatz für Operatoren zurück.
- Wenn die Richtlinie des Ziel-Agenten sensible Tools zulässt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen geheimen Gateway-Operator-Geheimnisses nach
  - ignoriert enger gefasste `x-openclaw-scopes`
  - stellt den vollständigen Standard-Umfangssatz für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns auf diesem Endpunkt als Turns von Eigentümer-Absendern
- vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` bei privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Bereitstellungsgrenze
  - beachten `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Standard-Umfangssatz für Operatoren zurück, wenn der Header fehlt
  - verlieren Eigentümer-Semantik nur, wenn der Aufrufer die Scopes explizit einschränkt und `operator.admin` weglässt

Siehe [Sicherheit](/gateway/security) und [Remote access](/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agent-Ziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` routet an den konfigurierten Standard-Agenten.
- `model: "openclaw/default"` routet ebenfalls an den konfigurierten Standard-Agenten.
- `model: "openclaw/<agentId>"` routet an einen bestimmten Agenten.

Optionale Request-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agenten.
- `x-openclaw-agent-id: <agentId>` wird weiterhin als Kompatibilitäts-Override unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` setzt den synthetischen Ingress-Kanalkontext für kanalbewusste Prompts und Richtlinien.

Kompatibilitäts-Aliase, die weiterhin akzeptiert werden:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Aktivieren des Endpunkts

Setzen Sie `gateway.http.endpoints.chatCompletions.enabled` auf `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Deaktivieren des Endpunkts

Setzen Sie `gateway.http.endpoints.chatCompletions.enabled` auf `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **zustandslos pro Anfrage** (bei jedem Aufruf wird ein neuer SessionKey generiert).

Wenn die Anfrage einen OpenAI-String `user` enthält, leitet das Gateway daraus einen stabilen SessionKey ab, sodass wiederholte Aufrufe eine Agent-Sitzung gemeinsam nutzen können.

## Warum diese Oberfläche wichtig ist

Dies ist der Kompatibilitätssatz mit dem größten Hebel für selbst gehostete Frontends und Tooling:

- Die meisten Setups mit Open WebUI, LobeChat und LibreChat erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können normalerweise mit `/v1/chat/completions` beginnen.
- Zunehmend mehr agentenorientierte Clients bevorzugen `/v1/responses`.

## Modellliste und Agent-Routing

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Agent-Zielliste.

    Die zurückgegebenen IDs sind `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agenten oder Subagenten auf?">
    Es listet Agent-Ziele der obersten Ebene auf, keine Backend-Provider-Modelle und keine Subagenten.

    Subagenten bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Warum ist `openclaw/default` enthalten?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standard-Agenten.

    Das bedeutet, dass Clients weiterhin eine vorhersagbare ID verwenden können, selbst wenn sich die tatsächliche Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="Wie überschreibe ich das Backend-Modell?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Wenn Sie es weglassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben Agent-Ziel-`model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an das normale Embedding-Setup des ausgewählten Agenten weitergereicht.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Schnelleinrichtung für Open WebUI

Für eine grundlegende Verbindung mit Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker unter macOS Base URL: `http://host.docker.internal:18789/v1`
- API key: Ihr Gateway-Bearer-Token
- Model: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie für diesen Agenten einen bestimmten Backend-Provider/ein bestimmtes Modell möchten, setzen Sie das normale Standardmodell des Agenten oder senden Sie `x-openclaw-model`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn das `openclaw/default` zurückgibt, können sich die meisten Open-WebUI-Setups mit derselben Base URL und demselben Token verbinden.

## Beispiele

Nicht-Streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Modelle auflisten:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ein Modell abrufen:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings erstellen:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Hinweise:

- `/v1/models` gibt OpenClaw-Agent-Ziele zurück, keine rohen Provider-Kataloge.
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Überschreibungen für Backend-Provider/-Modelle gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als String oder als Array von Strings.
