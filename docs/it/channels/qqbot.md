---
read_when:
    - Vuoi collegare OpenClaw a QQ
    - Hai bisogno di configurare le credenziali del bot QQ
    - Vuoi il supporto del bot QQ per chat di gruppo o private
summary: Configurazione, impostazioni e utilizzo del bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-04-26T11:24:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: bd899d9556ab418bbb3d7dc368e6f6e1eca96828cbcc87b4147ccad362f1918e
    source_path: channels/qqbot.md
    workflow: 15
---

Il bot QQ si collega a OpenClaw tramite l'API ufficiale QQ Bot (gateway WebSocket). Il
Plugin supporta chat private C2C, `@messages` di gruppo e messaggi nei canali guild con
contenuti multimediali avanzati (immagini, voce, video, file).

Stato: Plugin incluso. I messaggi diretti, le chat di gruppo, i canali guild e i
contenuti multimediali sono supportati. Reazioni e thread non sono supportati.

## Plugin incluso

Le versioni attuali di OpenClaw includono il bot QQ, quindi le normali build pacchettizzate non richiedono
un passaggio separato `openclaw plugins install`.

## Configurazione

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene memorizzato in chiaro — se lasci la pagina senza salvarlo,
> dovrai generarne uno nuovo.

4. Aggiungi il canale:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Riavvia il Gateway.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurazione

Configurazione minima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variabili d'ambiente dell'account predefinito:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret basato su file:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Note:

- Il fallback tramite variabili d'ambiente si applica solo all'account predefinito del bot QQ.
- `openclaw channels add --channel qqbot --token-file ...` fornisce
  solo AppSecret; AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in chiaro.

### Configurazione multi-account

Esegui più bot QQ sotto una singola istanza di OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Ogni account avvia la propria connessione WebSocket e mantiene una cache token indipendente
(isolata per `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback di priorità:

| Impostazione | Specifica del Plugin                                   | Fallback del framework        |
| ------------ | ------------------------------------------------------ | ----------------------------- |
| STT          | `channels.qqbot.stt`                                   | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`              |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Imposta `enabled: false` su uno dei due per disabilitarlo.
Gli override TTS a livello di account usano la stessa struttura di `messages.tts` e vengono uniti in deep-merge
sopra la configurazione TTS del canale/globale.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati multimediali audio, mantenendo
i file vocali grezzi fuori dai generici `MediaPaths`. Le risposte in testo semplice `[[audio_as_voice]]`
sintetizzano il TTS e inviano un messaggio vocale QQ nativo quando il TTS è
configurato.

Il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                    | Descrizione        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo     |
| `qqbot:channel:CHANNEL_ID` | Canale guild       |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Comando        | Descrizione                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test di latenza                                                                                                 |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                                       |
| `/bot-help`    | Elenca tutti i comandi                                                                                          |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento di QQBot                                                             |
| `/bot-logs`    | Esporta i log recenti del gateway come file                                                                     |
| `/bot-approve` | Approva un'azione in sospeso del bot QQ (ad esempio, confermare un caricamento C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per ottenere la guida all'uso (ad esempio `/bot-upgrade ?`).

## Architettura del motore

Il bot QQ viene fornito come motore autosufficiente all'interno del Plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache token, radice di archiviazione dei media) identificato da `appId`. Gli account non condividono mai lo stato in ingresso/in uscita.
- Il logger multi-account etichetta le righe di log con l'account proprietario, così la diagnostica resta separabile quando esegui più bot sotto un unico gateway.
- I percorsi in ingresso, in uscita e del bridge gateway condividono un'unica radice di payload media sotto `~/.openclaw/media`, così upload, download e cache di transcodifica finiscono sotto una singola directory protetta invece che in un albero per sottosistema.
- Le credenziali possono essere sottoposte a backup e ripristinate come parte degli snapshot standard delle credenziali di OpenClaw; il motore ricollega lo stack di risorse di ogni account al ripristino senza richiedere un nuovo abbinamento tramite codice QR.

## Onboarding con codice QR

Come alternativa all'incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding tramite codice QR per collegare un bot QQ a OpenClaw:

1. Esegui il percorso di configurazione del bot QQ (ad esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono associata al bot QQ di destinazione.
3. Approva l'abbinamento sul telefono. OpenClaw mantiene persistenti le credenziali restituite in `credentials/` nell'ambito account corretto.

Le richieste di approvazione generate dal bot stesso (ad esempio i flussi "consentire questa azione?" esposti dall'API QQ Bot) vengono mostrate come prompt nativi di OpenClaw che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti e che il
  bot sia abilitato nella QQ Open Platform.
- **Autorisposte ripetute:** OpenClaw registra gli indici ref in uscita di QQ come
  scritti dal bot e ignora gli eventi in ingresso il cui `msgIdx` corrente corrisponde a
  quello dello stesso account bot. Questo previene i loop di echo della piattaforma, consentendo comunque agli utenti
  di citare o rispondere a messaggi precedenti del bot.
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  AppSecret. Ti serve comunque `appId` nella configurazione o `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ può intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi del canale](/it/channels/troubleshooting)
