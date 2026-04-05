---
read_when:
    - Vous voulez un guide pas à pas du TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis du TUI
summary: 'Interface terminal (TUI) : se connecter à la Gateway depuis n’importe quelle machine'
title: TUI
x-i18n:
    generated_at: "2026-04-05T12:58:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (interface terminal)

## Démarrage rapide

1. Démarrez la Gateway.

```bash
openclaw gateway
```

2. Ouvrez le TUI.

```bash
openclaw tui
```

3. Tapez un message et appuyez sur Entrée.

Gateway distante :

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Utilisez `--password` si votre Gateway utilise une authentification par mot de passe.

## Ce que vous voyez

- En-tête : URL de connexion, agent actuel, session actuelle.
- Journal de chat : messages utilisateur, réponses de l’assistant, avis système, cartes d’outils.
- Ligne d’état : état de connexion/exécution (connexion, en cours, streaming, inactif, erreur).
- Pied de page : état de connexion + agent + session + modèle + think/fast/verbose/reasoning + nombre de tokens + deliver.
- Entrée : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (par ex. `main`, `research`). La Gateway expose la liste.
- Les sessions appartiennent à l’agent actuel.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous tapez `/session main`, le TUI l’étend en `agent:<currentAgent>:main`.
  - Si vous tapez `/session agent:other:main`, vous basculez explicitement vers la session de cet agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent a plusieurs sessions.
  - `global` : le TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent actuel + la session actuelle sont toujours visibles dans le pied de page.

## Envoi + distribution

- Les messages sont envoyés à la Gateway ; la distribution aux fournisseurs est désactivée par défaut.
- Activez la distribution :
  - `/deliver on`
  - ou via le panneau Paramètres
  - ou démarrez avec `openclaw tui --deliver`

## Sélecteurs + overlays

- Sélecteur de modèle : liste les modèles disponibles et définit le remplacement pour la session.
- Sélecteur d’agent : choisir un autre agent.
- Sélecteur de session : n’affiche que les sessions pour l’agent actuel.
- Paramètres : activer/désactiver deliver, le développement de la sortie des outils et la visibilité du raisonnement.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer l’entrée (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : activer/désactiver le développement de la sortie des outils
- Ctrl+T : activer/désactiver la visibilité du raisonnement (recharge l’historique)

## Commandes slash

Principales :

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Contrôles de session :

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias : `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Cycle de vie de la session :

- `/new` ou `/reset` (réinitialise la session)
- `/abort` (interrompt l’exécution active)
- `/settings`
- `/exit`

Les autres commandes slash de la Gateway (par exemple `/context`) sont transférées à la Gateway et affichées comme sortie système. Voir [Commandes slash](/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne avec `!` pour exécuter une commande shell locale sur l’hôte du TUI.
- Le TUI demande une fois par session l’autorisation d’exécuter localement ; si vous refusez, `!` reste désactivé pour la session.
- Les commandes s’exécutent dans un shell non interactif neuf dans le répertoire de travail du TUI (pas de `cd`/env persistant).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme message normal ; les espaces initiaux ne déclenchent pas l’exécution locale.

## Sortie des outils

- Les appels d’outils s’affichent sous forme de cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduite/développée.
- Pendant l’exécution des outils, les mises à jour partielles sont diffusées dans la même carte.

## Couleurs du terminal

- Le TUI conserve le texte du corps de l’assistant dans la couleur de premier plan par défaut de votre terminal afin que les terminaux sombres et clairs restent lisibles.
- Si votre terminal utilise un fond clair et que l’auto-détection est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer la palette sombre d’origine à la place, définissez `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, le TUI charge l’historique le plus récent (200 messages par défaut).
- Les réponses en streaming sont mises à jour sur place jusqu’à leur finalisation.
- Le TUI écoute également les événements d’outils des agents pour des cartes d’outils plus riches.

## Détails de connexion

- Le TUI s’enregistre auprès de la Gateway avec `mode: "tui"`.
- Les reconnexions affichent un message système ; les lacunes d’événements apparaissent dans le journal.

## Options

- `--url <url>` : URL WebSocket de la Gateway (par défaut depuis la configuration ou `ws://127.0.0.1:<port>`)
- `--token <token>` : jeton de la Gateway (si requis)
- `--password <password>` : mot de passe de la Gateway (si requis)
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : distribuer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : remplacer le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (par défaut `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : entrées d’historique à charger (par défaut `200`)

Remarque : lorsque vous définissez `--url`, le TUI ne revient pas à la configuration ni aux identifiants d’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans le TUI pour confirmer que la Gateway est connectée et inactive/occupée.
- Vérifiez les journaux de la Gateway : `openclaw logs --follow`.
- Confirmez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de chat, activez la distribution (`/deliver on` ou `--deliver`).

## Dépannage de la connexion

- `disconnected` : assurez-vous que la Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être en portée globale ou vous n’avez pas encore de sessions.

## Liens associés

- [Control UI](/web/control-ui) — interface de contrôle basée sur le web
- [Référence CLI](/cli) — référence complète des commandes CLI
