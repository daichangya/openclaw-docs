---
read_when:
    - Vous souhaitez ouvrir l'interface utilisateur de contrôle avec votre jeton actuel
    - Vous souhaitez afficher l'URL sans lancer de navigateur
summary: Référence CLI pour `openclaw dashboard` (ouvrir l'interface utilisateur de contrôle)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T12:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Ouvrez l'interface utilisateur de contrôle en utilisant votre authentification actuelle.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Remarques :

- `dashboard` résout les SecretRef `gateway.auth.token` configurés lorsque c'est possible.
- Pour les jetons gérés par SecretRef (résolus ou non résolus), `dashboard` affiche/copiez/ouvre une URL sans jeton afin d'éviter d'exposer des secrets externes dans la sortie du terminal, l'historique du presse-papiers ou les arguments de lancement du navigateur.
- Si `gateway.auth.token` est géré par SecretRef mais n'est pas résolu dans ce chemin de commande, la commande affiche une URL sans jeton ainsi que des instructions de remédiation explicites au lieu d'intégrer un espace réservé de jeton invalide.
