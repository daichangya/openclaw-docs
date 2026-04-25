---
read_when:
    - Stai aggiungendo un wizard di setup a un Plugin
    - Devi capire `setup-entry.ts` rispetto a `index.ts`
    - Stai definendo schemi di configurazione del Plugin o metadati `openclaw` in package.json
sidebarTitle: Setup and Config
summary: Wizard di setup, setup-entry.ts, schemi di configurazione e metadati package.json
title: Setup e configurazione dei Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Riferimento per il packaging dei Plugin (metadati `package.json`), i manifest
(`openclaw.plugin.json`), le setup entry e gli schemi di configurazione.

<Tip>
  **Cerchi una guida passo passo?** Le guide pratiche coprono il packaging nel contesto:
  [Plugin di canale](/it/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugin provider](/it/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadati del pacchetto

Il tuo `package.json` deve avere un campo `openclaw` che dica al sistema dei Plugin cosa
fornisce il tuo Plugin:

**Plugin di canale:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin provider / baseline di pubblicazione ClawHub:**

```json openclaw-clawhub-package.json
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

Se pubblichi il Plugin esternamente su ClawHub, quei campi `compat` e `build`
sono obbligatori. Gli snippet canonici di pubblicazione si trovano in
`docs/snippets/plugin-publish/`.

### Campi `openclaw`

| Campo        | Tipo       | Descrizione                                                                                                              |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | File entry point (relativi alla root del pacchetto)                                                                     |
| `setupEntry` | `string`   | Entry leggera solo-setup (facoltativa)                                                                                  |
| `channel`    | `object`   | Metadati del catalogo del canale per superfici di setup, selettore, quickstart e stato                                 |
| `providers`  | `string[]` | Id provider registrati da questo Plugin                                                                                 |
| `install`    | `object`   | Suggerimenti di installazione: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag di comportamento all'avvio                                                                                         |

### `openclaw.channel`

`openclaw.channel` è un metadato di pacchetto economico per superfici di discovery e setup
del canale prima del caricamento del runtime.

| Campo                                  | Tipo       | Significato                                                                 |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id canonico del canale.                                                     |
| `label`                                | `string`   | Etichetta primaria del canale.                                              |
| `selectionLabel`                       | `string`   | Etichetta del selettore/setup quando deve differire da `label`.             |
| `detailLabel`                          | `string`   | Etichetta di dettaglio secondaria per superfici più ricche di cataloghi e stato del canale. |
| `docsPath`                             | `string`   | Percorso della documentazione per i link di setup e selezione.              |
| `docsLabel`                            | `string`   | Etichetta sostitutiva usata per i link alla documentazione quando deve differire dall'id del canale. |
| `blurb`                                | `string`   | Breve descrizione per onboarding/catalogo.                                  |
| `order`                                | `number`   | Ordine di ordinamento nei cataloghi dei canali.                             |
| `aliases`                              | `string[]` | Alias aggiuntivi di lookup per la selezione del canale.                     |
| `preferOver`                           | `string[]` | Id Plugin/canale a priorità inferiore che questo canale dovrebbe superare.  |
| `systemImage`                          | `string`   | Nome facoltativo di icona/system-image per i cataloghi UI del canale.       |
| `selectionDocsPrefix`                  | `string`   | Testo prefisso prima dei link alla documentazione nelle superfici di selezione. |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra direttamente il percorso della documentazione invece di un link con etichetta nella copia di selezione. |
| `selectionExtras`                      | `string[]` | Stringhe brevi aggiuntive accodate nella copia di selezione.                |
| `markdownCapable`                      | `boolean`  | Contrassegna il canale come capace di markdown per le decisioni di formattazione in uscita. |
| `exposure`                             | `object`   | Controlli di visibilità del canale per setup, elenchi configurati e superfici della documentazione. |
| `quickstartAllowFrom`                  | `boolean`  | Consente a questo canale di aderire al flusso standard di setup `allowFrom` del quickstart. |
| `forceAccountBinding`                  | `boolean`  | Richiede un binding account esplicito anche quando esiste un solo account.  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Preferisce il lookup della sessione quando risolve i target di announce per questo canale. |

Esempio:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` supporta:

- `configured`: include il canale nelle superfici di elenco in stile configured/status
- `setup`: include il canale nei selettori interattivi di setup/configurazione
- `docs`: contrassegna il canale come rivolto al pubblico nelle superfici di documentazione/navigazione

`showConfigured` e `showInSetup` restano supportati come alias legacy. Preferisci
`exposure`.

### `openclaw.install`

`openclaw.install` è un metadato di pacchetto, non un metadato del manifest.

| Campo                        | Tipo                 | Significato                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Specifica npm canonica per i flussi di installazione/aggiornamento.            |
| `localPath`                  | `string`             | Percorso di installazione locale di sviluppo o inclusa.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Sorgente di installazione preferita quando entrambe sono disponibili.          |
| `minHostVersion`             | `string`             | Versione minima supportata di OpenClaw nella forma `>=x.y.z`.                  |
| `expectedIntegrity`          | `string`             | Stringa di integrità attesa della distribuzione npm, di solito `sha512-...`, per installazioni fissate. |
| `allowInvalidConfigRecovery` | `boolean`            | Consente ai flussi di reinstallazione dei Plugin inclusi di recuperare da specifici errori di configurazione obsoleta. |

L'onboarding interattivo usa anche `openclaw.install` per superfici di installazione on-demand.
Se il tuo Plugin espone scelte auth del provider o metadati di setup/catalogo del canale
prima del caricamento del runtime, l'onboarding può mostrare quella scelta, chiedere
npm vs installazione locale, installare o abilitare il Plugin e poi continuare il flusso
selezionato. Le scelte npm di onboarding richiedono metadati di catalogo affidabili con uno
`npmSpec` del registry; le versioni esatte e `expectedIntegrity` sono pin facoltativi. Se
`expectedIntegrity` è presente, i flussi di installazione/aggiornamento lo applicano. Mantieni i metadati "cosa
mostrare" in `openclaw.plugin.json` e i metadati "come installarlo" in
`package.json`.

Se `minHostVersion` è impostato, sia l'installazione sia il caricamento del manifest-registry lo applicano.
Gli host più vecchi saltano il Plugin; le stringhe di versione non valide vengono rifiutate.

Per installazioni npm fissate, mantieni la versione esatta in `npmSpec` e aggiungi
l'integrità attesa dell'artefatto:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` non è un bypass generale per configurazioni rotte. Serve
solo per recupero ristretto di Plugin inclusi, così reinstallazione/setup possono riparare residui di aggiornamento noti come un percorso mancante del Plugin incluso o una voce obsoleta `channels.<id>`
per quello stesso Plugin. Se la configurazione è rotta per motivi non correlati, l'installazione
continua a fallire in modalità fail-closed e dice all'operatore di eseguire `openclaw doctor --fix`.

### Caricamento completo differito

I Plugin di canale possono aderire al caricamento differito con:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Quando è abilitato, OpenClaw carica solo `setupEntry` durante la fase di avvio
pre-listen, anche per canali già configurati. L'entry completa viene caricata dopo che il
gateway ha iniziato ad ascoltare.

<Warning>
  Abilita il caricamento differito solo quando il tuo `setupEntry` registra tutto ciò di cui il
  gateway ha bisogno prima di iniziare ad ascoltare (registrazione del canale, route HTTP,
  metodi del gateway). Se l'entry completa possiede capability di avvio richieste, mantieni
  il comportamento predefinito.
</Warning>

Se la tua entry setup/completa registra metodi RPC del gateway, mantienili su un
prefisso specifico del Plugin. I namespace admin core riservati (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano di proprietà del core e vengono sempre risolti
a `operator.admin`.

## Manifest del Plugin

Ogni Plugin nativo deve includere un `openclaw.plugin.json` nella root del pacchetto.
OpenClaw lo usa per convalidare la configurazione senza eseguire il codice del Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Per i Plugin di canale, aggiungi `kind` e `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Anche i Plugin senza configurazione devono includere uno schema. Uno schema vuoto è valido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Vedi [Manifest del Plugin](/it/plugins/manifest) per il riferimento completo dello schema.

## Pubblicazione ClawHub

Per i pacchetti Plugin, usa il comando ClawHub specifico del pacchetto:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

L'alias legacy di pubblicazione solo-Skills è per le Skills. I pacchetti Plugin dovrebbero
usare sempre `clawhub package publish`.

## Setup entry

Il file `setup-entry.ts` è un'alternativa leggera a `index.ts` che
OpenClaw carica quando ha bisogno solo delle superfici di setup (onboarding, riparazione della configurazione,
ispezione di canali disabilitati).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Questo evita di caricare codice runtime pesante (librerie crittografiche, registrazioni CLI,
servizi in background) durante i flussi di setup.

I canali workspace inclusi che mantengono export sicuri per il setup in moduli sidecar possono
usare `defineBundledChannelSetupEntry(...)` da
`openclaw/plugin-sdk/channel-entry-contract` invece di
`defineSetupPluginEntry(...)`. Quel contratto incluso supporta anche un export `runtime`
facoltativo così il wiring runtime al momento del setup può restare leggero ed esplicito.

**Quando OpenClaw usa `setupEntry` invece dell'entry completa:**

- Il canale è disabilitato ma ha bisogno di superfici di setup/onboarding
- Il canale è abilitato ma non configurato
- Il caricamento differito è abilitato (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Cosa deve registrare `setupEntry`:**

- L'oggetto Plugin del canale (tramite `defineSetupPluginEntry`)
- Qualsiasi route HTTP richiesta prima del listen del gateway
- Qualsiasi metodo del gateway necessario durante l'avvio

Quei metodi gateway di avvio dovrebbero comunque evitare namespace admin core
riservati come `config.*` o `update.*`.

**Cosa NON dovrebbe includere `setupEntry`:**

- Registrazioni CLI
- Servizi in background
- Import runtime pesanti (crittografia, SDK)
- Metodi gateway necessari solo dopo l'avvio

### Import helper di setup ristretti

Per percorsi caldi solo-setup, preferisci le seam helper di setup ristrette rispetto al più ampio
umbrella `plugin-sdk/setup` quando ti serve solo una parte della superficie di setup:

| Percorso di importazione             | Usalo per                                                                                | Export principali                                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helper runtime in fase di setup che restano disponibili in `setupEntry` / avvio differito del canale | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adapter di setup account consapevoli dell'ambiente                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                              |
| `plugin-sdk/setup-tools`             | helper CLI/archive/documentazione per setup/installazione                                | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                    |

Usa la seam più ampia `plugin-sdk/setup` quando vuoi l'intera cassetta degli attrezzi condivisa per il setup,
inclusi helper di patch della configurazione come
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gli adapter di patch del setup restano sicuri per il percorso caldo all'importazione. Il loro lookup della
superficie contrattuale di promozione single-account inclusa è lazy, quindi importare
`plugin-sdk/setup-runtime` non carica in anticipo la discovery della superficie contrattuale inclusa prima che l'adapter venga effettivamente usato.

### Promozione single-account di proprietà del canale

Quando un canale passa da una configurazione top-level single-account a
`channels.<id>.accounts.*`, il comportamento condiviso predefinito consiste nello spostare i valori
promossi e limitati all'account in `accounts.default`.

I canali inclusi possono restringere o sovrascrivere quella promozione tramite la loro
superficie contrattuale di setup:

- `singleAccountKeysToMove`: chiavi top-level aggiuntive che dovrebbero spostarsi
  nell'account promosso
- `namedAccountPromotionKeys`: quando esistono già account nominati, solo queste
  chiavi vengono spostate nell'account promosso; le chiavi condivise di policy/consegna restano alla
  root del canale
- `resolveSingleAccountPromotionTarget(...)`: sceglie quale account esistente
  riceve i valori promossi

Matrix è l'esempio incluso attuale. Se esiste già esattamente un account Matrix nominato,
oppure se `defaultAccount` punta a una chiave esistente non canonica come
`Ops`, la promozione preserva quell'account invece di creare una nuova
voce `accounts.default`.

## Schema di configurazione

La configurazione del Plugin viene convalidata rispetto allo schema JSON nel tuo manifest. Gli utenti
configurano i Plugin tramite:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Il tuo Plugin riceve questa configurazione come `api.pluginConfig` durante la registrazione.

Per la configurazione specifica del canale, usa invece la sezione di configurazione del canale:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Costruzione degli schemi di configurazione del canale

Usa `buildChannelConfigSchema` per convertire uno schema Zod nel wrapper
`ChannelConfigSchema` usato dagli artefatti di configurazione di proprietà del Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Per i Plugin di terze parti, il contratto del percorso freddo resta comunque il manifest del Plugin:
rispecchia lo schema JSON generato in `openclaw.plugin.json#channelConfigs` così
schema di configurazione, setup e superfici UI possano ispezionare `channels.<id>` senza
caricare codice runtime.

## Wizard di setup

I Plugin di canale possono fornire wizard di setup interattivi per `openclaw onboard`.
Il wizard è un oggetto `ChannelSetupWizard` sul `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Il tipo `ChannelSetupWizard` supporta `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e altro.
Vedi i pacchetti Plugin inclusi (ad esempio il Plugin Discord `src/channel.setup.ts`) per
esempi completi.

Per prompt di allowlist DM che richiedono solo il flusso standard
`note -> prompt -> parse -> merge -> patch`, preferisci gli helper di setup condivisi da
`openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Per blocchi di stato del setup del canale che variano solo per etichette, punteggi e righe aggiuntive facoltative, preferisci `createStandardChannelSetupStatus(...)` da
`openclaw/plugin-sdk/setup` invece di costruire manualmente lo stesso oggetto `status` in
ogni Plugin.

Per superfici di setup facoltative che dovrebbero apparire solo in determinati contesti, usa
`createOptionalChannelSetupSurface` da `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Restituisce { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` espone anche i costruttori di livello inferiore
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando ti serve solo una metà di
quella superficie di installazione facoltativa.

L'adapter/wizard facoltativo generato fallisce in modalità fail-closed sulle vere scritture di configurazione. Riusa un unico messaggio di installazione richiesta tra `validateInput`,
`applyAccountConfig` e `finalize`, e aggiunge un link alla documentazione quando `docsPath` è
impostato.

Per UI di setup supportate da binari, preferisci gli helper delegati condivisi invece di
copiare la stessa logica binary/status in ogni canale:

- `createDetectedBinaryStatus(...)` per blocchi di stato che variano solo per etichette,
  suggerimenti, punteggi e rilevamento del binario
- `createCliPathTextInput(...)` per input testuali basati su percorso
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` deve inoltrare in modo lazy a
  un wizard completo più pesante
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` deve solo
  delegare una decisione `textInputs[*].shouldPrompt`

## Pubblicazione e installazione

**Plugin esterni:** pubblica su [ClawHub](/it/tools/clawhub) o npm, poi installa:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw prova prima ClawHub e usa automaticamente il fallback a npm. Puoi anche
forzare esplicitamente ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # solo ClawHub
```

Non esiste un override `npm:` corrispondente. Usa la normale specifica del pacchetto npm quando
vuoi il percorso npm dopo il fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin nel repo:** inseriscili sotto l'albero workspace dei Plugin inclusi e vengono scoperti automaticamente
durante la build.

**Gli utenti possono installare:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Per installazioni da npm, `openclaw plugins install` esegue
  `npm install --ignore-scripts` (nessun lifecycle script). Mantieni l'albero delle dipendenze del Plugin
  puramente JS/TS ed evita pacchetti che richiedono build `postinstall`.
</Info>

I Plugin inclusi di proprietà di OpenClaw sono l'unica eccezione di riparazione all'avvio: quando un'
installazione pacchettizzata ne vede uno abilitato dalla configurazione del Plugin, dalla configurazione canale legacy o
dal suo manifest incluso con default-enabled, all'avvio installa le dipendenze runtime mancanti di quel Plugin prima dell'importazione. I Plugin di terze parti non dovrebbero fare affidamento su
installazioni all'avvio; continua a usare l'installer esplicito dei Plugin.

## Correlati

- [Entry point dell'SDK](/it/plugins/sdk-entrypoints) — `definePluginEntry` e `defineChannelPluginEntry`
- [Manifest del Plugin](/it/plugins/manifest) — riferimento completo dello schema del manifest
- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva passo passo
