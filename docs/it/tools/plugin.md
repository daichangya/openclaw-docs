---
read_when:
    - Installazione o configurazione dei Plugin
    - Comprendere le regole di individuazione e caricamento dei Plugin
    - Lavorare con bundle di Plugin compatibili con Codex/Claude
sidebarTitle: Install and Configure
summary: Installare, configurare e gestire i Plugin OpenClaw
title: Plugin
x-i18n:
    generated_at: "2026-04-25T13:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

I Plugin estendono OpenClaw con nuove capacità: canali, provider di modelli,
harness per agenti, strumenti, Skills, voce, trascrizione in tempo reale, voce in tempo
reale, comprensione dei media, generazione di immagini, generazione di video, recupero web, ricerca web
e altro ancora. Alcuni Plugin sono **core** (distribuiti con OpenClaw), altri
sono **esterni** (pubblicati su npm dalla community).

## Avvio rapido

<Steps>
  <Step title="Vedi cosa è caricato">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installa un Plugin">
    ```bash
    # Da npm
    openclaw plugins install @openclaw/voice-call

    # Da una directory locale o da un archivio
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

Il percorso di installazione usa lo stesso resolver della CLI: percorso/archivio locale, `clawhub:<pkg>` esplicito o specifica di pacchetto semplice (prima ClawHub, poi fallback a npm).

Se la configurazione non è valida, l'installazione normalmente fallisce in modo sicuro e ti indirizza a
`openclaw doctor --fix`. L'unica eccezione di ripristino è un percorso ristretto di
reinstallazione del Plugin incluso per i Plugin che aderiscono a
`openclaw.install.allowInvalidConfigRecovery`.

Le installazioni pacchettizzate di OpenClaw non installano in modo anticipato l'intero
albero delle dipendenze runtime di ogni Plugin incluso. Quando un Plugin incluso di proprietà di OpenClaw è attivo da
configurazione del Plugin, configurazione legacy del canale o manifest abilitato per impostazione predefinita, l'avvio
ripara solo le dipendenze runtime dichiarate di quel Plugin prima di importarlo.
La disattivazione esplicita prevale comunque: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impediscono la riparazione automatica delle dipendenze runtime incluse per quel Plugin/canale.
I Plugin esterni e i percorsi di caricamento personalizzati devono comunque essere installati tramite
`openclaw plugins install`.

## Tipi di Plugin

OpenClaw riconosce due formati di Plugin:

| Formato    | Come funziona                                                    | Esempi                                                |
| ---------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **Nativo** | `openclaw.plugin.json` + modulo runtime; esegue in-process       | Plugin ufficiali, pacchetti npm della community       |
| **Bundle** | Layout compatibile con Codex/Claude/Cursor; mappato alle funzionalità di OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Entrambi compaiono in `openclaw plugins list`. Vedi [Bundle di Plugin](/it/plugins/bundles) per i dettagli sui bundle.

Se stai scrivendo un Plugin nativo, inizia con [Creare Plugin](/it/plugins/building-plugins)
e la [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

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

### Core (distribuiti con OpenClaw)

<AccordionGroup>
  <Accordion title="Provider di modelli (abilitati per impostazione predefinita)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin di memoria">
    - `memory-core` — ricerca di memoria inclusa (predefinita tramite `plugins.slots.memory`)
    - `memory-lancedb` — memoria a lungo termine con installazione su richiesta e richiamo/acquisizione automatica (imposta `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provider vocali (abilitati per impostazione predefinita)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Altro">
    - `browser` — Plugin browser incluso per lo strumento browser, la CLI `openclaw browser`, il metodo gateway `browser.request`, il runtime browser e il servizio predefinito di controllo browser (abilitato per impostazione predefinita; disabilitalo prima di sostituirlo)
    - `copilot-proxy` — bridge VS Code Copilot Proxy (disabilitato per impostazione predefinita)
  </Accordion>
</AccordionGroup>

Cerchi Plugin di terze parti? Vedi [Plugin della community](/it/plugins/community).

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

| Campo            | Descrizione                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Interruttore principale (predefinito: `true`)             |
| `allow`          | Allowlist dei Plugin (facoltativa)                        |
| `deny`           | Denylist dei Plugin (facoltativa; deny ha la precedenza)  |
| `load.paths`     | File/directory di Plugin aggiuntivi                       |
| `slots`          | Selettori di slot esclusivi (es. `memory`, `contextEngine`) |
| `entries.\<id\>` | Attivazioni/disattivazioni + configurazione per Plugin    |

