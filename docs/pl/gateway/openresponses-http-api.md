---
read_when:
    - Integracja klientów korzystających z OpenResponses API
    - Chcesz używać wejść opartych na elementach, wywołań narzędzi klienta lub zdarzeń SSE
summary: Udostępnij zgodny z OpenResponses endpoint HTTP `/v1/responses` z Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T13:48:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Gateway OpenClaw może udostępniać zgodny z OpenResponses endpoint `POST /v1/responses`.

Ten endpoint jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/responses`
- Ten sam port co Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co
`openclaw agent`), więc routing/uprawnienia/konfiguracja są zgodne z Twoim Gateway.

## Uwierzytelnianie, bezpieczeństwo i routing

Zachowanie operacyjne odpowiada [OpenAI Chat Completions](/pl/gateway/openai-http-api):

- użyj pasującej ścieżki uwierzytelniania HTTP Gateway:
  - uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`): `Authorization: Bearer <token-or-password>`
  - uwierzytelnianie trusted-proxy (`gateway.auth.mode="trusted-proxy"`): nagłówki proxy świadome tożsamości z skonfigurowanego źródła trusted proxy bez loopback
  - otwarte uwierzytelnianie private-ingress (`gateway.auth.mode="none"`): bez nagłówka uwierzytelniania
- traktuj endpoint jako pełny dostęp operatora do instancji Gateway
- dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) ignoruj węższe wartości `x-openclaw-scopes` zadeklarowane w bearer i przywracaj normalne pełne domyślne ustawienia operatora
- dla zaufanych trybów HTTP niosących tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"`) honoruj `x-openclaw-scopes`, gdy jest obecne, a w przeciwnym razie wracaj do normalnego domyślnego zestawu zakresów operatora
- wybieraj agentów przez `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` lub `x-openclaw-agent-id`
- używaj `x-openclaw-model`, gdy chcesz nadpisać backendowy model wybranego agenta
- używaj `x-openclaw-session-key` do jawnego routingu sesji
- używaj `x-openclaw-message-channel`, gdy chcesz kontekst syntetycznego kanału wejściowego inny niż domyślny

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - dowodzi posiadania współdzielonego sekretu operatora Gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym endpointcie jako tury nadawcy-właściciela
- zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"` na prywatnym ingressie)
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówek jest nieobecny
  - tracą semantykę właściciela tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Włączaj lub wyłączaj ten endpoint przez `gateway.http.endpoints.responses.enabled`.

