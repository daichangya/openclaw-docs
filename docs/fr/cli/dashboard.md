---
read_when:
    - Vous souhaitez ouvrir l’interface de contrôle avec votre jeton actuel
    - Vous souhaitez afficher l’URL sans lancer de navigateur
summary: Référence CLI pour `openclaw dashboard` (ouvrir l’interface de contrôle)
title: Tableau de bord
x-i18n:
    generated_at: "2026-04-24T07:03:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Ouvrez l’interface de contrôle à l’aide de votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Remarques :

- `dashboard` résout les SecretRef configurés dans `gateway.auth.token` lorsque c’est possible.
- Pour les jetons gérés par SecretRef (résolus ou non résolus), `dashboard` affiche/copie/ouvre une URL sans jeton afin d’éviter d’exposer des secrets externes dans la sortie du terminal, l’historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais non résolu dans ce chemin de commande, la commande affiche une URL sans jeton ainsi que des indications explicites de remédiation au lieu d’intégrer un espace réservé de jeton invalide.

## Associé

- [Référence CLI](/fr/cli)
- [Tableau de bord](/fr/web/dashboard)