Le modifiche di configurazione **richiedono un riavvio del gateway**. Se il Gateway è in esecuzione con
watch della configurazione + riavvio in-process abilitato (il percorso predefinito `openclaw gateway`), quel
riavvio viene di solito eseguito automaticamente poco dopo che la scrittura della configurazione è stata applicata.
Non esiste un percorso supportato di hot reload per il codice runtime o gli hook del ciclo di vita dei Plugin nativi;
riavvia il processo Gateway che serve il canale live prima di aspettarti che vengano eseguiti
codice `register(api)` aggiornato, hook `api.on(...)`, strumenti, servizi o
hook provider/runtime.

`openclaw plugins list` è un'istantanea locale della CLI/configurazione. Un Plugin `loaded`
lì significa che il Plugin è individuabile e caricabile dalla configurazione/dai file visibili a quella
invocazione della CLI. Non prova che un Gateway remoto figlio già in esecuzione
sia stato riavviato con lo stesso codice del Plugin. Su configurazioni VPS/container con processi wrapper,
invia i riavvii al processo effettivo `openclaw gateway run`, oppure usa
`openclaw gateway restart` sul Gateway in esecuzione.

<Accordion title="Stati del Plugin: disabilitato vs mancante vs non valido">
  - **Disabilitato**: il Plugin esiste ma le regole di abilitazione lo hanno disattivato. La configurazione viene conservata.
  - **Mancante**: la configurazione fa riferimento a un id Plugin che il rilevamento non ha trovato.
  - **Non valido**: il Plugin esiste ma la sua configurazione non corrisponde allo schema dichiarato.
</Accordion>

## Individuazione e precedenza

OpenClaw esegue la scansione dei Plugin in questo ordine (vince la prima corrispondenza):

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
    Distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (provider di modelli, voce).
    Altri richiedono un'abilitazione esplicita.
  </Step>
</Steps>

### Regole di abilitazione

- `plugins.enabled: false` disabilita tutti i Plugin
- `plugins.deny` prevale sempre su allow
- `plugins.entries.\<id\>.enabled: false` disabilita quel Plugin
- I Plugin di origine workspace sono **disabilitati per impostazione predefinita** (devono essere abilitati esplicitamente)
- I Plugin inclusi seguono l'insieme predefinito integrato attivo salvo override
- Gli slot esclusivi possono forzare l'abilitazione del Plugin selezionato per quello slot
- Alcuni Plugin inclusi opzionali vengono abilitati automaticamente quando la configurazione nomina una
  superficie posseduta dal Plugin, come un riferimento a un modello provider, una configurazione di canale o un
  runtime harness
- Le route Codex della famiglia OpenAI mantengono confini separati tra Plugin:
  `openai-codex/*` appartiene al Plugin OpenAI, mentre il Plugin app-server Codex
  incluso viene selezionato da `embeddedHarness.runtime: "codex"` o dai riferimenti legacy
  al modello `codex/*`

## Risoluzione dei problemi degli hook runtime

Se un Plugin compare in `plugins list` ma gli effetti collaterali o gli hook di `register(api)`
non vengono eseguiti nel traffico live della chat, controlla prima questi punti:

- Esegui `openclaw gateway status --deep --require-rpc` e conferma che l'URL,
  il profilo, il percorso di configurazione e il processo del Gateway attivo siano quelli che stai modificando.
- Riavvia il Gateway live dopo modifiche a installazione/configurazione/codice del Plugin. Nei
  container wrapper, PID 1 potrebbe essere solo un supervisore; riavvia o invia un segnale al processo figlio
  `openclaw gateway run`.
- Usa `openclaw plugins inspect <id> --json` per confermare registrazioni di hook e
  diagnostica. Gli hook di conversazione non inclusi come `llm_input`,
  `llm_output` e `agent_end` richiedono
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Per il cambio di modello, preferisci `before_model_resolve`. Viene eseguito prima della risoluzione
  del modello per i turni dell'agente; `llm_output` viene eseguito solo dopo che un tentativo di modello
  produce output dell'assistente.
- Per una prova del modello effettivo della sessione, usa `openclaw sessions` o le
  superfici di sessione/stato del Gateway e, quando esegui il debug dei payload del provider, avvia
  il Gateway con `--raw-stream --raw-stream-path <path>`.

## Slot dei Plugin (categorie esclusive)

