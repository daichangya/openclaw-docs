---
read_when:
    - Integration von Clients, die die OpenResponses API sprechen
    - Sie möchten elementbasierte Eingaben, Client-Tool-Aufrufe oder SSE-Ereignisse verwenden
summary: Einen OpenResponses-kompatiblen HTTP-Endpunkt `/v1/responses` aus dem Gateway bereitstellen
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-05T12:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

Das Gateway von OpenClaw kann einen OpenResponses-kompatiblen Endpunkt `POST /v1/responses` bereitstellen.

Dieser Endpunkt ist **standardmäßig deaktiviert**. Aktivieren Sie ihn zuerst in der Konfiguration.

- `POST /v1/responses`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplexing): `http://<gateway-host>:<port>/v1/responses`

Unter der Haube werden Anfragen als normaler Gateway-Agent-Lauf ausgeführt (derselbe Codepfad wie
`openclaw agent`), daher entsprechen Routing/Berechtigungen/Konfiguration Ihrem Gateway.

## Authentifizierung, Sicherheit und Routing

Das Betriebsverhalten entspricht [OpenAI Chat Completions](/gateway/openai-http-api):

- Verwenden Sie den passenden Gateway-HTTP-Authentifizierungspfad:
  - Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`): `Authorization: Bearer <token-or-password>`
  - Trusted-Proxy-Authentifizierung (`gateway.auth.mode="trusted-proxy"`): identitätsbewusste Proxy-Header aus einer konfigurierten nicht-loopback Trusted-Proxy-Quelle
  - offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`): kein Auth-Header
- Behandeln Sie den Endpunkt als vollständigen Operatorzugriff für die Gateway-Instanz
- Ignorieren Sie für Shared-Secret-Authentifizierungsmodi (`token` und `password`) engere per Bearer deklarierte Werte in `x-openclaw-scopes` und stellen Sie die normalen vollständigen Operator-Standards wieder her
- Beachten Sie für vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"`) `x-openclaw-scopes`, wenn der Header vorhanden ist, und greifen Sie andernfalls auf die normale Standardmenge der Operator-Scopes zurück
- Wählen Sie Agenten mit `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oder `x-openclaw-agent-id`
- Verwenden Sie `x-openclaw-model`, wenn Sie das Backend-Modell des ausgewählten Agenten überschreiben möchten
- Verwenden Sie `x-openclaw-session-key` für explizites Sitzungsrouting
- Verwenden Sie `x-openclaw-message-channel`, wenn Sie einen nicht standardmäßigen synthetischen Ingress-Kanalkontext möchten

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - weist den Besitz des gemeinsamen Gateway-Operator-Secrets nach
  - ignoriert engere `x-openclaw-scopes`
  - stellt die vollständige Standardmenge der Operator-Scopes wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt Chat-Turns an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - beachten `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf die normale Standardmenge der Operator-Scopes zurück, wenn der Header fehlt
  - verlieren die Owner-Semantik nur dann, wenn der Aufrufer die Scopes explizit einschränkt und `operator.admin` weglässt

Aktivieren oder deaktivieren Sie diesen Endpunkt mit `gateway.http.endpoints.responses.enabled`.

