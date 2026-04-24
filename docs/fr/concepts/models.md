---
read_when:
    - Ajout ou modification de la CLI des modèles (`models list/set/scan/aliases/fallbacks`)
    - Modification du comportement de repli des modèles ou de l’expérience de sélection
    - Mise à jour des sondes d’analyse des modèles (`tools/images`)
summary: 'CLI des modèles : lister, définir, alias, replis, analyser, état'
title: CLI des modèles
x-i18n:
    generated_at: "2026-04-24T07:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Voir [/concepts/model-failover](/fr/concepts/model-failover) pour la rotation des profils d’authentification,
les cooldowns, et leur interaction avec les replis.
Aperçu rapide des fournisseurs + exemples : [/concepts/model-providers](/fr/concepts/model-providers).

## Fonctionnement de la sélection des modèles

OpenClaw sélectionne les modèles dans cet ordre :

1. Modèle **principal** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Replis** dans `agents.defaults.model.fallbacks` (dans l’ordre).
3. Le **basculement d’authentification du fournisseur** se produit à l’intérieur d’un fournisseur avant de passer au
   modèle suivant.

Lié :

- `agents.defaults.models` est la liste d’autorisation/le catalogue des modèles qu’OpenClaw peut utiliser (plus les alias).
- `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d’images.
- `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il est omis, l’outil
  se replie sur `agents.defaults.imageModel`, puis sur le modèle résolu de session/par défaut.
