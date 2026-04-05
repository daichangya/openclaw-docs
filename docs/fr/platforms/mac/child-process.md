---
read_when:
    - Intégrer l'application Mac au cycle de vie de la gateway
summary: Cycle de vie de la gateway sur macOS (launchd)
title: Cycle de vie de la gateway
x-i18n:
    generated_at: "2026-04-05T12:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Cycle de vie de la gateway sur macOS

L'application macOS **gère la gateway via launchd** par défaut et ne lance pas
la gateway comme processus enfant. Elle essaie d'abord de se rattacher à une gateway déjà en cours d'exécution
sur le port configuré ; si aucune n'est joignable, elle active le service launchd
via la CLI externe `openclaw` (sans runtime intégré). Cela vous offre un
démarrage automatique fiable à la connexion et un redémarrage en cas de plantage.

Le mode processus enfant (gateway lancée directement par l'application) **n'est pas utilisé** aujourd'hui.
Si vous avez besoin d'un couplage plus étroit avec l'interface, exécutez la gateway manuellement dans un terminal.

## Comportement par défaut (launchd)

- L'application installe un LaunchAgent par utilisateur étiqueté `ai.openclaw.gateway`
  (ou `ai.openclaw.<profile>` lors de l'utilisation de `--profile`/`OPENCLAW_PROFILE` ; l'ancien `com.openclaw.*` est pris en charge).
- Lorsque le mode local est activé, l'application s'assure que le LaunchAgent est chargé et
  démarre la gateway si nécessaire.
- Les journaux sont écrits dans le chemin de journal gateway launchd (visible dans Debug Settings).

Commandes courantes :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le label par `ai.openclaw.<profile>` lorsque vous exécutez un profil nommé.

## Builds de développement non signées

`scripts/restart-mac.sh --no-sign` sert aux builds locales rapides lorsque vous n'avez pas de
clés de signature. Pour empêcher launchd de pointer vers un binaire de relais non signé, il :

- Écrit `~/.openclaw/disable-launchagent`.

Les exécutions signées de `scripts/restart-mac.sh` effacent ce remplacement si le marqueur est
présent. Pour réinitialiser manuellement :

```bash
rm ~/.openclaw/disable-launchagent
```

## Mode attachement uniquement

Pour forcer l'application macOS à **ne jamais installer ni gérer launchd**, lancez-la avec
`--attach-only` (ou `--no-launchd`). Cela définit `~/.openclaw/disable-launchagent`,
de sorte que l'application se contente de se rattacher à une gateway déjà en cours d'exécution. Vous pouvez activer le même
comportement dans Debug Settings.

## Mode distant

Le mode distant ne démarre jamais de gateway locale. L'application utilise un tunnel SSH vers l'hôte
distant et se connecte via ce tunnel.

## Pourquoi nous préférons launchd

- Démarrage automatique à la connexion.
- Sémantique intégrée de redémarrage/KeepAlive.
- Journaux et supervision prévisibles.

Si un véritable mode processus enfant redevenait nécessaire, il devrait être documenté comme un
mode de développement séparé et explicite uniquement.
