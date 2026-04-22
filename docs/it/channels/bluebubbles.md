---
read_when:
    - Configurazione del canale BlueBubbles
    - Risoluzione dei problemi dell'associazione Webhook
    - Configurazione di iMessage su macOS
summary: iMessage tramite il server macOS BlueBubbles (invio/ricezione REST, digitazione, reazioni, associazione, azioni avanzate).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:20:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST macOS)

Stato: plugin incluso che comunica con il server macOS BlueBubbles tramite HTTP. **Consigliato per l'integrazione con iMessage** grazie alla sua API più ricca e alla configurazione più semplice rispetto al canale imsg legacy.

## Plugin incluso

Le versioni attuali di OpenClaw includono BlueBubbles, quindi le normali build pacchettizzate non richiedono un passaggio separato `openclaw plugins install`.

## Panoramica

- Viene eseguito su macOS tramite l'app helper BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Consigliato/testato: macOS Sequoia (15). macOS Tahoe (26) funziona; al momento la modifica è non funzionante su Tahoe e gli aggiornamenti dell'icona del gruppo possono segnalare successo senza sincronizzarsi.
- OpenClaw comunica con esso tramite la sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- I messaggi in arrivo arrivano tramite Webhook; le risposte in uscita, gli indicatori di digitazione, le conferme di lettura e i tapback sono chiamate REST.
- Gli allegati e gli sticker vengono acquisiti come contenuti multimediali in ingresso (e mostrati all'agente quando possibile).
- L'associazione/allowlist funziona allo stesso modo degli altri canali (`/channels/pairing` ecc.) con `channels.bluebubbles.allowFrom` + codici di associazione.
- Le reazioni vengono mostrate come eventi di sistema proprio come in Slack/Telegram, così gli agenti possono "menzionarle" prima di rispondere.
- Funzionalità avanzate: modifica, annullamento invio, risposte in thread, effetti dei messaggi, gestione dei gruppi.

## Avvio rapido

1. Installa il server BlueBubbles sul tuo Mac (segui le istruzioni su [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Nella configurazione di BlueBubbles, abilita la web API e imposta una password.
3. Esegui `openclaw onboard` e seleziona BlueBubbles, oppure configura manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Punta i Webhook di BlueBubbles al tuo Gateway (esempio: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Avvia il Gateway; registrerà il gestore Webhook e inizierà l'associazione.

Nota sulla sicurezza:

- Imposta sempre una password per il Webhook.
- L'autenticazione del Webhook è sempre obbligatoria. OpenClaw rifiuta le richieste Webhook BlueBubbles a meno che non includano una password/guid che corrisponda a `channels.bluebubbles.password` (ad esempio `?password=<password>` o `x-password`), indipendentemente dalla topologia loopback/proxy.
- L'autenticazione con password viene controllata prima di leggere/analizzare interamente i corpi dei Webhook.

## Mantenere attiva Messages.app (configurazioni VM / headless)

Alcune configurazioni macOS VM / always-on possono portare Messages.app a diventare “idle” (gli eventi in ingresso si interrompono finché l'app non viene aperta/portata in primo piano). Una semplice soluzione alternativa consiste nel **sollecitare Messages ogni 5 minuti** usando un AppleScript + LaunchAgent.

### 1) Salvare l'AppleScript

Salvalo come:

- `~/Scripts/poke-messages.scpt`

Script di esempio (non interattivo; non ruba il focus):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Installare un LaunchAgent

Salvalo come:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Note:

- Viene eseguito **ogni 300 secondi** e **all'accesso**.
- La prima esecuzione può attivare i prompt macOS di **Automazione** (`osascript` → Messages). Approvali nella stessa sessione utente che esegue il LaunchAgent.

Caricalo:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles è disponibile nell'onboarding interattivo:

```
openclaw onboard
```

La procedura guidata richiede:

- **URL del server** (obbligatorio): indirizzo del server BlueBubbles (ad esempio `http://192.168.1.100:1234`)
- **Password** (obbligatoria): password API dalle impostazioni del server BlueBubbles
- **Percorso Webhook** (facoltativo): per impostazione predefinita `/bluebubbles-webhook`
- **Criterio DM**: pairing, allowlist, open o disabled
- **Allow list**: numeri di telefono, email o destinazioni chat

Puoi anche aggiungere BlueBubbles tramite CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controllo degli accessi (DM + gruppi)

DM:

- Predefinito: `channels.bluebubbles.dmPolicy = "pairing"`.
- I mittenti sconosciuti ricevono un codice di associazione; i messaggi vengono ignorati finché non vengono approvati (i codici scadono dopo 1 ora).
- Approva tramite:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- L'associazione è lo scambio di token predefinito. Dettagli: [Associazione](/it/channels/pairing)

Gruppi:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controlla chi può attivare nei gruppi quando è impostato `allowlist`.

### Arricchimento dei nomi dei contatti (macOS, facoltativo)

I Webhook di gruppo BlueBubbles spesso includono solo indirizzi grezzi dei partecipanti. Se vuoi invece che il contesto `GroupMembers` mostri i nomi dei contatti locali, puoi attivare l'arricchimento dai Contatti locali su macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` abilita la ricerca. Predefinito: `false`.
- Le ricerche vengono eseguite solo dopo che l'accesso al gruppo, l'autorizzazione ai comandi e il controllo delle menzioni hanno consentito il passaggio del messaggio.
- Vengono arricchiti solo i partecipanti telefonici senza nome.
- I numeri di telefono grezzi restano il fallback quando non viene trovata alcuna corrispondenza locale.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Controllo delle menzioni (gruppi)

BlueBubbles supporta il controllo delle menzioni per le chat di gruppo, in linea con il comportamento di iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`) per rilevare le menzioni.
- Quando `requireMention` è abilitato per un gruppo, l'agente risponde solo quando viene menzionato.
- I comandi di controllo dei mittenti autorizzati bypassano il controllo delle menzioni.

Configurazione per gruppo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // predefinito per tutti i gruppi
        "iMessage;-;chat123": { requireMention: false }, // override per un gruppo specifico
      },
    },
  },
}
```

### Controllo dei comandi

- I comandi di controllo (ad esempio `/config`, `/model`) richiedono autorizzazione.
- Usa `allowFrom` e `groupAllowFrom` per determinare l'autorizzazione dei comandi.
- I mittenti autorizzati possono eseguire comandi di controllo anche senza menzionare nei gruppi.

### Prompt di sistema per gruppo

Ogni voce in `channels.bluebubbles.groups.*` accetta una stringa facoltativa `systemPrompt`. Il valore viene iniettato nel prompt di sistema dell'agente a ogni turno che gestisce un messaggio in quel gruppo, così puoi impostare regole di comportamento o una persona per gruppo senza modificare i prompt dell'agente:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Mantieni le risposte entro 3 frasi. Rispecchia il tono informale del gruppo.",
        },
      },
    },
  },
}
```

La chiave corrisponde a qualsiasi valore che BlueBubbles riporta come `chatGuid` / `chatIdentifier` / `chatId` numerico per il gruppo, e una voce jolly `"*"` fornisce un valore predefinito per ogni gruppo senza una corrispondenza esatta (lo stesso schema usato da `requireMention` e dai criteri degli strumenti per gruppo). Le corrispondenze esatte hanno sempre la precedenza sul jolly. I DM ignorano questo campo; usa invece personalizzazioni del prompt a livello di agente o di account.

#### Esempio pratico: risposte in thread e reazioni tapback (Private API)

Con la BlueBubbles Private API abilitata, i messaggi in ingresso arrivano con ID messaggio brevi (ad esempio `[[reply_to:5]]`) e l'agente può chiamare `action=reply` per inserire una risposta in thread a un messaggio specifico oppure `action=react` per aggiungere un tapback. Un `systemPrompt` per gruppo è un modo affidabile per fare in modo che l'agente scelga lo strumento corretto:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Quando rispondi in questo gruppo, chiama sempre action=reply con il",
            "messageId [[reply_to:N]] dal contesto in modo che la tua risposta venga inserita in thread",
            "sotto il messaggio che l'ha attivata. Non inviare mai un nuovo messaggio scollegato.",
            "",
            "Per brevi conferme ('ok', 'ricevuto', 'me ne occupo'), usa",
            "action=react con un'emoji tapback appropriata (❤️, 👍, 😂, ‼️, ❓)",
            "invece di inviare una risposta testuale.",
          ].join(" "),
        },
      },
    },
  },
}
```

