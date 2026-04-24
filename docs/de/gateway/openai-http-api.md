---
read_when:
    - Integrieren von Tools, die OpenAI Chat Completions erwarten
summary: Einen OpenAI-kompatiblen HTTP-Endpunkt `/v1/chat/completions` über das Gateway bereitstellen
title: OpenAI-Chat-Completions
x-i18n:
    generated_at: "2026-04-24T06:38:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI-Chat-Completions (HTTP)

Das Gateway von OpenClaw kann einen kleinen OpenAI-kompatiblen Chat-Completions-Endpunkt bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/chat/completions`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Wenn die OpenAI-kompatible HTTP-Oberfläche des Gateway aktiviert ist, stellt sie außerdem bereit:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Unter der Haube werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie `openclaw agent`), sodass Routing/Berechtigungen/Konfiguration mit Ihrem Gateway übereinstimmen.

## Authentifizierung

Verwendet die Authentifizierungskonfiguration des Gateway.

Gängige HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- Vertrauenswürdige HTTP-Authentifizierung mit Identitätsträger (`gateway.auth.mode="trusted-proxy"`):
  Weiterleitung über den konfigurierten identity-aware Proxy und Einspeisung der
  erforderlichen Identitäts-Header
- Offene Authentifizierung über privaten Ingress (`gateway.auth.mode="none"`):
  kein Auth-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gesetzt ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gesetzt ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gesetzt ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen, die nicht Loopback ist; gleichhostige Loopback-Proxys
  erfüllen diesen Modus nicht.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Auth-Fehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollem Operatorzugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung hier ist kein enges Bereichsmodell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie eine Eigentümer-/Operator-Anmeldeinformation behandelt werden.
- Anfragen laufen durch denselben Control-Plane-Agent-Pfad wie vertrauenswürdige Operatoraktionen.
- Es gibt an diesem Endpunkt keine separate Nicht-Eigentümer-/Pro-Benutzer-Tool-Grenze; sobald ein Aufrufer hier die Gateway-Authentifizierung besteht, behandelt OpenClaw diesen Aufrufer als vertrauenswürdigen Operator für dieses Gateway.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardeinstellungen wieder her, selbst wenn der Aufrufer einen engeren Header `x-openclaw-scopes` sendet.
- Vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"`) beachten `x-openclaw-scopes`, wenn vorhanden, und fallen andernfalls auf den normalen Standardumfang für Operatoren zurück.
- Wenn die Richtlinie des Zielagenten sensible Tools erlaubt, kann dieser Endpunkt sie verwenden.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailscale/privatem Ingress; stellen Sie ihn nicht direkt ins öffentliche Internet.

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - belegt den Besitz des gemeinsamen Operator-Secrets des Gateway
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standardumfang für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Durchläufe auf diesem Endpunkt als Durchläufe eines Eigentümer-Absenders
- Vertrauenswürdige HTTP-Modi mit Identitätsträger (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` auf privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deploymentsgrenze
  - beachten `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Standardumfang für Operatoren zurück, wenn der Header fehlt
  - verlieren die Eigentümersemantik nur dann, wenn der Aufrufer die Scopes explizit verengt und `operator.admin` weglässt

Siehe [Sicherheit](/de/gateway/security) und [Remote-Zugriff](/de/gateway/remote).

## Agent-first-Modellvertrag

OpenClaw behandelt das OpenAI-Feld `model` als **Agentenziel**, nicht als rohe Provider-Modell-ID.

- `model: "openclaw"` leitet an den konfigurierten Standardagenten weiter.
- `model: "openclaw/default"` leitet ebenfalls an den konfigurierten Standardagenten weiter.
- `model: "openclaw/<agentId>"` leitet an einen bestimmten Agenten weiter.

Optionale Anfrage-Header:

- `x-openclaw-model: <provider/model-or-bare-id>` überschreibt das Backend-Modell für den ausgewählten Agenten.
- `x-openclaw-agent-id: <agentId>` wird weiterhin als Kompatibilitätsüberschreibung unterstützt.
- `x-openclaw-session-key: <sessionKey>` steuert das Sitzungsrouting vollständig.
- `x-openclaw-message-channel: <channel>` setzt den synthetischen Ingress-Kanalkontext für kanalbewusste Prompts und Richtlinien.

Kompatibilitätsaliase, die weiterhin akzeptiert werden:

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

Standardmäßig ist der Endpunkt **zustandslos pro Anfrage** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage eine OpenAI-Zeichenfolge `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab, sodass wiederholte Aufrufe eine Agentensitzung gemeinsam nutzen können.

## Warum diese Oberfläche wichtig ist

Dies ist die Kompatibilitätsmenge mit der höchsten Hebelwirkung für selbstgehostete Frontends und Tooling:

- Die meisten Setups von Open WebUI, LobeChat und LibreChat erwarten `/v1/models`.
- Viele RAG-Systeme erwarten `/v1/embeddings`.
- Bestehende OpenAI-Chat-Clients können meist mit `/v1/chat/completions` beginnen.
- Zunehmend bevorzugen agentennativere Clients `/v1/responses`.

## Modellliste und Agentenrouting

<AccordionGroup>
  <Accordion title="Was gibt `/v1/models` zurück?">
    Eine OpenClaw-Liste von Agentenzielen.

    Die zurückgegebenen IDs sind `openclaw`, `openclaw/default` und `openclaw/<agentId>`.
    Verwenden Sie sie direkt als OpenAI-`model`-Werte.

  </Accordion>
  <Accordion title="Listet `/v1/models` Agenten oder Subagents auf?">
    Es listet Ziele von Top-Level-Agenten auf, nicht Backend-Provider-Modelle und auch keine Subagents.

    Subagents bleiben interne Ausführungstopologie. Sie erscheinen nicht als Pseudo-Modelle.

  </Accordion>
  <Accordion title="Warum ist `openclaw/default` enthalten?">
    `openclaw/default` ist der stabile Alias für den konfigurierten Standardagenten.

    Das bedeutet, dass Clients weiterhin eine vorhersehbare ID verwenden können, selbst wenn sich die tatsächliche Standard-Agent-ID zwischen Umgebungen ändert.

  </Accordion>
  <Accordion title="Wie überschreibe ich das Backend-Modell?">
    Verwenden Sie `x-openclaw-model`.

    Beispiele:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Wenn Sie es weglassen, läuft der ausgewählte Agent mit seiner normal konfigurierten Modellauswahl.

  </Accordion>
  <Accordion title="Wie passen Embeddings in diesen Vertrag?">
    `/v1/embeddings` verwendet dieselben agentenzielbezogenen `model`-IDs.

    Verwenden Sie `model: "openclaw/default"` oder `model: "openclaw/<agentId>"`.
    Wenn Sie ein bestimmtes Embedding-Modell benötigen, senden Sie es in `x-openclaw-model`.
    Ohne diesen Header wird die Anfrage an das normale Embedding-Setup des ausgewählten Agenten durchgereicht.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu empfangen:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `data: <json>`
- Der Stream endet mit `data: [DONE]`

## Schnelleinrichtung für Open WebUI

Für eine grundlegende Open-WebUI-Verbindung:

- Basis-URL: `http://127.0.0.1:18789/v1`
- Docker-Base-URL auf macOS: `http://host.docker.internal:18789/v1`
- API-Schlüssel: Ihr Gateway-Bearer-Token
- Modell: `openclaw/default`

Erwartetes Verhalten:

- `GET /v1/models` sollte `openclaw/default` auflisten
- Open WebUI sollte `openclaw/default` als Chat-Modell-ID verwenden
- Wenn Sie für diesen Agenten einen bestimmten Backend-Provider/ein bestimmtes Modell möchten, setzen Sie das normale Standardmodell des Agenten oder senden Sie `x-openclaw-model`

Schneller Smoke-Test:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Wenn das `openclaw/default` zurückgibt, können sich die meisten Open-WebUI-Setups mit derselben Basis-URL und demselben Token verbinden.

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

- `/v1/models` gibt OpenClaw-Agentenziele zurück, keine rohen Provider-Kataloge.
- `openclaw/default` ist immer vorhanden, sodass eine stabile ID über Umgebungen hinweg funktioniert.
- Überschreibungen für Backend-Provider/Modell gehören in `x-openclaw-model`, nicht in das OpenAI-Feld `model`.
- `/v1/embeddings` unterstützt `input` als Zeichenfolge oder Array von Zeichenfolgen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [OpenAI](/de/providers/openai)
