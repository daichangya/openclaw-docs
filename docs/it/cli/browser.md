---
read_when:
    - Usi `openclaw browser` e vuoi esempi per attività comuni
    - Vuoi controllare un browser in esecuzione su un'altra macchina tramite un host Node
    - Vuoi collegarti al tuo Chrome locale con accesso effettuato tramite Chrome MCP
summary: Riferimento CLI per `openclaw browser` (ciclo di vita, profili, schede, azioni, stato e debug)
title: Browser
x-i18n:
    generated_at: "2026-04-26T11:24:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gestisci la superficie di controllo del browser di OpenClaw ed esegui azioni del browser (ciclo di vita, profili, schede, snapshot, screenshot, navigazione, input, emulazione dello stato e debug).

Correlati:

- Strumento Browser + API: [Strumento Browser](/it/tools/browser)

## Flag comuni

- `--url <gatewayWsUrl>`: URL WebSocket del Gateway (per impostazione predefinita dalla configurazione).
- `--token <token>`: token del Gateway (se richiesto).
- `--timeout <ms>`: timeout della richiesta (ms).
- `--expect-final`: attende una risposta finale del Gateway.
- `--browser-profile <name>`: sceglie un profilo browser (predefinito dalla configurazione).
- `--json`: output leggibile da macchina (dove supportato).

## Avvio rapido (locale)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Gli agenti possono eseguire lo stesso controllo di disponibilità con `browser({ action: "doctor" })`.

## Risoluzione rapida dei problemi

Se `start` fallisce con `not reachable after start`, risolvi prima la disponibilità CDP. Se `start` e `tabs` hanno esito positivo ma `open` o `navigate` falliscono, il piano di controllo del browser è integro e il guasto dipende di solito dalla policy SSRF di navigazione.

