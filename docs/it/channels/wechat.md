---
read_when:
    - Vuoi connettere OpenClaw a WeChat o Weixin
    - Stai installando o risolvendo i problemi del Plugin del canale openclaw-weixin
    - Devi capire come i Plugin di canale esterni vengono eseguiti accanto al Gateway
summary: Configurazione del canale WeChat tramite il Plugin esterno openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw si connette a WeChat tramite il Plugin di canale esterno di Tencent
`@tencent-weixin/openclaw-weixin`.

Stato: Plugin esterno. Le chat dirette e i contenuti multimediali sono supportati. Le chat di gruppo non sono
dichiarate dai metadati di capacità del Plugin attuale.

## Denominazione

- **WeChat** è il nome rivolto all'utente in questa documentazione.
- **Weixin** è il nome usato dal pacchetto di Tencent e dall'id del Plugin.
- `openclaw-weixin` è l'id del canale OpenClaw.
- `@tencent-weixin/openclaw-weixin` è il pacchetto npm.

Usa `openclaw-weixin` nei comandi CLI e nei percorsi di configurazione.

## Come funziona

Il codice di WeChat non si trova nel repository core di OpenClaw. OpenClaw fornisce il
contratto generico del Plugin di canale, e il Plugin esterno fornisce il runtime
specifico per WeChat:

1. `openclaw plugins install` installa `@tencent-weixin/openclaw-weixin`.
2. Il Gateway rileva il manifest del Plugin e carica l'entrypoint del Plugin.
3. Il Plugin registra l'id del canale `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` avvia il login tramite QR.
5. Il Plugin archivia le credenziali dell'account nella directory di stato di OpenClaw.
6. Quando il Gateway si avvia, il Plugin avvia il monitor Weixin per ogni
   account configurato.
7. I messaggi WeChat in ingresso vengono normalizzati tramite il contratto del canale, instradati
   all'agente OpenClaw selezionato e inviati di nuovo tramite il percorso in uscita del Plugin.

Questa separazione è importante: il core di OpenClaw deve restare indipendente dal canale. Il login a WeChat,
le chiamate API Tencent iLink, il caricamento/scaricamento dei media, i token di contesto e il
monitoraggio degli account sono di competenza del Plugin esterno.

## Installazione

Installazione rapida:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Installazione manuale:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Riavvia il Gateway dopo l'installazione:

```bash
openclaw gateway restart
```

## Login

Esegui il login tramite QR sulla stessa macchina che esegue il Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Scansiona il codice QR con WeChat sul telefono e conferma il login. Il Plugin salva
localmente il token dell'account dopo una scansione riuscita.

Per aggiungere un altro account WeChat, esegui di nuovo lo stesso comando di login. Per più
account, isola le sessioni dei messaggi diretti per account, canale e mittente:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Controllo degli accessi

I messaggi diretti usano il normale modello OpenClaw di abbinamento e allowlist per i Plugin
di canale.

Approva nuovi mittenti:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Per il modello completo di controllo degli accessi, vedi [Pairing](/it/channels/pairing).

## Compatibilità

Il Plugin controlla la versione host di OpenClaw all'avvio.

| Linea del Plugin | Versione OpenClaw      | Tag npm  |
| ---------------- | ---------------------- | -------- |
| `2.x`            | `>=2026.3.22`          | `latest` |
| `1.x`            | `>=2026.1.0 <2026.3.22` | `legacy` |

Se il Plugin segnala che la tua versione di OpenClaw è troppo vecchia, aggiorna
OpenClaw oppure installa la linea legacy del Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Processo sidecar

Il Plugin WeChat può eseguire lavoro di supporto accanto al Gateway mentre monitora l'API
Tencent iLink. Nel problema #68451, questo percorso di supporto ha esposto un bug nella
pulizia generica dei Gateway obsoleti di OpenClaw: un processo figlio poteva tentare di ripulire il
processo Gateway padre, causando cicli di riavvio in gestori di processo come systemd.

L'attuale pulizia all'avvio di OpenClaw esclude il processo corrente e i suoi antenati,
quindi un helper di canale non deve terminare il Gateway che lo ha avviato. Questa correzione è
generica; non è un percorso specifico di WeChat nel core.

## Risoluzione dei problemi

Controlla installazione e stato:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Se il canale risulta installato ma non si connette, conferma che il Plugin sia
abilitato e riavvia:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Se il Gateway si riavvia ripetutamente dopo aver abilitato WeChat, aggiorna sia OpenClaw sia
il Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Disabilitazione temporanea:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Documentazione correlata

- Panoramica dei canali: [Chat Channels](/it/channels)
- Pairing: [Pairing](/it/channels/pairing)
- Instradamento dei canali: [Channel Routing](/it/channels/channel-routing)
- Architettura dei Plugin: [Plugin Architecture](/it/plugins/architecture)
- SDK del Plugin di canale: [Channel Plugin SDK](/it/plugins/sdk-channel-plugins)
- Pacchetto esterno: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
