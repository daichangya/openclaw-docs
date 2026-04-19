---
read_when:
    - Installation d’OpenClaw sur Windows
    - Choisir entre Windows natif et WSL2
    - Recherche de l’état de l’application compagnon Windows
summary: 'Prise en charge de Windows : chemins d’installation natifs et WSL2, daemon et limitations actuelles'
title: Windows
x-i18n:
    generated_at: "2026-04-19T06:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw prend en charge à la fois **Windows natif** et **WSL2**. WSL2 est la voie la plus
stable et celle recommandée pour l’expérience complète — la CLI, le Gateway et
les outils s’exécutent dans Linux avec une compatibilité totale. Windows natif fonctionne pour
les usages principaux de la CLI et du Gateway, avec certaines limitations indiquées ci-dessous.

Des applications compagnon Windows natives sont prévues.

## WSL2 (recommandé)

- [Bien démarrer](/fr/start/getting-started) (à utiliser dans WSL)
- [Installation et mises à jour](/fr/install/updating)
- Guide officiel WSL2 (Microsoft) : [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## État de Windows natif

Les flux de CLI natifs sur Windows s’améliorent, mais WSL2 reste la voie recommandée.

Ce qui fonctionne bien aujourd’hui sur Windows natif :

- l’installateur du site web via `install.ps1`
- l’utilisation locale de la CLI, comme `openclaw --version`, `openclaw doctor` et `openclaw plugins list --json`
- les tests smoke intégrés d’agent local/provider, comme :

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitations actuelles :

- `openclaw onboard --non-interactive` attend toujours qu’un gateway local joignable soit disponible, sauf si vous passez `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` et `openclaw gateway install` essaient d’abord d’utiliser les tâches planifiées Windows
- si la création d’une tâche planifiée est refusée, OpenClaw bascule vers un élément de démarrage à la connexion dans le dossier Startup de l’utilisateur et démarre immédiatement le gateway
- si `schtasks` lui-même se bloque ou cesse de répondre, OpenClaw abandonne désormais rapidement cette voie et bascule au lieu de rester bloqué indéfiniment
- les tâches planifiées restent préférées lorsqu’elles sont disponibles, car elles fournissent un meilleur état du superviseur

Si vous voulez uniquement la CLI native, sans installation du service gateway, utilisez l’une de ces commandes :

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Si vous voulez un démarrage géré sur Windows natif :

```powershell
openclaw gateway install
openclaw gateway status --json
```

Si la création d’une tâche planifiée est bloquée, le mode service de repli démarre quand même automatiquement après la connexion via le dossier Startup de l’utilisateur actuel.

## Gateway

- [Guide pratique du Gateway](/fr/gateway)
- [Configuration](/fr/gateway/configuration)

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

Sélectionnez **Service Gateway** lorsque l’invite s’affiche.

Réparer/migrer :

```
openclaw doctor
```

## Démarrage automatique du Gateway avant la connexion à Windows

Pour les configurations sans interface, assurez-vous que toute la chaîne de démarrage s’exécute même lorsque personne ne se connecte à
Windows.

### 1) Maintenir les services utilisateur actifs sans connexion

Dans WSL :

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installer le service utilisateur du gateway OpenClaw

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

Après un redémarrage (avant la connexion à Windows), vérifiez depuis WSL :

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avancé : exposer les services WSL sur le LAN (portproxy)

WSL possède son propre réseau virtuel. Si une autre machine doit atteindre un service
exécuté **dans WSL** (SSH, un serveur TTS local ou le Gateway), vous devez
rediriger un port Windows vers l’adresse IP WSL actuelle. L’IP WSL change après les redémarrages,
il peut donc être nécessaire d’actualiser la règle de redirection.

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

- SSH depuis une autre machine cible l’**IP de l’hôte Windows** (exemple : `ssh user@windows-host -p 2222`).
- Les Node distants doivent pointer vers une URL de Gateway **joignable** (pas `127.0.0.1`) ; utilisez
  `openclaw status --all` pour confirmer.
- Utilisez `listenaddress=0.0.0.0` pour l’accès LAN ; `127.0.0.1` le garde uniquement en local.
- Si vous voulez automatiser cela, enregistrez une tâche planifiée pour exécuter l’étape
  d’actualisation à la connexion.

## Installation WSL2 étape par étape

### 1) Installer WSL2 + Ubuntu

Ouvrez PowerShell (Admin) :

```powershell
wsl --install
# Ou choisissez explicitement une distribution :
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Redémarrez si Windows le demande.

### 2) Activer systemd (requis pour l’installation du gateway)

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

Pour une configuration initiale normale dans WSL, suivez le flux Linux Bien démarrer :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si vous développez depuis les sources au lieu d’effectuer un premier onboarding, utilisez la
boucle de développement depuis les sources décrite dans [Configuration](/fr/start/setup) :

```bash
pnpm install
# Première exécution uniquement (ou après avoir réinitialisé la configuration/l’espace de travail OpenClaw local)
pnpm openclaw setup
pnpm gateway:watch
```

Guide complet : [Bien démarrer](/fr/start/getting-started)

## Application compagnon Windows

Nous n’avons pas encore d’application compagnon Windows. Les contributions sont les bienvenues si vous voulez
aider à la concrétiser.
