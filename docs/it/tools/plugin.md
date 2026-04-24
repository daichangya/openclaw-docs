---
read_when:
    - Installazione o configurazione dei plugin
    - Comprendere le regole di rilevamento e caricamento dei plugin
    - Lavorare con bundle di plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installa, configura e gestisci i plugin di OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-24T09:54:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

I plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, voce, trascrizione in tempo reale, voce
in tempo reale, comprensione dei media, generazione di immagini, generazione di
video, recupero web, ricerca web e altro ancora. Alcuni plugin sono **core**
(inclusi con OpenClaw), altri sono **external** (pubblicati su npm dalla comunità).

## Avvio rapido

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un plugin">
    ```bash
    # Da npm
    openclaw plugins install @openclaw/voice-call

    # Da una directory o un archivio locale
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Riavvia il Gateway">
    ```bash
    openclaw gateway restart
    ```

    Quindi configura in `plugins.entries.\<id\>.config` nel tuo file di configurazione.

  </Step>
</Steps>

Se preferisci un controllo nativo via chat, abilita `commands.plugins: true` e usa:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>` esplicito oppure specifica pacchetto semplice (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di reinstallazione
di plugin inclusi per i plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo anticipato l'intero
albero delle dipendenze runtime di ogni plugin incluso. Quando un plugin incluso di proprietà di OpenClaw è attivo dalla
configurazione dei plugin, dalla configurazione legacy del canale o da un manifest abilitato per impostazione predefinita,
l'avvio ripara soltanto le dipendenze runtime dichiarate da quel plugin prima di importarlo.
I plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di plugin

OpenClaw riconosce due formati di plugin:

| Formato    | Come funziona                                                   | Esempi                                                 |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + modulo runtime; viene eseguito nel processo | Plugin ufficiali, pacchetti npm della comunità         |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato sulle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Plugin Bundles](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un plugin nativo, inizia da [Building Plugins](/it/plugins/building-plugins)
e dalla [Plugin SDK Overview](/it/plugins/sdk-overview).

## Plugin ufficiali

### Installabili (npm)

| Plugin          | Pacchetto              | Documentazione                       |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/it/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/it/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/it/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/it/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/it/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/it/plugins/zalouser)   |

### Core (inclusi con OpenClaw)

<AccordionGroup>
  <Accordion title="Provider di modelli (abilitati per impostazione predefinita)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin di memoria">
    - `memory-core` — ricerca nella memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine con installazione su richiesta con richiamo/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo Gateway `browser.request`, il runtime browser e il servizio di controllo browser predefinito (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)
  </Accordion>
</AccordionGroup>

Cerchi plugin di terze parti? Vedi [Community Plugins](/it/plugins/community).

