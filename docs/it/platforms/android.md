---
read_when:
    - Abbinamento o riconnessione del Node Android
    - Debug del rilevamento o dell'autenticazione del Gateway Android
    - Verifica della parità della cronologia chat tra client
summary: 'App Android (node): runbook di connessione + superficie dei comandi Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** L'app Android non è stata ancora rilasciata pubblicamente. Il codice sorgente è disponibile nel [repository OpenClaw](https://github.com/openclaw/openclaw) sotto `apps/android`. Puoi compilarla da solo usando Java 17 e l'Android SDK (`./gradlew :app:assemblePlayDebug`). Vedi [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di build.

## Snapshot del supporto

- Ruolo: app Node companion (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Getting Started](/it/start/getting-started) + [Pairing](/it/channels/pairing).
- Gateway: [Runbook](/it/gateway) + [Configuration](/it/gateway/configuration).
  - Protocolli: [Gateway protocol](/it/gateway/protocol) (Nodes + control plane).

## Controllo del sistema

Il controllo del sistema (launchd/systemd) risiede sull'host del Gateway. Vedi [Gateway](/it/gateway).

## Runbook di connessione

App Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al WebSocket del Gateway e usa il pairing del dispositivo (`role: node`).

Per Tailscale o host pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un endpoint TLS reale
- Il protocollo `ws://` in chiaro resta supportato su indirizzi LAN privati / host `.local`, oltre a `localhost`, `127.0.0.1` e il bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina “master”.
- Il dispositivo/emulatore Android può raggiungere il WebSocket del gateway:
  - stessa LAN con mDNS/NSD, **oppure**
  - stessa tailnet Tailscale usando Wide-Area Bonjour / unicast DNS-SD (vedi sotto), **oppure**
  - host/porta del gateway manuali (fallback)
- Il pairing mobile tailnet/pubblico **non** usa endpoint `ws://` raw su IP tailnet. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina gateway (o via SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa come:

- `listening on ws://0.0.0.0:18789`

Per l'accesso Android remoto tramite Tailscale, preferisci Serve/Funnel invece di un raw bind tailnet:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non è sufficiente per il primo pairing Android remoto, a meno che tu non termini TLS separatamente.

### 2) Verifica il rilevamento (facoltativo)

Dalla macchina gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/it/gateway/bonjour).

Se hai configurato anche un dominio di rilevamento wide-area, confronta con:

```bash
openclaw gateway discover --json
```

Questo mostra `local.` più il dominio wide-area configurato in un solo passaggio e usa l'endpoint del servizio risolto invece di suggerimenti basati solo su TXT.

#### Rilevamento tailnet (Vienna ⇄ London) tramite unicast DNS-SD

Il rilevamento Android NSD/mDNS non attraversa le reti. Se il tuo Node Android e il gateway sono su reti diverse ma connessi tramite Tailscale, usa Wide-Area Bonjour / unicast DNS-SD.

Il solo rilevamento non è sufficiente per il pairing Android su tailnet/pubblico. Il percorso rilevato richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host del gateway e pubblica record `_openclaw-gw._tcp`.
2. Configura Tailscale split DNS per il dominio scelto puntando a quel server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/it/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene attiva la connessione al gateway tramite un **servizio in foreground** (notifica persistente).
- Apri la scheda **Connect**.
- Usa la modalità **Setup Code** o **Manual**.
- Se il rilevamento è bloccato, usa host/porta manuali in **Advanced controls**. Per host LAN privati, `ws://` continua a funzionare. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo il primo pairing riuscito, Android si riconnette automaticamente all'avvio:

- endpoint manuale (se abilitato), altrimenti
- l'ultimo gateway rilevato (best-effort).

### 4) Approva il pairing (CLI)

Sulla macchina gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli del pairing: [Pairing](/it/channels/pairing).

Facoltativo: se il Node Android si connette sempre da una subnet strettamente controllata,
puoi abilitare il primo auto-approval del Node con CIDR espliciti o IP esatti:

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

Questa opzione è disabilitata per impostazione predefinita. Si applica solo al pairing nuovo `role: node` senza scope richiesti. Il pairing di operator/browser e qualsiasi modifica di ruolo, scope, metadati o chiave pubblica richiedono comunque approvazione manuale.

### 5) Verifica che il Node sia connesso

- Tramite lo stato dei Nodes:

  ```bash
  openclaw nodes status
  ```

- Tramite il Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + cronologia

La scheda Chat di Android supporta la selezione della sessione (predefinita `main`, più altre sessioni esistenti):

- Cronologia: `chat.history` (normalizzata per la visualizzazione; i tag delle direttive inline vengono rimossi dal testo visibile, i payload XML di tool-call in testo semplice inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di tool-call troncati vengono rimossi, i token di controllo del modello trapelati in ASCII/full-width vengono rimossi, le righe dell'assistente composte solo da token silenziosi come `NO_REPLY` / `no_reply` esatti vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder)
- Invio: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Gateway Canvas Host (consigliato per contenuti web)

Se vuoi che il Node mostri vero HTML/CSS/JS che l'agente può modificare su disco, fai puntare il Node al canvas host del Gateway.

Nota: i Nodes caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host del gateway.

2. Naviga il Node verso di esso (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facoltativo): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inietta un client live-reload nell'HTML e ricarica al cambiamento dei file.
L'host A2UI si trova in `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandi Canvas (solo in foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legacy `canvas.a2ui.pushJSONL`)

Comandi fotocamera (solo in foreground; controllati dai permessi):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Vedi [Camera node](/it/nodes/camera) per parametri e helper CLI.

### 8) Voice + superficie dei comandi Android estesa

- Voice: Android usa un singolo flusso mic on/off nella scheda Voice con acquisizione del transcript e riproduzione `talk.speak`. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile. Voice si interrompe quando l'app esce dal foreground.
- I toggle di wake/talk-mode di Voice sono attualmente rimossi dall'UX/runtime Android.
- Famiglie di comandi Android aggiuntive (la disponibilità dipende dal dispositivo + dai permessi):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (vedi [Notification forwarding](#notification-forwarding) qui sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point dell'assistente

Android supporta l'avvio di OpenClaw dal trigger dell'assistente di sistema (Google
Assistant). Quando configurato, tenere premuto il pulsante Home o dire "Hey Google, ask
OpenClaw..." apre l'app e passa il prompt al composer della chat.

Questo usa i metadati Android **App Actions** dichiarati nel manifest dell'app. Non
è necessaria alcuna configurazione extra lato gateway -- l'intent dell'assistente viene
gestito interamente dall'app Android e inoltrato come normale messaggio di chat.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services
e dal fatto che l'utente abbia impostato OpenClaw come app assistente predefinita.
</Note>

## Inoltro delle notifiche

Android può inoltrare le notifiche del dispositivo al gateway come eventi. Diversi controlli permettono di limitare quali notifiche vengono inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra solo le notifiche provenienti da questi nomi di pacchetto. Se impostato, tutti gli altri pacchetti vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche provenienti da questi nomi di pacchetto. Applicato dopo `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra delle ore di silenzio (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra delle ore di silenzio.                                                        |
| `notifications.rateLimit`        | number         | Numero massimo di notifiche inoltrate per pacchetto al minuto. Le notifiche in eccesso vengono scartate. |

Anche il selettore delle notifiche usa un comportamento più sicuro per gli eventi di inoltro delle notifiche, evitando l'inoltro accidentale di notifiche di sistema sensibili.

Esempio di configurazione:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
L'inoltro delle notifiche richiede il permesso Android Notification Listener. L'app richiede questo permesso durante la configurazione.
</Note>

## Correlati

- [App iOS](/it/platforms/ios)
- [Nodes](/it/nodes)
- [Risoluzione dei problemi del Node Android](/it/nodes/troubleshooting)