Dieselbe Kompatibilitätsoberfläche umfasst außerdem:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Für die kanonische Erklärung, wie agentenzielgerichtete Modelle, `openclaw/default`, das Durchreichen von Embeddings und Überschreibungen von Backend-Modellen zusammenpassen, siehe [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) und [Modellliste und Agent-Routing](/gateway/openai-http-api#model-list-and-agent-routing).

## Sitzungsverhalten

Standardmäßig ist der Endpunkt **zustandslos pro Anfrage** (bei jedem Aufruf wird ein neuer Sitzungsschlüssel erzeugt).

Wenn die Anfrage einen OpenResponses-String `user` enthält, leitet das Gateway daraus einen stabilen Sitzungsschlüssel ab,
sodass wiederholte Aufrufe dieselbe Agentensitzung teilen können.

## Anfrageform (unterstützt)

Die Anfrage folgt der OpenResponses API mit elementbasierter Eingabe. Aktueller Unterstützungsumfang:

- `input`: String oder Array von Elementobjekten.
- `instructions`: wird in den System-Prompt zusammengeführt.
- `tools`: Client-Tool-Definitionen (Function Tools).
- `tool_choice`: filtert Client-Tools oder verlangt sie.
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

- `previous_response_id`: OpenClaw verwendet die frühere Antwortsitzung erneut, wenn die Anfrage innerhalb desselben Agenten-/Benutzer-/angeforderten Sitzungsbereichs bleibt.

## Elemente (input)

### `message`

Rollen: `system`, `developer`, `user`, `assistant`.

- `system` und `developer` werden an den System-Prompt angehängt.
- Das neueste Element `user` oder `function_call_output` wird zur „aktuellen Nachricht“.
- Frühere Benutzer-/Assistant-Nachrichten werden als Verlauf für den Kontext einbezogen.

### `function_call_output` (turn-basierte Tools)

Senden Sie Tool-Ergebnisse an das Modell zurück:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` und `item_reference`

Werden aus Kompatibilitätsgründen für das Schema akzeptiert, aber beim Erstellen des Prompts ignoriert.

## Tools (Client-seitige Function Tools)

Stellen Sie Tools mit `tools: [{ type: "function", function: { name, description?, parameters? } }]` bereit.

Wenn der Agent entscheidet, ein Tool aufzurufen, gibt die Antwort ein Ausgabeelement `function_call` zurück.
Sie senden dann eine Folgeanfrage mit `function_call_output`, um den Turn fortzusetzen.

## Bilder (`input_image`)

Unterstützt base64- oder URL-Quellen:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Erlaubte MIME-Typen (aktuell): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maximale Größe (aktuell): 10MB.

## Dateien (`input_file`)

Unterstützt base64- oder URL-Quellen:

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

Maximale Größe (aktuell): 5MB.

Aktuelles Verhalten:

- Der Dateiinhalt wird dekodiert und dem **System-Prompt** hinzugefügt, nicht der Benutzernachricht,
  sodass er flüchtig bleibt (nicht im Sitzungsverlauf gespeichert).
- Dekodierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** verpackt, bevor er hinzugefügt wird,
  sodass Dateibytes als Daten und nicht als vertrauenswürdige Anweisungen behandelt werden.
- Der eingefügte Block verwendet explizite Begrenzungsmarkierungen wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad für Dateieingaben lässt absichtlich das lange Banner `SECURITY NOTICE:` weg, um
  Prompt-Budget zu sparen; die Begrenzungsmarkierungen und Metadaten bleiben dennoch erhalten.
- PDFs werden zuerst auf Text geparst. Wenn wenig Text gefunden wird, werden die ersten Seiten
  zu Bildern gerastert und an das Modell übergeben, und der eingefügte Dateiblock verwendet
  den Platzhalter `[PDF content rendered to images]`.

Das PDF-Parsing verwendet den Node-freundlichen `pdfjs-dist`-Legacy-Build (ohne Worker). Der moderne
PDF.js-Build erwartet Browser-Worker/DOM-Globals und wird daher im Gateway nicht verwendet.

Standardeinstellungen für URL-Fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (Gesamtzahl URL-basierter Teile `input_file` + `input_image` pro Anfrage)
- Anfragen werden geschützt (DNS-Auflösung, Blockierung privater IPs, Redirect-Limits, Timeouts).
- Optionale Hostname-Allowlists werden pro Eingabetyp unterstützt (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exakter Host: `"cdn.example.com"`
  - Wildcard-Subdomains: `"*.assets.example.com"` (entspricht nicht der Apex-Domain)
  - Leere oder fehlende Allowlists bedeuten keine Hostname-Allowlist-Einschränkung.
- Um URL-basierte Fetches vollständig zu deaktivieren, setzen Sie `files.allowUrl: false` und/oder `images.allowUrl: false`.

## Datei- + Bildlimits (Konfiguration)

Standardeinstellungen können unter `gateway.http.endpoints.responses` angepasst werden:

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

Standardeinstellungen, wenn weggelassen:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4.000.000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF-Quellen für `input_image` werden akzeptiert und vor der Übergabe an den Provider zu JPEG normalisiert.

Sicherheitshinweis:

- URL-Allowlists werden vor dem Fetch und bei Redirect-Hops durchgesetzt.
- Das Zulassen eines Hostnamens umgeht nicht die Blockierung privater/interner IPs.
- Für Gateways mit Internetzugang sollten Sie zusätzlich zu den Schutzmechanismen auf Anwendungsebene Network-Egress-Kontrollen anwenden.
  Siehe [Security](/gateway/security).

## Streaming (SSE)

Setzen Sie `stream: true`, um Server-Sent Events (SSE) zu erhalten:

- `Content-Type: text/event-stream`
- Jede Ereigniszeile ist `event: <type>` und `data: <json>`
- Der Stream endet mit `data: [DONE]`

Derzeit ausgegebene Ereignistypen:

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

`usage` wird ausgefüllt, wenn der zugrunde liegende Provider Token-Zähler meldet.
OpenClaw normalisiert gängige OpenAI-ähnliche Aliase, bevor diese Zähler in
nachgelagerte Status-/Sitzungsoberflächen gelangen, einschließlich `input_tokens` / `output_tokens`
und `prompt_tokens` / `completion_tokens`.

## Fehler

Fehler verwenden ein JSON-Objekt wie:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Häufige Fälle:

- `401` fehlende/ungültige Authentifizierung
- `400` ungültiger Anfrage-Body
- `405` falsche Methode

## Beispiele

Nicht streamend:

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

Streamend:

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
