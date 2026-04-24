---
read_when:
    - Vous devez installer Node.js avant d’installer OpenClaw
    - Vous avez installé OpenClaw mais `openclaw` renvoie command not found
    - '`npm install -g` échoue à cause de problèmes d’autorisations ou de PATH'
summary: Installer et configurer Node.js pour OpenClaw — exigences de version, options d’installation et dépannage PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-24T07:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

OpenClaw nécessite **Node 22.14 ou plus récent**. **Node 24 est le runtime par défaut et recommandé** pour les installations, la CI et les workflows de publication. Node 22 reste pris en charge via la branche LTS active. Le [script d’installation](/fr/install#alternative-install-methods) détectera et installera Node automatiquement — cette page est destinée au cas où vous voudriez configurer Node vous-même et vous assurer que tout est correctement branché (versions, PATH, installations globales).

## Vérifier votre version

```bash
node -v
```

Si cela affiche `v24.x.x` ou supérieur, vous utilisez la valeur par défaut recommandée. Si cela affiche `v22.14.x` ou supérieur, vous êtes sur le chemin Node 22 LTS pris en charge, mais nous recommandons quand même de passer à Node 24 lorsque cela vous convient. Si Node n’est pas installé ou que la version est trop ancienne, choisissez une méthode d’installation ci-dessous.

## Installer Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recommandé) :

    ```bash
    brew install node
    ```

    Ou téléchargez l’installateur macOS depuis [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian :**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL :**

    ```bash
    sudo dnf install nodejs
    ```

    Ou utilisez un gestionnaire de versions (voir ci-dessous).

  </Tab>
  <Tab title="Windows">
    **winget** (recommandé) :

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey :**

    ```powershell
    choco install nodejs-lts
    ```

    Ou téléchargez l’installateur Windows depuis [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Utiliser un gestionnaire de versions (nvm, fnm, mise, asdf)">
  Les gestionnaires de versions vous permettent de changer facilement de version de Node. Options populaires :

- [**fnm**](https://github.com/Schniz/fnm) — rapide, multiplateforme
- [**nvm**](https://github.com/nvm-sh/nvm) — largement utilisé sur macOS/Linux
- [**mise**](https://mise.jdx.dev/) — polyglotte (Node, Python, Ruby, etc.)

Exemple avec fnm :

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Assurez-vous que votre gestionnaire de versions est initialisé dans votre fichier de démarrage shell (`~/.zshrc` ou `~/.bashrc`). Sinon, `openclaw` risque de ne pas être trouvé dans les nouvelles sessions de terminal car le PATH n’inclura pas le répertoire bin de Node.
  </Warning>
</Accordion>

## Dépannage

### `openclaw: command not found`

Cela signifie presque toujours que le répertoire bin global de npm n’est pas dans votre PATH.

<Steps>
  <Step title="Trouver votre préfixe npm global">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Vérifier s’il est dans votre PATH">
    ```bash
    echo "$PATH"
    ```

    Recherchez `<npm-prefix>/bin` (macOS/Linux) ou `<npm-prefix>` (Windows) dans la sortie.

  </Step>
  <Step title="L’ajouter à votre fichier de démarrage shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Ajoutez dans `~/.zshrc` ou `~/.bashrc` :

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Puis ouvrez un nouveau terminal (ou exécutez `rehash` dans zsh / `hash -r` dans bash).
      </Tab>
      <Tab title="Windows">
        Ajoutez la sortie de `npm prefix -g` à votre PATH système via Paramètres → Système → Variables d’environnement.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Erreurs d’autorisation sur `npm install -g` (Linux)

Si vous voyez des erreurs `EACCES`, basculez le préfixe global npm vers un répertoire accessible en écriture par l’utilisateur :

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Ajoutez la ligne `export PATH=...` à votre `~/.bashrc` ou `~/.zshrc` pour la rendre permanente.

## Associé

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Updating](/fr/install/updating) — garder OpenClaw à jour
- [Getting Started](/fr/start/getting-started) — premières étapes après l’installation
