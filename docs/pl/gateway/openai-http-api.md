---
read_when:
    - Integracja narzędzi oczekujących OpenAI Chat Completions
summary: Udostępnij zgodny z OpenAI punkt końcowy HTTP `/v1/chat/completions` z Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-25T13:48:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

Gateway OpenClaw może udostępniać niewielki punkt końcowy Chat Completions zgodny z OpenAI.

Ten punkt końcowy jest **domyślnie wyłączony**. Najpierw włącz go w konfiguracji.

- `POST /v1/chat/completions`
- Ten sam port co Gateway (multipleksowanie WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Gdy zgodna z OpenAI powierzchnia HTTP Gateway jest włączona, udostępnia ona również:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Pod spodem żądania są wykonywane jako zwykłe uruchomienie agenta Gateway (ta sama ścieżka kodu co `openclaw agent`), więc routing/uprawnienia/konfiguracja są zgodne z Twoim Gateway.

## Uwierzytelnianie

Używa konfiguracji uwierzytelniania Gateway.

Typowe ścieżki uwierzytelniania HTTP:

- uwierzytelnianie współdzielonym sekretem (`gateway.auth.mode="token"` lub `"password"`):
  `Authorization: Bearer <token-or-password>`
- zaufane uwierzytelnianie HTTP niosące tożsamość (`gateway.auth.mode="trusted-proxy"`):
  kieruj ruch przez skonfigurowane proxy świadome tożsamości i pozwól mu wstrzyknąć
  wymagane nagłówki tożsamości
- otwarte uwierzytelnianie prywatnego wejścia (`gateway.auth.mode="none"`):
  nie jest wymagany nagłówek uwierzytelniania

Uwagi:

- Gdy `gateway.auth.mode="token"`, użyj `gateway.auth.token` (lub `OPENCLAW_GATEWAY_TOKEN`).
- Gdy `gateway.auth.mode="password"`, użyj `gateway.auth.password` (lub `OPENCLAW_GATEWAY_PASSWORD`).
- Gdy `gateway.auth.mode="trusted-proxy"`, żądanie HTTP musi pochodzić ze
  skonfigurowanego, zaufanego źródła proxy spoza loopback; proxy loopback na tym samym hoście
  nie spełniają wymagań tego trybu.
- Jeśli skonfigurowano `gateway.auth.rateLimit` i wystąpi zbyt wiele nieudanych prób uwierzytelniania, punkt końcowy zwróci `429` z `Retry-After`.

## Granica bezpieczeństwa (ważne)

Traktuj ten punkt końcowy jako powierzchnię **pełnego dostępu operatora** do instancji gateway.

- Uwierzytelnianie bearer HTTP nie jest tutaj wąskim modelem zakresu per użytkownik.
- Prawidłowy token/hasło Gateway dla tego punktu końcowego należy traktować jak poświadczenie właściciela/operatora.
- Żądania przechodzą przez tę samą ścieżkę agenta control-plane co zaufane działania operatora.
- Na tym punkcie końcowym nie ma oddzielnej granicy narzędzi dla użytkownika innego niż owner/per-user; gdy wywołujący przejdzie uwierzytelnianie Gateway tutaj, OpenClaw traktuje go jako zaufanego operatora tego gateway.
- Dla trybów uwierzytelniania współdzielonym sekretem (`token` i `password`) punkt końcowy przywraca normalne pełne domyślne uprawnienia operatora, nawet jeśli wywołujący wyśle węższy nagłówek `x-openclaw-scopes`.
- Zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"`) honorują `x-openclaw-scopes`, gdy jest obecny, a w przeciwnym razie wracają do normalnego domyślnego zestawu zakresów operatora.
- Jeśli polityka docelowego agenta dopuszcza wrażliwe narzędzia, ten punkt końcowy może ich używać.
- Utrzymuj ten punkt końcowy wyłącznie na loopback/tailnet/prywatnym wejściu; nie wystawiaj go bezpośrednio do publicznego internetu.

Macierz uwierzytelniania:

- `gateway.auth.mode="token"` lub `"password"` + `Authorization: Bearer ...`
  - potwierdza posiadanie współdzielonego sekretu operatora gateway
  - ignoruje węższe `x-openclaw-scopes`
  - przywraca pełny domyślny zestaw zakresów operatora:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - traktuje tury czatu na tym punkcie końcowym jako tury nadawcy-owner
- zaufane tryby HTTP niosące tożsamość (na przykład uwierzytelnianie trusted proxy lub `gateway.auth.mode="none"` na prywatnym wejściu)
  - uwierzytelniają zewnętrzną zaufaną tożsamość lub granicę wdrożenia
  - honorują `x-openclaw-scopes`, gdy nagłówek jest obecny
  - wracają do normalnego domyślnego zestawu zakresów operatora, gdy nagłówka brakuje
  - tracą semantykę owner tylko wtedy, gdy wywołujący jawnie zawęzi zakresy i pominie `operator.admin`

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Dostęp zdalny](/pl/gateway/remote).

## Kontrakt model-first dla agenta

OpenClaw traktuje pole OpenAI `model` jako **cel agenta**, a nie surowy identyfikator modelu providera.

- `model: "openclaw"` kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/default"` także kieruje do skonfigurowanego domyślnego agenta.
- `model: "openclaw/<agentId>"` kieruje do konkretnego agenta.

