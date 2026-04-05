---
read_when:
    - Vous souhaitez ajuster de manière interactive les identifiants, les appareils ou les valeurs par défaut de l'agent
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: configure
x-i18n:
    generated_at: "2026-04-05T12:37:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Invite interactive pour configurer les identifiants, les appareils et les valeurs par défaut de l'agent.

Remarque : la section **Model** inclut désormais une sélection multiple pour la liste d'autorisation
`agents.defaults.models` (ce qui apparaît dans `/model` et dans le sélecteur de modèles).

Lorsque configure démarre depuis un choix d'authentification de fournisseur, les sélecteurs de modèle par défaut et de liste d'autorisation privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés tels que Volcengine/BytePlus, cette même préférence correspond aussi à leurs variantes de plan de codage (`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de fournisseur préféré devait produire une liste vide, configure revient au catalogue non filtré au lieu d'afficher un sélecteur vide.

Astuce : `openclaw config` sans sous-commande ouvre le même assistant. Utilisez
`openclaw config get|set|unset` pour les modifications non interactives.

Pour la recherche web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent aussi des invites
complémentaires spécifiques au fournisseur :

- **Grok** peut proposer une configuration facultative `x_search` avec la même `XAI_API_KEY` et
  vous permettre de choisir un modèle `x_search`.
- **Kimi** peut demander la région d'API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.

Lié :

- Référence de configuration de la gateway : [Configuration](/gateway/configuration)
- CLI de configuration : [Config](/cli/config)

## Options

- `--section <section>` : filtre de section répétable

Sections disponibles :

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Remarques :

- Choisir où la gateway s'exécute met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continue » sans autre section si c'est tout ce dont vous avez besoin.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent des listes d'autorisation de canaux/salons pendant la configuration. Vous pouvez saisir des noms ou des IDs ; l'assistant résout les noms en IDs lorsque c'est possible.
- Si vous exécutez l'étape d'installation du daemon, l'authentification par jeton nécessite un jeton, et `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne conserve pas les valeurs de jeton en clair résolues dans les métadonnées d'environnement du service superviseur.
- Si l'authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n'est pas résolu, configure bloque l'installation du daemon avec des instructions de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n'est pas défini, configure bloque l'installation du daemon jusqu'à ce que le mode soit explicitement défini.

## Exemples

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
