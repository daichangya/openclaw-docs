---
read_when:
    - Ajuster l’analyse ou les valeurs par défaut des directives de thinking, du mode rapide ou de verbose
summary: Syntaxe des directives pour `/think`, `/fast`, `/verbose`, `/trace`, et la visibilité du raisonnement
title: Niveaux de thinking
x-i18n:
    generated_at: "2026-04-24T07:38:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Ce que cela fait

- Directive inline dans n’importe quel corps entrant : `/t <level>`, `/think:<level>`, ou `/thinking <level>`.
- Niveaux (alias) : `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → « think »
  - low → « think hard »
  - medium → « think harder »
  - high → « ultrathink » (budget max)
  - xhigh → « ultrathink+ » (modèles GPT-5.2+ et Codex, plus effort Anthropic Claude Opus 4.7)
  - adaptive → thinking adaptatif géré par le fournisseur (pris en charge pour Claude 4.6 sur Anthropic/Bedrock et Anthropic Claude Opus 4.7)
  - max → raisonnement max du fournisseur (actuellement Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high`, et `extra_high` sont mappés vers `xhigh`.
  - `highest` est mappé vers `high`.
- Remarques sur les fournisseurs :
  - Les menus et sélecteurs de thinking sont pilotés par le profil fournisseur. Les plugins de fournisseurs déclarent l’ensemble exact des niveaux pour le modèle sélectionné, y compris des libellés comme le binaire `on`.
  - `adaptive`, `xhigh`, et `max` ne sont annoncés que pour les profils fournisseur/modèle qui les prennent en charge. Les directives typées pour des niveaux non pris en charge sont rejetées avec les options valides de ce modèle.
  - Les niveaux non pris en charge déjà stockés sont remappés par rang de profil fournisseur. `adaptive` revient à `medium` sur les modèles non adaptatifs, tandis que `xhigh` et `max` reviennent au plus grand niveau pris en charge autre que `off` pour le modèle sélectionné.
  - Les modèles Anthropic Claude 4.6 utilisent `adaptive` par défaut lorsqu’aucun niveau de thinking explicite n’est défini.
  - Anthropic Claude Opus 4.7 n’utilise pas le thinking adaptatif par défaut. Sa valeur d’effort API par défaut reste pilotée par le fournisseur sauf si vous définissez explicitement un niveau de thinking.
  - Anthropic Claude Opus 4.7 mappe `/think xhigh` vers un thinking adaptatif plus `output_config.effort: "xhigh"`, parce que `/think` est une directive de thinking et `xhigh` est le réglage d’effort Opus 4.7.
  - Anthropic Claude Opus 4.7 expose aussi `/think max` ; il est mappé vers le même chemin d’effort max piloté par le fournisseur.
  - Les modèles OpenAI GPT mappent `/think` via la prise en charge d’effort de l’API Responses spécifique au modèle. `/think off` envoie `reasoning.effort: "none"` uniquement lorsque le modèle cible le prend en charge ; sinon OpenClaw omet la charge utile de raisonnement désactivé au lieu d’envoyer une valeur non prise en charge.
  - MiniMax (`minimax/*`) sur le chemin de diffusion compatible Anthropic utilise par défaut `thinking: { type: "disabled" }` sauf si vous définissez explicitement le thinking dans les paramètres du modèle ou de la requête. Cela évite les deltas `reasoning_content` divulgués provenant du format de flux Anthropic non natif de MiniMax.
  - Z.AI (`zai/*`) ne prend en charge que le thinking binaire (`on`/`off`). Tout niveau autre que `off` est traité comme `on` (mappé vers `low`).
  - Moonshot (`moonshot/*`) mappe `/think off` vers `thinking: { type: "disabled" }` et tout niveau autre que `off` vers `thinking: { type: "enabled" }`. Lorsque le thinking est activé, Moonshot n’accepte que `tool_choice` `auto|none` ; OpenClaw normalise les valeurs incompatibles vers `auto`.

## Ordre de résolution

