---
read_when:
    - OpenClaw ne fonctionne pas et vous avez besoin du chemin le plus rapide vers une solution
    - Vous souhaitez un flux de tri avant de plonger dans les runbooks approfondis
summary: Hub de dépannage orienté par symptôme pour OpenClaw
title: Dépannage général
x-i18n:
    generated_at: "2026-04-24T07:15:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c832c3f7609c56a5461515ed0f693d2255310bf2d3958f69f57c482bcbef97f0
    source_path: help/troubleshooting.md
    workflow: 15
---

Si vous n’avez que 2 minutes, utilisez cette page comme porte d’entrée de tri.

## Les 60 premières secondes

Exécutez exactement cette séquence, dans cet ordre :

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Sortie correcte résumée en une ligne :

- `openclaw status` → affiche les canaux configurés et aucune erreur évidente d’authentification.
- `openclaw status --all` → le rapport complet est présent et partageable.
- `openclaw gateway probe` → la cible gateway attendue est accessible (`Reachable: yes`). `Capability: ...` indique le niveau d’authentification que la sonde a pu prouver, et `Read probe: limited - missing scope: operator.read` correspond à des diagnostics dégradés, pas à un échec de connexion.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok`, et une ligne `Capability: ...` plausible. Utilisez `--require-rpc` si vous avez aussi besoin d’une preuve RPC à portée lecture.
- `openclaw doctor` → aucune erreur bloquante de configuration/service.
- `openclaw channels status --probe` → avec un gateway accessible, la commande renvoie l’état de transport en direct par compte
  plus les résultats de sonde/audit tels que `works` ou `audit ok` ; si le
  gateway est inaccessible, la commande revient à des résumés basés uniquement sur la configuration.
- `openclaw logs --follow` → activité régulière, aucune erreur fatale répétée.

## Anthropic long context 429

Si vous voyez :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
allez à [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Le backend local compatible OpenAI fonctionne directement mais échoue dans OpenClaw

Si votre backend local ou auto-hébergé `/v1` répond aux petites sondes directes
`/v1/chat/completions` mais échoue sur `openclaw infer model run` ou sur des tours
d’agent normaux :

1. Si l’erreur mentionne `messages[].content` qui attend une chaîne, définissez
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Si le backend échoue toujours uniquement sur les tours d’agent OpenClaw, définissez
   `models.providers.<provider>.models[].compat.supportsTools: false` et réessayez.
3. Si les petits appels directs continuent de fonctionner mais que les prompts OpenClaw plus volumineux font planter le
   backend, traitez le problème restant comme une limitation du modèle/serveur en amont et
   continuez dans le runbook approfondi :
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/fr/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## L’installation du plugin échoue avec des extensions openclaw manquantes

Si l’installation échoue avec `package.json missing openclaw.extensions`, le package du plugin
utilise une ancienne forme qu’OpenClaw n’accepte plus.

Correction dans le package du plugin :

1. Ajoutez `openclaw.extensions` à `package.json`.
2. Faites pointer les entrées vers des fichiers runtime compilés (généralement `./dist/index.js`).
3. Republiez le plugin puis exécutez à nouveau `openclaw plugins install <package>`.

Exemple :

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Référence : [Architecture des plugins](/fr/plugins/architecture)

## Arbre de décision

```mermaid
flowchart TD
  A[OpenClaw ne fonctionne pas] --> B{Qu’est-ce qui casse en premier}
  B --> C[Aucune réponse]
  B --> D[Le tableau de bord ou l’interface de contrôle ne se connecte pas]
  B --> E[Le Gateway ne démarre pas ou le service n’est pas en cours d’exécution]
  B --> F[Le canal se connecte mais les messages ne circulent pas]
  B --> G[Cron ou Heartbeat ne s’est pas déclenché ou n’a pas livré]
  B --> H[Le Node est appairé mais camera canvas screen exec échoue]
  B --> I[L’outil navigateur échoue]

  C --> C1[/Section Aucune réponse/]
  D --> D1[/Section Interface de contrôle/]
  E --> E1[/Section Gateway/]
  F --> F1[/Section Flux de canal/]
  G --> G1[/Section Automatisation/]
  H --> H1[/Section Outils Node/]
  I --> I1[/Section Navigateur/]
