---
read_when:
    - Vous voulez un guide pas à pas du TUI adapté aux débutants
    - Vous avez besoin de la liste complète des fonctionnalités, commandes et raccourcis du TUI
summary: 'interface terminal (TUI) : se connecter à la Gateway ou s’exécuter localement en mode embarqué'
title: TUI
x-i18n:
    generated_at: "2026-04-24T07:40:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## Démarrage rapide

### Mode Gateway

1. Démarrez la Gateway.

```bash
openclaw gateway
```

2. Ouvrez le TUI.

```bash
openclaw tui
```

3. Saisissez un message et appuyez sur Entrée.

Gateway distante :

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Utilisez `--password` si votre Gateway utilise une authentification par mot de passe.

### Mode local

Exécutez le TUI sans Gateway :

```bash
openclaw chat
# or
openclaw tui --local
```

Remarques :

- `openclaw chat` et `openclaw terminal` sont des alias de `openclaw tui --local`.
- `--local` ne peut pas être combiné avec `--url`, `--token` ou `--password`.
- Le mode local utilise directement le runtime d’agent embarqué. La plupart des outils locaux fonctionnent, mais les fonctionnalités réservées à la Gateway ne sont pas disponibles.

## Ce que vous voyez

- En-tête : URL de connexion, agent courant, session courante.
- Journal du chat : messages utilisateur, réponses de l’assistant, notifications système, cartes d’outils.
- Ligne d’état : état de connexion/exécution (connexion, en cours d’exécution, streaming, inactif, erreur).
- Pied de page : état de connexion + agent + session + modèle + think/fast/verbose/trace/reasoning + nombre de tokens + deliver.
- Entrée : éditeur de texte avec autocomplétion.

## Modèle mental : agents + sessions

- Les agents sont des slugs uniques (par ex. `main`, `research`). La Gateway expose la liste.
- Les sessions appartiennent à l’agent courant.
- Les clés de session sont stockées sous la forme `agent:<agentId>:<sessionKey>`.
  - Si vous tapez `/session main`, le TUI l’étend en `agent:<currentAgent>:main`.
  - Si vous tapez `/session agent:other:main`, vous basculez explicitement vers cette session d’agent.
- Portée de session :
  - `per-sender` (par défaut) : chaque agent possède de nombreuses sessions.
  - `global` : le TUI utilise toujours la session `global` (le sélecteur peut être vide).
- L’agent courant + la session courante sont toujours visibles dans le pied de page.

## Envoi + livraison

- Les messages sont envoyés à la Gateway ; la livraison aux fournisseurs est désactivée par défaut.
- Activez la livraison :
  - `/deliver on`
  - ou le panneau Settings
  - ou démarrez avec `openclaw tui --deliver`

## Sélecteurs + overlays

- Sélecteur de modèle : liste les modèles disponibles et définit la redéfinition de session.
- Sélecteur d’agent : choisissez un autre agent.
- Sélecteur de session : n’affiche que les sessions de l’agent courant.
- Settings : active/désactive deliver, l’expansion de sortie des outils et la visibilité de la réflexion.

## Raccourcis clavier

- Entrée : envoyer le message
- Échap : interrompre l’exécution active
- Ctrl+C : effacer l’entrée (appuyez deux fois pour quitter)
- Ctrl+D : quitter
- Ctrl+L : sélecteur de modèle
- Ctrl+G : sélecteur d’agent
- Ctrl+P : sélecteur de session
- Ctrl+O : activer/désactiver l’expansion de sortie des outils
- Ctrl+T : activer/désactiver la visibilité de la réflexion (recharge l’historique)

## Commandes slash

Noyau :

- `/help`
- `/status`
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Contrôles de session :

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
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

Mode local uniquement :

- `/auth [provider]` ouvre le flux d’authentification/connexion du fournisseur à l’intérieur du TUI.

Les autres commandes slash de la Gateway (par exemple `/context`) sont transmises à la Gateway et affichées comme sortie système. Voir [Commandes slash](/fr/tools/slash-commands).

## Commandes shell locales

- Préfixez une ligne avec `!` pour exécuter une commande shell locale sur l’hôte du TUI.
- Le TUI demande une fois par session l’autorisation d’exécuter localement ; si vous refusez, `!` reste désactivé pour la session.
- Les commandes s’exécutent dans un shell non interactif neuf dans le répertoire de travail du TUI (pas de `cd`/env persistant).
- Les commandes shell locales reçoivent `OPENCLAW_SHELL=tui-local` dans leur environnement.
- Un `!` seul est envoyé comme un message normal ; les espaces en tête ne déclenchent pas l’exécution locale.

## Réparer les configurations depuis le TUI local

