---
read_when:
    - Configurazione del controllo di accesso ai messaggi diretti
    - Associare un nuovo Node iOS/Android
    - Esaminare la postura di sicurezza di OpenClaw
summary: 'Panoramica dell’associazione: approva chi può inviarti messaggi diretti + quali Node possono unirsi'
title: Associazione
x-i18n:
    generated_at: "2026-04-26T11:24:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“Associazione” è il passaggio esplicito di **approvazione del proprietario** di OpenClaw.
Viene usata in due punti:

1. **Associazione DM** (chi è autorizzato a parlare con il bot)
2. **Associazione Node** (quali dispositivi/node sono autorizzati a unirsi alla rete Gateway)

Contesto di sicurezza: [Security](/it/gateway/security)

## 1) Associazione DM (accesso alla chat in ingresso)

Quando un canale è configurato con criterio DM `pairing`, i mittenti sconosciuti ricevono un codice breve e il loro messaggio **non viene elaborato** finché non lo approvi.

I criteri DM predefiniti sono documentati in: [Security](/it/gateway/security)

Codici di associazione:

- 8 caratteri, maiuscoli, senza caratteri ambigui (`0O1I`).
- **Scadono dopo 1 ora**. Il bot invia il messaggio di associazione solo quando viene creata una nuova richiesta (circa una volta all’ora per mittente).
- Le richieste DM di associazione in sospeso sono limitate per impostazione predefinita a **3 per canale**; le richieste aggiuntive vengono ignorate finché una non scade o viene approvata.

### Approvare un mittente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canali supportati: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Dove risiede lo stato

Memorizzato in `~/.openclaw/credentials/`:

- Richieste in sospeso: `<channel>-pairing.json`
- Archivio della allowlist approvata:
  - Account predefinito: `<channel>-allowFrom.json`
  - Account non predefinito: `<channel>-<accountId>-allowFrom.json`

Comportamento dell’ambito dell’account:

- Gli account non predefiniti leggono/scrivono solo il proprio file di allowlist con ambito.
- L’account predefinito usa il file di allowlist senza ambito relativo al canale.

Tratta questi file come sensibili (controllano l’accesso al tuo assistente).

Importante: questo archivio è per l’accesso DM. L’autorizzazione dei gruppi è separata.
Approvare un codice di associazione DM non consente automaticamente a quel mittente di eseguire comandi di gruppo o controllare il bot nei gruppi. Per l’accesso ai gruppi, configura le allowlist esplicite del canale per i gruppi (ad esempio `groupAllowFrom`, `groups` o override per gruppo/per topic a seconda del canale).

## 2) Associazione del dispositivo Node (node iOS/Android/macOS/headless)

I Node si collegano al Gateway come **dispositivi** con `role: node`. Il Gateway
crea una richiesta di associazione del dispositivo che deve essere approvata.

### Associare tramite Telegram (consigliato per iOS)

Se usi il Plugin `device-pair`, puoi effettuare la prima associazione del dispositivo interamente da Telegram:

1. In Telegram, invia al tuo bot: `/pair`
2. Il bot risponde con due messaggi: un messaggio di istruzioni e un messaggio separato con il **codice di configurazione** (facile da copiare/incollare in Telegram).
3. Sul tuo telefono, apri l’app OpenClaw per iOS → Impostazioni → Gateway.
4. Incolla il codice di configurazione e connettiti.
5. Torna in Telegram: `/pair pending` (esamina gli ID delle richieste, il ruolo e gli scope), poi approva.

Il codice di configurazione è un payload JSON codificato in base64 che contiene:

- `url`: l’URL WebSocket del Gateway (`ws://...` o `wss://...`)
- `bootstrapToken`: un token bootstrap a breve durata per singolo dispositivo usato per l’handshake iniziale di associazione

Quel token bootstrap include il profilo bootstrap di associazione integrato:

- il token `node` primario trasferito resta `scopes: []`
- qualsiasi token `operator` trasferito resta limitato alla allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- i controlli degli scope bootstrap hanno prefisso di ruolo, non un unico pool piatto di scope:
  le voci di scope operator soddisfano solo richieste operator, e i ruoli non operator
  devono comunque richiedere scope sotto il proprio prefisso di ruolo
- la successiva rotazione/revoca dei token resta limitata sia dal contratto di ruolo
  approvato del dispositivo sia dagli scope operator della sessione chiamante

Tratta il codice di configurazione come una password finché è valido.

### Approvare un dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se lo stesso dispositivo ritenta con dettagli di autenticazione diversi (ad esempio ruolo/scope/chiave pubblica differenti), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`.

Importante: un dispositivo già associato non ottiene automaticamente un accesso più ampio. Se si ricollega richiedendo più scope o un ruolo più ampio, OpenClaw mantiene invariata l’approvazione esistente e crea una nuova richiesta di upgrade in sospeso. Usa `openclaw devices list` per confrontare l’accesso attualmente approvato con l’accesso appena richiesto prima di approvare.

### Auto-approvazione opzionale dei Node attendibili tramite CIDR

L’associazione dei dispositivi resta manuale per impostazione predefinita. Per reti di Node strettamente controllate, puoi abilitare facoltativamente l’auto-approvazione al primo utilizzo dei Node con CIDR espliciti o IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Questo vale solo per richieste di associazione nuove `role: node` senza scope richiesti. I client operator, browser, Control UI e WebChat richiedono comunque approvazione manuale. Modifiche a ruolo, scope, metadati e chiave pubblica richiedono comunque approvazione manuale.

### Archiviazione dello stato di associazione dei Node

Memorizzato in `~/.openclaw/devices/`:

- `pending.json` (a breve durata; le richieste in sospeso scadono)
- `paired.json` (dispositivi associati + token)

### Note

- La API legacy `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) è un archivio di associazione separato di proprietà del gateway. I Node WS richiedono comunque l’associazione del dispositivo.
- Il record di associazione è la fonte di verità durevole per i ruoli approvati. I token attivi del dispositivo restano limitati a quell’insieme di ruoli approvati; una voce token anomala al di fuori dei ruoli approvati non crea nuovo accesso.

## Documentazione correlata

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