Sequenza minima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guida dettagliata: [Risoluzione dei problemi del Browser](/it/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo di vita

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Note:

- `doctor --deep` aggiunge una probe snapshot live. È utile quando la disponibilità CDP di base è verde ma vuoi verificare che la scheda corrente possa essere ispezionata.
- Per i profili `attachOnly` e CDP remoti, `openclaw browser stop` chiude la sessione di controllo attiva e cancella le override di emulazione temporanee anche quando OpenClaw non ha avviato direttamente il processo del browser.
- Per i profili locali gestiti, `openclaw browser stop` arresta il processo browser generato.
- `openclaw browser start --headless` si applica solo a quella richiesta di avvio e solo quando OpenClaw avvia un browser locale gestito. Non riscrive `browser.headless` o la configurazione del profilo, ed è un no-op per un browser già in esecuzione.
- Su host Linux senza `DISPLAY` o `WAYLAND_DISPLAY`, i profili locali gestiti vengono eseguiti automaticamente in modalità headless a meno che `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o `browser.profiles.<name>.headless=false` non richiedano esplicitamente un browser visibile.

## Se il comando manca

Se `openclaw browser` è un comando sconosciuto, controlla `plugins.allow` in `~/.openclaw/openclaw.json`.

Quando `plugins.allow` è presente, il Plugin browser incluso nel bundle deve essere elencato esplicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` non ripristina il sottocomando CLI quando l'allowlist dei Plugin esclude `browser`.

Correlato: [Strumento Browser](/it/tools/browser#missing-browser-command-or-tool)

## Profili

I profili sono configurazioni di routing browser con nome. In pratica:

- `openclaw`: avvia o si collega a un'istanza Chrome dedicata gestita da OpenClaw (directory dati utente isolata).
- `user`: controlla la tua sessione Chrome con accesso effettuato esistente tramite Chrome DevTools MCP.
- profili CDP personalizzati: puntano a un endpoint CDP locale o remoto.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Usa un profilo specifico:

```bash
openclaw browser --browser-profile work tabs
```

## Schede

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` restituisce prima `suggestedTargetId`, poi il `tabId` stabile come `t1`, l'etichetta facoltativa e il `targetId` grezzo. Gli agenti dovrebbero passare `suggestedTargetId` di nuovo a `focus`, `close`, snapshot e azioni. Puoi assegnare un'etichetta con `open --label`, `tab new --label` o `tab label`; sono tutti accettati etichette, ID scheda, ID target grezzi e prefissi univoci di target-id. Quando Chromium sostituisce il target grezzo sottostante durante una navigazione o l'invio di un modulo, OpenClaw mantiene `tabId`/etichetta stabili associati alla scheda sostitutiva quando può dimostrare la corrispondenza. Gli ID target grezzi restano volatili; preferisci `suggestedTargetId`.

## Snapshot / screenshot / azioni

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Note:

- `--full-page` è per le catture di pagina soltanto; non può essere combinato con `--ref` o `--element`.
- I profili `existing-session` / `user` supportano screenshot di pagina e screenshot `--ref` dall'output snapshot, ma non screenshot CSS `--element`.
- `--labels` sovrappone i ref dello snapshot corrente allo screenshot.
- `snapshot --urls` aggiunge le destinazioni dei link rilevate agli snapshot AI, così gli agenti possono scegliere target di navigazione diretti invece di indovinare solo dal testo del link.

Navigate/click/type (automazione UI basata su ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Le risposte delle azioni restituiscono il `targetId` grezzo corrente dopo la sostituzione della pagina attivata dall'azione quando OpenClaw può dimostrare la scheda sostitutiva. Gli script dovrebbero comunque memorizzare e passare `suggestedTargetId`/etichette per i flussi di lavoro di lunga durata.

Helper per file e finestre di dialogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

I profili Chrome gestiti salvano i download ordinari attivati da clic nella directory download di OpenClaw (`/tmp/openclaw/downloads` per impostazione predefinita, o la root temporanea configurata). Usa `waitfordownload` o `download` quando l'agente deve attendere un file specifico e restituirne il percorso; questi waiter espliciti prendono in carico il download successivo.

## Stato e storage

Viewport + emulazione:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + storage:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debug

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome esistente tramite MCP

Usa il profilo `user` integrato, oppure crea il tuo profilo `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Questo percorso è solo host. Per Docker, server headless, Browserless o altre configurazioni remote, usa invece un profilo CDP.

Limiti attuali di existing-session:

- le azioni guidate da snapshot usano ref, non selettori CSS
- `browser.actionTimeoutMs` imposta i valori predefiniti delle richieste `act` supportate a 60000 ms quando i chiamanti omettono `timeoutMs`; `timeoutMs` per chiamata continua ad avere la precedenza.
- `click` è solo clic sinistro
- `type` non supporta `slowly=true`
- `press` non supporta `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ed `evaluate` rifiutano override di timeout per chiamata
- `select` supporta un solo valore
- `wait --load networkidle` non è supportato
- gli upload di file richiedono `--ref` / `--input-ref`, non supportano CSS `--element` e attualmente supportano un file alla volta
- gli hook delle finestre di dialogo non supportano `--timeout`
- gli screenshot supportano catture di pagina e `--ref`, ma non CSS `--element`
- `responsebody`, intercettazione download, esportazione PDF e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo

## Controllo browser remoto (proxy host node)

Se il Gateway è in esecuzione su una macchina diversa dal browser, esegui un **host node** sulla macchina che dispone di Chrome/Brave/Edge/Chromium. Il Gateway inoltrerà le azioni del browser a quel node (non è richiesto alcun server di controllo browser separato).

Usa `gateway.nodes.browser.mode` per controllare il routing automatico e `gateway.nodes.browser.node` per fissare un node specifico se ce ne sono più di uno collegati.

Sicurezza + configurazione remota: [Strumento Browser](/it/tools/browser), [Accesso remoto](/it/gateway/remote), [Tailscale](/it/gateway/tailscale), [Sicurezza](/it/gateway/security)

## Correlati

- [Riferimento CLI](/it/cli)
- [Browser](/it/tools/browser)
