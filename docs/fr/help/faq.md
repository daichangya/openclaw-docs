---
read_when:
    - Réponses aux questions fréquentes sur la configuration, l’installation, l’intégration ou le support d’exécution
    - Triage des problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur la configuration, les paramètres et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-19T06:52:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Réponses rapides ainsi qu’un dépannage plus approfondi pour des configurations réelles (développement local, VPS, multi-agent, clés OAuth/API, basculement de modèle). Pour les diagnostics d’exécution, voir [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, voir [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **Statut rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, accessibilité du Gateway/service, agents/sessions, configuration du fournisseur + problèmes d’exécution (lorsque le Gateway est accessible).

2. **Rapport partageable (sans risque à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin des journaux (tokens masqués).

3. **État du démon + du port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde, et la configuration probablement utilisée par le service.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé Gateway en direct, y compris des sondes de canal lorsqu’elles sont prises en charge
   (nécessite un Gateway accessible). Voir [Health](/fr/gateway/health).

5. **Suivre le dernier journal**

   ```bash
   openclaw logs --follow
   ```

   Si le RPC est indisponible, utilisez à la place :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les journaux de fichier sont distincts des journaux de service ; voir [Logging](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).

6. **Exécuter Doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration et l’état + exécute des contrôles d’intégrité. Voir [Doctor](/fr/gateway/doctor).

7. **Instantané du Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Demande au Gateway en cours d’exécution un instantané complet (WS uniquement). Voir [Health](/fr/gateway/health).

## Démarrage rapide et configuration au premier lancement

<AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local qui peut **voir votre machine**. C’est bien plus efficace que de demander
    sur Discord, car la plupart des cas de type « je suis bloqué » sont des **problèmes de configuration locale ou d’environnement** que
    les personnes qui vous aident à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux et aider à corriger votre configuration
    au niveau de la machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur le **checkout complet des sources** via
    l’installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **depuis un checkout git**, afin que l’agent puisse lire le code + la documentation et
    raisonner sur la version exacte que vous utilisez. Vous pourrez toujours revenir ensuite à la version stable
    en relançant l’installateur sans `--install-method git`.

    Conseil : demandez à l’agent de **planifier et superviser** la correction (étape par étape), puis d’exécuter uniquement les
    commandes nécessaires. Cela limite les changements et facilite leur audit.

    Si vous découvrez un véritable bug ou correctif, veuillez ouvrir une issue GitHub ou envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties lorsque vous demandez de l’aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu’elles font :

    - `openclaw status` : instantané rapide de la santé du Gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification du fournisseur + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/d’état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](#first-60-seconds-if-something-is-broken).
    Documentation d’installation : [Install](/fr/install), [Paramètres de l’installateur](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue à être ignoré. Que signifient les raisons d’ignorance ?">
    Raisons courantes pour lesquelles Heartbeat est ignoré :

    - `quiet-hours` : en dehors de la fenêtre active-hours configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide ou uniquement des en-têtes
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif mais aucun des intervalles de tâche n’est encore dû
    - `alerts-disabled` : toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d’échéance ne sont avancés qu’après la fin
    d’une véritable exécution de Heartbeat.
    Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/fr/gateway/heartbeat), [Automatisation & tâches](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande de l’exécuter depuis les sources et d’utiliser l’onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L’assistant peut aussi construire automatiquement les ressources de l’interface utilisateur. Après l’onboarding, vous exécutez généralement le Gateway sur le port **18789**.

    Depuis les sources (contributeurs/dev) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le tableau de bord après l’onboarding ?">
    L’assistant ouvre votre navigateur avec une URL de tableau de bord propre (sans token) juste après l’onboarding et imprime aussi le lien dans le récapitulatif. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord sur localhost ou à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S’il demande une authentification par secret partagé, collez le token ou le mot de passe configuré dans les paramètres de Control UI.
    - Source du token : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un token avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez bind loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification de Control UI/WebSocket (sans coller de secret partagé, en supposant un hôte Gateway de confiance) ; les API HTTP exigent toujours une authentification par secret partagé, sauf si vous utilisez délibérément `none` pour l’entrée privée ou l’authentification HTTP trusted-proxy.
      Les mauvaises tentatives d’authentification simultanées via Serve depuis le même client sont sérialisées avant que le limiteur d’échecs d’authentification les enregistre ; ainsi, la deuxième mauvaise tentative peut déjà afficher `retry later`.
    - **Bind tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez une authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse avec gestion d’identité** : gardez le Gateway derrière un proxy de confiance non loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours via le tunnel ; collez le token ou le mot de passe configuré si cela vous est demandé.

    Voir [Dashboard](/web/dashboard) et [Surfaces Web](/web) pour les modes de bind et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi existe-t-il deux configurations d’approbation exec pour les approbations dans le chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les invites d’approbation vers des destinations de chat
    - `channels.<channel>.execApprovals` : fait agir ce canal comme client d’approbation natif pour les approbations exec

    La politique exec de l’hôte reste la véritable porte d’approbation. La configuration du chat ne contrôle que l’endroit où les invites d’approbation
    apparaissent et la manière dont les personnes peuvent y répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs de manière sûre, OpenClaw active désormais automatiquement les approbations natives DM-first lorsque `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`.
    - Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal ; l’agent ne doit inclure une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin possible.
    - Utilisez `approvals.exec` uniquement si les invites doivent aussi être transférées vers d’autres chats ou des salons d’exploitation explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement si vous souhaitez explicitement que les invites d’approbation soient publiées dans le salon/sujet d’origine.
    - Les approbations de Plugin sont encore séparées : elles utilisent par défaut `/approve` dans le même chat, un transfert optionnel via `approvals.plugin`, et seuls certains canaux natifs conservent une gestion native des approbations de Plugin par-dessus.

    En bref : le transfert sert au routage, la configuration du client natif sert à une UX de canal plus riche et spécifique.
    Voir [Exec Approvals](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun est **non recommandé** pour le Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. Le Gateway est léger — la documentation indique que **512MB-1GB de RAM**, **1 cœur** et environ **500MB**
    d’espace disque suffisent pour un usage personnel, et précise qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2GB sont recommandés**, mais ce
    n’est pas un minimum strict.

    Conseil : un petit Pi/VPS peut héberger le Gateway, et vous pouvez associer des **Node** sur votre ordinateur portable/téléphone pour
    l’écran, la caméra, le canevas ou l’exécution de commandes en local. Voir [Nodes](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    En bref : cela fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l’**installation hackable (git)** afin de pouvoir voir les journaux et mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d’étranges problèmes binaires, il s’agit généralement d’un problème de **compatibilité ARM**.

    Documentation : [Linux](/fr/platforms/linux), [Install](/fr/install).

  </Accordion>

  <Accordion title="C’est bloqué sur « wake up my friend » / l’onboarding ne démarre pas. Que faire ?">
    Cet écran dépend du fait que le Gateway soit accessible et authentifié. Le TUI envoie aussi
    automatiquement « Wake up, my friend! » lors de la première initialisation. Si vous voyez cette ligne **sans réponse**
    et que les tokens restent à 0, l’agent ne s’est jamais exécuté.

    1. Redémarrez le Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez le statut + l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela bloque encore, exécutez :

    ```bash
    openclaw doctor
    ```

    Si le Gateway est distant, assurez-vous que la connexion tunnel/Tailscale est active et que l’interface utilisateur
    pointe vers le bon Gateway. Voir [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et l’**espace de travail**, puis exécutez Doctor une fois. Cela
    permet de conserver votre bot « exactement à l’identique » (mémoire, historique de session, authentification et
    état des canaux) tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre espace de travail (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` puis redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, souvenez-vous que l’hôte Gateway possède le magasin de sessions et l’espace de travail.

    **Important :** si vous ne faites que commit/push votre espace de travail sur GitHub, vous sauvegardez
    **la mémoire + les fichiers d’amorçage**, mais **pas** l’historique des sessions ni l’authentification. Ceux-ci se trouvent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Voir aussi : [Migration](/fr/install/migrating), [Où les éléments sont stockés sur le disque](#where-things-live-on-disk),
    [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où puis-je voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    correspond à la dernière version publiée. Les entrées sont regroupées par **Highlights**, **Changes** et
    **Fixes** (ainsi que documentation/autres sections si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-la ou ajoutez `docs.openclaw.ai` à la liste d’autorisation, puis réessayez.
    Merci de nous aider à le débloquer en le signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas accéder au site, la documentation est aussi disponible en miroir sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **dist-tags npm**, pas des lignes de code distinctes :

    - `latest` = stable
    - `beta` = build anticipée pour les tests

    En général, une version stable arrive d’abord sur **beta**, puis une étape explicite
    de promotion déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement sur `latest` si nécessaire. C’est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Pour voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d’installation en une ligne et la différence entre beta et dev, voir l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta, et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mobile de `main` (git) ; lorsqu’elle est publiée, elle utilise le dist-tag npm `dev`.

    Commandes en une ligne (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installateur Windows (PowerShell) :
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Paramètres de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les toutes dernières versions ?">
    Deux options :

    1. **Canal dev (checkout git) :**

    ```bash
    openclaw update --channel dev
    ```

    Cela bascule sur la branche `main` et met à jour depuis les sources.

    2. **Installation hackable (depuis le site de l’installateur) :**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela vous donne un dépôt local que vous pouvez modifier, puis mettre à jour via git.

    Si vous préférez faire manuellement un clone propre, utilisez :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentation : [Update](/cli/update), [Canaux de développement](/fr/install/development-channels),
    [Install](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Estimation approximative :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela se bloque, utilisez [Installateur bloqué](#quick-start-and-first-run-setup)
    et la boucle de débogage rapide dans [Je suis bloqué](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installateur bloqué ? Comment obtenir plus de détails ?">
    Relancez l’installateur avec une **sortie verbeuse** :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installation beta avec sortie verbeuse :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Pour une installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Équivalent Windows (PowerShell) :

    ```powershell
    # install.ps1 n’a pas encore de paramètre -Verbose dédié.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d’options : [Paramètres de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Sous Windows, l’installation indique git introuvable ou openclaw n’est pas reconnu">
    Deux problèmes Windows courants :

    **1) erreur npm spawn git / git introuvable**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez puis rouvrez PowerShell, puis relancez l’installateur.

    **2) openclaw n’est pas reconnu après l’installation**

    - Votre dossier global bin npm n’est pas dans le PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sous Windows ; sur la plupart des systèmes, c’est `%AppData%\npm`).
    - Fermez puis rouvrez PowerShell après avoir mis à jour le PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** au lieu de Windows natif.
    Documentation : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="La sortie exec sous Windows affiche du texte chinois illisible — que dois-je faire ?">
    Cela est généralement dû à une incompatibilité de page de code de console dans les shells Windows natifs.

    Symptômes :

    - la sortie `system.run`/`exec` affiche le chinois sous forme de mojibake
    - la même commande s’affiche correctement dans un autre profil de terminal

    Solution de contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Ensuite, redémarrez le Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez encore ce problème avec la dernière version d’OpenClaw, suivez/signalez-le ici :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question — comment obtenir une meilleure réponse ?">
    Utilisez l’**installation hackable (git)** afin d’avoir localement le code source et la documentation complets, puis posez la question
    à votre bot (ou à Claude/Codex) _depuis ce dossier_ afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Install](/fr/install) et [Paramètres de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l’onboarding.

    - Parcours rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Guide complet : [Premiers pas](/fr/start/getting-started).
    - Installateur + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux convient. Installez-le sur le serveur, puis utilisez SSH/Tailscale pour accéder au Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway remote](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où sont les guides d’installation cloud/VPS ?">
    Nous conservons un **hub d’hébergement** avec les fournisseurs les plus courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Fonctionnement dans le cloud : le **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via la Control UI (ou Tailscale/SSH). Votre état + votre espace de travail
    se trouvent sur le serveur ; traitez donc l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez associer des **Node** (Mac/iOS/Android/headless) à ce Gateway cloud pour accéder
    à l’écran, à la caméra, au canevas locaux ou exécuter des commandes sur votre ordinateur portable tout en gardant le
    Gateway dans le cloud.

    Hub : [Platforms](/fr/platforms). Accès distant : [Gateway remote](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **c’est possible, mais non recommandé**. Le flux de mise à jour peut redémarrer le
    Gateway (ce qui interrompt la session active), peut nécessiter un checkout git propre, et
    peut demander une confirmation. Plus sûr : exécuter les mises à jour depuis un shell en tant qu’opérateur.

    Utilisez la CLI :

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si vous devez absolument automatiser cela depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentation : [Update](/cli/update), [Updating](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le parcours de configuration recommandé. En **mode local**, il vous guide à travers :

    - **Configuration des modèles/de l’authentification** (OAuth fournisseur, clés API, setup-token Anthropic, ainsi que les options de modèles locaux telles que LM Studio)
    - Emplacement de l’**espace de travail** + fichiers d’amorçage
    - **Paramètres Gateway** (bind/port/auth/tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, ainsi que les plugins de canal intégrés comme QQ Bot)
    - **Installation du démon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - **Contrôles d’intégrité** et sélection des **Skills**

    Il avertit également si votre modèle configuré est inconnu ou si l’authentification est absente.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour l’utiliser ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec des
    **modèles uniquement locaux** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces fournisseurs.

    Pour Anthropic dans OpenClaw, la distinction pratique est la suivante :

    - **Clé API Anthropic** : facturation normale de l’API Anthropic
    - **Authentification Claude CLI / abonnement Claude dans OpenClaw** : l’équipe Anthropic
      nous a indiqué que cet usage est à nouveau autorisé, et OpenClaw traite l’usage de `claude -p`
      comme autorisé pour cette intégration, sauf si Anthropic publie une nouvelle
      politique

    Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la
    configuration la plus prévisible. OpenAI Codex OAuth est explicitement pris en charge pour les outils
    externes comme OpenClaw.

    OpenClaw prend aussi en charge d’autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, et
    **Z.AI / GLM Coding Plan**.

    Documentation : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [GLM Models](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Models](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser l’abonnement Claude Max sans clé API ?">
    Oui.

    L’équipe Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est à nouveau autorisé ; OpenClaw considère donc
    l’authentification par abonnement Claude et l’usage de `claude -p` comme approuvés
    pour cette intégration, sauf si Anthropic publie une nouvelle politique. Si vous souhaitez
    la configuration côté serveur la plus prévisible, utilisez plutôt une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui.

    L’équipe Anthropic nous a indiqué que cet usage est à nouveau autorisé, donc OpenClaw considère
    la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration,
    sauf si Anthropic publie une nouvelle politique.

    Le setup-token Anthropic reste disponible comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
    Pour les charges de travail de production ou multi-utilisateurs, l’authentification par clé API Anthropic reste le
    choix le plus sûr et le plus prévisible. Si vous souhaitez d’autres options hébergées de type abonnement
    dans OpenClaw, voir [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax) et [GLM
    Models](/fr/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Pourquoi vois-je une erreur HTTP 429 rate_limit_error d’Anthropic ?">
Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
utilisez une **clé API Anthropic**, consultez la console Anthropic
pour l’utilisation/la facturation et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, cela signifie que la requête essaie d’utiliser
    la bêta de contexte 1M d’Anthropic (`context1m: true`). Cela ne fonctionne que si vos
    identifiants sont éligibles à la facturation long contexte (facturation par clé API ou
    chemin de connexion Claude OpenClaw avec Extra Usage activé).

    Conseil : définissez un **modèle de secours** afin qu’OpenClaw puisse continuer à répondre pendant qu’un fournisseur est limité par son débit.
    Voir [Models](/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw inclut un fournisseur intégré **Amazon Bedrock (Converse)**. Si les marqueurs d’environnement AWS sont présents, OpenClaw peut découvrir automatiquement le catalogue Bedrock streaming/texte et le fusionner comme fournisseur implicite `amazon-bedrock` ; sinon, vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuellement. Voir [Amazon Bedrock](/fr/providers/bedrock) et [Model providers](/fr/providers/models). Si vous préférez un flux de clé géré, un proxy compatible OpenAI devant Bedrock reste une option valide.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). L’onboarding peut exécuter le flux OAuth et définira le modèle par défaut sur `openai-codex/gpt-5.4` lorsque c’est approprié. Voir [Model providers](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi ChatGPT GPT-5.4 ne débloque-t-il pas openai/gpt-5.4 dans OpenClaw ?">
    OpenClaw traite les deux chemins séparément :

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API directe OpenAI Platform

    Dans OpenClaw, la connexion ChatGPT/Codex est reliée au chemin `openai-codex/*`,
    et non au chemin direct `openai/*`. Si vous voulez le chemin API direct dans
    OpenClaw, définissez `OPENAI_API_KEY` (ou la configuration équivalente du fournisseur OpenAI).
    Si vous voulez la connexion ChatGPT/Codex dans OpenClaw, utilisez `openai-codex/*`.

  </Accordion>

  <Accordion title="Pourquoi les limites OAuth Codex peuvent-elles être différentes de celles du web ChatGPT ?">
    `openai-codex/*` utilise le chemin OAuth Codex, et ses fenêtres de quota utilisables sont
    gérées par OpenAI et dépendent de l’offre. En pratique, ces limites peuvent différer de
    l’expérience du site/de l’application ChatGPT, même si les deux sont liés au même compte.

    OpenClaw peut afficher les fenêtres d’utilisation/quota actuellement visibles du fournisseur dans
    `openclaw models status`, mais il n’invente ni ne normalise les
    droits du web ChatGPT en accès API direct. Si vous voulez le chemin direct de facturation/limite OpenAI Platform,
    utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement OpenAI (Codex OAuth) ?">
    Oui. OpenClaw prend entièrement en charge **l’OAuth d’abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l’usage de l’OAuth d’abonnement dans des outils/flux de travail externes
    comme OpenClaw. L’onboarding peut exécuter le flux OAuth pour vous.

    Voir [OAuth](/fr/concepts/oauth), [Model providers](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer Gemini CLI OAuth ?">
    Gemini CLI utilise un **flux d’authentification de Plugin**, pas un client id ni un secret dans `openclaw.json`.

    Étapes :

    1. Installez Gemini CLI localement afin que `gemini` soit dans le `PATH`
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le Plugin : `openclaw plugins enable google`
    3. Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après connexion : `google-gemini-cli/gemini-3-flash-preview`
    5. Si les requêtes échouent, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte Gateway

    Cela stocke les tokens OAuth dans les profils d’authentification sur l’hôte Gateway. Détails : [Model providers](/fr/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local convient-il pour des discussions occasionnelles ?">
    En général, non. OpenClaw a besoin d’un grand contexte et d’une sécurité forte ; les petits modèles tronquent et laissent fuiter. Si vous devez vraiment en utiliser un, exécutez localement la **plus grosse** version du modèle possible (LM Studio) et consultez [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d’injection de prompt — voir [Security](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic de modèle hébergé dans une région spécifique ?">
    Choisissez des endpoints épinglés à une région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour garder les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté en utilisant `models.mode: "merge"` afin que les modèles de secours restent disponibles tout en respectant le fournisseur régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac mini pour installer cela ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif — certaines personnes
    en achètent un comme hôte toujours actif, mais un petit VPS, un serveur domestique ou une machine de type Raspberry Pi convient aussi.

    Vous n’avez besoin d’un Mac **que pour les outils réservés à macOS**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) — le serveur BlueBubbles s’exécute sur n’importe quel Mac, et le Gateway peut s’exécuter sur Linux ou ailleurs. Si vous voulez d’autres outils réservés à macOS, exécutez le Gateway sur un Mac ou associez un Node macOS.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin d’**un appareil macOS** connecté à Messages. Il ne s’agit **pas forcément d’un Mac mini** —
    n’importe quel Mac convient. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage — le serveur BlueBubbles s’exécute sur macOS, tandis que le Gateway peut s’exécuter sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter le Gateway sur Linux/VPS, et exécuter le serveur BlueBubbles sur n’importe quel Mac connecté à Messages.
    - Tout exécuter sur le Mac si vous voulez la configuration la plus simple sur une seule machine.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter le Gateway**, et votre MacBook Pro peut s’y connecter comme
    **Node** (appareil compagnon). Les Nodes n’exécutent pas le Gateway — ils fournissent des
    capacités supplémentaires comme l’écran/la caméra/le canevas et `system.run` sur cet appareil.

    Modèle courant :

    - Gateway sur le Mac mini (toujours actif).
    - Le MacBook Pro exécute l’application macOS ou un hôte Node et s’associe au Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Documentation : [Nodes](/fr/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun est **non recommandé**. Nous observons des bogues d’exécution, surtout avec WhatsApp et Telegram.
    Utilisez **Node** pour des Gateways stables.

    Si vous voulez malgré tout expérimenter avec Bun, faites-le sur un Gateway hors production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` correspond à **l’identifiant utilisateur Telegram de l’expéditeur humain** (numérique). Ce n’est pas le nom d’utilisateur du bot.

    L’onboarding accepte une entrée `@username` et la résout en identifiant numérique, mais l’autorisation OpenClaw utilise uniquement des identifiants numériques.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    API Bot officielle :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Voir [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un même numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Associez le **DM** WhatsApp de chaque expéditeur (pair `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne dispose de son propre espace de travail et de son propre magasin de sessions. Les réponses proviennent toujours du **même compte WhatsApp**, et le contrôle d’accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Voir [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent "chat rapide" et un agent "Opus pour coder" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis associez les routes entrantes (compte fournisseur ou pairs spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Voir aussi [Models](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés avec `brew` soient résolus dans les shells non connectés.
    Les builds récentes ajoutent aussi en préfixe les répertoires bin utilisateur courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation hackable par git et l’installation npm">
    - **Installation hackable (git) :** checkout complet des sources, modifiable, idéal pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **Installation npm :** installation globale de la CLI, sans dépôt, idéale pour « l’exécuter simplement ».
      Les mises à jour proviennent des dist-tags npm.

    Documentation : [Premiers pas](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre les installations npm et git ?">
    Oui. Installez l’autre variante, puis exécutez Doctor afin que le service Gateway pointe vers le nouveau point d’entrée.
    Cela **ne supprime pas vos données** — cela change uniquement l’installation du code OpenClaw. Votre état
    (`~/.openclaw`) et votre espace de travail (`~/.openclaw/workspace`) restent intacts.

    De npm vers git :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    De git vers npm :

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor détecte une incohérence entre le point d’entrée du service Gateway et l’installation actuelle, et propose de réécrire la configuration du service pour qu’elle corresponde à l’installation en cours (utilisez `--repair` dans l’automatisation).

    Pour les conseils de sauvegarde, voir [Stratégie de sauvegarde](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter le Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24 h/24 et 7 j/7, utilisez un VPS**. Si vous voulez le
    moins de friction possible et que les mises en veille/redémarrages ne vous dérangent pas, exécutez-le en local.

    **Ordinateur portable (Gateway local)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible en direct.
    - **Inconvénients :** mise en veille/pertes réseau = déconnexions, mises à jour/redémarrages de l’OS interrompent le service, la machine doit rester éveillée.

    **VPS / cloud**

    - **Avantages :** toujours actif, réseau stable, pas de problème de mise en veille de l’ordinateur portable, plus simple à maintenir en fonctionnement.
    - **Inconvénients :** souvent exécuté en mode headless (utilisez des captures d’écran), accès uniquement distant aux fichiers, vous devez utiliser SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp, Telegram, Slack, Mattermost et Discord fonctionnent tous très bien depuis un VPS. Le seul vrai compromis est **navigateur headless** contre fenêtre visible. Voir [Browser](/fr/tools/browser).

    **Choix recommandé par défaut :** un VPS si vous avez déjà eu des déconnexions de Gateway. Le local est idéal lorsque vous utilisez activement le Mac et voulez un accès aux fichiers locaux ou une automatisation d’interface avec un navigateur visible.

  </Accordion>

  <Accordion title="Est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours actif, moins d’interruptions dues aux mises en veille/redémarrages, permissions plus propres, plus simple à maintenir en fonctionnement.
    - **Ordinateur portable/de bureau partagé :** tout à fait acceptable pour les tests et l’usage actif, mais attendez-vous à des pauses lorsque la machine se met en veille ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez le Gateway sur un hôte dédié et associez votre ordinateur portable comme **Node** pour les outils locaux d’écran/caméra/exec. Voir [Nodes](/fr/nodes).
    Pour les recommandations de sécurité, lisez [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et quel OS est recommandé ?">
    OpenClaw est léger. Pour un Gateway de base + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM, ~500MB de disque.
    - **Recommandé :** 1-2 vCPU, 2GB de RAM ou plus pour avoir de la marge (journaux, médias, canaux multiples). Les outils Node et l’automatisation navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou tout Debian/Ubuntu moderne). Le parcours d’installation Linux y est le mieux testé.

    Documentation : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours active, accessible, et disposer de suffisamment de
    RAM pour le Gateway et tous les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM.
    - **Recommandé :** 2GB de RAM ou plus si vous exécutez plusieurs canaux, de l’automatisation navigateur ou des outils média.
    - **OS :** Ubuntu LTS ou un autre Debian/Ubuntu moderne.

    Si vous êtes sous Windows, **WSL2 est la configuration de type VM la plus simple** et offre la meilleure
    compatibilité d’outillage. Voir [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, voir [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, ainsi que des plugins de canal intégrés comme QQ Bot) et peut aussi gérer la voix + un Canvas en direct sur les plateformes prises en charge. Le **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant performant sur **votre propre matériel**, accessible depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils — sans céder le contrôle de vos flux de travail à un
    SaaS hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez le Gateway où vous voulez (Mac, Linux, VPS) et gardez l’
      espace de travail + l’historique des sessions en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc.,
      ainsi que la voix mobile et Canvas sur les plateformes prises en charge.
    - **Indépendant du modèle :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec routage
      par agent et basculement.
    - **Option 100 % locale :** exécutez des modèles locaux afin que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** séparez les agents par canal, compte ou tâche, chacun avec son propre
      espace de travail et ses valeurs par défaut.
    - **Open source et hackable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Documentation : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Memory](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de l’installer — que devrais-je faire en premier ?">
    Bonnes premières idées de projet :

    - Créer un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan API).
    - Organiser fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser les résumés ou relances.

    Il peut gérer de grosses tâches, mais il fonctionne mieux lorsque vous les divisez en phases et
    utilisez des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’usage quotidiens d’OpenClaw ?">
    Les gains quotidiens ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de la boîte de réception, du calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherche rapide, résumés et premières versions pour des e-mails ou des documents.
    - **Rappels et relances :** nudges et checklists pilotés par Cron ou Heartbeat.
    - **Automatisation du navigateur :** remplissage de formulaires, collecte de données et répétition de tâches web.
    - **Coordination inter-appareils :** envoyez une tâche depuis votre téléphone, laissez le Gateway l’exécuter sur un serveur, puis récupérez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider pour la génération de leads, la prospection, les publicités et les blogs pour un SaaS ?">
    Oui pour la **recherche, la qualification et la rédaction**. Il peut analyser des sites, constituer des shortlists,
    résumer des prospects et rédiger des brouillons de messages de prospection ou de texte publicitaire.

    Pour la **prospection ou les campagnes publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant envoi. Le schéma le plus sûr consiste à laisser
    OpenClaw rédiger, puis à valider vous-même.

    Documentation : [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplaçant d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage direct la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès inter-appareils et une orchestration d’outils.

    Avantages :

    - **Mémoire + espace de travail persistants** entre les sessions
    - **Accès multi-plateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours actif** (exécution sur un VPS, interaction depuis n’importe où)
    - **Nodes** pour navigateur/écran/caméra/exec en local

    Démonstration : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les Skills sans garder le dépôt modifié ?">
    Utilisez des remplacements gérés au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). L’ordre de priorité est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`, donc les remplacements gérés prennent toujours le dessus sur les Skills intégrées sans toucher à git. Si vous avez besoin que la Skill soit installée globalement mais visible seulement pour certains agents, conservez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes d’être intégrées en amont doivent vivre dans le dépôt et être proposées en PR.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus basse). L’ordre de priorité par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégré → `skills.load.extraDirs`. `clawhub` installe dans `./skills` par défaut, que OpenClaw traite comme `<workspace>/skills` à la session suivante. Si la Skill ne doit être visible que pour certains agents, combinez cela avec `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les schémas pris en charge sont :

    - **Tâches Cron** : les tâches isolées peuvent définir une surcharge `model` par tâche.
    - **Sous-agents** : routez les tâches vers des agents séparés ayant différents modèles par défaut.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session en cours à tout moment.

    Voir [Tâches Cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent), et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un travail lourd. Comment déporter cela ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « créer un sous-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait le Gateway en ce moment (et s’il est occupé).

    Conseil sur les tokens : les longues tâches et les sous-agents consomment tous deux des tokens. Si le coût vous préoccupe, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Documentation : [Sous-agents](/fr/tools/subagents), [Tâches d’arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agents liées à un fil sur Discord ?">
    Utilisez des liaisons de fil. Vous pouvez lier un fil Discord à un sous-agent ou à une cible de session afin que les messages de suivi dans ce fil restent sur cette session liée.

    Flux de base :

    - Créez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de la liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler le retrait automatique du focus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Surcharges Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique à la création : définissez `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentation : [Sous-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent a terminé, mais la mise à jour de fin est arrivée au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route du demandeur résolue :

    - La distribution du sous-agent en mode completion préfère tout fil ou route de conversation lié lorsqu’il en existe un.
    - Si l’origine de fin ne contient qu’un canal, OpenClaw se rabat sur la route stockée de la session du demandeur (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse quand même réussir.
    - Si ni une route liée ni une route stockée exploitable n’existent, la livraison directe peut échouer et le résultat retombe alors sur une livraison en file d’attente de session au lieu d’être immédiatement publié dans le chat.
    - Des cibles invalides ou obsolètes peuvent encore forcer le retour à la file d’attente ou l’échec final de la livraison.
    - Si la dernière réponse d’assistant visible de l’enfant est exactement le token silencieux `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure devenue obsolète.
    - Si l’enfant a expiré après seulement des appels d’outils, l’annonce peut condenser cela en un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Sous-agents](/fr/tools/subagents), [Tâches d’arrière-plan](/fr/automation/tasks), [Outil de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus Gateway. Si le Gateway ne fonctionne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de vérification :

    - Vérifiez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que le Gateway fonctionne 24 h/24 et 7 j/7 (sans mise en veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire pour la tâche (`--tz` par rapport au fuseau horaire de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation & tâches](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de distribution :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun message externe n’est attendu.
    - Une cible d’annonce absente ou invalide (`channel` / `to`) signifie que l’exécuteur a ignoré la distribution sortante.
    - Des échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que l’exécuteur a essayé de distribuer, mais que les identifiants l’en ont empêché.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non distribuable ; l’exécuteur supprime donc aussi la distribution de secours en file d’attente.

    Pour les tâches Cron isolées, l’exécuteur prend en charge la distribution finale. L’agent est censé
    renvoyer un résumé en texte brut que l’exécuteur enverra. `--no-deliver` conserve
    ce résultat en interne ; cela ne permet pas à l’agent d’envoyer directement avec
    l’outil de message à la place.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Tâches d’arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution Cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle en direct, pas d’une planification en double.

    Cron isolé peut persister un basculement de modèle d’exécution et réessayer lorsque l’exécution active
    lève `LiveSessionModelSwitchError`. Le nouvel essai conserve le
    fournisseur/modèle basculé, et si le basculement comportait une nouvelle surcharge de profil d’authentification, cron
    la persiste aussi avant de réessayer.

    Règles de sélection associées :

    - La surcharge de modèle du hook Gmail l’emporte en premier lorsqu’elle s’applique.
    - Ensuite, le `model` par tâche.
    - Ensuite, toute surcharge de modèle de session cron stockée.
    - Ensuite, la sélection normale du modèle de l’agent/par défaut.

    La boucle de réessai est bornée. Après la tentative initiale plus 2 réessais de basculement,
    cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sur Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez des Skills dans votre espace de travail. L’interface Skills de macOS n’est pas disponible sur Linux.
    Parcourez les Skills sur [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    L’installation native `openclaw skills install` écrit dans le répertoire actif `skills/`
    de l’espace de travail. N’installez la CLI `clawhub` séparée que si vous voulez publier ou
    synchroniser vos propres Skills. Pour des installations partagées entre agents, placez la Skill sous
    `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou
    `agents.list[].skills` si vous voulez limiter quels agents peuvent la voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur du Gateway :

    - **Tâches Cron** pour les tâches planifiées ou récurrentes (persistantes après redémarrage).
    - **Heartbeat** pour des vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour des agents autonomes qui publient des résumés ou livrent dans les chats.

    Documentation : [Tâches Cron](/fr/automation/cron-jobs), [Automatisation & tâches](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter depuis Linux des Skills Apple réservées à macOS ?">
    Pas directement. Les Skills macOS sont conditionnées par `metadata.openclaw.os` ainsi que par les binaires requis, et les Skills n’apparaissent dans le prompt système que lorsqu’elles sont éligibles sur l’**hôte Gateway**. Sous Linux, les Skills réservées à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas, sauf si vous contournez cette condition.

    Trois schémas pris en charge sont possibles :

    **Option A — exécuter le Gateway sur un Mac (le plus simple).**
    Exécutez le Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement puisque l’hôte Gateway est macOS.

    **Option B — utiliser un Node macOS (sans SSH).**
    Exécutez le Gateway sur Linux, associez un Node macOS (application de barre de menus), et définissez **Node Run Commands** sur « Always Ask » ou « Always Allow » sur le Mac. OpenClaw peut traiter les Skills réservées à macOS comme éligibles lorsque les binaires requis existent sur le Node. L’agent exécute alors ces Skills via l’outil `nodes`. Si vous choisissez « Always Ask », approuver « Always Allow » dans l’invite ajoute cette commande à la liste d’autorisation.

    **Option C — proxifier des binaires macOS via SSH (avancé).**
    Gardez le Gateway sur Linux, mais faites en sorte que les binaires CLI requis se résolvent vers des wrappers SSH qui s’exécutent sur un Mac. Ensuite, surchargez la Skill pour autoriser Linux afin qu’elle reste éligible.

    1. Créez un wrapper SSH pour le binaire (exemple : `memo` pour Apple Notes) :

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Placez le wrapper dans le `PATH` sur l’hôte Linux (par exemple `~/bin/memo`).
    3. Surchargez les métadonnées de la Skill (espace de travail ou `~/.openclaw/skills`) pour autoriser Linux :

       ```markdown
       ---
       name: apple-notes
       description: Gérer Apple Notes via la CLI memo sur macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Démarrez une nouvelle session afin de rafraîchir l’instantané des Skills.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / Plugin personnalisé :** idéal pour un accès API fiable (Notion et HeyGen ont tous deux des API).
    - **Automatisation du navigateur :** fonctionne sans code, mais c’est plus lent et plus fragile.

    Si vous voulez conserver le contexte par client (flux de travail d’agence), un schéma simple est :

    - Une page Notion par client (contexte + préférences + travail en cours).
    - Demander à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez une Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire `skills/` de l’espace de travail actif. Pour des Skills partagées entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seules certaines agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certaines Skills attendent des binaires installés via Homebrew ; sous Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Voir [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config), et [ClawHub](/fr/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur intégré `user`, qui s’attache via Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si vous voulez un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ce chemin est local à l’hôte. Si le Gateway s’exécute ailleurs, exécutez soit un hôte Node sur la machine du navigateur, soit utilisez un CDP distant.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par `ref`, pas par sélecteur CSS
    - les téléversements exigent `ref` / `inputRef` et ne prennent actuellement en charge qu’un seul fichier à la fois
    - `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Sandbox et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée au sandboxing ?">
    Oui. Voir [Sandboxing](/fr/gateway/sandboxing). Pour la configuration spécifique à Docker (Gateway complet dans Docker ou images de sandbox), voir [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité — comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute sous l’utilisateur `node`, elle ne
    comprend donc ni paquets système, ni Homebrew, ni navigateurs intégrés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` afin que les caches survivent.
    - Intégrez les dépendances système à l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via la CLI intégrée :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que le chemin est persistant.

    Documentation : [Docker](/fr/install/docker), [Browser](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les DM privés tout en rendant les groupes publics/en sandbox avec un seul agent ?">
    Oui — si votre trafic privé est constitué de **DM** et votre trafic public de **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans Docker, tandis que la session DM principale reste sur l’hôte. Ensuite, limitez les outils disponibles dans les sessions sandboxées via `tools.sandbox.tools`.

    Guide de configuration + exemple : [Groupes : DM privés + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration Gateway](/fr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment lier un dossier hôte dans le sandbox ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par exemple `"/home/user/src:/src:ro"`). Les liaisons globales et par agent sont fusionnées ; les liaisons par agent sont ignorées quand `scope: "shared"`. Utilisez `:ro` pour tout ce qui est sensible et souvenez-vous que les liaisons contournent les barrières du système de fichiers du sandbox.

    OpenClaw valide les sources de liaison à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements via parent symlink échouent toujours en mode fail closed même lorsque le dernier segment du chemin n’existe pas encore, et les vérifications de racine autorisée s’appliquent toujours après résolution des symlinks.

    Voir [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts) et [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire d’OpenClaw n’est constituée que de fichiers Markdown dans l’espace de travail de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes long terme organisées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi une **vidange silencieuse de la mémoire avant Compaction** afin de rappeler au modèle
    d’écrire des notes durables avant la Compaction automatique. Cela ne s’exécute que lorsque l’espace de travail
    est accessible en écriture (les sandboxes en lecture seule l’ignorent). Voir [Memory](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire oublie toujours des choses. Comment faire pour que cela tienne ?">
    Demandez au bot d’**écrire le fait dans la mémoire**. Les notes de long terme vont dans `MEMORY.md`,
    le contexte de court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker des souvenirs ;
    il saura quoi faire. S’il continue à oublier, vérifiez que le Gateway utilise le même
    espace de travail à chaque exécution.

    Documentation : [Memory](/fr/concepts/memory), [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle pour toujours ? Quelles sont les limites ?">
    Les fichiers mémoire vivent sur le disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste toutefois limité par la fenêtre de contexte du modèle,
    donc les longues conversations peuvent être compactées ou tronquées. C’est pour cela que
    la recherche mémoire existe : elle ne ramène dans le contexte que les parties pertinentes.

    Documentation : [Memory](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche mémoire sémantique nécessite-t-elle une clé API OpenAI ?">
    Uniquement si vous utilisez les **embeddings OpenAI**. L’OAuth Codex couvre le chat/les complétions et
    **n’accorde pas** l’accès aux embeddings, donc **se connecter avec Codex (OAuth ou la
    connexion Codex CLI)** n’aide pas pour la recherche mémoire sémantique. Les embeddings OpenAI
    nécessitent toujours une vraie clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement un fournisseur, OpenClaw en sélectionne automatiquement un lorsqu’il
    peut résoudre une clé API (profils d’authentification, `models.providers.*.apiKey`, ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI est résolue, sinon Gemini si une clé Gemini
    est résolue, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche
    mémoire reste désactivée jusqu’à ce que vous la configuriez. Si vous avez un chemin de modèle local
    configuré et présent, OpenClaw
    préfère `local`. Ollama est pris en charge lorsque vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou local**
    — voir [Memory](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où les éléments sont stockés sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non — **l’état d’OpenClaw est local**, mais **les services externes voient quand même ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers mémoire, la configuration et l’espace de travail vivent sur l’hôte Gateway
      (`~/.openclaw` + votre répertoire d’espace de travail).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) vont vers
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données de messages sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** utiliser des modèles locaux garde les prompts sur votre machine, mais le
      trafic des canaux passe toujours par les serveurs du canal.

    Voir aussi : [Espace de travail de l’agent](/fr/concepts/agent-workspace), [Memory](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout se trouve sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuration principale (JSON5)                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth historique (copié dans les profils d’authentification au premier usage) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profils d’authentification (OAuth, clés API, et `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile de secret optionnelle basée sur fichier pour les fournisseurs `file` de SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité historique (entrées statiques `api_key` nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État du fournisseur (par ex. `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin historique à agent unique : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **espace de travail** (`AGENTS.md`, fichiers mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où doivent se trouver AGENTS.md / SOUL.md / USER.md / MEMORY.md ?">
    Ces fichiers se trouvent dans l’**espace de travail de l’agent**, pas dans `~/.openclaw`.

    - **Espace de travail (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou le repli historique `memory.md` lorsque `MEMORY.md` est absent),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux,
      et Skills partagées (`~/.openclaw/skills`).

    L’espace de travail par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, vérifiez que le Gateway utilise le même
    espace de travail à chaque lancement (et souvenez-vous : le mode distant utilise l’espace de travail de l’**hôte Gateway**,
    pas celui de votre ordinateur portable local).

    Conseil : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous appuyer sur l’historique du chat.

    Voir [Espace de travail de l’agent](/fr/concepts/agent-workspace) et [Memory](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Mettez votre **espace de travail de l’agent** dans un dépôt git **privé** et sauvegardez-le dans un endroit
    privé (par exemple GitHub privé). Cela capture la mémoire + les fichiers AGENTS/SOUL/USER
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    Ne faites **pas** de commit de quoi que ce soit sous `~/.openclaw` (identifiants, sessions, tokens ou charges utiles de secrets chiffrés).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément à la fois l’espace de travail et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Documentation : [Espace de travail de l’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Voir le guide dédié : [Désinstallation](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors de l’espace de travail ?">
    Oui. L’espace de travail est le **cwd par défaut** et l’ancre mémoire, pas un sandbox strict.
    Les chemins relatifs se résolvent dans l’espace de travail, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou des paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, pointez le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que du code source ; gardez l’
    espace de travail séparé sauf si vous voulez intentionnellement que l’agent travaille dedans.

    Exemple (dépôt comme cwd par défaut) :

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode distant : où se trouve le magasin de sessions ?">
    L’état de session appartient à l’**hôte Gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous intéresse se trouve sur la machine distante, pas sur votre ordinateur portable local. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut raisonnablement sûres (y compris un espace de travail par défaut `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’UI indique unauthorized'>
    Les bind non-loopback **exigent un chemin d’authentification Gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : token ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un proxy inverse conscient de l’identité correctement configuré et non-loopback

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Remarques :

    - `gateway.remote.token` / `.password` **n’activent pas** à eux seuls l’authentification du Gateway local.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez à la place `gateway.auth.mode: "password"` plus `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fail closed (aucun repli distant ne masque cela).
    - Les configurations Control UI à secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stockés dans les paramètres de l’app/UI). Les modes portant une identité comme Tailscale Serve ou `trusted-proxy` utilisent à la place des en-têtes de requête. Évitez de mettre des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les proxies inverses loopback sur le même hôte **ne satisfont toujours pas** l’authentification trusted-proxy. Le proxy de confiance doit être une source non-loopback configurée.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un token sur localhost ?">
    OpenClaw impose par défaut l’authentification Gateway, y compris sur loopback. Dans le chemin par défaut normal, cela signifie une authentification par token : si aucun chemin d’authentification explicite n’est configuré, le démarrage du Gateway se résout en mode token et en génère automatiquement un, qui est enregistré dans `gateway.auth.token`, donc **les clients WS locaux doivent s’authentifier**. Cela empêche d’autres processus locaux d’appeler le Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour des proxies inverses non-loopback conscients de l’identité, `trusted-proxy`). Si vous **voulez vraiment** un loopback ouvert, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un token pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir modifié la configuration ?">
    Le Gateway surveille la configuration et prend en charge le hot-reload :

    - `gateway.reload.mode: "hybrid"` (par défaut) : applique à chaud les changements sûrs, redémarre pour les changements critiques
    - `hot`, `restart`, `off` sont également pris en charge

  </Accordion>

  <Accordion title="Comment désactiver les slogans amusants de la CLI ?">
    Définissez `cli.banner.taglineMode` dans la configuration :

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off` : masque le texte du slogan, mais conserve la ligne titre/version de la bannière.
    - `default` : utilise `All your chats, one OpenClaw.` à chaque fois.
    - `random` : slogans amusants/de saison en rotation (comportement par défaut).
    - Si vous ne voulez aucune bannière, définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer la recherche web (et la récupération web) ?">
    `web_fetch` fonctionne sans clé API. `web_search` dépend du
    fournisseur que vous avez sélectionné :

    - Les fournisseurs basés sur API tels que Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration habituelle de clé API.
    - Ollama Web Search ne nécessite pas de clé, mais utilise votre hôte Ollama configuré et exige `ollama signin`.
    - DuckDuckGo ne nécessite pas de clé, mais il s’agit d’une intégration non officielle basée sur HTML.
    - SearXNG ne nécessite pas de clé/peut être auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Alternatives par variable d’environnement :

    - Brave : `BRAVE_API_KEY`
    - Exa : `EXA_API_KEY`
    - Firecrawl : `FIRECRAWL_API_KEY`
    - Gemini : `GEMINI_API_KEY`
    - Grok : `XAI_API_KEY`
    - Kimi : `KIMI_API_KEY` ou `MOONSHOT_API_KEY`
    - MiniMax Search : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, ou `MINIMAX_API_KEY`
    - Perplexity : `PERPLEXITY_API_KEY` ou `OPENROUTER_API_KEY`
    - SearXNG : `SEARXNG_BASE_URL`
    - Tavily : `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    La configuration de recherche web spécifique au fournisseur se trouve désormais sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` sont encore chargés temporairement pour compatibilité, mais ils ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli Firecrawl pour la récupération web se trouve sous `plugins.entries.firecrawl.config.webFetch.*`.

    Remarques :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf s’il est explicitement désactivé).
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli de récupération prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
    - Les démons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou l’environnement du service).

    Documentation : [Outils Web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment récupérer et éviter cela ?">
    `config.apply` remplace la **configuration entière**. Si vous envoyez un objet partiel, tout
    le reste est supprimé.

    Récupération :

    - Restaurez depuis une sauvegarde (git ou une copie de `~/.openclaw/openclaw.json`).
    - Si vous n’avez pas de sauvegarde, relancez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si c’était inattendu, ouvrez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    Pour éviter cela :

    - Utilisez `openclaw config set` pour les petits changements.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr d’un chemin exact ou de la forme d’un champ ; cela renvoie un nœud de schéma superficiel ainsi que des résumés immédiats des enfants pour approfondir.
    - Utilisez `config.patch` pour des modifications RPC partielles ; réservez `config.apply` au remplacement complet de la configuration.
    - Si vous utilisez l’outil `gateway`, réservé au propriétaire, depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les anciens alias `tools.bash.*` qui se normalisent vers les mêmes chemins exec protégés).

    Documentation : [Config](/cli/config), [Configure](/cli/configure), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter un Gateway central avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant consiste à avoir **un Gateway** (par ex. Raspberry Pi) plus des **Nodes** et des **agents** :

    - **Gateway (central) :** possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nodes (appareils) :** les Mac/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/espaces de travail séparés pour des rôles spécialisés (par ex. « opérations Hetzner », « données personnelles »).
    - **Sous-agents :** lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** se connecte au Gateway et permet de changer d’agent/de session.

    Documentation : [Nodes](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il fonctionner en mode headless ?">
    Oui. C’est une option de configuration :

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    La valeur par défaut est `false` (avec interface). Le mode headless est plus susceptible de déclencher des vérifications anti-bot sur certains sites. Voir [Browser](/fr/tools/browser).

    Le mode headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Pas de fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts vis-à-vis de l’automatisation en mode headless (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour le contrôle du navigateur ?">
    Définissez `browser.executablePath` vers votre binaire Brave (ou tout navigateur basé sur Chromium), puis redémarrez le Gateway.
    Voir les exemples complets de configuration dans [Browser](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distants et Nodes

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, le Gateway et les Nodes ?">
    Les messages Telegram sont gérés par le **Gateway**. Le Gateway exécute l’agent puis
    appelle seulement ensuite les Nodes via le **WebSocket Gateway** lorsqu’un outil Node est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Les Nodes ne voient pas le trafic fournisseur entrant ; ils ne reçoivent que des appels RPC Node.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si le Gateway est hébergé à distance ?">
    Réponse courte : **associez votre ordinateur comme Node**. Le Gateway s’exécute ailleurs, mais il peut
    appeler des outils `node.*` (écran, caméra, système) sur votre machine locale via le WebSocket Gateway.

    Configuration typique :

    1. Exécutez le Gateway sur l’hôte toujours actif (VPS/serveur domestique).
    2. Placez l’hôte Gateway et votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS Gateway est accessible (bind tailnet ou tunnel SSH).
    4. Ouvrez l’application macOS localement et connectez-vous en mode **Remote over SSH** (ou tailnet direct)
       afin qu’elle puisse s’enregistrer comme Node.
    5. Approuvez le Node sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est nécessaire ; les Nodes se connectent via le WebSocket Gateway.

    Rappel de sécurité : associer un Node macOS permet `system.run` sur cette machine. N’associez
    que des appareils de confiance et consultez [Security](/fr/gateway/security).

    Documentation : [Nodes](/fr/nodes), [Protocole Gateway](/fr/gateway/protocol), [mode distant macOS](/fr/platforms/mac/remote), [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté mais je n’obtiens aucune réponse. Que faire ?">
    Vérifiez l’essentiel :

    - Le Gateway est en cours d’exécution : `openclaw gateway status`
    - Santé du Gateway : `openclaw status`
    - Santé des canaux : `openclaw channels status`

    Vérifiez ensuite l’authentification et le routage :

    - Si vous utilisez Tailscale Serve, assurez-vous que `gateway.auth.allowTailscale` est correctement défini.
    - Si vous vous connectez via un tunnel SSH, confirmez que le tunnel local est actif et pointe vers le bon port.
    - Vérifiez que vos listes d’autorisation (DM ou groupe) incluent votre compte.

    Documentation : [Tailscale](/fr/gateway/tailscale), [Accès distant](/fr/gateway/remote), [Canaux](/fr/channels).

  </Accordion>

  <Accordion title="Deux instances OpenClaw peuvent-elles se parler (local + VPS) ?">
    Oui. Il n’existe pas de pont intégré « bot-à-bot », mais vous pouvez le mettre en place de plusieurs
    façons fiables :

    **Le plus simple :** utiliser un canal de chat normal auquel les deux bots peuvent accéder (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le bot A au bot B, puis laissez le bot B répondre comme d’habitude.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant un chat où l’autre bot
    écoute. Si l’un des bots est sur un VPS distant, pointez votre CLI vers ce Gateway distant
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de schéma (à exécuter depuis une machine qui peut atteindre le Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Conseil : ajoutez une protection pour éviter que les deux bots ne bouclent à l’infini (réponse uniquement en cas de mention, listes d’autorisation de canal,
    ou règle « ne pas répondre aux messages de bot »).

    Documentation : [Accès distant](/fr/gateway/remote), [CLI agent](/cli/agent), [Envoi d’agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Un Gateway peut héberger plusieurs agents, chacun avec son propre espace de travail, ses modèles par défaut
    et son routage. C’est la configuration normale, et c’est bien moins cher et plus simple que d’exécuter
    un VPS par agent.

    N’utilisez des VPS séparés que si vous avez besoin d’une isolation forte (frontières de sécurité) ou de
    configurations très différentes que vous ne voulez pas partager. Sinon, conservez un seul Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un Node sur mon ordinateur portable personnel au lieu de SSH depuis un VPS ?">
    Oui — les Nodes sont le moyen de premier ordre pour atteindre votre ordinateur portable depuis un Gateway distant, et elles
    permettent bien plus qu’un simple accès shell. Le Gateway fonctionne sur macOS/Linux (Windows via WSL2) et est
    léger (un petit VPS ou une machine de type Raspberry Pi convient ; 4 GB de RAM suffisent largement), donc une configuration
    courante consiste en un hôte toujours actif plus votre ordinateur portable comme Node.

    - **Aucun SSH entrant nécessaire.** Les Nodes se connectent en sortie au WebSocket Gateway et utilisent l’association d’appareil.
    - **Contrôles d’exécution plus sûrs.** `system.run` est protégé par les listes d’autorisation/approbations du Node sur cet ordinateur portable.
    - **Davantage d’outils appareil.** Les Nodes exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur.** Gardez le Gateway sur un VPS, mais exécutez Chrome localement via un hôte Node sur l’ordinateur portable, ou attachez-vous à Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les Nodes sont plus simples pour les flux de travail d’agent continus et
    l’automatisation des appareils.

    Documentation : [Nodes](/fr/nodes), [Nodes CLI](/cli/nodes), [Browser](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les Nodes exécutent-elles un service Gateway ?">
    Non. Un seul **Gateway** doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)). Les Nodes sont des périphériques qui se connectent
    au Gateway (Nodes iOS/Android, ou « mode node » macOS dans l’application de barre de menus). Pour les hôtes Node headless
    et le contrôle par CLI, voir [CLI Node host](/cli/node).

    Un redémarrage complet est requis pour les changements `gateway`, `discovery` et `canvasHost`.

  </Accordion>

  <Accordion title="Existe-t-il un moyen API / RPC d’appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma superficiel, l’indice UI correspondant et les résumés immédiats des enfants avant d’écrire
    - `config.get` : récupérer l’instantané courant + le hash
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC) ; recharge à chaud lorsque possible et redémarre lorsque nécessaire
    - `config.apply` : valider + remplacer la configuration complète ; recharge à chaud lorsque possible et redémarre lorsque nécessaire
    - L’outil d’exécution `gateway`, réservé au propriétaire, refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les anciens alias `tools.bash.*` se normalisent vers les mêmes chemins exec protégés

  </Accordion>

  <Accordion title="Configuration minimale raisonnable pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre espace de travail et restreint les personnes pouvant déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et se connecter depuis mon Mac ?">
    Étapes minimales :

    1. **Installer + se connecter sur le VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installer + se connecter sur votre Mac**
       - Utilisez l’application Tailscale et connectez-vous au même tailnet.
    3. **Activer MagicDNS (recommandé)**
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS ait un nom stable.
    4. **Utiliser le nom d’hôte tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez la Control UI sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde le Gateway lié à loopback et expose HTTPS via Tailscale. Voir [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un Node Mac à un Gateway distant (Tailscale Serve) ?">
    Serve expose la **Control UI + le WS Gateway**. Les Nodes se connectent via le même endpoint WS Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS et le Mac sont sur le même tailnet**.
    2. **Utilisez l’application macOS en mode Remote** (la cible SSH peut être le nom d’hôte tailnet).
       L’application tunnelisera le port Gateway et se connectera comme Node.
    3. **Approuvez le Node** sur le Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentation : [Protocole Gateway](/fr/gateway/protocol), [Discovery](/fr/gateway/discovery), [mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un Node ?">
    Si vous avez seulement besoin d’**outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **Node**. Cela conserve un seul Gateway et évite la duplication de configuration. Les outils Node locaux sont
    actuellement réservés à macOS, mais nous prévoyons de les étendre à d’autres OS.

    N’installez un deuxième Gateway que si vous avez besoin d’une **isolation forte** ou de deux bots totalement séparés.

    Documentation : [Nodes](/fr/nodes), [Nodes CLI](/cli/nodes), [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement depuis le processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail courant
    - un `.env` global de secours depuis `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes.

    Vous pouvez également définir des variables d’environnement inline dans la configuration (appliquées uniquement si elles sont absentes de l’environnement du processus) :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Voir [/environment](/fr/help/environment) pour l’ordre de priorité complet et les sources.

  </Accordion>

  <Accordion title="J’ai démarré le Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux correctifs courants :

    1. Placez les clés manquantes dans `~/.openclaw/.env` afin qu’elles soient prises en compte même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’import du shell (fonction pratique opt-in) :

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Cela exécute votre shell de connexion et importe uniquement les clés attendues manquantes (sans jamais remplacer). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais models status affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si **l’import de l’environnement du shell** est activé. « Shell env: off »
    ne signifie **pas** que vos variables d’environnement sont absentes — cela signifie seulement qu’OpenClaw ne chargera pas
    automatiquement votre shell de connexion.

    Si le Gateway s’exécute comme service (launchd/systemd), il n’héritera pas de l’environnement
    de votre shell. Corrigez cela de l’une des façons suivantes :

    1. Placez le token dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import du shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le à votre bloc `env` de configuration (appliqué uniquement s’il est absent).

    Ensuite, redémarrez le gateway et revérifiez :

    ```bash
    openclaw models status
    ```

    Les tokens Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (également `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et chats multiples

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais c’est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration par inactivité. Une fois activée, le **message suivant**
    après la période d’inactivité démarre un nouvel ID de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions — cela démarre simplement une nouvelle session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe-t-il un moyen de créer une équipe d’instances OpenClaw (un PDG et de nombreux agents) ?">
    Oui, via le **routage multi-agent** et les **sous-agents**. Vous pouvez créer un agent
    coordinateur et plusieurs agents workers avec leurs propres espaces de travail et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. Cela consomme beaucoup de tokens et est souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    envisageons est un seul bot avec lequel vous échangez, avec différentes sessions pour le travail parallèle. Ce
    bot peut aussi lancer des sous-agents lorsque c’est nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Sous-agents](/fr/tools/subagents), [CLI agents](/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué en plein milieu d’une tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les chats longs, les sorties d’outils volumineuses ou de nombreux
    fichiers peuvent déclencher une Compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les tâches longues, et `/new` lorsque vous changez de sujet.
    - Conservez le contexte important dans l’espace de travail et demandez au bot de le relire.
    - Utilisez des sous-agents pour le travail long ou parallèle afin que le chat principal reste plus petit.
    - Choisissez un modèle avec une fenêtre de contexte plus grande si cela arrive souvent.

  </Accordion>

  <Accordion title="Comment réinitialiser complètement OpenClaw tout en le gardant installé ?">
    Utilisez la commande de réinitialisation :

    ```bash
    openclaw reset
    ```

    Réinitialisation complète non interactive :

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Puis relancez la configuration :

    ```bash
    openclaw onboard --install-daemon
    ```

    Remarques :

    - L’onboarding propose aussi **Reset** s’il détecte une configuration existante. Voir [Onboarding (CLI)](/fr/start/wizard).
    - Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
    - Réinitialisation dev : `openclaw gateway --dev --reset` (réservé au développement ; efface la configuration dev + identifiants + sessions + espace de travail).

  </Accordion>

  <Accordion title='Je reçois des erreurs "context too large" — comment réinitialiser ou compacter ?'>
    Utilisez l’une de ces options :

    - **Compacter** (conserve la conversation mais résume les anciens tours) :

      ```
      /compact
      ```

      ou `/compact <instructions>` pour guider le résumé.

    - **Réinitialiser** (nouvel ID de session pour la même clé de chat) :

      ```
      /new
      /reset
      ```

    Si cela continue :

    - Activez ou ajustez le **session pruning** (`agents.defaults.contextPruning`) pour réduire les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Documentation : [Compaction](/fr/concepts/compaction), [Session pruning](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi vois-je "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans
    le `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou un changement d’outil/de schéma).

    Correctif : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi reçois-je des messages Heartbeat toutes les 30 minutes ?">
    Les Heartbeat s’exécutent toutes les **30 min** par défaut (**1 h** lors de l’utilisation d’une authentification OAuth). Ajustez-les ou désactivez-les :

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe mais est en pratique vide (seulement des lignes vides et des
    en-têtes markdown comme `# Heading`), OpenClaw ignore l’exécution Heartbeat afin d’économiser des appels API.
    Si le fichier est absent, le Heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les surcharges par agent utilisent `agents.list[].heartbeat`. Documentation : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses dans les groupes sont bloquées jusqu’à ce que vous autorisiez des expéditeurs (`groupPolicy: "allowlist"`).

    Si vous voulez que **vous seul** puissiez déclencher des réponses dans le groupe :

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Comment obtenir le JID d’un groupe WhatsApp ?">
    Option 1 (la plus rapide) : suivez les journaux et envoyez un message de test dans le groupe :

    ```bash
    openclaw logs --follow --json
    ```

    Recherchez `chatId` (ou `from`) se terminant par `@g.us`, comme :
    `1234567890-1234567890@g.us`.

    Option 2 (si déjà configuré/sur liste d’autorisation) : lister les groupes depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentation : [WhatsApp](/fr/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas sur la liste d’autorisation.

    Voir [Groups](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les DM ?">
    Les chats directs sont regroupés dans la session principale par défaut. Les groupes/canaux ont leurs propres clés de session, et les sujets Telegram / fils Discord sont des sessions séparées. Voir [Groups](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien d’espaces de travail et d’agents puis-je créer ?">
    Aucune limite stricte. Des dizaines (voire des centaines) conviennent, mais faites attention à :

    - **Croissance du disque :** les sessions + transcriptions se trouvent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en tokens :** plus d’agents signifie plus d’utilisation simultanée des modèles.
    - **Surcharge opérationnelle :** profils d’authentification, espaces de travail et routage des canaux par agent.

    Conseils :

    - Gardez un espace de travail **actif** par agent (`agents.defaults.workspace`).
    - Épurez les anciennes sessions (supprimez les JSONL ou les entrées de stockage) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les espaces de travail orphelins et les incohérences de profils.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou chats en même temps (Slack), et comment configurer cela ?">
    Oui. Utilisez le **routage multi-agent** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/pair. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L’accès navigateur est puissant, mais ce n’est pas « faire tout ce qu’un humain peut faire » — l’anti-bot, les CAPTCHA et la MFA peuvent
    encore bloquer l’automatisation. Pour le contrôle navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (liaisons).
    - Canal/canaux Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un Node si nécessaire.

    Documentation : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Browser](/fr/tools/browser), [Nodes](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles : valeurs par défaut, sélection, alias, changement

<AccordionGroup>
  <Accordion title='Qu’est-ce que le "modèle par défaut" ?'>
    Le modèle par défaut d’OpenClaw est celui que vous définissez comme :

    ```
    agents.defaults.model.primary
    ```

    Les modèles sont référencés comme `provider/model` (exemple : `openai/gpt-5.4`). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite utilise le fournisseur par défaut configuré comme chemin de compatibilité obsolète. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se rabat sur le premier fournisseur/modèle configuré au lieu d’exposer une valeur par défaut obsolète d’un fournisseur supprimé. Vous devriez tout de même définir **explicitement** `provider/model`.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    **Valeur par défaut recommandée :** utilisez le meilleur modèle de dernière génération disponible dans votre pile de fournisseurs.
    **Pour les agents avec outils activés ou à entrée non fiable :** privilégiez la force du modèle plutôt que le coût.
    **Pour le chat courant/à faible enjeu :** utilisez des modèles de secours moins chers et routez par rôle d’agent.

    MiniMax a sa propre documentation : [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

    Règle générale : utilisez le **meilleur modèle que vous pouvez vous permettre** pour le travail à enjeu élevé, et un modèle moins cher
    pour le chat courant ou les résumés. Vous pouvez router les modèles par agent et utiliser des sous-agents pour
    paralléliser les tâches longues (chaque sous-agent consomme des tokens). Voir [Models](/fr/concepts/models) et
    [Sous-agents](/fr/tools/subagents).

    Avertissement important : les modèles plus faibles ou trop quantifiés sont plus vulnérables à l’injection de prompt
    et aux comportements dangereux. Voir [Security](/fr/gateway/security).

    Plus de contexte : [Models](/fr/concepts/models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Utilisez les **commandes de modèle** ou modifiez uniquement les champs **model**. Évitez les remplacements complets de configuration.

    Options sûres :

    - `/model` dans le chat (rapide, par session)
    - `openclaw models set ...` (met à jour uniquement la configuration du modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Évitez `config.apply` avec un objet partiel sauf si vous avez l’intention de remplacer toute la configuration.
    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` et préférez `config.patch`. La charge utile de lookup vous donne le chemin normalisé, la documentation/les contraintes du schéma superficiel, et les résumés immédiats des enfants.
    pour les mises à jour partielles.
    Si vous avez écrasé la configuration, restaurez-la depuis une sauvegarde ou relancez `openclaw doctor` pour réparer.

    Documentation : [Models](/fr/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui. Ollama est la voie la plus simple pour les modèles locaux.

    Configuration la plus rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Récupérez un modèle local tel que `ollama pull gemma4`
    3. Si vous voulez aussi des modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard` et choisissez `Ollama`
    5. Choisissez `Local` ou `Cloud + Local`

    Remarques :

    - `Cloud + Local` vous donne les modèles cloud ainsi que vos modèles Ollama locaux
    - les modèles cloud tels que `kimi-k2.5:cloud` n’ont pas besoin d’un téléchargement local
    - pour un changement manuel, utilisez `openclaw models list` et `openclaw models set ollama/<model>`

    Note de sécurité : les modèles plus petits ou fortement quantifiés sont plus vulnérables à l’injection de prompt.
    Nous recommandons fortement les **grands modèles** pour tout bot pouvant utiliser des outils.
    Si vous voulez tout de même de petits modèles, activez le sandboxing et des listes d’autorisation d’outils strictes.

    Documentation : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Fournisseurs de modèles](/fr/concepts/model-providers), [Security](/fr/gateway/security),
    [Sandboxing](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quels modèles utilisent OpenClaw, Flawd et Krill ?">
    - Ces déploiements peuvent différer et changer avec le temps ; il n’existe pas de recommandation fixe de fournisseur.
    - Vérifiez le paramètre d’exécution actuel sur chaque gateway avec `openclaw models status`.
    - Pour les agents sensibles à la sécurité/avec outils activés, utilisez le meilleur modèle de dernière génération disponible.
  </Accordion>

  <Accordion title="Comment changer de modèle à la volée (sans redémarrer) ?">
    Utilisez la commande `/model` comme message autonome :

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Ce sont les alias intégrés. Des alias personnalisés peuvent être ajoutés via `agents.defaults.models`.

    Vous pouvez lister les modèles disponibles avec `/model`, `/model list`, ou `/model status`.

    `/model` (et `/model list`) affiche un sélecteur compact numéroté. Sélectionnez par numéro :

    ```
    /model 3
    ```

    Vous pouvez aussi forcer un profil d’authentification spécifique pour le fournisseur (par session) :

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Conseil : `/model status` montre quel agent est actif, quel fichier `auth-profiles.json` est utilisé, et quel profil d’authentification sera essayé ensuite.
    Il montre aussi le endpoint fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

    **Comment désépingler un profil défini avec @profile ?**

    Relancez `/model` **sans** le suffixe `@profile` :

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si vous voulez revenir à la valeur par défaut, choisissez-la depuis `/model` (ou envoyez `/model <default provider/model>`).
    Utilisez `/model status` pour confirmer quel profil d’authentification est actif.

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.2 pour les tâches quotidiennes et Codex 5.3 pour le codage ?">
    Oui. Définissez-en un comme valeur par défaut et changez selon le besoin :

    - **Changement rapide (par session) :** `/model gpt-5.4` pour les tâches quotidiennes, `/model openai-codex/gpt-5.4` pour coder avec Codex OAuth.
    - **Valeur par défaut + changement :** définissez `agents.defaults.model.primary` sur `openai/gpt-5.4`, puis passez à `openai-codex/gpt-5.4` pour coder (ou l’inverse).
    - **Sous-agents :** routez les tâches de codage vers des sous-agents avec un modèle par défaut différent.

    Voir [Models](/fr/concepts/models) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer le mode rapide pour GPT 5.4 ?">
    Utilisez soit un basculement de session, soit une valeur par défaut de configuration :

    - **Par session :** envoyez `/fast on` pendant que la session utilise `openai/gpt-5.4` ou `openai-codex/gpt-5.4`.
    - **Valeur par défaut par modèle :** définissez `agents.defaults.models["openai/gpt-5.4"].params.fastMode` sur `true`.
    - **Codex OAuth aussi :** si vous utilisez aussi `openai-codex/gpt-5.4`, définissez-y le même indicateur.

    Exemple :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Pour OpenAI, le mode rapide correspond à `service_tier = "priority"` sur les requêtes Responses natives prises en charge. Les surcharges de session `/fast` priment sur les valeurs par défaut de configuration.

    Voir [Thinking and fast mode](/fr/tools/thinking) et [Mode rapide OpenAI](/fr/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Pourquoi vois-je "Model ... is not allowed", puis aucune réponse ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et toutes les
    surcharges de session. Choisir un modèle qui n’est pas dans cette liste renvoie :

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Cette erreur est renvoyée **à la place** d’une réponse normale. Correctif : ajoutez le modèle à
    `agents.defaults.models`, supprimez la liste d’autorisation, ou choisissez un modèle depuis `/model list`.

  </Accordion>

  <Accordion title='Pourquoi vois-je "Unknown model: minimax/MiniMax-M2.7" ?'>
    Cela signifie que le **fournisseur n’est pas configuré** (aucune configuration de fournisseur MiniMax ni aucun
    profil d’authentification n’a été trouvé), donc le modèle ne peut pas être résolu.

    Liste de vérification :

    1. Mettez à niveau vers une version actuelle d’OpenClaw (ou exécutez depuis la source `main`), puis redémarrez le gateway.
    2. Assurez-vous que MiniMax est configuré (assistant ou JSON), ou que l’authentification MiniMax
       existe dans l’environnement/les profils d’authentification afin que le fournisseur correspondant puisse être injecté
       (`MINIMAX_API_KEY` pour `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       stocké pour `minimax-portal`).
    3. Utilisez l’identifiant de modèle exact (sensible à la casse) pour votre chemin d’authentification :
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` pour une configuration
       par clé API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` pour une configuration
       OAuth.
    4. Exécutez :

       ```bash
       openclaw models list
       ```

       puis choisissez dans la liste (ou `/model list` dans le chat).

    Voir [MiniMax](/fr/providers/minimax) et [Models](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez **MiniMax comme valeur par défaut** et changez de modèle **par session** lorsque nécessaire.
    Les modèles de secours servent aux **erreurs**, pas aux « tâches difficiles », donc utilisez `/model` ou un agent séparé.

    **Option A : changement par session**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Ensuite :

    ```
    /model gpt
    ```

    **Option B : agents séparés**

    - Valeur par défaut de l’agent A : MiniMax
    - Valeur par défaut de l’agent B : OpenAI
    - Routez par agent ou utilisez `/agent` pour changer

    Documentation : [Models](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent), [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title="Les raccourcis opus / sonnet / gpt sont-ils intégrés ?">
    Oui. OpenClaw fournit quelques raccourcis par défaut (appliqués uniquement lorsque le modèle existe dans `agents.defaults.models`) :

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si vous définissez votre propre alias avec le même nom, votre valeur l’emporte.

  </Accordion>

  <Accordion title="Comment définir/remplacer les raccourcis de modèle (alias) ?">
    Les alias proviennent de `agents.defaults.models.<modelId>.alias`. Exemple :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Ensuite, `/model sonnet` (ou `/<alias>` lorsque pris en charge) se résout vers cet identifiant de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres fournisseurs comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement au token ; nombreux modèles) :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modèles GLM) :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si vous référencez un fournisseur/modèle alors que la clé du fournisseur requise est absente, vous obtiendrez une erreur d’authentification à l’exécution (par ex. `No API key found for provider "zai"`).

    **Aucune clé API trouvée pour le fournisseur après l’ajout d’un nouvel agent**

    Cela signifie généralement que le **nouvel agent** possède un magasin d’authentification vide. L’authentification est par agent et
    stockée dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Options de correction :

    - Exécutez `openclaw agents add <id>` et configurez l’authentification pendant l’assistant.
    - Ou copiez `auth-profiles.json` depuis le `agentDir` de l’agent principal vers le `agentDir` du nouvel agent.

    Ne réutilisez **pas** `agentDir` entre plusieurs agents ; cela provoque des collisions d’authentification/session.

  </Accordion>
</AccordionGroup>

## Basculement de modèle et « Tous les modèles ont échoué »

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Le basculement se produit en deux étapes :

    1. **Rotation de profil d’authentification** au sein du même fournisseur.
    2. **Modèle de secours** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

    Des cooldowns s’appliquent aux profils en échec (backoff exponentiel), afin qu’OpenClaw puisse continuer à répondre même lorsqu’un fournisseur est limité par son débit ou temporairement en panne.

    Le compartiment de limitation de débit inclut plus que les simples réponses `429`. OpenClaw
    traite également des messages comme `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, et les limites
    périodiques de fenêtre d’utilisation (`weekly/monthly limit reached`) comme des
    limitations de débit justifiant un basculement.

    Certaines réponses qui ressemblent à de la facturation ne sont pas des `402`, et certaines réponses HTTP `402`
    restent également dans ce compartiment transitoire. Si un fournisseur renvoie
    un texte explicite de facturation sur `401` ou `403`, OpenClaw peut encore le garder dans
    la voie facturation, mais les correspondances textuelles spécifiques au fournisseur restent limitées au
    fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Si un message `402`
    ressemble plutôt à une fenêtre d’utilisation réessayable ou
    à une limite de dépenses d’organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw le traite comme
    `rate_limit`, pas comme une longue désactivation de facturation.

    Les erreurs de dépassement de contexte sont différentes : des signatures telles que
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, ou `ollama error: context length
    exceeded` restent sur le chemin Compaction/réessai au lieu de faire avancer le
    modèle de secours.

    Le texte générique d’erreur serveur est volontairement plus restreint que « tout ce qui contient
    unknown/error ». OpenClaw traite bien des formes transitoires délimitées par fournisseur
    telles que le simple `An unknown error occurred` d’Anthropic, le simple
    `Provider returned error` d’OpenRouter, les erreurs de raison d’arrêt comme `Unhandled stop reason:
    error`, les charges utiles JSON `api_error` avec un texte serveur transitoire
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), et les erreurs de fournisseur occupé telles que `ModelNotReadyException` comme
    des signaux de timeout/surcharge justifiant un basculement lorsque le contexte fournisseur
    correspond.
    Le texte de repli interne générique comme `LLM request failed with an unknown
    error.` reste prudent et ne déclenche pas à lui seul le modèle de secours.

  </Accordion>

  <Accordion title='Que signifie "No credentials found for profile anthropic:default" ?'>
    Cela signifie que le système a tenté d’utiliser l’identifiant de profil d’authentification `anthropic:default`, mais n’a pas pu trouver les identifiants correspondants dans le magasin d’authentification attendu.

    **Liste de vérification :**

    - **Confirmez où vivent les profils d’authentification** (nouveaux chemins vs chemins historiques)
      - Actuel : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Historique : `~/.openclaw/agent/*` (migré par `openclaw doctor`)
    - **Confirmez que votre variable d’environnement est chargée par le Gateway**
      - Si vous avez défini `ANTHROPIC_API_KEY` dans votre shell mais exécutez le Gateway via systemd/launchd, il peut ne pas l’hériter. Placez-la dans `~/.openclaw/.env` ou activez `env.shellEnv`.
    - **Assurez-vous de modifier le bon agent**
      - Les configurations multi-agent signifient qu’il peut y avoir plusieurs fichiers `auth-profiles.json`.
    - **Vérifiez rapidement l’état du modèle/de l’authentification**
      - Utilisez `openclaw models status` pour voir les modèles configurés et si les fournisseurs sont authentifiés.

    **Liste de vérification pour "No credentials found for profile anthropic"**

    Cela signifie que l’exécution est épinglée à un profil d’authentification Anthropic, mais que le Gateway
    ne parvient pas à le trouver dans son magasin d’authentification.

    - **Utiliser Claude CLI**
      - Exécutez `openclaw models auth login --provider anthropic --method cli --set-default` sur l’hôte gateway.
    - **Si vous voulez plutôt utiliser une clé API**
      - Placez `ANTHROPIC_API_KEY` dans `~/.openclaw/.env` sur l’**hôte gateway**.
      - Effacez tout ordre épinglé qui force un profil manquant :

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirmez que vous exécutez les commandes sur l’hôte gateway**
      - En mode distant, les profils d’authentification vivent sur la machine gateway, pas sur votre ordinateur portable.

  </Accordion>

  <Accordion title="Pourquoi a-t-il aussi essayé Google Gemini puis échoué ?">
    Si votre configuration de modèle inclut Google Gemini comme modèle de secours (ou si vous êtes passé à un raccourci Gemini), OpenClaw l’essaiera lors du basculement de modèle. Si vous n’avez pas configuré d’identifiants Google, vous verrez `No API key found for provider "google"`.

    Correctif : fournissez une authentification Google, ou retirez/évitez les modèles Google dans `agents.defaults.model.fallbacks` / alias afin que le basculement ne route pas vers eux.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Cause : l’historique de session contient des **blocs de réflexion sans signatures** (souvent issus
    d’un flux interrompu/partiel). Google Antigravity exige des signatures pour les blocs de réflexion.

    Correctif : OpenClaw supprime désormais les blocs de réflexion non signés pour Google Antigravity Claude. Si cela apparaît encore, démarrez une **nouvelle session** ou définissez `/thinking off` pour cet agent.

  </Accordion>
</AccordionGroup>

## Profils d’authentification : ce qu’ils sont et comment les gérer

Voir aussi : [/concepts/oauth](/fr/concepts/oauth) (flux OAuth, stockage des tokens, schémas multi-comptes)

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’un profil d’authentification ?">
    Un profil d’authentification est un enregistrement nommé d’identifiants (OAuth ou clé API) lié à un fournisseur. Les profils vivent dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quels sont les identifiants de profil typiques ?">
    OpenClaw utilise des identifiants préfixés par fournisseur comme :

    - `anthropic:default` (courant lorsqu’aucune identité e-mail n’existe)
    - `anthropic:<email>` pour les identités OAuth
    - des identifiants personnalisés que vous choisissez (par ex. `anthropic:work`)

  </Accordion>

  <Accordion title="Puis-je contrôler quel profil d’authentification est essayé en premier ?">
    Oui. La configuration prend en charge des métadonnées facultatives pour les profils ainsi qu’un ordre par fournisseur (`auth.order.<provider>`). Cela **ne stocke pas** de secrets ; cela mappe les identifiants au fournisseur/mode et définit l’ordre de rotation.

    OpenClaw peut temporairement ignorer un profil s’il est dans un court **cooldown** (limitations de débit/timeouts/échecs d’authentification) ou dans un état **désactivé** plus long (facturation/crédits insuffisants). Pour inspecter cela, exécutez `openclaw models status --json` et vérifiez `auth.unusableProfiles`. Réglage : `auth.cooldowns.billingBackoffHours*`.

    Les cooldowns de limitation de débit peuvent être limités à un modèle. Un profil qui est en cooldown
    pour un modèle peut encore être utilisable pour un modèle frère chez le même fournisseur,
    tandis que les fenêtres de facturation/désactivation bloquent toujours tout le profil.

    Vous pouvez aussi définir une surcharge d’ordre **par agent** (stockée dans le `auth-state.json` de cet agent) via la CLI :

    ```bash
    # Prend par défaut l’agent par défaut configuré (omettez --agent)
    openclaw models auth order get --provider anthropic

    # Verrouiller la rotation sur un seul profil (n’essayer que celui-ci)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou définir un ordre explicite (repli au sein du fournisseur)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Effacer la surcharge (revenir à config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Pour cibler un agent spécifique :

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Pour vérifier ce qui sera réellement essayé, utilisez :

    ```bash
    openclaw models status --probe
    ```

    Si un profil stocké est omis de l’ordre explicite, la sonde signale
    `excluded_by_auth_order` pour ce profil au lieu de l’essayer silencieusement.

  </Accordion>

  <Accordion title="OAuth ou clé API — quelle est la différence ?">
    OpenClaw prend en charge les deux :

    - **OAuth** exploite souvent un accès par abonnement (lorsqu’applicable).
    - **Les clés API** utilisent une facturation au token.

    L’assistant prend explicitement en charge Anthropic Claude CLI, OpenAI Codex OAuth et les clés API.

  </Accordion>
</AccordionGroup>

## Gateway : ports, « déjà en cours d’exécution » et mode distant

<AccordionGroup>
  <Accordion title="Quel port utilise le Gateway ?">
    `gateway.port` contrôle le port multiplexé unique pour WebSocket + HTTP (Control UI, hooks, etc.).

    Ordre de priorité :

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status indique-t-il "Runtime: running" mais "RPC probe: failed" ?'>
    Parce que « running » est la vue du **superviseur** (launchd/systemd/schtasks). La sonde RPC correspond à la CLI qui se connecte réellement au WebSocket gateway et appelle `status`.

    Utilisez `openclaw gateway status` et faites confiance à ces lignes :

    - `Probe target:` (l’URL réellement utilisée par la sonde)
    - `Listening:` (ce qui est réellement lié au port)
    - `Last gateway error:` (cause racine courante lorsque le processus est vivant mais que le port n’écoute pas)

  </Accordion>

  <Accordion title='Pourquoi openclaw gateway status affiche-t-il "Config (cli)" et "Config (service)" différents ?'>
    Vous modifiez un fichier de configuration alors que le service en exécute un autre (souvent à cause d’un décalage `--profile` / `OPENCLAW_STATE_DIR`).

    Correctif :

    ```bash
    openclaw gateway install --force
    ```

    Exécutez cela depuis le même `--profile` / environnement que celui que vous voulez voir utilisé par le service.

  </Accordion>

  <Accordion title='Que signifie "another gateway instance is already listening" ?'>
    OpenClaw impose un verrou d’exécution en liant immédiatement le listener WebSocket au démarrage (par défaut `ws://127.0.0.1:18789`). Si la liaison échoue avec `EADDRINUSE`, il lève `GatewayLockError`, indiquant qu’une autre instance écoute déjà.

    Correctif : arrêtez l’autre instance, libérez le port, ou exécutez avec `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Comment exécuter OpenClaw en mode distant (le client se connecte à un Gateway ailleurs) ?">
    Définissez `gateway.mode: "remote"` et pointez vers une URL WebSocket distante, éventuellement avec des identifiants distants à secret partagé :

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Remarques :

    - `openclaw gateway` ne démarre que lorsque `gateway.mode` est `local` (ou si vous passez le drapeau de surcharge).
    - L’application macOS surveille le fichier de configuration et change de mode en direct lorsque ces valeurs changent.
    - `gateway.remote.token` / `.password` sont uniquement des identifiants distants côté client ; ils n’activent pas à eux seuls l’authentification du gateway local.

  </Accordion>

  <Accordion title='La Control UI affiche "unauthorized" (ou continue à se reconnecter). Que faire ?'>
    Le chemin d’authentification de votre gateway et la méthode d’authentification de l’UI ne correspondent pas.

    Faits (d’après le code) :

    - La Control UI conserve le token dans `sessionStorage` pour la session de l’onglet du navigateur courant et l’URL gateway sélectionnée, donc les actualisations dans le même onglet continuent de fonctionner sans rétablir une persistance longue durée du token dans localStorage.
    - Sur `AUTH_TOKEN_MISMATCH`, les clients de confiance peuvent tenter un unique nouvel essai borné avec un token d’appareil mis en cache lorsque le gateway renvoie des indications de nouvel essai (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ce nouvel essai avec token mis en cache réutilise désormais les scopes approuvés mis en cache et stockés avec le token d’appareil. Les appelants explicites `deviceToken` / `scopes` explicites conservent toujours leur ensemble de scopes demandé au lieu d’hériter des scopes mis en cache.
    - En dehors de ce chemin de nouvel essai, l’ordre de priorité de l’authentification de connexion est : token/mot de passe partagé explicite d’abord, puis `deviceToken` explicite, puis token d’appareil stocké, puis token bootstrap.
    - Les vérifications de scope du token bootstrap sont préfixées par rôle. La liste d’autorisation intégrée de l’opérateur bootstrap ne satisfait que les requêtes opérateur ; les rôles node ou d’autres rôles non opérateur nécessitent toujours des scopes sous leur propre préfixe de rôle.

    Correctif :

    - Le plus rapide : `openclaw dashboard` (affiche + copie l’URL du tableau de bord, tente de l’ouvrir ; affiche une indication SSH si headless).
    - Si vous n’avez pas encore de token : `openclaw doctor --generate-gateway-token`.
    - Si c’est distant, tunnelisez d’abord : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`.
    - Mode secret partagé : définissez `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, puis collez le secret correspondant dans les paramètres de la Control UI.
    - Mode Tailscale Serve : assurez-vous que `gateway.auth.allowTailscale` est activé et que vous ouvrez l’URL Serve, pas une URL loopback/tailnet brute qui contourne les en-têtes d’identité Tailscale.
    - Mode trusted-proxy : assurez-vous de passer par le proxy conscient de l’identité non-loopback configuré, et non par un proxy loopback sur le même hôte ni une URL gateway brute.
    - Si le décalage persiste après l’unique nouvel essai, faites tourner/réapprouvez le token de l’appareil appairé :
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Si cet appel de rotation indique qu’il a été refusé, vérifiez deux choses :
      - les sessions d’appareil appairé ne peuvent faire tourner que **leur propre** appareil, sauf si elles disposent aussi de `operator.admin`
      - les valeurs `--scope` explicites ne peuvent pas dépasser les scopes opérateur actuels de l’appelant
    - Toujours bloqué ? Exécutez `openclaw status --all` et suivez [Troubleshooting](/fr/gateway/troubleshooting). Voir [Dashboard](/web/dashboard) pour les détails d’authentification.

  </Accordion>

  <Accordion title="J’ai défini gateway.bind tailnet mais il ne peut pas se lier et rien n’écoute">
    Le bind `tailnet` choisit une IP Tailscale depuis vos interfaces réseau (100.64.0.0/10). Si la machine n’est pas sur Tailscale (ou si l’interface est inactive), il n’y a rien sur quoi se lier.

    Correctif :

    - Démarrez Tailscale sur cet hôte (afin qu’il possède une adresse 100.x), ou
    - Passez à `gateway.bind: "loopback"` / `"lan"`.

    Remarque : `tailnet` est explicite. `auto` préfère loopback ; utilisez `gateway.bind: "tailnet"` lorsque vous voulez une liaison réservée au tailnet.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs Gateways sur le même hôte ?">
    En général, non — un seul Gateway peut exécuter plusieurs canaux de messagerie et agents. N’utilisez plusieurs Gateways que lorsque vous avez besoin de redondance (par ex. bot de secours) ou d’une isolation forte.

    Oui, mais vous devez isoler :

    - `OPENCLAW_CONFIG_PATH` (configuration par instance)
    - `OPENCLAW_STATE_DIR` (état par instance)
    - `agents.defaults.workspace` (isolation de l’espace de travail)
    - `gateway.port` (ports uniques)

    Configuration rapide (recommandée) :

    - Utilisez `openclaw --profile <name> ...` par instance (crée automatiquement `~/.openclaw-<name>`).
    - Définissez un `gateway.port` unique dans chaque configuration de profil (ou passez `--port` pour les exécutions manuelles).
    - Installez un service par profil : `openclaw --profile <name> gateway install`.

    Les profils suffixent aussi les noms de service (`ai.openclaw.<profile>` ; anciens `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guide complet : [Gateways multiples](/fr/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Que signifie "invalid handshake" / code 1008 ?'>
    Le Gateway est un **serveur WebSocket**, et il s’attend à ce que le tout premier message soit
    une trame `connect`. S’il reçoit autre chose, il ferme la connexion
    avec le **code 1008** (violation de politique).

    Causes courantes :

    - Vous avez ouvert l’URL **HTTP** dans un navigateur (`http://...`) au lieu d’un client WS.
    - Vous avez utilisé le mauvais port ou le mauvais chemin.
    - Un proxy ou tunnel a supprimé les en-têtes d’authentification ou envoyé une requête non Gateway.

    Correctifs rapides :

    1. Utilisez l’URL WS : `ws://<host>:18789` (ou `wss://...` si HTTPS).
    2. N’ouvrez pas le port WS dans un onglet normal du navigateur.
    3. Si l’authentification est activée, incluez le token/mot de passe dans la trame `connect`.

    Si vous utilisez la CLI ou le TUI, l’URL doit ressembler à :

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Détails du protocole : [Protocole Gateway](/fr/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Journalisation et débogage

<AccordionGroup>
  <Accordion title="Où sont les journaux ?">
    Journaux de fichier (structurés) :

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Vous pouvez définir un chemin stable via `logging.file`. Le niveau du journal fichier est contrôlé par `logging.level`. La verbosité console est contrôlée par `--verbose` et `logging.consoleLevel`.

    Suivi de journal le plus rapide :

    ```bash
    openclaw logs --follow
    ```

    Journaux de service/superviseur (lorsque le gateway s’exécute via launchd/systemd) :

    - macOS : `$OPENCLAW_STATE_DIR/logs/gateway.log` et `gateway.err.log` (par défaut : `~/.openclaw/logs/...` ; les profils utilisent `~/.openclaw-<profile>/logs/...`)
    - Linux : `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows : `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Voir [Troubleshooting](/fr/gateway/troubleshooting) pour plus d’informations.

  </Accordion>

  <Accordion title="Comment démarrer/arrêter/redémarrer le service Gateway ?">
    Utilisez les assistants gateway :

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous exécutez le gateway manuellement, `openclaw gateway --force` peut récupérer le port. Voir [Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="J’ai fermé mon terminal sous Windows — comment redémarrer OpenClaw ?">
    Il existe **deux modes d’installation Windows** :

    **1) WSL2 (recommandé) :** le Gateway s’exécute dans Linux.

    Ouvrez PowerShell, entrez dans WSL, puis redémarrez :

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous n’avez jamais installé le service, démarrez-le au premier plan :

    ```bash
    openclaw gateway run
    ```

    **2) Windows natif (non recommandé) :** le Gateway s’exécute directement dans Windows.

    Ouvrez PowerShell et exécutez :

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Si vous l’exécutez manuellement (sans service), utilisez :

    ```powershell
    openclaw gateway run
    ```

    Documentation : [Windows (WSL2)](/fr/platforms/windows), [Runbook du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="Le Gateway est actif mais les réponses n’arrivent jamais. Que dois-je vérifier ?">
    Commencez par un contrôle rapide de santé :

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Causes courantes :

    - L’authentification du modèle n’est pas chargée sur l’**hôte gateway** (vérifiez `models status`).
    - L’appairage/la liste d’autorisation du canal bloque les réponses (vérifiez la configuration du canal + les journaux).
    - WebChat/Dashboard est ouvert sans le bon token.

    Si vous êtes en distant, confirmez que le tunnel/la connexion Tailscale est actif/active et que le
    WebSocket Gateway est accessible.

    Documentation : [Canaux](/fr/channels), [Troubleshooting](/fr/gateway/troubleshooting), [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — que faire ?'>
    Cela signifie généralement que l’UI a perdu la connexion WebSocket. Vérifiez :

    1. Le Gateway est-il en cours d’exécution ? `openclaw gateway status`
    2. Le Gateway est-il sain ? `openclaw status`
    3. L’UI a-t-elle le bon token ? `openclaw dashboard`
    4. En distant, le lien tunnel/Tailscale est-il actif ?

    Puis suivez les journaux :

    ```bash
    openclaw logs --follow
    ```

    Documentation : [Dashboard](/web/dashboard), [Accès distant](/fr/gateway/remote), [Troubleshooting](/fr/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands échoue. Que dois-je vérifier ?">
    Commencez par les journaux et le statut du canal :

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Puis faites correspondre l’erreur :

    - `BOT_COMMANDS_TOO_MUCH` : le menu Telegram contient trop d’entrées. OpenClaw réduit déjà jusqu’à la limite Telegram et réessaie avec moins de commandes, mais certaines entrées du menu doivent encore être supprimées. Réduisez les commandes de plugin/Skill/personnalisées, ou désactivez `channels.telegram.commands.native` si vous n’avez pas besoin du menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, ou erreurs réseau similaires : si vous êtes sur un VPS ou derrière un proxy, confirmez que le HTTPS sortant est autorisé et que le DNS fonctionne pour `api.telegram.org`.

    Si le Gateway est distant, assurez-vous de consulter les journaux sur l’hôte Gateway.

    Documentation : [Telegram](/fr/channels/telegram), [Dépannage des canaux](/fr/channels/troubleshooting).

  </Accordion>

  <Accordion title="Le TUI n’affiche aucune sortie. Que dois-je vérifier ?">
    Confirmez d’abord que le Gateway est accessible et que l’agent peut s’exécuter :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Dans le TUI, utilisez `/status` pour voir l’état actuel. Si vous attendez des réponses dans un canal
    de chat, assurez-vous que la distribution est activée (`/deliver on`).

    Documentation : [TUI](/web/tui), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment arrêter complètement puis démarrer le Gateway ?">
    Si vous avez installé le service :

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Cela arrête/démarre le **service supervisé** (launchd sur macOS, systemd sur Linux).
    Utilisez ceci lorsque le Gateway s’exécute en arrière-plan comme démon.

    Si vous l’exécutez au premier plan, arrêtez-le avec Ctrl-C, puis :

    ```bash
    openclaw gateway run
    ```

    Documentation : [Runbook du service Gateway](/fr/gateway).

  </Accordion>

  <Accordion title="ELI5 : openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart` : redémarre le **service en arrière-plan** (launchd/systemd).
    - `openclaw gateway` : exécute le gateway **au premier plan** pour cette session de terminal.

    Si vous avez installé le service, utilisez les commandes gateway. Utilisez `openclaw gateway` lorsque
    vous voulez une exécution ponctuelle au premier plan.

  </Accordion>

  <Accordion title="Moyen le plus rapide d’obtenir plus de détails quand quelque chose échoue">
    Démarrez le Gateway avec `--verbose` pour obtenir plus de détails dans la console. Puis inspectez le fichier journal pour l’authentification des canaux, le routage des modèles et les erreurs RPC.
  </Accordion>
</AccordionGroup>

## Médias et pièces jointes

<AccordionGroup>
  <Accordion title="Ma Skill a généré une image/un PDF, mais rien n’a été envoyé">
    Les pièces jointes sortantes de l’agent doivent inclure une ligne `MEDIA:<path-or-url>` (sur sa propre ligne). Voir [Configuration de l’assistant OpenClaw](/fr/start/openclaw) et [Envoi d’agent](/fr/tools/agent-send).

    Envoi via CLI :

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Vérifiez aussi :

    - Le canal cible prend en charge les médias sortants et n’est pas bloqué par des listes d’autorisation.
    - Le fichier respecte les limites de taille du fournisseur (les images sont redimensionnées à un maximum de 2048 px).
    - `tools.fs.workspaceOnly=true` limite les envois par chemin local à l’espace de travail, temp/media-store et aux fichiers validés par sandbox.
    - `tools.fs.workspaceOnly=false` permet à `MEDIA:` d’envoyer des fichiers locaux de l’hôte que l’agent peut déjà lire, mais uniquement pour les médias plus les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Les fichiers texte brut et assimilables à des secrets restent bloqués.

    Voir [Images](/fr/nodes/images).

  </Accordion>
</AccordionGroup>

## Sécurité et contrôle d’accès

<AccordionGroup>
  <Accordion title="Est-il sûr d’exposer OpenClaw à des DM entrants ?">
    Traitez les DM entrants comme des entrées non fiables. Les valeurs par défaut sont conçues pour réduire le risque :

    - Le comportement par défaut sur les canaux compatibles DM est l’**association** :
      - Les expéditeurs inconnus reçoivent un code d’association ; le bot ne traite pas leur message.
      - Approuvez avec : `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Les demandes en attente sont limitées à **3 par canal** ; vérifiez `openclaw pairing list --channel <channel> [--account <id>]` si un code n’est pas arrivé.
    - Ouvrir publiquement les DM nécessite un opt-in explicite (`dmPolicy: "open"` et liste d’autorisation `"*"`).

    Exécutez `openclaw doctor` pour faire remonter les politiques DM risquées.

  </Accordion>

  <Accordion title="L’injection de prompt ne concerne-t-elle que les bots publics ?">
    Non. L’injection de prompt concerne le **contenu non fiable**, pas seulement le fait de savoir qui peut envoyer un DM au bot.
    Si votre assistant lit du contenu externe (recherche/récupération web, pages navigateur, e-mails,
    documents, pièces jointes, journaux collés), ce contenu peut inclure des instructions qui tentent
    de détourner le modèle. Cela peut arriver même si **vous êtes le seul expéditeur**.

    Le risque le plus important apparaît lorsque les outils sont activés : le modèle peut être amené à
    exfiltrer du contexte ou à appeler des outils en votre nom. Réduisez le rayon d’impact en :

    - utilisant un agent « lecteur » en lecture seule ou sans outils pour résumer le contenu non fiable
    - gardant `web_search` / `web_fetch` / `browser` désactivés pour les agents avec outils activés
    - traitant aussi comme non fiable le texte décodé des fichiers/documents : OpenResponses
      `input_file` et l’extraction des pièces jointes média encapsulent tous deux le texte extrait dans
      des marqueurs explicites de frontière de contenu externe au lieu de transmettre le texte brut du fichier
    - utilisant le sandboxing et des listes d’autorisation d’outils strictes

    Détails : [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Mon bot devrait-il avoir son propre e-mail, compte GitHub ou numéro de téléphone ?">
    Oui, pour la plupart des configurations. Isoler le bot avec des comptes et numéros de téléphone distincts
    réduit le rayon d’impact en cas de problème. Cela facilite aussi la rotation
    des identifiants ou la révocation d’accès sans impacter vos comptes personnels.

    Commencez petit. Donnez accès uniquement aux outils et comptes dont vous avez réellement besoin, puis élargissez
    plus tard si nécessaire.

    Documentation : [Security](/fr/gateway/security), [Association](/fr/channels/pairing).

  </Accordion>

  <Accordion title="Puis-je lui donner de l’autonomie sur mes messages texte et est-ce sûr ?">
    Nous **ne** recommandons **pas** une autonomie totale sur vos messages personnels. Le schéma le plus sûr est :

    - Garder les DM en **mode association** ou avec une liste d’autorisation stricte.
    - Utiliser un **numéro ou compte séparé** si vous voulez qu’il envoie des messages en votre nom.
    - Le laisser rédiger, puis **approuver avant envoi**.

    Si vous voulez expérimenter, faites-le sur un compte dédié et gardez-le isolé. Voir
    [Security](/fr/gateway/security).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles moins chers pour les tâches d’assistant personnel ?">
    Oui, **si** l’agent est limité au chat et que l’entrée est fiable. Les petits modèles sont
    plus susceptibles de subir des détournements d’instructions, donc évitez-les pour les agents avec outils activés
    ou lorsqu’ils lisent du contenu non fiable. Si vous devez utiliser un plus petit modèle, verrouillez les
    outils et exécutez-le dans un sandbox. Voir [Security](/fr/gateway/security).
  </Accordion>

  <Accordion title="J’ai exécuté /start dans Telegram mais je n’ai pas reçu de code d’association">
    Les codes d’association sont envoyés **uniquement** lorsqu’un expéditeur inconnu envoie un message au bot et que
    `dmPolicy: "pairing"` est activé. `/start` à lui seul ne génère pas de code.

    Vérifiez les demandes en attente :

    ```bash
    openclaw pairing list telegram
    ```

    Si vous voulez un accès immédiat, mettez votre identifiant d’expéditeur sur liste d’autorisation ou définissez `dmPolicy: "open"`
    pour ce compte.

  </Accordion>

  <Accordion title="WhatsApp : enverra-t-il des messages à mes contacts ? Comment fonctionne l’association ?">
    Non. La politique DM WhatsApp par défaut est l’**association**. Les expéditeurs inconnus ne reçoivent qu’un code d’association et leur message **n’est pas traité**. OpenClaw ne répond qu’aux chats qu’il reçoit ou aux envois explicites que vous déclenchez.

    Approuvez l’association avec :

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Lister les demandes en attente :

    ```bash
    openclaw pairing list whatsapp
    ```

    Invite du numéro de téléphone dans l’assistant : il est utilisé pour définir votre **liste d’autorisation/propriétaire** afin que vos propres DM soient autorisés. Il n’est pas utilisé pour l’envoi automatique. Si vous utilisez votre numéro WhatsApp personnel, utilisez ce numéro et activez `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Commandes de chat, annulation de tâches, et « il ne veut pas s’arrêter »

<AccordionGroup>
  <Accordion title="Comment empêcher les messages système internes de s’afficher dans le chat ?">
    La plupart des messages internes ou d’outils n’apparaissent que lorsque **verbose**, **trace** ou **reasoning** est activé
    pour cette session.

    Correctif dans le chat où vous le voyez :

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Si cela reste bruyant, vérifiez les paramètres de session dans la Control UI et définissez verbose
    sur **inherit**. Vérifiez aussi que vous n’utilisez pas un profil de bot avec `verboseDefault` défini
    sur `on` dans la configuration.

    Documentation : [Thinking and verbose](/fr/tools/thinking), [Security](/fr/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Comment arrêter/annuler une tâche en cours ?">
    Envoyez l’un de ces messages **comme message autonome** (sans slash) :

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Ce sont des déclencheurs d’annulation (pas des commandes slash).

    Pour les processus en arrière-plan (provenant de l’outil exec), vous pouvez demander à l’agent d’exécuter :

    ```
    process action:kill sessionId:XXX
    ```

    Vue d’ensemble des commandes slash : voir [Commandes slash](/fr/tools/slash-commands).

    La plupart des commandes doivent être envoyées comme message **autonome** commençant par `/`, mais quelques raccourcis (comme `/status`) fonctionnent aussi inline pour les expéditeurs sur liste d’autorisation.

  </Accordion>

  <Accordion title='Comment envoyer un message Discord depuis Telegram ? ("Cross-context messaging denied")'>
    OpenClaw bloque par défaut la messagerie **inter-fournisseur**. Si un appel d’outil est lié
    à Telegram, il n’enverra pas vers Discord sauf si vous l’autorisez explicitement.

    Activez la messagerie inter-fournisseur pour l’agent :

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Redémarrez le gateway après avoir modifié la configuration.

  </Accordion>

  <Accordion title='Pourquoi ai-je l’impression que le bot "ignore" les messages envoyés à la chaîne ?'>
    Le mode file d’attente contrôle la façon dont les nouveaux messages interagissent avec une exécution en cours. Utilisez `/queue` pour changer de mode :

    - `steer` - les nouveaux messages redirigent la tâche en cours
    - `followup` - exécute les messages un par un
    - `collect` - regroupe les messages et répond une seule fois (par défaut)
    - `steer-backlog` - redirige maintenant, puis traite l’arriéré
    - `interrupt` - interrompt l’exécution en cours et redémarre à neuf

    Vous pouvez ajouter des options comme `debounce:2s cap:25 drop:summarize` pour les modes followup.

  </Accordion>
</AccordionGroup>

## Divers

<AccordionGroup>
  <Accordion title='Quel est le modèle par défaut pour Anthropic avec une clé API ?'>
    Dans OpenClaw, les identifiants et la sélection du modèle sont séparés. Définir `ANTHROPIC_API_KEY` (ou stocker une clé API Anthropic dans les profils d’authentification) active l’authentification, mais le modèle par défaut réel est celui que vous configurez dans `agents.defaults.model.primary` (par exemple `anthropic/claude-sonnet-4-6` ou `anthropic/claude-opus-4-6`). Si vous voyez `No credentials found for profile "anthropic:default"`, cela signifie que le Gateway n’a pas pu trouver d’identifiants Anthropic dans le `auth-profiles.json` attendu pour l’agent en cours d’exécution.
  </Accordion>
</AccordionGroup>

---

Toujours bloqué ? Demandez dans [Discord](https://discord.com/invite/clawd) ou ouvrez une [discussion GitHub](https://github.com/openclaw/openclaw/discussions).
