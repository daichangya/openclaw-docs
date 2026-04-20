---
read_when:
    - Configurazione del controllo di accesso ai messaggi diretti
    - Associazione di un nuovo Node iOS/Android
    - Revisione della postura di sicurezza di OpenClaw
summary: 'Panoramica dell''associazione: approva chi può inviarti messaggi diretti + quali nodi possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-04-20T08:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Associazione

L’“associazione” è il passaggio esplicito di **approvazione del proprietario** di OpenClaw.
Viene utilizzata in due casi:

1. **Associazione DM** (chi è autorizzato a parlare con il bot)
2. **Associazione del Node** (quali dispositivi/nodi sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Security](/it/gateway/security)

## 1) Associazione DM (accesso alla chat in ingresso)

Quando un canale è configurato con il criterio DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non approvi.

I criteri DM predefiniti sono documentati in: [Security](/it/gateway/security)

Codici di associazione:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di associazione solo quando viene creata una nuova richiesta (circa una volta all’ora per mittente).
- Le richieste DM di associazione in sospeso sono limitate a **3 per canale** per impostazione predefinita; le richieste aggiuntive vengono ignorate finché una non scade o non viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dove risiede lo stato

Memorizzato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Archivio delle allowlist approvate:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell’ambito account:

- Gli account non predefiniti leggono/scrivono solo il proprio file allowlist con ambito specifico.
- L’account predefinito usa il file allowlist senza ambito specifico del canale.

Trattali come dati sensibili (controllano l’accesso al tuo assistente).

Importante: questo archivio è per l’accesso DM. L’autorizzazione dei gruppi è separata.
Approvare un codice di associazione DM non consente automaticamente a quel mittente di eseguire comandi di gruppo o controllare il bot nei gruppi. Per l’accesso ai gruppi, configura le allowlist esplicite del canale per i gruppi (ad esempio `groupAllowFrom`, `groups` o override per gruppo/per topic, a seconda del canale).

## 2) Associazione del dispositivo Node (nodi iOS/Android/macOS/headless)

I Node si connettono al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di associazione del dispositivo che deve essere approvata.

### Associare tramite Telegram (consigliato per iOS)

Se utilizzi il plugin `device-pair`, puoi eseguire la prima associazione del dispositivo interamente da Telegram:

1. In Telegram, invia un messaggio al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul telefono, apri l’app OpenClaw iOS → Settings → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Torna in Telegram: `/pair pending` (controlla ID richiesta, ruolo e ambiti), quindi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l’URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap temporaneo per singolo dispositivo usato per l’handshake iniziale di associazione

Quel token bootstrap include il profilo bootstrap di associazione integrato:

- il token `node` primario passato rimane `scopes: []`
- qualsiasi token `operator` passato rimane limitato alla bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli ambiti bootstrap sono prefissati per ruolo, non un unico pool piatto di ambiti:
  le voci di ambito operator soddisfano solo richieste operator, e i ruoli non-operator
  devono comunque richiedere ambiti con il prefisso del proprio ruolo

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo riprova con dettagli di autenticazione diversi (ad esempio
ruolo/ambiti/chiave pubblica differenti), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo
`requestId`.

Importante: un dispositivo già associato non ottiene automaticamente un accesso più ampio. Se
si riconnette richiedendo più ambiti o un ruolo più esteso, OpenClaw mantiene
l’approvazione esistente così com’è e crea una nuova richiesta di aggiornamento in sospeso. Usa
`openclaw devices list` per confrontare l’accesso attualmente approvato con quello appena
richiesto prima di approvare.

### Archiviazione dello stato di associazione del Node

Memorizzato in `~/.openclaw/devices/`:

- `pending.json` (temporaneo; le richieste in sospeso scadono)
- `paired.json` (dispositivi associati + token)

### Note

- L’API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) è un
  archivio di associazione separato gestito dal gateway. I Node WS richiedono comunque l’associazione del dispositivo.
- Il record di associazione è la fonte di verità durevole per i ruoli approvati. I token del
  dispositivo attivi restano limitati a quell’insieme di ruoli approvati; una voce token errata
  al di fuori dei ruoli approvati non crea nuovo accesso.

## Documenti correlati

- Modello di sicurezza + prompt injection: [Security](/it/gateway/security)
- Aggiornare in sicurezza (esegui doctor): [Updating](/it/install/updating)
- Configurazioni dei canali:
  - Telegram: [Telegram](/it/channels/telegram)
  - WhatsApp: [WhatsApp](/it/channels/whatsapp)
  - Signal: [Signal](/it/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/it/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/it/channels/imessage)
  - Discord: [Discord](/it/channels/discord)
  - Slack: [Slack](/it/channels/slack)
