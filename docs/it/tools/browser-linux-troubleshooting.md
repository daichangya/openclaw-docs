---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Correggere i problemi di avvio di Chrome/Brave/Edge/Chromium CDP per il controllo del browser di OpenClaw su Linux
title: Risoluzione dei problemi del browser
x-i18n:
    generated_at: "2026-04-25T13:57:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6540de2c3141a92ad8bf7f6aedfc0ecb68293c939da2fed59e7fe2dd07ce8901
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problema: "Failed to start Chrome CDP on port 18800"

Il server di controllo del browser di OpenClaw non riesce ad avviare Chrome/Brave/Edge/Chromium con l'errore:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Causa principale

Su Ubuntu (e su molte distribuzioni Linux), l'installazione predefinita di Chromium è un **pacchetto snap**. Il confinamento AppArmor di snap interferisce con il modo in cui OpenClaw avvia e monitora il processo del browser.

Il comando `apt install chromium` installa un pacchetto stub che reindirizza a snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Questo NON è un browser reale: è solo un wrapper.

Altri errori comuni di avvio su Linux:

- `The profile appears to be in use by another Chromium process` significa che Chrome
  ha trovato file di lock `Singleton*` obsoleti nella directory del profilo gestito. OpenClaw
  rimuove questi lock e ritenta una volta quando il lock punta a un processo terminato o
  a un processo su un host diverso.
- `Missing X server or $DISPLAY` significa che è stato richiesto esplicitamente un browser
  visibile su un host senza una sessione desktop. Per impostazione predefinita, i profili
  gestiti locali ora passano alla modalità headless su Linux quando `DISPLAY` e
  `WAYLAND_DISPLAY` non sono entrambi impostati. Se imposti `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, o `browser.profiles.<name>.headless: false`,
  rimuovi questa forzatura della modalità con interfaccia, imposta `OPENCLAW_BROWSER_HEADLESS=1`, avvia `Xvfb`,
  esegui `openclaw browser start --headless` per un avvio gestito una tantum, oppure esegui
  OpenClaw in una vera sessione desktop.

### Soluzione 1: installare Google Chrome (consigliato)

Installa il pacchetto `.deb` ufficiale di Google Chrome, che non è sandboxato da snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # se ci sono errori di dipendenze
```

Poi aggiorna la configurazione di OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Soluzione 2: usare Snap Chromium con la modalità solo collegamento

Se devi usare snap Chromium, configura OpenClaw per collegarsi a un browser avviato manualmente:

1. Aggiorna la configurazione:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Avvia Chromium manualmente:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Facoltativamente, crea un servizio utente systemd per avviare automaticamente Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Abilitalo con: `systemctl --user enable --now openclaw-browser.service`

### Verificare che il browser funzioni

Controlla lo stato:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Testa la navigazione:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Riferimento configurazione

| Opzione                          | Descrizione                                                          | Predefinito                                                  |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `browser.enabled`                | Abilita il controllo del browser                                     | `true`                                                       |
| `browser.executablePath`         | Percorso di un binario browser basato su Chromium (Chrome/Brave/Edge/Chromium) | rilevato automaticamente (preferisce il browser predefinito se basato su Chromium) |
| `browser.headless`               | Esegue senza GUI                                                     | `false`                                                      |
| `OPENCLAW_BROWSER_HEADLESS`      | Override per processo per la modalità headless del browser gestito locale | non impostato                                                |
| `browser.noSandbox`              | Aggiunge il flag `--no-sandbox` (necessario per alcune configurazioni Linux) | `false`                                                      |
| `browser.attachOnly`             | Non avvia il browser, si collega solo a uno esistente                | `false`                                                      |
| `browser.cdpPort`                | Porta del Chrome DevTools Protocol                                   | `18800`                                                      |
| `browser.localLaunchTimeoutMs`   | Timeout di rilevamento di Chrome gestito locale                      | `15000`                                                      |
| `browser.localCdpReadyTimeoutMs` | Timeout locale post-avvio per la disponibilità di CDP                | `8000`                                                       |

Su Raspberry Pi, host VPS meno recenti o storage lento, aumenta
`browser.localLaunchTimeoutMs` quando Chrome ha bisogno di più tempo per esporre il suo endpoint HTTP CDP.
Aumenta `browser.localCdpReadyTimeoutMs` quando l'avvio riesce ma
`openclaw browser start` continua a segnalare `not reachable after start`. I valori sono
limitati a 120000 ms.

### Problema: "No Chrome tabs found for profile=\"user\""

Stai usando un profilo `existing-session` / Chrome MCP. OpenClaw può vedere Chrome locale,
ma non ci sono schede aperte disponibili a cui collegarsi.

Opzioni per risolvere:

1. **Usa il browser gestito:** `openclaw browser start --browser-profile openclaw`
   (oppure imposta `browser.defaultProfile: "openclaw"`).
2. **Usa Chrome MCP:** assicurati che Chrome locale sia in esecuzione con almeno una scheda aperta, quindi riprova con `--browser-profile user`.

Note:

- `user` è solo host. Per server Linux, container o host remoti, preferisci i profili CDP.
- `user` / altri profili `existing-session` mantengono gli attuali limiti di Chrome MCP:
  azioni guidate da ref, hook di caricamento file singolo, nessuna sostituzione dei timeout delle finestre di dialogo, nessun
  `wait --load networkidle`, e nessun `responsebody`, esportazione PDF, intercettazione dei download
  o azioni batch.
- I profili locali `openclaw` assegnano automaticamente `cdpPort`/`cdpUrl`; impostali solo per CDP remoto.
- I profili CDP remoti accettano `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) per il rilevamento `/json/version`, oppure WS(S) quando il tuo servizio browser
  fornisce un URL socket DevTools diretto.

## Correlati

- [Browser](/it/tools/browser)
- [Accesso browser](/it/tools/browser-login)
- [Risoluzione dei problemi del browser in WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
