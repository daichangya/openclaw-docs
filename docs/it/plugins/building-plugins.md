---
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai aggiungendo un nuovo canale, provider, strumento o altra capability a OpenClaw
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

I Plugin estendono OpenClaw con nuove capability: canali, provider di modelli,
speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini,
generazione di video, web fetch, web search, strumenti dell'agente o qualsiasi
combinazione.

Non è necessario aggiungere il tuo Plugin al repository OpenClaw. Pubblicalo su
[ClawHub](/it/tools/clawhub) o npm e gli utenti lo installeranno con
`openclaw plugins install <package-name>`. OpenClaw prova prima ClawHub e
fa automaticamente fallback a npm.

## Prerequisiti

- Node >= 22 e un package manager (npm o pnpm)
- Familiarità con TypeScript (ESM)
- Per i Plugin in-repo: repository clonato e `pnpm install` eseguito

## Che tipo di Plugin?

<CardGroup cols={3}>
  <Card title="Plugin canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica (Discord, IRC, ecc.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli (LLM, proxy o endpoint personalizzato)
  </Card>
  <Card title="Plugin tool / hook" icon="wrench" href="/it/plugins/hooks">
    Registra strumenti dell'agente, event hook o servizi — continua qui sotto
  </Card>
</CardGroup>

Per un Plugin canale che non è garantito essere installato quando onboarding/setup
viene eseguito, usa `createOptionalChannelSetupSurface(...)` da
`openclaw/plugin-sdk/channel-setup`. Produce una coppia setup adapter + wizard
che pubblicizza il requisito di installazione e fallisce in modalità fail-closed sulle scritture di configurazione reali
finché il Plugin non è installato.

## Avvio rapido: Plugin tool

Questa procedura crea un Plugin minimale che registra uno strumento dell'agente. I Plugin canale
e provider hanno guide dedicate collegate sopra.

