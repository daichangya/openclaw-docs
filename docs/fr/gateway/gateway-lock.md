---
read_when:
    - Exécution ou débogage du processus de passerelle
    - Investigation de l’application d’une instance unique
summary: Garde singleton de la passerelle utilisant la liaison de l’écouteur WebSocket
title: Verrou de passerelle
x-i18n:
    generated_at: "2026-04-05T12:41:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 726c687ab53f2dd1e46afed8fc791b55310a5c1e62f79a0e38a7dc4ca7576093
    source_path: gateway/gateway-lock.md
    workflow: 15
---

# Verrou de passerelle

## Pourquoi

- Garantir qu’une seule instance de passerelle s’exécute par port de base sur le même hôte ; les passerelles supplémentaires doivent utiliser des profils isolés et des ports uniques.
- Survivre aux plantages/SIGKILL sans laisser de fichiers de verrouillage obsolètes.
- Échouer rapidement avec une erreur claire lorsque le port de contrôle est déjà occupé.

## Mécanisme

- La passerelle lie l’écouteur WebSocket (par défaut `ws://127.0.0.1:18789`) immédiatement au démarrage à l’aide d’un écouteur TCP exclusif.
- Si la liaison échoue avec `EADDRINUSE`, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Le système d’exploitation libère automatiquement l’écouteur à toute sortie du processus, y compris en cas de plantage et de SIGKILL — aucun fichier de verrouillage séparé ni étape de nettoyage n’est nécessaire.
- À l’arrêt, la passerelle ferme le serveur WebSocket et le serveur HTTP sous-jacent afin de libérer rapidement le port.

## Surface d’erreur

- Si un autre processus détient le port, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Les autres échecs de liaison apparaissent comme `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Remarques opérationnelles

- Si le port est occupé par un _autre_ processus, l’erreur est la même ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- L’app macOS conserve toujours son propre garde PID léger avant de lancer la passerelle ; le verrou d’exécution est appliqué par la liaison WebSocket.

## Lié

- [Passerelles multiples](/gateway/multiple-gateways) — exécuter plusieurs instances avec des ports uniques
- [Dépannage](/gateway/troubleshooting) — diagnostic de `EADDRINUSE` et des conflits de port
