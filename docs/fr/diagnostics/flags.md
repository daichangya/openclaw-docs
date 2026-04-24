---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez capturer des journaux spécifiques à un sous-système pour le support
summary: Options de diagnostic pour des journaux de débogage ciblés
title: Options de diagnostic
x-i18n:
    generated_at: "2026-04-24T07:08:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Les options de diagnostic vous permettent d’activer des journaux de débogage ciblés sans activer la journalisation verbeuse partout. Les options sont opt-in et n’ont aucun effet tant qu’un sous-système ne les vérifie pas.

## Fonctionnement

- Les options sont des chaînes (insensibles à la casse).
- Vous pouvez activer les options dans la configuration ou via un remplacement par variable d’environnement.
- Les jokers sont pris en charge :
  - `telegram.*` correspond à `telegram.http`
  - `*` active toutes les options

## Activer via la configuration

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Options multiples :

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Redémarrez le gateway après avoir modifié les options.

## Remplacement via variable d’environnement (ponctuel)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Désactiver toutes les options :

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Où vont les journaux

Les options émettent les journaux dans le fichier de diagnostics standard. Par défaut :

```text
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si vous définissez `logging.file`, utilisez ce chemin à la place. Les journaux sont au format JSONL (un objet JSON par ligne). L’expurgation s’applique toujours selon `logging.redactSensitive`.

## Extraire les journaux

Choisissez le fichier journal le plus récent :

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrer pour les diagnostics HTTP Telegram :

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Ou suivre en direct pendant la reproduction :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les gateways distants, vous pouvez aussi utiliser `openclaw logs --follow` (voir [/cli/logs](/fr/cli/logs)).

## Remarques

- Si `logging.level` est défini à une valeur supérieure à `warn`, ces journaux peuvent être supprimés. La valeur par défaut `info` convient.
- Ces options peuvent rester activées sans risque ; elles n’affectent que le volume de journaux du sous-système spécifique.
- Utilisez [/logging](/fr/logging) pour modifier les destinations, niveaux et règles d’expurgation des journaux.

## Lié

- [Diagnostics du Gateway](/fr/gateway/diagnostics)
- [Dépannage du Gateway](/fr/gateway/troubleshooting)
