---
read_when:
    - Integrare strumenti che si aspettano Chat Completions di OpenAI
summary: Esporre un endpoint HTTP `/v1/chat/completions` compatibile con OpenAI dal Gateway
title: completamenti chat OpenAI
x-i18n:
    generated_at: "2026-04-25T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a2f45abfc0aef8f73ab909bc3007de4078177214e5e0e5cf27a4c6ad0918172
    source_path: gateway/openai-http-api.md
    workflow: 15
---

Il Gateway di OpenClaw può esporre un piccolo endpoint Chat Completions compatibile con OpenAI.

Questo endpoint è **disabilitato per impostazione predefinita**. Abilitalo prima nella configurazione.

- `POST /v1/chat/completions`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Quando la superficie HTTP compatibile con OpenAI del Gateway è abilitata, espone anche:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Dietro le quinte, le richieste vengono eseguite come una normale esecuzione agente del Gateway (stesso codepath di `openclaw agent`), quindi instradamento/permessi/configurazione corrispondono al tuo Gateway.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP trusted con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy identity-aware configurato e lascia che inietti gli
  header di identità richiesti
- autenticazione open su ingress privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente trusted proxy non-loopback configurata; i proxy loopback sullo stesso host
  non soddisfano questa modalità.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso operator completo** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello ristretto per utente o per ambito.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale owner/operator.
- Le richieste passano attraverso lo stesso percorso agente del control plane delle azioni operator trusted.
- Non esiste un confine separato per strumenti non-owner/per-user su questo endpoint; una volta che un chiamante supera qui l'autenticazione del Gateway, OpenClaw tratta quel chiamante come un operatore trusted per questo gateway.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti di operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- Le modalità HTTP trusted con identità (per esempio autenticazione trusted proxy o `gateway.auth.mode="none"`) rispettano `x-openclaw-scopes` quando presente e altrimenti usano come fallback il normale insieme di ambiti predefiniti dell'operatore.
- Se la policy dell'agente di destinazione consente strumenti sensibili, questo endpoint può usarli.
- Mantieni questo endpoint solo su loopback/tailnet/ingress privato; non esporlo direttamente su Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operator condiviso del gateway
  - ignora `x-openclaw-scopes` più ristretto
  - ripristina l'intero insieme predefinito di ambiti operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta i turni chat su questo endpoint come turni del mittente owner
- modalità HTTP trusted con identità (per esempio autenticazione trusted proxy, oppure `gateway.auth.mode="none"` su ingress privato)
  - autenticano un'identità trusted esterna o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - usano come fallback il normale insieme di ambiti predefiniti dell'operatore quando l'header è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

Vedi [Security](/it/gateway/security) e [Remote access](/it/gateway/remote).

## Contratto di modello agent-first

OpenClaw tratta il campo OpenAI `model` come un **target agente**, non come un id modello provider grezzo.

- `model: "openclaw"` instrada all'agente predefinito configurato.
- `model: "openclaw/default"` instrada anch'esso all'agente predefinito configurato.
- `model: "openclaw/<agentId>"` instrada a un agente specifico.

Header di richiesta opzionali:

- `x-openclaw-model: <provider/model-or-bare-id>` sovrascrive il modello backend per l'agente selezionato.
- `x-openclaw-agent-id: <agentId>` resta supportato come override di compatibilità.
- `x-openclaw-session-key: <sessionKey>` controlla completamente l'instradamento della sessione.
- `x-openclaw-message-channel: <channel>` imposta il contesto sintetico del canale di ingresso per prompt e policy consapevoli del canale.

Alias di compatibilità ancora accettati:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Abilitare l'endpoint

Imposta `gateway.http.endpoints.chatCompletions.enabled` su `true`:

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

## Disabilitare l'endpoint

Imposta `gateway.http.endpoints.chatCompletions.enabled` su `false`:

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

## Comportamento della sessione

Per impostazione predefinita l'endpoint è **stateless per richiesta** (a ogni chiamata viene generata una nuova chiave di sessione).

Se la richiesta include una stringa OpenAI `user`, il Gateway ne deriva una chiave di sessione stabile, così chiamate ripetute possono condividere una sessione agente.

## Perché questa superficie è importante

Questo è l'insieme di compatibilità con la leva più alta per frontend e strumenti self-hosted:

- La maggior parte delle configurazioni Open WebUI, LobeChat e LibreChat si aspetta `/v1/models`.
- Molti sistemi RAG si aspettano `/v1/embeddings`.
- I client chat OpenAI esistenti di solito possono iniziare con `/v1/chat/completions`.
- I client più nativi per agenti preferiscono sempre più `/v1/responses`.

## Elenco modelli e instradamento agente

<AccordionGroup>
  <Accordion title="Cosa restituisce `/v1/models`?">
    Un elenco di target agente OpenClaw.

    Gli id restituiti sono voci `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
    Usali direttamente come valori OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` elenca agenti o subagenti?">
    Elenca target agente di primo livello, non modelli provider backend e non subagenti.

    I subagenti restano una topologia di esecuzione interna. Non compaiono come pseudo-modelli.

  </Accordion>
  <Accordion title="Perché è incluso `openclaw/default`?">
    `openclaw/default` è l'alias stabile per l'agente predefinito configurato.

    Ciò significa che i client possono continuare a usare un id prevedibile anche se il vero id dell'agente predefinito cambia tra ambienti.

  </Accordion>
  <Accordion title="Come sovrascrivo il modello backend?">
    Usa `x-openclaw-model`.

    Esempi:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Se lo ometti, l'agente selezionato verrà eseguito con la sua normale scelta di modello configurata.

  </Accordion>
  <Accordion title="Come si inseriscono gli embedding in questo contratto?">
    `/v1/embeddings` usa gli stessi id `model` di target agente.

    Usa `model: "openclaw/default"` oppure `model: "openclaw/<agentId>"`.
    Quando hai bisogno di un modello di embedding specifico, invialo in `x-openclaw-model`.
    Senza quell'header, la richiesta passa alla normale configurazione embedding dell'agente selezionato.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Imposta `stream: true` per ricevere Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Ogni riga evento è `data: <json>`
- Lo stream termina con `data: [DONE]`

## Configurazione rapida di Open WebUI

Per una connessione Open WebUI di base:

- URL base: `http://127.0.0.1:18789/v1`
- URL base Docker su macOS: `http://host.docker.internal:18789/v1`
- Chiave API: il tuo token bearer del Gateway
- Modello: `openclaw/default`

Comportamento previsto:

- `GET /v1/models` dovrebbe elencare `openclaw/default`
- Open WebUI dovrebbe usare `openclaw/default` come id modello chat
- Se vuoi un provider/modello backend specifico per quell'agente, imposta il normale modello predefinito dell'agente o invia `x-openclaw-model`

Smoke test rapido:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Se restituisce `openclaw/default`, la maggior parte delle configurazioni Open WebUI può connettersi con lo stesso URL base e token.

## Esempi

Senza streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Con streaming:

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

Elenca i modelli:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Recupera un modello:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Crea embedding:

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

Note:

- `/v1/models` restituisce target agente OpenClaw, non cataloghi provider grezzi.
- `openclaw/default` è sempre presente così un id stabile funziona in tutti gli ambienti.
- Gli override di provider/modello backend vanno in `x-openclaw-model`, non nel campo OpenAI `model`.
- `/v1/embeddings` supporta `input` come stringa o array di stringhe.

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference)
- [OpenAI](/it/providers/openai)
