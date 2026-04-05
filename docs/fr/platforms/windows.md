---
read_when:
    - Installation d’OpenClaw sur Windows
    - Choix entre Windows natif et WSL2
    - Recherche du statut de l’application compagnon Windows
summary: 'Prise en charge Windows : chemins d’installation natifs et WSL2, daemon et limites actuelles'
title: Windows
x-i18n:
    generated_at: "2026-04-05T12:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw prend en charge **Windows natif** et **WSL2**. WSL2 est le chemin le plus
stable et recommandé pour l’expérience complète — la CLI, la Gateway et
l’outillage s’exécutent dans Linux avec une compatibilité totale. Windows natif fonctionne pour
l’usage principal de la CLI et de la Gateway, avec quelques limites indiquées ci-dessous.

Des applications compagnon Windows natives sont prévues.

## WSL2 (recommandé)

- [Bien démarrer](/fr/start/getting-started) (à utiliser dans WSL)
- [Installation et mises à jour](/install/updating)
- Guide officiel WSL2 (Microsoft) : [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## État de Windows natif

Les flux CLI Windows natifs s’améliorent, mais WSL2 reste le chemin recommandé.

Ce qui fonctionne bien aujourd’hui sur Windows natif :

- l’installateur du site via `install.ps1`
- l’usage local de la CLI comme `openclaw --version`, `openclaw doctor`, et `openclaw plugins list --json`
- le smoke local agent/provider intégré, par exemple :

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limites actuelles :

- `openclaw onboard --non-interactive` attend toujours une passerelle locale joignable sauf si vous passez `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` et `openclaw gateway install` essaient d’abord les tâches planifiées Windows
- si la création de tâche planifiée est refusée, OpenClaw se rabat sur un élément de connexion dans le dossier Startup par utilisateur et démarre immédiatement la Gateway
- si `schtasks` lui-même se bloque ou cesse de répondre, OpenClaw abandonne désormais rapidement ce chemin et se rabat au lieu de rester bloqué indéfiniment
- les tâches planifiées restent préférées lorsqu’elles sont disponibles car elles fournissent un meilleur état de supervision

Si vous voulez uniquement la CLI native, sans installation du service Gateway, utilisez l’une de ces commandes :

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si vous voulez un démarrage géré sur Windows natif :

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la création de tâche planifiée est bloquée, le mode de service de repli démarre toujours automatiquement après connexion via le dossier Startup de l’utilisateur courant.

## Gateway

- [Runbook Gateway](/gateway)
- [Configuration](/gateway/configuration)

## Installation du service Gateway (CLI)

Dans WSL2 :

```
openclaw onboard --install-daemon
```

Ou :

```
openclaw gateway install
```

Ou :

```
openclaw configure
```

Sélectionnez **Service Gateway** lorsqu’on vous le demande.

Réparer/migrer :

```
openclaw doctor
```

## Démarrage automatique de la Gateway avant la connexion Windows

Pour les configurations headless, assurez-vous que toute la chaîne de démarrage fonctionne même lorsque personne ne se connecte à
Windows.

### 1) Garder les services utilisateur actifs sans connexion

Dans WSL :

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installer le service utilisateur Gateway OpenClaw

Dans WSL :

```bash
openclaw gateway install
```

### 3) Démarrer WSL automatiquement au démarrage de Windows

Dans PowerShell en tant qu’administrateur :

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Remplacez `Ubuntu` par le nom de votre distribution obtenu avec :

```powershell
wsl --list --verbose
```

### Vérifier la chaîne de démarrage

Après un redémarrage (avant la connexion Windows), vérifiez depuis WSL :

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avancé : exposer les services WSL sur le LAN (portproxy)

WSL possède son propre réseau virtuel. Si une autre machine doit atteindre un service
fonctionnant **dans WSL** (SSH, un serveur TTS local, ou la Gateway), vous devez
rediriger un port Windows vers l’IP WSL actuelle. L’IP WSL change après les redémarrages,
vous devrez donc peut-être actualiser la règle de redirection.

Exemple (PowerShell **en tant qu’administrateur**) :

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Autorisez le port dans le pare-feu Windows (une seule fois) :

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Actualisez le portproxy après le redémarrage de WSL :

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Remarques :

- Le SSH depuis une autre machine cible l’**IP de l’hôte Windows** (exemple : `ssh user@windows-host -p 2222`).
- Les nœuds distants doivent pointer vers une URL Gateway **joignable** (pas `127.0.0.1`) ; utilisez
  `openclaw status --all` pour confirmer.
- Utilisez `listenaddress=0.0.0.0` pour l’accès LAN ; `127.0.0.1` le garde uniquement en local.
- Si vous voulez automatiser cela, enregistrez une tâche planifiée pour exécuter l’étape de rafraîchissement
  à la connexion.

## Installation WSL2 pas à pas

### 1) Installer WSL2 + Ubuntu

Ouvrez PowerShell (Admin) :

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Redémarrez si Windows le demande.

### 2) Activer systemd (requis pour l’installation Gateway)

Dans votre terminal WSL :

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Puis depuis PowerShell :

```powershell
wsl --shutdown
```

Rouvrez Ubuntu, puis vérifiez :

```bash
systemctl --user status
```

### 3) Installer OpenClaw (dans WSL)

Suivez le flux Linux Bien démarrer dans WSL :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard
```

Guide complet : [Bien démarrer](/fr/start/getting-started)

## Application compagnon Windows

Nous n’avons pas encore d’application compagnon Windows. Les contributions sont bienvenues si vous voulez
aider à la rendre possible.