Le reazioni tapback e le risposte in thread richiedono entrambe la BlueBubbles Private API; vedi [Azioni avanzate](#advanced-actions) e [ID messaggio](#message-ids-short-vs-full) per i meccanismi sottostanti.

## Associazioni conversazione ACP

Le chat BlueBubbles possono essere trasformate in workspace ACP persistenti senza cambiare il livello di trasporto.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` all'interno del DM o della chat di gruppo consentita.
- I messaggi futuri nella stessa conversazione BlueBubbles verranno instradati alla sessione ACP avviata.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Sono supportate anche associazioni persistenti configurate tramite voci `bindings[]` di primo livello con `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` può usare qualsiasi formato di destinazione BlueBubbles supportato:

- handle DM normalizzato come `+15555550123` o `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Per associazioni di gruppo stabili, preferisci `chat_id:*` o `chat_identifier:*`.

Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Vedi [Agenti ACP](/it/tools/acp-agents) per il comportamento condiviso delle associazioni ACP.

## Digitazione + conferme di lettura

- **Indicatori di digitazione**: inviati automaticamente prima e durante la generazione della risposta.
- **Conferme di lettura**: controllate da `channels.bluebubbles.sendReadReceipts` (predefinito: `true`).
- **Indicatori di digitazione**: OpenClaw invia eventi di inizio digitazione; BlueBubbles cancella automaticamente la digitazione all'invio o allo scadere del timeout (l'interruzione manuale tramite DELETE non è affidabile).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disabilita le conferme di lettura
    },
  },
}
```

## Azioni avanzate

BlueBubbles supporta azioni avanzate sui messaggi quando abilitate nella configurazione:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback (predefinito: true)
        edit: true, // modifica i messaggi inviati (macOS 13+, non funzionante su macOS 26 Tahoe)
        unsend: true, // annulla l'invio dei messaggi (macOS 13+)
        reply: true, // risposte in thread tramite GUID del messaggio
        sendWithEffect: true, // effetti del messaggio (slam, loud, ecc.)
        renameGroup: true, // rinomina le chat di gruppo
        setGroupIcon: true, // imposta l'icona/foto della chat di gruppo (instabile su macOS 26 Tahoe)
        addParticipant: true, // aggiungi partecipanti ai gruppi
        removeParticipant: true, // rimuovi partecipanti dai gruppi
        leaveGroup: true, // esci dalle chat di gruppo
        sendAttachment: true, // invia allegati/file multimediali
      },
    },
  },
}
```

