---
read_when:
    - Ajustement de l'analyse des directives de réflexion, du mode rapide ou du mode verbeux, ou de leurs valeurs par défaut
summary: Syntaxe des directives pour /think, /fast, /verbose et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-05T12:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Niveaux de réflexion (directives /think)

## Ce que cela fait

- Directive en ligne dans tout corps de message entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → « réfléchir »
  - low → « bien réfléchir »
  - medium → « réfléchir davantage »
  - high → « ultraréflexion » (budget maximal)
  - xhigh → « ultraréflexion+ » (modèles GPT-5.2 + Codex uniquement)
  - adaptive → budget de raisonnement adaptatif géré par le provider (pris en charge pour la famille de modèles Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest`, `max` correspondent à `high`.
- Remarques sur les providers :
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu'aucun niveau de réflexion explicite n'est défini.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` divulgués par le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge qu'une réflexion binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé à `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` à `thinking: { type: "disabled" }` et tout niveau autre que `off` à `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n'accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive en ligne sur le message (s'applique uniquement à ce message).
2. Surcharge de session (définie en envoyant un message composé uniquement d'une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : `adaptive` pour les modèles Anthropic Claude 4.6, `low` pour les autres modèles capables de raisonner, `off` sinon.

## Définir une valeur par défaut de session

- Envoyez un message contenant **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste actif pour la session en cours (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation sur inactivité de la session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par ex. `/thinking big`), la commande est rejetée avec une indication et l'état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi intégré** : le niveau résolu est transmis au runtime d'agent Pi en cours de processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message composé uniquement d'une directive active/désactive une surcharge de mode rapide pour la session et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l'état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` en ligne / composé uniquement d'une directive
  2. Surcharge de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur Codex Responses. OpenClaw conserve un seul basculement `/fast` partagé entre les deux chemins d'authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle explicites Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw ignore toujours l'injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.

## Directives verbeuses (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message composé uniquement d'une directive active/désactive le mode verbeux de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l'état.
- `/verbose off` stocke une surcharge de session explicite ; effacez-la via l'interface Sessions en choisissant `inherit`.
- La directive en ligne n'affecte que ce message ; les valeurs par défaut de session/globales s'appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbeux actuel.
- Lorsque le mode verbeux est activé, les agents qui émettent des résultats d'outils structurés (Pi, autres agents JSON) renvoient chaque appel d'outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d'outils sont envoyés dès le démarrage de chaque outil (bulles séparées), et non sous forme de deltas de streaming.
- Les résumés d'échec d'outil restent visibles en mode normal, mais les suffixes de détail d'erreur bruts sont masqués sauf si verbose vaut `on` ou `full`.
- Lorsque verbose vaut `full`, les sorties d'outil sont aussi transmises après leur fin (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu'une exécution est en cours, les bulles d'outil suivantes respectent le nouveau paramètre.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message composé uniquement d'une directive active/désactive l'affichage des blocs de réflexion dans les réponses.
- Lorsqu'il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans le raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis surcharge de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Liens associés

- La documentation du mode élevé se trouve dans [Mode élevé](/tools/elevated).

## Heartbeats

- Le corps de la sonde heartbeat correspond au prompt heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message heartbeat s'appliquent normalement (mais évitez de modifier les valeurs par défaut de session à partir des heartbeats).
- La remise heartbeat utilise par défaut uniquement la payload finale. Pour envoyer aussi le message séparé `Reasoning:` (lorsqu'il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` par agent.

## Interface de chat web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session à partir du magasin de sessions/configuration entrante lors du chargement de la page.
- Choisir un autre niveau écrit immédiatement la surcharge de session via `sessions.patch` ; cela n'attend pas le prochain envoi et ce n'est pas une surcharge `thinkingOnce` à usage unique.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du modèle actif de la session : `adaptive` pour Claude 4.6 sur Anthropic/Bedrock, `low` pour les autres modèles capables de raisonner, `off` sinon.
- Le sélecteur reste sensible au provider :
  - la plupart des providers affichent `off | minimal | low | medium | high | adaptive`
  - Z.AI affiche le binaire `off | on`
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, afin que les directives de chat et le sélecteur restent synchronisés.
