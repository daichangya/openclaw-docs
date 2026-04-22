---
read_when:
    - Stai creando un nuovo plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi capire la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un plugin di canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-04-22T08:20:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di Plugin di canale

Questa guida illustra come creare un plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza
DM, pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e l'impostazione del manifest.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di strumenti propri per inviare/modificare/reagire. OpenClaw mantiene in core un unico strumento `message` condiviso. Il tuo plugin gestisce:

- **Config** — risoluzione dell'account e procedura guidata di configurazione
- **Security** — criteri DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Session grammar** — come gli id di conversazione specifici del provider vengono mappati alle chat di base, agli id thread e ai fallback padre
- **Outbound** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono organizzate le risposte in thread
- **Heartbeat typing** — segnali opzionali di digitazione/occupato per i target di consegna heartbeat

Il core gestisce lo strumento message condiviso, il wiring del prompt, la forma
esterna della chiave di sessione, la gestione generica `:thread:` e il dispatch.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` nel plugin di canale. Il core lo richiama con il
target di consegna heartbeat risolto prima che inizi l'esecuzione del modello heartbeat e
usa il ciclo di vita condiviso di keepalive/cleanup della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale esplicito di arresto.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti multimediali, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e per i criteri di accesso ai media in uscita,
così i plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider
come avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` in modo che azioni non correlate non
ereditino gli argomenti media di un'altra azione. Un array piatto continua a funzionare per parametri
che sono intenzionalmente condivisi tra tutte le azioni esposte.

Se la tua piattaforma memorizza ambito aggiuntivo negli id di conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico
per mappare `rawId` all'id di conversazione di base, all'eventuale id thread,
a `baseConversationId` esplicito e a qualsiasi `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
padre più specifico a quello più ampio/conversazione di base.

I plugin bundled che hanno bisogno dello stesso parsing prima che il registro dei canali venga avviato
possono anche esporre un file `session-key-api.ts` di primo livello con una
esportazione `resolveSessionConversation(...)` corrispondente. Il core usa questa superficie
sicura per il bootstrap solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` rimane disponibile come
fallback di compatibilità legacy quando un plugin ha bisogno solo di fallback padre
in aggiunta all'id generico/raw. Se entrambi gli hook esistono, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload dei pulsanti di approvazione condivisi e la consegna di fallback generica.
- Preferisci un unico oggetto `approvalCapability` nel plugin di canale quando il canale necessita di comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è rimosso. Inserisci i fatti di consegna/rendering/auth delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più da quell'oggetto gli hook auth delle approvazioni.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth di approvazione nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie iniziale/client nativo quando differisce dall'auth di approvazione nella stessa chat. Il core usa questo hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale iniziale supporta approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita del payload specifici del canale, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing nativo delle approvazioni o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti di approvazione nativa gestiti dal canale. Mantienilo lazy negli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime on demand pur permettendo al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati devono renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di primo livello.
- Se un canale può dedurre identità DM stabili simili a proprietari dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale ha bisogno della consegna nativa delle approvazioni, mantieni il codice del canale focalizzato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Inserisci i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire filtro delle richieste, routing, deduplica, scadenza, sottoscrizione Gateway e avvisi di instradamento altrove. `nativeRuntime` è suddiviso in alcune seam più piccole:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model di approvazione condiviso in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara i target più l'invio/aggiornamento/eliminazione dei messaggi di approvazione nativi
- `interactions` — hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook opzionali per la diagnostica di consegna
- Se il canale ha bisogno di oggetti gestiti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico runtime-context permette al core di avviare handler guidati dalle capacità a partire dallo stato di avvio del canale senza aggiungere codice wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello più basso solo quando la seam guidata dalle capacità non è ancora abbastanza espressiva.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso quegli helper. `accountId` mantiene l'ambito dei criteri di approvazione multi-account sul corretto account bot, e `approvalKind` mantiene disponibile per il canale il comportamento exec rispetto a quello di approvazione plugin senza rami hardcoded nel core.
- Il core ora gestisce anche gli avvisi di reinstradamento delle approvazioni. I plugin di canale non devono inviare i propri messaggi di follow-up "l'approvazione è andata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato tra origine e DM dell'approvatore tramite gli helper condivisi di capability di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare un eventuale avviso nella chat iniziale.
- Mantieni il tipo di id di approvazione consegnato end-to-end. I client nativi non devono
  dedurre o riscrivere il routing dell'approvazione exec rispetto a plugin in base allo stato locale del canale.
