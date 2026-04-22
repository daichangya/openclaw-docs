---
read_when:
    - Stai creando un nuovo Plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Hai bisogno di comprendere la superficie dell'adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un Plugin di canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-04-22T04:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f08bf785cd2e16ed6ce0317f4fd55c9eccecf7476d84148ad47e7be516dd71fb
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di Plugin di canale

Questa guida illustra come creare un Plugin di canale che colleghi OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno di propri strumenti send/edit/react. OpenClaw mantiene un unico
strumento `message` condiviso nel core. Il tuo Plugin possiede:

- **Configurazione** — risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** — criterio DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Grammatica della sessione** — come gli ID di conversazione specifici del provider vengono mappati a chat base, ID thread e fallback parent
- **In uscita** — invio di testo, contenuti multimediali e sondaggi alla piattaforma
- **Threading** — come vengono strutturate le risposte in thread

Il core possiede lo strumento di messaggio condiviso, il wiring dei prompt, la forma esterna della chiave di sessione,
la gestione generica `:thread:` e il dispatch.

Se il tuo canale aggiunge parametri allo strumento di messaggio che trasportano sorgenti multimediali, esponi questi
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e la policy di accesso ai contenuti multimediali in uscita,
così i Plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider come
avatar, allegato o immagine di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così azioni non correlate non
ereditano gli argomenti multimediali di un'altra azione. Un array piatto continua a funzionare per
parametri che sono intenzionalmente condivisi tra tutte le azioni esposte.

Se la tua piattaforma memorizza scope extra all'interno degli ID di conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico
per mappare `rawId` all'ID di conversazione base, all'ID thread facoltativo,
a `baseConversationId` esplicito e a qualsiasi `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più ristretto alla conversazione più ampia/base.

I Plugin inclusi che hanno bisogno dello stesso parsing prima che il registro dei canali si avvii
possono anche esporre un file `session-key-api.ts` di livello superiore con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro runtime del Plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback legacy di compatibilità quando un Plugin ha bisogno solo di fallback parent sopra l'ID generico/raw. Se esistono entrambi gli hook, il core usa prima `resolveSessionConversation(...).parentConversationCandidates` e ricorre a `resolveParentConversationCandidates(...)` solo quando l'hook canonico li omette.

## Approvazioni e funzionalità del canale

La maggior parte dei Plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core possiede `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna generica di fallback.
- Preferisci un unico oggetto `approvalCapability` sul Plugin di canale quando il canale ha bisogno di comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci i fatti di consegna/rendering/autenticazione delle approvazioni su `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più hook di autenticazione delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l'autenticazione delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'autenticazione delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'autenticazione di approvazione nella stessa chat. Il core usa questo hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale iniziale supporta approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` compila questo punto per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` oppure `outbound.beforeDeliverPayload` per comportamenti specifici del canale nel ciclo di vita del payload, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per instradamento di approvazione nativa o soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti di approvazione nativa posseduti dal canale. Mantienilo lazy sugli entrypoint hot del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime su richiesta lasciando comunque al core l'assemblaggio del ciclo di vita delle approvazioni.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi esattamente quali manopole di configurazione servono per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account denominato dovrebbero renderizzare percorsi con scope per account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei valori predefiniti di livello superiore.
- Se un canale può dedurre identità DM stabili simili a owner dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica specifica per le approvazioni nel core.
- Se un canale ha bisogno di consegna nativa delle approvazioni, mantieni il codice del canale concentrato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e possedere filtro delle richieste, instradamento, dedupe, scadenza, sottoscrizione Gateway e avvisi routed-elsewhere. `nativeRuntime` è suddiviso in alcune seam più piccole:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappare il view model condiviso dell'approvazione in payload nativi pending/resolved/expired o azioni finali
- `transport` — preparare i target più inviare/aggiornare/eliminare messaggi di approvazione nativi
- `interactions` — hook facoltativi bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook facoltativi per la diagnostica della consegna
- Se il canale ha bisogno di oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico runtime-context permette al core di avviare handler guidati dalle funzionalità dallo stato di avvio del canale senza aggiungere glue wrapper specifici per le approvazioni.
- Ricorri ai livelli più bassi `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo quando la seam guidata dalle funzionalità non è ancora abbastanza espressiva.
- I canali di approvazione nativi devono instradare sia `accountId` sia `approvalKind` tramite questi helper. `accountId` mantiene la policy di approvazione multi-account confinata al giusto account bot, e `approvalKind` mantiene disponibile al canale il comportamento exec vs approvazione del Plugin senza branch hardcoded nel core.
- Ora anche gli avvisi di rerouting delle approvazioni appartengono al core. I Plugin di canale non dovrebbero inviare i propri messaggi di follow-up del tipo "l'approvazione è andata nei DM / in un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un instradamento accurato origin + approver-DM tramite gli helper condivisi delle funzionalità di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare qualsiasi avviso nella chat che ha avviato la richiesta.
- Mantieni il tipo di ID dell'approvazione consegnata end-to-end. I client nativi non dovrebbero
  dedurre o riscrivere l'instradamento di approvazione exec vs Plugin dallo stato locale del canale.
- Diversi tipi di approvazione possono intenzionalmente esporre diverse superfici native.
  Esempi inclusi attuali:
  - Slack mantiene disponibile l'instradamento nativo delle approvazioni sia per gli ID exec sia per quelli del Plugin.
  - Matrix mantiene lo stesso instradamento nativo DM/canale e la stessa UX a reazioni per le approvazioni exec
    e del Plugin, pur lasciando che l'autenticazione differisca per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il costruttore di funzionalità ed esporre `approvalCapability` sul Plugin.

