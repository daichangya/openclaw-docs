---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - Expliquer où se trouvent les fichiers d’amorçage
    - Déboguer la configuration de l’identité pendant l’onboarding
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-04-05T12:54:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Amorçage de l’agent

L’amorçage est le rituel de **première exécution** qui prépare l’espace de travail d’un agent et
collecte les détails d’identité. Il a lieu après l’onboarding, lorsque l’agent démarre
pour la première fois.

## Ce que fait l’amorçage

Lors de la première exécution de l’agent, OpenClaw initialise l’espace de travail (par défaut
`~/.openclaw/workspace`) :

- Initialise `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Exécute un court rituel de questions-réponses (une question à la fois).
- Écrit l’identité + les préférences dans `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois terminé afin qu’il ne s’exécute qu’une seule fois.

## Où cela s’exécute

L’amorçage s’exécute toujours sur l’**hôte gateway**. Si l’application macOS se connecte à
une Gateway distante, l’espace de travail et les fichiers d’amorçage se trouvent sur cette
machine distante.

<Note>
Lorsque la Gateway s’exécute sur une autre machine, modifiez les fichiers de l’espace de travail sur l’hôte gateway
(par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation associée

- Onboarding de l’application macOS : [Onboarding](/start/onboarding)
- Structure de l’espace de travail : [Agent workspace](/concepts/agent-workspace)