- Diversi tipi di approvazione possono esporre intenzionalmente superfici native differenti.
  Esempi bundled attuali:
  - Slack mantiene disponibile il routing di approvazione nativa sia per gli id exec sia per quelli plugin.
  - Matrix mantiene lo stesso routing DM/canale nativo e la stessa UX a reazioni per le approvazioni exec
    e plugin, pur consentendo comunque che l'auth differisca in base al tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice deve preferire il builder di capability ed esporre `approvalCapability` nel plugin.

Per gli entrypoint caldi del canale, preferisci i sottopercorsi runtime più ristretti quando ti serve solo
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
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie umbrella
più ampia.

Per la setup in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  adattatori di patch setup sicuri all'import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder del
  proxy di setup delegato
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam adattatore stretta consapevole dell'env
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder setup a installazione opzionale
  più alcune primitive sicure per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati da env e i flussi generici di avvio/config
devono conoscere quei nomi env prima che il runtime venga caricato, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o costanti locali
solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o
nelle scansioni SecretRef prima che il runtime del plugin si avvii, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint deve essere sicuro da importare in percorsi di comando in sola lettura
e deve restituire i metadati del canale, l'adattatore config sicuro per il setup, l'adattatore di stato
e i metadati del target secret del canale necessari per quei riepiloghi. Non avviare
client, listener o runtime di trasporto dall'entry di setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando hai bisogno anche degli
  helper condivisi più pesanti di setup/config come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle
superfici di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/procedura guidata generati
falliscono in modo chiuso sulle scritture di configurazione e sulla finalizzazione, e riusano
lo stesso messaggio di installazione richiesta in validazione, finalize e testo con link alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle
superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per il wiring di route/envelope in ingresso e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per il caricamento dei media più le
  delegate di identità/invio in uscita e la pianificazione del payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione corrente `:thread:`
  dopo che la chiave di sessione di base continua comunque a corrispondere. I plugin provider possono sovrascrivere
  precedenza, comportamento del suffisso e normalizzazione dell'id thread quando la loro piattaforma
  ha semantiche native di consegna nei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei thread-binding
  e la registrazione degli adattatori
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy
  dei campi del payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati di Telegram,
  la validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile nel fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone soltanto capacità outbound/auth. I canali con approvazioni native come Matrix, Slack, Telegram e i trasporti chat personalizzati devono usare gli helper nativi condivisi invece di implementare da soli il ciclo di vita delle approvazioni.

## Criteri delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal plugin
- valutazione dei criteri condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sui criteri delle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando hai bisogno del barrel helper
più ampio per l'inbound.

Adatto alla logica locale del plugin:

- rilevamento della risposta al bot
- rilevamento della citazione del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzioni implicite
- bypass dei comandi
- decisione finale di skip

Flusso consigliato:

1. Calcola i fatti locali sulle menzioni.
2. Passa questi fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate inbound.

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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per
i plugin di canale bundled che già dipendono dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
inbound non correlati.

I vecchi helper `resolveMentionGating*` restano in
`openclaw/plugin-sdk/channel-inbound` solo come esportazioni di compatibilità. Il nuovo codice
deve usare `resolveInboundMentionDecision({ facts, policy })`.

## Guida passo passo

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un plugin di canale. Per la superficie completa dei metadati del pacchetto,
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

  <Step title="Crea l'oggetto plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adattatore opzionali. Inizia con
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

    <Accordion title="Cosa fa per te createChatChannelPlugin">
      Invece di implementare manualmente interfacce adattatore di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Option | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con ambito dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adattatore grezzi invece delle opzioni dichiarative
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

    Inserisci i descrittori CLI gestiti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continuano a rilevare gli stessi descrittori per la vera registrazione
    dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC Gateway, usa un
    prefisso specifico del plugin. I namespace amministrativi del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la divisione delle modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi un'entry di setup">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questa entry invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di caricare codice runtime pesante durante i flussi di setup.
    Vedi [Setup and Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace bundled che separano le esportazioni sicure per il setup in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito al tempo di setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la invia tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gestita dal plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound inoltra il messaggio a OpenClaw.
          // Il wiring esatto dipende dal tuo SDK di piattaforma —
          // vedi un esempio reale nel pacchetto plugin bundled di Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni plugin di canale gestisce
      la propria pipeline inbound. Guarda i plugin di canale bundled
      (per esempio il pacchetto plugin di Microsoft Teams o Google Chat) per pattern reali.
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
├── runtime-api.ts            # Esportazioni runtime interne (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Store runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e discovery delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam helper bundled esistono ancora per la manutenzione dei plugin bundled e
la compatibilità. Non sono il pattern consigliato per i nuovi plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie SDK
comune a meno che tu non stia mantenendo direttamente quella famiglia di plugin bundled.
</Note>

## Passi successivi

- [Provider Plugins](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo per gli import subpath
- [SDK Testing](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Plugin Manifest](/it/plugins/manifest) — schema completo del manifest
