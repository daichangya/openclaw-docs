---
read_when:
    - Clients integrieren, die die OpenResponses API sprechen.
    - Sie möchten elementbasierte Eingaben, Client-Tool-Aufrufe oder SSE-Ereignisse.
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt `/v1/responses` über das Gateway bereitstellen
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-24T06:38:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

Das Gateway von OpenClaw kann einen OpenResponses-kompatiblen Endpunkt `POST /v1/responses` bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/v1/responses`

Unter der Haube werden Requests als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), sodass Routing/Berechtigungen/Konfiguration zu Ihrem Gateway passen.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/de/gateway/openai-http-api):

- verwenden Sie den passenden Gateway-HTTP-Auth-Pfad:
  - Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): identity-aware Proxy-Header aus einer konfigurierten nicht-loopback Trusted-Proxy-Quelle
  - offene private-ingress-Authentifizierung (`gateway.auth.mode="none"`): kein Auth-Header
- behandeln Sie den Endpunkt als vollständigen Operator-Zugriff für die Gateway-Instanz
- bei Shared-Secret-Authentifizierungsmodi (`token` und `password`) ignorieren Sie engere durch Bearer deklarierte `x-openclaw-scopes`-Werte und stellen die normalen vollständigen Operator-Standards wieder her
- bei vertrauenswürdigen HTTP-Modi mit Identitätsträgern (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) `x-openclaw-scopes` berücksichtigen, wenn vorhanden, und andernfalls auf den normalen Standardumfang für Operatoren zurückfallen
- Agenten auswählen mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id`
- `x-openclaw-model` verwenden, wenn Sie das Backend-Modell des ausgewählten Agenten überschreiben möchten
- `x-openclaw-session-key` für explizites Sitzungsrouting verwenden
- `x-openclaw-message-channel` verwenden, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Channel-Kontext möchten

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standardumfang für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige HTTP-Modi mit Identitätsträgern (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - fallen auf den normalen Standardumfang für Operatoren zurück, wenn der Header fehlt
  - verlieren Owner-Semantik nur dann, wenn der Aufrufer Scopes explizit einschränkt und `operator.admin` weglässt

Aktivieren oder deaktivieren Sie diesen Endpunkt mit `gateway.http.endpoints.responses.enabled`.

Dieselbe Kompatibilitätsoberfläche enthält außerdem:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Für die kanonische Erklärung, wie agentenbezogene Zielmodelle, `openclaw/default`, Embeddings-Passthrough und Überschreibungen des Backend-Modells zusammenpassen, siehe [OpenAI Chat Completions](/de/gateway/openai-http-api#agent-first-model-contract) und [Model list and agent routing](/de/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **pro Request zustandslos** (für jeden Aufruf wird ein neuer Sitzungsschlüssel generiert).

Wenn der Request einen OpenResponses-String `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel
ab, sodass wiederholte Aufrufe eine Agent-Sitzung teilen können.

## Request-Form (unterstützt)

Der Request folgt der OpenResponses API mit elementbasiertem Input. Aktuell unterstützt:

- `input`: String oder Array von Elementobjekten.
- `instructions`: wird mit dem System-Prompt zusammengeführt.
- `tools`: Tool-Definitionen des Clients (Function-Tools).
- `tool_choice`: Client-Tools filtern oder erzwingen.
- `stream`: aktiviert SSE-Streaming.
- `max_output_tokens`: Best-Effort-Ausgabelimit (providerabhängig).
- `user`: stabiles Sitzungsrouting.

Akzeptiert, aber **derzeit ignoriert**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Unterstützt:

- `previous_response_id`: OpenClaw verwendet die frühere Response-Sitzung erneut, wenn der Request im selben Agent-/User-/angeforderten-Sitzungsbereich bleibt.

## Elemente (Input)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das aktuellste Element `user` oder `function_call_output` wird zur „aktuellen Nachricht“.
- Frühere User-/Assistant-Nachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (turn-basierte Tools)

Tool-Ergebnisse an das Modell zurücksenden:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Gründen der Schema-Kompatibilität akzeptiert, aber beim Aufbau des Prompts ignoriert.

## Tools (clientseitige Function-Tools)

Stellen Sie Tools mit `tools: [{ type: "function", function: { name, description?, parameters? } }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Response ein Ausgabeelement `function_call` zurück.
Dann senden Sie einen Folge-Request mit `function_call_output`, um den Turn fortzusetzen.

## Bilder (`input_image`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Erlaubte MIME-Typen (aktuell): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maximale Größe (aktuell): 10 MB.

## Dateien (`input_file`)

Unterstützt Base64- oder URL-Quellen:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Erlaubte MIME-Typen (aktuell): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maximale Größe (aktuell): 5 MB.

Aktuelles Verhalten:

- Dateiinhalte werden decodiert und zum **System-Prompt** hinzugefügt, nicht zur User-Nachricht,
  sodass sie ephemer bleiben (nicht im Sitzungsverlauf persistiert werden).
- Decodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** verpackt, bevor er hinzugefügt wird,
  sodass Dateibytes als Daten und nicht als vertrauenswürdige Instruktionen behandelt werden.
- Der injizierte Block verwendet explizite Boundary-Marker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Datei-Input-Pfad lässt absichtlich das lange Banner `SECURITY NOTICE:` weg,
  um das Prompt-Budget zu schonen; die Boundary-Marker und Metadaten bleiben dennoch erhalten.
- PDFs werden zuerst auf Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  in Bilder gerastert und an das Modell übergeben, und der injizierte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

Das PDF-Parsing verwendet den Node-freundlichen Legacy-Build von `pdfjs-dist` (ohne Worker). Der moderne
PDF.js-Build erwartet Browser-Worker/DOM-Globals und wird deshalb im Gateway nicht verwendet.

Standards für URL-Fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (gesamtzahl der URL-basierten Teile `input_file` + `input_image` pro Request)
- Requests sind abgesichert (DNS-Auflösung, Blockieren privater IPs, Redirect-Limits, Timeouts).
- Optionale Hostname-Allowlists werden pro Input-Typ unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (passt nicht auf die Apex-Domain)
  - Leere oder weggelassene Allowlists bedeuten keine Einschränkung durch Hostname-Allowedlists.
- Um URL-basierte Fetches vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Datei- + Bildlimits (Konfiguration)

Standards können unter `gateway.http.endpoints.responses` angepasst werden:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Standards, wenn weggelassen:

- `maxBodyBytes`: 20 MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5 MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10 s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4.000.000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10 MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10 s
- Quellen `input_image` mit HEIC/HEIF werden akzeptiert und vor der Zustellung an den Provider zu JPEG normalisiert.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Fetch und bei Redirect-Hops durchgesetzt.
- Das Zulassen eines Hostnamens umgeht nicht das Blockieren privater/interner IPs.
- Für dem Internet ausgesetzte Gateways sollten zusätzlich zu Schutzmechanismen auf Anwendungsebene Netzwerk-Egress-Kontrollen angewendet werden.
  Siehe [Security](/de/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu erhalten:

- `Content-Type: text/event-stream`
- Jede Event-Zeile ist `event: <type>` und `data: <json>`
- Der Stream endet mit `data: [DONE]`

Derzeit ausgegebene Event-Typen:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (bei Fehlern)

## Nutzung

`usage` wird befüllt, wenn der zugrunde liegende Provider Token-Anzahlen meldet.
OpenClaw normalisiert gängige OpenAI-ähnliche Aliase, bevor diese Zähler
nachgelagerte Status-/Sitzungsoberflächen erreichen, einschließlich `input_tokens` / `output_tokens`
und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle:

- `401` fehlende/ungültige Authentifizierung
- `400` ungültiger Request-Body
- `405` falsche Methode

## Beispiele

Nicht-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Verwandt

- [OpenAI chat completions](/de/gateway/openai-http-api)
- [OpenAI](/de/providers/openai)