Ta sama powierzchnia zgodności obejmuje również:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Aby uzyskać kanoniczne wyjaśnienie, jak łączą się modele kierowane na agentów, `openclaw/default`, pass-through embeddings i nadpisania modeli backendowych, zobacz [OpenAI Chat Completions](/pl/gateway/openai-http-api#agent-first-model-contract) i [Lista modeli i routing agentów](/pl/gateway/openai-http-api#model-list-and-agent-routing).

## Zachowanie sesji

Domyślnie endpoint jest **bezstanowy per żądanie** (dla każdego wywołania generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg `user` OpenResponses, Gateway wyprowadza z niego stabilny klucz sesji,
dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Kształt żądania (obsługiwany)

Żądanie jest zgodne z OpenResponses API z wejściem opartym na elementach. Obecnie obsługiwane:

- `input`: ciąg znaków lub tablica obiektów elementów.
- `instructions`: scalane z promptem systemowym.
- `tools`: definicje narzędzi klienta (narzędzia funkcyjne).
- `tool_choice`: filtruje lub wymusza narzędzia klienta.
- `stream`: włącza streaming SSE.
- `max_output_tokens`: limit wyjścia best-effort (zależny od providera).
- `user`: stabilny routing sesji.

Akceptowane, ale **obecnie ignorowane**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Obsługiwane:

- `previous_response_id`: OpenClaw ponownie używa sesji wcześniejszej odpowiedzi, gdy żądanie pozostaje w tym samym zakresie agent/user/requested-session.

## Elementy (`input`)

### `message`

Role: `system`, `developer`, `user`, `assistant`.

- `system` i `developer` są dołączane do promptu systemowego.
- Najnowszy element `user` lub `function_call_output` staje się „bieżącą wiadomością”.
- Wcześniejsze wiadomości użytkownika/asystenta są uwzględniane jako historia dla kontekstu.

### `function_call_output` (narzędzia oparte na turach)

Wyślij wyniki narzędzia z powrotem do modelu:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` i `item_reference`

Akceptowane dla zgodności ze schematem, ale ignorowane podczas budowania promptu.

## Narzędzia (narzędzia funkcyjne po stronie klienta)

Dostarczaj narzędzia przez `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Jeśli agent zdecyduje się wywołać narzędzie, odpowiedź zwróci element wyjściowy `function_call`.
Następnie wysyłasz kolejne żądanie z `function_call_output`, aby kontynuować turę.

## Obrazy (`input_image`)

Obsługuje źródła base64 lub URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Dozwolone typy MIME (obecnie): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Maksymalny rozmiar (obecnie): 10 MB.

## Pliki (`input_file`)

Obsługuje źródła base64 lub URL:

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

Dozwolone typy MIME (obecnie): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Maksymalny rozmiar (obecnie): 5 MB.

Bieżące zachowanie:

- Zawartość pliku jest dekodowana i dodawana do **promptu systemowego**, a nie do wiadomości użytkownika,
  dzięki czemu pozostaje efemeryczna (nie jest utrwalana w historii sesji).
- Zdekodowany tekst pliku jest opakowywany jako **niezaufana zawartość zewnętrzna** przed dodaniem,
  więc bajty pliku są traktowane jako dane, a nie zaufane instrukcje.
- Wstrzykiwany blok używa jawnych znaczników granic, takich jak
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` i zawiera
  wiersz metadanych `Source: External`.
- Ta ścieżka wejścia pliku celowo pomija długi baner `SECURITY NOTICE:`,
  aby zachować budżet promptu; znaczniki granic i metadane nadal pozostają na miejscu.
- PDF-y są najpierw analizowane pod kątem tekstu. Jeśli tekstu jest niewiele, pierwsze strony są
  rasteryzowane do obrazów i przekazywane do modelu, a wstrzykiwany blok pliku używa
  placeholdera `[PDF content rendered to images]`.

Parsowanie PDF jest zapewniane przez dołączony Plugin `document-extract`, który używa
przyjaznej dla Node starszej wersji `pdfjs-dist` (bez workera). Nowoczesna wersja PDF.js
oczekuje browser workers/DOM globals, więc nie jest używana w Gateway.

Domyślne ustawienia pobierania URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (łączna liczba części `input_file` + `input_image` opartych na URL na żądanie)
- Żądania są chronione (rozwiązywanie DNS, blokowanie prywatnych IP, limity przekierowań, timeouty).
- Opcjonalne allowlisty nazw hostów są obsługiwane per typ wejścia (`files.urlAllowlist`, `images.urlAllowlist`).
  - Dokładny host: `"cdn.example.com"`
  - Subdomeny wildcard: `"*.assets.example.com"` (nie pasuje do domeny głównej)
  - Puste lub pominięte allowlisty oznaczają brak ograniczenia allowlisty nazw hostów.
- Aby całkowicie wyłączyć pobieranie na podstawie URL, ustaw `files.allowUrl: false` i/lub `images.allowUrl: false`.

## Limity plików i obrazów (config)

Wartości domyślne można dostroić w `gateway.http.endpoints.responses`:

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

Wartości domyślne po pominięciu:

- `maxBodyBytes`: 20 MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5 MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10 s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10 MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10 s
- Źródła `input_image` HEIC/HEIF są akceptowane i normalizowane do JPEG przed dostarczeniem do providera.

Uwaga dotycząca bezpieczeństwa:

- Allowlisty URL są egzekwowane przed pobraniem i przy przekierowaniach.
- Umieszczenie nazwy hosta na allowliście nie omija blokowania prywatnych/wewnętrznych adresów IP.
- Dla Gateway wystawionych do internetu stosuj kontrolę ruchu wychodzącego na poziomie sieci oprócz zabezpieczeń aplikacyjnych.
  Zobacz [Bezpieczeństwo](/pl/gateway/security).

## Streaming (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każdy wiersz zdarzenia ma postać `event: <type>` i `data: <json>`
- Strumień kończy się `data: [DONE]`

Obecnie emitowane typy zdarzeń:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (przy błędzie)

## Użycie

`usage` jest wypełniane, gdy bazowy provider raportuje liczbę tokenów.
OpenClaw normalizuje typowe aliasy w stylu OpenAI, zanim te liczniki trafią
do powierzchni statusu/sesji downstream, w tym `input_tokens` / `output_tokens`
oraz `prompt_tokens` / `completion_tokens`.

## Błędy

Błędy używają obiektu JSON w rodzaju:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Typowe przypadki:

- `401` brakujące/nieprawidłowe uwierzytelnianie
- `400` nieprawidłowe ciało żądania
- `405` nieprawidłowa metoda

## Przykłady

Bez streamingu:

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

## Powiązane

- [OpenAI chat completions](/pl/gateway/openai-http-api)
- [OpenAI](/pl/providers/openai)
