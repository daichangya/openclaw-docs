---
read_when:
    - Implementazione delle funzionalità dell'app macOS
    - Modifica del ciclo di vita del gateway o del bridging Node su macOS
summary: App companion OpenClaw per macOS (barra dei menu + broker Gateway)
title: App macOS
x-i18n:
    generated_at: "2026-04-25T13:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

L'app macOS è il **companion nella barra dei menu** per OpenClaw. Gestisce i permessi,
gestisce/si collega al Gateway localmente (launchd o manuale) ed espone le
capacità macOS all'agente come Node.

## Cosa fa

- Mostra notifiche native e stato nella barra dei menu.
- Gestisce i prompt TCC (Notifiche, Accessibilità, Registrazione schermo, Microfono,
  Riconoscimento vocale, Automazione/AppleScript).
- Esegue o si collega al Gateway (locale o remoto).
- Espone strumenti solo macOS (Canvas, Camera, Registrazione schermo, `system.run`).
- Avvia il servizio host Node locale in modalità **remote** (launchd) e lo arresta in modalità **local**.
- Può facoltativamente ospitare **PeekabooBridge** per l'automazione UI.
- Installa la CLI globale (`openclaw`) su richiesta tramite npm, pnpm o bun (l'app preferisce npm, poi pnpm, poi bun; Node resta il runtime Gateway consigliato).

## Modalità locale vs remota

- **Local** (predefinita): l'app si collega a un Gateway locale in esecuzione se presente;
  altrimenti abilita il servizio launchd tramite `openclaw gateway install`.
- **Remote**: l'app si collega a un Gateway tramite SSH/Tailscale e non avvia mai
  un processo locale.
  L'app avvia il **servizio host Node** locale in modo che il Gateway remoto possa raggiungere questo Mac.
  L'app non genera il Gateway come processo figlio.
  L'individuazione del Gateway ora preferisce i nomi Tailscale MagicDNS agli IP tailnet grezzi,
  così l'app Mac recupera in modo più affidabile quando gli IP tailnet cambiano.

## Controllo launchd

L'app gestisce un LaunchAgent per utente con etichetta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` quando si usa `--profile`/`OPENCLAW_PROFILE`; il legacy `com.openclaw.*` viene comunque scaricato).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sostituisci l'etichetta con `ai.openclaw.<profile>` quando esegui un profilo nominato.

Se il LaunchAgent non è installato, abilitalo dall'app oppure esegui
`openclaw gateway install`.

## Capacità Node (mac)

L'app macOS si presenta come un Node. Comandi comuni:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Schermo: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

Il Node riporta una mappa `permissions` così gli agenti possono decidere cosa è consentito.

Servizio Node + IPC app:

- Quando il servizio host Node headless è in esecuzione (modalità remote), si collega al Gateway WS come Node.
- `system.run` viene eseguito nell'app macOS (contesto UI/TCC) su un socket Unix locale; prompt + output restano nell'app.

Diagramma (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approvazioni exec (`system.run`)

`system.run` è controllato dalle **Approvazioni exec** nell'app macOS (Impostazioni → Approvazioni exec).
Sicurezza + ask + allowlist sono memorizzate localmente sul Mac in:

```
~/.openclaw/exec-approvals.json
```

Esempio:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Note:

- Le voci `allowlist` sono pattern glob per percorsi binari risolti, oppure nomi di comando semplici per comandi invocati tramite PATH.
- Il testo grezzo del comando shell che contiene sintassi di controllo o espansione della shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza dell'allowlist e richiede approvazione esplicita (oppure l'inserimento del binario shell in allowlist).
- Scegliere “Always Allow” nel prompt aggiunge quel comando alla allowlist.
- Gli override dell'ambiente `system.run` vengono filtrati (rimuovono `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) e poi uniti con l'ambiente dell'app.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override dell'ambiente limitati alla richiesta vengono ridotti a una piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) rendono persistenti i percorsi dell'eseguibile interno invece dei percorsi del wrapper. Se l'unwrapping non è sicuro, nessuna voce di allowlist viene resa persistente automaticamente.

## Deep link

L'app registra lo schema URL `openclaw://` per azioni locali.

### `openclaw://agent`