1. Directive inline sur le message (ne s’applique qu’à ce message).
2. Surcharge de session (définie en envoyant un message ne contenant que la directive).
3. Valeur par défaut par agent (`agents.list[].thinkingDefault` dans la configuration).
4. Valeur par défaut globale (`agents.defaults.thinkingDefault` dans la configuration).
5. Repli : valeur par défaut déclarée par le fournisseur lorsqu’elle existe ; sinon les modèles capables de raisonnement se résolvent vers `medium` ou le niveau pris en charge le plus proche autre que `off` pour ce modèle, et les modèles sans raisonnement restent sur `off`.

## Définir une valeur par défaut de session

- Envoyez un message qui soit **uniquement** la directive (espaces autorisés), par exemple `/think:medium` ou `/t high`.
- Cela reste fixé pour la session courante (par défaut par expéditeur) ; effacé par `/think:off` ou par la réinitialisation d’inactivité de session.
- Une réponse de confirmation est envoyée (`Thinking level set to high.` / `Thinking disabled.`). Si le niveau est invalide (par exemple `/thinking big`), la commande est rejetée avec un indice et l’état de session reste inchangé.
- Envoyez `/think` (ou `/think:`) sans argument pour voir le niveau de thinking actuel.

## Application par agent

- **Pi embarqué** : le niveau résolu est transmis au runtime de l’agent Pi en processus.

## Mode rapide (/fast)

