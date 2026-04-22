---
read_when:
    - Configurazione iniziale di OpenClaw
    - Ricerca di pattern di configurazione comuni
    - Passaggio a sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e link al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-22T04:22:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: c627ccf9f17087e0b71663fe3086d637aeaa8cd1d6d34d816bfcbc0f0cc6f07c
    source_path: gateway/configuration.md
    workflow: 15
---

# Configurazione

OpenClaw legge una configurazione facoltativa <Tooltip tip="JSON5 supporta commenti e virgole finali">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.

Se il file manca, OpenClaw usa valori predefiniti sicuri. Motivi comuni per aggiungere una configurazione:

- Collegare i canali e controllare chi può inviare messaggi al bot
- Impostare modelli, tool, sandboxing o automazione (Cron, hook)
- Regolare sessioni, media, rete o UI

Vedi il [riferimento completo](/it/gateway/configuration-reference) per tutti i campi disponibili.

<Tip>
**Nuovo alla configurazione?** Inizia con `openclaw onboard` per una configurazione interattiva, oppure consulta la guida [Esempi di configurazione](/it/gateway/configuration-examples) per configurazioni complete da copiare e incollare.
</Tip>

## Configurazione minima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modifica della configurazione

<Tabs>
  <Tab title="Procedura guidata interattiva">
    ```bash
    openclaw onboard       # flusso completo di onboarding
    openclaw configure     # procedura guidata di configurazione
    ```
  </Tab>
  <Tab title="CLI (one-liner)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    La Control UI renderizza un modulo a partire dallo schema di configurazione live, inclusi i metadati di documentazione dei campi
    `title` / `description` più gli schemi di Plugin e canale quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per le
    UI di drill-down e altri strumenti, il gateway espone anche `config.schema.lookup` per
    recuperare un nodo di schema limitato a un percorso, più riepiloghi immediati dei figli.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono collegare metadati JSON Schema.
</Warning>

Note sugli strumenti per lo schema:

- `openclaw config schema` stampa la stessa famiglia di JSON Schema usata dalla Control UI
  e dalla validazione della configurazione.
- Tratta l'output di quello schema come il contratto canonico leggibile dalle macchine per
  `openclaw.json`; questa panoramica e il riferimento della configurazione lo riassumono.
- I valori dei campi `title` e `description` vengono riportati nell'output dello schema per
  strumenti di editor e moduli.
- Le voci di oggetti annidati, wildcard (`*`) e elementi di array (`[]`) ereditano gli stessi
  metadati di documentazione quando esiste documentazione del campo corrispondente.
- Anche i rami di composizione `anyOf` / `oneOf` / `allOf` ereditano gli stessi
  metadati di documentazione, quindi le varianti union/intersection mantengono lo stesso aiuto del campo.
- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo
  di schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni
  e campi di validazione simili), metadati di suggerimento UI corrispondenti e riepiloghi immediati dei figli
  per gli strumenti di drill-down.
- Gli schemi di Plugin/canale a runtime vengono uniti quando il gateway può caricare l'attuale
  registro dei manifest.
- `pnpm config:docs:check` rileva derive tra gli artifact baseline della configurazione lato documentazione
  e l'attuale superficie dello schema.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway mantiene anche una copia trusted dell'ultimo stato valido dopo un avvio riuscito. Se