Azioni disponibili:

- **react**: aggiunge/rimuove reazioni tapback (`messageId`, `emoji`, `remove`). L'insieme nativo di tapback di iMessage è `love`, `like`, `dislike`, `laugh`, `emphasize` e `question`. Quando un agente sceglie un'emoji al di fuori di questo insieme (ad esempio `👀`), lo strumento di reazione usa `love` come fallback in modo che il tapback venga comunque visualizzato invece di far fallire l'intera richiesta. Le reazioni di conferma configurate continuano comunque a essere validate rigorosamente e generano un errore per valori sconosciuti.
- **edit**: modifica un messaggio inviato (`messageId`, `text`)
- **unsend**: annulla l'invio di un messaggio (`messageId`)
- **reply**: risponde a un messaggio specifico (`messageId`, `text`, `to`)
- **sendWithEffect**: invia con effetto iMessage (`text`, `to`, `effectId`)
- **renameGroup**: rinomina una chat di gruppo (`chatGuid`, `displayName`)
- **setGroupIcon**: imposta l'icona/foto di una chat di gruppo (`chatGuid`, `media`) — instabile su macOS 26 Tahoe (l'API può restituire successo ma l'icona non si sincronizza).
- **addParticipant**: aggiunge una persona a un gruppo (`chatGuid`, `address`)
- **removeParticipant**: rimuove una persona da un gruppo (`chatGuid`, `address`)
- **leaveGroup**: esce da una chat di gruppo (`chatGuid`)
- **upload-file**: invia file multimediali/file (`to`, `buffer`, `filename`, `asVoice`)
  - Memo vocali: imposta `asVoice: true` con audio **MP3** o **CAF** per inviare come messaggio vocale iMessage. BlueBubbles converte MP3 → CAF quando invia memo vocali.
