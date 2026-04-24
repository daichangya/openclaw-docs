---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corriger les problèmes de démarrage CDP de Chrome/Brave/Edge/Chromium pour le contrôle du navigateur OpenClaw sur Linux
title: Dépannage du navigateur
x-i18n:
    generated_at: "2026-04-24T07:34:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Problème : « Failed to start Chrome CDP on port 18800 »

Le serveur de contrôle du navigateur OpenClaw ne parvient pas à lancer Chrome/Brave/Edge/Chromium avec l’erreur :

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Cause racine

Sur Ubuntu (et de nombreuses distributions Linux), l’installation Chromium par défaut est un **package snap**. Le confinement AppArmor de snap interfère avec la manière dont OpenClaw lance et surveille le processus navigateur.

La commande `apt install chromium` installe un package stub qui redirige vers snap :

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ce n’est PAS un vrai navigateur - c’est juste un wrapper.

### Solution 1 : installer Google Chrome (recommandé)

Installez le package officiel Google Chrome `.deb`, qui n’est pas sandboxé par snap :

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # en cas d’erreurs de dépendances
```

Puis mettez à jour votre configuration OpenClaw (`~/.openclaw/openclaw.json`) :

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

### Solution 2 : utiliser Chromium snap avec le mode attach-only

Si vous devez utiliser Chromium snap, configurez OpenClaw pour qu’il se rattache à un navigateur démarré manuellement :

1. Mettez à jour la configuration :

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

2. Démarrez Chromium manuellement :

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Facultativement, créez un service systemd utilisateur pour démarrer Chrome automatiquement :

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

Activez-le avec : `systemctl --user enable --now openclaw-browser.service`

### Vérifier que le navigateur fonctionne

Vérifier l’état :

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Tester la navigation :

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Référence de configuration

| Option                   | Description                                                          | Par défaut                                                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Activer le contrôle du navigateur                                    | `true`                                                      |
| `browser.executablePath` | Chemin vers un binaire de navigateur basé sur Chromium (Chrome/Brave/Edge/Chromium) | auto-détecté (préfère le navigateur par défaut s’il est basé sur Chromium) |
| `browser.headless`       | Exécuter sans interface graphique                                    | `false`                                                     |
| `browser.noSandbox`      | Ajouter l’option `--no-sandbox` (nécessaire pour certaines configurations Linux) | `false`                                                     |
| `browser.attachOnly`     | Ne pas lancer le navigateur, seulement s’y rattacher                | `false`                                                     |
| `browser.cdpPort`        | Port Chrome DevTools Protocol                                        | `18800`                                                     |

### Problème : « No Chrome tabs found for profile="user" »

Vous utilisez un profil `existing-session` / Chrome MCP. OpenClaw voit Chrome localement,
mais aucun onglet ouvert n’est disponible pour s’y rattacher.

Options de correction :

1. **Utiliser le navigateur géré :** `openclaw browser start --browser-profile openclaw`
   (ou définissez `browser.defaultProfile: "openclaw"`).
2. **Utiliser Chrome MCP :** assurez-vous que Chrome local fonctionne avec au moins un onglet ouvert, puis réessayez avec `--browser-profile user`.

Remarques :

- `user` est limité à l’hôte. Pour les serveurs Linux, conteneurs ou hôtes distants, préférez les profils CDP.
- `user` / autres profils `existing-session` conservent les limites actuelles de Chrome MCP :
  actions pilotées par référence, hooks d’envoi d’un seul fichier, pas de surcharges de délai de dialogue, pas de
  `wait --load networkidle`, et pas de `responsebody`, export PDF, interception de téléchargement, ni actions par lot.
- Les profils `openclaw` locaux attribuent automatiquement `cdpPort`/`cdpUrl` ; ne définissez ceux-ci que pour le CDP distant.
- Les profils CDP distants acceptent `http://`, `https://`, `ws://`, et `wss://`.
  Utilisez HTTP(S) pour la découverte `/json/version`, ou WS(S) lorsque votre service navigateur
  vous donne une URL directe de socket DevTools.

## Articles connexes

- [Navigateur](/fr/tools/browser)
- [Connexion navigateur](/fr/tools/browser-login)
- [Dépannage navigateur WSL2](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
