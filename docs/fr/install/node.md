---
read_when:
    - Vous devez installer Node.js avant d’installer OpenClaw
    - Vous avez installé OpenClaw mais `openclaw` est introuvable
    - npm install -g échoue avec des problèmes de permissions ou de PATH
summary: Installer et configurer Node.js pour OpenClaw — exigences de version, options d’installation et dépannage PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T12:46:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw nécessite **Node 22.14 ou plus récent**. **Node 24 est le runtime par défaut et recommandé** pour les installations, la CI et les workflows de publication. Node 22 reste pris en charge via la ligne LTS active. Le [script d’installation](/install#alternative-install-methods) détectera et installera Node automatiquement — cette page est destinée aux cas où vous souhaitez configurer Node vous-même et vous assurer que tout est correctement branché (versions, PATH, installations globales).

## Vérifier votre version

```bash
node -v
```

Si cela affiche `v24.x.x` ou supérieur, vous êtes sur la valeur par défaut recommandée. Si cela affiche `v22.14.x` ou supérieur, vous êtes sur le chemin pris en charge Node 22 LTS, mais nous recommandons tout de même de passer à Node 24 lorsque cela vous convient. Si Node n’est pas installé ou si la version est trop ancienne, choisissez une méthode d’installation ci-dessous.

## Installer Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (recommandé) :

    ```bash
    brew install node
    ```

    Ou téléchargez l’installeur macOS depuis [nodejs.org](https://nodejs.org/).

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

    Ou téléchargez l’installeur Windows depuis [nodejs.org](https://nodejs.org/).

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
  Assurez-vous que votre gestionnaire de versions est initialisé dans le fichier de démarrage de votre shell (`~/.zshrc` ou `~/.bashrc`). Sinon, `openclaw` peut être introuvable dans les nouvelles sessions de terminal parce que le PATH n’inclura pas le répertoire bin de Node.
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
  <Step title="L’ajouter au fichier de démarrage de votre shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Ajoutez à `~/.zshrc` ou `~/.bashrc` :

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

### Erreurs de permissions sur `npm install -g` (Linux)

Si vous voyez des erreurs `EACCES`, basculez le préfixe global npm vers un répertoire accessible en écriture par l’utilisateur :

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Ajoutez la ligne `export PATH=...` à votre `~/.bashrc` ou `~/.zshrc` pour la rendre permanente.

## Lié

- [Vue d’ensemble de l’installation](/install) — toutes les méthodes d’installation
- [Mise à jour](/install/updating) — garder OpenClaw à jour
- [Premiers pas](/fr/start/getting-started) — premières étapes après l’installation
