---
read_when:
    - Vous avez besoin de journaux de débogage ciblés sans augmenter les niveaux de journalisation globaux
    - Vous devez capturer des journaux spécifiques à un sous-système pour le support
summary: Indicateurs de diagnostic pour des journaux de débogage ciblés
title: Indicateurs de diagnostic
x-i18n:
    generated_at: "2026-04-05T12:41:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Indicateurs de diagnostic

Les indicateurs de diagnostic vous permettent d’activer des journaux de débogage ciblés sans activer la journalisation verbeuse partout. Les indicateurs sont facultatifs et n’ont aucun effet tant qu’un sous-système ne les vérifie pas.

## Fonctionnement

- Les indicateurs sont des chaînes (insensibles à la casse).
- Vous pouvez activer des indicateurs dans la configuration ou via un remplacement env.
- Les jokers sont pris en charge :
  - `telegram.*` correspond à `telegram.http`
  - `*` active tous les indicateurs

## Activation via la configuration

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Plusieurs indicateurs :

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Redémarrez la passerelle après avoir modifié les indicateurs.

## Remplacement env (ponctuel)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Désactiver tous les indicateurs :

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Emplacement des journaux

Les indicateurs émettent des journaux dans le fichier standard de diagnostic. Par défaut :

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Si vous définissez `logging.file`, utilisez ce chemin à la place. Les journaux sont au format JSONL (un objet JSON par ligne). L’expurgation s’applique toujours selon `logging.redactSensitive`.

## Extraire les journaux

Choisir le fichier journal le plus récent :

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filtrer les diagnostics HTTP Telegram :

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Ou suivre pendant la reproduction :

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Pour les passerelles distantes, vous pouvez aussi utiliser `openclaw logs --follow` (voir [/cli/logs](/cli/logs)).

## Remarques

- Si `logging.level` est défini au-dessus de `warn`, ces journaux peuvent être supprimés. La valeur par défaut `info` convient.
- Ces indicateurs peuvent rester activés sans risque ; ils n’affectent que le volume de journalisation du sous-système spécifique.
- Utilisez [/logging](/logging) pour modifier les destinations de journaux, les niveaux et l’expurgation.
