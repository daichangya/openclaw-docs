---
read_when:
    - Implémenter des fonctionnalités de l'application macOS
    - Modifier le cycle de vie de la gateway ou le pontage de nœud sur macOS
summary: Application compagnon OpenClaw pour macOS (barre de menus + courtier gateway)
title: Application macOS
x-i18n:
    generated_at: "2026-04-05T12:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# Application compagnon OpenClaw pour macOS (barre de menus + courtier gateway)

L'application macOS est le **compagnon de barre de menus** d'OpenClaw. Elle gère les autorisations,
gère/se rattache à la gateway localement (launchd ou manuel), et expose les capacités
macOS à l'agent comme un nœud.

## Ce qu'elle fait

- Affiche des notifications natives et l'état dans la barre de menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement d'écran, Microphone,
  Reconnaissance vocale, Automation/AppleScript).
- Exécute ou connecte la gateway (locale ou distante).
- Expose des outils propres à macOS (Canvas, caméra, enregistrement d'écran, `system.run`).
- Démarre le service hôte de nœud local en mode **remote** (launchd), et l'arrête en mode **local**.
- Peut éventuellement héberger **PeekabooBridge** pour l'automatisation de l'interface.
- Installe la CLI globale (`openclaw`) sur demande via npm, pnpm ou bun (l'application préfère npm, puis pnpm, puis bun ; Node reste le runtime recommandé pour la gateway).

## Mode local vs distant

- **Local** (par défaut) : l'application se rattache à une gateway locale déjà en cours d'exécution si elle existe ;
  sinon elle active le service launchd via `openclaw gateway install`.
- **Remote** : l'application se connecte à une gateway via SSH/Tailscale et ne démarre jamais
  de processus local.
  L'application démarre le **service hôte de nœud** local afin que la gateway distante puisse atteindre ce Mac.
  L'application ne lance pas la gateway comme processus enfant.
  La découverte de la gateway préfère désormais les noms Tailscale MagicDNS aux IP tailnet brutes,
  de sorte que l'application Mac se rétablit plus fiablement lorsque les IP tailnet changent.

## Contrôle Launchd

L'application gère un LaunchAgent par utilisateur étiqueté `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` lors de l'utilisation de `--profile`/`OPENCLAW_PROFILE` ; l'ancien `com.openclaw.*` continue d'être déchargé).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le label par `ai.openclaw.<profile>` lors de l'exécution d'un profil nommé.

Si le LaunchAgent n'est pas installé, activez-le depuis l'application ou exécutez
`openclaw gateway install`.

## Capacités du nœud (Mac)

L'application macOS se présente comme un nœud. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Caméra : `camera.snap`, `camera.clip`
- Écran : `screen.record`
- Système : `system.run`, `system.notify`

Le nœud signale une map `permissions` afin que les agents puissent décider de ce qui est autorisé.

Service de nœud + IPC d'application :

- Lorsque le service hôte de nœud headless est en cours d'exécution (mode remote), il se connecte à la gateway WS comme nœud.
- `system.run` s'exécute dans l'application macOS (contexte UI/TCC) via un socket Unix local ; les invites et la sortie restent dans l'application.

Schéma (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approbations Exec (`system.run`)

`system.run` est contrôlé par les **approbations Exec** dans l'application macOS (Settings → Exec approvals).
La sécurité + la demande + la liste d'autorisation sont stockées localement sur le Mac dans :

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
- Le texte brut de commande shell contenant une syntaxe de contrôle ou d'expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence de correspondance dans la liste d'autorisation et nécessite une approbation explicite (ou l'ajout du binaire shell à la liste d'autorisation).
- Choisir « Always Allow » dans l'invite ajoute cette commande à la liste d'autorisation.
- Les remplacements d'environnement de `system.run` sont filtrés (supprime `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) puis fusionnés avec l'environnement de l'application.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d'environnement limités à la requête sont réduits à une petite liste d'autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d'autorisation permanente en mode allowlist, les wrappers de répartition connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins exécutables internes plutôt que les chemins des wrappers. Si le déballage n'est pas sûr, aucune entrée de liste d'autorisation n'est persistée automatiquement.

## Liens profonds

L'application enregistre le schéma d'URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête `agent` vers la gateway.
__OC_I18N_900004__
Paramètres de requête :

- `message` (obligatoire)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (facultatif, clé de mode sans supervision)

Sécurité :

- Sans `key`, l'application demande une confirmation.
- Sans `key`, l'application impose une limite courte de longueur de message pour l'invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec une `key` valide, l'exécution est sans supervision (prévue pour des automatisations personnelles).

## Flux d'onboarding (typique)

1. Installez et lancez **OpenClaw.app**.
2. Complétez la liste de vérification des autorisations (invites TCC).
3. Assurez-vous que le mode **Local** est actif et que la gateway est en cours d'exécution.
4. Installez la CLI si vous souhaitez un accès terminal.

## Emplacement du répertoire d'état (macOS)

Évitez de placer votre répertoire d'état OpenClaw dans iCloud ou dans d'autres dossiers synchronisés dans le cloud.
Les chemins adossés à une synchronisation peuvent ajouter de la latence et provoquer occasionnellement des courses de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d'état local non synchronisé tel que :
__OC_I18N_900005__
Si `openclaw doctor` détecte un état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il affichera un avertissement et recommandera de revenir à un chemin local.

## Workflow de build et de développement (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Packager l'application : `scripts/package-mac-app.sh`

## Déboguer la connectivité gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même poignée de main WebSocket gateway et la même logique de découverte
que l'application macOS, sans lancer l'application.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplace la configuration
- `--mode <local|remote>` : résout à partir de la configuration (par défaut : config ou local)
- `--probe` : force une nouvelle sonde d'état
- `--timeout <ms>` : délai de requête (par défaut : `15000`)
- `--json` : sortie structurée pour comparaison

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrées comme « local »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour comparaison

Astuce : comparez avec `openclaw gateway discover --json` pour voir si le
pipeline de découverte de l'application macOS (`local.` plus le domaine wide-area configuré, avec
des replis wide-area et Tailscale Serve) diffère de
la découverte basée sur `dns-sd` de la CLI Node.

## Plomberie de connexion distante (tunnels SSH)

Lorsque l'application macOS fonctionne en mode **Remote**, elle ouvre un tunnel SSH afin que les composants UI locaux
puissent communiquer avec une gateway distante comme si elle était sur localhost.

### Tunnel de contrôle (port WebSocket gateway)

- **Objectif :** vérifications d'état, status, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port gateway sur l'hôte distant.
- **Comportement :** pas de port local aléatoire ; l'application réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec BatchMode +
  ExitOnForwardFailure + options de keepalive.
- **Remontée d'IP :** le tunnel SSH utilise loopback, donc la gateway verra l'IP du nœud
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous souhaitez que la véritable
  IP cliente apparaisse (voir [accès distant macOS](/platforms/mac/remote)).

Pour les étapes de configuration, voir [accès distant macOS](/platforms/mac/remote). Pour les détails
du protocole, voir [Protocole de la gateway](/gateway/protocol).

## Documentation associée

- [Runbook gateway](/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Autorisations macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
