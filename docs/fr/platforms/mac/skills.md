---
read_when:
    - Mettre à jour l'interface des réglages Skills sur macOS
    - Modifier le filtrage ou le comportement d'installation des Skills
summary: Interface des réglages Skills sur macOS et état adossé à la gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

L'application macOS expose les Skills OpenClaw via la gateway ; elle n'analyse pas les Skills localement.

## Source des données

- `skills.status` (gateway) renvoie tous les Skills ainsi que leur éligibilité et les exigences manquantes
  (y compris les blocages de liste d'autorisation pour les Skills intégrés).
- Les exigences sont dérivées de `metadata.openclaw.requires` dans chaque `SKILL.md`.

## Actions d'installation

- `metadata.openclaw.install` définit les options d'installation (brew/node/go/uv).
- L'application appelle `skills.install` pour exécuter les installateurs sur l'hôte gateway.
- Les résultats intégrés `critical` de dangerous-code bloquent `skills.install` par défaut ; les résultats suspects ne déclenchent encore qu'un avertissement. Le remplacement dangereux existe dans la requête gateway, mais le flux par défaut de l'application reste fermé par défaut en cas de problème.
- Si chaque option d'installation est `download`, la gateway expose tous les choix de téléchargement.
- Sinon, la gateway choisit un installateur préféré en fonction des préférences d'installation actuelles et des binaires présents sur l'hôte : Homebrew en premier lorsque `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le gestionnaire Node configuré dans `skills.install.nodeManager`, puis les replis ultérieurs comme `go` ou `download`.
- Les libellés d'installation Node reflètent le gestionnaire Node configuré, y compris `yarn`.

## Variables d'environnement / clés API

- L'application stocke les clés dans `~/.openclaw/openclaw.json` sous `skills.entries.<skillKey>`.
- `skills.update` applique des patchs à `enabled`, `apiKey` et `env`.

## Mode distant

- Les mises à jour d'installation et de configuration se font sur l'hôte gateway (pas sur le Mac local).