- Alias legacy: `sendAttachment` continua a funzionare, ma `upload-file` è il nome canonico dell'azione.

### ID messaggio (brevi vs completi)

OpenClaw può mostrare ID messaggio _brevi_ (ad esempio `1`, `2`) per risparmiare token.

- `MessageSid` / `ReplyToId` possono essere ID brevi.
- `MessageSidFull` / `ReplyToIdFull` contengono gli ID completi del provider.
- Gli ID brevi sono in memoria; possono scadere al riavvio o con l'espulsione dalla cache.
- Le azioni accettano `messageId` brevi o completi, ma gli ID brevi genereranno un errore se non sono più disponibili.

Usa gli ID completi per automazioni persistenti e archiviazione:

- Template: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contesto: `MessageSidFull` / `ReplyToIdFull` nei payload in ingresso

Vedi [Configurazione](/it/gateway/configuration) per le variabili di template.

## Coalescenza dei DM con invio suddiviso (comando + URL in una sola composizione)

Quando un utente digita un comando e un URL insieme in iMessage — ad esempio `Dump https://example.com/article` — Apple suddivide l'invio in **due consegne Webhook separate**:

1. Un messaggio di testo (`"Dump"`).
2. Un balloon di anteprima URL (`"https://..."`) con immagini di anteprima OG come allegati.

I due Webhook arrivano a OpenClaw con circa 0,8-2,0 s di distanza nella maggior parte delle configurazioni. Senza coalescenza, l'agente riceve il comando da solo al turno 1, risponde (spesso "inviami l'URL") e vede l'URL solo al turno 2 — quando il contesto del comando è già andato perso.

`channels.bluebubbles.coalesceSameSenderDms` consente a un DM di unire Webhook consecutivi dello stesso mittente in un singolo turno agente. Le chat di gruppo continuano a usare come chiave il singolo messaggio, così la struttura dei turni multiutente viene preservata.

### Quando abilitarlo

Abilitalo quando:

- Distribuisci Skills che si aspettano `command + payload` in un solo messaggio (dump, paste, save, queue, ecc.).
- I tuoi utenti incollano URL, immagini o contenuti lunghi insieme ai comandi.
- Puoi accettare la latenza aggiuntiva del turno DM (vedi sotto).

Lascialo disabilitato quando:

- Ti serve la latenza minima per i trigger DM composti da una sola parola.
- Tutti i tuoi flussi sono comandi one-shot senza payload successivi.