Utilisez le mode local lorsque la configuration actuelle est déjà valide et que vous voulez que le
runtime embarqué de l’agent l’inspecte sur la même machine, la compare à la documentation,
et aide à corriger les écarts sans dépendre d’une Gateway en cours d’exécution.

Si `openclaw config validate` échoue déjà, commencez plutôt par `openclaw configure`
ou `openclaw doctor --fix`. `openclaw chat` ne contourne pas la protection contre les
configurations invalides.

Boucle typique :

1. Démarrez le mode local :

```bash
openclaw chat
```

2. Demandez à l’agent ce que vous voulez vérifier, par exemple :

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Utilisez des commandes shell locales pour obtenir des preuves exactes et valider :

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Appliquez des modifications ciblées avec `openclaw config set` ou `openclaw configure`, puis relancez `!openclaw config validate`.
5. Si Doctor recommande une migration ou une réparation automatique, examinez-la puis exécutez `!openclaw doctor --fix`.

Conseils :

- Préférez `openclaw config set` ou `openclaw configure` à la modification manuelle de `openclaw.json`.
- `openclaw docs "<query>"` recherche dans l’index de documentation en direct depuis la même machine.
- `openclaw config validate --json` est utile lorsque vous voulez des erreurs structurées de schéma et de SecretRef/résolubilité.

## Sortie des outils

- Les appels d’outils s’affichent comme des cartes avec arguments + résultats.
- Ctrl+O bascule entre les vues réduite/développée.
- Pendant l’exécution des outils, les mises à jour partielles arrivent dans la même carte.

## Couleurs du terminal

- Le TUI conserve le texte principal de l’assistant dans la couleur de premier plan par défaut de votre terminal afin que les terminaux sombres et clairs restent lisibles.
- Si votre terminal utilise un fond clair et que l’auto-détection est incorrecte, définissez `OPENCLAW_THEME=light` avant de lancer `openclaw tui`.
- Pour forcer la palette sombre d’origine, définissez plutôt `OPENCLAW_THEME=dark`.

## Historique + streaming

- À la connexion, le TUI charge l’historique récent (200 messages par défaut).
- Les réponses en streaming se mettent à jour sur place jusqu’à finalisation.
- Le TUI écoute aussi les événements d’outils de l’agent pour des cartes d’outils plus riches.

## Détails de connexion

- Le TUI s’enregistre auprès de la Gateway comme `mode: "tui"`.
- Les reconnexions affichent un message système ; les lacunes d’événements sont signalées dans le journal.

## Options

- `--local` : exécuter avec le runtime d’agent embarqué local
- `--url <url>` : URL WebSocket de la Gateway (par défaut depuis la configuration ou `ws://127.0.0.1:<port>`)
- `--token <token>` : jeton Gateway (si requis)
- `--password <password>` : mot de passe Gateway (si requis)
- `--session <key>` : clé de session (par défaut : `main`, ou `global` lorsque la portée est globale)
- `--deliver` : livrer les réponses de l’assistant au fournisseur (désactivé par défaut)
- `--thinking <level>` : redéfinir le niveau de réflexion pour les envois
- `--message <text>` : envoyer un message initial après la connexion
- `--timeout-ms <ms>` : délai d’expiration de l’agent en ms (par défaut `agents.defaults.timeoutSeconds`)
- `--history-limit <n>` : nombre d’entrées d’historique à charger (par défaut `200`)

Remarque : lorsque vous définissez `--url`, le TUI ne revient pas aux identifiants de configuration ou d’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
En mode local, ne passez pas `--url`, `--token` ou `--password`.

## Dépannage

Aucune sortie après l’envoi d’un message :

- Exécutez `/status` dans le TUI pour confirmer que la Gateway est connectée et inactive/occupée.
- Vérifiez les journaux de la Gateway : `openclaw logs --follow`.
- Confirmez que l’agent peut s’exécuter : `openclaw status` et `openclaw models status`.
- Si vous attendez des messages dans un canal de chat, activez la livraison (`/deliver on` ou `--deliver`).

## Dépannage de connexion

- `disconnected` : assurez-vous que la Gateway est en cours d’exécution et que vos `--url/--token/--password` sont corrects.
- Aucun agent dans le sélecteur : vérifiez `openclaw agents list` et votre configuration de routage.
- Sélecteur de session vide : vous êtes peut-être en portée globale ou vous n’avez pas encore de sessions.

## Liens associés

- [Control UI](/fr/web/control-ui) — interface de contrôle web
- [Config](/fr/cli/config) — inspecter, valider et modifier `openclaw.json`
- [Doctor](/fr/cli/doctor) — réparations guidées et vérifications de migration
- [Référence CLI](/fr/cli) — référence complète des commandes CLI
