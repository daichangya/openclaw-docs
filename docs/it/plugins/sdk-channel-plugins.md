---
read_when:
    - Stai creando un nuovo Plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin di canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-04-15T08:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di Plugin di canale

Questa guida illustra come creare un Plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Al termine avrai un canale funzionante con sicurezza DM,
abbinamento, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima un Plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno dei propri strumenti send/edit/react. OpenClaw mantiene un
unico strumento `message` condiviso nel core. Il tuo Plugin gestisce:

- **Configurazione** — risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** — criteri DM e allowlist
- **Abbinamento** — flusso di approvazione DM
- **Grammatica della sessione** — come gli id di conversazione specifici del provider vengono mappati alle chat di base, agli id del thread e ai fallback del parent
- **In uscita** — invio di testo, contenuti multimediali e sondaggi alla piattaforma
- **Threading** — come vengono organizzate le risposte nei thread

Il core gestisce lo strumento message condiviso, il collegamento dei prompt, la forma esterna della chiave di sessione,
la gestione generica `:thread:` e il dispatch.

Se il tuo canale aggiunge parametri dello strumento message che trasportano origini multimediali, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e per la policy di
accesso ai contenuti multimediali in uscita, quindi i Plugin non hanno bisogno di casi speciali
nel core condiviso per parametri specifici del provider come avatar, allegati o immagini di copertina.
Preferisci restituire una mappa con chiave per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così che azioni non correlate non
ereditino gli argomenti multimediali di un'altra azione. Un array piatto continua a funzionare per parametri che
sono intenzionalmente condivisi tra tutte le azioni esposte.

Se la tua piattaforma memorizza ambito aggiuntivo negli id di conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico
per mappare `rawId` all'id di conversazione di base, all'id di thread opzionale,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più ristretto alla conversazione parent/base più ampia.

I Plugin inclusi che hanno bisogno dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file `session-key-api.ts` di primo livello con un'esportazione
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro dei Plugin di runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` rimane disponibile come
fallback di compatibilità legacy quando un Plugin ha bisogno solo dei fallback parent
oltre all'id generico/raw. Se entrambi gli hook esistono, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità del canale

La maggior parte dei Plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload dei pulsanti di approvazione condivisi e la consegna generica di fallback.
- Preferisci un singolo oggetto `approvalCapability` nel Plugin di canale quando il canale ha bisogno di comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci i fatti di consegna/approvazione nativa/rendering/autorizzazione in `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più gli hook di autorizzazione delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il punto di integrazione canonico per l'autorizzazione delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'autorizzazione delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'autorizzazione delle approvazioni nella stessa chat. Il core usa questo hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di origine supporta approvazioni exec native e includere il canale nella guida di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso più comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti specifici del canale relativi al ciclo di vita del payload, come nascondere prompt di approvazione locali duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing delle approvazioni native o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti di approvazione nativa posseduti dal canale. Mantienilo lazy sugli entrypoint hot del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo di runtime su richiesta continuando a permettere al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta nel percorso disabilitato spieghi gli esatti controlli di configurazione necessari per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero rendere percorsi con ambito dell'account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei valori predefiniti di primo livello.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica specifica per le approvazioni nel core.
- Se un canale ha bisogno della consegna di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Inserisci i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire il filtraggio delle richieste, il routing, la deduplicazione, la scadenza, la sottoscrizione al Gateway e gli avvisi di instradamento altrove. `nativeRuntime` è suddiviso in alcuni punti di integrazione più piccoli:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model di approvazione condiviso in payload nativi pendenti/risolti/scaduti o azioni finali
- `transport` — prepara i target più l'invio/aggiornamento/eliminazione dei messaggi di approvazione nativi
- `interactions` — hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook opzionali per la diagnostica della consegna
- Se il canale ha bisogno di oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto di runtime permette al core di avviare handler guidati dalle capacità dallo stato di avvio del canale senza aggiungere glue wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello più basso solo quando il punto di integrazione guidato dalle capacità non è ancora sufficientemente espressivo.
- I canali con approvazione nativa devono instradare sia `accountId` sia `approvalKind` tramite questi helper. `accountId` mantiene i criteri di approvazione multi-account nell'ambito del corretto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs Plugin senza branch hardcoded nel core.
- Il core ora gestisce anche gli avvisi di reindirizzamento delle approvazioni. I Plugin di canale non dovrebbero inviare propri messaggi di follow-up del tipo "l'approvazione è andata nei DM / in un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato origin + DM dell'approvatore tramite gli helper di capacità di approvazione condivisi e lascia che il core aggreghi le consegne effettive prima di pubblicare eventuali avvisi nella chat di origine.
- Mantieni end-to-end il tipo di id dell'approvazione consegnata. I client nativi non dovrebbero
  dedurre o riscrivere il routing delle approvazioni exec vs Plugin dallo stato locale del canale.
