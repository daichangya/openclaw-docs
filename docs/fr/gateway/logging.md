---
read_when:
    - Modifier la sortie ou les formats de journalisation
    - Déboguer la sortie CLI ou gateway
summary: Surfaces de journalisation, journaux de fichiers, styles de journaux WS et formatage console
title: Journalisation de la Gateway
x-i18n:
    generated_at: "2026-04-05T12:42:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Journalisation

Pour une vue d’ensemble orientée utilisateur (CLI + interface Control + configuration), voir [/logging](/logging).

OpenClaw possède deux « surfaces » de journalisation :

- **Sortie console** (ce que vous voyez dans le terminal / l’interface Debug).
- **Journaux de fichiers** (lignes JSON) écrits par le logger de la gateway.

## Logger basé sur des fichiers

- Le fichier journal rotatif par défaut se trouve sous `/tmp/openclaw/` (un fichier par jour) : `openclaw-YYYY-MM-DD.log`
  - La date utilise le fuseau horaire local de l’hôte gateway.
- Le chemin du fichier journal et le niveau peuvent être configurés via `~/.openclaw/openclaw.json` :
  - `logging.file`
  - `logging.level`

Le format du fichier est un objet JSON par ligne.

L’onglet Logs de l’interface Control suit ce fichier via la gateway (`logs.tail`).
La CLI peut faire la même chose :

```bash
openclaw logs --follow
```

**Verbose vs niveaux de journalisation**

- Les **journaux de fichiers** sont contrôlés exclusivement par `logging.level`.
- `--verbose` n’affecte que la **verbosité console** (et le style des journaux WS) ; il n’augmente **pas**
  le niveau des journaux de fichiers.
- Pour capturer dans les journaux de fichiers les détails visibles uniquement en mode verbose, définissez `logging.level` sur `debug` ou
  `trace`.

## Capture console

La CLI capture `console.log/info/warn/error/debug/trace` et les écrit dans les journaux de fichiers,
tout en continuant à les afficher sur stdout/stderr.

Vous pouvez ajuster la verbosité console indépendamment via :

- `logging.consoleLevel` (par défaut `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Masquage des résumés d’outils

Les résumés d’outils verboses (par ex. `🛠️ Exec: ...`) peuvent masquer les jetons sensibles avant qu’ils n’atteignent le
flux console. Cela concerne **uniquement les outils** et ne modifie pas les journaux de fichiers.

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : tableau de chaînes regex (remplace les valeurs par défaut)
  - Utilisez des chaînes regex brutes (auto `gi`), ou `/pattern/flags` si vous avez besoin d’indicateurs personnalisés.
  - Les correspondances sont masquées en conservant les 6 premiers + 4 derniers caractères (longueur >= 18), sinon `***`.
  - Les valeurs par défaut couvrent les affectations de clés courantes, les flags CLI, les champs JSON, les en-têtes bearer, les blocs PEM et les préfixes de jetons populaires.

## Journaux WebSocket de la gateway

La gateway affiche les journaux du protocole WebSocket dans deux modes :

- **Mode normal** (sans `--verbose`) : seuls les résultats RPC « intéressants » sont affichés :
  - erreurs (`ok=false`)
  - appels lents (seuil par défaut : `>= 50ms`)
  - erreurs d’analyse
- **Mode verbose** (`--verbose`) : affiche tout le trafic requête/réponse WS.

### Style des journaux WS

`openclaw gateway` prend en charge un sélecteur de style par gateway :

- `--ws-log auto` (par défaut) : le mode normal est optimisé ; le mode verbose utilise une sortie compacte
- `--ws-log compact` : sortie compacte (requête/réponse appariées) en mode verbose
- `--ws-log full` : sortie complète par trame en mode verbose
- `--compact` : alias de `--ws-log compact`

Exemples :

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Formatage console (journalisation des sous-systèmes)

Le formateur console est **conscient du TTY** et affiche des lignes cohérentes avec préfixe.
Les loggers de sous-système gardent une sortie groupée et facile à parcourir.

Comportement :

- **Préfixes de sous-système** sur chaque ligne (par ex. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Couleurs de sous-système** (stables par sous-système) plus coloration par niveau
- **Couleur lorsque la sortie est un TTY ou que l’environnement ressemble à un terminal riche** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), respecte `NO_COLOR`
- **Préfixes de sous-système raccourcis** : supprime les segments initiaux `gateway/` + `channels/`, conserve les 2 derniers segments (par ex. `whatsapp/outbound`)
- **Sous-loggers par sous-système** (préfixe automatique + champ structuré `{ subsystem }`)
- **`logRaw()`** pour la sortie QR/UX (sans préfixe, sans formatage)
- **Styles console** (par ex. `pretty | compact | json`)
- **Niveau de journalisation console** séparé du niveau de journalisation fichier (le fichier conserve le détail complet lorsque `logging.level` est défini sur `debug`/`trace`)
- **Les corps de message WhatsApp** sont journalisés au niveau `debug` (utilisez `--verbose` pour les voir)

Cela garde les journaux de fichiers existants stables tout en rendant la sortie interactive facile à parcourir.
