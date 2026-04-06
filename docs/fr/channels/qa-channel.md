---
read_when:
    - Vous intégrez le transport QA synthétique dans une exécution de test locale ou CI
    - Vous avez besoin de la surface de configuration groupée de qa-channel
    - Vous travaillez par itérations sur l'automatisation QA de bout en bout
summary: Plugin de canal synthétique de classe Slack pour des scénarios QA OpenClaw déterministes
title: Canal QA
x-i18n:
    generated_at: "2026-04-06T03:05:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b88cd73df2f61b34ad1eb83c3450f8fe15a51ac69fbb5a9eca0097564d67a06
    source_path: channels/qa-channel.md
    workflow: 15
---

# Canal QA

`qa-channel` est un transport de messages synthétique groupé pour la QA automatisée d’OpenClaw.

Ce n’est pas un canal de production. Il existe pour exercer la même frontière de plugin de canal
utilisée par les transports réels tout en gardant l’état déterministe et entièrement
inspectable.

## Ce qu’il fait aujourd’hui

- Grammaire de cible de classe Slack :
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Bus synthétique reposant sur HTTP pour :
  - l’injection de messages entrants
  - la capture des transcriptions sortantes
  - la création de fils
  - les réactions
  - les modifications
  - les suppressions
  - les actions de recherche et de lecture
- Exécuteur de vérification automatique côté hôte groupé qui écrit un rapport Markdown

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

Cela passe désormais par l’extension groupée `qa-lab`. Elle démarre le bus QA
dans le dépôt, lance la tranche d’exécution groupée de `qa-channel`, exécute une
vérification automatique déterministe et écrit un rapport Markdown dans `.artifacts/qa-e2e/`.

UI de débogage privée :

```bash
pnpm qa:lab:build
pnpm openclaw qa ui
```

Suite QA complète adossée au dépôt :

```bash
pnpm openclaw qa suite
```

Cela lance le débogueur QA privé à une URL locale, séparée du bundle d’UI de contrôle
livré.

## Portée

La portée actuelle est intentionnellement étroite :

- bus + transport de plugin
- grammaire de routage avec fils
- actions de message détenues par le canal
- rapports Markdown

Les travaux de suivi ajouteront :

- l’orchestration Dockerisée d’OpenClaw
- l’exécution de matrice fournisseur/modèle
- une découverte de scénarios plus riche
- une orchestration native OpenClaw plus tard
