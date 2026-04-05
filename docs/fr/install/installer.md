---
read_when:
    - Vous voulez comprendre `openclaw.ai/install.sh`
    - Vous voulez automatiser les installations (CI / headless)
    - Vous voulez installer depuis un checkout GitHub
summary: Fonctionnement des scripts d’installation (install.sh, install-cli.sh, install.ps1), indicateurs et automatisation
title: Internes de l’installateur
x-i18n:
    generated_at: "2026-04-05T12:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: eced891572b8825b1f8a26ccc9d105ae8a38bd8ad89baef2f1927e27d4619e04
    source_path: install/installer.md
    workflow: 15
---

# Internes de l’installateur

OpenClaw fournit trois scripts d’installation, servis depuis `openclaw.ai`.

| Script                             | Plateforme           | Ce qu’il fait                                                                                                  |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut exécuter l’onboarding.     |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installe Node + OpenClaw dans un préfixe local (`~/.openclaw`) avec les modes npm ou checkout git. Aucun root requis. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installe Node si nécessaire, installe OpenClaw via npm (par défaut) ou git, et peut exécuter l’onboarding.     |

## Commandes rapides

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Si l’installation réussit mais que `openclaw` n’est pas trouvé dans un nouveau terminal, voir [Résolution des problèmes Node.js](/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Recommandé pour la plupart des installations interactives sur macOS/Linux/WSL.
</Tip>

### Flux (install.sh)

<Steps>
  <Step title="Détecter l’OS">
    Prend en charge macOS et Linux (y compris WSL). Si macOS est détecté, installe Homebrew s’il est absent.
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    Vérifie la version de Node et installe Node 24 si nécessaire (Homebrew sur macOS, scripts de configuration NodeSource sur Linux apt/dnf/yum). OpenClaw prend toujours en charge Node 22 LTS, actuellement `22.14+`, pour compatibilité.
  </Step>
  <Step title="Garantir Git">
    Installe Git s’il est absent.
  </Step>
  <Step title="Installer OpenClaw">
    - méthode `npm` (par défaut) : installation npm globale
    - méthode `git` : clone/met à jour le dépôt, installe les dépendances avec pnpm, build, puis installe le wrapper dans `~/.local/bin/openclaw`
  </Step>
  <Step title="Tâches post-installation">
    - Actualise au mieux un service Gateway déjà chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)
    - Tente l’onboarding lorsque cela est approprié (TTY disponible, onboarding non désactivé et vérifications bootstrap/config réussies)
    - Définit par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Détection de checkout source

S’il est exécuté à l’intérieur d’un checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), le script propose :

- d’utiliser le checkout (`git`), ou
- d’utiliser l’installation globale (`npm`)

Si aucun TTY n’est disponible et qu’aucune méthode d’installation n’est définie, il choisit `npm` par défaut et affiche un avertissement.

Le script quitte avec le code `2` en cas de sélection de méthode invalide ou de valeurs invalides pour `--install-method`.

### Exemples (install.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Ignorer l’onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Installation git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Exécution à blanc">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des indicateurs">

