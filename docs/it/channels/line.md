---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - Hai bisogno della configurazione del Webhook LINE e delle credenziali
    - Vuoi opzioni dei messaggi specifiche di LINE
summary: Configurazione, impostazioni e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-22T04:20:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a64c18e47d22d0629ec4956f88746620923e72faae6c01f7ab353eede7345d
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE si collega a OpenClaw tramite la LINE Messaging API. Il Plugin funziona come ricevitore di webhook
sul Gateway e utilizza il tuo token di accesso del canale + il segreto del canale per
l'autenticazione.

Stato: Plugin incluso. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex,
messaggi template e risposte rapide. Reazioni e thread
non sono supportati.

## Plugin incluso

LINE è distribuito come Plugin incluso nelle versioni correnti di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se utilizzi una build meno recente o un'installazione personalizzata che esclude LINE, installalo
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o scegli) un Provider e aggiungi un canale **Messaging API**.
3. Copia il **Channel access token** e il **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del webhook sull'endpoint del tuo Gateway (HTTPS richiesto):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica del webhook di LINE (GET) e agli eventi in ingresso (POST).
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` oppure
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal corpo della richiesta (HMAC sul corpo grezzo), quindi OpenClaw applica rigorosi limiti pre-autenticazione sul corpo e un timeout prima della verifica.
- OpenClaw elabora gli eventi webhook a partire dai byte grezzi della richiesta verificata. I valori `req.body` trasformati dal middleware a monte vengono ignorati per preservare l'integrità della firma.

## Configurazione

Configurazione minima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variabili d'ambiente (solo account predefinito):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/segreto:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devono puntare a file regolari. I link simbolici vengono rifiutati.

Account multipli:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Controllo degli accessi

I messaggi diretti usano per impostazione predefinita il pairing. I mittenti sconosciuti ricevono un codice di
pairing e i loro messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- Nota di runtime: se `channels.line` è completamente assente, il runtime torna a `groupPolicy="allowlist"` per i controlli sui gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; blocchi di codice e tabelle vengono convertiti in schede Flex
  quando possibile.
- Le risposte in streaming vengono bufferizzate; LINE riceve blocchi completi con un'animazione
  di caricamento mentre l'agente lavora.
- I download dei contenuti multimediali sono limitati da `channels.line.mediaMaxMb` (predefinito 10).

## Dati del canale (messaggi avanzati)

Usa `channelData.line` per inviare risposte rapide, posizioni, schede Flex o messaggi
template.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Il Plugin LINE include anche un comando `/card` per preset di messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` collega la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive collegate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Contenuti multimediali in uscita

Il Plugin LINE supporta l'invio di file immagine, video e audio tramite lo strumento di messaggistica dell'agente. I contenuti multimediali vengono inviati tramite il percorso di consegna specifico per LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita dell'anteprima e del tipo di contenuto.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei contenuti multimediali in uscita devono essere URL HTTPS pubblici. OpenClaw convalida il nome host di destinazione prima di passare l'URL a LINE e rifiuta destinazioni loopback, link-local e reti private.

Gli invii multimediali generici tornano al percorso esistente solo immagini quando un percorso specifico per LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica del webhook fallisce:** assicurati che l'URL del webhook usi HTTPS e che
  `channelSecret` corrisponda alla console LINE.
- **Nessun evento in ingresso:** conferma che il percorso del webhook corrisponda a `channels.line.webhookPath`
  e che il Gateway sia raggiungibile da LINE.
- **Errori di download dei contenuti multimediali:** aumenta `channels.line.mediaMaxMb` se i contenuti multimediali superano il
  limite predefinito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e misure di hardening
