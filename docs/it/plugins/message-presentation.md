---
read_when:
    - Aggiunta o modifica del rendering di schede messaggio, pulsanti o selettori
    - Creazione di un plugin di canale che supporta messaggi ricchi in uscita
    - Modifica della presentazione dei messaggi dello strumento o delle capacità di consegna
    - Debug di regressioni di rendering specifiche del provider per schede/blocchi/componenti
summary: Schede messaggio semantiche, pulsanti, selettori, testo di fallback e suggerimenti di consegna per i plugin di canale
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-04-22T04:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6913b2b4331598a1396d19a572fba1fffde6cb9a6efa2192f30fe12404eb48d
    source_path: plugins/message-presentation.md
    workflow: 15
---

# Presentazione dei messaggi

La presentazione dei messaggi è il contratto condiviso di OpenClaw per UI chat ricche in uscita.
Consente ad agenti, comandi CLI, flussi di approvazione e plugin di descrivere
una sola volta l'intento del messaggio, mentre ogni plugin di canale rende la migliore forma nativa possibile.

Usa la presentazione per una UI dei messaggi portabile:

- sezioni di testo
- piccolo testo di contesto/footer
- divisori
- pulsanti
- menu di selezione
- titolo e tono della scheda

Non aggiungere nuovi campi nativi specifici del provider come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card` allo strumento
messaggi condiviso. Questi sono output di rendering posseduti dal plugin di canale.

## Contratto

Gli autori di plugin importano il contratto pubblico da:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forma:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
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

Semantica dei pulsanti:

- `value` è un valore di azione applicativa instradato di nuovo attraverso il
  percorso di interazione esistente del canale quando il canale supporta controlli cliccabili.
- `url` è un pulsante link. Può esistere senza `value`.
- `label` è obbligatorio ed è usato anche nel fallback testuale.
- `style` è indicativo. I renderer dovrebbero mappare gli stili non supportati a un
  valore predefinito sicuro, non far fallire l'invio.

Semantica dei selettori:

- `options[].value` è il valore applicativo selezionato.
- `placeholder` è indicativo e può essere ignorato dai canali senza supporto nativo
  per i selettori.
- Se un canale non supporta i selettori, il testo di fallback elenca le etichette.

## Esempi di producer

Scheda semplice:

```json
{
  "title": "Approvazione deploy",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary è pronto per la promozione." },
    { "type": "context", "text": "Build 1234, staging superato." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approva", "value": "deploy:approve", "style": "success" },
        { "label": "Rifiuta", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Pulsante link solo URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Le note di rilascio sono pronte." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Apri note", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu di selezione:

```json
{
  "title": "Scegli l'ambiente",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Ambiente",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Produzione", "value": "env:prod" }
      ]
    }
  ]
}
```

Invio CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Approvazione deploy" \
  --presentation '{"title":"Approvazione deploy","tone":"warning","blocks":[{"type":"text","text":"Canary è pronto."},{"type":"buttons","buttons":[{"label":"Approva","value":"deploy:approve","style":"success"},{"label":"Rifiuta","value":"deploy:decline","style":"danger"}]}]}'
```

Consegna con pin:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Argomento aperto" \
  --pin
```

Consegna con pin tramite JSON esplicito:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contratto del renderer

I plugin di canale dichiarano il supporto del rendering sul proprio adapter in uscita:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

I campi capability sono intenzionalmente semplici booleani. Descrivono ciò che il
renderer può rendere interattivo, non ogni limite nativo della piattaforma. I renderer possiedono comunque
i limiti specifici della piattaforma come numero massimo di pulsanti, numero di blocchi e
dimensione della scheda.

## Flusso di rendering del core

Quando un `ReplyPayload` o un'azione messaggio include `presentation`, il core:

1. Normalizza il payload di presentazione.
2. Risolve l'adapter in uscita del canale target.
3. Legge `presentationCapabilities`.
4. Chiama `renderPresentation` quando l'adapter può rendere il payload.
5. Ricade su testo conservativo quando l'adapter è assente o non può eseguire il rendering.
6. Invia il payload risultante tramite il normale percorso di consegna del canale.
7. Applica i metadati di consegna come `delivery.pin` dopo il primo messaggio
   inviato con successo.

Il core possiede il comportamento di fallback così i producer possono restare indipendenti dal canale. I
plugin di canale possiedono il rendering nativo e la gestione delle interazioni.

## Regole di degradazione

La presentazione deve essere sicura da inviare su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come normali paragrafi
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi URL per i pulsanti link
- etichette delle opzioni del selettore

I controlli nativi non supportati dovrebbero degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia fallback testuale.
- Un canale senza supporto per i selettori elenca le opzioni del selettore come testo.
- Un pulsante solo URL diventa un pulsante link nativo oppure una riga URL di fallback.
- I fallimenti opzionali del pin non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il pin è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna riporta un errore.

## Mappatura provider

Renderer inclusi attuali:

| Canale          | Target di rendering nativo          | Note                                                                                                                                               |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components e container di componenti | Preserva il legacy `channelData.discord.components` per i producer di payload nativi specifici del provider esistenti, ma i nuovi invii condivisi dovrebbero usare `presentation`. |
| Slack           | Block Kit                           | Preserva il legacy `channelData.slack.blocks` per i producer di payload nativi specifici del provider esistenti, ma i nuovi invii condivisi dovrebbero usare `presentation`. |
| Telegram        | Testo più tastiere inline           | Pulsanti/selettori richiedono la capacità di pulsanti inline per la superficie target; altrimenti viene usato il fallback testuale.               |
| Mattermost      | Testo più props interattive         | Gli altri blocchi degradano a testo.                                                                                                               |
| Microsoft Teams | Adaptive Cards                      | Il testo semplice `message` viene incluso con la scheda quando sono forniti entrambi.                                                             |
| Feishu          | Schede interattive                  | L'header della scheda può usare `title`; il body evita di duplicare quel titolo.                                                                  |
| Canali semplici | Fallback testuale                   | I canali senza renderer ricevono comunque output leggibile.                                                                                        |

La compatibilità con payload nativi specifici del provider è una facilitazione di transizione per i
producer di risposte esistenti. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentation vs InteractiveReply

`InteractiveReply` è il vecchio sottoinsieme interno usato dagli helper di approvazione e interazione.
Supporta:

- testo
- pulsanti
- selettori

`MessagePresentation` è il contratto canonico condiviso di invio. Aggiunge:

- titolo
- tono
- contesto
- divisore
- pulsanti solo URL
- metadati generici di consegna tramite `ReplyPayload.delivery`

Usa gli helper da `openclaw/plugin-sdk/interactive-runtime` quando colleghi codice meno recente:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Il nuovo codice dovrebbe accettare o produrre direttamente `MessagePresentation`.

## Delivery Pin

Il pin è comportamento di consegna, non presentazione. Usa `delivery.pin` invece di
campi nativi specifici del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio consegnato con successo.
- `pin.notify` è `false` per impostazione predefinita.
- `pin.required` è `false` per impostazione predefinita.
- I fallimenti opzionali del pin degradano e lasciano intatto il messaggio inviato.
- I fallimenti obbligatori del pin fanno fallire la consegna.
- I messaggi suddivisi in chunk fissano il primo chunk consegnato, non quello finale.

Le azioni messaggio manuali `pin`, `unpin` e `pins` esistono ancora per i messaggi
esistenti nei casi in cui il provider supporti tali operazioni.

## Checklist per autori di plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può
  rendere o degradare in modo sicuro la presentazione semantica.
- Aggiungi `presentationCapabilities` all'adapter runtime in uscita.
- Implementa `renderPresentation` nel codice runtime, non nel codice di
  configurazione del plugin del control plane.
- Tieni le librerie UI native fuori dai percorsi caldi di setup/catalogo.
- Preserva i limiti della piattaforma nel renderer e nei test.
- Aggiungi test di fallback per pulsanti non supportati, selettori, pulsanti URL, duplicazione
  titolo/testo e invii misti `message` più `presentation`.
- Aggiungi supporto al delivery pin tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'ID del messaggio inviato.
- Non esporre nuovi campi nativi specifici del provider per schede/blocchi/componenti/pulsanti tramite
  lo schema condiviso dell'azione messaggio.

## Documentazione correlata

- [CLI messaggi](/cli/message)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Architettura Plugin](/it/plugins/architecture#message-tool-schemas)
- [Piano di refactoring della presentazione dei canali](/it/plan/ui-channels)
