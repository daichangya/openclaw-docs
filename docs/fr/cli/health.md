---
read_when:
    - Vous souhaitez vérifier rapidement la santé du Gateway en cours d’exécution
summary: Référence CLI pour `openclaw health` (instantané de santé du Gateway via RPC)
title: Santé
x-i18n:
    generated_at: "2026-04-24T07:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Récupère l’état de santé du Gateway en cours d’exécution.

Options :

- `--json` : sortie lisible par machine
- `--timeout <ms>` : délai d’attente de connexion en millisecondes (par défaut `10000`)
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

- Par défaut, `openclaw health` interroge le Gateway en cours d’exécution pour obtenir son instantané de santé. Lorsque le
  Gateway dispose déjà d’un instantané en cache récent, il peut renvoyer cette charge utile mise en cache et
  actualiser en arrière-plan.
- `--verbose` force une sonde en direct, affiche les détails de connexion du Gateway et développe la
  sortie lisible par humain pour couvrir tous les comptes et agents configurés.
- La sortie inclut les stockages de session par agent lorsque plusieurs agents sont configurés.

## Associé

- [Référence CLI](/fr/cli)
- [Santé du Gateway](/fr/gateway/health)
