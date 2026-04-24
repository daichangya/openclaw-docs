---
read_when:
    - Mise à jour de l’interface de réglages macOS des Skills
    - Modification du contrôle ou du comportement d’installation des Skills
summary: Interface de réglages macOS des Skills et statut adossé au gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T07:21:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

L’application macOS expose les Skills OpenClaw via le gateway ; elle n’analyse pas les Skills localement.

## Source de données

- `skills.status` (gateway) renvoie tous les Skills ainsi que leur éligibilité et les prérequis manquants
  (y compris les blocages de liste d’autorisation pour les Skills intégrés).
- Les prérequis sont dérivés de `metadata.openclaw.requires` dans chaque `SKILL.md`.

## Actions d’installation

- `metadata.openclaw.install` définit les options d’installation (brew/node/go/uv).
- L’application appelle `skills.install` pour exécuter les installateurs sur l’hôte gateway.
- Les constats `critical` intégrés de code dangereux bloquent `skills.install` par défaut ; les constats suspects n’émettent toujours qu’un avertissement. Le remplacement dangereux existe sur la requête gateway, mais le flux par défaut de l’application reste en échec fermé.
- Si chaque option d’installation est `download`, le gateway expose tous les
  choix de téléchargement.
- Sinon, le gateway choisit un installateur préféré en fonction des préférences d’installation actuelles
  et des binaires présents sur l’hôte : Homebrew en premier lorsque
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le
  gestionnaire Node configuré dans `skills.install.nodeManager`, puis des replis
  ultérieurs comme `go` ou `download`.
- Les libellés d’installation Node reflètent le gestionnaire Node configuré, y compris `yarn`.

## Variables d’environnement / clés API

- L’application stocke les clés dans `~/.openclaw/openclaw.json` sous `skills.entries.<skillKey>`.
- `skills.update` applique des patches à `enabled`, `apiKey` et `env`.

## Mode distant

- Les mises à jour d’installation + de configuration se produisent sur l’hôte gateway (pas sur le Mac local).

## Associé

- [Skills](/fr/tools/skills)
- [Application macOS](/fr/platforms/macos)