## Configurazione

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descrizione                                                |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)              |
| `allow`          | Allowlist dei plugin (facoltativa)                         |
| `deny`           | Denylist dei plugin (facoltativa; deny ha la precedenza)   |
| `load.paths`     | File/directory di plugin aggiuntivi                        |
| `slots`          | Selettori di slot esclusivi (ad es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazione/disattivazione + configurazione per plugin     |

Le modifiche alla configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con il monitoraggio
della configurazione + il riavvio in-process abilitati (il percorso predefinito `openclaw gateway`), quel
riavvio viene in genere eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.

<Accordion title="Stati del plugin: disabilitato vs mancante vs non valido">
  - **Disabled**: il plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene mantenuta.
  - **Missing**: la configurazione fa riferimento a un id plugin che il rilevamento non ha trovato.
  - **Invalid**: il plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Rilevamento e precedenza

OpenClaw esegue la scansione dei plugin in questo ordine (la prima corrispondenza vince):

<Steps>
  <Step title="Percorsi di configurazione">
    `plugins.load.paths` — percorsi espliciti di file o directory.
  </Step>

  <Step title="Plugin del workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin globali">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugin inclusi">
    Inclusi con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i plugin
- `plugins.deny` ha sempre la precedenza su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel plugin
- I plugin provenienti dal workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I plugin inclusi seguono l'insieme predefinito interno di quelli attivi, salvo override
- Gli slot esclusivi possono forzare l'abilitazione del plugin selezionato per quello slot
- Alcuni plugin inclusi opzionali vengono abilitati automaticamente quando la configurazione assegna un nome a
  una superficie posseduta dal plugin, come un riferimento a un modello provider, una configurazione di canale o un
  runtime harness
- I percorsi Codex della famiglia OpenAI mantengono confini tra plugin separati:
  `openai-codex/*` appartiene al plugin OpenAI, mentre il plugin app-server Codex incluso
  viene selezionato da `embeddedHarness.runtime: "codex"` o dai riferimenti legacy ai modelli
  `codex/*`

## Slot dei plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // oppure "none" per disabilitare
      contextEngine: "legacy", // oppure un id plugin
    },
  },
}
```

| Slot            | Cosa controlla              | Predefinito         |
| --------------- | --------------------------- | ------------------- |
| `memory`        | Plugin Active Memory        | `memory-core`       |
| `contextEngine` | Motore di contesto attivo   | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella dell'intera flotta
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive un'installazione esistente
openclaw plugins install <path>            # installa da un percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la specifica npm risolta esatta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove i record di configurazione/installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (ad esempio
i provider di modelli inclusi, i provider vocali inclusi e il plugin browser
incluso). Altri plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un plugin installato o un hook pack esistente. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso sorgente invece
di copiare su una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del plugin
installato a quella allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Passare
una specifica di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
fino al record del plugin tracciato e registra la nuova specifica per gli aggiornamenti futuri.
Passare il nome del pacchetto senza una versione riporta un'installazione esatta fissata
alla linea di rilascio predefinita del registro. Se il plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni dal marketplace mantengono metadati della sorgente marketplace invece di una specifica npm.

`--dangerously-force-unsafe-install` è un override di emergenza per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei plugin di proseguire oltre i rilevamenti integrati `critical`, ma comunque
non aggira i blocchi di policy `before_install` del plugin né il blocco dovuto al fallimento della scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei plugin. Le installazioni
di dipendenze delle Skills supportate dal Gateway usano invece il corrispondente override di richiesta
`dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` resta il flusso separato di download/installazione delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione
dei plugin. Il supporto runtime attuale include bundle Skills, command-skills di Claude,
impostazioni predefinite di Claude `settings.json`, impostazioni predefinite di Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills di Cursor e directory hook
Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capacità del bundle rilevate, oltre alle
voci di server MCP e LSP supportate o non supportate per i plugin basati su bundle.

Le sorgenti del marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root di marketplace locale o un
percorso `marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL
di repository GitHub oppure un URL git. Per i marketplace remoti, le voci dei plugin devono
rimanere all'interno del repository marketplace clonato e usare solo sorgenti con percorso relativo.

Vedi il [riferimento CLI di `openclaw plugins`](/it/cli/plugins) per tutti i dettagli.

## Panoramica dell'API dei plugin

I plugin nativi esportano un oggetto entry che espone `register(api)`. I plugin meno recenti
possono ancora usare `activate(api)` come alias legacy, ma i nuovi plugin dovrebbero
usare `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione
del plugin. Il loader continua a usare `activate(api)` come fallback per i plugin più vecchi,
ma i plugin inclusi e i nuovi plugin esterni dovrebbero considerare `register` come
contratto pubblico.

Metodi di registrazione comuni:

| Metodo                                  | Cosa registra               |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)   |
| `registerChannel`                       | Canale di chat              |
| `registerTool`                          | Strumento dell'agente       |
| `registerHook` / `on(...)`              | Hook del ciclo di vita      |
| `registerSpeechProvider`                | Sintesi vocale / STT        |
| `registerRealtimeTranscriptionProvider` | STT in streaming            |
| `registerRealtimeVoiceProvider`         | Voce duplex in tempo reale  |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio   |
| `registerImageGenerationProvider`       | Generazione di immagini     |
| `registerMusicGenerationProvider`       | Generazione musicale        |
| `registerVideoGenerationProvider`       | Generazione video           |
| `registerWebFetchProvider`              | Provider di recupero / scraping web |
| `registerWebSearchProvider`             | Ricerca web                 |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandi CLI                 |
| `registerContextEngine`                 | Motore di contesto          |
| `registerService`                       | Servizio in background      |

Comportamento delle guardie hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` non ha effetto e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler con priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` non ha effetto e non annulla una cancellazione precedente.

Per il comportamento completo degli hook tipizzati, vedi [Panoramica SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — crea il tuo plugin
- [Plugin Bundles](/it/plugins/bundles) — compatibilità bundle Codex/Claude/Cursor
- [Plugin Manifest](/it/plugins/manifest) — schema del manifest
- [Registering Tools](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti dell'agente in un plugin
- [Plugin Internals](/it/plugins/architecture) — modello delle capacità e pipeline di caricamento
- [Community Plugins](/it/plugins/community) — elenchi di terze parti
