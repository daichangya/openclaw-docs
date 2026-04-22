---
read_when:
    - Hai bisogno della firma di tipo esatta di definePluginEntry o defineChannelPluginEntry
    - Vuoi comprendere la modalità di registrazione (full vs setup vs metadati CLI)
    - Stai cercando le opzioni del punto di ingresso
sidebarTitle: Entry Points
summary: Riferimento per definePluginEntry, defineChannelPluginEntry e defineSetupPluginEntry
title: Punti di ingresso del Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Punti di ingresso del Plugin

Ogni Plugin esporta un oggetto entry predefinito. L'SDK fornisce tre helper per
crearlo.

Per i Plugin installati, `package.json` dovrebbe puntare il caricamento runtime al
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

`extensions` e `setupEntry` restano entry sorgente valide per lo sviluppo in workspace e checkout git.
`runtimeExtensions` e `runtimeSetupEntry` sono preferiti
quando OpenClaw carica un pacchetto installato e permettono ai pacchetti npm di evitare la
compilazione TypeScript a runtime. Se un pacchetto installato dichiara solo una entry
sorgente TypeScript, OpenClaw userà un peer `dist/*.js` compilato corrispondente quando esiste,
poi userà il fallback al sorgente TypeScript.

Tutti i percorsi di entry devono restare all'interno della directory del pacchetto Plugin. Le entry runtime
e i peer JavaScript compilati dedotti non rendono valido un percorso sorgente `extensions` o
`setupEntry` che esce da quella directory.

<Tip>
  **Cerchi una guida passo passo?** Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  o [Plugin provider](/it/plugins/sdk-provider-plugins) per guide dettagliate.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Per Plugin provider, Plugin tool, Plugin hook e tutto ciò che **non** è
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

| Field          | Type                                                             | Required | Default             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Sì      | —                   |
| `name`         | `string`                                                         | Sì      | —                   |
| `description`  | `string`                                                         | Sì      | —                   |
| `kind`         | `string`                                                         | No       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Schema oggetto vuoto |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Sì      | —                   |

- `id` deve corrispondere al manifest `openclaw.plugin.json`.
- `kind` è per slot esclusivi: `"memory"` oppure `"context-engine"`.
- `configSchema` può essere una funzione per la valutazione lazy.
- OpenClaw risolve e memoizza quello schema al primo accesso, quindi i builder di schema
  costosi vengono eseguiti una sola volta.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Incapsula `definePluginEntry` con il wiring specifico del canale. Chiama automaticamente
`api.registerChannel({ plugin })`, espone un seam facoltativo per i metadati CLI root-help
e limita `registerFull` in base alla modalità di registrazione.

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

| Field                 | Type                                                             | Required | Default             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Sì      | —                   |
| `name`                | `string`                                                         | Sì      | —                   |
| `description`         | `string`                                                         | Sì      | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Sì      | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | No       | Schema oggetto vuoto |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | No       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | No       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | No       | —                   |

- `setRuntime` viene chiamato durante la registrazione così puoi memorizzare il riferimento runtime
  (tipicamente tramite `createPluginRuntimeStore`). Viene saltato durante la cattura
  dei metadati CLI.
- `registerCliMetadata` viene eseguito sia durante `api.registrationMode === "cli-metadata"`
  sia durante `api.registrationMode === "full"`.
  Usalo come posto canonico per i descrittori CLI posseduti dal canale, così l'help root
  resta non attivante mentre la normale registrazione dei comandi CLI resta compatibile
  con i caricamenti completi del Plugin.
- `registerFull` viene eseguito solo quando `api.registrationMode === "full"`. Viene saltato
  durante il caricamento solo setup.
- Come `definePluginEntry`, `configSchema` può essere una factory lazy e OpenClaw
  memoizza lo schema risolto al primo accesso.
- Per i comandi CLI root posseduti dal Plugin, preferisci `api.registerCli(..., { descriptors: [...] })`
  quando vuoi che il comando resti caricato lazy senza sparire
  dall'albero di parsing della CLI root. Per i Plugin di canale, preferisci registrare quei descrittori
  da `registerCliMetadata(...)` e mantenere `registerFull(...)` focalizzato sul lavoro solo runtime.