Per gli entrypoint hot del canale, preferisci i sottopercorsi runtime più stretti quando ti
serve solo una parte di quella famiglia:

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
  adapter di patch di configurazione import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i costruttori
  delegati di setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam stretta dell'adapter
  sensibile all'env per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i costruttori di configurazione
  per installazione facoltativa più alcuni primitivi sicuri per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o autenticazione guidata da env e i
flussi generici di avvio/configurazione devono conoscere quei nomi env prima del caricamento del runtime,
dichiarali nel manifest del Plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale
o costanti locali solo per il testo rivolto agli operatori.

Se il tuo canale può apparire in `status`, `channels list`, `channels status` o
nelle scansioni SecretRef prima che il runtime del Plugin si avvii, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint dovrebbe essere sicuro da importare in percorsi di comando in sola lettura
e dovrebbe restituire i metadati del canale, l'adapter di configurazione sicuro per setup, l'adapter di stato
e i metadati del target segreto del canale necessari per quei riepiloghi. Non avviare client, listener o runtime di trasporto dall'entry di setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi più pesanti di setup/configurazione come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo Plugin" nelle
superfici di configurazione, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/procedura guidata generata fallisce in modalità chiusa sulle scritture di configurazione e sulla finalizzazione, e riusa lo
stesso messaggio di installazione richiesta tra validazione, finalize e testo del link alla documentazione.

Per altri percorsi hot del canale, preferisci gli helper stretti rispetto alle più ampie superfici legacy:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per il wiring di route/envelope inbound e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento dei contenuti multimediali più delegate di
  identità/invio outbound e pianificazione del payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route outbound deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:` corrente
  dopo che la chiave di sessione base continua a corrispondere. I Plugin provider possono sostituire
  precedenza, comportamento del suffisso e normalizzazione dell'ID thread quando la loro piattaforma
  ha semantica nativa di consegna in thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei thread-binding
  e la registrazione degli adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy del
  campo payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati Telegram,
  validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile nel fallback

I canali solo-auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone solo le funzionalità outbound/auth. I canali con approvazione nativa come Matrix, Slack, Telegram e i trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il proprio ciclo di vita delle approvazioni.

## Criterio di menzione inbound

Mantieni la gestione delle menzioni inbound divisa in due livelli:

- raccolta delle evidenze posseduta dal Plugin
- valutazione condivisa del criterio

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sul criterio di menzione.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel helper inbound
più ampio.

Adatto alla logica locale del Plugin:

- rilevamento di reply-to-bot
- rilevamento di quoted-bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzione implicita
- bypass dei comandi
- decisione finale di skip

Flusso preferito:

1. Calcolare i fatti locali della menzione.
2. Passare questi fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usare `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate inbound.

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
i Plugin di canale inclusi che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
inbound non correlati.

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un Plugin di canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Configurazione e setup del Plugin](/it/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Collega OpenClaw ad Acme Chat."
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
      "description": "Plugin di canale Acme Chat",
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
    L'interfaccia `ChannelPlugin` ha molte superfici adapter opzionali. Inizia con
    il minimo — `id` e `setup` — e aggiungi adapter secondo necessità.

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
      Invece di implementare manualmente interfacce adapter di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con scope dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con scope per account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adapter raw invece delle opzioni dichiarative
      se hai bisogno di pieno controllo.
    </Accordion>

  </Step>

  <Step title="Collega l'entrypoint">
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
    mentre i normali caricamenti completi continuano a raccogliere gli stessi descrittori per la registrazione reale dei comandi.
    Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un
    prefisso specifico del Plugin. I namespace admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre
    risolti in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione delle modalità di registrazione. Vedi
    [Entrypoint](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi un'entry di setup">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di trascinare codice runtime pesante durante i flussi di setup.
    Vedi [Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace inclusi che dividono gli export sicuri per il setup in moduli
    laterali possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno anche bisogno di un
    setter runtime esplicito per il tempo di setup.

  </Step>

  <Step title="Gestisci i messaggi inbound">
    Il tuo Plugin deve ricevere i messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un webhook che verifica la richiesta e la
    inoltra tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticazione gestita dal plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound inoltra il messaggio a OpenClaw.
          // Il wiring esatto dipende dal tuo SDK della piattaforma —
          // vedi un esempio reale nel pacchetto Plugin incluso Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi inbound è specifica del canale. Ogni Plugin di canale possiede
      la propria pipeline inbound. Guarda i Plugin di canale inclusi
      (ad esempio il pacchetto Plugin Microsoft Teams o Google Chat) per pattern reali.
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
├── api.ts                    # Export pubblici (facoltativo)
├── runtime-api.ts            # Export runtime interni (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Store runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità reply fisse, con scope per account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e rilevamento delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, contenuti multimediali, sottoagente tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam helper incluse esistono ancora per la manutenzione e la
compatibilità dei Plugin inclusi. Non sono il pattern consigliato per i nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie
SDK comune, a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Passi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) — se il tuo Plugin fornisce anche modelli
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo degli import dei sottopercorsi
- [SDK Testing](/it/plugins/sdk-testing) — utilità di test e test di contratto
- [Manifest del Plugin](/it/plugins/manifest) — schema completo del manifest
