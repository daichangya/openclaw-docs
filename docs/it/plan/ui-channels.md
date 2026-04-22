---
read_when:
    - Refactoring della UI dei messaggi del canale, dei payload interattivi o dei renderer nativi del canale
    - Modifica delle funzionalità dello strumento di messaggistica, dei suggerimenti di consegna o dei marker cross-context
    - Debug del fanout di import Carbon di Discord o della lazy initialization del runtime del Plugin di canale
summary: Disaccoppiare la presentazione semantica dei messaggi dai renderer UI nativi del canale.
title: Piano di refactoring della presentazione dei canali
x-i18n:
    generated_at: "2026-04-22T04:24:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed3c49f3cc55151992315599a05451fe499f2983d53d69dc58784e846f9f32ad
    source_path: plan/ui-channels.md
    workflow: 15
---

# Piano di refactoring della presentazione dei canali

## Stato

Implementato per l'agente condiviso, la CLI, la funzionalità del Plugin e le superfici di consegna in uscita:

- `ReplyPayload.presentation` trasporta la UI semantica del messaggio.
- `ReplyPayload.delivery.pin` trasporta le richieste di pin dei messaggi inviati.
- Le azioni condivise dei messaggi espongono `presentation`, `delivery` e `pin` invece dei campi nativi del provider `components`, `blocks`, `buttons` o `card`.
- Il core esegue il rendering o il degrado automatico della presentazione tramite le funzionalità in uscita dichiarate dal Plugin.
- I renderer di Discord, Slack, Telegram, Mattermost, Microsoft Teams e Feishu usano il contratto generico.
- Il codice del control plane del canale Discord non importa più contenitori UI supportati da Carbon.

La documentazione canonica ora si trova in [Message Presentation](/it/plugins/message-presentation).
Mantieni questo piano come contesto storico di implementazione; aggiorna la guida canonica
per modifiche al contratto, al renderer o al comportamento di fallback.

## Problema

La UI del canale è attualmente suddivisa in diverse superfici incompatibili:

- Il core possiede un hook di renderer cross-context con forma Discord tramite `buildCrossContextComponents`.
- `channel.ts` di Discord può importare UI nativa Carbon tramite `DiscordUiContainer`, che trascina dipendenze UI runtime nel control plane del Plugin di canale.
- L'agente e la CLI espongono vie di fuga verso payload nativi come `components` di Discord, `blocks` di Slack, `buttons` di Telegram o Mattermost e `card` di Teams o Feishu.
- `ReplyPayload.channelData` trasporta sia suggerimenti di trasporto sia buste UI native.
- Il modello generico `interactive` esiste, ma è più ristretto dei layout più ricchi già usati da Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Questo rende il core consapevole delle forme UI native, indebolisce la lazy initialization del runtime del Plugin e offre agli agenti troppi modi specifici del provider per esprimere lo stesso intento del messaggio.

## Obiettivi

- Il core decide la migliore presentazione semantica per un messaggio a partire dalle funzionalità dichiarate.
- Le estensioni dichiarano le funzionalità e convertono la presentazione semantica in payload di trasporto nativi.
- La Control UI web rimane separata dalla UI nativa della chat.
- I payload nativi dei canali non vengono esposti attraverso la superficie condivisa dei messaggi dell'agente o della CLI.
- Le funzionalità di presentazione non supportate degradano automaticamente nella migliore rappresentazione testuale.
- Il comportamento di consegna, come il pin di un messaggio inviato, è metadato di consegna generico, non presentazione.

## Non obiettivi

- Nessun shim di retrocompatibilità per `buildCrossContextComponents`.
- Nessuna via di fuga pubblica nativa per `components`, `blocks`, `buttons` o `card`.
- Nessun import nel core di librerie UI native del canale.
- Nessuna seam SDK specifica del provider per i canali inclusi.

## Modello di destinazione

Aggiungi un campo `presentation` posseduto dal core a `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};
```

`interactive` diventa un sottoinsieme di `presentation` durante la migrazione:

- Il blocco di testo `interactive` viene mappato a `presentation.blocks[].type = "text"`.
- Il blocco di pulsanti `interactive` viene mappato a `presentation.blocks[].type = "buttons"`.
- Il blocco select `interactive` viene mappato a `presentation.blocks[].type = "select"`.

Gli schemi esterni dell'agente e della CLI ora usano `presentation`; `interactive` rimane un helper legacy interno di parser/rendering per i producer di risposte esistenti.

## Metadati di consegna

Aggiungi un campo `delivery` posseduto dal core per il comportamento di invio che non è UI.

```ts
type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantica:

- `delivery.pin = true` significa fare il pin del primo messaggio consegnato con successo.
- `notify` è `false` per impostazione predefinita.
- `required` è `false` per impostazione predefinita; i canali non supportati o gli errori di pin degradano automaticamente continuando la consegna.
- Le azioni manuali dei messaggi `pin`, `unpin` e `list-pins` restano per i messaggi esistenti.

L'attuale binding del topic ACP di Telegram dovrebbe passare da `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contratto di funzionalità runtime

Aggiungi hook di rendering della presentazione e di consegna al runtime outbound adapter, non al Plugin di canale del control plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportamento del core:

