---
read_when:
    - Vous avez des problèmes de connectivité/authentification et souhaitez des correctifs guidés
    - Vous avez effectué une mise à jour et souhaitez une vérification de cohérence
summary: Référence CLI pour `openclaw doctor` (contrôles d’état + réparations guidées)
title: doctor
x-i18n:
    generated_at: "2026-04-05T12:38:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Contrôles d’état + correctifs rapides pour la passerelle et les canaux.

Lié :

- Dépannage : [Troubleshooting](/gateway/troubleshooting)
- Audit de sécurité : [Security](/gateway/security)

## Exemples

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche de l’espace de travail
- `--yes` : accepter les valeurs par défaut sans invite
- `--repair` : appliquer les réparations recommandées sans invite
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement d’une configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invites ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton de passerelle
- `--deep` : analyser les services système pour détecter des installations supplémentaires de passerelle

Remarques :

- Les invites interactives (comme les correctifs keychain/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignorent les invites.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les contrôles d’intégrité de l’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions et peuvent les archiver en `.deleted.<timestamp>` pour récupérer de l’espace en toute sécurité.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche de formats hérités de tâches cron et peut les réécrire sur place avant que le planificateur doive les normaliser automatiquement à l’exécution.
- Doctor migre automatiquement l’ancienne configuration plate Talk (`talk.voiceId`, `talk.modelId` et similaires) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent ni n’appliquent plus de normalisation Talk lorsque la seule différence concerne l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’intégration sont manquants.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement clair avec une remédiation (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection de SecretRef du canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de quitter prématurément.
- L’auto-résolution des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor signale un avertissement et ignore l’auto-résolution pour cette exécution.

## macOS : remplacements env `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
