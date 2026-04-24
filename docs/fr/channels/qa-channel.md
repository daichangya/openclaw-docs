---
read_when:
    - Vous intégrez le transport QA synthétique à une exécution de test locale ou CI
    - Vous avez besoin de la surface de configuration du qa-channel intégré
    - Vous itérez sur l’automatisation QA de bout en bout
summary: Plugin de canal synthétique de classe Slack pour des scénarios QA OpenClaw déterministes
title: Canal QA
x-i18n:
    generated_at: "2026-04-24T07:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` est un transport de messages synthétique intégré pour la QA automatisée d’OpenClaw.

Ce n’est pas un canal de production. Il existe pour exercer la même limite de plugin de canal
utilisée par les transports réels tout en gardant un état déterministe et entièrement
inspectable.

## Ce qu’il fait aujourd’hui

- Grammaire de cible de classe Slack :
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus synthétique adossé à HTTP pour :
  - l’injection de messages entrants
  - la capture de transcriptions sortantes
  - la création de fils
  - les réactions
  - les modifications
  - les suppressions
  - les actions de recherche et de lecture
- Exécuteur de vérification automatique intégré côté hôte qui écrit un rapport Markdown

## Configuration

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Clés de compte prises en charge :

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Exécuteur

Tranche verticale actuelle :

```bash
pnpm qa:e2e
```

Cela passe maintenant par l’extension `qa-lab` intégrée. Elle démarre le
bus QA du dépôt, lance la tranche d’exécution `qa-channel` intégrée, exécute une
auto-vérification déterministe et écrit un rapport Markdown sous `.artifacts/qa-e2e/`.

Interface de débogage privée :

```bash
pnpm qa:lab:up
```

Cette commande unique construit le site QA, démarre la pile gateway + QA Lab
adossée à Docker, et affiche l’URL de QA Lab. Depuis ce site, vous pouvez choisir
des scénarios, sélectionner la voie de modèle, lancer des exécutions individuelles
et suivre les résultats en direct.

Suite QA complète adossée au dépôt :

```bash
pnpm openclaw qa suite
```

Cela lance le débogueur QA privé à une URL locale, distincte du bundle
d’interface Control livré.

## Périmètre

Le périmètre actuel est volontairement restreint :

- bus + transport de plugin
- grammaire de routage des fils
- actions de message détenues par le canal
- rapports Markdown
- site QA adossé à Docker avec contrôles d’exécution

Les travaux de suivi ajouteront :

- exécution d’une matrice fournisseur/modèle
- découverte de scénarios plus riche
- orchestration native OpenClaw ultérieurement

## Lié

- [Appairage](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Vue d’ensemble des canaux](/fr/channels)