- `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d’images. S’il est omis, `image_generate` peut quand même déduire un fournisseur par défaut adossé à une auth. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez également l’authentification/la clé API de ce fournisseur.
- `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération musicale. S’il est omis, `music_generate` peut quand même déduire un fournisseur par défaut adossé à une auth. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez également l’authentification/la clé API de ce fournisseur.
- `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération vidéo. S’il est omis, `video_generate` peut quand même déduire un fournisseur par défaut adossé à une auth. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez également l’authentification/la clé API de ce fournisseur.
- Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [/concepts/multi-agent](/fr/concepts/multi-agent)).

## Politique rapide des modèles

- Définissez votre modèle principal sur le modèle de dernière génération le plus puissant auquel vous avez accès.
- Utilisez des replis pour les tâches sensibles au coût/à la latence et les conversations moins critiques.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les niveaux de modèles plus anciens/plus faibles.

## Onboarding (recommandé)

Si vous ne souhaitez pas modifier la configuration à la main, exécutez l’onboarding :

```bash
openclaw onboard
```

Il peut configurer le modèle + l’authentification pour les fournisseurs courants, y compris **OpenAI Code (Codex)
subscription** (OAuth) et **Anthropic** (clé API ou CLI Claude).

## Clés de configuration (aperçu)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d’autorisation + alias + paramètres de fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

Les références de modèles sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés
en `zai/*`.

Des exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans
[/providers/opencode](/fr/providers/opencode).

### Modifications sûres de la liste d’autorisation

Utilisez des écritures additives lors de la mise à jour manuelle de `agents.defaults.models` :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protège les cartes de modèles/fournisseurs contre les écrasements accidentels. Une
affectation d’objet simple à `agents.defaults.models`, `models.providers`, ou
`models.providers.<id>.models` est rejetée lorsqu’elle supprimerait des
entrées existantes. Utilisez `--merge` pour des modifications additives ; utilisez `--replace` uniquement lorsque la
valeur fournie doit devenir la valeur cible complète.

La configuration interactive du fournisseur et `openclaw configure --section model` fusionnent également
les sélections à portée du fournisseur dans la liste d’autorisation existante, de sorte que l’ajout de Codex,
Ollama ou d’un autre fournisseur ne supprime pas les entrées de modèle sans lien.

## « Model is not allowed » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et pour
les remplacements de session. Lorsqu’un utilisateur sélectionne un modèle qui ne figure pas dans cette liste d’autorisation,
OpenClaw renvoie :

```text
Model "provider/model" is not allowed. Use /model to list available models.
```

Cela se produit **avant** qu’une réponse normale ne soit générée, de sorte que le message peut donner
l’impression qu’« il n’a pas répondu ». La correction consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, soit
- Effacer la liste d’autorisation (supprimer `agents.defaults.models`), soit
- Choisir un modèle depuis `/model list`.

Exemple de configuration de liste d’autorisation :

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

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Remarques :

- `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec menus déroulants de fournisseur et de modèle plus une étape Submit.
- `/models add` est disponible par défaut et peut être désactivé avec `commands.modelsWrite=false`.
- Lorsqu’il est activé, `/models add <provider> <modelId>` est la voie la plus rapide ; un simple `/models add` démarre un flux guidé fournisseur d’abord lorsque c’est pris en charge.
- Après `/models add`, le nouveau modèle devient disponible dans `/models` et `/model` sans redémarrer le gateway.
- `/model <#>` sélectionne à partir de ce sélecteur.
- `/model` persiste immédiatement la nouvelle sélection de session.
- Si l’agent est inactif, l’exécution suivante utilise immédiatement le nouveau modèle.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre sur le nouveau modèle qu’à un point propre de nouvelle tentative.
- Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file d’attente jusqu’à une opportunité de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
- `/model status` est la vue détaillée (candidats d’authentification et, lorsque configuré, `baseUrl` du point de terminaison du fournisseur + mode `api`).
- Les références de modèle sont analysées en divisant sur le **premier** `/`. Utilisez `provider/model` lorsque vous saisissez `/model <ref>`.
- Si l’identifiant du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout l’entrée dans cet ordre :
  1. correspondance d’alias
  2. correspondance unique de fournisseur configuré pour cet identifiant de modèle exact sans préfixe
  3. repli obsolète vers le fournisseur par défaut configuré
     Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
     se replie à la place sur le premier fournisseur/modèle configuré afin d’éviter
     d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.

Comportement/configuration complet de la commande : [Commandes slash](/fr/tools/slash-commands).

Exemples :

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

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

Affiche par défaut les modèles configurés. Options utiles :

- `--all` : catalogue complet
- `--local` : fournisseurs locaux uniquement
- `--provider <id>` : filtrer par identifiant de fournisseur, par exemple `moonshot` ; les libellés
  d’affichage des sélecteurs interactifs ne sont pas acceptés
- `--plain` : un modèle par ligne
- `--json` : sortie lisible par machine

`--all` inclut les lignes statiques du catalogue possédé par le fournisseur inclus avant que l’authentification ne soit
configurée, de sorte que les vues de découverte seules peuvent afficher des modèles indisponibles tant que
vous n’ajoutez pas les identifiants de fournisseur correspondants.

### `models status`

Affiche le modèle principal résolu, les replis, le modèle d’image et un aperçu de l’authentification
des fournisseurs configurés. Il expose aussi l’état d’expiration OAuth pour les profils trouvés
dans le magasin d’authentification (avertit dans les 24 h par défaut). `--plain` affiche uniquement le
modèle principal résolu.
L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré
n’a pas d’identifiants, `models status` affiche une section **Missing auth**.
Le JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers`
(authentification effective par fournisseur, y compris les identifiants adossés à l’environnement). `auth.oauth`
ne concerne que l’état de santé des profils du magasin d’authentification ; les fournisseurs uniquement basés sur l’environnement n’y apparaissent pas.
Utilisez `--check` pour l’automatisation (code de sortie `1` si manquant/expiré, `2` si proche d’expirer).
Utilisez `--probe` pour des vérifications d’authentification en direct ; les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement,
ou de `models.json`.
Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
`excluded_by_auth_order` au lieu de l’essayer. Si une authentification existe mais qu’aucun modèle sondable ne peut être résolu pour ce fournisseur, la sonde signale `status: no_model`.

Le choix de l’authentification dépend du fournisseur/compte. Pour des hôtes gateway toujours actifs, les
clés API sont généralement les plus prévisibles ; la réutilisation de la CLI Claude et les profils OAuth/jeton Anthropic existants sont également pris en charge.

Exemple (CLI Claude) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue de modèles gratuits** d’OpenRouter et peut
éventuellement sonder les modèles pour la prise en charge des outils et des images.

Options clés :

- `--no-probe` : ignorer les sondes en direct (métadonnées uniquement)
- `--min-params <b>` : taille minimale des paramètres (milliards)
- `--max-age-days <days>` : ignorer les modèles plus anciens
- `--provider <name>` : filtre de préfixe fournisseur
- `--max-candidates <n>` : taille de la liste de repli
- `--set-default` : définir `agents.defaults.model.primary` sur la première sélection
- `--set-image` : définir `agents.defaults.imageModel.primary` sur la première sélection d’image

La sonde nécessite une clé API OpenRouter (provenant des profils d’authentification ou de
`OPENROUTER_API_KEY`). Sans clé, utilisez `--no-probe` pour lister uniquement les candidats.

Les résultats d’analyse sont classés selon :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée

- Liste OpenRouter `/models` (filtre `:free`)
- Nécessite une clé API OpenRouter depuis les profils d’authentification ou `OPENROUTER_API_KEY` (voir [/environment](/fr/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de sonde : `--timeout`, `--concurrency`

Lorsqu’il est exécuté dans un TTY, vous pouvez sélectionner les replis de manière interactive. En mode non interactif,
passez `--yes` pour accepter les valeurs par défaut.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le
répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier
est fusionné par défaut sauf si `models.mode` vaut `replace`.

Priorité du mode fusion pour les identifiants de fournisseur correspondants :

- Le `baseUrl` non vide déjà présent dans le `models.json` de l’agent est prioritaire.
- L’`apiKey` non vide dans le `models.json` de l’agent est prioritaire uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
- Les valeurs `apiKey` des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs de source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de persister les secrets résolus.
- Les valeurs d’en-tête des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs de source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
- Les `apiKey`/`baseUrl` d’agent vides ou absents se replient sur `models.providers` de la configuration.
- Les autres champs du fournisseur sont actualisés à partir de la configuration et des données de catalogue normalisées.

La persistance des marqueurs est gouvernée par la source : OpenClaw écrit les marqueurs à partir de l’instantané de configuration source actif (avant résolution), et non à partir des valeurs secrètes résolues à l’exécution.
Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.

## Lié

- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage fournisseur et authentification
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli
- [Génération d’images](/fr/tools/image-generation) — configuration des modèles d’image
- [Génération musicale](/fr/tools/music-generation) — configuration des modèles de musique
- [Génération vidéo](/fr/tools/video-generation) — configuration des modèles de vidéo
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