- Tipi diversi di approvazione possono esporre intenzionalmente superfici native diverse.
  Esempi inclusi attuali:
  - Slack mantiene disponibile il routing delle approvazioni native sia per gli id exec sia per quelli Plugin.
  - Matrix mantiene lo stesso routing DM/canale nativo e la stessa UX a reazioni per le approvazioni exec
    e Plugin, pur consentendo che l'autorizzazione differisca in base al tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` nel Plugin.

Per gli entrypoint hot del canale, preferisci i sottopercorsi di runtime più stretti quando ti serve solo
una parte di quella famiglia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Allo stesso modo, preferisci `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la
superficie ombrello più ampia.

Per la configurazione in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adattatori di patch di configurazione sicuri per l'importazione (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  delegati di setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` è il punto di integrazione stretto e consapevole dell'env
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione con installazione opzionale
  più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o autenticazione guidate da env e i flussi generici di avvio/configurazione
devono conoscere quei nomi env prima che il runtime venga caricato, dichiarali nel
manifest del Plugin con `channelEnvVars`. Mantieni `envVars` nel runtime del canale o costanti locali
solo per il testo rivolto agli operatori.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la superficie più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche
  helper condivisi più pesanti per setup/configurazione come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo Plugin" nelle
superfici di configurazione, preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/la procedura guidata generati falliscono in modo chiuso sulle scritture di configurazione e sulla finalizzazione, e riutilizzano
lo stesso messaggio di installazione richiesta tra validazione, finalizzazione e testo
del link alla documentazione.

Per altri percorsi hot del canale, preferisci gli helper stretti rispetto alle
superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per il collegamento di route/envelope in ingresso e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/corrispondenza dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per il caricamento dei contenuti multimediali più i
  delegati di identità/invio in uscita
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita del binding dei thread
  e la registrazione dell'adattatore
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora necessario un layout di campi legacy
  per i payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati di Telegram,
  la validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile rispetto al fallback

I canali solo-auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone solo le capacità outbound/auth. I canali con approvazioni native come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il ciclo di vita delle approvazioni.

## Policy delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal Plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-inbound` per il livello condiviso.

Adatto alla logica locale del Plugin:

- rilevamento delle risposte al bot
- rilevamento delle citazioni del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato della menzione esplicita
- allowlist delle menzioni implicite
- bypass dei comandi
- decisione finale di ignorare

Flusso consigliato:

1. Calcola i fatti locali relativi alla menzione.
2. Passa questi fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate in ingresso.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` espone gli stessi helper di menzione condivisi per
i Plugin di canale inclusi che dipendono già dall'iniezione del runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

I vecchi helper `resolveMentionGating*` rimangono in
`openclaw/plugin-sdk/channel-inbound` solo come esportazioni di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un Plugin di canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Plugin Setup and Config](/it/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Crea l'oggetto Plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici di adattatore facoltative. Inizia con
    il minimo — `id` e `setup` — e aggiungi adattatori secondo necessità.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="Cosa fa `createChatChannelPlugin` per te">
      Invece di implementare manualmente interfacce di adattatore di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver from config fields |
      | `pairing.text` | Text-based DM pairing flow with code exchange |
      | `threading` | Reply-to-mode resolver (fixed, account-scoped, or custom) |
      | `outbound.attachedResults` | Send functions that return result metadata (message IDs) |

      Puoi anche passare oggetti adattatore raw invece delle opzioni dichiarative
      se hai bisogno del pieno controllo.
    </Accordion>

  </Step>

  <Step title="Collega l'entry point">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Inserisci i descrittori CLI posseduti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continuano a rilevare gli stessi descrittori per la registrazione
    effettiva dei comandi. Mantieni `registerFull(...)` per il lavoro solo di runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un
    prefisso specifico del Plugin. I namespace di amministrazione del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre
    risolti in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione della modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una setup entry">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lo carica invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di caricare codice di runtime pesante durante i flussi di setup.
    Vedi [Setup and Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo Plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il modello tipico è un Webhook che verifica la richiesta e
    la inoltra tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni Plugin di canale gestisce
      la propria pipeline inbound. Guarda i Plugin di canale inclusi
      (per esempio il pacchetto Plugin Microsoft Teams o Google Chat) per modelli reali.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Scrivi test colocati in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Per gli helper di test condivisi, vedi [Testing](/it/plugins/sdk-testing).

  </Step>
</Steps>

## Struttura dei file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadati openclaw.channel
├── openclaw.plugin.json      # Manifest con schema di configurazione
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Esportazioni pubbliche (facoltativo)
├── runtime-api.ts            # Esportazioni interne di runtime (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Store di runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e individuazione delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, contenuti multimediali, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcuni punti di integrazione helper inclusi esistono ancora per la manutenzione e la
compatibilità dei Plugin inclusi. Non sono il modello consigliato per i nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime della superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Passaggi successivi

- [Provider Plugins](/it/plugins/sdk-provider-plugins) — se il tuo Plugin fornisce anche modelli
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo alle importazioni dei sottopercorsi
- [SDK Testing](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Plugin Manifest](/it/plugins/manifest) — schema completo del manifest