| Indicateur                            | Description                                                 |
| ------------------------------------- | ----------------------------------------------------------- |
| `--install-method npm\|git`           | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method` |
| `--npm`                               | Raccourci pour la méthode npm                              |
| `--git`                               | Raccourci pour la méthode git. Alias : `--github`          |
| `--version <version\|dist-tag\|spec>` | version npm, dist-tag ou spécification de package (par défaut : `latest`) |
| `--beta`                              | Utiliser le dist-tag beta si disponible, sinon repli sur `latest` |
| `--git-dir <path>`                    | Répertoire de checkout (par défaut : `~/openclaw`). Alias : `--dir` |
| `--no-git-update`                     | Ignorer `git pull` pour un checkout existant               |
| `--no-prompt`                         | Désactiver les invites                                     |
| `--no-onboard`                        | Ignorer l’onboarding                                       |
| `--onboard`                           | Activer l’onboarding                                       |
| `--dry-run`                           | Afficher les actions sans appliquer de changements         |
| `--verbose`                           | Activer la sortie de débogage (`set -x`, journaux npm au niveau notice) |
| `--help`                              | Afficher l’aide (`-h`)                                     |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                                | Description                                    |
| ------------------------------------------------------- | ---------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Méthode d’installation                         |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | version npm, dist-tag ou spécification de package |
| `OPENCLAW_BETA=0\|1`                                    | Utiliser beta si disponible                    |
| `OPENCLAW_GIT_DIR=<path>`                               | Répertoire de checkout                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Activer/désactiver les mises à jour git        |
| `OPENCLAW_NO_PROMPT=1`                                  | Désactiver les invites                         |
| `OPENCLAW_NO_ONBOARD=1`                                 | Ignorer l’onboarding                           |
| `OPENCLAW_DRY_RUN=1`                                    | Mode exécution à blanc                         |
| `OPENCLAW_VERBOSE=1`                                    | Mode débogage                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Niveau de journalisation npm                   |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Contrôler le comportement sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Conçu pour les environnements où vous voulez tout sous un préfixe local
(par défaut `~/.openclaw`) et sans dépendance Node système. Prend en charge les installations npm
par défaut, ainsi que les installations par checkout git sous le même flux de préfixe.
</Info>

### Flux (install-cli.sh)

<Steps>
  <Step title="Installer un runtime Node local">
    Télécharge une archive tarball épinglée d’un Node LTS pris en charge (la version est intégrée au script et mise à jour indépendamment) dans `<prefix>/tools/node-v<version>` et vérifie le SHA-256.
  </Step>
  <Step title="Garantir Git">
    Si Git est absent, tente une installation via apt/dnf/yum sur Linux ou Homebrew sur macOS.
  </Step>
  <Step title="Installer OpenClaw sous le préfixe">
    - méthode `npm` (par défaut) : installe sous le préfixe avec npm, puis écrit le wrapper dans `<prefix>/bin/openclaw`
    - méthode `git` : clone/met à jour un checkout (par défaut `~/openclaw`) et écrit quand même le wrapper dans `<prefix>/bin/openclaw`
  </Step>
  <Step title="Actualiser un service Gateway chargé">
    Si un service Gateway est déjà chargé depuis ce même préfixe, le script exécute
    `openclaw gateway install --force`, puis `openclaw gateway restart`, et
    sonde au mieux l’état de santé de la Gateway.
  </Step>
</Steps>

### Exemples (install-cli.sh)

<Tabs>
  <Tab title="Par défaut">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Préfixe personnalisé + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Installation git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Sortie JSON pour l’automatisation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Exécuter l’onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des indicateurs">

| Indicateur                  | Description                                                                      |
| --------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`           | Préfixe d’installation (par défaut : `~/.openclaw`)                             |
| `--install-method npm\|git` | Choisir la méthode d’installation (par défaut : `npm`). Alias : `--method`      |
| `--npm`                     | Raccourci pour la méthode npm                                                    |
| `--git`, `--github`         | Raccourci pour la méthode git                                                    |
| `--git-dir <path>`          | Répertoire de checkout git (par défaut : `~/openclaw`). Alias : `--dir`         |
| `--version <ver>`           | Version OpenClaw ou dist-tag (par défaut : `latest`)                             |
| `--node-version <ver>`      | Version Node (par défaut : `22.22.0`)                                            |
| `--json`                    | Émettre des événements NDJSON                                                    |
| `--onboard`                 | Exécuter `openclaw onboard` après l’installation                                 |
| `--no-onboard`              | Ignorer l’onboarding (par défaut)                                                |
| `--set-npm-prefix`          | Sous Linux, forcer le préfixe npm à `~/.npm-global` si le préfixe actuel n’est pas accessible en écriture |
| `--help`                    | Afficher l’aide (`-h`)                                                           |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                                    | Description                                        |
| ------------------------------------------- | -------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Préfixe d’installation                             |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Méthode d’installation                             |
| `OPENCLAW_VERSION=<ver>`                    | Version OpenClaw ou dist-tag                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Version Node                                       |
| `OPENCLAW_GIT_DIR=<path>`                   | Répertoire de checkout git pour les installations git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Activer/désactiver les mises à jour git pour les checkouts existants |
| `OPENCLAW_NO_ONBOARD=1`                     | Ignorer l’onboarding                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Niveau de journalisation npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Contrôler le comportement sharp/libvips (par défaut : `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flux (install.ps1)

<Steps>
  <Step title="Garantir PowerShell + environnement Windows">
    Nécessite PowerShell 5+.
  </Step>
  <Step title="Garantir Node.js 24 par défaut">
    Si absent, tente une installation via winget, puis Chocolatey, puis Scoop. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour compatibilité.
  </Step>
  <Step title="Installer OpenClaw">
    - méthode `npm` (par défaut) : installation npm globale utilisant le `-Tag` sélectionné
    - méthode `git` : clone/met à jour le dépôt, installe/build avec pnpm, et installe le wrapper dans `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Tâches post-installation">
    - Ajoute si possible le répertoire bin nécessaire au PATH utilisateur
    - Actualise au mieux un service Gateway déjà chargé (`openclaw gateway install --force`, puis redémarrage)
    - Exécute `openclaw doctor --non-interactive` lors des mises à niveau et des installations git (au mieux)
  </Step>
</Steps>

### Exemples (install.ps1)

<Tabs>
  <Tab title="Par défaut">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Installation git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Répertoire git personnalisé">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Exécution à blanc">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Trace de débogage">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Référence des indicateurs">

| Indicateur                  | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Méthode d’installation (par défaut : `npm`)                |
| `-Tag <tag\|version\|spec>` | dist-tag npm, version ou spécification de package (par défaut : `latest`) |
| `-GitDir <path>`            | Répertoire de checkout (par défaut : `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Ignorer l’onboarding                                        |
| `-NoGitUpdate`              | Ignorer `git pull`                                          |
| `-DryRun`                   | Afficher uniquement les actions                             |

  </Accordion>

  <Accordion title="Référence des variables d’environnement">

| Variable                           | Description         |
| ---------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Méthode d’installation |
| `OPENCLAW_GIT_DIR=<path>`          | Répertoire de checkout |
| `OPENCLAW_NO_ONBOARD=1`            | Ignorer l’onboarding |
| `OPENCLAW_GIT_UPDATE=0`            | Désactiver `git pull` |
| `OPENCLAW_DRY_RUN=1`               | Mode exécution à blanc |

  </Accordion>
</AccordionGroup>

<Note>
Si `-InstallMethod git` est utilisé et que Git est absent, le script s’arrête et affiche le lien vers Git for Windows.
</Note>

---

## CI et automatisation

Utilisez des indicateurs/variables d’environnement non interactifs pour des exécutions prévisibles.

<Tabs>
  <Tab title="install.sh (npm non interactif)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git non interactif)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (ignorer l’onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Pourquoi Git est-il requis ?">
    Git est requis pour la méthode d’installation `git`. Pour les installations `npm`, Git est quand même vérifié/installé afin d’éviter les échecs `spawn git ENOENT` lorsque des dépendances utilisent des URL git.
  </Accordion>

  <Accordion title="Pourquoi npm rencontre-t-il EACCES sous Linux ?">
    Certaines configurations Linux pointent le préfixe global npm vers des chemins appartenant à root. `install.sh` peut basculer le préfixe vers `~/.npm-global` et ajouter des exports PATH aux fichiers rc du shell (lorsque ces fichiers existent).
  </Accordion>

  <Accordion title="Problèmes sharp/libvips">
    Les scripts définissent par défaut `SHARP_IGNORE_GLOBAL_LIBVIPS=1` pour éviter que sharp se construise sur la libvips du système. Pour remplacer ce comportement :

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows : "npm error spawn git / ENOENT"'>
    Installez Git for Windows, rouvrez PowerShell, relancez l’installateur.
  </Accordion>

  <Accordion title='Windows : "openclaw is not recognized"'>
    Exécutez `npm config get prefix` et ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sous Windows), puis rouvrez PowerShell.
  </Accordion>

  <Accordion title="Windows : comment obtenir une sortie détaillée de l’installateur">
    `install.ps1` n’expose actuellement pas de commutateur `-Verbose`.
    Utilisez le traçage PowerShell pour les diagnostics au niveau du script :

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw introuvable après l’installation">
    Il s’agit généralement d’un problème de PATH. Voir [Résolution des problèmes Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