Opcjonalne nagłówki żądania:

- `x-openclaw-model: <provider/model-or-bare-id>` nadpisuje backendowy model dla wybranego agenta.
- `x-openclaw-agent-id: <agentId>` pozostaje obsługiwane jako nadpisanie zgodności.
- `x-openclaw-session-key: <sessionKey>` w pełni kontroluje routing sesji.
- `x-openclaw-message-channel: <channel>` ustawia syntetyczny kontekst kanału wejściowego dla promptów i polityk świadomych kanału.

Nadal akceptowane aliasy zgodności:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Włączanie punktu końcowego

Ustaw `gateway.http.endpoints.chatCompletions.enabled` na `true`:

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

## Wyłączanie punktu końcowego

Ustaw `gateway.http.endpoints.chatCompletions.enabled` na `false`:

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

## Zachowanie sesji

Domyślnie punkt końcowy jest **bezstanowy per żądanie** (dla każdego wywołania generowany jest nowy klucz sesji).

Jeśli żądanie zawiera ciąg OpenAI `user`, Gateway wyprowadza z niego stabilny klucz sesji, dzięki czemu powtarzane wywołania mogą współdzielić sesję agenta.

## Dlaczego ta powierzchnia jest ważna

To zestaw zgodności o największej wartości dla samohostowanych frontendów i narzędzi:

- Większość konfiguracji Open WebUI, LobeChat i LibreChat oczekuje `/v1/models`.
- Wiele systemów RAG oczekuje `/v1/embeddings`.
- Istniejące klienty czatu OpenAI zwykle mogą zacząć od `/v1/chat/completions`.
- Bardziej natywne klienty agentowe coraz częściej preferują `/v1/responses`.

## Lista modeli i routing agentów

<AccordionGroup>
  <Accordion title="Co zwraca `/v1/models`?">
    Listę celów agentów OpenClaw.

    Zwracane identyfikatory to wpisy `openclaw`, `openclaw/default` oraz `openclaw/<agentId>`.
    Używaj ich bezpośrednio jako wartości OpenAI `model`.

  </Accordion>
  <Accordion title="Czy `/v1/models` wyświetla agentów czy sub-agentów?">
    Wyświetla cele agentów najwyższego poziomu, a nie backendowe modele providerów ani sub-agentów.

    Sub-agenci pozostają wewnętrzną topologią wykonania. Nie pojawiają się jako pseudo-modele.

  </Accordion>
  <Accordion title="Dlaczego uwzględniono `openclaw/default`?">
    `openclaw/default` to stabilny alias dla skonfigurowanego domyślnego agenta.

    Oznacza to, że klienty mogą nadal używać jednego przewidywalnego identyfikatora, nawet jeśli rzeczywisty identyfikator domyślnego agenta zmienia się między środowiskami.

  </Accordion>
  <Accordion title="Jak nadpisać backendowy model?">
    Użyj `x-openclaw-model`.

    Przykłady:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jeśli go pominiesz, wybrany agent uruchomi się ze swoim normalnie skonfigurowanym wyborem modelu.

  </Accordion>
  <Accordion title="Jak embeddingi wpisują się w ten kontrakt?">
    `/v1/embeddings` używa tych samych identyfikatorów `model` będących celami agentów.

    Użyj `model: "openclaw/default"` lub `model: "openclaw/<agentId>"`.
    Gdy potrzebujesz konkretnego modelu embeddingów, wyślij go w `x-openclaw-model`.
    Bez tego nagłówka żądanie przechodzi do normalnej konfiguracji embeddingów wybranego agenta.

  </Accordion>
</AccordionGroup>

## Strumieniowanie (SSE)

Ustaw `stream: true`, aby otrzymywać Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Każda linia zdarzenia ma postać `data: <json>`
- Strumień kończy się `data: [DONE]`

## Szybka konfiguracja Open WebUI

Dla podstawowego połączenia Open WebUI:

- Bazowy URL: `http://127.0.0.1:18789/v1`
- Bazowy URL Dockera na macOS: `http://host.docker.internal:18789/v1`
- Klucz API: token bearer Twojego Gateway
- Model: `openclaw/default`

Oczekiwane zachowanie:

- `GET /v1/models` powinno wyświetlać `openclaw/default`
- Open WebUI powinno używać `openclaw/default` jako identyfikatora modelu czatu
- Jeśli chcesz konkretny backend provider/model dla tego agenta, ustaw normalny domyślny model agenta albo wyślij `x-openclaw-model`

Szybki smoke:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jeśli to zwróci `openclaw/default`, większość konfiguracji Open WebUI może połączyć się z tym samym bazowym URL i tokenem.

## Przykłady

Bez strumieniowania:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Strumieniowanie:

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

Wyświetl modele:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Pobierz jeden model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Utwórz embeddingi:

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

Uwagi:

- `/v1/models` zwraca cele agentów OpenClaw, a nie surowe katalogi providerów.
- `openclaw/default` jest zawsze obecne, więc jeden stabilny identyfikator działa w różnych środowiskach.
- Nadpisania backendowego providera/modelu należą do `x-openclaw-model`, a nie do pola OpenAI `model`.
- `/v1/embeddings` obsługuje `input` jako ciąg lub tablicę ciągów.

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [OpenAI](/pl/providers/openai)