### Abilitazione

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // attiva esplicitamente (predefinito: false)
    },
  },
}
```

Con il flag attivo e senza un `messages.inbound.byChannel.bluebubbles` esplicito, la finestra di debounce si amplia a **2500 ms** (il valore predefinito senza coalescenza è 500 ms). È necessaria una finestra più ampia: la cadenza di invio suddiviso di Apple di 0,8-2,0 s non rientra nel valore predefinito più stretto.

Per regolare tu stesso la finestra:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms funziona per la maggior parte delle configurazioni; aumenta a 4000 ms se il tuo Mac è lento
        // o sotto pressione di memoria (in tal caso il ritardo osservato può superare i 2 s).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Compromessi

- **Latenza aggiuntiva per i comandi di controllo DM.** Con il flag attivo, i messaggi di comando di controllo DM (come `Dump`, `Save`, ecc.) ora attendono fino alla finestra di debounce prima dell'invio, nel caso in cui stia arrivando un Webhook con payload. I comandi nelle chat di gruppo mantengono invece l'invio immediato.
- **L'output unito è limitato** — il testo unito è limitato a 4000 caratteri con un marcatore esplicito `…[truncated]`; gli allegati sono limitati a 20; le voci sorgente sono limitate a 10 (oltre tale limite vengono mantenuti il primo e il più recente). Ogni `messageId` sorgente continua comunque a passare attraverso inbound-dedupe così una successiva ripetizione MessagePoller di un singolo evento viene riconosciuta come duplicato.
- **Attivazione esplicita, per canale.** Gli altri canali (Telegram, WhatsApp, Slack, …) non sono interessati.

### Scenari e cosa vede l'agente

| Cosa compone l'utente                                               | Cosa consegna Apple         | Flag disattivato (predefinito)          | Flag attivato + finestra di 2500 ms                                        |
| ------------------------------------------------------------------- | --------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `Dump https://example.com` (un solo invio)                          | 2 Webhook a ~1 s di distanza | Due turni agente: "Dump" da solo, poi URL | Un turno: testo unito `Dump https://example.com`                           |
| `Save this 📎image.jpg caption` (allegato + testo)                  | 2 Webhook                   | Due turni                               | Un turno: testo + immagine                                                 |
| `/status` (comando autonomo)                                        | 1 Webhook                   | Invio immediato                         | **Attende fino alla finestra, poi invia**                                  |
| URL incollato da solo                                               | 1 Webhook                   | Invio immediato                         | Invio immediato (solo una voce nel bucket)                                 |
| Testo + URL inviati come due messaggi separati intenzionalmente, a minuti di distanza | 2 Webhook fuori finestra | Due turni                               | Due turni (la finestra scade tra loro)                                     |
| Raffica rapida (>10 piccoli DM entro la finestra)                   | N Webhook                   | N turni                                 | Un turno, output limitato (primo + più recente, con limiti a testo/allegati) |

### Risoluzione dei problemi della coalescenza dell'invio suddiviso

Se il flag è attivo e gli invii suddivisi arrivano ancora come due turni, controlla ogni livello:

1. **Configurazione effettivamente caricata.**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Poi `openclaw gateway restart` — il flag viene letto alla creazione di debouncer-registry.

2. **Finestra di debounce sufficientemente ampia per la tua configurazione.** Guarda il log del server BlueBubbles in `~/Library/Logs/bluebubbles-server/main.log`:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Misura il ritardo tra l'invio del testo in stile `"Dump"` e il successivo invio `"https://..."; Attachments:`. Aumenta `messages.inbound.byChannel.bluebubbles` in modo da coprire comodamente quel ritardo.

3. **I timestamp JSONL della sessione ≠ arrivo del Webhook.** I timestamp degli eventi di sessione (`~/.openclaw/agents/<id>/sessions/*.jsonl`) riflettono il momento in cui il Gateway consegna un messaggio all'agente, **non** quando è arrivato il Webhook. Un secondo messaggio in coda etichettato `[Queued messages while agent was busy]` significa che il primo turno era ancora in esecuzione quando è arrivato il secondo Webhook — il bucket di coalescenza era già stato svuotato. Regola la finestra in base al log del server BB, non al log di sessione.

4. **La pressione di memoria rallenta l'invio della risposta.** Su macchine più piccole (8 GB), i turni dell'agente possono richiedere abbastanza tempo da far svuotare il bucket di coalescenza prima del completamento della risposta, e l'URL finisce come secondo turno in coda. Controlla `memory_pressure` e `ps -o rss -p $(pgrep openclaw-gateway)`; se il Gateway supera ~500 MB RSS e il compressore è attivo, chiudi altri processi pesanti o passa a un host più capiente.

