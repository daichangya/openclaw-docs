---
read_when:
    - Exécuter ou déboguer le processus Gateway
    - Enquêter sur l’application de l’instance unique
summary: Garde singleton du Gateway utilisant la liaison du listener WebSocket
title: Verrou du Gateway
x-i18n:
    generated_at: "2026-04-24T07:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## Pourquoi

- Garantir qu’une seule instance du gateway s’exécute par port de base sur le même hôte ; les gateways supplémentaires doivent utiliser des profils isolés et des ports uniques.
- Survivre aux crashs/SIGKILL sans laisser de fichiers de verrou obsolètes.
- Échouer rapidement avec une erreur claire lorsque le port de contrôle est déjà occupé.

## Mécanisme

- Le gateway lie le listener WebSocket (par défaut `ws://127.0.0.1:18789`) immédiatement au démarrage à l’aide d’un listener TCP exclusif.
- Si la liaison échoue avec `EADDRINUSE`, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- L’OS libère automatiquement le listener à toute sortie du processus, y compris en cas de crash et de SIGKILL — aucun fichier de verrou séparé ni étape de nettoyage n’est nécessaire.
- À l’arrêt, le gateway ferme le serveur WebSocket et le serveur HTTP sous-jacent afin de libérer rapidement le port.

## Surface d’erreur

- Si un autre processus détient le port, le démarrage lève `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- Les autres échecs de liaison apparaissent sous la forme `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## Remarques opérationnelles

- Si le port est occupé par _un autre_ processus, l’erreur est la même ; libérez le port ou choisissez-en un autre avec `openclaw gateway --port <port>`.
- L’app macOS conserve toujours sa propre garde PID légère avant de lancer le gateway ; le verrou runtime est appliqué par la liaison WebSocket.

## Articles connexes

- [Plusieurs Gateways](/fr/gateway/multiple-gateways) — exécuter plusieurs instances avec des ports uniques
- [Dépannage](/fr/gateway/troubleshooting) — diagnostiquer `EADDRINUSE` et les conflits de ports
