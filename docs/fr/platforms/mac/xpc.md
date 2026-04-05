---
read_when:
    - Modification des contrats IPC ou de l’IPC de l’application de barre de menus
summary: Architecture IPC macOS pour l’application OpenClaw, le transport de nœud de la passerelle et PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-05T12:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Architecture IPC macOS OpenClaw

**Modèle actuel :** un socket Unix local connecte le **service hôte du nœud** à l’**application macOS** pour les approbations exec + `system.run`. Une CLI de débogage `openclaw-mac` existe pour les vérifications discovery/connect ; les actions d’agent continuent de passer par le WebSocket de la passerelle et `node.invoke`. L’automatisation de l’interface utilise PeekabooBridge.

## Objectifs

- Une seule instance d’application GUI qui possède tout le travail lié à TCC (notifications, enregistrement d’écran, micro, voix, AppleScript).
- Une petite surface pour l’automatisation : passerelle + commandes de nœud, plus PeekabooBridge pour l’automatisation UI.
- Des autorisations prévisibles : toujours le même bundle ID signé, lancé par launchd, afin que les autorisations TCC persistent.

## Fonctionnement

### Passerelle + transport de nœud

- L’application exécute la passerelle (mode local) et s’y connecte comme nœud.
- Les actions de l’agent sont effectuées via `node.invoke` (par ex. `system.run`, `system.notify`, `canvas.*`).

### Service de nœud + IPC de l’application

- Un service hôte de nœud headless se connecte au WebSocket de la passerelle.
- Les requêtes `system.run` sont transférées à l’application macOS via un socket Unix local.
- L’application exécute la commande dans le contexte UI, affiche une invite si nécessaire, puis renvoie la sortie.

Schéma (SCI) :

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (automatisation UI)

- L’automatisation UI utilise un socket UNIX distinct nommé `bridge.sock` et le protocole JSON PeekabooBridge.
- Ordre de préférence des hôtes (côté client) : Peekaboo.app → Claude.app → OpenClaw.app → exécution locale.
- Sécurité : les hôtes bridge nécessitent un TeamID autorisé ; l’échappatoire DEBUG-only pour le même UID est protégée par `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (convention Peekaboo).
- Voir : [Utilisation de PeekabooBridge](/platforms/mac/peekaboo) pour les détails.

## Flux opérationnels

- Redémarrage/reconstruction : `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Tue les instances existantes
  - Build Swift + packaging
  - Écrit/bootstrap/kickstart le LaunchAgent
- Instance unique : l’application quitte immédiatement si une autre instance avec le même bundle ID est déjà en cours d’exécution.

## Remarques de durcissement

- Préférez exiger une correspondance TeamID pour toutes les surfaces privilégiées.
- PeekabooBridge : `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG-only) peut autoriser des appelants du même UID pour le développement local.
- Toute la communication reste locale uniquement ; aucun socket réseau n’est exposé.
- Les invites TCC proviennent uniquement du bundle de l’application GUI ; conservez un bundle ID signé stable entre les reconstructions.
- Durcissement IPC : mode de socket `0600`, jeton, vérifications d’UID pair, challenge/réponse HMAC, TTL court.