5. **Gli invii con citazione di risposta seguono un percorso diverso.** Se l'utente ha toccato `Dump` come **risposta** a un balloon URL esistente (iMessage mostra un badge "1 Reply" sul balloon Dump), l'URL si trova in `replyToBody`, non in un secondo Webhook. La coalescenza non si applica — è una questione di skill/prompt, non del debouncer.

## Streaming a blocchi

Controlla se le risposte vengono inviate come un singolo messaggio o trasmesse in streaming a blocchi:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // abilita lo streaming a blocchi (disattivato per impostazione predefinita)
    },
  },
}
```

## File multimediali + limiti

- Gli allegati in ingresso vengono scaricati e memorizzati nella cache dei file multimediali.
- Limite dei file multimediali tramite `channels.bluebubbles.mediaMaxMb` per i file multimediali in ingresso e in uscita (predefinito: 8 MB).
- Il testo in uscita viene suddiviso in blocchi secondo `channels.bluebubbles.textChunkLimit` (predefinito: 4000 caratteri).

## Riferimento configurazione

Configurazione completa: [Configurazione](/it/gateway/configuration)

Opzioni del provider:

- `channels.bluebubbles.enabled`: abilita/disabilita il canale.
- `channels.bluebubbles.serverUrl`: URL di base della REST API di BlueBubbles.
- `channels.bluebubbles.password`: password API.
- `channels.bluebubbles.webhookPath`: percorso dell'endpoint Webhook (predefinito: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (predefinito: `pairing`).
- `channels.bluebubbles.allowFrom`: allowlist DM (handle, email, numeri E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (predefinito: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: allowlist dei mittenti nei gruppi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: su macOS, arricchisce facoltativamente i partecipanti di gruppo senza nome dai Contatti locali dopo il superamento dei controlli. Predefinito: `false`.
- `channels.bluebubbles.groups`: configurazione per gruppo (`requireMention`, ecc.).
- `channels.bluebubbles.sendReadReceipts`: invia conferme di lettura (predefinito: `true`).
- `channels.bluebubbles.blockStreaming`: abilita lo streaming a blocchi (predefinito: `false`; richiesto per le risposte in streaming).
- `channels.bluebubbles.textChunkLimit`: dimensione dei blocchi in uscita in caratteri (predefinito: 4000).
- `channels.bluebubbles.sendTimeoutMs`: timeout per richiesta in ms per gli invii di testo in uscita tramite `/api/v1/message/text` (predefinito: 30000). Aumentalo nelle configurazioni macOS 26 in cui gli invii iMessage tramite Private API possono bloccarsi per oltre 60 secondi all'interno del framework iMessage; ad esempio `45000` o `60000`. Sonde, ricerche chat, reazioni, modifiche e controlli di integrità attualmente mantengono il valore predefinito più breve di 10 s; un'estensione della copertura a reazioni e modifiche è prevista come passaggio successivo. Override per account: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (predefinito) divide solo quando supera `textChunkLimit`; `newline` divide sulle righe vuote (confini di paragrafo) prima della suddivisione per lunghezza.
- `channels.bluebubbles.mediaMaxMb`: limite dei file multimediali in ingresso/uscita in MB (predefinito: 8).
- `channels.bluebubbles.mediaLocalRoots`: allowlist esplicita di directory locali assolute consentite per i percorsi di file multimediali locali in uscita. L'invio di percorsi locali è negato per impostazione predefinita a meno che questo non sia configurato. Override per account: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: unisce Webhook DM consecutivi dello stesso mittente in un solo turno agente così che l'invio Apple suddiviso testo+URL arrivi come un singolo messaggio (predefinito: `false`). Vedi [Coalescenza dei DM con invio suddiviso](#coalescing-split-send-dms-command--url-in-one-composition) per scenari, regolazione della finestra e compromessi. Quando è abilitato senza un `messages.inbound.byChannel.bluebubbles` esplicito, amplia la finestra di debounce in ingresso predefinita da 500 ms a 2500 ms.
- `channels.bluebubbles.historyLimit`: numero massimo di messaggi di gruppo per il contesto (0 lo disabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite della cronologia DM.
- `channels.bluebubbles.actions`: abilita/disabilita azioni specifiche.
- `channels.bluebubbles.accounts`: configurazione multi-account.

Opzioni globali correlate:

- `agents.list[].groupChat.mentionPatterns` (oppure `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Indirizzamento / destinazioni di consegna