Alcune categorie sono esclusive (solo una attiva alla volta):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // o "none" per disabilitare
      contextEngine: "legacy", // o un id Plugin
    },
  },
}
```

| Slot            | Cosa controlla             | Predefinito         |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin di memoria attivo   | `memory-core`       |
| `contextEngine` | Motore di contesto attivo  | `legacy` (integrato) |

## Riferimento CLI

```bash
openclaw plugins list                       # inventario compatto
openclaw plugins list --enabled            # solo Plugin caricati
openclaw plugins list --verbose            # righe di dettaglio per Plugin
openclaw plugins list --json               # inventario leggibile da macchina
openclaw plugins inspect <id>              # dettaglio approfondito
openclaw plugins inspect <id> --json       # leggibile da macchina
openclaw plugins inspect --all             # tabella dell'intero insieme
openclaw plugins info <id>                 # alias di inspect
openclaw plugins doctor                    # diagnostica

openclaw plugins install <package>         # installa (prima ClawHub, poi npm)
openclaw plugins install clawhub:<pkg>     # installa solo da ClawHub
openclaw plugins install <spec> --force    # sovrascrive l'installazione esistente
openclaw plugins install <path>            # installa da percorso locale
openclaw plugins install -l <path>         # collega (senza copia) per sviluppo
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra la spec npm esatta risolta
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # aggiorna un Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # aggiorna tutti
openclaw plugins uninstall <id>          # rimuove record di configurazione/installazione
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

I Plugin inclusi vengono distribuiti con OpenClaw. Molti sono abilitati per impostazione predefinita (per esempio
i provider di modelli inclusi, i provider vocali inclusi e il Plugin browser
incluso). Altri Plugin inclusi richiedono comunque `openclaw plugins enable <id>`.

`--force` sovrascrive sul posto un Plugin o un pacchetto di hook già installato. Usa
`openclaw plugins update <id-or-npm-spec>` per gli aggiornamenti ordinari dei Plugin npm
tracciati. Non è supportato con `--link`, che riutilizza il percorso di origine invece
di copiare sopra una destinazione di installazione gestita.

Quando `plugins.allow` è già impostato, `openclaw plugins install` aggiunge l'id del
Plugin installato a quell'allowlist prima di abilitarlo, così le installazioni sono
immediatamente caricabili dopo il riavvio.

`openclaw plugins update <id-or-npm-spec>` si applica alle installazioni tracciate. Il passaggio di
una spec di pacchetto npm con un dist-tag o una versione esatta risolve il nome del pacchetto
riconducendolo al record del Plugin tracciato e registra la nuova spec per gli aggiornamenti futuri.
Passare il nome del pacchetto senza una versione riporta un'installazione esatta fissata
alla linea di rilascio predefinita del registry. Se il Plugin npm installato corrisponde già
alla versione risolta e all'identità dell'artefatto registrata, OpenClaw salta l'aggiornamento
senza scaricare, reinstallare o riscrivere la configurazione.

`--pin` è solo per npm. Non è supportato con `--marketplace`, perché
le installazioni da marketplace persistono i metadati della sorgente marketplace invece di una spec npm.

`--dangerously-force-unsafe-install` è una sostituzione di emergenza per i falsi
positivi dello scanner integrato di codice pericoloso. Consente alle installazioni
e agli aggiornamenti dei Plugin di proseguire oltre i rilevamenti integrati di livello `critical`, ma
non aggira comunque i blocchi di policy `before_install` dei Plugin né il blocco in caso di fallimento della scansione.

Questo flag CLI si applica solo ai flussi di installazione/aggiornamento dei Plugin. Le
installazioni delle dipendenze delle Skills supportate dal Gateway usano invece la corrispondente
sostituzione della richiesta `dangerouslyForceUnsafeInstall`, mentre `openclaw skills install` rimane
il flusso separato di download/installazione delle Skills da ClawHub.

I bundle compatibili partecipano allo stesso flusso di elenco/ispezione/abilitazione/disabilitazione dei
Plugin. Il supporto runtime attuale include bundle Skills, command-skills di Claude,
valori predefiniti di Claude `settings.json`, valori predefiniti di Claude `.lsp.json` e
`lspServers` dichiarati nel manifest, command-skills di Cursor e directory di hook Codex compatibili.

`openclaw plugins inspect <id>` riporta anche le capability del bundle rilevate oltre alle
voci del server MCP e LSP supportate o non supportate per i Plugin basati su bundle.

Le sorgenti marketplace possono essere un nome di marketplace noto di Claude da
`~/.claude/plugins/known_marketplaces.json`, una root di marketplace locale o un percorso
`marketplace.json`, una forma abbreviata GitHub come `owner/repo`, un URL di repo GitHub
o un URL git. Per i marketplace remoti, le voci dei Plugin devono rimanere all'interno del
repo marketplace clonato e usare solo sorgenti di percorso relativo.

Vedi il [riferimento CLI `openclaw plugins`](/it/cli/plugins) per i dettagli completi.

