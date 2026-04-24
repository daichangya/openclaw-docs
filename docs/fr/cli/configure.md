---
read_when:
    - Vous voulez ajuster interactivement les identifiants, les appareils ou les valeurs par défaut de l’agent
summary: Référence CLI pour `openclaw configure` (invites de configuration interactives)
title: Configurer
x-i18n:
    generated_at: "2026-04-24T07:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Invite interactive pour configurer les identifiants, les appareils et les valeurs par défaut de l’agent.

Remarque : la section **Modèle** inclut maintenant une sélection multiple pour la liste blanche
`agents.defaults.models` (ce qui apparaît dans `/model` et le sélecteur de modèle).
Les choix de configuration à portée fournisseur fusionnent leurs modèles sélectionnés dans la
liste blanche existante au lieu de remplacer les fournisseurs non liés déjà présents dans la configuration.

Lorsque configure démarre à partir d’un choix d’authentification fournisseur, les sélecteurs de modèle par défaut et de
liste blanche privilégient automatiquement ce fournisseur. Pour les fournisseurs appariés tels que
Volcengine/BytePlus, cette même préférence correspond aussi à leurs variantes de plan de codage
(`volcengine-plan/*`, `byteplus-plan/*`). Si le filtre de fournisseur préféré
produirait une liste vide, configure revient au catalogue non filtré au lieu d’afficher un sélecteur vide.

Astuce : `openclaw config` sans sous-commande ouvre le même assistant. Utilisez
`openclaw config get|set|unset` pour des modifications non interactives.

Pour la recherche Web, `openclaw configure --section web` vous permet de choisir un fournisseur
et de configurer ses identifiants. Certains fournisseurs affichent aussi des invites
complémentaires propres au fournisseur :

- **Grok** peut proposer une configuration facultative de `x_search` avec la même `XAI_API_KEY` et
  vous laisser choisir un modèle `x_search`.
- **Kimi** peut demander la région de l’API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) et le modèle de recherche Web Kimi par défaut.

Lié :

- Référence de configuration du Gateway : [Configuration](/fr/gateway/configuration)
- CLI de configuration : [Config](/fr/cli/config)

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

- Choisir où le Gateway s’exécute met toujours à jour `gateway.mode`. Vous pouvez sélectionner « Continuer » sans autres sections si c’est tout ce dont vous avez besoin.
- Les services orientés canal (Slack/Discord/Matrix/Microsoft Teams) demandent les listes blanches de canaux/salles pendant la configuration. Vous pouvez saisir des noms ou des ID ; l’assistant résout les noms en ID lorsque c’est possible.
- Si vous exécutez l’étape d’installation du daemon, l’authentification par jeton exige un jeton, et `gateway.auth.token` est géré par SecretRef, configure valide le SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, configure bloque l’installation du daemon avec des indications de remédiation exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, configure bloque l’installation du daemon jusqu’à ce que le mode soit défini explicitement.

## Exemples

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Lié

- [Référence CLI](/fr/cli)
- [Configuration](/fr/gateway/configuration)
