---
read_when:
    - Associare o riconnettere il node Android
    - Debug degli errori di discovery o auth del gateway su Android
    - Verificare la parità della cronologia chat tra client
summary: 'App Android (node): runbook di connessione + superficie di comando Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-26T11:33:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** L'app Android non è ancora stata rilasciata pubblicamente. Il codice sorgente è disponibile nel [repository OpenClaw](https://github.com/openclaw/openclaw) sotto `apps/android`. Puoi compilarla tu stesso usando Java 17 e l'Android SDK (`./gradlew :app:assemblePlayDebug`). Vedi [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) per le istruzioni di build.

## Panoramica del supporto

- Ruolo: app companion node (Android non ospita il Gateway).
- Gateway richiesto: sì (eseguilo su macOS, Linux o Windows tramite WSL2).
- Installazione: [Per iniziare](/it/start/getting-started) + [Pairing](/it/channels/pairing).
- Gateway: [Runbook](/it/gateway) + [Configurazione](/it/gateway/configuration).
  - Protocolli: [Protocollo Gateway](/it/gateway/protocol) (node + control plane).

## Controllo del sistema

Il controllo del sistema (`launchd`/`systemd`) vive sull'host del Gateway. Vedi [Gateway](/it/gateway).

## Runbook di connessione

App node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android si connette direttamente al Gateway WebSocket e usa il pairing del dispositivo (`role: node`).

Per host Tailscale o pubblici, Android richiede un endpoint sicuro:

- Preferito: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- Supportato anche: qualsiasi altro URL Gateway `wss://` con un vero endpoint TLS
- Il plaintext `ws://` resta supportato su indirizzi LAN privati / host `.local`, oltre a `localhost`, `127.0.0.1` e al bridge dell'emulatore Android (`10.0.2.2`)

### Prerequisiti

- Puoi eseguire il Gateway sulla macchina “master”.
- Il dispositivo/emulatore Android può raggiungere il gateway WebSocket:
  - Stessa LAN con mDNS/NSD, **oppure**
  - Stessa tailnet Tailscale usando Wide-Area Bonjour / unicast DNS-SD (vedi sotto), **oppure**
  - Host/porta del gateway manuali (fallback)
- Il pairing mobile tailnet/pubblico **non** usa endpoint grezzi `ws://` su IP tailnet. Usa invece Tailscale Serve o un altro URL `wss://`.
- Puoi eseguire la CLI (`openclaw`) sulla macchina gateway (o tramite SSH).

### 1) Avvia il Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Conferma nei log di vedere qualcosa come:

- `listening on ws://0.0.0.0:18789`

Per l'accesso remoto Android tramite Tailscale, preferisci Serve/Funnel invece di un bind tailnet grezzo:

```bash
openclaw gateway --tailscale serve
```

Questo fornisce ad Android un endpoint sicuro `wss://` / `https://`. Una semplice configurazione `gateway.bind: "tailnet"` non è sufficiente per il primo pairing Android remoto a meno che tu non termini anche TLS separatamente.

### 2) Verifica la discovery (facoltativo)

Dalla macchina gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Altre note di debug: [Bonjour](/it/gateway/bonjour).

Se hai configurato anche un dominio di discovery wide-area, confronta con:

```bash
openclaw gateway discover --json
```

Questo mostra `local.` più il dominio wide-area configurato in un unico passaggio e usa l'endpoint di servizio risolto invece di soli suggerimenti TXT.

#### Discovery tailnet (Vienna ⇄ Londra) tramite unicast DNS-SD

La discovery Android NSD/mDNS non attraversa le reti. Se il tuo node Android e il gateway sono su reti diverse ma connessi tramite Tailscale, usa invece Wide-Area Bonjour / unicast DNS-SD.

La sola discovery non è sufficiente per il pairing Android tailnet/pubblico. La route rilevata richiede comunque un endpoint sicuro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (esempio `openclaw.internal.`) sull'host gateway e pubblica i record `_openclaw-gw._tcp`.
2. Configura Tailscale split DNS per il dominio scelto puntando a quel server DNS.

Dettagli ed esempio di configurazione CoreDNS: [Bonjour](/it/gateway/bonjour).

### 3) Connettiti da Android

Nell'app Android:

- L'app mantiene attiva la connessione al gateway tramite un **servizio in foreground** (notifica persistente).
- Apri la scheda **Connect**.
- Usa la modalità **Setup Code** o **Manual**.
- Se la discovery è bloccata, usa host/porta manuali nei **Controlli avanzati**. Per host LAN privati, `ws://` continua a funzionare. Per host Tailscale/pubblici, attiva TLS e usa un endpoint `wss://` / Tailscale Serve.

Dopo il primo pairing riuscito, Android si riconnette automaticamente all'avvio:

- Endpoint manuale (se abilitato), altrimenti
- L'ultimo gateway rilevato (best-effort).

### 4) Approva il pairing (CLI)

Sulla macchina gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Dettagli del pairing: [Pairing](/it/channels/pairing).

Facoltativo: se il node Android si connette sempre da una subnet strettamente controllata,
puoi aderire esplicitamente all'auto-approvazione del primo pairing node con CIDR o IP esatti:

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

Questa funzione è disabilitata per impostazione predefinita. Si applica solo al pairing iniziale `role: node` senza scope richiesti. Il pairing operator/browser e qualsiasi modifica a ruolo, scope, metadati o chiave pubblica richiedono comunque approvazione manuale.

### 5) Verifica che il node sia connesso

- Tramite stato dei node:

  ```bash
  openclaw nodes status
  ```

- Tramite Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + cronologia

La scheda Chat Android supporta la selezione della sessione (predefinita `main`, più altre sessioni esistenti):

- Cronologia: `chat.history` (display-normalized; i tag direttiva inline vengono
  rimossi dal testo visibile, i payload XML plain-text delle chiamate tool (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  i blocchi di chiamata tool troncati) e i token di controllo del modello leaked ASCII/full-width
  vengono rimossi, le righe assistant composte solo da silent-token puri come `NO_REPLY` /
  `no_reply` esatti vengono omesse, e le righe sovradimensionate possono essere sostituite con placeholder)
- Invia: `chat.send`
- Aggiornamenti push (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + fotocamera

#### Gateway Canvas Host (consigliato per contenuti web)

Se vuoi che il node mostri vero HTML/CSS/JS che l'agente può modificare su disco, punta il node al canvas host del Gateway.

Nota: i node caricano il canvas dal server HTTP del Gateway (stessa porta di `gateway.port`, predefinita `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` sull'host gateway.

2. Naviga il node verso di esso (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (facoltativo): se entrambi i dispositivi sono su Tailscale, usa un nome MagicDNS o un IP tailnet invece di `.local`, ad esempio `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Questo server inietta un client live-reload nell'HTML e ricarica ai cambiamenti dei file.
L'host A2UI si trova su `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandi canvas (solo foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` per tornare allo scaffold predefinito). `canvas.snapshot` restituisce `{ format, base64 }` (predefinito `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legacy `canvas.a2ui.pushJSONL`)

Comandi fotocamera (solo foreground; controllati dai permessi):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Vedi [Node fotocamera](/it/nodes/camera) per parametri e helper CLI.

### 8) Voice + superficie di comando Android estesa

- Scheda Voice: Android ha due modalità di acquisizione esplicite. **Mic** è una sessione manuale della scheda Voice che invia ogni pausa come turno di chat e si arresta quando l'app esce dal foreground o l'utente esce dalla scheda Voice. **Talk** è la modalità Talk continua e continua ad ascoltare finché non viene disattivata o il node non si disconnette.
- La modalità Talk promuove il servizio in foreground esistente da `dataSync` a `dataSync|microphone` prima dell'inizio dell'acquisizione, poi lo riporta indietro quando la modalità Talk si ferma. Android 14+ richiede la dichiarazione `FOREGROUND_SERVICE_MICROPHONE`, il permesso runtime `RECORD_AUDIO` e il tipo di servizio microphone a runtime.
- Le risposte vocali usano `talk.speak` tramite il provider Talk del gateway configurato. Il TTS di sistema locale viene usato solo quando `talk.speak` non è disponibile.
- Il voice wake resta disabilitato nella UX/runtime Android.
- Famiglie di comandi Android aggiuntive (la disponibilità dipende da dispositivo + permessi):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (vedi [Inoltro notifiche](#notification-forwarding) sotto)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entry point dell'assistente

Android supporta l'avvio di OpenClaw dal trigger dell'assistente di sistema (Google
Assistant). Quando configurato, tenere premuto il pulsante home o dire "Hey Google, ask
OpenClaw..." apre l'app e passa il prompt al compositore della chat.

Questo usa i metadati Android **App Actions** dichiarati nel manifest dell'app. Nessuna
configurazione aggiuntiva è necessaria lato gateway -- l'intent dell'assistente è
gestito interamente dall'app Android e inoltrato come normale messaggio di chat.

<Note>
La disponibilità di App Actions dipende dal dispositivo, dalla versione di Google Play Services
e dal fatto che l'utente abbia impostato OpenClaw come app assistente predefinita.
</Note>

## Inoltro notifiche

Android può inoltrare notifiche del dispositivo al gateway come eventi. Diversi controlli consentono di definire l'ambito delle notifiche inoltrate e quando.

| Chiave                           | Tipo           | Descrizione                                                                                           |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Inoltra notifiche solo da questi nomi package. Se impostato, tutti gli altri package vengono ignorati. |
| `notifications.denyPackages`     | string[]       | Non inoltrare mai notifiche da questi nomi package. Applicato dopo `allowPackages`.                  |
| `notifications.quietHours.start` | string (HH:mm) | Inizio della finestra delle ore silenziose (ora locale del dispositivo). Le notifiche vengono soppresse durante questa finestra. |
| `notifications.quietHours.end`   | string (HH:mm) | Fine della finestra delle ore silenziose.                                                             |
| `notifications.rateLimit`        | number         | Numero massimo di notifiche inoltrate per package al minuto. Le notifiche in eccesso vengono scartate. |

Il selettore delle notifiche usa anche un comportamento più sicuro per gli eventi di notifica inoltrati, evitando l'inoltro accidentale di notifiche di sistema sensibili.

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
L'inoltro delle notifiche richiede il permesso Android Notification Listener. L'app lo richiede durante la configurazione.
</Note>

## Correlati

- [App iOS](/it/platforms/ios)
- [Node](/it/nodes)
- [Risoluzione dei problemi del node Android](/it/nodes/troubleshooting)
