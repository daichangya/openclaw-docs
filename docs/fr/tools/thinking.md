---
read_when:
    - Ajustement de l’analyse ou des valeurs par défaut des directives de thinking, fast-mode ou verbose
summary: Syntaxe des directives pour `/think`, `/fast`, `/verbose`, `/trace` et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-21T07:07:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: edee9420e1cc3eccfa18d87061c4a4d6873e70cb51fff85305fafbcd6a5d6a7d
    source_path: tools/thinking.md
    workflow: 15
---

# Niveaux de réflexion (directives `/think`)

## Ce que cela fait

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget maximal)
  - xhigh → « ultrathink+ » (modèles GPT-5.2 + Codex et effort Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock et Anthropic Claude Opus 4.7)
  - max → raisonnement maximal du fournisseur (actuellement Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` sont mappés vers `xhigh`.
  - `highest` est mappé vers `high`.
- Remarques sur les fournisseurs :
  - `adaptive` n’est annoncé dans les menus de commandes natifs et les sélecteurs que pour les fournisseurs/modèles qui déclarent prendre en charge la réflexion adaptative. Il reste accepté comme directive saisie pour la compatibilité avec les configurations et alias existants.
  - `max` n’est annoncé dans les menus de commandes natifs et les sélecteurs que pour les fournisseurs/modèles qui déclarent prendre en charge la réflexion max. Les paramètres `max` déjà stockés sont remappés vers le niveau pris en charge le plus élevé pour le modèle sélectionné lorsque le modèle ne prend pas en charge `max`.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas la réflexion adaptative par défaut. La valeur d’effort par défaut de son API reste gérée par le fournisseur tant que vous ne définissez pas explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers la réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le paramètre d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose aussi `/think max` ; il est mappé vers le même chemin d’effort maximal géré par le fournisseur.
  - Les modèles OpenAI GPT mappent `/think` selon la prise en charge spécifique au modèle de l’effort dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet le payload de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` qui fuient depuis le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge que la réflexion binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau autre que `off` vers `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive en ligne sur le message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message contenant uniquement une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : `adaptive` pour les modèles Anthropic Claude 4.6, `off` pour Anthropic Claude Opus 4.7 sauf configuration explicite, `low` pour les autres modèles capables de raisonnement, `off` sinon.

## Définir une valeur par défaut de session

- Envoyez un message qui est **uniquement** la directive (espaces autorisés), par ex. `/think:medium` ou `/t high`.
- Cela reste appliqué à la session courante (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation sur inactivité de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par ex. `/thinking big`), la commande est rejetée avec une indication et l’état de session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi embarqué** : le niveau résolu est transmis au runtime de l’agent Pi en processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement la directive active un remplacement de session du mode rapide et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` en ligne / contenant uniquement la directive
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide est mappé vers le traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur Codex Responses. OpenClaw conserve un seul basculement `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes publiques directes `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide est mappé vers les niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres explicites de modèle Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw ignore toujours l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.

## Directives verbose (`/verbose` ou `/v`)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active verbose pour la session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` stocke un remplacement explicite de session ; effacez-le via l’interface Sessions en choisissant `inherit`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbose actuel.
- Lorsque verbose est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outils sont envoyés dès le démarrage de chaque outil (bulles séparées), et non comme deltas de streaming.
- Les résumés d’échec d’outils restent visibles en mode normal, mais les suffixes détaillés d’erreur brute sont masqués sauf si verbose vaut `on` ou `full`.
- Lorsque verbose vaut `full`, les sorties d’outils sont aussi transmises après la fin (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outils suivantes respectent le nouveau paramètre.

## Directives de trace de plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active la sortie de trace des plugins pour la session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus étroit que `/verbose` : il n’expose que les lignes de trace/débogage gérées par les plugins, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et sous forme de message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive active ou désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsqu’il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Liens associés

- La documentation du mode Elevated se trouve dans [Elevated mode](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat correspond au prompt Heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent normalement (mais évitez de modifier les valeurs par défaut de session depuis les Heartbeats).
- La livraison Heartbeat utilise par défaut uniquement le payload final. Pour envoyer également le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou, par agent, `agents.list[].heartbeat.includeReasoning: true`.

## Interface de chat Web

- Le sélecteur de thinking du chat Web reflète le niveau stocké de la session depuis le magasin/configuration de session entrante au chargement de la page.
- Choisir un autre niveau écrit immédiatement le remplacement de session via `sessions.patch` ; il n’attend pas le prochain envoi et ce n’est pas un remplacement ponctuel `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du modèle actif de la session : `adaptive` pour Claude 4.6 sur Anthropic, `off` pour Anthropic Claude Opus 4.7 sauf configuration explicite, `low` pour les autres modèles capables de raisonnement, `off` sinon.
- Le sélecteur reste sensible au fournisseur :
  - la plupart des fournisseurs affichent `off | minimal | low | medium | high`
  - Anthropic/Bedrock Claude 4.6 affiche `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 affiche `off | minimal | low | medium | high | xhigh | adaptive | max`
  - Z.AI affiche le binaire `off | on`
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, de sorte que les directives de chat et le sélecteur restent synchronisés.
