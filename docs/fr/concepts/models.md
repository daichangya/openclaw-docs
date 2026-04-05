---
read_when:
    - Ajout ou modification de la CLI models (models list/set/scan/aliases/fallbacks)
    - Modification du comportement de repli des modèles ou de l’UX de sélection
    - Mise à jour des probes d’analyse de modèles (outils/images)
summary: 'CLI Models : lister, définir, alias, solutions de repli, analyse, statut'
title: CLI Models
x-i18n:
    generated_at: "2026-04-05T12:40:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08f7e50da263895dae2bd2b8dc327972ea322615f8d1918ddbd26bb0fb24840
    source_path: concepts/models.md
    workflow: 15
---

# CLI Models

Voir [/concepts/model-failover](/concepts/model-failover) pour la rotation des profils
d’authentification, les temps de refroidissement et la manière dont cela interagit avec les solutions de repli.
Vue d’ensemble rapide des fournisseurs + exemples : [/concepts/model-providers](/concepts/model-providers).

## Fonctionnement de la sélection de modèle

OpenClaw sélectionne les modèles dans cet ordre :

1. Modèle **principal** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Solutions de repli** dans `agents.defaults.model.fallbacks` (dans l’ordre).
3. Le **basculement d’authentification du fournisseur** se produit à l’intérieur d’un fournisseur avant de passer au
   modèle suivant.

Voir aussi :

- `agents.defaults.models` est la liste d’autorisation/le catalogue des modèles qu’OpenClaw peut utiliser (plus les alias).
- `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d’images.
- `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il est omis, l’outil
  revient à `agents.defaults.imageModel`, puis au modèle de session/par défaut résolu.
- `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d’images. S’il est omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur soutenue par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des ID de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez également l’authentification/la clé API de ce fournisseur.
- `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération vidéo. Contrairement à la génération d’images, cela ne déduit pas encore de fournisseur par défaut aujourd’hui. Définissez un `provider/model` explicite tel que `qwen/wan2.6-t2v`, et configurez également l’authentification/la clé API de ce fournisseur.
- Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [/concepts/multi-agent](/concepts/multi-agent)).

## Politique de modèle rapide

- Définissez votre modèle principal sur le modèle le plus puissant de dernière génération auquel vous avez accès.
- Utilisez des solutions de repli pour les tâches sensibles au coût/à la latence et les discussions à moindre enjeu.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les paliers de modèles anciens/plus faibles.

## Onboarding (recommandé)

Si vous ne voulez pas modifier la configuration à la main, exécutez l’onboarding :

```bash
openclaw onboard
```

Il peut configurer le modèle + l’authentification pour les fournisseurs courants, y compris **l’abonnement
OpenAI Code (Codex)** (OAuth) et **Anthropic** (clé API ou Claude CLI).

## Clés de configuration (vue d’ensemble)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d’autorisation + alias + paramètres du fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

Les références de modèle sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés
en `zai/*`.

Des exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans
[/providers/opencode](/providers/opencode).

## « Model is not allowed » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et pour
les remplacements de session. Lorsqu’un utilisateur sélectionne un modèle qui n’est pas dans cette liste d’autorisation,
OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Cela se produit **avant** qu’une réponse normale ne soit générée, donc le message peut donner
l’impression qu’il « n’a pas répondu ». La correction consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, ou
- Effacer la liste d’autorisation (supprimer `agents.defaults.models`), ou
- Choisir un modèle depuis `/model list`.

Exemple de configuration de liste d’autorisation :

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Changer de modèle dans le chat (`/model`)

Vous pouvez changer de modèle pour la session en cours sans redémarrer :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Remarques :

- `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des listes déroulantes de fournisseur et de modèle, ainsi qu’une étape de soumission.
- `/model <#>` sélectionne depuis ce sélecteur.
- `/model` persiste immédiatement la nouvelle sélection de session.
- Si l’agent est inactif, la prochaine exécution utilise tout de suite le nouveau modèle.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité ultérieure de nouvelle tentative ou jusqu’au prochain tour utilisateur.
- `/model status` est la vue détaillée (candidats d’authentification et, lorsqu’ils sont configurés, `baseUrl` + mode `api` du point de terminaison fournisseur).
- Les références de modèle sont analysées en effectuant une séparation sur le **premier** `/`. Utilisez `provider/model` lors de la saisie de `/model <ref>`.
- Si l’ID du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe du fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout l’entrée dans cet ordre :
  1. correspondance d’alias
  2. correspondance unique de fournisseur configuré pour cet ID de modèle exact sans préfixe
  3. solution de repli dépréciée vers le fournisseur par défaut configuré
     Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
     revient à la place au premier fournisseur/modèle configuré afin d’éviter
     d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.

