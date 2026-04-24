---
read_when:
    - Installer OpenClaw sur Windows
    - Choisir entre Windows natif et WSL2
    - À la recherche du statut de l’app compagnon Windows
summary: 'Prise en charge de Windows : parcours d’installation natifs et WSL2, daemon et limites actuelles'
title: Windows
x-i18n:
    generated_at: "2026-04-24T07:21:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw prend en charge à la fois **Windows natif** et **WSL2**. WSL2 est la voie la plus
stable et recommandée pour l’expérience complète — la CLI, le Gateway et
l’outillage s’exécutent dans Linux avec une compatibilité totale. Windows natif fonctionne pour
l’usage principal de la CLI et du Gateway, avec certaines limites indiquées ci-dessous.

Des apps compagnons natives pour Windows sont prévues.

## WSL2 (recommandé)

- [Premiers pas](/fr/start/getting-started) (à utiliser dans WSL)
- [Installation et mises à jour](/fr/install/updating)
- Guide officiel WSL2 (Microsoft) : [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Statut de Windows natif

Les flux CLI natifs Windows s’améliorent, mais WSL2 reste la voie recommandée.

Ce qui fonctionne bien sur Windows natif aujourd’hui :

- installateur du site via `install.ps1`
- usage local de la CLI comme `openclaw --version`, `openclaw doctor`, et `openclaw plugins list --json`
- smoke embarqué local-agent/provider tel que :

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limites actuelles :

- `openclaw onboard --non-interactive` attend toujours un gateway local joignable sauf si vous passez `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` et `openclaw gateway install` tentent d’abord les tâches planifiées Windows
- si la création de tâche planifiée est refusée, OpenClaw revient à un élément de connexion du dossier Startup par utilisateur et démarre immédiatement le gateway
- si `schtasks` lui-même se bloque ou cesse de répondre, OpenClaw abandonne désormais rapidement ce chemin et revient au repli au lieu de rester bloqué indéfiniment
- les tâches planifiées restent préférées lorsqu’elles sont disponibles car elles fournissent un meilleur état du superviseur

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

Si la création de tâche planifiée est bloquée, le mode de service de repli démarre quand même automatiquement après connexion via le dossier Startup de l’utilisateur courant.

## Gateway

- [Guide d’exploitation du Gateway](/fr/gateway)
- [Configuration](/fr/gateway/configuration)

## Installation du service Gateway (CLI)

À l’intérieur de WSL2 :

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

Sélectionnez **Gateway service** lorsque cela vous est demandé.

Réparer/migrer :

```
openclaw doctor
```

## Démarrage automatique du Gateway avant connexion Windows

Pour les configurations headless, assurez-vous que toute la chaîne de démarrage s’exécute même si personne ne se connecte à Windows.

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

### 3) Démarrer WSL automatiquement au boot Windows

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
s’exécutant **dans WSL** (SSH, un serveur TTS local ou le Gateway), vous devez
transférer un port Windows vers l’IP WSL courante. L’IP WSL change après les redémarrages,
vous devrez donc peut-être actualiser la règle de transfert.

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
- Les nodes distants doivent pointer vers une URL Gateway **joignable** (pas `127.0.0.1`) ; utilisez
  `openclaw status --all` pour confirmer.
- Utilisez `listenaddress=0.0.0.0` pour l’accès LAN ; `127.0.0.1` le garde local uniquement.
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

Puis, depuis PowerShell :

```powershell
wsl --shutdown
```

Rouvrez Ubuntu, puis vérifiez :

```bash
systemctl --user status
```

### 3) Installer OpenClaw (dans WSL)

Pour une configuration normale initiale dans WSL, suivez le flux Linux Premiers pas :

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Si vous développez depuis les sources au lieu de faire un onboarding initial, utilisez la
boucle de développement source de [Setup](/fr/start/setup) :

```bash
pnpm install
# Premier lancement uniquement (ou après réinitialisation de la config/de l’espace de travail OpenClaw locaux)
pnpm openclaw setup
pnpm gateway:watch
```

Guide complet : [Premiers pas](/fr/start/getting-started)

## App compagnon Windows

Nous n’avons pas encore d’app compagnon Windows. Les contributions sont les bienvenues si vous voulez
aider à la rendre possible.

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Plateformes](/fr/platforms)