Attiva una richiesta Gateway `agent`.
__OC_I18N_900004__
Parametri query:

- `message` (obbligatorio)
- `sessionKey` (facoltativo)
- `thinking` (facoltativo)
- `deliver` / `to` / `channel` (facoltativo)
- `timeoutSeconds` (facoltativo)
- `key` (facoltativo, chiave modalità unattended)

Sicurezza:

- Senza `key`, l'app richiede conferma.
- Senza `key`, l'app applica un limite breve al messaggio per il prompt di conferma e ignora `deliver` / `to` / `channel`.
- Con una `key` valida, l'esecuzione è unattended (pensata per automazioni personali).

## Flusso di onboarding (tipico)

1. Installa e avvia **OpenClaw.app**.
2. Completa la checklist dei permessi (prompt TCC).
3. Assicurati che la modalità **Local** sia attiva e che il Gateway sia in esecuzione.
4. Installa la CLI se vuoi accesso dal terminale.

## Posizionamento della directory di stato (macOS)

Evita di mettere la directory di stato OpenClaw in iCloud o in altre cartelle sincronizzate nel cloud.
I percorsi supportati dalla sincronizzazione possono aggiungere latenza e occasionalmente causare race di lock/sync dei file per
sessioni e credenziali.

Preferisci un percorso di stato locale non sincronizzato come:
__OC_I18N_900005__
Se `openclaw doctor` rileva lo stato sotto:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrerà un avviso e consiglierà di tornare a un percorso locale.

## Workflow di build e sviluppo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (oppure Xcode)
- Pacchettizzazione app: `scripts/package-mac-app.sh`

## Debug della connettività gateway (CLI macOS)

Usa la CLI di debug per esercitare la stessa logica di handshake WebSocket e discovery del Gateway
che usa l'app macOS, senza avviare l'app.
__OC_I18N_900006__
Opzioni connect:

- `--url <ws://host:port>`: override della config
- `--mode <local|remote>`: risolve dalla config (predefinito: config o local)
- `--probe`: forza un nuovo health probe
- `--timeout <ms>`: timeout richiesta (predefinito: `15000`)
- `--json`: output strutturato per il diff

Opzioni discovery:

- `--include-local`: include i gateway che verrebbero filtrati come “local”
- `--timeout <ms>`: finestra complessiva di discovery (predefinito: `2000`)
- `--json`: output strutturato per il diff

Suggerimento: confronta con `openclaw gateway discover --json` per vedere se la
pipeline di discovery dell'app macOS (`local.` più il dominio wide-area configurato, con
fallback wide-area e Tailscale Serve) differisce dalla
discovery basata su `dns-sd` della CLI Node.

## Infrastruttura della connessione remota (tunnel SSH)

Quando l'app macOS è in modalità **Remote**, apre un tunnel SSH così i componenti UI locali
possono parlare con un Gateway remoto come se fosse su localhost.

### Tunnel di controllo (porta WebSocket Gateway)

- **Scopo:** health check, stato, Web Chat, configurazione e altre chiamate control-plane.
- **Porta locale:** la porta Gateway (predefinita `18789`), sempre stabile.
- **Porta remota:** la stessa porta Gateway sull'host remoto.
- **Comportamento:** nessuna porta locale casuale; l'app riusa un tunnel sano esistente
  o lo riavvia se necessario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con opzioni BatchMode +
  ExitOnForwardFailure + keepalive.
- **Segnalazione IP:** il tunnel SSH usa il loopback, quindi il gateway vedrà l'IP del node
  come `127.0.0.1`. Usa il trasporto **Direct (ws/wss)** se vuoi che compaia il vero IP
  del client (vedi [accesso remoto macOS](/it/platforms/mac/remote)).

Per i passaggi di configurazione, vedi [accesso remoto macOS](/it/platforms/mac/remote). Per i dettagli
del protocollo, vedi [Protocollo Gateway](/it/gateway/protocol).

## Documenti correlati

- [Runbook Gateway](/it/gateway)
- [Gateway (macOS)](/it/platforms/mac/bundled-gateway)
- [Permessi macOS](/it/platforms/mac/permissions)
- [Canvas](/it/platforms/mac/canvas)
