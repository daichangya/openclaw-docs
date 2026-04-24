---
read_when:
    - Modifier la sortie ou les formats de journalisation
    - Déboguer la sortie de la CLI ou du gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et formatage de la console
title: Journalisation du Gateway
x-i18n:
    generated_at: "2026-04-24T07:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Journalisation

Pour une vue d’ensemble orientée utilisateur (CLI + Control UI + configuration), voir [/logging](/fr/logging).

OpenClaw a deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface Debug).
- **Journaux de fichiers** (lignes JSON) écrits par le logger du gateway.

## Logger basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte du gateway.
- Le chemin du fichier journal et le niveau peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est un objet JSON par ligne.

L’onglet Logs de la Control UI suit ce fichier via le gateway (`logs.tail`).
La CLI peut faire de même :

```bash
openclaw logs --follow
```

**Verbose vs. niveaux de journal**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité de la console** (et le style des journaux WS) ; il **n’augmente pas**
  le niveau des journaux de fichiers.
- Pour capturer dans les journaux de fichiers les détails visibles uniquement en mode verbose, définissez `logging.level` sur `debug` ou
  `trace`.

## Capture de la console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez régler la verbosité de la console indépendamment via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Masquage des résumés d’outils

Les résumés d’outils verboses (par ex. `🛠️ Exec: ...`) peuvent masquer les jetons sensibles avant qu’ils n’atteignent le
flux console. Cela ne concerne **que les outils** et ne modifie pas les journaux de fichiers.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (ajout automatique de `gi`), ou `/pattern/flags` si vous avez besoin de drapeaux personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les drapeaux CLI, les champs JSON, les en-têtes bearer, les blocs PEM et les préfixes de jetons populaires.

## Journaux WebSocket du Gateway

Le gateway affiche les journaux du protocole WebSocket en deux modes :

- **Mode normal (sans `--verbose`)** : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbose (`--verbose`)** : affiche tout le trafic requête/réponse WS.

### Style des journaux WS

`openclaw gateway` prend en charge un changement de style par gateway :

- `--ws-log auto` (par défaut) : le mode normal est optimisé ; le mode verbose utilise une sortie compacte
- `--ws-log compact` : sortie compacte (requête/réponse appariées) en mode verbose
- `--ws-log full` : sortie complète par frame en mode verbose
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
# optimisé (seulement erreurs/lenteurs)
openclaw gateway

# afficher tout le trafic WS (apparié)
openclaw gateway --verbose --ws-log compact

# afficher tout le trafic WS (métadonnées complètes)
openclaw gateway --verbose --ws-log full
```

## Formatage de la console (journalisation des sous-systèmes)

Le formateur de console est **conscient du TTY** et affiche des lignes cohérentes et préfixées.
Les loggers de sous-système gardent une sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration par niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), en respectant `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les segments initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-loggers par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans formatage)
- **Styles de console** (par ex. `pretty | compact | json`)
- **Niveau de journal console** distinct du niveau de journal fichier (le fichier conserve tout le détail lorsque `logging.level` est défini sur `debug`/`trace`)
- **Les corps de messages WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela permet de garder stables les journaux de fichiers existants tout en rendant la sortie interactive facile à parcourir.

## Articles connexes

- [Vue d’ensemble de la journalisation](/fr/logging)
- [Export de diagnostics](/fr/gateway/diagnostics)
