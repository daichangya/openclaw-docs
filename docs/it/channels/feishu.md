---
read_when:
    - Vuoi connettere un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b9cebcedf05a517b03a15ae306cece1a3c07f772c48c54b7ece05ef892d05d2
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark è una piattaforma di collaborazione all-in-one in cui i team chattano, condividono documenti, gestiscono calendari e lavorano insieme.

**Stato:** pronta per la produzione per DM del bot e chat di gruppo. WebSocket è la modalità predefinita; la modalità webhook è opzionale.

---

## Avvio rapido

> **Richiede OpenClaw 2026.4.25 o versione successiva.** Esegui `openclaw --version` per verificare. Aggiorna con `openclaw update`.

<Steps>
  <Step title="Esegui la procedura guidata di configurazione del canale">
  ```bash
  openclaw channels login --channel feishu
  ```
  Scansiona il codice QR con la tua app mobile Feishu/Lark per creare automaticamente un bot Feishu/Lark.
  </Step>
  
  <Step title="Dopo il completamento della configurazione, riavvia il gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controllo degli accessi

### Messaggi diretti

Configura `dmPolicy` per controllare chi può inviare DM al bot:

- `"pairing"` — gli utenti sconosciuti ricevono un codice di pairing; approva tramite CLI
- `"allowlist"` — solo gli utenti elencati in `allowFrom` possono chattare (predefinito: solo il proprietario del bot)
- `"open"` — consenti tutti gli utenti
- `"disabled"` — disabilita tutti i DM

**Approva una richiesta di pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Policy di gruppo** (`channels.feishu.groupPolicy`):

| Valore        | Comportamento                              |
| ------------- | ------------------------------------------ |
| `"open"`      | Risponde a tutti i messaggi nei gruppi     |
| `"allowlist"` | Risponde solo ai gruppi in `groupAllowFrom` |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo      |

Predefinito: `allowlist`

**Requisito di menzione** (`channels.feishu.requireMention`):

- `true` — richiede @mention (predefinito)
- `false` — risponde senza @mention
- Override per gruppo: `channels.feishu.groups.<chat_id>.requireMention`

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, senza @mention obbligatoria

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Consenti tutti i gruppi, ma richiedi comunque @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Consenti solo gruppi specifici

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Gli ID gruppo hanno questo aspetto: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Limita i mittenti all'interno di un gruppo

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Gli open_id utente hanno questo aspetto: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Ottieni gli ID di gruppo/utente

### ID gruppo (`chat_id`, formato: `oc_xxx`)

Apri il gruppo in Feishu/Lark, fai clic sull'icona del menu in alto a destra e vai a **Settings**. L'ID del gruppo (`chat_id`) è elencato nella pagina delle impostazioni.

![Get Group ID](/images/feishu-get-group-id.png)

### ID utente (`open_id`, formato: `ou_xxx`)

Avvia il gateway, invia un DM al bot, quindi controlla i log:

```bash
openclaw logs --follow
```

Cerca `open_id` nell'output dei log. Puoi anche controllare le richieste di pairing in attesa:

```bash
openclaw pairing list feishu
```

---

## Comandi comuni

| Comando   | Descrizione                          |
| --------- | ------------------------------------ |
| `/status` | Mostra lo stato del bot              |
| `/reset`  | Reimposta la sessione corrente       |
| `/model`  | Mostra o cambia il modello AI        |

> Feishu/Lark non supporta menu nativi per gli slash command, quindi inviali come normali messaggi di testo.

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia stato aggiunto al gruppo
2. Assicurati di menzionare il bot con @ (richiesto per impostazione predefinita)
3. Verifica che `groupPolicy` non sia `"disabled"`
4. Controlla i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurati che il bot sia pubblicato e approvato in Feishu Open Platform / Lark Developer
2. Assicurati che la sottoscrizione degli eventi includa `im.message.receive_v1`
3. Assicurati che sia selezionata la **persistent connection** (WebSocket)
4. Assicurati che siano concessi tutti gli ambiti di autorizzazione richiesti
5. Assicurati che il gateway sia in esecuzione: `openclaw gateway status`
6. Controlla i log: `openclaw logs --follow`

### App Secret esposto

1. Reimposta l'App Secret in Feishu Open Platform / Lark Developer
2. Aggiorna il valore nella tua configurazione
3. Riavvia il gateway: `openclaw gateway restart`

---

## Configurazione avanzata

### Account multipli

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principale",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot di backup",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controlla quale account viene usato quando le API in uscita non specificano un `accountId`.

### Limiti dei messaggi

- `textChunkLimit` — dimensione dei blocchi di testo in uscita (predefinito: `2000` caratteri)
- `mediaMaxMb` — limite di upload/download dei contenuti multimediali (predefinito: `30` MB)

### Streaming

Feishu/Lark supporta le risposte in streaming tramite schede interattive. Quando è abilitato, il bot aggiorna la scheda in tempo reale mentre genera il testo.

```json5
{
  channels: {
    feishu: {
      streaming: true, // abilita l'output in streaming tramite schede (predefinito: true)
      blockStreaming: true, // abilita lo streaming a livello di blocco (predefinito: true)
    },
  },
}
```