Preferisci `chat_guid` per un instradamento stabile:

- `chat_guid:iMessage;-;+15555550123` (preferito per i gruppi)
- `chat_id:123`
- `chat_identifier:...`
- Handle diretti: `+15555550123`, `user@example.com`
  - Se un handle diretto non ha una chat DM esistente, OpenClaw ne creerà una tramite `POST /api/v1/chat/new`. Questo richiede che la BlueBubbles Private API sia abilitata.

### Instradamento iMessage vs SMS

Quando lo stesso handle ha sia una chat iMessage sia una chat SMS sul Mac (ad esempio un numero di telefono registrato a iMessage ma che ha ricevuto anche fallback a bolla verde), OpenClaw preferisce la chat iMessage e non esegue mai un downgrade silenzioso a SMS. Per forzare la chat SMS, usa un prefisso di destinazione esplicito `sms:` (ad esempio `sms:+15555550123`). Gli handle senza una chat iMessage corrispondente continuano a essere inviati tramite qualsiasi chat riportata da BlueBubbles.

## Sicurezza

- Le richieste Webhook vengono autenticate confrontando i parametri di query o gli header `guid`/`password` con `channels.bluebubbles.password`.
- Mantieni segreti la password API e l'endpoint Webhook (trattali come credenziali).
- Non esiste alcun bypass localhost per l'autenticazione Webhook di BlueBubbles. Se usi un proxy per il traffico Webhook, mantieni la password BlueBubbles nella richiesta end-to-end. `gateway.trustedProxies` qui non sostituisce `channels.bluebubbles.password`. Vedi [Sicurezza del Gateway](/it/gateway/security#reverse-proxy-configuration).
- Abilita HTTPS + regole firewall sul server BlueBubbles se lo esponi al di fuori della tua LAN.

## Risoluzione dei problemi

- Se gli eventi di digitazione/lettura smettono di funzionare, controlla i log Webhook di BlueBubbles e verifica che il percorso del Gateway corrisponda a `channels.bluebubbles.webhookPath`.
- I codici di associazione scadono dopo un'ora; usa `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Le reazioni richiedono la BlueBubbles private API (`POST /api/v1/message/react`); assicurati che la versione del server la esponga.
- Modifica/annullamento invio richiedono macOS 13+ e una versione compatibile del server BlueBubbles. Su macOS 26 (Tahoe), la modifica è attualmente non funzionante a causa di modifiche alla private API.
- Gli aggiornamenti dell'icona di gruppo possono essere instabili su macOS 26 (Tahoe): l'API può restituire successo ma la nuova icona non si sincronizza.
- OpenClaw nasconde automaticamente le azioni note come non funzionanti in base alla versione macOS del server BlueBubbles. Se la modifica appare ancora su macOS 26 (Tahoe), disabilitala manualmente con `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` è abilitato ma gli invii suddivisi (ad esempio `Dump` + URL) arrivano ancora come due turni: consulta la checklist [risoluzione dei problemi della coalescenza dell'invio suddiviso](#split-send-coalescing-troubleshooting) — le cause comuni sono una finestra di debounce troppo stretta, i timestamp del log di sessione interpretati erroneamente come arrivo del Webhook o un invio con citazione di risposta (che usa `replyToBody`, non un secondo Webhook).
- Per informazioni su stato/integrità: `openclaw status --all` oppure `openclaw status --deep`.

Per il flusso di lavoro generale dei canali, vedi [Canali](/it/channels) e la guida [Plugin](/it/tools/plugin).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
