---
read_when:
    - OpenClaw ne fonctionne pas et vous avez besoin du chemin le plus rapide vers une correction
    - Vous voulez un flux de triage avant de vous plonger dans des runbooks détaillés
summary: Centre de dépannage orienté symptômes pour OpenClaw
title: Dépannage général
x-i18n:
    generated_at: "2026-04-20T07:06:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5d8c9f804084985c672c5a003ce866e8142ab99fe81abb7a0d38e22aea4b88
    source_path: help/troubleshooting.md
    workflow: 15
---

# Dépannage

Si vous n’avez que 2 minutes, utilisez cette page comme point d’entrée de triage.

## 60 premières secondes

Exécutez exactement cette séquence dans cet ordre :

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Bon résultat en une ligne :

- `openclaw status` → affiche les canaux configurés et aucune erreur d’authentification évidente.
- `openclaw status --all` → le rapport complet est présent et partageable.
- `openclaw gateway probe` → la cible Gateway attendue est joignable (`Reachable: yes`). `Capability: ...` indique quel niveau d’authentification la sonde a pu prouver, et `Read probe: limited - missing scope: operator.read` correspond à un diagnostic dégradé, pas à un échec de connexion.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok`, et une ligne `Capability: ...` plausible. Utilisez `--require-rpc` si vous avez aussi besoin d’une preuve RPC à portée lecture.
- `openclaw doctor` → aucune erreur bloquante de configuration/service.
- `openclaw channels status --probe` → un gateway joignable renvoie l’état de transport en direct par compte
  ainsi que les résultats des sondes/audits tels que `works` ou `audit ok` ; si le
  gateway est inaccessible, la commande revient à des résumés basés uniquement sur la configuration.
- `openclaw logs --follow` → activité régulière, sans erreurs fatales répétées.

## 429 Anthropic sur un long contexte

Si vous voyez :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
allez à [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Le backend local compatible OpenAI fonctionne en direct mais échoue dans OpenClaw

Si votre backend local ou auto-hébergé `/v1` répond à de petites sondes directes
`/v1/chat/completions` mais échoue avec `openclaw infer model run` ou pendant des
tours d’agent normaux :

1. Si l’erreur mentionne que `messages[].content` attend une chaîne, définissez
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Si le backend échoue toujours uniquement pendant les tours d’agent OpenClaw, définissez
   `models.providers.<provider>.models[].compat.supportsTools: false` puis réessayez.
3. Si de minuscules appels directs fonctionnent toujours mais que des prompts OpenClaw plus volumineux font planter le
   backend, considérez le problème restant comme une limitation du modèle/serveur amont et
   poursuivez dans le runbook détaillé :
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## L’installation du Plugin échoue avec des extensions openclaw manquantes

Si l’installation échoue avec `package.json missing openclaw.extensions`, le package du Plugin
utilise une ancienne structure qu’OpenClaw n’accepte plus.

Correction dans le package du Plugin :

1. Ajoutez `openclaw.extensions` à `package.json`.
2. Faites pointer les entrées vers les fichiers d’exécution compilés (généralement `./dist/index.js`).
3. Republiez le Plugin et exécutez à nouveau `openclaw plugins install <package>`.

Exemple :

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Référence : [Architecture des plugins](/fr/plugins/architecture)

## Arbre de décision

```mermaid
flowchart TD
  A[OpenClaw ne fonctionne pas] --> B{Qu’est-ce qui casse en premier}
  B --> C[Pas de réponses]
  B --> D[Le tableau de bord ou l’interface utilisateur de contrôle ne se connecte pas]
  B --> E[Le Gateway ne démarre pas ou le service n’est pas en cours d’exécution]
  B --> F[Le canal se connecte mais les messages ne circulent pas]
  B --> G[Cron ou Heartbeat ne s’est pas déclenché ou n’a pas livré]
  B --> H[Le Node est appairé mais l’exécution camera canvas screen échoue]
  B --> I[L’outil browser échoue]

  C --> C1[/Section Pas de réponses/]
  D --> D1[/Section Interface utilisateur de contrôle/]
  E --> E1[/Section Gateway/]
  F --> F1[/Section Flux des canaux/]
  G --> G1[/Section Automatisation/]
  H --> H1[/Section Outils Node/]
  I --> I1[/Section Browser/]
