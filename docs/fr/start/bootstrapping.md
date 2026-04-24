---
read_when:
    - Comprendre ce qui se passe lors de la première exécution de l’agent
    - |-
      Expliquer où se trouvent les fichiers d’amorçage中央値との差analysis to=functions.bash даҩախ্ছে  彩神争霸安卓 代理娱乐  კომენტary  天天中彩票怎么json
      {"command":"printf '%s' \"Agent bootstrapping ritual that seeds the workspace and identity files\" | python3 - <<'PY'\nimport sys\ntext=sys.stdin.read()\nprint(text)\nPY"}
    - Déboguer la configuration d’identité de l’onboarding
sidebarTitle: Bootstrapping
summary: Rituel d’amorçage de l’agent qui initialise l’espace de travail et les fichiers d’identité
title: Amorçage de l’agent
x-i18n:
    generated_at: "2026-04-24T07:32:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c23a204a7afbf2ca0c0d19a227286cf0ae396181073403055db41dafa764d2a
    source_path: start/bootstrapping.md
    workflow: 15
---

L’amorçage est le rituel de **premier lancement** qui prépare un espace de travail d’agent et
collecte les détails d’identité. Il a lieu après l’onboarding, lorsque l’agent démarre
pour la première fois.

## Ce que fait l’amorçage

Lors de la première exécution de l’agent, OpenClaw amorce l’espace de travail (par défaut
`~/.openclaw/workspace`) :

- Initialise `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Exécute un court rituel de questions/réponses (une question à la fois).
- Écrit l’identité + les préférences dans `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Supprime `BOOTSTRAP.md` une fois terminé afin qu’il ne s’exécute qu’une seule fois.

## Où cela s’exécute

L’amorçage s’exécute toujours sur l’**hôte gateway**. Si l’application macOS se connecte à
un Gateway distant, l’espace de travail et les fichiers d’amorçage se trouvent sur cette
machine distante.

<Note>
Lorsque le Gateway s’exécute sur une autre machine, modifiez les fichiers d’espace de travail sur l’hôte gateway
(par exemple, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Documentation liée

- Onboarding de l’application macOS : [Onboarding](/fr/start/onboarding)
- Structure de l’espace de travail : [Espace de travail d’agent](/fr/concepts/agent-workspace)