Comportement/configuration complète de la commande : [Commandes slash](/tools/slash-commands).

## Commandes CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sans sous-commande) est un raccourci pour `models status`.

### `models list`

Affiche les modèles configurés par défaut. Drapeaux utiles :

- `--all` : catalogue complet
- `--local` : fournisseurs locaux uniquement
- `--provider <name>` : filtrer par fournisseur
- `--plain` : un modèle par ligne
- `--json` : sortie lisible par machine

### `models status`

Affiche le modèle principal résolu, les solutions de repli, le modèle d’image et une vue d’ensemble de l’authentification
des fournisseurs configurés. Il expose également l’état d’expiration OAuth pour les profils trouvés
dans le magasin d’authentification (avertissement dans les 24 h par défaut). `--plain` affiche uniquement le
modèle principal résolu.
L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré
n’a pas d’identifiants, `models status` affiche une section **Missing auth**.
Le JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers`
(authentification effective par fournisseur).
Utilisez `--check` pour l’automatisation (code de sortie `1` si manquant/expiré, `2` si expiration proche).
Utilisez `--probe` pour des vérifications d’authentification en direct ; les lignes de probe peuvent provenir de profils d’authentification, d’identifiants env
ou de `models.json`.
Si `auth.order.<provider>` explicite omet un profil stocké, la probe signale
`excluded_by_auth_order` au lieu d’essayer de l’utiliser. Si l’authentification existe mais qu’aucun modèle sondable ne peut être résolu pour ce fournisseur, la probe signale
`status: no_model`.

Le choix de l’authentification dépend du fournisseur/du compte. Pour les hôtes gateway toujours actifs, les clés API
sont généralement les plus prévisibles ; la réutilisation de Claude CLI et les profils Anthropic OAuth/jeton existants sont également pris en charge.

Exemple (Claude CLI) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue de modèles gratuits** d’OpenRouter et peut
éventuellement sonder les modèles pour la prise en charge des outils et des images.

Drapeaux principaux :

- `--no-probe` : ignorer les probes en direct (métadonnées uniquement)
- `--min-params <b>` : taille minimale de paramètres (en milliards)
- `--max-age-days <days>` : ignorer les modèles plus anciens
- `--provider <name>` : filtre de préfixe de fournisseur
- `--max-candidates <n>` : taille de la liste de repli
- `--set-default` : définir `agents.defaults.model.primary` sur la première sélection
- `--set-image` : définir `agents.defaults.imageModel.primary` sur la première sélection d’image

Les probes nécessitent une clé API OpenRouter (depuis les profils d’authentification ou
`OPENROUTER_API_KEY`). Sans clé, utilisez `--no-probe` pour seulement lister les candidats.

Les résultats de l’analyse sont classés selon :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée

- Liste OpenRouter `/models` (filtre `:free`)
- Nécessite une clé API OpenRouter depuis les profils d’authentification ou `OPENROUTER_API_KEY` (voir [/environment](/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de probe : `--timeout`, `--concurrency`

Lorsqu’elle est exécutée dans un TTY, vous pouvez sélectionner les solutions de repli de manière interactive. En mode non interactif,
passez `--yes` pour accepter les valeurs par défaut.

## Registre de modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le
répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier
est fusionné par défaut sauf si `models.mode` est défini sur `replace`.

Priorité du mode fusion pour les ID de fournisseur correspondants :

- Un `baseUrl` non vide déjà présent dans `models.json` de l’agent est prioritaire.
- Une valeur `apiKey` non vide dans `models.json` de l’agent est prioritaire uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
- Les valeurs `apiKey` de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`ENV_VAR_NAME` pour les références env, `secretref-managed` pour les références file/exec) au lieu de conserver les secrets résolus.
- Les valeurs d’en-tête de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`secretref-env:ENV_VAR_NAME` pour les références env, `secretref-managed` pour les références file/exec).
- Les `apiKey`/`baseUrl` d’agent vides ou manquants reviennent à la configuration `models.providers`.
- Les autres champs de fournisseur sont actualisés à partir de la configuration et des données de catalogue normalisées.

La persistance des marqueurs est pilotée par la source : OpenClaw écrit les marqueurs depuis l’instantané de configuration de source active (avant résolution), et non depuis les valeurs secrètes résolues à l’exécution.
Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.

## Lié

- [Fournisseurs de modèles](/concepts/model-providers) — routage des fournisseurs et authentification
- [Basculement des modèles](/concepts/model-failover) — chaînes de repli
- [Génération d’images](/tools/image-generation) — configuration du modèle d’image
- [Référence de configuration](/gateway/configuration-reference#agent-defaults) — clés de configuration du modèle