- Niveaux : `on|off`.
- Un message contenant uniquement la directive active/désactive une surcharge de mode rapide de session et répond `Fast mode enabled.` / `Fast mode disabled.`.
- Envoyez `/fast` (ou `/fast status`) sans mode pour voir l’état effectif actuel du mode rapide.
- OpenClaw résout le mode rapide dans cet ordre :
  1. `/fast on|off` inline / contenant uniquement la directive
  2. Surcharge de session
  3. Valeur par défaut par agent (`agents.list[].fastModeDefault`)
  4. Configuration par modèle : `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Repli : `off`
- Pour `openai/*`, le mode rapide est mappé vers le traitement prioritaire OpenAI en envoyant `service_tier=priority` sur les requêtes Responses prises en charge.
- Pour `openai-codex/*`, le mode rapide envoie le même drapeau `service_tier=priority` sur Codex Responses. OpenClaw conserve une bascule `/fast` partagée entre les deux chemins d’authentification.
- Pour les requêtes directes publiques `anthropic/*`, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mode rapide est mappé vers les niveaux de service Anthropic : `/fast on` définit `service_tier=auto`, `/fast off` définit `service_tier=standard_only`.
- Pour `minimax/*` sur le chemin compatible Anthropic, `/fast on` (ou `params.fastMode: true`) réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.
- Les paramètres explicites de modèle Anthropic `serviceTier` / `service_tier` remplacent la valeur par défaut du mode rapide lorsque les deux sont définis. OpenClaw continue toutefois d’ignorer l’injection du niveau de service Anthropic pour les URL de base proxy non Anthropic.
- `/status` n’affiche `Fast` que lorsque le mode rapide est activé.

## Directives verbose (/verbose ou /v)

- Niveaux : `on` (minimal) | `full` | `off` (par défaut).
- Un message contenant uniquement la directive active/désactive le verbose de session et répond `Verbose logging enabled.` / `Verbose logging disabled.` ; les niveaux invalides renvoient un indice sans changer l’état.
- `/verbose off` stocke une surcharge explicite de session ; effacez-la via l’UI Sessions en choisissant `inherit`.
- Une directive inline n’affecte que ce message ; sinon les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/verbose` (ou `/verbose:`) sans argument pour voir le niveau verbose actuel.
- Lorsque verbose est activé, les agents qui émettent des résultats d’outils structurés (Pi, autres agents JSON) renvoient chaque appel d’outil comme son propre message de métadonnées uniquement, préfixé par `<emoji> <tool-name>: <arg>` lorsque disponible (chemin/commande). Ces résumés d’outils sont envoyés dès que chaque outil démarre (bulles séparées), et non comme deltas de diffusion.
- Les résumés d’échec d’outil restent visibles en mode normal, mais les suffixes détaillés d’erreur brute sont masqués sauf si verbose vaut `on` ou `full`.
- Lorsque verbose vaut `full`, les sorties d’outils sont aussi transmises après achèvement (bulle séparée, tronquée à une longueur sûre). Si vous basculez `/verbose on|full|off` pendant qu’une exécution est en cours, les bulles d’outils suivantes respecteront le nouveau réglage.

## Directives de trace plugin (/trace)

- Niveaux : `on` | `off` (par défaut).
- Un message contenant uniquement la directive active/désactive la sortie de trace plugin de session et répond `Plugin trace enabled.` / `Plugin trace disabled.`.
- Une directive inline n’affecte que ce message ; sinon les valeurs par défaut de session/globales s’appliquent.
- Envoyez `/trace` (ou `/trace:`) sans argument pour voir le niveau de trace actuel.
- `/trace` est plus étroit que `/verbose` : il n’expose que les lignes de trace/debug détenues par les plugins, comme les résumés de débogage Active Memory.
- Les lignes de trace peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.

## Visibilité du raisonnement (/reasoning)

- Niveaux : `on|off|stream`.
- Un message contenant uniquement la directive active/désactive l’affichage des blocs de thinking dans les réponses.
- Lorsqu’il est activé, le raisonnement est envoyé comme **message séparé** préfixé par `Reasoning:`.
- `stream` (Telegram uniquement) : diffuse le raisonnement dans la bulle brouillon Telegram pendant la génération de la réponse, puis envoie la réponse finale sans raisonnement.
- Alias : `/reason`.
- Envoyez `/reasoning` (ou `/reasoning:`) sans argument pour voir le niveau de raisonnement actuel.
- Ordre de résolution : directive inline, puis surcharge de session, puis valeur par défaut par agent (`agents.list[].reasoningDefault`), puis repli (`off`).

## Articles connexes

- La documentation sur le mode elevated se trouve dans [Mode Elevated](/fr/tools/elevated).

## Heartbeats

- Le corps de la sonde Heartbeat est le prompt heartbeat configuré (par défaut : `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Les directives inline dans un message heartbeat s’appliquent normalement (mais évitez de modifier les valeurs par défaut de session depuis les heartbeats).
- La livraison heartbeat utilise par défaut uniquement la charge utile finale. Pour envoyer aussi le message séparé `Reasoning:` (lorsqu’il est disponible), définissez `agents.defaults.heartbeat.includeReasoning: true` ou `agents.list[].heartbeat.includeReasoning: true` par agent.

## Interface web chat

- Le sélecteur de thinking du chat web reflète le niveau stocké de la session depuis le magasin/configuration de session entrante au chargement de la page.
- Choisir un autre niveau écrit immédiatement la surcharge de session via `sessions.patch` ; cela n’attend pas l’envoi suivant et ce n’est pas une surcharge ponctuelle `thinkingOnce`.
- La première option est toujours `Default (<resolved level>)`, où la valeur par défaut résolue vient du profil de thinking du fournisseur du modèle de session actif plus la même logique de repli que celle utilisée par `/status` et `session_status`.
- Le sélecteur utilise `thinkingOptions` renvoyé par la ligne de session du gateway. L’interface navigateur ne conserve pas sa propre liste regex de fournisseurs ; les plugins possèdent les ensembles de niveaux spécifiques aux modèles.
- `/think:<level>` fonctionne toujours et met à jour le même niveau de session stocké, de sorte que les directives de chat et le sélecteur restent synchronisés.

## Profils de fournisseurs

- Les plugins de fournisseurs peuvent exposer `resolveThinkingProfile(ctx)` pour définir les niveaux pris en charge par le modèle et la valeur par défaut.
- Chaque niveau du profil a un `id` canonique stocké (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, ou `max`) et peut inclure un `label` d’affichage. Les fournisseurs binaires utilisent `{ id: "low", label: "on" }`.
- Les hooks hérités publiés (`supportsXHighThinking`, `isBinaryThinking`, et `resolveDefaultThinkingLevel`) restent disponibles comme adaptateurs de compatibilité, mais les nouveaux ensembles de niveaux personnalisés doivent utiliser `resolveThinkingProfile`.
- Les lignes Gateway exposent `thinkingOptions` et `thinkingDefault` afin que les clients ACP/chat rendent le même profil que celui utilisé par la validation runtime.
