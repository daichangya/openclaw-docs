---
read_when:
    - Implémentation des fonctionnalités de l’application macOS
    - Modification du cycle de vie du gateway ou du pont de nœud sur macOS
summary: Application compagnon macOS OpenClaw (barre de menus + courtier gateway)
title: Application macOS
x-i18n:
    generated_at: "2026-04-24T07:21:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

L’application macOS est le **compagnon de barre de menus** pour OpenClaw. Elle gère les autorisations,
gère/se rattache au Gateway en local (launchd ou manuel), et expose les capacités macOS
à l’agent comme un nœud.

## Ce qu’elle fait

- Affiche des notifications natives et l’état dans la barre de menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement d’écran, Microphone,
  Reconnaissance vocale, Automation/AppleScript).
- Exécute ou connecte le Gateway (local ou distant).
- Expose les outils réservés à macOS (Canvas, Caméra, Enregistrement d’écran, `system.run`).
- Démarre le service d’hôte de nœud local en mode **remote** (launchd), et l’arrête en mode **local**.
- Peut héberger **PeekabooBridge** pour l’automatisation d’interface.
- Installe la CLI globale (`openclaw`) à la demande via npm, pnpm ou bun (l’application préfère npm, puis pnpm, puis bun ; Node reste le runtime Gateway recommandé).

## Mode local vs distant

- **Local** (par défaut) : l’application se rattache à un Gateway local en cours d’exécution s’il existe ;
  sinon elle active le service launchd via `openclaw gateway install`.
- **Remote** : l’application se connecte à un Gateway via SSH/Tailscale et ne démarre jamais
  de processus local.
  L’application démarre le **service d’hôte de nœud** local afin que le Gateway distant puisse atteindre ce Mac.
  L’application ne lance pas le Gateway comme processus enfant.
  La découverte du Gateway privilégie désormais les noms Tailscale MagicDNS plutôt que les IP tailnet brutes,
  de sorte que l’application Mac récupère de façon plus fiable lorsque les IP tailnet changent.

## Contrôle Launchd

L’application gère un LaunchAgent par utilisateur libellé `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE` ; l’ancien `com.openclaw.*` se décharge toujours).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le libellé par `ai.openclaw.<profile>` lorsque vous utilisez un profil nommé.

Si le LaunchAgent n’est pas installé, activez-le depuis l’application ou exécutez
`openclaw gateway install`.

## Capacités des nœuds (mac)

L’application macOS se présente comme un nœud. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Caméra : `camera.snap`, `camera.clip`
- Écran : `screen.snapshot`, `screen.record`
- Système : `system.run`, `system.notify`

Le nœud rapporte une carte `permissions` afin que les agents puissent décider ce qui est autorisé.

Service de nœud + IPC de l’application :

- Lorsque le service d’hôte de nœud headless fonctionne (mode distant), il se connecte au WS du Gateway comme un nœud.
- `system.run` s’exécute dans l’application macOS (contexte UI/TCC) via une socket Unix locale ; les invites + la sortie restent dans l’application.

Diagramme (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` est contrôlé par les **Exec approvals** dans l’application macOS (Réglages → Exec approvals).
Les paramètres de sécurité + ask + allowlist sont stockés localement sur le Mac dans :

```
~/.openclaw/exec-approvals.json
```

Exemple :

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Remarques :

- Les entrées `allowlist` sont des motifs glob pour les chemins binaires résolus.
- Le texte brut de commande shell contenant une syntaxe de contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec de liste d’autorisation et nécessite une approbation explicite (ou l’ajout du binaire shell à la liste d’autorisation).
- Choisir « Always Allow » dans l’invite ajoute cette commande à la liste d’autorisation.
- Les remplacements d’environnement de `system.run` sont filtrés (supprime `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) puis fusionnés avec l’environnement de l’application.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement à portée de requête sont réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les wrappers de dispatch connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes au lieu des chemins des wrappers. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est persistée automatiquement.

## Liens profonds

L’application enregistre le schéma d’URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête Gateway `agent`.
__OC_I18N_900004__
Paramètres de requête :

- `message` (requis)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (facultatif, clé du mode sans surveillance)

Sécurité :

- Sans `key`, l’application demande une confirmation.
- Sans `key`, l’application impose une courte limite de message pour l’invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec un `key` valide, l’exécution est sans surveillance (prévu pour les automatisations personnelles).

## Flux d’onboarding (typique)

1. Installez et lancez **OpenClaw.app**.
2. Complétez la checklist des autorisations (invites TCC).
3. Assurez-vous que le mode **Local** est actif et que le Gateway fonctionne.
4. Installez la CLI si vous voulez un accès terminal.

## Emplacement du répertoire d’état (macOS)

Évitez de placer votre répertoire d’état OpenClaw dans iCloud ou dans d’autres dossiers synchronisés par le cloud.
Les chemins adossés à une synchronisation peuvent ajouter de la latence et provoquer occasionnellement des courses de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d’état local non synchronisé tel que :
__OC_I18N_900005__
Si `openclaw doctor` détecte l’état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il affichera un avertissement et recommandera de revenir vers un chemin local.

## Workflow de build & dev (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Packager l’application : `scripts/package-mac-app.sh`

## Déboguer la connectivité gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même poignée de main WebSocket Gateway et la même logique de découverte
que l’application macOS, sans lancer l’application.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplacer la configuration
- `--mode <local|remote>` : résoudre depuis la configuration (par défaut : config ou local)
- `--probe` : forcer une nouvelle sonde de santé
- `--timeout <ms>` : délai d’attente de la requête (par défaut : `15000`)
- `--json` : sortie structurée pour la comparaison

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrés comme « locaux »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour la comparaison

Astuce : comparez avec `openclaw gateway discover --json` pour voir si le
pipeline de découverte de l’application macOS (`local.` plus le domaine étendu configuré, avec
des replis wide-area et Tailscale Serve) diffère
de la découverte basée sur `dns-sd` de la CLI Node.

## Tuyauterie de connexion distante (tunnels SSH)

Lorsque l’application macOS fonctionne en mode **Remote**, elle ouvre un tunnel SSH afin que les composants UI locaux
puissent parler à un Gateway distant comme s’il était sur localhost.

### Tunnel de contrôle (port WebSocket Gateway)

- **But :** contrôles de santé, statut, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port Gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port Gateway sur l’hôte distant.
- **Comportement :** aucun port local aléatoire ; l’application réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec options BatchMode +
  ExitOnForwardFailure + keepalive.
- **Rapport d’IP :** le tunnel SSH utilise loopback, donc le gateway verra l’IP du nœud
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous voulez voir la véritable
  IP cliente (voir [accès distant macOS](/fr/platforms/mac/remote)).

Pour les étapes de configuration, voir [accès distant macOS](/fr/platforms/mac/remote). Pour les détails
du protocole, voir [Protocole Gateway](/fr/gateway/protocol).

## Documentation associée

- [Runbook Gateway](/fr/gateway)
- [Gateway (macOS)](/fr/platforms/mac/bundled-gateway)
- [Autorisations macOS](/fr/platforms/mac/permissions)
- [Canvas](/fr/platforms/mac/canvas)
