---
read_when:
    - Integrazione di client che parlano l'API OpenResponses
    - Vuoi input basati su item, chiamate strumenti del client o eventi SSE
summary: Esporre un endpoint HTTP `/v1/responses` compatibile con OpenResponses dal Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-25T13:48:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Il Gateway di OpenClaw può esporre un endpoint `POST /v1/responses` compatibile con OpenResponses.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/responses`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Sotto il cofano, le richieste vengono eseguite come una normale esecuzione dell'agente Gateway (stesso percorso di codice di
`openclaw agent`), quindi instradamento/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione, sicurezza e instradamento

Il comportamento operativo corrisponde a [OpenAI Chat Completions](/it/gateway/openai-http-api):

- usa il percorso auth HTTP del Gateway corrispondente:
  - auth con segreto condiviso (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
  - auth trusted-proxy (`gateway.auth.mode="trusted-proxy"`): header del proxy identity-aware da una sorgente trusted proxy non-loopback configurata
  - auth aperta su ingress privato (`gateway.auth.mode="none"`): nessun header auth
- tratta l'endpoint come accesso operatore completo per l'istanza Gateway
- per le modalità auth con segreto condiviso (`token` e `password`), ignora valori `x-openclaw-scopes` dichiarati nel bearer più restrittivi e ripristina i normali valori predefiniti completi dell'operatore
- per le modalità HTTP attendibili con identità (ad esempio auth trusted proxy o `gateway.auth.mode="none"`), rispetta `x-openclaw-scopes` quando presente e altrimenti usa come fallback il normale insieme di scope operatore predefinito
- seleziona gli agenti con `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` oppure `x-openclaw-agent-id`
- usa `x-openclaw-model` quando vuoi sovrascrivere il modello backend dell'agente selezionato
- usa `x-openclaw-session-key` per l'instradamento esplicito della sessione
- usa `x-openclaw-message-channel` quando vuoi un contesto di canale di ingresso sintetico non predefinito

Matrice auth:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più restrittivi
  - ripristina l'insieme completo degli scope operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni chat su questo endpoint come turni del mittente owner
- modalità HTTP attendibili con identità (ad esempio auth trusted proxy, oppure `gateway.auth.mode="none"` su ingress privato)
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - usano come fallback il normale insieme di scope operatore predefinito quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli scope e omette `operator.admin`

Abilita o disabilita questo endpoint con `gateway.http.endpoints.responses.enabled`.

La stessa superficie di compatibilità include anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Per la spiegazione canonica di come si combinano modelli target-agente, `openclaw/default`, passthrough embeddings e override dei modelli backend, vedi [OpenAI Chat Completions](/it/gateway/openai-http-api#agent-first-model-contract) e [Elenco modelli e instradamento agente](/it/gateway/openai-http-api#model-list-and-agent-routing).

## Comportamento della sessione

Per impostazione predefinita l'endpoint è **stateless per richiesta** (viene generata una nuova chiave di sessione a ogni chiamata).

Se la richiesta include una stringa OpenResponses `user`, il Gateway deriva da essa una chiave di sessione stabile,
così le chiamate ripetute possono condividere una sessione agente.

## Forma della richiesta (supportata)

La richiesta segue l'API OpenResponses con input basato su item. Supporto attuale:

- `input`: stringa o array di oggetti item.
- `instructions`: unito al prompt di sistema.
- `tools`: definizioni di strumenti del client (strumenti function).
- `tool_choice`: filtra o richiede strumenti del client.
- `stream`: abilita lo streaming SSE.
- `max_output_tokens`: limite best-effort dell'output (dipende dal provider).
- `user`: instradamento stabile della sessione.

Accettati ma **attualmente ignorati**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Supportato:

- `previous_response_id`: OpenClaw riusa la sessione della risposta precedente quando la richiesta resta nello stesso ambito agente/utente/sessione richiesta.

## Item (input)

### `message`

Ruoli: `system`, `developer`, `user`, `assistant`.

- `system` e `developer` vengono aggiunti al prompt di sistema.
- L'item `user` o `function_call_output` più recente diventa il “messaggio corrente”.
- I messaggi utente/assistant precedenti vengono inclusi come cronologia per il contesto.

### `function_call_output` (strumenti turn-based)

Invia i risultati degli strumenti al modello:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` e `item_reference`