`openclaw.json` viene successivamente modificato fuori da OpenClaw e non è più valido, l'avvio
e l'hot reload preservano il file danneggiato come snapshot `.clobbered.*` con timestamp,
ripristinano l'ultima copia valida e registrano un avviso evidente con il motivo del recupero.
Anche il successivo turno dell'agente principale riceve un avviso di evento di sistema che dice che la
configurazione è stata ripristinata e non deve essere riscritta ciecamente. La promozione dell'ultimo stato valido
viene aggiornata dopo l'avvio validato e dopo hot reload accettati, incluse
le scritture di configurazione possedute da OpenClaw il cui hash del file persistito corrisponde ancora alla
scrittura accettata. La promozione viene saltata quando il candidato contiene placeholder di secret
redatti come `***` o valori di token abbreviati.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configura un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha la propria sezione di configurazione in `channels.<provider>`. Vedi la pagina dedicata del canale per i passaggi di configurazione:

    - [WhatsApp](/it/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/it/channels/telegram) — `channels.telegram`
    - [Discord](/it/channels/discord) — `channels.discord`
    - [Feishu](/it/channels/feishu) — `channels.feishu`
    - [Google Chat](/it/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/it/channels/msteams) — `channels.msteams`
    - [Slack](/it/channels/slack) — `channels.slack`
    - [Signal](/it/channels/signal) — `channels.signal`
    - [iMessage](/it/channels/imessage) — `channels.imessage`
    - [Mattermost](/it/channels/mattermost) — `channels.mattermost`

    Tutti i canali condividono lo stesso pattern di policy DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // solo per allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Scegli e configura i modelli">
    Imposta il modello primario e gli eventuali fallback:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definisce il catalogo dei modelli e agisce come allowlist per `/model`.
    - I riferimenti ai modelli usano il formato `provider/model` (ad es. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il downscaling delle immagini del transcript/tool (predefinito `1200`); valori più bassi di solito riducono l'uso di vision token nelle esecuzioni con molti screenshot.
    - Vedi [Models CLI](/it/concepts/models) per cambiare modello in chat e [Model Failover](/it/concepts/model-failover) per il comportamento di rotazione auth e fallback.
    - Per provider personalizzati/self-hosted, vedi [Provider personalizzati](/it/gateway/configuration-reference#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controlla chi può inviare messaggi al bot">
    L'accesso DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di abbinamento monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nello store allow associato)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` oppure allowlist specifiche del canale.

    Vedi il [riferimento completo](/it/gateway/configuration-reference#dm-and-group-access) per i dettagli specifici per canale.

  </Accordion>

  <Accordion title="Configura la limitazione delle menzioni nella chat di gruppo">
    I messaggi di gruppo richiedono per impostazione predefinita una **menzione obbligatoria**. Configura i pattern per agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menzioni tramite metadati**: @-mention native (tap-to-mention di WhatsApp, @bot di Telegram, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#group-chat-mention-gating) per override specifici per canale e modalità self-chat.

  </Accordion>

  <Accordion title="Limita le Skills per agente">
    Usa `agents.defaults.skills` per una baseline condivisa, poi sovrascrivi gli agenti specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // eredita github, weather
          { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
          { id: "locked-down", skills: [] }, // nessuna skill
        ],
      },
    }
    ```

    - Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per non avere Skills.
    - Vedi [Skills](/it/tools/skills), [Configurazione delle Skills](/it/tools/skills-config) e
      il [Riferimento della configurazione](/it/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regola il monitoraggio dello stato dei canali del gateway">
    Controlla quanto aggressivamente il gateway riavvia i canali che sembrano obsoleti:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitoraggio dello stato.
    - `channelStaleEventThresholdMinutes` dovrebbe essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` oppure `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o account senza disabilitare il monitor globale.
    - Vedi [Health Checks](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Configura sessioni e reset">
    Le sessioni controllano la continuità e l'isolamento della conversazione:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // consigliato per multiutente
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (condiviso) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni associate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Vedi [Gestione delle sessioni](/it/concepts/session) per ambito, link di identità e policy di invio.
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilita il sandboxing">
    Esegui le sessioni agente in runtime sandbox isolati:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Crea prima l'immagine: `scripts/sandbox-setup.sh`

    Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/configuration-reference#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilita il push supportato da relay per le build iOS ufficiali">
    Il push supportato da relay viene configurato in `openclaw.json`.

    Imposta questo nella configurazione del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facoltativo. Predefinito: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Cosa fa:

    - Consente al gateway di inviare `push.test`, wake nudges e reconnect wake tramite il relay esterno.
    - Usa un permesso di invio con ambito di registrazione inoltrato dall'app iOS associata. Il gateway non ha bisogno di un token relay valido per l'intera distribuzione.
    - Collega ogni registrazione supportata da relay all'identità del gateway con cui l'app iOS è stata associata, in modo che un altro gateway non possa riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati da relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere al relay base URL incorporato nella build iOS ufficiale/TestFlight, così il traffico di registrazione e invio raggiunge la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso relay base URL.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Associa l'app iOS al gateway e lascia che si connettano sia la sessione node sia quella operatore.
    4. L'app iOS recupera l'identità del gateway, si registra con il relay usando App Attest più la ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato da relay sul gateway associato.
    5. Il gateway memorizza l'handle relay e il permesso di invio, poi li usa per `push.test`, wake nudges e reconnect wake.

    Note operative:

    - Se sposti l'app iOS su un gateway diverso, riconnetti l'app in modo che possa pubblicare una nuova registrazione relay collegata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la registrazione relay in cache invece di riutilizzare il vecchio relay origin.

    Nota sulla compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override env temporanei.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` resta una via di fuga di sviluppo solo loopback; non rendere persistenti URL relay HTTP nella configurazione.

    Vedi [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e attendibilità](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Configura Heartbeat (check-in periodici)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: stringa durata (`30m`, `2h`). Imposta `0m` per disabilitare.
    - `target`: `last` | `none` | `<channel-id>` (per esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) oppure `block` per target Heartbeat in stile DM
    - Vedi [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configura i job Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina dalle `sessions.json` le sessioni isolate di esecuzione completate (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: elimina `cron/runs/<jobId>.jsonl` in base alla dimensione e alle righe conservate.
    - Vedi [Cron jobs](/it/automation/cron-jobs) per una panoramica della funzionalità e per esempi CLI.

  </Accordion>

  <Accordion title="Configura Webhook (hook)">
    Abilita gli endpoint Webhook HTTP sul Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota di sicurezza:
    - Tratta tutto il contenuto del payload hook/Webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare il token condiviso del Gateway.
    - L'autenticazione hook è solo tramite header (`Authorization: Bearer ...` oppure `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso Webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass per contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia facendo debug in modo strettamente limitato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionate dal chiamante.
    - Per gli agenti guidati da hook, preferisci tier di modello moderni e robusti e una policy tool rigorosa (per esempio solo messaggistica più sandboxing quando possibile).

    Vedi il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configura l'instradamento multi-agent">
    Esegui più agenti isolati con workspace e sessioni separate:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Vedi [Multi-Agent](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/configuration-reference#multi-agent-routing) per le regole di binding e i profili di accesso per agente.

  </Accordion>

  <Accordion title="Suddividi la configurazione in più file ($include)">
    Usa `$include` per organizzare configurazioni grandi:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **File singolo**: sostituisce l'oggetto contenitore
    - **Array di file**: deep-merge in ordine (vince l'ultimo)
    - **Chiavi sibling**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti relativamente al file che include
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Hot reload della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — nella maggior parte dei casi non è necessario un riavvio manuale.

Le modifiche dirette al file vengono trattate come non attendibili finché non vengono validate. Il watcher aspetta
che il churn di scrittura/rinomina temporanea dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide ripristinando l'ultima configurazione valida. Le scritture di configurazione
possedute da OpenClaw usano lo stesso controllo di schema prima della scrittura; sovrascritture distruttive come
l'eliminazione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutate
e salvate come `.rejected.*` per l'ispezione.

Se vedi `Config auto-restored from last-known-good` oppure
`config reload restored last-known-good config` nei log, ispeziona il file
`.clobbered.*` corrispondente accanto a `openclaw.json`, correggi il payload rifiutato, quindi esegui
`openclaw config validate`. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config)
per la checklist di ripristino.

### Modalità di reload

| Mode                   | Behavior                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo le modifiche sicure istantaneamente. Riavvia automaticamente per quelle critiche.           |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando è necessario un riavvio — lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway per qualsiasi modifica della configurazione, sicura o meno.                                 |
| **`off`**              | Disabilita l'osservazione del file. Le modifiche hanno effetto al successivo riavvio manuale.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa si applica a caldo e cosa richiede un riavvio

La maggior parte dei campi si applica a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono riavvio vengono gestite automaticamente.

| Category            | Fields                                                            | Restart needed? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channels            | `channels.*`, `web` (WhatsApp) — tutti i canali integrati e Plugin | No              |
| Agent & models      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sessions & messages | `session`, `messages`                                             | No              |
| Tools & media       | `tools`, `browser`, `skills`, `audio`, `talk`                     | No              |
| UI & misc           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Gateway server      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Sì**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **Sì**         |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni — modificarli **non** attiva un riavvio.
</Note>

## Config RPC (aggiornamenti programmatici)

<Note>
Le RPC di scrittura del control plane (`config.apply`, `config.patch`, `update.run`) sono limitate a **3 richieste ogni 60 secondi** per `deviceId+clientIp`. Quando limitata, la RPC restituisce `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flusso sicuro/predefinito:

- `config.schema.lookup`: ispeziona un sottoalbero di configurazione limitato a un percorso con un nodo di
  schema superficiale, metadati hint corrispondenti e riepiloghi immediati dei figli
- `config.get`: recupera lo snapshot corrente + hash
- `config.patch`: percorso di aggiornamento parziale preferito
- `config.apply`: solo sostituzione completa della configurazione
- `update.run`: self-update esplicito + riavvio

Quando non stai sostituendo l'intera configurazione, preferisci `config.schema.lookup`
poi `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (sostituzione completa)">
    Valida + scrive l'intera configurazione e riavvia il Gateway in un solo passaggio.

    <Warning>
    `config.apply` sostituisce l'**intera configurazione**. Usa `config.patch` per aggiornamenti parziali, oppure `openclaw config set` per singole chiavi.
    </Warning>

    Parametri:

    - `raw` (string) — payload JSON5 per l'intera configurazione
    - `baseHash` (facoltativo) — hash della configurazione da `config.get` (obbligatorio quando la configurazione esiste)
    - `sessionKey` (facoltativo) — chiave di sessione per il ping di wake-up post-riavvio
    - `note` (facoltativo) — nota per il sentinel di riavvio
    - `restartDelayMs` (facoltativo) — ritardo prima del riavvio (predefinito 2000)

    Le richieste di riavvio vengono aggregate mentre una è già in sospeso/in corso, e si applica un cooldown di 30 secondi tra i cicli di riavvio.

    ```bash
    openclaw gateway call config.get --params '{}'  # acquisisci payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (aggiornamento parziale)">
    Unisce un aggiornamento parziale alla configurazione esistente (semantica JSON merge patch):

    - Gli oggetti vengono uniti ricorsivamente
    - `null` elimina una chiave
    - Gli array vengono sostituiti

    Parametri:

    - `raw` (string) — JSON5 solo con le chiavi da modificare
    - `baseHash` (obbligatorio) — hash della configurazione da `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — uguali a `config.apply`

    Il comportamento di riavvio corrisponde a `config.apply`: riavvii in sospeso aggregati più un cooldown di 30 secondi tra i cicli di riavvio.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente

OpenClaw legge le variabili d'ambiente dal processo padre più:

- `.env` dalla directory di lavoro corrente (se presente)
- `~/.openclaw/.env` (fallback globale)

Nessuno dei due file sovrascrive variabili d'ambiente esistenti. Puoi anche impostare variabili d'ambiente inline nella configurazione:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importazione env della shell (facoltativa)">
  Se abilitato e le chiavi attese non sono impostate, OpenClaw esegue la tua login shell e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sostituzione di env var nei valori di configurazione">
  Fai riferimento alle variabili d'ambiente in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Sono corrisposti solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al momento del caricamento
- Usa l'escape con `$${VAR}` per un output letterale
- Funziona all'interno dei file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Riferimenti ai secret (env, file, exec)">
  Per i campi che supportano oggetti SecretRef, puoi usare:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

I dettagli di SecretRef (inclusi `secrets.providers` per `env`/`file`/`exec`) si trovano in [Gestione dei secret](/it/gateway/secrets).
I percorsi delle credenziali supportati sono elencati in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Accordion>

Vedi [Environment](/it/help/environment) per la precedenza completa e le origini.

## Riferimento completo

Per il riferimento completo campo per campo, vedi **[Riferimento della configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento della configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_
