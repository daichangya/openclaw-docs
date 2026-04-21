---
read_when:
    - Ajuster l’analyse ou les valeurs par défaut des directives de réflexion, de mode rapide ou de verbosité
summary: Syntaxe des directives pour /think, /fast, /verbose, /trace et la visibilité du raisonnement
title: Niveaux de réflexion
x-i18n:
    generated_at: "2026-04-21T19:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Niveaux de réflexion (directives /think)

## Ce que cela fait

- Directive en ligne dans tout corps entrant : `/t <level>`, `/think:<level>` ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget maximal)
  - xhigh → « ultrathink+ » (effort GPT-5.2 + modèles Codex et Anthropic Claude Opus 4.7)
  - adaptive → réflexion adaptative gérée par le fournisseur (prise en charge pour Claude 4.6 sur Anthropic/Bedrock et Anthropic Claude Opus 4.7)
  - max → raisonnement maximal du fournisseur (actuellement Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` et `extra_high` correspondent à `xhigh`.
  - `highest` correspond à `high`.
- Notes sur les fournisseurs :
  - Les menus et sélecteurs de réflexion sont pilotés par le profil du fournisseur. Les plugins de fournisseur déclarent l’ensemble exact de niveaux pour le modèle sélectionné, y compris des libellés tels que le binaire `on`.
  - `adaptive`, `xhigh` et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives saisies pour des niveaux non pris en charge sont rejetées avec les options valides pour ce modèle.
  - Les niveaux non pris en charge déjà stockés sont remappés selon le rang du profil fournisseur. `adaptive` se replie sur `medium` pour les modèles non adaptatifs, tandis que `xhigh` et `max` se replient sur le plus grand niveau pris en charge autre que `off` pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de réflexion explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas la réflexion adaptative par défaut. Sa valeur d’effort API par défaut reste gérée par le fournisseur tant que vous ne définissez pas explicitement un niveau de réflexion.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers une réflexion adaptative plus `output_config.effort: "xhigh"`, car `/think` est une directive de réflexion et `xhigh` est le paramètre d’effort d’Opus 4.7.
  - Anthropic Claude Opus 4.7 expose également `/think max` ; cela correspond au même chemin d’effort maximal géré par le fournisseur.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge de l’effort spécifique au modèle dans l’API Responses. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - MiniMax (`minimax/*`) sur le chemin de streaming compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement la réflexion dans les paramètres de modèle ou de requête. Cela évite les deltas `reasoning_content` divulgués par le format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge qu’une réflexion binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé à `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau autre que `off` vers `thinking: { type: "enabled" }`. Lorsque la réflexion est activée, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles en `auto`.

## Ordre de résolution

1. Directive en ligne dans le message (s’applique uniquement à ce message).
2. Remplacement de session (défini en envoyant un message ne contenant qu’une directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle est disponible, `low` pour les autres modèles du catalogue marqués comme capables de raisonner, `off` sinon.

## Définir une valeur par défaut de session

- Envoyez un message contenant **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste actif pour la session en cours (par expéditeur par défaut) ; effacé par `/think:off` ou par la réinitialisation d’inactivité de la session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec une indication et l’état de la session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de réflexion actuel.

## Application par agent

- **Pi intégré** : le niveau résolu est transmis au runtime d’agent Pi en cours de processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message ne contenant qu’une directive active/désactive un remplacement de mode rapide de session et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` en ligne / en directive seule
  2. Remplacement de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide correspond au traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même indicateur `service_tier=priority` sur Codex Responses. OpenClaw conserve un seul basculement `/fast` partagé entre les deux chemins d’authentification.
- Pour les requêtes directes publiques `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide correspond aux niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres de modèle explicites Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw continue d’ignorer l’injection de niveau de service Anthropic pour les URL de base proxy non Anthropic.

## Directives de verbosité (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message ne contenant qu’une directive active/désactive la verbosité de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient une indication sans modifier l’état.
- `/verbose off` stocke un remplacement de session explicite ; effacez-le via l’interface Sessions en choisissant `inherit`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau de verbosité actuel.
- Lorsque la verbosité est activée, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outil sont envoyés dès le démarrage de chaque outil (bulles séparées), et non comme deltas de streaming.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes détaillant les erreurs brutes sont masqués sauf si la verbosité est `on` ou `full`.
- Lorsque la verbosité est `full`, les sorties d’outils sont également transférées après achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outil suivantes respectent le nouveau réglage.

## Directives de trace de Plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message ne contenant qu’une directive active/désactive la sortie de trace des plugins de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive en ligne n’affecte que ce message ; les valeurs par défaut de session/globales s’appliquent sinon.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus restreint que `/verbose` : il n’expose que les lignes de trace/débogage propres aux plugins, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message ne contenant qu’une directive active/désactive l’affichage des blocs de réflexion dans les réponses.
- Lorsqu’il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle de brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau actuel de raisonnement.
- Ordre de résolution : directive en ligne, puis remplacement de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Voir aussi

- La documentation sur le mode élevé se trouve dans [Elevated mode](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat correspond à l’invite Heartbeat configurée (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives en ligne dans un message Heartbeat s’appliquent comme d’habitude (mais évitez de modifier les valeurs par défaut de session depuis des Heartbeats).
- La livraison Heartbeat utilise par défaut uniquement la charge utile finale. Pour envoyer également le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` par agent.

## Interface de chat web

- Le sélecteur de réflexion du chat web reflète le niveau stocké de la session depuis le magasin/configuration de session entrante au chargement de la page.
- Le choix d’un autre niveau écrit immédiatement le remplacement de session via `sessions.patch` ; il n’attend pas l’envoi suivant et il ne s’agit pas d’un remplacement ponctuel `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue provient du profil de réflexion du fournisseur du modèle actif de la session.
- Le sélecteur utilise `thinkingOptions` renvoyé par la ligne de session Gateway. L’interface navigateur ne conserve pas sa propre liste regex de fournisseurs ; les plugins sont propriétaires des ensembles de niveaux spécifiques aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, afin que les directives de chat et le sélecteur restent synchronisés.

## Profils de fournisseur

- Les plugins de fournisseur peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge et la valeur par défaut du modèle.
- Chaque niveau du profil possède un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks historiques publiés (`supportsXHighThinking`, `isBinaryThinking` et `resolveDefaultThinkingLevel`) restent disponibles comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes Gateway exposent `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat affichent le même profil que celui utilisé par la validation à l’exécution.
