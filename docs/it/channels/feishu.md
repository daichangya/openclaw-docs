---
read_when:
    - Vuoi connettere un bot Feishu/Lark
    - Stai configurando il canale Feishu
summary: Panoramica, funzionalità e configurazione del bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lisu

Feishu/Lark è una piattaforma di collaborazione all-in-one in cui i team chattano, condividono documenti, gestiscono calendari e lavorano insieme.

**Stato:** pronto per la produzione per DM bot + chat di gruppo. WebSocket è la modalità predefinita; la modalità Webhook è facoltativa.

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
  
  <Step title="Dopo il completamento della configurazione, riavvia il Gateway per applicare le modifiche">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controllo degli accessi

### Messaggi diretti

Configura `dmPolicy` per controllare chi può inviare DM al bot:

- `"pairing"` — gli utenti sconosciuti ricevono un codice di abbinamento; approva tramite CLI
- `"allowlist"` — solo gli utenti elencati in `allowFrom` possono chattare (predefinito: solo il proprietario del bot)
- `"open"` — consenti tutti gli utenti
- `"disabled"` — disabilita tutti i DM

**Approvare una richiesta di abbinamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat di gruppo

**Criterio di gruppo** (`channels.feishu.groupPolicy`):

| Valore        | Comportamento                              |
| ------------- | ------------------------------------------ |
| `"open"`      | Risponde a tutti i messaggi nei gruppi     |
| `"allowlist"` | Risponde solo ai gruppi in `groupAllowFrom` |
| `"disabled"`  | Disabilita tutti i messaggi di gruppo      |

Predefinito: `allowlist`

**Obbligo di menzione** (`channels.feishu.requireMention`):

- `true` — richiede una @menzione (predefinito)
- `false` — risponde senza @menzione
- Override per gruppo: `channels.feishu.groups.<chat_id>.requireMention`

---

## Esempi di configurazione dei gruppi

### Consenti tutti i gruppi, senza obbligo di @menzione

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Consenti tutti i gruppi, ma richiedi comunque una @menzione

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
      // Gli ID dei gruppi hanno questo aspetto: oc_xxx
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
          // Gli open_id degli utenti hanno questo aspetto: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Ottenere gli ID di gruppo/utente

### ID gruppo (`chat_id`, formato: `oc_xxx`)

Apri il gruppo in Feishu/Lark, fai clic sull'icona del menu nell'angolo in alto a destra e vai su **Impostazioni**. L'ID del gruppo (`chat_id`) è elencato nella pagina delle impostazioni.

![Ottieni ID gruppo](/images/feishu-get-group-id.png)

### ID utente (`open_id`, formato: `ou_xxx`)

Avvia il Gateway, invia un DM al bot, quindi controlla i log:

```bash
openclaw logs --follow
```

Cerca `open_id` nell'output dei log. Puoi anche controllare le richieste di abbinamento in sospeso:

```bash
openclaw pairing list feishu
```

---

## Comandi comuni

| Comando   | Descrizione                      |
| --------- | -------------------------------- |
| `/status` | Mostra lo stato del bot          |
| `/reset`  | Reimposta la sessione corrente   |
| `/model`  | Mostra o cambia il modello di IA |

> Feishu/Lark non supporta menu nativi con comandi slash, quindi invia questi comandi come semplici messaggi di testo.

---

## Risoluzione dei problemi

### Il bot non risponde nelle chat di gruppo

1. Assicurati che il bot sia stato aggiunto al gruppo
2. Assicurati di @menzionare il bot (richiesto per impostazione predefinita)
3. Verifica che `groupPolicy` non sia `"disabled"`
4. Controlla i log: `openclaw logs --follow`

### Il bot non riceve messaggi

1. Assicurati che il bot sia pubblicato e approvato in Feishu Open Platform / Lark Developer
2. Assicurati che la sottoscrizione agli eventi includa `im.message.receive_v1`
3. Assicurati che sia selezionata la **connessione persistente** (WebSocket)
4. Assicurati che siano concessi tutti gli ambiti di autorizzazione richiesti
5. Assicurati che il Gateway sia in esecuzione: `openclaw gateway status`
6. Controlla i log: `openclaw logs --follow`

### App Secret compromesso

1. Reimposta l'App Secret in Feishu Open Platform / Lark Developer
2. Aggiorna il valore nella tua configurazione
3. Riavvia il Gateway: `openclaw gateway restart`

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controlla quale account viene usato quando le API in uscita non specificano un `accountId`.
`accounts.<id>.tts` usa la stessa struttura di `messages.tts` e applica un deep merge sulla
configurazione TTS globale, così le configurazioni Feishu multi-bot possono mantenere globalmente
le credenziali provider condivise sovrascrivendo solo voce, modello, persona o modalità automatica
per account.

### Limiti dei messaggi

- `textChunkLimit` — dimensione dei blocchi di testo in uscita (predefinito: `2000` caratteri)
- `mediaMaxMb` — limite di caricamento/download dei contenuti multimediali (predefinito: `30` MB)

### Streaming

Feishu/Lark supporta le risposte in streaming tramite card interattive. Quando è abilitato, il bot aggiorna la card in tempo reale mentre genera il testo.

```json5
{
  channels: {
    feishu: {
      streaming: true, // abilita l'output in streaming tramite card (predefinito: true)
      blockStreaming: true, // abilita lo streaming a livello di blocco (predefinito: true)
    },
  },
}
```

Imposta `streaming: false` per inviare la risposta completa in un unico messaggio.

### Ottimizzazione della quota