Accettati per compatibilità con lo schema ma ignorati nella costruzione del prompt.

## Strumenti (strumenti function lato client)

Fornisci gli strumenti con `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Se l'agente decide di chiamare uno strumento, la risposta restituisce un item di output `function_call`.
Poi invii una richiesta successiva con `function_call_output` per continuare il turno.

## Immagini (`input_image`)

Supporta sorgenti base64 o URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Tipi MIME consentiti (attuali): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Dimensione massima (attuale): 10MB.

## File (`input_file`)

Supporta sorgenti base64 o URL:

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

Tipi MIME consentiti (attuali): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Dimensione massima (attuale): 5MB.

Comportamento attuale:

- Il contenuto del file viene decodificato e aggiunto al **prompt di sistema**, non al messaggio utente,
  così resta effimero (non persiste nella cronologia della sessione).
- Il testo del file decodificato viene racchiuso come **contenuto esterno non attendibile** prima di essere aggiunto,
  quindi i byte del file vengono trattati come dati, non come istruzioni attendibili.
- Il blocco iniettato usa marcatori di confine espliciti come
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e include una
  riga di metadati `Source: External`.
- Questo percorso di input file omette intenzionalmente il lungo banner `SECURITY NOTICE:`
  per preservare il budget del prompt; i marcatori di confine e i metadati restano comunque presenti.
- I PDF vengono prima analizzati per il testo. Se viene trovato poco testo, le prime pagine vengono
  rasterizzate in immagini e passate al modello, e il blocco file iniettato usa
  il segnaposto `[PDF content rendered to images]`.

L'analisi dei PDF è fornita dal Plugin `document-extract` incluso, che usa la
build legacy di `pdfjs-dist` compatibile con Node (senza worker). La moderna build PDF.js
richiede worker browser/global DOM, quindi non viene usata nel Gateway.

Valori predefiniti per il fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (numero totale di parti `input_file` + `input_image` basate su URL per richiesta)
- Le richieste sono protette (risoluzione DNS, blocco IP privati, limiti ai redirect, timeout).
- Sono supportate allowlist opzionali di hostname per tipo di input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host esatto: `"cdn.example.com"`
  - Sottodomini wildcard: `"*.assets.example.com"` (non corrisponde all'apice)
  - Allowlist vuote o omesse significano nessuna restrizione di allowlist hostname.
- Per disabilitare completamente i fetch basati su URL, imposta `files.allowUrl: false` e/o `images.allowUrl: false`.

## Limiti di file + immagini (configurazione)

I valori predefiniti possono essere regolati sotto `gateway.http.endpoints.responses`:

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

Valori predefiniti quando omessi:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Le sorgenti `input_image` HEIC/HEIF sono accettate e normalizzate in JPEG prima della consegna al provider.

Nota di sicurezza:

- Le allowlist URL vengono applicate prima del fetch e sui salti di redirect.
- Consentire un hostname in allowlist non aggira il blocco degli IP privati/interni.
- Per gateway esposti su internet, applica controlli di egress di rete oltre alle protezioni a livello applicativo.
  Vedi [Sicurezza](/it/gateway/security).

## Streaming (SSE)

Imposta `stream: true` per ricevere eventi Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `event: <type>` e `data: <json>`
- Lo stream termina con `data: [DONE]`

Tipi di evento attualmente emessi:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (in caso di errore)

## Utilizzo

`usage` viene popolato quando il provider sottostante riporta i conteggi dei token.
OpenClaw normalizza gli alias comuni in stile OpenAI prima che questi contatori raggiungano
le superfici downstream di stato/sessione, inclusi `input_tokens` / `output_tokens`
e `prompt_tokens` / `completion_tokens`.

## Errori

Gli errori usano un oggetto JSON come:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Casi comuni:

- `401` auth mancante/non valida
- `400` body della richiesta non valido
- `405` metodo errato

## Esempi

Senza streaming:

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

Con streaming:

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

## Correlati

- [OpenAI chat completions](/it/gateway/openai-http-api)
- [OpenAI](/it/providers/openai)