```

<AccordionGroup>
  <Accordion title="Pas de réponses">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Un bon résultat ressemble à ceci :

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`
    - Votre canal affiche le transport connecté et, lorsque c’est pris en charge, `works` ou `audit ok` dans `channels status --probe`
    - L’expéditeur apparaît comme approuvé (ou la politique DM est ouverte/avec liste d’autorisation)

    Signatures de journaux courantes :

    - `drop guild message (mention required` → la contrainte de mention a bloqué le message dans Discord.
    - `pairing request` → l’expéditeur n’est pas approuvé et attend une approbation d’appairage DM.
    - `blocked` / `allowlist` dans les journaux du canal → l’expéditeur, le salon ou le groupe est filtré.

    Pages détaillées :

    - [/gateway/troubleshooting#no-replies](/fr/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/fr/channels/troubleshooting)
    - [/channels/pairing](/fr/channels/pairing)

  </Accordion>

  <Accordion title="Le tableau de bord ou l’interface utilisateur de contrôle ne se connecte pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un bon résultat ressemble à ceci :

    - `Dashboard: http://...` est affiché dans `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`
    - Aucune boucle d’authentification dans les journaux

    Signatures de journaux courantes :

    - `device identity required` → le contexte HTTP/non sécurisé ne peut pas terminer l’authentification de l’appareil.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas autorisé pour la
      cible Gateway de l’interface utilisateur de contrôle.
    - `AUTH_TOKEN_MISMATCH` avec des indications de nouvelle tentative (`canRetryWithDeviceToken=true`) → une nouvelle tentative avec un device token de confiance peut se produire automatiquement.
    - Cette nouvelle tentative avec jeton en cache réutilise l’ensemble des portées en cache stocké avec le
      device token appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent
      plutôt l’ensemble de portées demandé.
    - Sur le chemin asynchrone de l’interface utilisateur de contrôle Tailscale Serve, les tentatives échouées pour le même
      `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec ; ainsi, une
      deuxième mauvaise tentative concurrente peut déjà afficher `retry later`.
    - `too many failed authentication attempts (retry later)` depuis une origine de navigateur localhost
      → des échecs répétés depuis cette même `Origin` sont temporairement bloqués ; une autre origine localhost utilise un compartiment distinct.
    - `repeated unauthorized` après cette nouvelle tentative → mauvais token/mot de passe, incompatibilité de mode d’authentification ou device token appairé obsolète.
    - `gateway connect failed:` → l’interface cible la mauvaise URL/le mauvais port ou un gateway inaccessible.

    Pages détaillées :

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/fr/gateway/authentication)

  </Accordion>

  <Accordion title="Le Gateway ne démarre pas ou le service est installé mais n’est pas en cours d’exécution">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un bon résultat ressemble à ceci :

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`

    Signatures de journaux courantes :

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode gateway est distant, ou il manque le tampon de mode local dans le fichier de configuration et celui-ci doit être réparé.
    - `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification gateway valide (token/mot de passe, ou trusted-proxy lorsque configuré).
    - `another gateway instance is already listening` ou `EADDRINUSE` → port déjà utilisé.

    Pages détaillées :

    - [/gateway/troubleshooting#gateway-service-not-running](/fr/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/fr/gateway/background-process)
    - [/gateway/configuration](/fr/gateway/configuration)

  </Accordion>

  <Accordion title="Le canal se connecte mais les messages ne circulent pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un bon résultat ressemble à ceci :

    - Le transport du canal est connecté.
    - Les vérifications d’appairage/liste d’autorisation réussissent.
    - Les mentions sont détectées lorsque requis.

    Signatures de journaux courantes :

    - `mention required` → la contrainte de mention de groupe a bloqué le traitement.
    - `pairing` / `pending` → l’expéditeur du DM n’est pas encore approuvé.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problème de jeton d’autorisation du canal.

    Pages détaillées :

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/fr/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/fr/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron ou Heartbeat ne s’est pas déclenché ou n’a pas livré">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Un bon résultat ressemble à ceci :

    - `cron.status` indique activé avec un prochain réveil.
    - `cron runs` affiche des entrées récentes `ok`.
    - Heartbeat est activé et n’est pas hors des heures actives.

    Signatures de journaux courantes :

    - `cron: scheduler disabled; jobs will not run automatically` → Cron est désactivé.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors des heures actives configurées.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient qu’une structure vide/ou seulement des en-têtes.
    - `heartbeat skipped` avec `reason=no-tasks-due` → le mode tâche de `HEARTBEAT.md` est actif mais aucun intervalle de tâche n’est encore arrivé à échéance.
    - `heartbeat skipped` avec `reason=alerts-disabled` → toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés).
    - `requests-in-flight` → voie principale occupée ; le réveil Heartbeat a été différé.
    - `unknown accountId` → le compte cible de livraison Heartbeat n’existe pas.

    Pages détaillées :

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/fr/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/fr/gateway/heartbeat)

    </Accordion>

    <Accordion title="Le Node est appairé mais l’outil échoue sur camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Un bon résultat ressemble à ceci :

      - Le Node est répertorié comme connecté et appairé pour le rôle `node`.
      - La capacité existe pour la commande que vous invoquez.
      - L’état d’autorisation est accordé pour l’outil.

      Signatures de journaux courantes :

      - `NODE_BACKGROUND_UNAVAILABLE` → faites passer l’application node au premier plan.
      - `*_PERMISSION_REQUIRED` → l’autorisation OS a été refusée/manque.
      - `SYSTEM_RUN_DENIED: approval required` → l’approbation d’exécution est en attente.
      - `SYSTEM_RUN_DENIED: allowlist miss` → la commande n’est pas dans la liste d’autorisation d’exécution.

      Pages détaillées :

      - [/gateway/troubleshooting#node-paired-tool-fails](/fr/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/fr/nodes/troubleshooting)
      - [/tools/exec-approvals](/fr/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec demande soudainement une approbation">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Ce qui a changé :

      - Si `tools.exec.host` n’est pas défini, la valeur par défaut est `auto`.
      - `host=auto` se résout vers `sandbox` lorsqu’un environnement d’exécution sandbox est actif, sinon vers `gateway`.
      - `host=auto` ne concerne que le routage ; le comportement sans invite « YOLO » vient de `security=full` plus `ask=off` sur gateway/node.
      - Sur `gateway` et `node`, `tools.exec.security` non défini vaut par défaut `full`.
      - `tools.exec.ask` non défini vaut par défaut `off`.
      - Résultat : si vous voyez des demandes d’approbation, une politique locale à l’hôte ou propre à la session a durci exec par rapport aux valeurs par défaut actuelles.

      Restaurer le comportement actuel par défaut sans approbation :

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternatives plus sûres :

      - Définissez uniquement `tools.exec.host=gateway` si vous voulez simplement un routage hôte stable.
      - Utilisez `security=allowlist` avec `ask=on-miss` si vous voulez l’exécution sur l’hôte tout en conservant une revue en cas d’absence dans la liste d’autorisation.
      - Activez le mode sandbox si vous voulez que `host=auto` se résolve de nouveau vers `sandbox`.

      Signatures de journaux courantes :

      - `Approval required.` → la commande attend `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → l’approbation de l’exécution sur l’hôte node est en attente.
      - `exec host=sandbox requires a sandbox runtime for this session` → sélection sandbox implicite/explicite alors que le mode sandbox est désactivé.

      Pages détaillées :

      - [/tools/exec](/fr/tools/exec)
      - [/tools/exec-approvals](/fr/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/fr/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="L’outil browser échoue">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Un bon résultat ressemble à ceci :

      - L’état du browser affiche `running: true` ainsi qu’un navigateur/profil sélectionné.
      - `openclaw` démarre, ou `user` peut voir les onglets Chrome locaux.

      Signatures de journaux courantes :

      - `unknown command "browser"` ou `unknown command 'browser'` → `plugins.allow` est défini et n’inclut pas `browser`.
      - `Failed to start Chrome CDP on port` → le lancement du navigateur local a échoué.
      - `browser.executablePath not found` → le chemin du binaire configuré est incorrect.
      - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge.
      - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port incorrect ou hors plage.
      - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
      - `Remote CDP for profile "<name>" is not reachable` → l’endpoint CDP distant configuré n’est pas joignable depuis cet hôte.
      - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a aucune cible CDP active.
      - remplacements obsolètes de viewport / mode sombre / paramètres régionaux / hors ligne sur les profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation sans redémarrer le gateway.

      Pages détaillées :

      - [/gateway/troubleshooting#browser-tool-fails](/fr/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/fr/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Associé

- [FAQ](/fr/help/faq) — questions fréquemment posées
- [Dépannage Gateway](/fr/gateway/troubleshooting) — problèmes spécifiques au Gateway
- [Doctor](/fr/gateway/doctor) — vérifications automatiques de l’état de santé et réparations
- [Dépannage des canaux](/fr/channels/troubleshooting) — problèmes de connectivité des canaux
- [Dépannage de l’automatisation](/fr/automation/cron-jobs#troubleshooting) — problèmes de Cron et Heartbeat
