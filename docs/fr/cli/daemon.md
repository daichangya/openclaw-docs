---
read_when:
    - Vous utilisez encore `openclaw daemon ...` dans des scripts
    - Vous avez besoin des commandes de cycle de vie du service (install/start/stop/restart/status)
summary: Référence CLI pour `openclaw daemon` (alias hérité pour la gestion du service gateway)
title: daemon
x-i18n:
    generated_at: "2026-04-05T12:37:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91fdaf3c4f3e7dd4dff86f9b74a653dcba2674573698cf51efc4890077994169
    source_path: cli/daemon.md
    workflow: 15
---

# `openclaw daemon`

Alias hérité pour les commandes de gestion du service Gateway.

`openclaw daemon ...` correspond à la même surface de contrôle du service que les commandes de service `openclaw gateway ...`.

## Utilisation

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Sous-commandes

- `status` : afficher l’état d’installation du service et sonder l’état de santé de la Gateway
- `install` : installer le service (`launchd`/`systemd`/`schtasks`)
- `uninstall` : supprimer le service
- `start` : démarrer le service
- `stop` : arrêter le service
- `restart` : redémarrer le service

## Options courantes

- `status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- cycle de vie (`uninstall|start|stop|restart`) : `--json`

Remarques :

- `status` résout les SecretRef d’authentification configurés pour l’authentification de la probe lorsque c’est possible.
- Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `daemon status --json` signale `rpc.authWarning` lorsque la connectivité/authentification de la probe échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la probe réussit, les avertissements d’auth-ref non résolus sont supprimés afin d’éviter les faux positifs.
- `status --deep` ajoute une analyse système au mieux de ses possibilités du service. Lorsqu’il trouve d’autres services de type gateway, la sortie humaine affiche des conseils de nettoyage et avertit qu’une seule gateway par machine reste la recommandation normale.
- Sur les installations Linux systemd, les vérifications de dérive du jeton dans `status` incluent à la fois les sources d’unité `Environment=` et `EnvironmentFile=`.
- Les vérifications de dérive résolvent les SecretRef `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (environnement de commande du service en premier, puis solution de repli sur l’environnement du processus).
- Si l’authentification par jeton n’est pas effectivement active (mode `gateway.auth.mode` explicite à `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat jeton ne peut l’emporter), les vérifications de dérive du jeton ignorent la résolution du jeton de configuration.
- Lorsque l’authentification par jeton requiert un jeton et que `gateway.auth.token` est géré par SecretRef, `install` valide que le SecretRef peut être résolu mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’authentification par jeton requiert un jeton et que le SecretRef du jeton configuré n’est pas résolu, l’installation échoue en mode fermé.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Si vous exécutez intentionnellement plusieurs gateways sur un même hôte, isolez les ports, la configuration/l’état et les espaces de travail ; voir [/gateway#multiple-gateways-same-host](/gateway#multiple-gateways-same-host).

## Préférer

Utilisez [`openclaw gateway`](/cli/gateway) pour la documentation et les exemples actuels.
