---
read_when:
    - Vous voulez vérifier rapidement l’état de santé de la Gateway en cours d’exécution
summary: Référence CLI pour `openclaw health` (instantané d’état de santé de la gateway via RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T12:37:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Récupère l’état de santé depuis la Gateway en cours d’exécution.

Options :

- `--json` : sortie lisible par machine
- `--timeout <ms>` : délai d’expiration de connexion en millisecondes (par défaut `10000`)
- `--verbose` : journalisation détaillée
- `--debug` : alias de `--verbose`

Exemples :

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Remarques :

- `openclaw health` par défaut demande à la gateway en cours d’exécution son instantané d’état de santé. Lorsque la
  gateway dispose déjà d’un instantané en cache récent, elle peut renvoyer cette charge utile en cache et
  actualiser en arrière-plan.
- `--verbose` force une probe en direct, affiche les détails de connexion de la gateway et développe la
  sortie lisible par les humains sur tous les comptes et agents configurés.
- La sortie inclut les stockages de session par agent lorsque plusieurs agents sont configurés.