```

<AccordionGroup>
  <Accordion title="Aucune réponse">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Une bonne sortie ressemble à :

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`
    - Votre canal affiche un transport connecté et, lorsqu’il est pris en charge, `works` ou `audit ok` dans `channels status --probe`
    - L’expéditeur apparaît comme approuvé (ou la politique de message privé est open/allowlist)

    Signatures courantes dans les journaux :

    - `drop guild message (mention required` → le contrôle par mention a bloqué le message dans Discord.
    - `pairing request` → l’expéditeur n’est pas approuvé et attend une approbation d’appairage de message privé.
    - `blocked` / `allowlist` dans les journaux de canal → l’expéditeur, le salon ou le groupe est filtré.

    Pages approfondies :

    - [/gateway/troubleshooting#no-replies](/fr/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/fr/channels/troubleshooting)
    - [/channels/pairing](/fr/channels/pairing)

  </Accordion>

  <Accordion title="Le tableau de bord ou l’interface de contrôle ne se connecte pas">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Une bonne sortie ressemble à :

    - `Dashboard: http://...` est affiché dans `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`
    - Aucune boucle d’authentification dans les journaux

    Signatures courantes dans les journaux :

    - `device identity required` → le contexte HTTP/non sécurisé ne peut pas compléter l’authentification de l’appareil.
    - `origin not allowed` → l’`Origin` du navigateur n’est pas autorisé pour la
      cible gateway de l’interface de contrôle.
    - `AUTH_TOKEN_MISMATCH` avec indices de nouvelle tentative (`canRetryWithDeviceToken=true`) → une nouvelle tentative de confiance avec jeton d’appareil peut se produire automatiquement.
    - Cette nouvelle tentative avec jeton mis en cache réutilise l’ensemble de scopes mis en cache stocké avec le jeton d’appareil appairé. Les appelants avec `deviceToken` explicite / `scopes` explicites conservent
      à la place leur ensemble de scopes demandé.
    - Sur le chemin asynchrone Tailscale Serve de l’interface de contrôle, les tentatives échouées pour le même
      `{scope, ip}` sont sérialisées avant que le limiteur n’enregistre l’échec, de sorte qu’une
      deuxième mauvaise nouvelle tentative concurrente peut déjà afficher `retry later`.
    - `too many failed authentication attempts (retry later)` depuis une origine navigateur localhost
      → les échecs répétés depuis cette même `Origin` sont temporairement
      bloqués ; une autre origine localhost utilise un compartiment distinct.
    - `unauthorized` répété après cette nouvelle tentative → mauvais jeton/mot de passe, incompatibilité de mode d’authentification, ou jeton d’appareil appairé obsolète.
    - `gateway connect failed:` → l’interface cible la mauvaise URL/le mauvais port ou un gateway inaccessible.

    Pages approfondies :

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/fr/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/fr/web/control-ui)
    - [/gateway/authentication](/fr/gateway/authentication)

  </Accordion>

  <Accordion title="Le Gateway ne démarre pas ou le service est installé mais non exécuté">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Une bonne sortie ressemble à :

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable`, ou `admin-capable`

    Signatures courantes dans les journaux :

    - `Gateway start blocked: set gateway.mode=local` ou `existing config is missing gateway.mode` → le mode gateway est distant, ou le fichier de configuration a perdu l’empreinte du mode local et doit être réparé.
    - `refusing to bind gateway ... without auth` → liaison non-loopback sans chemin d’authentification gateway valide (jeton/mot de passe, ou trusted-proxy lorsque configuré).
    - `another gateway instance is already listening` ou `EADDRINUSE` → port déjà occupé.

    Pages approfondies :

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

    Une bonne sortie ressemble à :

    - Le transport du canal est connecté.
    - Les vérifications d’appairage/liste d’autorisation passent.
    - Les mentions sont détectées lorsqu’elles sont requises.

    Signatures courantes dans les journaux :

    - `mention required` → le contrôle par mention de groupe a bloqué le traitement.
    - `pairing` / `pending` → l’expéditeur du message privé n’est pas encore approuvé.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problème de permissions ou de jeton du canal.

    Pages approfondies :

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

    Une bonne sortie ressemble à :

    - `cron.status` indique qu’il est activé avec un prochain réveil.
    - `cron runs` affiche des entrées récentes `ok`.
    - Heartbeat est activé et pas en dehors des heures actives.

    Signatures courantes dans les journaux :

    - `cron: scheduler disabled; jobs will not run automatically` → Cron est désactivé.
    - `heartbeat skipped` avec `reason=quiet-hours` → en dehors des heures actives configurées.
    - `heartbeat skipped` avec `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe mais ne contient qu’une structure vide ou seulement des en-têtes.
    - `heartbeat skipped` avec `reason=no-tasks-due` → le mode tâche de `HEARTBEAT.md` est actif mais aucun intervalle de tâche n’est encore dû.
    - `heartbeat skipped` avec `reason=alerts-disabled` → toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés).
    - `requests-in-flight` → la voie principale est occupée ; le réveil Heartbeat a été différé.
    - `unknown accountId` → le compte cible de livraison Heartbeat n’existe pas.

    Pages approfondies :

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/fr/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/fr/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/fr/gateway/heartbeat)

  </Accordion>

  <Accordion title="Le Node est appairé mais l’outil camera canvas screen exec échoue">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Une bonne sortie ressemble à :

    - Le Node apparaît comme connecté et appairé pour le rôle `node`.
    - La capacité existe pour la commande que vous invoquez.
    - L’état des permissions est accordé pour l’outil.

    Signatures courantes dans les journaux :

    - `NODE_BACKGROUND_UNAVAILABLE` → amenez l’app Node au premier plan.
    - `*_PERMISSION_REQUIRED` → la permission système a été refusée ou manque.
    - `SYSTEM_RUN_DENIED: approval required` → l’approbation d’exécution est en attente.
    - `SYSTEM_RUN_DENIED: allowlist miss` → la commande n’est pas dans la liste d’autorisation d’exécution.

    Pages approfondies :

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

    Ce qui a changé :

    - Si `tools.exec.host` n’est pas défini, la valeur par défaut est `auto`.
    - `host=auto` se résout en `sandbox` lorsqu’un runtime sandbox est actif, sinon en `gateway`.
    - `host=auto` ne concerne que le routage ; le comportement sans invite de type « YOLO » vient de `security=full` plus `ask=off` sur gateway/node.
    - Sur `gateway` et `node`, `tools.exec.security` non défini vaut par défaut `full`.
    - `tools.exec.ask` non défini vaut par défaut `off`.
    - Résultat : si vous voyez des approbations, une politique locale à l’hôte ou par session a resserré l’exécution par rapport aux valeurs par défaut actuelles.

    Restaurer le comportement actuel par défaut sans approbation :

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Alternatives plus sûres :

    - Définissez uniquement `tools.exec.host=gateway` si vous voulez simplement un routage d’hôte stable.
    - Utilisez `security=allowlist` avec `ask=on-miss` si vous voulez l’exécution sur l’hôte tout en conservant une révision lors des échecs de liste d’autorisation.
    - Activez le mode sandbox si vous voulez que `host=auto` se résolve de nouveau en `sandbox`.

    Signatures courantes dans les journaux :

    - `Approval required.` → la commande attend `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → l’approbation d’exécution node-host est en attente.
    - `exec host=sandbox requires a sandbox runtime for this session` → sélection sandbox implicite/explicite alors que le mode sandbox est désactivé.

    Pages approfondies :

    - [/tools/exec](/fr/tools/exec)
    - [/tools/exec-approvals](/fr/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/fr/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="L’outil navigateur échoue">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Une bonne sortie ressemble à :

    - L’état du navigateur affiche `running: true` et un navigateur/profil choisi.
    - `openclaw` démarre, ou `user` peut voir les onglets Chrome locaux.

    Signatures courantes dans les journaux :

    - `unknown command "browser"` ou `unknown command 'browser'` → `plugins.allow` est défini et n’inclut pas `browser`.
    - `Failed to start Chrome CDP on port` → le lancement du navigateur local a échoué.
    - `browser.executablePath not found` → le chemin binaire configuré est incorrect.
    - `browser.cdpUrl must be http(s) or ws(s)` → l’URL CDP configurée utilise un schéma non pris en charge.
    - `browser.cdpUrl has invalid port` → l’URL CDP configurée a un port mauvais ou hors plage.
    - `No Chrome tabs found for profile="user"` → le profil d’attachement Chrome MCP n’a aucun onglet Chrome local ouvert.
    - `Remote CDP for profile "<name>" is not reachable` → le point de terminaison CDP distant configuré n’est pas accessible depuis cet hôte.
    - `Browser attachOnly is enabled ... not reachable` ou `Browser attachOnly is enabled and CDP websocket ... is not reachable` → le profil attach-only n’a aucune cible CDP active.
    - remplacements obsolètes de viewport / mode sombre / locale / hors ligne sur des profils attach-only ou CDP distants → exécutez `openclaw browser stop --browser-profile <name>` pour fermer la session de contrôle active et libérer l’état d’émulation sans redémarrer le gateway.

    Pages approfondies :

    - [/gateway/troubleshooting#browser-tool-fails](/fr/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/fr/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/fr/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/fr/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Lié

- [FAQ](/fr/help/faq) — questions fréquemment posées
- [Dépannage Gateway](/fr/gateway/troubleshooting) — problèmes spécifiques au gateway
- [Doctor](/fr/gateway/doctor) — vérifications de santé automatisées et réparations
- [Dépannage des canaux](/fr/channels/troubleshooting) — problèmes de connectivité des canaux
- [Dépannage de l’automatisation](/fr/automation/cron-jobs#troubleshooting) — problèmes de Cron et de Heartbeat