Imposta `streaming: false` per inviare la risposta completa in un unico messaggio.

### Ottimizzazione della quota

Riduci il numero di chiamate API Feishu/Lark con due flag opzionali:

- `typingIndicator` (predefinito `true`): imposta `false` per saltare le chiamate di reazione di digitazione
- `resolveSenderNames` (predefinito `true`): imposta `false` per saltare le ricerche del profilo del mittente

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sessioni ACP

Feishu/Lark supporta ACP per DM e messaggi nei thread di gruppo. ACP in Feishu/Lark è guidato da comandi di testo: non ci sono menu nativi per gli slash command, quindi usa direttamente messaggi `/acp ...` nella conversazione.

#### Binding ACP persistente

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Avvia ACP dalla chat

In un DM o thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funziona per i DM e per i messaggi nei thread Feishu/Lark. I messaggi successivi nella conversazione associata verranno instradati direttamente a quella sessione ACP.

### Instradamento multi-agent

Usa `bindings` per instradare DM o gruppi Feishu/Lark verso agent diversi.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campi di instradamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) o `"group"` (chat di gruppo)
- `match.peer.id`: Open ID utente (`ou_xxx`) o ID gruppo (`oc_xxx`)

Vedi [Ottieni gli ID di gruppo/utente](#get-groupuser-ids) per suggerimenti su come trovarli.

---

## Riferimento della configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                                     | Descrizione                                | Predefinito      |
| ------------------------------------------------ | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                        | Abilita/disabilita il canale               | `true`           |
| `channels.feishu.domain`                         | Dominio API (`feishu` o `lark`)            | `feishu`         |
| `channels.feishu.connectionMode`                 | Trasporto eventi (`websocket` o `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                 | Account predefinito per l'instradamento in uscita | `default` |
| `channels.feishu.verificationToken`              | Richiesto per la modalità webhook          | —                |
| `channels.feishu.encryptKey`                     | Richiesto per la modalità webhook          | —                |
| `channels.feishu.webhookPath`                    | Percorso della route webhook               | `/feishu/events` |
| `channels.feishu.webhookHost`                    | Host di bind del webhook                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                    | Porta di bind del webhook                  | `3000`           |
| `channels.feishu.accounts.<id>.appId`            | ID app                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`        | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`           | Override del dominio per account           | `feishu`         |
| `channels.feishu.dmPolicy`                       | Policy DM                                  | `allowlist`      |
| `channels.feishu.allowFrom`                      | Allowlist DM (elenco `open_id`)            | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                    | Policy di gruppo                           | `allowlist`      |
| `channels.feishu.groupAllowFrom`                 | Allowlist gruppi                           | —                |
| `channels.feishu.requireMention`                 | Richiedi @mention nei gruppi               | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention`| Override @mention per gruppo               | ereditato        |
| `channels.feishu.groups.<chat_id>.enabled`       | Abilita/disabilita un gruppo specifico     | `true`           |
| `channels.feishu.textChunkLimit`                 | Dimensione dei blocchi di messaggio        | `2000`           |
| `channels.feishu.mediaMaxMb`                     | Limite dimensione contenuti multimediali   | `30`             |
| `channels.feishu.streaming`                      | Output in streaming tramite schede         | `true`           |
| `channels.feishu.blockStreaming`                 | Streaming a livello di blocco              | `true`           |
| `channels.feishu.typingIndicator`                | Invia reazioni di digitazione              | `true`           |
| `channels.feishu.resolveSenderNames`             | Risolve i nomi visualizzati dei mittenti   | `true`           |

---

## Tipi di messaggio supportati

### Ricezione

- ✅ Testo
- ✅ Testo avanzato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Sticker

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Schede interattive (inclusi aggiornamenti in streaming)
- ⚠️ Testo avanzato (formattazione in stile post; non supporta tutte le funzionalità di authoring di Feishu/Lark)

Le bolle audio native di Feishu/Lark usano il tipo di messaggio Feishu `audio` e richiedono il caricamento di contenuti multimediali Ogg/Opus (`file_type: "opus"`). I contenuti `.opus` e `.ogg` esistenti vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri formati audio probabili vengono transcodificati in Ogg/Opus a 48kHz con `ffmpeg` solo quando la risposta richiede la consegna vocale (`audioAsVoice` / strumento messaggio `asVoice`, incluse le risposte con note vocali TTS). I normali allegati MP3 restano file regolari. Se `ffmpeg` manca o la conversione fallisce, OpenClaw ripiega su un allegato file e registra il motivo.

### Thread e risposte

- ✅ Risposte inline
- ✅ Risposte nei thread
- ✅ Le risposte multimediali restano compatibili con i thread quando rispondono a un messaggio in un thread

Per `groupSessionScope: "group_topic"` e `"group_topic_sender"`, i gruppi topic nativi di Feishu/Lark usano l'evento `thread_id` (`omt_*`) come chiave canonica della sessione del topic. Le normali risposte di gruppo che OpenClaw trasforma in thread continuano a usare l'ID del messaggio radice della risposta (`om_*`), così il primo turno e il turno successivo restano nella stessa sessione.

---

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
