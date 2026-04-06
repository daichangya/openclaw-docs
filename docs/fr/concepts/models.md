---
read_when:
    - Ajouter ou modifier la CLI Models (`models list/set/scan/aliases/fallbacks`)
    - Modifier le comportement de fallback des modèles ou l'expérience de sélection
    - Mettre à jour les sondes de scan des modèles (outils/images)
summary: 'CLI Models : lister, définir, alias, fallbacks, scan, statut'
title: CLI Models
x-i18n:
    generated_at: "2026-04-06T03:07:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299602ccbe0c3d6bbdb2deab22bc60e1300ef6843ed0b8b36be574cc0213c155
    source_path: concepts/models.md
    workflow: 15
---

# CLI Models

Voir [/concepts/model-failover](/fr/concepts/model-failover) pour la rotation des
profils d'authentification, les cooldowns et la manière dont cela interagit avec les fallbacks.
Aperçu rapide des fournisseurs + exemples : [/concepts/model-providers](/fr/concepts/model-providers).

## Fonctionnement de la sélection des modèles

OpenClaw sélectionne les modèles dans cet ordre :

1. Modèle **principal** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** dans `agents.defaults.model.fallbacks` (dans l'ordre).
3. Le **basculement d'authentification du fournisseur** se produit à l'intérieur d'un fournisseur avant de passer au
   modèle suivant.

En lien :

- `agents.defaults.models` est la liste d'autorisation/le catalogue des modèles que OpenClaw peut utiliser (avec alias).
- `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d'images.
- `agents.defaults.pdfModel` est utilisé par l'outil `pdf`. S'il est omis, l'outil
  se replie sur `agents.defaults.imageModel`, puis sur le modèle de session/par défaut résolu.
- `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d'images. S'il est omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur avec authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d'images enregistrés dans l'ordre des ID de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
- `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération de musique. S'il est omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur avec authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés dans l'ordre des ID de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
- `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération de vidéo. S'il est omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur avec authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de vidéo enregistrés dans l'ordre des ID de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
- Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les bindings (voir [/concepts/multi-agent](/fr/concepts/multi-agent)).

## Politique rapide des modèles

- Définissez votre modèle principal sur le modèle de dernière génération le plus puissant auquel vous avez accès.
- Utilisez des fallbacks pour les tâches sensibles au coût/à la latence et les conversations à plus faible enjeu.
- Pour les agents avec outils activés ou des entrées non fiables, évitez les niveaux de modèle plus anciens/plus faibles.

## Onboarding (recommandé)

Si vous ne voulez pas modifier la configuration à la main, exécutez l'onboarding :

```bash
openclaw onboard
```

Il peut configurer le modèle + l'authentification pour les fournisseurs courants, y compris **OpenAI Code (Codex)
subscription** (OAuth) et **Anthropic** (clé API ou Claude CLI).

## Clés de configuration (aperçu)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d'autorisation + alias + paramètres du fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

Les références de modèle sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés
en `zai/*`.

Des exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans
[/providers/opencode](/fr/providers/opencode).

## « Model is not allowed » (et pourquoi les réponses s'arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d'autorisation** pour `/model` et pour
les remplacements de session. Lorsqu'un utilisateur sélectionne un modèle qui ne figure pas dans cette liste d'autorisation,
OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Cela se produit **avant** qu'une réponse normale soit générée, donc le message peut donner l'impression
qu'il « n'a pas répondu ». La solution consiste à :

- Ajouter le modèle à `agents.defaults.models`, ou
- Effacer la liste d'autorisation (supprimer `agents.defaults.models`), ou
- Choisir un modèle à partir de `/model list`.

Exemple de configuration de liste d'autorisation :

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

Vous pouvez changer de modèle pour la session en cours sans redémarrer :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Remarques :

- `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants pour le fournisseur et le modèle, plus une étape Submit.
- `/model <#>` sélectionne depuis ce sélecteur.
- `/model` persiste immédiatement la nouvelle sélection de session.
- Si l'agent est inactif, la prochaine exécution utilise tout de suite le nouveau modèle.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre dans le nouveau modèle qu'à un point de reprise propre.
- Si l'activité des outils ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu'à une opportunité de nouvelle tentative ultérieure ou jusqu'au prochain tour utilisateur.
- `/model status` est la vue détaillée (candidats d'authentification et, lorsque c'est configuré, `baseUrl` du point de terminaison du fournisseur + mode `api`).
- Les références de modèle sont analysées en les séparant sur le **premier** `/`. Utilisez `provider/model` lorsque vous tapez `/model <ref>`.
- Si l'ID du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout l'entrée dans cet ordre :
  1. correspondance d'alias
  2. correspondance unique de fournisseur configuré pour cet ID de modèle exact sans préfixe
  3. fallback obsolète vers le fournisseur par défaut configuré
     Si ce fournisseur n'expose plus le modèle par défaut configuré, OpenClaw
     se replie à la place sur le premier fournisseur/modèle configuré afin d'éviter
     d'exposer une ancienne valeur par défaut de fournisseur supprimé.

Comportement/configuration complet de la commande : [Commandes slash](/fr/tools/slash-commands).

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

Affiche par défaut les modèles configurés. Indicateurs utiles :

- `--all` : catalogue complet
- `--local` : fournisseurs locaux uniquement
- `--provider <name>` : filtrer par fournisseur
- `--plain` : un modèle par ligne
- `--json` : sortie lisible par machine

### `models status`

Affiche le modèle principal résolu, les fallbacks, le modèle d'image et un aperçu de l'authentification
des fournisseurs configurés. Il affiche aussi le statut d'expiration OAuth pour les profils trouvés
dans le magasin d'authentification (avertissement dans les 24 h par défaut). `--plain` imprime uniquement le
modèle principal résolu.
Le statut OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré
n'a pas d'identifiants, `models status` imprime une section **Missing auth**.
Le JSON inclut `auth.oauth` (fenêtre d'avertissement + profils) et `auth.providers`
(authentification effective par fournisseur, y compris les identifiants fournis par env). `auth.oauth`
représente uniquement l'état des profils du magasin d'authentification ; les fournisseurs uniquement via env n'y apparaissent pas.
Utilisez `--check` pour l'automatisation (code de sortie `1` en cas d'absence/d'expiration, `2` en cas d'expiration proche).
Utilisez `--probe` pour des vérifications d'authentification en direct ; les lignes de sonde peuvent provenir de profils d'authentification, d'identifiants env
ou de `models.json`.
Si `auth.order.<provider>` explicite omet un profil stocké, la sonde indique
`excluded_by_auth_order` au lieu de l'essayer. Si l'authentification existe mais qu'aucun modèle pouvant être sondé ne peut être résolu pour ce fournisseur, la sonde signale `status: no_model`.

Le choix d'authentification dépend du fournisseur/compte. Pour les hôtes Gateway toujours actifs, les clés API
sont généralement les plus prévisibles ; la réutilisation de Claude CLI et les profils OAuth/token Anthropic existants
sont aussi pris en charge.

Exemple (Claude CLI) :

```bash
claude auth login
openclaw models status
```

## Scan (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue de modèles gratuits** d'OpenRouter et peut
éventuellement sonder les modèles pour la prise en charge des outils et des images.

Indicateurs principaux :

- `--no-probe` : ignorer les sondes en direct (métadonnées uniquement)
- `--min-params <b>` : taille minimale des paramètres (milliards)
- `--max-age-days <days>` : ignorer les modèles plus anciens
- `--provider <name>` : filtre de préfixe fournisseur
- `--max-candidates <n>` : taille de la liste de fallback
- `--set-default` : définir `agents.defaults.model.primary` sur la première sélection
- `--set-image` : définir `agents.defaults.imageModel.primary` sur la première sélection d'image

Le sondage nécessite une clé API OpenRouter (à partir des profils d'authentification ou de
`OPENROUTER_API_KEY`). Sans clé, utilisez `--no-probe` pour lister seulement les candidats.

Les résultats du scan sont classés par :

1. Prise en charge des images
2. Latence des outils
3. Taille de contexte
4. Nombre de paramètres

Entrée

- Liste OpenRouter `/models` (filtre `:free`)
- Nécessite une clé API OpenRouter provenant des profils d'authentification ou de `OPENROUTER_API_KEY` (voir [/environment](/fr/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de sonde : `--timeout`, `--concurrency`

Lors de l'exécution dans un TTY, vous pouvez sélectionner les fallbacks de manière interactive. En mode non interactif,
passez `--yes` pour accepter les valeurs par défaut.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le
répertoire de l'agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier
est fusionné par défaut sauf si `models.mode` est défini sur `replace`.

Priorité en mode fusion pour les ID de fournisseur correspondants :

- Une valeur `baseUrl` non vide déjà présente dans le `models.json` de l'agent l'emporte.
- Une valeur `apiKey` non vide dans le `models.json` de l'agent l'emporte uniquement lorsque ce fournisseur n'est pas géré par SecretRef dans le contexte actuel de configuration/profil d'authentification.
- Les valeurs `apiKey` des fournisseurs gérées par SecretRef sont actualisées à partir des marqueurs source (`ENV_VAR_NAME` pour les références env, `secretref-managed` pour les références file/exec) au lieu de persister les secrets résolus.
- Les valeurs d'en-tête des fournisseurs gérées par SecretRef sont actualisées à partir des marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références env, `secretref-managed` pour les références file/exec).
- Les valeurs `apiKey`/`baseUrl` de l'agent vides ou absentes se replient sur la configuration `models.providers`.
- Les autres champs du fournisseur sont actualisés à partir de la configuration et des données de catalogue normalisées.

La persistance des marqueurs suit la source faisant autorité : OpenClaw écrit les marqueurs depuis l'instantané de configuration source actif (pré-résolution), et non depuis les valeurs secrètes résolues à l'exécution.
Cela s'applique chaque fois que OpenClaw régénère `models.json`, y compris dans les parcours déclenchés par commande comme `openclaw agent`.

## Lié

- [Model Providers](/fr/concepts/model-providers) — routage des fournisseurs et authentification
- [Model Failover](/fr/concepts/model-failover) — chaînes de fallback
- [Image Generation](/fr/tools/image-generation) — configuration du modèle d'image
- [Music Generation](/tools/music-generation) — configuration du modèle de génération musicale
- [Video Generation](/tools/video-generation) — configuration du modèle de génération vidéo
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults) — clés de configuration des modèles