## Panoramica dell'API dei Plugin

I Plugin nativi esportano un oggetto entry che espone `register(api)`. I Plugin
più vecchi possono ancora usare `activate(api)` come alias legacy, ma i nuovi Plugin dovrebbero
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

OpenClaw carica l'oggetto entry e chiama `register(api)` durante l'attivazione del
Plugin. Il loader continua a usare `activate(api)` come fallback per i Plugin più vecchi,
ma i Plugin inclusi e i nuovi Plugin esterni dovrebbero considerare `register` come
contratto pubblico.

`api.registrationMode` indica a un Plugin perché la sua entry viene caricata:

| Mode            | Meaning                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Attivazione runtime. Registra strumenti, hook, servizi, comandi, route e altri effetti collaterali live.                              |
| `discovery`     | Individuazione delle capability in sola lettura. Registra provider e metadati; il codice entry del Plugin fidato può essere caricato, ma salta gli effetti collaterali live. |
| `setup-only`    | Caricamento dei metadati di configurazione del canale tramite un'entry di configurazione leggera.                                                                |
| `setup-runtime` | Caricamento della configurazione del canale che richiede anche l'entry runtime.                                                                         |
| `cli-metadata`  | Solo raccolta dei metadati dei comandi CLI.                                                                                            |

Le entry dei Plugin che aprono socket, database, worker in background o client
di lunga durata dovrebbero proteggere questi effetti collaterali con `api.registrationMode === "full"`.
I caricamenti discovery vengono memorizzati separatamente rispetto ai caricamenti di attivazione e non sostituiscono
il registry del Gateway in esecuzione. Discovery non attiva, ma non è priva di import:
OpenClaw può valutare l'entry del Plugin fidato o il modulo del Plugin di canale per costruire
lo snapshot. Mantieni i top level dei moduli leggeri e privi di effetti collaterali e sposta
client di rete, sottoprocessi, listener, letture di credenziali e avvio dei servizi
dietro i percorsi full-runtime.

Metodi di registrazione comuni:

| Method                                  | What it registers           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider di modelli (LLM)   |
| `registerChannel`                       | Canale di chat              |
| `registerTool`                          | Strumento dell'agente       |
| `registerHook` / `on(...)`              | Hook del ciclo di vita      |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT in streaming            |
| `registerRealtimeVoiceProvider`         | Voce realtime duplex        |
| `registerMediaUnderstandingProvider`    | Analisi di immagini/audio   |
| `registerImageGenerationProvider`       | Generazione di immagini     |
| `registerMusicGenerationProvider`       | Generazione di musica       |
| `registerVideoGenerationProvider`       | Generazione di video        |
| `registerWebFetchProvider`              | Provider di recupero / scraping web |
| `registerWebSearchProvider`             | Ricerca web                 |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandi CLI                 |
| `registerContextEngine`                 | Motore di contesto          |
| `registerService`                       | Servizio in background      |

Comportamento delle guardie degli hook per gli hook tipizzati del ciclo di vita:

- `before_tool_call`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_tool_call`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `before_install`: `{ block: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `before_install`: `{ block: false }` è una no-op e non annulla un blocco precedente.
- `message_sending`: `{ cancel: true }` è terminale; gli handler a priorità inferiore vengono saltati.
- `message_sending`: `{ cancel: false }` è una no-op e non annulla un annullamento precedente.

Le esecuzioni native del server app Codex riportano gli eventi degli strumenti nativi Codex
su questa superficie di hook. I Plugin possono bloccare gli strumenti nativi Codex tramite `before_tool_call`,
osservarne i risultati tramite `after_tool_call` e partecipare alle approvazioni
Codex `PermissionRequest`. Il bridge non riscrive ancora gli argomenti degli strumenti nativi Codex.
Il confine esatto del supporto runtime Codex si trova nel
[contratto di supporto v1 dell'harness Codex](/it/plugins/codex-harness#v1-support-contract).

Per il comportamento completo tipizzato degli hook, vedi [panoramica dell'SDK](/it/plugins/sdk-overview#hook-decision-semantics).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins) — crea il tuo Plugin
- [Bundle di Plugin](/it/plugins/bundles) — compatibilità dei bundle Codex/Claude/Cursor
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
- [Registrazione degli strumenti](/it/plugins/building-plugins#registering-agent-tools) — aggiungi strumenti per agenti in un Plugin
- [Struttura interna dei Plugin](/it/plugins/architecture) — modello di capability e pipeline di caricamento
- [Plugin della community](/it/plugins/community) — elenchi di terze parti
