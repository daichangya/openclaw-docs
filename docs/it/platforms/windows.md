---
read_when:
    - Installazione di OpenClaw su Windows
    - Scegliere tra Windows nativo e WSL2
    - Cerchi lo stato dell'app companion per Windows
summary: 'Supporto per Windows: percorsi di installazione nativi e WSL2, daemon e avvertenze attuali'
title: Windows
x-i18n:
    generated_at: "2026-04-19T08:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw supporta sia **Windows nativo** sia **WSL2**. WSL2 è il percorso più
stabile ed è consigliato per l'esperienza completa: la CLI, Gateway e gli
strumenti vengono eseguiti all'interno di Linux con piena compatibilità. Windows
nativo funziona per l'uso principale di CLI e Gateway, con alcune avvertenze
indicate di seguito.

Sono previste app companion native per Windows.

## WSL2 (consigliato)

- [Per iniziare](/it/start/getting-started) (da usare all'interno di WSL)
- [Installazione e aggiornamenti](/it/install/updating)
- Guida ufficiale a WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Stato di Windows nativo

I flussi CLI nativi su Windows stanno migliorando, ma WSL2 resta ancora il percorso consigliato.

Cosa funziona bene oggi su Windows nativo:

- installer del sito web tramite `install.ps1`
- uso locale della CLI come `openclaw --version`, `openclaw doctor` e `openclaw plugins list --json`
- smoke test locali embedded di agent/provider come:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Avvertenze attuali:

- `openclaw onboard --non-interactive` si aspetta ancora un Gateway locale raggiungibile a meno che non passi `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` e `openclaw gateway install` provano prima a usare le Windows Scheduled Tasks
- se la creazione della Scheduled Task viene negata, OpenClaw ripiega su un elemento di accesso per utente nella cartella Startup e avvia immediatamente il Gateway
- se `schtasks` stesso si blocca o smette di rispondere, OpenClaw ora interrompe rapidamente quel percorso e ripiega invece di restare bloccato per sempre
- le Scheduled Tasks restano comunque preferite quando disponibili perché forniscono uno stato del supervisore migliore

Se vuoi solo la CLI nativa, senza installare il servizio Gateway, usa uno di questi:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Se invece vuoi l'avvio gestito su Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se la creazione della Scheduled Task è bloccata, la modalità di servizio di fallback si avvia comunque automaticamente dopo il login tramite la cartella Startup dell'utente corrente.

## Gateway

- [Runbook del Gateway](/it/gateway)
- [Configurazione](/it/gateway/configuration)

## Installazione del servizio Gateway (CLI)

All'interno di WSL2:

```
openclaw onboard --install-daemon
```

Oppure:

```
openclaw gateway install
```

Oppure:

```
openclaw configure
```

Seleziona **Gateway service** quando richiesto.

Riparare/migrare:

```
openclaw doctor
```

## Avvio automatico del Gateway prima del login a Windows

Per configurazioni headless, assicurati che l'intera catena di avvio venga eseguita anche quando nessuno effettua l'accesso a
Windows.

### 1) Mantieni in esecuzione i servizi utente senza login

All'interno di WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installa il servizio utente del Gateway OpenClaw

All'interno di WSL:

```bash
openclaw gateway install
```

### 3) Avvia WSL automaticamente all'avvio di Windows

In PowerShell come Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Sostituisci `Ubuntu` con il nome della tua distribuzione preso da:

```powershell
wsl --list --verbose
```

### Verificare la catena di avvio

Dopo un riavvio (prima dell'accesso a Windows), controlla da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzato: esporre i servizi WSL sulla LAN (portproxy)

WSL ha una propria rete virtuale. Se un'altra macchina deve raggiungere un servizio
in esecuzione **all'interno di WSL** (SSH, un server TTS locale o il Gateway), devi
inoltrare una porta di Windows all'attuale IP di WSL. L'IP di WSL cambia dopo i riavvii,
quindi potrebbe essere necessario aggiornare la regola di inoltro.

Esempio (PowerShell **come Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Consenti la porta nel Windows Firewall (una sola volta):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Aggiorna il portproxy dopo il riavvio di WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Note:

- Le connessioni SSH da un'altra macchina devono puntare all'**IP dell'host Windows** (esempio: `ssh user@windows-host -p 2222`).
- I Node remoti devono puntare a un URL del Gateway **raggiungibile** (non `127.0.0.1`); usa
  `openclaw status --all` per confermare.
- Usa `listenaddress=0.0.0.0` per l'accesso LAN; `127.0.0.1` lo mantiene solo locale.
- Se vuoi automatizzare questa procedura, registra una Scheduled Task per eseguire il passaggio di aggiornamento
  al login.

## Installazione WSL2 passo per passo

### 1) Installa WSL2 + Ubuntu

Apri PowerShell (Admin):

```powershell
wsl --install
# Oppure scegli esplicitamente una distribuzione:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Riavvia se Windows lo richiede.

### 2) Abilita systemd (necessario per l'installazione del Gateway)

Nel terminale WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Poi da PowerShell:

```powershell
wsl --shutdown
```

Riapri Ubuntu, quindi verifica:

```bash
systemctl --user status
```

### 3) Installa OpenClaw (all'interno di WSL)

Per una normale configurazione iniziale all'interno di WSL, segui il flusso Linux Per iniziare:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Se stai sviluppando dal sorgente invece di eseguire il primo onboarding, usa il
ciclo di sviluppo dai sorgenti indicato in [Configurazione](/it/start/setup):

```bash
pnpm install
# Solo alla prima esecuzione (o dopo aver reimpostato la configurazione/workspace locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Guida completa: [Per iniziare](/it/start/getting-started)

## App companion per Windows

Non abbiamo ancora un'app companion per Windows. I contributi sono benvenuti se vuoi
contribuire a renderla possibile.