Riduci il numero di chiamate API Feishu/Lark con due flag facoltativi:

- `typingIndicator` (predefinito `true`): imposta `false` per saltare le chiamate delle reazioni di digitazione
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

Feishu/Lark supporta ACP per i DM e per i messaggi nei thread di gruppo. ACP in Feishu/Lark è guidato da comandi testuali: non esistono menu nativi con comandi slash, quindi usa direttamente messaggi `/acp ...` nella conversazione.

#### Associazione ACP persistente

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

#### Avviare ACP dalla chat

In un DM o thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funziona per i DM e per i messaggi nei thread Feishu/Lark. I messaggi successivi nella conversazione associata vengono instradati direttamente a quella sessione ACP.

### Instradamento multi-agente

Usa `bindings` per instradare DM o gruppi Feishu/Lark verso agenti diversi.

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
- `match.peer.kind`: `"direct"` (DM) oppure `"group"` (chat di gruppo)
- `match.peer.id`: Open ID utente (`ou_xxx`) oppure ID gruppo (`oc_xxx`)

Vedi [Ottenere gli ID di gruppo/utente](#get-groupuser-ids) per suggerimenti su come recuperarli.

---

## Riferimento della configurazione

Configurazione completa: [Configurazione del Gateway](/it/gateway/configuration)

| Impostazione                                      | Descrizione                                | Predefinito      |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Abilita/disabilita il canale               | `true`           |
| `channels.feishu.domain`                          | Dominio API (`feishu` o `lark`)            | `feishu`         |
| `channels.feishu.connectionMode`                  | Trasporto eventi (`websocket` o `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Account predefinito per l'instradamento in uscita | `default`  |
| `channels.feishu.verificationToken`               | Richiesto per la modalità webhook          | —                |
| `channels.feishu.encryptKey`                      | Richiesto per la modalità webhook          | —                |
| `channels.feishu.webhookPath`                     | Percorso della route Webhook               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host di binding del Webhook                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta di binding del Webhook               | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID app                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Override del dominio per account           | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Override TTS per account                   | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Criterio DM                                | `allowlist`      |
| `channels.feishu.allowFrom`                       | Allowlist DM (elenco `open_id`)            | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Criterio di gruppo                         | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist gruppi                           | —                |
| `channels.feishu.requireMention`                  | Richiedi @menzione nei gruppi              | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @menzione per gruppo              | ereditato        |
| `channels.feishu.groups.<chat_id>.enabled`        | Abilita/disabilita un gruppo specifico     | `true`           |
| `channels.feishu.textChunkLimit`                  | Dimensione dei blocchi di messaggio        | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite dimensione contenuti multimediali   | `30`             |
| `channels.feishu.streaming`                       | Output card in streaming                   | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming a livello di blocco              | `true`           |
| `channels.feishu.typingIndicator`                 | Invia reazioni di digitazione              | `true`           |
| `channels.feishu.resolveSenderNames`              | Risolve i nomi visualizzati dei mittenti   | `true`           |

---

## Tipi di messaggio supportati

### Ricezione

- ✅ Testo
- ✅ Testo avanzato (post)
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/contenuti multimediali
- ✅ Adesivi

I messaggi audio Feishu/Lark in ingresso vengono normalizzati come segnaposto multimediali invece
che come JSON `file_key` grezzo. Quando `tools.media.audio` è configurato, OpenClaw
scarica la risorsa del messaggio vocale ed esegue la trascrizione audio condivisa prima del
turno dell'agente, così l'agente riceve la trascrizione del parlato. Se Feishu include
direttamente il testo trascritto nel payload audio, quel testo viene usato senza un'altra
chiamata ASR. Senza un provider di trascrizione audio, l'agente riceve comunque un
segnaposto `<media:audio>` più l'allegato salvato, non il payload della risorsa Feishu
grezzo.

### Invio

- ✅ Testo
- ✅ Immagini
- ✅ File
- ✅ Audio
- ✅ Video/contenuti multimediali
- ✅ Card interattive (inclusi gli aggiornamenti in streaming)
- ⚠️ Testo avanzato (formattazione in stile post; non supporta tutte le funzionalità di authoring di Feishu/Lark)

I bubble audio nativi di Feishu/Lark usano il tipo di messaggio Feishu `audio` e richiedono
contenuti multimediali Ogg/Opus caricati (`file_type: "opus"`). I contenuti `.opus` e `.ogg`
esistenti vengono inviati direttamente come audio nativo. MP3/WAV/M4A e altri formati audio
probabili vengono transcodificati in Ogg/Opus a 48kHz con `ffmpeg` solo quando la risposta richiede
la consegna vocale (`audioAsVoice` / strumento messaggio `asVoice`, incluse le risposte TTS
come messaggio vocale). I normali allegati MP3 restano file normali. Se `ffmpeg` manca oppure
la conversione non riesce, OpenClaw ripiega su un allegato file e registra il motivo nei log.

### Thread e risposte

- ✅ Risposte inline
- ✅ Risposte nei thread
- ✅ Le risposte multimediali restano consapevoli del thread quando rispondono a un messaggio del thread

Per `groupSessionScope: "group_topic"` e `"group_topic_sender"`, i gruppi topic nativi di
Feishu/Lark usano `thread_id` (`omt_*`) dell'evento come chiave canonica della sessione del
topic. Le normali risposte di gruppo che OpenClaw trasforma in thread continuano a usare
l'ID del messaggio radice della risposta (`om_*`), così il primo turno e il turno successivo
restano nella stessa sessione.

---

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e controllo tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
