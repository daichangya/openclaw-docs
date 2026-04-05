---
read_when:
    - Compiler ou signer des builds de débogage Mac
summary: Étapes de signature pour les builds de débogage macOS générées par les scripts de packaging
title: Signature macOS
x-i18n:
    generated_at: "2026-04-05T12:48:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Signature mac (builds de débogage)

Cette application est généralement compilée à partir de [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), qui maintenant :

- définit un identifiant de bundle de débogage stable : `ai.openclaw.mac.debug`
- écrit le Info.plist avec cet identifiant de bundle (remplacement via `BUNDLE_ID=...`)
- appelle [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) pour signer le binaire principal et le bundle d’application afin que macOS traite chaque recompilation comme le même bundle signé et conserve les autorisations TCC (notifications, accessibilité, enregistrement d’écran, micro, parole). Pour des autorisations stables, utilisez une véritable identité de signature ; l’ad-hoc est une option explicite et fragile (voir [macOS permissions](/platforms/mac/permissions)).
- utilise `CODESIGN_TIMESTAMP=auto` par défaut ; cela active les horodatages de confiance pour les signatures Developer ID. Définissez `CODESIGN_TIMESTAMP=off` pour ignorer l’horodatage (builds de débogage hors ligne).
- injecte des métadonnées de build dans Info.plist : `OpenClawBuildTimestamp` (UTC) et `OpenClawGitCommit` (hash court) afin que le panneau À propos puisse afficher le build, git et le canal debug/release.
- **Le packaging utilise Node 24 par défaut** : le script exécute les builds TS et le build de Control UI. Node 22 LTS, actuellement `22.14+`, reste pris en charge pour la compatibilité.
- lit `SIGN_IDENTITY` depuis l’environnement. Ajoutez `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (ou votre certificat Developer ID Application) à votre fichier rc shell pour toujours signer avec votre certificat. La signature ad-hoc nécessite une activation explicite via `ALLOW_ADHOC_SIGNING=1` ou `SIGN_IDENTITY="-"` (non recommandé pour les tests d’autorisations).
- exécute un audit Team ID après la signature et échoue si un Mach-O à l’intérieur du bundle d’application est signé avec un Team ID différent. Définissez `SKIP_TEAM_ID_CHECK=1` pour contourner cela.

## Utilisation

```bash
# depuis la racine du dépôt
scripts/package-mac-app.sh               # sélectionne automatiquement l’identité ; échoue si aucune n’est trouvée
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # vrai certificat
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (les autorisations ne persisteront pas)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # ad-hoc explicite (même réserve)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # contournement dev uniquement pour l’incompatibilité Team ID de Sparkle
```

### Remarque sur la signature ad-hoc

Lors de la signature avec `SIGN_IDENTITY="-"` (ad-hoc), le script désactive automatiquement le **Hardened Runtime** (`--options runtime`). Cela est nécessaire pour éviter les plantages lorsque l’application tente de charger des frameworks intégrés (comme Sparkle) qui ne partagent pas le même Team ID. Les signatures ad-hoc cassent également la persistance des autorisations TCC ; voir [macOS permissions](/platforms/mac/permissions) pour les étapes de récupération.

## Métadonnées de build pour À propos

`package-mac-app.sh` marque le bundle avec :

- `OpenClawBuildTimestamp` : ISO8601 UTC au moment du packaging
- `OpenClawGitCommit` : hash git court (ou `unknown` si indisponible)

L’onglet À propos lit ces clés pour afficher la version, la date de build, le commit git et s’il s’agit d’un build de débogage (via `#if DEBUG`). Exécutez l’outil de packaging pour actualiser ces valeurs après des modifications de code.

## Pourquoi

Les autorisations TCC sont liées à l’identifiant de bundle _et_ à la signature de code. Les builds de débogage non signés avec des UUID changeants faisaient que macOS oubliait les autorisations accordées après chaque recompilation. Signer les binaires (ad-hoc par défaut) et conserver un identifiant/chemin de bundle fixe (`dist/OpenClaw.app`) préserve les autorisations entre les builds, conformément à l’approche VibeTunnel.