<Steps>
  <Step title="Crea il pacchetto e il manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Aggiunge uno strumento personalizzato a OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Ogni Plugin ha bisogno di un manifest, anche senza configurazione. Vedi
    [Manifest](/it/plugins/manifest) per lo schema completo. Gli snippet canonici
    di pubblicazione ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Scrivi l'entry point">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Aggiunge uno strumento personalizzato a OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Fa una cosa",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Ricevuto: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` è per Plugin non-canale. Per i canali, usa
    `defineChannelPluginEntry` — vedi [Channel Plugins](/it/plugins/sdk-channel-plugins).
    Per tutte le opzioni degli entry point, vedi [Entry Points](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testa e pubblica">

    **Plugin esterni:** convalida e pubblica con ClawHub, poi installa:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw controlla anche ClawHub prima di npm per specifiche di pacchetto semplici come
    `@myorg/openclaw-my-plugin`.

    **Plugin in-repo:** inserisci sotto l'albero del workspace dei Plugin bundled — rilevati automaticamente.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capability dei Plugin

Un singolo Plugin può registrare qualsiasi numero di capability tramite l'oggetto `api`:

| Capability             | Metodo di registrazione                         | Guida dettagliata                                                                |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferenza testo (LLM)  | `api.registerProvider(...)`                     | [Provider Plugins](/it/plugins/sdk-provider-plugins)                               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | [CLI Backends](/it/gateway/cli-backends)                                           |
| Canale / messaggistica | `api.registerChannel(...)`                      | [Channel Plugins](/it/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`     | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di musica  | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generazione di video   | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/it/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware del risultato tool | `api.registerAgentToolResultMiddleware(...)` | [SDK Overview](/it/plugins/sdk-overview#registration-api)                      |
| Strumenti dell'agente  | `api.registerTool(...)`                         | Qui sotto                                                                       |
| Comandi personalizzati | `api.registerCommand(...)`                      | [Entry Points](/it/plugins/sdk-entrypoints)                                        |
| Hook dei Plugin        | `api.on(...)`                                   | [Plugin hooks](/it/plugins/hooks)                                                  |
| Hook di eventi interni | `api.registerHook(...)`                         | [Entry Points](/it/plugins/sdk-entrypoints)                                        |
| Route HTTP             | `api.registerHttpRoute(...)`                    | [Internals](/it/plugins/architecture-internals#gateway-http-routes)                |
| Sottocomandi CLI       | `api.registerCli(...)`                          | [Entry Points](/it/plugins/sdk-entrypoints)                                        |

Per l'API di registrazione completa, vedi [SDK Overview](/it/plugins/sdk-overview#registration-api).

I Plugin bundled possono usare `api.registerAgentToolResultMiddleware(...)` quando
hanno bisogno di una riscrittura asincrona del risultato dello strumento prima che il modello veda l'output. Dichiara i
runtime di destinazione in `contracts.agentToolResultMiddleware`, ad esempio
`["pi", "codex"]`. Questo è un seam fidato per Plugin bundled; i
Plugin esterni dovrebbero preferire i normali Plugin hooks di OpenClaw, a meno che OpenClaw non aggiunga
una policy di fiducia esplicita per questa capability.

Se il tuo Plugin registra metodi RPC gateway personalizzati, mantienili su un
prefisso specifico del Plugin. I namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre in
`operator.admin`, anche se un Plugin richiede uno scope più ristretto.

Semantica delle guardie degli hook da tenere presente:

- `before_tool_call`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_tool_call`: `{ block: false }` viene trattato come nessuna decisione.
- `before_tool_call`: `{ requireApproval: true }` mette in pausa l'esecuzione dell'agente e chiede all'utente l'approvazione tramite l'overlay di approvazione exec, pulsanti Telegram, interazioni Discord o il comando `/approve` su qualsiasi canale.
- `before_install`: `{ block: true }` è terminale e ferma gli handler a priorità inferiore.
- `before_install`: `{ block: false }` viene trattato come nessuna decisione.
- `message_sending`: `{ cancel: true }` è terminale e ferma gli handler a priorità inferiore.
- `message_sending`: `{ cancel: false }` viene trattato come nessuna decisione.
- `message_received`: preferisci il campo tipizzato `threadId` quando hai bisogno del routing inbound di thread/topic. Mantieni `metadata` per gli extra specifici del canale.
- `message_sending`: preferisci i campi tipizzati di routing `replyToId` / `threadId` rispetto alle chiavi metadata specifiche del canale.

Il comando `/approve` gestisce sia le approvazioni exec sia quelle dei Plugin con fallback delimitato: quando non viene trovato un id di approvazione exec, OpenClaw riprova lo stesso id tramite le approvazioni dei Plugin. L'inoltro delle approvazioni dei Plugin può essere configurato indipendentemente tramite `approvals.plugin` nella configurazione.

Se una logica personalizzata di approvazione deve rilevare lo stesso caso di fallback delimitato,
preferisci `isApprovalNotFoundError` da `openclaw/plugin-sdk/error-runtime`
invece di cercare manualmente stringhe di scadenza dell'approvazione.

Vedi [Plugin hooks](/it/plugins/hooks) per esempi e riferimento degli hook.

## Registrazione degli strumenti dell'agente

Gli strumenti sono funzioni tipizzate che l'LLM può chiamare. Possono essere obbligatori (sempre
disponibili) o facoltativi (opt-in dell'utente):

```typescript
register(api) {
  // Strumento obbligatorio — sempre disponibile
  api.registerTool({
    name: "my_tool",
    description: "Fa una cosa",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Strumento facoltativo — l'utente deve aggiungerlo all'allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Esegui un workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Gli utenti abilitano gli strumenti facoltativi nella configurazione:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- I nomi degli strumenti non devono entrare in conflitto con gli strumenti core (i conflitti vengono saltati)
- Usa `optional: true` per strumenti con effetti collaterali o requisiti binari aggiuntivi
- Gli utenti possono abilitare tutti gli strumenti di un Plugin aggiungendo l'id del Plugin a `tools.allow`

## Convenzioni di import

Importa sempre da percorsi mirati `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Sbagliato: root monolitica (deprecata, verrà rimossa)
import { ... } from "openclaw/plugin-sdk";
```

Per il riferimento completo dei subpath, vedi [SDK Overview](/it/plugins/sdk-overview).

All'interno del tuo Plugin, usa file barrel locali (`api.ts`, `runtime-api.ts`) per
gli import interni — non importare mai il tuo stesso Plugin tramite il suo percorso SDK.

Per i Plugin provider, mantieni gli helper specifici del provider in quei
barrel della root del pacchetto, a meno che il seam non sia davvero generico. Esempi bundled correnti:

- Anthropic: wrapper di stream Claude e helper `service_tier` / beta
- OpenAI: builder di provider, helper per modelli predefiniti, provider realtime
- OpenRouter: builder del provider più helper di onboarding/config

Se un helper è utile solo all'interno di un pacchetto provider bundled, mantienilo su quel
seam della root del pacchetto invece di promuoverlo in `openclaw/plugin-sdk/*`.

Esistono ancora alcuni seam helper generati `openclaw/plugin-sdk/<bundled-id>` per
la manutenzione e la compatibilità dei Plugin bundled, ad esempio
`plugin-sdk/feishu-setup` o `plugin-sdk/zalo-setup`. Trattali come superfici
riservate, non come modello predefinito per nuovi Plugin di terze parti.

## Checklist pre-invio

<Check>**package.json** ha i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non self-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugin in-repo)</Check>

## Test delle release beta

1. Tieni d'occhio i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un aspetto come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo Plugin contro il tag beta non appena compare. La finestra prima della stable è in genere di poche ore.
3. Pubblica nel thread del tuo Plugin nel canale Discord `plugin-forum` dopo il test con `all good` oppure indicando cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna un issue intitolato `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link dell'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega l'issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza PR potrebbero comunque essere rilasciati. I maintainer seguono questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente finirà nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin canale di messaggistica
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa degli import e riferimento dell'API di registrazione
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, search, subagent tramite api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern di test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Plugin Architecture](/it/plugins/architecture) — approfondimento sull'architettura interna
- [SDK Overview](/it/plugins/sdk-overview) — riferimento del Plugin SDK
- [Manifest](/it/plugins/manifest) — formato del manifest del Plugin
- [Channel Plugins](/it/plugins/sdk-channel-plugins) — creazione di Plugin canale
- [Provider Plugins](/it/plugins/sdk-provider-plugins) — creazione di Plugin provider
