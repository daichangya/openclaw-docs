---
read_when:
    - Vous avez des problèmes de connectivité/d’authentification et souhaitez des correctifs guidés
    - Vous avez mis à jour et souhaitez un contrôle de cohérence
summary: Référence CLI pour `openclaw doctor` (vérifications d’état + réparations guidées)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T07:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Vérifications d’état + correctifs rapides pour le gateway et les canaux.

Articles connexes :

- Dépannage : [Dépannage](/fr/gateway/troubleshooting)
- Audit de sécurité : [Sécurité](/fr/gateway/security)

## Exemples

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Options

- `--no-workspace-suggestions` : désactiver les suggestions de mémoire/recherche d’espace de travail
- `--yes` : accepter les valeurs par défaut sans demander
- `--repair` : appliquer les réparations recommandées sans demander
- `--fix` : alias de `--repair`
- `--force` : appliquer des réparations agressives, y compris l’écrasement de la configuration de service personnalisée si nécessaire
- `--non-interactive` : exécuter sans invite ; migrations sûres uniquement
- `--generate-gateway-token` : générer et configurer un jeton Gateway
- `--deep` : analyser les services système à la recherche d’installations Gateway supplémentaires

Remarques :

- Les invites interactives (comme les correctifs de trousseau/OAuth) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (Cron, Telegram, sans terminal) ignorent les invites.
- Performance : les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les vérifications d’état sans interface restent rapides. Les sessions interactives chargent toujours complètement les plugins lorsqu’une vérification a besoin de leur contribution.
- `--fix` (alias de `--repair`) écrit une sauvegarde dans `~/.openclaw/openclaw.json.bak` et supprime les clés de configuration inconnues, en listant chaque suppression.
- Les vérifications d’intégrité d’état détectent désormais les fichiers de transcription orphelins dans le répertoire des sessions et peuvent les archiver sous `.deleted.<timestamp>` afin de récupérer de l’espace en toute sécurité.
- Doctor analyse également `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciens formats de jobs Cron et peut les réécrire sur place avant que le planificateur n’ait à les auto-normaliser à l’exécution.
- Doctor répare les dépendances runtime manquantes des plugins inclus sans nécessiter d’accès en écriture au package OpenClaw installé. Pour les installations npm appartenant à root ou les unités systemd renforcées, définissez `OPENCLAW_PLUGIN_STAGE_DIR` vers un répertoire inscriptible comme `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migre automatiquement l’ancienne configuration plate de Talk (`talk.voiceId`, `talk.modelId`, etc.) vers `talk.provider` + `talk.providers.<provider>`.
- Les exécutions répétées de `doctor --fix` ne signalent ni n’appliquent plus de normalisation Talk lorsque la seule différence est l’ordre des clés d’objet.
- Doctor inclut une vérification de préparation de la recherche mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’embedding sont manquants.
- Si le mode sandbox est activé mais que Docker n’est pas disponible, doctor signale un avertissement à fort signal avec une remédiation (`installer Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor signale un avertissement en lecture seule et n’écrit pas d’identifiants de secours en clair.
- Si l’inspection de SecretRef de canal échoue dans un chemin de correction, doctor continue et signale un avertissement au lieu de s’arrêter prématurément.
- L’auto-résolution des noms d’utilisateur Telegram `allowFrom` (`doctor --fix`) nécessite un jeton Telegram résoluble dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor signale un avertissement et ignore l’auto-résolution pour cette exécution.

## macOS : surcharges d’environnement `launchctl`

Si vous avez déjà exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Articles connexes

- [Référence CLI](/fr/cli)
- [Gateway doctor](/fr/gateway/doctor)
