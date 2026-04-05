---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Corriger les problèmes de démarrage CDP de Chrome/Brave/Edge/Chromium pour le contrôle du navigateur OpenClaw sous Linux
title: Dépannage du navigateur
x-i18n:
    generated_at: "2026-04-05T12:55:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Dépannage du navigateur (Linux)

## Problème : « Failed to start Chrome CDP on port 18800 »

Le serveur de contrôle du navigateur d’OpenClaw ne parvient pas à lancer Chrome/Brave/Edge/Chromium avec l’erreur suivante :

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Cause racine

Sous Ubuntu (et de nombreuses distributions Linux), l’installation Chromium par défaut est un **paquet snap**. Le confinement AppArmor de snap interfère avec la manière dont OpenClaw lance et surveille le processus du navigateur.

La commande `apt install chromium` installe un paquet factice qui redirige vers snap :

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ce n’est PAS un véritable navigateur : c’est simplement un wrapper.

### Solution 1 : Installer Google Chrome (recommandé)

Installez le paquet `.deb` officiel de Google Chrome, qui n’est pas isolé par snap :

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # en cas d’erreurs de dépendances
```

Mettez ensuite à jour votre configuration OpenClaw (`~/.openclaw/openclaw.json`) :

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

### Solution 2 : Utiliser Chromium snap avec le mode attachement uniquement

Si vous devez utiliser Chromium snap, configurez OpenClaw pour s’attacher à un navigateur démarré manuellement :

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

3. Vous pouvez éventuellement créer un service utilisateur systemd pour démarrer Chrome automatiquement :

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

Vérifiez l’état :

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Testez la navigation :

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Référence de configuration

| Option                   | Description                                                          | Par défaut                                                  |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Activer le contrôle du navigateur                                    | `true`                                                      |
| `browser.executablePath` | Chemin vers un binaire de navigateur basé sur Chromium (Chrome/Brave/Edge/Chromium) | détection automatique (préfère le navigateur par défaut s’il est basé sur Chromium) |
| `browser.headless`       | Exécuter sans interface graphique                                    | `false`                                                     |
| `browser.noSandbox`      | Ajouter le flag `--no-sandbox` (nécessaire pour certaines configurations Linux) | `false`                                                     |
| `browser.attachOnly`     | Ne pas lancer le navigateur, seulement s’y attacher                  | `false`                                                     |
| `browser.cdpPort`        | Port du Chrome DevTools Protocol                                     | `18800`                                                     |

### Problème : « No Chrome tabs found for profile=\"user\" »

Vous utilisez un profil `existing-session` / Chrome MCP. OpenClaw peut voir Chrome en local,
mais aucun onglet ouvert n’est disponible pour s’y attacher.

Options de correction :

1. **Utiliser le navigateur géré :** `openclaw browser start --browser-profile openclaw`
   (ou définir `browser.defaultProfile: "openclaw"`).
2. **Utiliser Chrome MCP :** assurez-vous que Chrome local est en cours d’exécution avec au moins un onglet ouvert, puis réessayez avec `--browser-profile user`.

Remarques :

- `user` est réservé à l’hôte local. Pour les serveurs Linux, les conteneurs ou les hôtes distants, préférez les profils CDP.
- `user` / les autres profils `existing-session` conservent les limites actuelles de Chrome MCP :
  actions pilotées par référence, hooks de téléversement d’un seul fichier, aucune substitution de délai d’expiration de boîte de dialogue, pas de
  `wait --load networkidle`, et pas de `responsebody`, d’export PDF, d’interception de téléchargement ni d’actions par lot.
- Les profils locaux `openclaw` attribuent automatiquement `cdpPort`/`cdpUrl` ; ne les définissez que pour le CDP distant.
- Les profils CDP distants acceptent `http://`, `https://`, `ws://` et `wss://`.
  Utilisez HTTP(S) pour la découverte `/json/version`, ou WS(S) lorsque votre service
  de navigateur vous fournit une URL de socket DevTools directe.