- Risolvere il canale di destinazione e il runtime adapter.
- Richiedere le funzionalità di presentazione.
- Degradare i blocchi non supportati prima del rendering.
- Chiamare `renderPresentation`.
- Se non esiste alcun renderer, convertire la presentazione in fallback testuale.
- Dopo un invio riuscito, chiamare `pinDeliveredMessage` quando `delivery.pin` è richiesto e supportato.

## Mappatura dei canali

Discord:

- Eseguire il rendering di `presentation` in components v2 e contenitori Carbon in moduli solo runtime.
- Mantenere gli helper dei colori accent in moduli leggeri.
- Rimuovere gli import di `DiscordUiContainer` dal codice del control plane del Plugin di canale.

Slack:

- Eseguire il rendering di `presentation` in Block Kit.
- Rimuovere l'input `blocks` da agente e CLI.

Telegram:

- Eseguire il rendering di testo, context e divider come testo.
- Eseguire il rendering di azioni e select come tastiere inline quando configurate e consentite per la superficie di destinazione.
- Usare il fallback testuale quando i pulsanti inline sono disabilitati.
- Spostare il pin del topic ACP in `delivery.pin`.

Mattermost:

- Eseguire il rendering delle azioni come pulsanti interattivi quando configurato.
- Eseguire il rendering degli altri blocchi come fallback testuale.

Microsoft Teams:

- Eseguire il rendering di `presentation` in Adaptive Cards.
- Mantenere le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementare facoltativamente `pinDeliveredMessage` se il supporto Graph è affidabile per la conversazione di destinazione.

Feishu:

- Eseguire il rendering di `presentation` in schede interattive.
- Mantenere le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementare facoltativamente `pinDeliveredMessage` per il pin dei messaggi inviati se il comportamento API è affidabile.

LINE:

- Eseguire il rendering di `presentation` in messaggi Flex o template dove possibile.
- Tornare al testo per i blocchi non supportati.
- Rimuovere i payload UI di LINE da `channelData`.

Canali semplici o limitati:

- Convertire la presentazione in testo con formattazione conservativa.

## Passi del refactoring

1. Riapplicare la correzione della release Discord che separa `ui-colors.ts` dalla UI supportata da Carbon e rimuove `DiscordUiContainer` da `extensions/discord/src/channel.ts`.
2. Aggiungere `presentation` e `delivery` a `ReplyPayload`, alla normalizzazione del payload in uscita, ai riepiloghi di consegna e ai payload degli hook.
3. Aggiungere schema `MessagePresentation` e helper parser in un sottopercorso SDK/runtime ristretto.
4. Sostituire le funzionalità del messaggio `buttons`, `cards`, `components` e `blocks` con funzionalità di presentazione semantica.
5. Aggiungere hook del runtime outbound adapter per il rendering della presentazione e il pin di consegna.
6. Sostituire la costruzione di componenti cross-context con `buildCrossContextPresentation`.
7. Eliminare `src/infra/outbound/channel-adapters.ts` e rimuovere `buildCrossContextComponents` dai tipi del Plugin di canale.
8. Cambiare `maybeApplyCrossContextMarker` in modo che alleghi `presentation` invece di parametri nativi.
9. Aggiornare i percorsi di invio plugin-dispatch in modo che consumino solo presentazione semantica e metadati di consegna.
10. Rimuovere i parametri di payload nativi da agente e CLI: `components`, `blocks`, `buttons` e `card`.
11. Rimuovere gli helper SDK che creano schemi nativi dello strumento messaggio, sostituendoli con helper di schema della presentazione.
12. Rimuovere le buste UI/native da `channelData`; mantenere solo i metadati di trasporto finché ogni campo rimanente non viene riesaminato.
13. Migrare i renderer di Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu e LINE.
14. Aggiornare la documentazione per la CLI dei messaggi, le pagine dei canali, il Plugin SDK e il cookbook delle funzionalità.
15. Eseguire la profilazione del fanout degli import per Discord e gli entrypoint dei canali interessati.

I passi 1-11 e 13-14 sono implementati in questo refactoring per l'agente condiviso, la CLI, le funzionalità del Plugin e i contratti del outbound adapter. Il passo 12 resta una pulizia interna più profonda per le buste di trasporto `channelData` private del provider. Il passo 15 resta una validazione successiva se vogliamo numeri quantificati del fanout degli import oltre al gate di tipi/test.

## Test

Aggiungere o aggiornare:

- Test di normalizzazione della presentazione.
- Test di degrado automatico della presentazione per blocchi non supportati.
- Test dei marker cross-context per i percorsi plugin-dispatch e core delivery.
- Test della matrice di rendering dei canali per Discord, Slack, Telegram, Mattermost, Microsoft Teams, Feishu, LINE e fallback testuale.
- Test dello schema dello strumento messaggio che dimostrano che i campi nativi sono stati rimossi.
- Test CLI che dimostrano che i flag nativi sono stati rimossi.
- Regressione della lazy initialization degli import dell'entrypoint Discord che copre Carbon.
- Test di pin della consegna per Telegram e fallback generico.

## Questioni aperte

- `delivery.pin` dovrebbe essere implementato per Discord, Slack, Microsoft Teams e Feishu al primo passaggio, oppure prima solo per Telegram?
- `delivery` dovrebbe in futuro assorbire campi esistenti come `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, oppure restare focalizzato sui comportamenti post-invio?
- Il supporto della presentazione dovrebbe includere direttamente immagini o riferimenti a file, oppure per ora i contenuti multimediali dovrebbero restare separati dal layout UI?
