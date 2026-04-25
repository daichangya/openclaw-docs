---
read_when:
    - Hai bisogno della firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi capire la modalità di registrazione (full vs setup vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-04-25T13:53:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Ogni plugin esporta un oggetto entry predefinito. L'SDK fornisce tre helper per
crearli.

Per i plugin installati, `package.json` dovrebbe puntare il caricamento runtime a
JavaScript compilato quando disponibile:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` e `setupEntry` restano punti di ingresso sorgente validi per lo sviluppo
in workspace e checkout git. `runtimeExtensions` e `runtimeSetupEntry` sono preferiti
quando OpenClaw carica un pacchetto installato e consentono ai pacchetti npm di evitare
la compilazione TypeScript a runtime. Se un pacchetto installato dichiara solo un punto
di ingresso sorgente TypeScript, OpenClaw userà un peer compilato corrispondente `dist/*.js` quando esiste, poi userà come fallback il sorgente TypeScript.

Tutti i percorsi di ingresso devono restare all'interno della directory del pacchetto plugin. Le entry runtime
e i peer JavaScript compilati dedotti non rendono valido un percorso sorgente
`extensions` o `setupEntry` che esce da quel perimetro.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Channel Plugins](/it/plugins/sdk-channel-plugins)
  oppure [Provider Plugins](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per plugin provider, plugin tool, plugin hook e qualsiasi cosa **non** sia
un canale di messaggistica.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Campo          | Tipo                                                             | Obbligatorio | Predefinito        |
| -------------- | ---------------------------------------------------------------- | ------------ | ------------------ |
| `id`           | `string`                                                         | Sì           | —                  |
| `name`         | `string`                                                         | Sì           | —                  |
| `description`  | `string`                                                         | Sì           | —                  |
| `kind`         | `string`                                                         | No           | —                  |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì           | —                  |

- `id` deve corrispondere al tuo manifest `openclaw.plugin.json`.
- `kind` è per slot esclusivi: `"memory"` oppure `"context-engine"`.
- `configSchema` può essere una funzione per una valutazione lazy.
- OpenClaw risolve e memoizza quello schema al primo accesso, quindi i builder di schema
  costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Avvolge `definePluginEntry` con wiring specifico del canale. Chiama automaticamente
`api.registerChannel({ plugin })`, espone una seam facoltativa di metadati CLI per l'help root e vincola `registerFull` alla modalità di registrazione.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Campo                 | Tipo                                                             | Obbligatorio | Predefinito        |
| --------------------- | ---------------------------------------------------------------- | ------------ | ------------------ |
| `id`                  | `string`                                                         | Sì           | —                  |
| `name`                | `string`                                                         | Sì           | —                  |
| `description`         | `string`                                                         | Sì           | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Sì           | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No           | Schema oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No           | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No           | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No           | —                  |

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante l'acquisizione
  dei metadati CLI.
- `registerCliMetadata` viene eseguito durante `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` e
  `api.registrationMode === "full"`.
  Usalo come punto canonico per i descrittori CLI posseduti dal canale così l'help root
  resta non attivante, gli snapshot di discovery includono metadati statici dei comandi e
  la normale registrazione dei comandi CLI resta compatibile con i caricamenti completi del plugin.
- La registrazione discovery è non attivante, non import-free. OpenClaw può
  valutare la entry del plugin attendibile e il modulo del plugin di canale per costruire
  lo snapshot, quindi mantieni gli import top-level privi di side effect e metti socket,
  client, worker e servizi dietro percorsi `"full"`-only.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memoizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti lazy-loaded senza scomparire dall'albero di parsing della CLI root. Per i plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantenere `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC del gateway, mantienili su un
  prefisso specifico del plugin. Gli spazi dei nomi admin core riservati (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) vengono sempre forzati a
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Per il file leggero `setup-entry.ts`. Restituisce solo `{ plugin }` senza
wiring runtime o CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw lo carica al posto della entry completa quando un canale è disabilitato,
non configurato o quando è abilitato il caricamento differito. Vedi
[Setup and Config](/it/plugins/sdk-setup#setup-entry) per capire quando conta.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie ristrette di helper setup:

- `openclaw/plugin-sdk/setup-runtime` per helper setup runtime-safe come
  adapter di patch setup import-safe, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici di setup install-on-demand
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archive/docs di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime di lunga durata nella entry
completa.

I canali bundled del workspace che dividono setup e superfici runtime possono usare
invece `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Quel contratto consente alla
entry setup di mantenere esportazioni plugin/secrets sicure per il setup esponendo comunque un
setter runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Usa quel contratto bundled solo quando i flussi di setup hanno davvero bisogno di un setter runtime leggero
prima che venga caricata la entry completa del canale.

## Modalità di registrazione

`api.registrationMode` dice al tuo plugin come è stato caricato:

| Modalità         | Quando                           | Cosa registrare                                                                                                         |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`         | Normale avvio del Gateway        | Tutto                                                                                                                   |
| `"discovery"`    | Discovery delle capability in sola lettura | Registrazione del canale più descrittori CLI statici; il codice entry può caricarsi, ma salta socket, worker, client e servizi |
| `"setup-only"`   | Canale disabilitato/non configurato | Solo registrazione del canale                                                                                       |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima del caricamento della entry completa           |
| `"cli-metadata"` | Help root / acquisizione metadati CLI | Solo descrittori CLI                                                                                                 |

`defineChannelPluginEntry` gestisce automaticamente questa divisione. Se usi
`definePluginEntry` direttamente per un canale, controlla tu la modalità:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

La modalità discovery costruisce uno snapshot di registro non attivante. Può comunque valutare
la entry del plugin e l'oggetto plugin di canale così OpenClaw può registrare le capability del canale
e i descrittori CLI statici. Tratta la valutazione del modulo in discovery come
attendibile ma leggera: niente client di rete, sottoprocessi, listener, connessioni database,
worker in background, letture di credenziali o altri effetti collaterali runtime live a livello top.

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup devono
esistere senza rientrare nel runtime completo del canale bundled. Sono adatti
la registrazione del canale, route HTTP setup-safe, metodi gateway setup-safe e
helper setup delegati. Servizi background pesanti, registrar CLI e
bootstrap di SDK provider/client appartengono ancora a `"full"`.

Per i registrar CLI in particolare:

- usa `descriptors` quando il registrar possiede uno o più comandi root e
  vuoi che OpenClaw carichi lazy il vero modulo CLI alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando di primo livello esposto dal
  registrar
- mantieni i nomi dei comandi dei descrittori composti da lettere, numeri, trattino e underscore,
  iniziando con una lettera o un numero; OpenClaw rifiuta nomi di descrittori fuori
  da questa forma e rimuove le sequenze di controllo del terminale dalle descrizioni prima
  di renderizzare l'help
- usa solo `commands` per i percorsi di compatibilità eager

## Shape dei Plugin

OpenClaw classifica i plugin caricati in base al loro comportamento di registrazione:

| Shape                 | Descrizione                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un solo tipo di capability (es. solo provider)     |
| **hybrid-capability** | Più tipi di capability (es. provider + speech)     |
| **hook-only**         | Solo Hook, nessuna capability                      |
| **non-capability**    | Strumenti/comandi/servizi ma nessuna capability    |

Usa `openclaw plugins inspect <id>` per vedere la shape di un plugin.

## Correlati

- [SDK Overview](/it/plugins/sdk-overview) — API di registrazione e riferimento dei sottopercorsi
- [Runtime Helpers](/it/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup and Config](/it/plugins/sdk-setup) — manifest, entry setup, caricamento differito
- [Channel Plugins](/it/plugins/sdk-channel-plugins) — costruire l'oggetto `ChannelPlugin`
- [Provider Plugins](/it/plugins/sdk-provider-plugins) — registrazione provider e Hook