- Se `registerFull(...)` registra anche metodi RPC gateway, mantienili su un
  prefisso specifico del Plugin. I namespace admin core riservati (`config.*`,
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

OpenClaw lo carica invece della entry completa quando un canale è disabilitato,
non configurato, oppure quando il caricamento differito è abilitato. Vedi
[Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per capire quando conta.

In pratica, abbina `defineSetupPluginEntry(...)` alle famiglie di helper setup ristrette:

- `openclaw/plugin-sdk/setup-runtime` per helper setup sicuri a runtime come
  adapter di patch setup import-safe, output di lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` e proxy setup delegati
- `openclaw/plugin-sdk/channel-setup` per superfici setup con installazione facoltativa
- `openclaw/plugin-sdk/setup-tools` per helper CLI/archive/docs di setup/installazione

Mantieni SDK pesanti, registrazione CLI e servizi runtime di lunga durata nella entry completa.

I canali workspace bundled che separano superfici setup e runtime possono usare
invece `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract`. Questo contratto permette alla
entry setup di mantenere esportazioni di plugin/secrets sicure per il setup pur esponendo comunque un
runtime setter:

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

Usa quel contratto bundled solo quando i flussi di setup hanno davvero bisogno di un runtime setter leggero
prima che venga caricata la entry completa del canale.

## Modalità di registrazione

`api.registrationMode` dice al tuo Plugin come è stato caricato:

| Mode              | When                              | What to register                                                                          |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | Normale avvio del gateway            | Tutto                                                                                |
| `"setup-only"`    | Canale disabilitato/non configurato     | Solo registrazione del canale                                                                 |
| `"setup-runtime"` | Flusso di setup con runtime disponibile | Registrazione del canale più solo il runtime leggero necessario prima che venga caricata la entry completa |
| `"cli-metadata"`  | Root help / acquisizione metadati CLI  | Solo descrittori CLI                                                                      |

`defineChannelPluginEntry` gestisce automaticamente questa suddivisione. Se usi
direttamente `definePluginEntry` per un canale, controlla tu stesso la modalità:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Registrazioni pesanti solo runtime
  api.registerService(/* ... */);
}
```

Tratta `"setup-runtime"` come la finestra in cui le superfici di avvio solo setup devono
esistere senza rientrare nel runtime completo del canale bundled. Buoni casi d'uso sono
registrazione del canale, route HTTP setup-safe, metodi gateway setup-safe e helper setup delegati.
Servizi in background pesanti, registrar CLI e bootstrap di SDK provider/client restano comunque in `"full"`.

In particolare per i registrar CLI:

- usa `descriptors` quando il registrar possiede uno o più comandi root e
  vuoi che OpenClaw carichi lazy il vero modulo CLI alla prima invocazione
- assicurati che quei descrittori coprano ogni root di comando di primo livello esposto dal
  registrar
- usa solo `commands` per i percorsi di compatibilità eager

## Forme del Plugin

OpenClaw classifica i Plugin caricati in base al loro comportamento di registrazione:

| Shape                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Un solo tipo di capacità (es. solo provider)           |
| **hybrid-capability** | Più tipi di capacità (es. provider + speech) |
| **hook-only**         | Solo hook, nessuna capacità                        |
| **non-capability**    | Tool/comandi/servizi ma nessuna capacità        |

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin.

## Correlati

- [Panoramica SDK](/it/plugins/sdk-overview) — API di registrazione e riferimento dei subpath
- [Helper runtime](/it/plugins/sdk-runtime) — `api.runtime` e `createPluginRuntimeStore`
- [Setup e configurazione](/it/plugins/sdk-setup) — manifest, setup entry, caricamento differito
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — costruzione dell'oggetto `ChannelPlugin`
- [Plugin provider](/it/plugins/sdk-provider-plugins) — registrazione provider e hook
