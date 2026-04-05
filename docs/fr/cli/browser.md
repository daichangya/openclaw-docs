---
read_when:
    - Vous utilisez `openclaw browser` et souhaitez des exemples pour des tâches courantes
    - Vous souhaitez contrôler un navigateur exécuté sur une autre machine via un hôte de nœud
    - Vous souhaitez vous attacher à votre Chrome local déjà connecté via Chrome MCP
summary: Référence CLI pour `openclaw browser` (cycle de vie, profils, onglets, actions, état et débogage)
title: browser
x-i18n:
    generated_at: "2026-04-05T12:37:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gérez la surface de contrôle du navigateur d’OpenClaw et exécutez des actions de navigateur (cycle de vie, profils, onglets, snapshots, captures d’écran, navigation, saisie, émulation d’état et débogage).

Liens associés :

- Outil de navigateur + API : [Browser tool](/tools/browser)

## Indicateurs courants

- `--url <gatewayWsUrl>` : URL WebSocket de la Gateway (par défaut selon la configuration).
- `--token <token>` : jeton Gateway (si requis).
- `--timeout <ms>` : délai d’attente de la requête (ms).
- `--expect-final` : attendre une réponse finale de la Gateway.
- `--browser-profile <name>` : choisir un profil de navigateur (par défaut selon la configuration).
- `--json` : sortie lisible par machine (lorsque prise en charge).

## Démarrage rapide (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Cycle de vie

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Remarques :

- Pour les profils `attachOnly` et CDP distants, `openclaw browser stop` ferme la
  session de contrôle active et efface les remplacements d’émulation temporaires, même lorsque
  OpenClaw n’a pas lancé lui-même le processus du navigateur.
- Pour les profils locaux gérés, `openclaw browser stop` arrête le processus de navigateur
  lancé.

## Si la commande est absente

Si `openclaw browser` est une commande inconnue, vérifiez `plugins.allow` dans
`~/.openclaw/openclaw.json`.

Lorsque `plugins.allow` est présent, le plugin de navigateur intégré doit être listé
explicitement :

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` ne restaure pas la sous-commande CLI lorsque la
liste d’autorisation des plugins exclut `browser`.

Voir aussi : [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profils

Les profils sont des configurations nommées de routage de navigateur. En pratique :

- `openclaw` : lance ou attache une instance Chrome dédiée gérée par OpenClaw (répertoire de données utilisateur isolé).
- `user` : contrôle votre session Chrome déjà connectée via Chrome DevTools MCP.
- profils CDP personnalisés : pointent vers un point de terminaison CDP local ou distant.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utiliser un profil spécifique :

```bash
openclaw browser --browser-profile work tabs
```

## Onglets

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / capture d’écran / actions

Snapshot :

```bash
openclaw browser snapshot
```

Capture d’écran :

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Remarques :

- `--full-page` est réservé aux captures de page ; il ne peut pas être combiné avec `--ref`
  ou `--element`.
- Les profils `existing-session` / `user` prennent en charge les captures d’écran de page et les captures
  avec `--ref` à partir de la sortie snapshot, mais pas les captures CSS `--element`.

Naviguer/cliquer/saisir (automatisation d’interface basée sur des refs) :

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Assistants pour fichiers + boîtes de dialogue :

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## État et stockage

Fenêtre d’affichage + émulation :

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + stockage :

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Débogage

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome existant via MCP

Utilisez le profil intégré `user`, ou créez votre propre profil `existing-session` :

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Ce chemin est limité à l’hôte. Pour Docker, les serveurs headless, Browserless ou d’autres configurations distantes, utilisez plutôt un profil CDP.

Limites actuelles de `existing-session` :

- les actions pilotées par snapshot utilisent des refs, pas des sélecteurs CSS
- `click` est limité au clic gauche
- `type` ne prend pas en charge `slowly=true`
- `press` ne prend pas en charge `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` et `evaluate` rejettent
  les remplacements de délai d’attente par appel
- `select` ne prend en charge qu’une seule valeur
- `wait --load networkidle` n’est pas pris en charge
- les téléversements de fichiers nécessitent `--ref` / `--input-ref`, ne prennent pas en charge CSS
  `--element`, et ne prennent actuellement en charge qu’un seul fichier à la fois
- les hooks de boîte de dialogue ne prennent pas en charge `--timeout`
- les captures d’écran prennent en charge les captures de page et `--ref`, mais pas CSS `--element`
- `responsebody`, l’interception de téléchargement, l’export PDF et les actions par lot
  nécessitent toujours un navigateur géré ou un profil CDP brut

## Contrôle de navigateur à distance (proxy d’hôte de nœud)

Si la Gateway s’exécute sur une machine différente de celle du navigateur, exécutez un **hôte de nœud** sur la machine qui dispose de Chrome/Brave/Edge/Chromium. La Gateway transmettra les actions du navigateur à ce nœud (aucun serveur de contrôle de navigateur séparé n’est requis).

Utilisez `gateway.nodes.browser.mode` pour contrôler le routage automatique et `gateway.nodes.browser.node` pour épingler un nœud spécifique si plusieurs sont connectés.

Sécurité + configuration distante : [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
