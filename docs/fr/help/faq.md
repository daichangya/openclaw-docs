---
read_when:
    - Répondre aux questions courantes sur la configuration, l’installation, l’onboarding ou le runtime
    - Trier les problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur la configuration, l’installation et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-05T12:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Réponses rapides et dépannage plus approfondi pour des configurations réelles (développement local, VPS, multi-agent, OAuth/clés API, failover de modèle). Pour le diagnostic runtime, voir [Troubleshooting](/gateway/troubleshooting). Pour la référence complète de configuration, voir [Configuration](/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **État rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, joignabilité de la gateway/du service, agents/sessions, configuration du fournisseur + problèmes runtime (lorsque la gateway est joignable).

2. **Rapport copiable-collable (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin des journaux (jetons masqués).

3. **État du daemon + du port**

   ```bash
   openclaw gateway status
   ```

   Affiche le runtime du superviseur par rapport à la joignabilité RPC, l’URL cible de la sonde et la configuration probablement utilisée par le service.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé live de la gateway, y compris des sondes de canaux lorsque pris en charge
   (nécessite une gateway joignable). Voir [Health](/gateway/health).

5. **Suivre le dernier journal**

   ```bash
   openclaw logs --follow
   ```

   Si RPC est indisponible, repliez-vous sur :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les journaux de fichier sont séparés des journaux de service ; voir [Logging](/logging) et [Troubleshooting](/gateway/troubleshooting).

6. **Exécuter Doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration/l’état + exécute des vérifications de santé. Voir [Doctor](/gateway/doctor).

7. **Instantané de la gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Demande à la gateway en cours d’exécution un instantané complet (WS uniquement). Voir [Health](/gateway/health).

## Démarrage rapide et configuration de première exécution

<AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local capable de **voir votre machine**. C’est bien plus efficace que de demander
    sur Discord, parce que la plupart des cas « je suis bloqué » sont des **problèmes locaux de configuration ou d’environnement** que les personnes à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux et aider à corriger votre configuration
    au niveau de la machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur le **checkout complet des sources** via
    l’installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **à partir d’un checkout git**, afin que l’agent puisse lire le code + la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pouvez toujours revenir à stable plus tard
    en relançant l’installeur sans `--install-method git`.

    Astuce : demandez à l’agent de **planifier et superviser** le correctif (étape par étape), puis d’exécuter uniquement les
    commandes nécessaires. Cela garde les changements réduits et plus faciles à auditer.

    Si vous découvrez un vrai bug ou un correctif, veuillez ouvrir une issue GitHub ou envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties lorsque vous demandez de l’aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu’elles font :

    - `openclaw status` : instantané rapide de la santé de la gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification des fournisseurs + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/d’état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](#les-60-premieres-secondes-si-quelque-chose-est-casse).
    Documentation d’installation : [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue d’être ignoré. Que signifient les raisons d’ignorance ?">
    Raisons courantes d’ignorance de heartbeat :

    - `quiet-hours` : en dehors de la fenêtre active-hours configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide/en-têtes
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif mais aucun intervalle de tâche n’est encore arrivé à échéance
    - `alerts-disabled` : toute la visibilité heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d’échéance ne sont avancés qu’après qu’une vraie exécution heartbeat
    est terminée. Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/gateway/heartbeat), [Automation & Tasks](/automation).

  </Accordion>

  <Accordion title="Façon recommandée d’installer et de configurer OpenClaw">
    Le dépôt recommande une exécution depuis les sources et l’utilisation de l’onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L’assistant peut aussi construire automatiquement les assets UI. Après l’onboarding, vous exécutez généralement la Gateway sur le port **18789**.

    Depuis les sources (contributeurs/dev) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # auto-installs UI deps on first run
    openclaw onboard
    ```

    Si vous n’avez pas encore d’installation globale, exécutez-le via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le dashboard après l’onboarding ?">
    L’assistant ouvre votre navigateur avec une URL de dashboard propre (sans jeton) juste après l’onboarding et affiche aussi le lien dans le résumé. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le dashboard sur localhost versus à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S’il demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de l’interface Control.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un jeton avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez la liaison en loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification Control UI/WebSocket (pas besoin de coller un secret partagé, en supposant un hôte gateway de confiance) ; les API HTTP exigent toujours une authentification par secret partagé sauf si vous utilisez délibérément `none` en entrée privée ou l’authentification HTTP trusted-proxy.
      Les tentatives concurrentes invalides d’authentification Serve depuis un même client sont sérialisées avant que le limiteur d’échec d’authentification n’enregistre l’échec, donc la deuxième mauvaise tentative peut déjà afficher `retry later`.
    - **Liaison tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez l’authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du dashboard.
    - **Reverse proxy avec reconnaissance d’identité** : gardez la Gateway derrière un trusted proxy non-loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours à travers le tunnel ; collez le jeton ou le mot de passe configuré si demandé.

    Voir [Dashboard](/web/dashboard) et [Web surfaces](/web) pour les modes de liaison et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi y a-t-il deux configurations d’approbation exec pour les approbations dans le chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les invites d’approbation vers les destinations de chat
    - `channels.<channel>.execApprovals` : fait agir ce canal comme un client natif d’approbation pour les approbations exec

    La politique exec de l’hôte reste la véritable barrière d’approbation. La configuration de chat ne contrôle que l’endroit
    où les invites d’approbation apparaissent et la manière dont les personnes peuvent répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs en toute sécurité, OpenClaw active désormais automatiquement les approbations natives DM-first lorsque `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`.
    - Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette UI native est le chemin principal ; l’agent ne doit inclure une commande `/approve` manuelle que si le résultat de l’outil indique que les approbations de chat sont indisponibles ou qu’une approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement lorsque les invites doivent aussi être transférées à d’autres chats ou à des salons ops explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous voulez explicitement que les invites d’approbation soient publiées dans le salon/topic d’origine.
    - Les approbations de plugin sont encore séparées : elles utilisent par défaut `/approve` dans le même chat, un transfert facultatif `approvals.plugin`, et seuls certains canaux natifs conservent en plus une gestion native des approbations de plugin.

    En résumé : le forwarding sert au routage, la configuration du client natif sert à une UX plus riche et spécifique au canal.
    Voir [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun est **non recommandé** pour la Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. La Gateway est légère : la documentation indique que **512MB-1GB de RAM**, **1 cœur** et environ **500MB**
    de disque suffisent pour un usage personnel, et précise qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2GB sont recommandés**, mais ce
    n’est pas un minimum strict.

    Astuce : un petit Pi/VPS peut héberger la Gateway, et vous pouvez appairer des **nœuds**
    sur votre ordinateur portable/téléphone pour l’écran/la caméra/le canvas local ou l’exécution de commandes. Voir [Nodes](/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    En bref : cela fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l’installation **hackable (git)** pour voir les journaux et mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d’étranges problèmes binaires, il s’agit généralement d’un problème de **compatibilité ARM**.

    Documentation : [Linux](/platforms/linux), [Install](/install).

  </Accordion>

  <Accordion title="C’est bloqué sur wake up my friend / l’onboarding ne veut pas éclore. Que faire ?">
    Cet écran dépend du fait que la Gateway soit joignable et authentifiée. L’interface TUI envoie aussi
    « Wake up, my friend! » automatiquement lors du premier hatch. Si vous voyez cette ligne **sans réponse**
    et que les jetons restent à 0, l’agent ne s’est jamais exécuté.

    1. Redémarrez la Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez l’état + l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela reste bloqué, exécutez :

    ```bash
    openclaw doctor
    ```

    Si la Gateway est distante, assurez-vous que le tunnel/la connexion Tailscale est actif et que l’interface
    pointe vers la bonne Gateway. Voir [Remote access](/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et le **workspace**, puis exécutez Doctor une fois. Cela
    conserve votre bot « exactement pareil » (mémoire, historique de session, authentification et
    état des canaux) tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre workspace (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, rappelez-vous que l’hôte gateway possède le magasin de sessions et le workspace.

    **Important :** si vous ne commit/push que votre workspace vers GitHub, vous sauvegardez
    **la mémoire + les fichiers bootstrap**, mais **pas** l’historique de session ni l’authentification. Ceux-ci vivent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Voir aussi : [Migrating](/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor),
    [Remote mode](/gateway/remote).

  </Accordion>

  <Accordion title="Où voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    correspond à la dernière version publiée. Les entrées sont regroupées en **Highlights**, **Changes** et
    **Fixes** (plus des sections docs/autres si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent à tort `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-la ou ajoutez `docs.openclaw.ai` à la liste d’autorisation, puis réessayez.
    Merci de nous aider à le débloquer en signalant le problème ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas atteindre le site, la documentation est aussi recopiée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **npm dist-tags**, pas des lignes de code séparées :

    - `latest` = stable
    - `beta` = version précoce pour les tests

    Habituellement, une version stable arrive d’abord sur **beta**, puis une étape explicite
    de promotion déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement sur `latest` si nécessaire. C’est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les one-liners d’installation et la différence entre beta et dev, voir l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mouvante de `main` (git) ; lorsqu’elle est publiée, elle utilise le dist-tag npm `dev`.

    One-liners (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installeur Windows (PowerShell) :
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Plus de détails : [Development channels](/install/development-channels) et [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les tout derniers changements ?">
    Deux options :

    1. **Canal dev (checkout git) :**

    ```bash
    openclaw update --channel dev
    ```

    Cela bascule sur la branche `main` et met à jour depuis les sources.

    2. **Installation hackable (depuis le site de l’installeur) :**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela vous donne un dépôt local que vous pouvez modifier, puis mettre à jour via git.

    Si vous préférez un clone propre manuel, utilisez :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentation : [Update](/cli/update), [Development channels](/install/development-channels),
    [Install](/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Guide approximatif :

    - **Installation :** 2-5 minutes
    - **Onboarding :** 5-15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela se bloque, utilisez [Installer stuck](#quick-start-and-first-run-setup)
    et la boucle de débogage rapide dans [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="L’installeur est bloqué ? Comment obtenir plus de retours ?">
    Relancez l’installeur avec une **sortie verbeuse** :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installation beta avec verbose :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Pour une installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Équivalent Windows (PowerShell) :

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d’options : [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Sous Windows, l’installation dit git not found ou openclaw not recognized">
    Deux problèmes courants sous Windows :

    **1) erreur npm spawn git / git not found**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez et rouvrez PowerShell, puis relancez l’installeur.

    **2) openclaw is not recognized après l’installation**

    - Votre dossier npm global bin n’est pas dans le PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sur Windows ; sur la plupart des systèmes, c’est `%AppData%\npm`).
    - Fermez et rouvrez PowerShell après la mise à jour du PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** au lieu de Windows natif.
    Documentation : [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="La sortie exec sous Windows affiche du texte chinois corrompu - que faire ?">
    Il s’agit généralement d’un décalage de page de code console dans les shells Windows natifs.

    Symptômes :

    - la sortie `system.run`/`exec` affiche le chinois en mojibake
    - la même commande s’affiche correctement dans un autre profil de terminal

    Solution de contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Puis redémarrez la Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez encore cela sur la dernière version d’OpenClaw, suivez/signalez-le ici :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question - comment obtenir une meilleure réponse ?">
    Utilisez l’installation **hackable (git)** pour avoir localement les sources et la documentation complètes, puis demandez
    à votre bot (ou à Claude/Codex) _depuis ce dossier_ afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Install](/install) et [Installer flags](/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l’onboarding.

    - Chemin rapide Linux + installation du service : [Linux](/platforms/linux).
    - Procédure complète : [Getting Started](/fr/start/getting-started).
    - Installeur + mises à jour : [Install & updates](/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux convient. Installez-le sur le serveur, puis utilisez SSH/Tailscale pour atteindre la Gateway.

    Guides : [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
    Accès distant : [Gateway remote](/gateway/remote).

  </Accordion>

  <Accordion title="Où sont les guides d’installation cloud/VPS ?">
    Nous maintenons un **hub d’hébergement** avec les fournisseurs courants. Choisissez-en un et suivez le guide :

    - [VPS hosting](/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    Comment cela fonctionne dans le cloud : la **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via l’interface Control (ou Tailscale/SSH). Votre état + workspace
    vivent sur le serveur, donc traitez l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez appairer des **nœuds** (Mac/iOS/Android/headless) à cette Gateway cloud pour accéder
    à l’écran/la caméra/le canvas local ou exécuter des commandes sur votre ordinateur portable tout en gardant
    la Gateway dans le cloud.

    Hub : [Platforms](/platforms). Accès distant : [Gateway remote](/gateway/remote).
    Nœuds : [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **possible, mais non recommandé**. Le flux de mise à jour peut redémarrer la
    Gateway (ce qui coupe la session active), peut nécessiter un checkout git propre, et
    peut demander une confirmation. Il est plus sûr d’exécuter les mises à jour depuis un shell en tant qu’opérateur.

    Utilisez la CLI :

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si vous devez automatiser depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentation : [Update](/cli/update), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le chemin de configuration recommandé. En **mode local**, il vous guide pour :

    - **Configuration du modèle/de l’authentification** (OAuth fournisseur, réutilisation de Claude CLI et clés API prises en charge, plus options de modèles locaux comme LM Studio)
    - Emplacement du **workspace** + fichiers bootstrap
    - **Paramètres Gateway** (bind/port/auth/tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus plugins de canal intégrés comme QQ Bot)
    - **Installation du daemon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - **Vérifications de santé** et sélection des **Skills**

    Il avertit aussi si votre modèle configuré est inconnu ou s’il manque l’authentification.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour le faire tourner ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec
    des **modèles purement locaux** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces fournisseurs.

    Nous pensons que le fallback Claude Code CLI est probablement autorisé pour une automatisation
    locale gérée par l’utilisateur, sur la base de la documentation publique CLI d’Anthropic. Cela dit,
    la politique d’Anthropic sur les harnais tiers crée suffisamment d’ambiguïté autour
    de l’usage adossé à un abonnement dans des produits externes pour que nous ne le recommandions pas
    en production. Anthropic a aussi informé les utilisateurs OpenClaw le **4 avril 2026
    à 12:00 PM PT / 8:00 PM BST** que le chemin de connexion Claude d’**OpenClaw**
    est compté comme une utilisation de harnais tiers et nécessite désormais une **Extra Usage**
    facturée séparément de l’abonnement. L’OAuth OpenAI Codex est explicitement
    pris en charge pour les outils externes comme OpenClaw.

    OpenClaw prend aussi en charge d’autres options hébergées de style abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** et
    **Z.AI / GLM Coding Plan**.

    Documentation : [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [GLM Models](/providers/glm),
    [Local models](/gateway/local-models), [Models](/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé API ?">
    Oui, via une connexion **Claude CLI** locale sur l’hôte gateway.

    Les abonnements Claude Pro/Max **n’incluent pas de clé API**, donc la
    réutilisation de Claude CLI est le chemin de repli local dans OpenClaw. Nous pensons que le fallback Claude Code CLI
    est probablement autorisé pour une automatisation locale gérée par l’utilisateur, sur la base de
    la documentation publique CLI d’Anthropic. Cela dit, la politique d’Anthropic sur les harnais tiers
    crée suffisamment d’ambiguïté autour de l’usage adossé à un abonnement dans des produits externes
    pour que nous ne le recommandions pas en production. Nous recommandons
    plutôt les clés API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui. Réutilisez une connexion **Claude CLI** locale sur l’hôte gateway avec `openclaw models auth login --provider anthropic --method cli --set-default`.

    Le setup-token Anthropic est aussi de nouveau disponible comme chemin OpenClaw historique/manuel. La notification de facturation spécifique à OpenClaw d’Anthropic s’y applique toujours ; utilisez-le donc en partant du principe qu’Anthropic exige **Extra Usage**. Voir [Anthropic](/providers/anthropic) et [OAuth](/concepts/oauth).

    Important : nous pensons que le fallback Claude Code CLI est probablement autorisé pour une automatisation
    locale gérée par l’utilisateur, sur la base de la documentation publique CLI d’Anthropic. Cela dit,
    la politique d’Anthropic sur les harnais tiers crée suffisamment d’ambiguïté autour
    de l’usage adossé à un abonnement dans des produits externes pour que nous ne le recommandions pas
    en production. Anthropic a aussi indiqué aux utilisateurs OpenClaw le **4 avril 2026 à
    12:00 PM PT / 8:00 PM BST** que le chemin de connexion Claude d’**OpenClaw**
    nécessite **Extra Usage**, facturée séparément de l’abonnement.

    Pour la production ou les charges multi-utilisateurs, l’authentification par clé API Anthropic est le
    choix le plus sûr et recommandé. Si vous voulez d’autres options hébergées de style abonnement
    dans OpenClaw, voir [OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax), et
    [GLM Models](/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Pourquoi est-ce que je vois HTTP 429 rate_limit_error depuis Anthropic ?">
Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
utilisez une **clé API Anthropic**, vérifiez l’usage/la facturation dans la Console Anthropic
et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, la requête tente d’utiliser
    la bêta de contexte 1M d’Anthropic (`context1m: true`). Cela ne fonctionne que si votre
    identifiant est éligible à la facturation long-context (facturation par clé API ou
    chemin de connexion Claude OpenClaw avec Extra Usage activée).

    Astuce : définissez un **modèle de repli** afin qu’OpenClaw puisse continuer à répondre lorsqu’un fournisseur est limité.
    Voir [Models](/cli/models), [OAuth](/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw possède un fournisseur intégré **Amazon Bedrock (Converse)**. Avec des marqueurs d’environnement AWS présents, OpenClaw peut découvrir automatiquement le catalogue Bedrock streaming/texte et le fusionner en tant que fournisseur implicite `amazon-bedrock` ; sinon vous pouvez explicitement activer `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuelle. Voir [Amazon Bedrock](/providers/bedrock) et [Model providers](/providers/models). Si vous préférez un flux de clé géré, un proxy compatible OpenAI devant Bedrock reste une option valide.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). L’onboarding peut exécuter le flux OAuth et définira le modèle par défaut sur `openai-codex/gpt-5.4` lorsque cela est approprié. Voir [Model providers](/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement OpenAI (Codex OAuth) ?">
    Oui. OpenClaw prend entièrement en charge **l’OAuth d’abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l’utilisation de l’OAuth d’abonnement dans des outils/workflows externes
    comme OpenClaw. L’onboarding peut exécuter le flux OAuth pour vous.

    Voir [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer Gemini CLI OAuth ?">
    Gemini CLI utilise un **flux d’authentification de plugin**, pas un identifiant client ou un secret dans `openclaw.json`.

    Étapes :

    1. Installez Gemini CLI localement pour que `gemini` soit dans le `PATH`
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le plugin : `openclaw plugins enable google`
    3. Connexion : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après connexion : `google-gemini-cli/gemini-3.1-pro-preview`
    5. Si les requêtes échouent, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte gateway

    Cela stocke les jetons OAuth dans les profils d’authentification sur l’hôte gateway. Détails : [Model providers](/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local est-il acceptable pour des conversations occasionnelles ?">
    Généralement non. OpenClaw a besoin d’un grand contexte + d’une forte sûreté ; les petites cartes tronquent et fuient. Si vous y tenez, exécutez le **plus gros** build de modèle possible en local (LM Studio) et consultez [/gateway/local-models](/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d’injection de prompt - voir [Security](/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic de modèle hébergé dans une région spécifique ?">
    Choisissez des points de terminaison épinglés à une région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour conserver les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté en utilisant `models.mode: "merge"` afin que les replis restent disponibles tout en respectant le fournisseur régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour installer cela ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif : certaines personnes
    en achètent un comme hôte toujours actif, mais un petit VPS, serveur domestique ou boîtier de classe Raspberry Pi fonctionne aussi.

    Vous n’avez besoin d’un Mac **que pour les outils réservés à macOS**. Pour iMessage, utilisez [BlueBubbles](/channels/bluebubbles) (recommandé) : le serveur BlueBubbles fonctionne sur n’importe quel Mac, et la Gateway peut s’exécuter sur Linux ou ailleurs. Si vous voulez d’autres outils réservés à macOS, exécutez la Gateway sur un Mac ou appairez un nœud macOS.

    Documentation : [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin d’**un appareil macOS** connecté à Messages. Cela ne doit **pas** être un Mac mini —
    n’importe quel Mac convient. **Utilisez [BlueBubbles](/channels/bluebubbles)** (recommandé) pour iMessage — le serveur BlueBubbles fonctionne sur macOS, tandis que la Gateway peut s’exécuter sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter la Gateway sur Linux/VPS, et exécuter le serveur BlueBubbles sur n’importe quel Mac connecté à Messages.
    - Exécuter l’ensemble sur le Mac si vous voulez la configuration mono-machine la plus simple.

    Documentation : [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
    [Mac remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter la Gateway**, et votre MacBook Pro peut se connecter comme
    **nœud** (appareil compagnon). Les nœuds n’exécutent pas la Gateway — ils fournissent des
    capacités supplémentaires comme l’écran/la caméra/le canvas et `system.run` sur cet appareil.

    Schéma courant :

    - Gateway sur le Mac mini (toujours actif).
    - Le MacBook Pro exécute l’app macOS ou un hôte de nœud et s’apparie à la Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Documentation : [Nodes](/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun est **non recommandé**. Nous constatons des bugs runtime, surtout avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez tout de même expérimenter avec Bun, faites-le sur une gateway non production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` correspond à **l’ID utilisateur Telegram humain de l’expéditeur** (numérique). Ce n’est pas le nom d’utilisateur du bot.

    L’onboarding accepte une entrée `@username` et la résout vers un ID numérique, mais l’autorisation OpenClaw utilise uniquement des IDs numériques.

    Plus sûr (sans bot tiers) :

    - Envoyez un message direct à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    API Bot officielle :

    - Envoyez un message direct à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un message direct à `@userinfobot` ou `@getidsbot`.

    Voir [/channels/telegram](/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un même numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Liez le **DM** WhatsApp de chaque expéditeur (pair `kind: "direct"`, E.164 de l’expéditeur comme `+15551234567`) à un `agentId` différent, afin que chaque personne ait son propre workspace et son propre magasin de sessions. Les réponses viennent tout de même du **même compte WhatsApp**, et le contrôle d’accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Voir [Multi-Agent Routing](/concepts/multi-agent) et [WhatsApp](/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent "chat rapide" et un agent "Opus pour le code" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis liez les routes entrantes (compte fournisseur ou pairs spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Multi-Agent Routing](/concepts/multi-agent). Voir aussi [Models](/concepts/models) et [Configuration](/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés via `brew` soient résolus dans les shells non login.
    Les versions récentes préfixent aussi des répertoires bin utilisateur courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation git hackable et npm install">
    - **Installation hackable (git)** : checkout complet des sources, modifiable, idéal pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger code/docs.
    - **npm install** : installation globale de la CLI, sans dépôt, idéale pour « simplement l’exécuter ».
      Les mises à jour viennent des dist-tags npm.

    Documentation : [Getting started](/fr/start/getting-started), [Updating](/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre installation npm et git ?">
    Oui. Installez l’autre variante, puis exécutez Doctor afin que le service gateway pointe vers le nouvel entrypoint.
    Cela **ne supprime pas vos données** — cela ne change que l’installation du code OpenClaw. Votre état
    (`~/.openclaw`) et votre workspace (`~/.openclaw/workspace`) restent intacts.

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

    Doctor détecte un décalage d’entrypoint du service gateway et propose de réécrire la configuration du service pour correspondre à l’installation actuelle (utilisez `--repair` en automatisation).

    Conseils de sauvegarde : voir [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter la Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24/7, utilisez un VPS**. Si vous voulez le
    moins de friction possible et que le sommeil/redémarrages ne vous dérangent pas, exécutez-la en local.

    **Ordinateur portable (Gateway locale)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible.
    - **Inconvénients :** sommeil/chutes réseau = déconnexions, mises à jour/redémarrages OS = interruptions, la machine doit rester éveillée.

    **VPS / cloud**

    - **Avantages :** toujours actif, réseau stable, pas de problèmes de sommeil de l’ordinateur portable, plus facile à maintenir en fonctionnement.
    - **Inconvénients :** souvent headless (utilisez des captures d’écran), accès aux fichiers uniquement à distance, vous devez vous connecter en SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous très bien depuis un VPS. Le seul vrai compromis est **navigateur headless** versus fenêtre visible. Voir [Browser](/tools/browser).

    **Valeur par défaut recommandée :** VPS si vous avez déjà eu des déconnexions de gateway. Le local est excellent quand vous utilisez activement le Mac et voulez l’accès aux fichiers locaux ou l’automatisation UI avec un navigateur visible.

  </Accordion>

  <Accordion title="À quel point est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours actif, moins d’interruptions dues au sommeil/redémarrages, permissions plus propres, plus facile à garder en marche.
    - **Ordinateur portable/de bureau partagé :** tout à fait acceptable pour les tests et l’usage actif, mais attendez-vous à des pauses quand la machine dort ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez la Gateway sur un hôte dédié et appairez votre ordinateur portable comme **nœud** pour les outils locaux d’écran/caméra/exec. Voir [Nodes](/nodes).
    Pour des conseils de sécurité, lisez [Security](/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et quel OS est recommandé ?">
    OpenClaw est léger. Pour une Gateway de base + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM, ~500MB de disque.
    - **Recommandé :** 1-2 vCPU, 2GB de RAM ou plus pour avoir de la marge (journaux, médias, canaux multiples). Les outils de nœud et l’automatisation du navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou n’importe quel Debian/Ubuntu moderne). C’est là que le chemin d’installation Linux est le mieux testé.

    Documentation : [Linux](/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles en sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours active, joignable et disposer d’assez
    de RAM pour la Gateway et les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM.
    - **Recommandé :** 2GB de RAM ou plus si vous exécutez plusieurs canaux, l’automatisation du navigateur ou des outils médias.
    - **OS :** Ubuntu LTS ou un autre Debian/Ubuntu moderne.

    Si vous êtes sous Windows, **WSL2 est la configuration de type VM la plus simple** et offre la meilleure
    compatibilité d’outils. Voir [Windows](/platforms/windows), [VPS hosting](/vps).
    Si vous exécutez macOS dans une VM, voir [macOS VM](/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, et des plugins de canal intégrés comme QQ Bot) et peut aussi faire de la voix + un Canvas live sur les plateformes prises en charge. La **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant puissant sur **votre propre matériel**, joignable depuis les applications de chat que vous utilisez déjà, avec
    des sessions stateful, de la mémoire et des outils — sans confier le contrôle de vos workflows à un
    SaaS hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez la Gateway où vous voulez (Mac, Linux, VPS) et gardez le
      workspace + l’historique des sessions en local.
    - **De vrais canaux, pas un sandbox web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus voix mobile et Canvas sur les plateformes prises en charge.
    - **Agnostique aux modèles :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec routage
      par agent et failover.
    - **Option purement locale :** exécutez des modèles locaux pour que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** agents séparés par canal, compte ou tâche, chacun avec son propre
      workspace et ses valeurs par défaut.
    - **Open source et hackable :** inspectez, étendez et auto-hébergez sans verrouillage fournisseur.

    Documentation : [Gateway](/gateway), [Channels](/channels), [Multi-agent](/concepts/multi-agent),
    [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de le configurer — que devrais-je faire en premier ?">
    Bons premiers projets :

    - Construire un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, plan API).
    - Organiser fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser résumés ou suivis.

    Il peut gérer de grosses tâches, mais cela fonctionne mieux lorsque vous les découpez en phases et
    utilisez des sous-agents pour le travail en parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq cas d’usage quotidiens les plus utiles pour OpenClaw ?">
    Les gains quotidiens ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de la boîte de réception, du calendrier et des actualités qui vous importent.
    - **Recherche et rédaction :** recherche rapide, résumés et premières ébauches pour les e-mails ou documents.
    - **Rappels et suivis :** nudges et checklists pilotés par cron ou heartbeat.
    - **Automatisation du navigateur :** remplir des formulaires, collecter des données et répéter des tâches web.
    - **Coordination entre appareils :** envoyez une tâche depuis votre téléphone, laissez la Gateway l’exécuter sur un serveur et recevez le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider pour la génération de leads, la prospection, les pubs et les blogs pour un SaaS ?">
    Oui pour la **recherche, la qualification et la rédaction**. Il peut analyser des sites, construire des shortlists,
    résumer des prospects et écrire des brouillons d’outreach ou de textes publicitaires.

    Pour **l’outreach ou les campagnes publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et relisez tout avant l’envoi. Le modèle le plus sûr est de laisser
    OpenClaw rédiger, puis de valider.

    Documentation : [Security](/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès multi-appareils et une orchestration d’outils.

    Avantages :

    - **Mémoire persistante + workspace** entre les sessions
    - **Accès multi-plateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours active** (exécutez-la sur un VPS, interagissez depuis n’importe où)
    - **Nœuds** pour navigateur/écran/caméra/exec locaux

    Vitrine : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser les Skills sans garder le dépôt modifié ?">
    Utilisez des surcharges gérées au lieu de modifier la copie du dépôt. Placez vos changements dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). L’ordre de priorité est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégrées → `skills.load.extraDirs`, donc les surcharges gérées l’emportent toujours sur les Skills intégrées sans toucher à git. Si vous avez besoin d’une Skill installée globalement mais visible uniquement par certains agents, gardez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes de remonter en amont devraient vivre dans le dépôt et partir en PR.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus basse). La priorité par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → intégrées → `skills.load.extraDirs`. `clawhub` installe par défaut dans `./skills`, qu’OpenClaw traite comme `<workspace>/skills` à la prochaine session. Si la Skill ne doit être visible que par certains agents, associez cela à `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les schémas pris en charge sont :

    - **Tâches cron** : les tâches isolées peuvent définir une surcharge `model` par tâche.
    - **Sous-agents** : routez les tâches vers des agents séparés avec des modèles par défaut différents.
    - **Changement à la demande** : utilisez `/model` pour changer le modèle de la session courante à tout moment.

    Voir [Cron jobs](/automation/cron-jobs), [Multi-Agent Routing](/concepts/multi-agent), et [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un gros travail. Comment déporter cela ?">
    Utilisez des **sous-agents** pour les tâches longues ou parallèles. Les sous-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « lancer un sous-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que la Gateway fait actuellement (et si elle est occupée).

    Astuce coût en jetons : les tâches longues et les sous-agents consomment tous deux des jetons. Si le coût est un sujet, définissez un
    modèle moins cher pour les sous-agents via `agents.defaults.subagents.model`.

    Documentation : [Sub-agents](/tools/subagents), [Background Tasks](/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de sous-agents liées à un fil sur Discord ?">
    Utilisez des liaisons de fil. Vous pouvez lier un fil Discord à un sous-agent ou à une cible de session afin que les messages suivants dans ce fil restent sur cette session liée.

    Flux de base :

    - Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état des liaisons.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler l’auto-unfocus.
    - Utilisez `/unfocus` pour détacher le fil.

    Configuration requise :

    - Valeurs globales : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Surcharges Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique au lancement : définissez `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentation : [Sub-agents](/tools/subagents), [Discord](/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sous-agent s’est terminé, mais la mise à jour de fin est arrivée au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route résolue du demandeur :

    - La remise de sous-agent en mode completion privilégie toute route de fil ou de conversation liée lorsqu’elle existe.
    - Si l’origine de completion ne porte qu’un canal, OpenClaw se replie sur la route stockée de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la remise directe puisse quand même réussir.
    - Si ni une route liée ni une route stockée exploitable n’existent, la remise directe peut échouer et le résultat se replie sur la remise de session en file d’attente au lieu d’être publié immédiatement dans le chat.
    - Des cibles invalides ou obsolètes peuvent tout de même forcer le repli vers la file d’attente ou un échec de remise final.
    - Si la dernière réponse visible de l’assistant enfant est exactement le jeton silencieux `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime intentionnellement l’annonce au lieu de publier une progression antérieure obsolète.
    - Si l’enfant a expiré après uniquement des appels d’outils, l’annonce peut réduire cela à un court résumé d’avancement partiel au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Sub-agents](/tools/subagents), [Background Tasks](/automation/tasks), [Session Tools](/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus Gateway. Si la Gateway ne tourne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de vérification :

    - Confirmez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que la Gateway tourne 24/7 (pas de sommeil/redémarrages).
    - Vérifiez les paramètres de fuseau horaire du job (`--tz` vs fuseau horaire de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentation : [Cron jobs](/automation/cron-jobs), [Automation & Tasks](/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de remise :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun message externe n’est attendu.
    - Une cible d’annonce manquante ou invalide (`channel` / `to`) signifie que l’exécuteur a ignoré la remise sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que l’exécuteur a essayé de remettre, mais que les identifiants l’ont bloqué.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non livrable, donc l’exécuteur supprime aussi la remise de repli en file d’attente.

    Pour les tâches cron isolées, l’exécuteur possède la remise finale. L’agent est censé
    retourner un résumé en texte brut que l’exécuteur enverra. `--no-deliver` garde
    ce résultat en interne ; cela ne permet pas à l’agent d’envoyer directement avec l’outil
    de message à la place.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Cron jobs](/automation/cron-jobs), [Background Tasks](/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de changement de modèle live, pas d’une planification dupliquée.

    Le cron isolé peut persister un transfert de modèle runtime et réessayer lorsque l’exécution active
    lève `LiveSessionModelSwitchError`. La nouvelle tentative conserve le
    fournisseur/modèle changé, et si le changement transportait une nouvelle surcharge de profil d’authentification, cron
    la persiste aussi avant de réessayer.

    Règles de sélection liées :

    - La surcharge de modèle du hook Gmail gagne en premier lorsque applicable.
    - Puis `model` par tâche.
    - Puis toute surcharge de modèle de session cron stockée.
    - Puis la sélection normale de modèle agent/par défaut.

    La boucle de nouvelle tentative est bornée. Après la tentative initiale plus 2 nouvelles tentatives de changement,
    cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentation : [Cron jobs](/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Comment installer des Skills sur Linux ?">
    Utilisez les commandes natives `openclaw skills` ou déposez des Skills dans votre workspace. L’UI Skills macOS n’est pas disponible sur Linux.
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

    `openclaw skills install` natif écrit dans le répertoire actif `skills/` du workspace. Installez la CLI séparée `clawhub` uniquement si vous voulez publier ou synchroniser vos propres Skills. Pour des installations partagées entre agents, placez la Skill sous `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou `agents.list[].skills` si vous voulez restreindre les agents qui peuvent la voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches à un horaire donné ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur Gateway :

    - **Tâches cron** pour les tâches planifiées ou récurrentes (persistent aux redémarrages).
    - **Heartbeat** pour des vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour des agents autonomes qui publient des résumés ou remettent aux chats.

    Documentation : [Cron jobs](/automation/cron-jobs), [Automation & Tasks](/automation),
    [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter des Skills Apple réservées à macOS depuis Linux ?">
    Pas directement. Les Skills macOS sont contrôlées par `metadata.openclaw.os` ainsi que les binaires requis, et les Skills n’apparaissent dans le prompt système que lorsqu’elles sont éligibles sur l’**hôte Gateway**. Sous Linux, les Skills réservées à `darwin` (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas à moins de surcharger ce filtrage.

    Vous avez trois schémas pris en charge :

    **Option A - exécuter la Gateway sur un Mac (le plus simple).**
    Exécutez la Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement parce que l’hôte Gateway est macOS.

    **Option B - utiliser un nœud macOS (sans SSH).**
    Exécutez la Gateway sur Linux, appairez un nœud macOS (app de barre de menus), et définissez **Node Run Commands** sur « Always Ask » ou « Always Allow » sur le Mac. OpenClaw peut traiter les Skills réservées à macOS comme éligibles lorsque les binaires requis existent sur le nœud. L’agent exécute alors ces Skills via l’outil `nodes`. Si vous choisissez « Always Ask », approuver « Always Allow » dans l’invite ajoute cette commande à la liste d’autorisation.

    **Option C - proxifier les binaires macOS via SSH (avancé).**
    Gardez la Gateway sur Linux, mais faites en sorte que les binaires CLI requis se résolvent vers des wrappers SSH qui s’exécutent sur un Mac. Ensuite, surchargez la Skill pour autoriser Linux afin qu’elle reste éligible.

    1. Créez un wrapper SSH pour le binaire (exemple : `memo` pour Apple Notes) :

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Placez le wrapper dans le `PATH` sur l’hôte Linux (par exemple `~/bin/memo`).
    3. Surchargez les métadonnées de la Skill (workspace ou `~/.openclaw/skills`) pour autoriser Linux :

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Démarrez une nouvelle session afin que l’instantané des Skills soit rafraîchi.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / plugin personnalisé** : meilleur choix pour un accès API fiable (Notion/HeyGen ont tous deux des API).
    - **Automatisation du navigateur** : fonctionne sans code mais c’est plus lent et plus fragile.

    Si vous voulez garder du contexte par client (workflows d’agence), un schéma simple est :

    - Une page Notion par client (contexte + préférences + travail en cours).
    - Demander à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou créez une Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives arrivent dans le répertoire actif `skills/` du workspace. Pour des Skills partagées entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certaines Skills attendent des binaires installés via Homebrew ; sous Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Voir [Skills](/tools/skills), [Skills config](/tools/skills-config), et [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome déjà connecté avec OpenClaw ?">
    Utilisez le profil de navigateur intégré `user`, qui se rattache via Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si vous voulez un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ce chemin est local à l’hôte. Si la Gateway s’exécute ailleurs, exécutez soit un hôte de nœud sur la machine du navigateur, soit utilisez CDP distant à la place.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par ref, pas par sélecteur CSS
    - les uploads nécessitent `ref` / `inputRef` et prennent actuellement en charge un seul fichier à la fois
    - `responsebody`, l’export PDF, l’interception de téléchargement et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Sandboxing et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée au sandboxing ?">
    Oui. Voir [Sandboxing](/gateway/sandboxing). Pour la configuration spécifique à Docker (gateway complète dans Docker ou images sandbox), voir [Docker](/install/docker).
  </Accordion>

  <Accordion title="Docker semble limité - comment activer les fonctionnalités complètes ?">
    L’image par défaut privilégie la sécurité et s’exécute en tant qu’utilisateur `node`, donc elle n’inclut
    pas les paquets système, Homebrew ni les navigateurs intégrés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` pour que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via la CLI intégrée :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que ce chemin est persistant.

    Documentation : [Docker](/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les DMs personnels mais rendre les groupes publics/sandboxés avec un seul agent ?">
    Oui — si votre trafic privé est en **DMs** et votre trafic public en **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans Docker, tandis que la session DM principale reste sur l’hôte. Restreignez ensuite les outils disponibles dans les sessions sandboxées via `tools.sandbox.tools`.

    Procédure + exemple de configuration : [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Gateway configuration](/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment lier un dossier hôte dans le sandbox ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par ex. `"/home/user/src:/src:ro"`). Les binds globaux + par agent fusionnent ; les binds par agent sont ignorés lorsque `scope: "shared"`. Utilisez `:ro` pour tout ce qui est sensible et rappelez-vous que les binds contournent les barrières du système de fichiers du sandbox.

    OpenClaw valide les sources de bind à la fois par rapport au chemin normalisé et au chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements via parent symlink échouent quand même en mode fermé même lorsque le dernier segment du chemin n’existe pas encore, et que les vérifications de racines autorisées s’appliquent toujours après résolution des symlinks.

    Voir [Sandboxing](/gateway/sandboxing#custom-bind-mounts) et [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire OpenClaw n’est qu’un ensemble de fichiers Markdown dans le workspace de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes de long terme sélectionnées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi un **flush mémoire silencieux avant compactage** pour rappeler au modèle
    d’écrire des notes durables avant l’auto-compaction. Cela ne s’exécute que lorsque le workspace
    est accessible en écriture (les sandboxes en lecture seule l’ignorent). Voir [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire oublie constamment des choses. Comment faire en sorte que cela reste ?">
    Demandez au bot **d’écrire l’information dans la mémoire**. Les notes de long terme appartiennent à `MEMORY.md`,
    le contexte de court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker des souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que la Gateway utilise le même
    workspace à chaque exécution.

    Documentation : [Memory](/concepts/memory), [Agent workspace](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle pour toujours ? Quelles sont les limites ?">
    Les fichiers mémoire vivent sur le disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste limité par la fenêtre de contexte du modèle,
    donc les longues conversations peuvent être compactées ou tronquées. C’est pourquoi
    la recherche mémoire existe — elle ne ramène dans le contexte que les parties pertinentes.

    Documentation : [Memory](/concepts/memory), [Context](/concepts/context).

  </Accordion>

  <Accordion title="La recherche mémoire sémantique nécessite-t-elle une clé API OpenAI ?">
    Seulement si vous utilisez des **embeddings OpenAI**. L’OAuth Codex couvre le chat/les complétions et
    ne donne **pas** accès aux embeddings, donc **se connecter avec Codex (OAuth ou la
    connexion Codex CLI)** n’aide pas pour la recherche mémoire sémantique. Les embeddings OpenAI
    exigent toujours une vraie clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement un fournisseur, OpenClaw en sélectionne un automatiquement quand il
    peut résoudre une clé API (profils d’authentification, `models.providers.*.apiKey`, ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI se résout, sinon Gemini si une clé Gemini se
    résout, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche
    mémoire reste désactivée jusqu’à ce que vous la configuriez. Si vous avez configuré un chemin de modèle local
    et qu’il est présent, OpenClaw
    préfère `local`. Ollama est pris en charge lorsque vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama ou local** — voir [Memory](/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où se trouvent les choses sur le disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non — **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers mémoire, configuration et workspace vivent sur l’hôte Gateway
      (`~/.openclaw` + votre répertoire de workspace).
    - **Distant par nécessité :** les messages que vous envoyez aux fournisseurs de modèles (Anthropic/OpenAI/etc.) vont à
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données de message sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** utiliser des modèles locaux conserve les prompts sur votre machine, mais le trafic des canaux
      passe tout de même par les serveurs du canal.

    Voir aussi : [Agent workspace](/concepts/agent-workspace), [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout vit sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Path                                                            | Objectif                                                           |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configuration principale (JSON5)                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth hérité (copié dans les profils d’authentification à la première utilisation) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profils d’authentification (OAuth, clés API et `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile facultative de secrets basée sur fichier pour les fournisseurs SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité hérité (entrées statiques `api_key` nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État du fournisseur (par ex. `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin mono-agent hérité : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **workspace** (`AGENTS.md`, fichiers mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où doivent vivre AGENTS.md / SOUL.md / USER.md / MEMORY.md ?">
    Ces fichiers vivent dans le **workspace de l’agent**, pas dans `~/.openclaw`.

    - **Workspace (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou le repli hérité `memory.md` lorsque `MEMORY.md` est absent),
      `memory/YYYY-MM-DD.md`, et éventuellement `HEARTBEAT.md`.
    - **Répertoire d’état (`~/.openclaw`)** : configuration, état des canaux/fournisseurs, profils d’authentification, sessions, journaux,
      et Skills partagées (`~/.openclaw/skills`).

    Le workspace par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, confirmez que la Gateway utilise le même
    workspace à chaque lancement (et rappelez-vous : le mode distant utilise le workspace de l’**hôte gateway**,
    pas celui de votre ordinateur portable local).

    Astuce : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous reposer sur l’historique de chat.

    Voir [Agent workspace](/concepts/agent-workspace) et [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **workspace d’agent** dans un dépôt git **privé** et sauvegardez-le
    quelque part en privé (par exemple GitHub privé). Cela capture la mémoire + les fichiers AGENTS/SOUL/USER
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    Ne committez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrés).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément le workspace et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Documentation : [Agent workspace](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Voir le guide dédié : [Uninstall](/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils fonctionner en dehors du workspace ?">
    Oui. Le workspace est le **cwd par défaut** et l’ancre mémoire, pas un sandbox strict.
    Les chemins relatifs se résolvent dans le workspace, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte sauf si le sandboxing est activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/gateway/sandboxing) ou des paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, pointez le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que du code source ; gardez le
    workspace séparé sauf si vous voulez explicitement que l’agent travaille à l’intérieur.

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
    L’état des sessions appartient à l’**hôte gateway**. Si vous êtes en mode distant, le magasin de sessions qui vous intéresse se trouve sur la machine distante, pas sur votre ordinateur portable local. Voir [Session management](/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la configuration ? Où se trouve-t-elle ?">
    OpenClaw lit une configuration **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut raisonnablement sûres (y compris un workspace par défaut à `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’UI dit unauthorized'>
    Les liaisons non-loopback **exigent un chemin d’authentification gateway valide**. En pratique, cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un reverse proxy non-loopback avec reconnaissance d’identité correctement configuré

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

    - `gateway.remote.token` / `.password` n’activent pas à eux seuls l’authentification gateway locale.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez plutôt `gateway.auth.mode: "password"` ainsi que `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun repli distant ne masque le problème).
    - Les configurations Control UI par secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stockés dans les paramètres de l’app/de l’UI). Les modes à identité porteuse comme Tailscale Serve ou `trusted-proxy` utilisent des en-têtes de requête à la place. Évitez de mettre des secrets partagés dans les URLs.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les reverse proxies loopback sur le même hôte ne satisfont toujours **pas** l’authentification trusted-proxy. Le trusted proxy doit être une source non-loopback configurée.

  </Accordion>

  <Accordion title="Pourquoi ai-je besoin d’un jeton sur localhost maintenant ?">
    OpenClaw impose désormais l’authentification gateway par défaut, y compris en loopback. Dans le chemin normal par défaut, cela signifie l’authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage de la gateway se résout en mode jeton et en génère automatiquement un, enregistré dans `gateway.auth.token`, donc les **clients WS locaux doivent s’authentifier**. Cela bloque les autres processus locaux qui tenteraient d’appeler la Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez choisir explicitement le mode mot de passe (ou, pour des reverse proxies non-loopback avec reconnaissance d’identité, `trusted-proxy`). Si vous voulez **vraiment** un loopback ouvert, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir modifié la configuration ?">
    La Gateway surveille la configuration et prend en charge le hot-reload :

    - `gateway.reload.mode: "hybrid"` (par défaut) : applique à chaud les changements sûrs, redémarre pour les changements critiques
    - `hot`, `restart`, `off` sont aussi pris en charge

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

    - `off` : masque le slogan mais garde la ligne titre/version de la bannière.
    - `default` : utilise `All your chats, one OpenClaw.` à chaque fois.
    - `random` : slogans rotatifs amusants/de saison (comportement par défaut).
    - Si vous ne voulez aucune bannière, définissez l’env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer web search (et web fetch) ?">
    `web_fetch` fonctionne sans clé API. `web_search` dépend du fournisseur
    sélectionné :

    - Les fournisseurs basés sur API tels que Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration normale de clé API.
    - Ollama Web Search ne requiert pas de clé, mais utilise votre hôte Ollama configuré et nécessite `ollama signin`.
    - DuckDuckGo ne requiert pas de clé, mais c’est une intégration non officielle basée sur HTML.
    - SearXNG ne requiert pas de clé / est auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un fournisseur.
    Alternatives via variables d’environnement :

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

    La configuration spécifique au fournisseur de web-search vit désormais sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore temporairement pour compatibilité, mais ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli web-fetch Firecrawl vit sous `plugins.entries.firecrawl.config.webFetch.*`.

    Remarques :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf désactivation explicite).
    - Si `tools.web.fetch.provider` est omis, OpenClaw détecte automatiquement le premier fournisseur de repli fetch prêt à partir des identifiants disponibles. Aujourd’hui, le fournisseur intégré est Firecrawl.
    - Les daemons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou l’environnement du service).

    Documentation : [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma configuration. Comment récupérer et éviter cela ?">
    `config.apply` remplace la **configuration entière**. Si vous envoyez un objet partiel, tout le
    reste est supprimé.

    Récupération :

    - Restaurez depuis une sauvegarde (git ou une copie de `~/.openclaw/openclaw.json`).
    - Si vous n’avez pas de sauvegarde, relancez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si c’était inattendu, ouvrez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des journaux ou de l’historique.

    Pour éviter cela :

    - Utilisez `openclaw config set` pour les petits changements.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` lorsque vous n’êtes pas sûr du chemin exact ou de la forme d’un champ ; cela retourne un nœud de schéma peu profond ainsi que des résumés immédiats des enfants pour approfondir.
    - Utilisez `config.patch` pour les modifications RPC partielles ; gardez `config.apply` pour le remplacement complet de configuration uniquement.
    - Si vous utilisez l’outil réservé au propriétaire `gateway` depuis une exécution d’agent, il refusera toujours les écritures sur `tools.exec.ask` / `tools.exec.security` (y compris les alias hérités `tools.bash.*` qui se normalisent vers ces mêmes chemins exec protégés).

    Documentation : [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter une Gateway centrale avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant est **une Gateway** (par ex. Raspberry Pi) plus des **nœuds** et des **agents** :

    - **Gateway (centrale)** : possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nœuds (appareils)** : Mac/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers)** : cerveaux/workspaces séparés pour des rôles spécialisés (par ex. « Hetzner ops », « Personal data »).
    - **Sous-agents** : lancent du travail en arrière-plan depuis un agent principal lorsque vous voulez du parallélisme.
    - **TUI** : se connecte à la Gateway et permet de changer d’agents/sessions.

    Documentation : [Nodes](/nodes), [Remote access](/gateway/remote), [Multi-Agent Routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il fonctionner en headless ?">
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

    La valeur par défaut est `false` (headful). Le headless déclenche plus facilement des contrôles anti-bot sur certains sites. Voir [Browser](/tools/browser).

    Le headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Pas de fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts à l’égard de l’automatisation en mode headless (CAPTCHAs, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour le contrôle du navigateur ?">
    Définissez `browser.executablePath` sur votre binaire Brave (ou tout autre navigateur basé sur Chromium) et redémarrez la Gateway.
    Voir les exemples complets de configuration dans [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distantes et nœuds

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, la gateway et les nœuds ?">
    Les messages Telegram sont gérés par la **gateway**. La gateway exécute l’agent et
    ce n’est qu’ensuite qu’elle appelle les nœuds via le **WebSocket Gateway** lorsqu’un outil de nœud est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Nœud → Gateway → Telegram

    Les nœuds ne voient pas le trafic fournisseur entrant ; ils ne reçoivent que les appels RPC de nœud.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si la Gateway est hébergée à distance ?">
    Réponse courte : **appariez votre ordinateur comme nœud**. La Gateway s’exécute ailleurs, mais elle peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via le WebSocket Gateway.

    Configuration typique :

    1. Exécutez la Gateway sur l’hôte toujours actif (VPS/serveur maison).
    2. Placez l’hôte Gateway + votre ordinateur sur le même tailnet.
    3. Assurez-vous que le WS Gateway est joignable (liaison tailnet ou tunnel SSH).
    4. Ouvrez l’app macOS localement et connectez-vous en mode **Remote over SSH** (ou en tailnet direct)
       afin qu’elle puisse s’enregistrer comme nœud.
    5. Approuvez le nœud sur la Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nœuds se connectent via le WebSocket Gateway.

    Rappel de sécurité : appairer un nœud macOS permet `system.run` sur cette machine. N’appairez
    que des appareils de confiance, et consultez [Security](/gateway/security).

    Documentation : [Nodes](/nodes), [Gateway protocol](/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté mais je n’ai aucune réponse. Que faire ?">
    Vérifiez l’essentiel :

    - La gateway fonctionne : `openclaw gateway status`
    - Santé de la gateway : `openclaw status`
    - Santé des canaux : `openclaw channels status`

    Ensuite, vérifiez l’authentification et le routage :

    - Si vous utilisez Tailscale Serve, assurez-vous que `gateway.auth.allowTailscale` est défini correctement.
    - Si vous vous connectez via un tunnel SSH, confirmez que le tunnel local est actif et pointe vers le bon port.
    - Confirmez que vos listes d’autorisation (DM ou groupe) incluent votre compte.

    Documentation : [Tailscale](/gateway/tailscale), [Remote access](/gateway/remote), [Channels](/channels).

  </Accordion>

  <Accordion title="Deux instances OpenClaw peuvent-elles se parler (local + VPS) ?">
    Oui. Il n’existe pas de pont « bot-to-bot » intégré, mais vous pouvez le câbler de plusieurs
    façons fiables :

    **Le plus simple :** utilisez un canal de chat normal auquel les deux bots ont accès (Telegram/Slack/WhatsApp).
    Faites envoyer un message par le Bot A au Bot B, puis laissez le Bot B répondre normalement.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant un chat où l’autre bot
    écoute. Si l’un des bots se trouve sur un VPS distant, pointez votre CLI vers cette Gateway distante
    via SSH/Tailscale (voir [Remote access](/gateway/remote)).

    Schéma d’exemple (à exécuter depuis une machine qui peut atteindre la Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Astuce : ajoutez une garde-fou pour que les deux bots ne bouclent pas indéfiniment (mention-only, listes d’autorisation de canaux, ou règle « ne pas répondre aux messages de bots »).

    Documentation : [Remote access](/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Une seule Gateway peut héberger plusieurs agents, chacun avec son propre workspace, ses valeurs de modèle par défaut
    et son routage. C’est la configuration normale et c’est beaucoup moins cher et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés uniquement lorsque vous avez besoin d’une isolation forte (frontières de sécurité) ou de configurations très
    différentes que vous ne voulez pas partager. Sinon, gardez une seule Gateway et
    utilisez plusieurs agents ou sous-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un nœud sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui — les nœuds sont le moyen de premier ordre pour atteindre votre ordinateur portable depuis une Gateway distante, et ils
    débloquent plus qu’un simple accès shell. La Gateway s’exécute sur macOS/Linux (Windows via WSL2) et est
    légère (un petit VPS ou une machine de classe Raspberry Pi suffit ; 4 GB de RAM sont largement suffisants), donc une configuration
    courante est un hôte toujours actif plus votre ordinateur portable comme nœud.

    - **Pas de SSH entrant requis.** Les nœuds se connectent vers l’extérieur au WebSocket Gateway et utilisent l’appairage d’appareil.
    - **Contrôles d’exécution plus sûrs.** `system.run` est protégé par des listes d’autorisation/approbations de nœud sur cet ordinateur portable.
    - **Plus d’outils d’appareil.** Les nœuds exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation locale du navigateur.** Gardez la Gateway sur un VPS, mais exécutez Chrome localement via un hôte de nœud sur l’ordinateur portable, ou rattachez-vous à Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nœuds sont plus simples pour les workflows continus d’agent et
    l’automatisation d’appareil.

    Documentation : [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Les nœuds exécutent-ils un service gateway ?">
    Non. Une seule **gateway** devrait s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Multiple gateways](/gateway/multiple-gateways)). Les nœuds sont des périphériques qui se connectent
    à la gateway (nœuds iOS/Android, ou « mode nœud » macOS dans l’app de barre de menus). Pour les hôtes de nœud headless
    et le contrôle CLI, voir [Node host CLI](/cli/node).

    Un redémarrage complet est requis pour les changements `gateway`, `discovery` et `canvasHost`.

  </Accordion>

  <Accordion title="Existe-t-il une méthode API / RPC pour appliquer la configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma peu profond, l’indice UI correspondant et les résumés immédiats des enfants avant écriture
    - `config.get` : récupérer l’instantané actuel + son hash
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC)
    - `config.apply` : valider + remplacer la configuration complète, puis redémarrer
    - L’outil runtime `gateway`, réservé au propriétaire, refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les alias hérités `tools.bash.*` se normalisent vers les mêmes chemins exec protégés

  </Accordion>

  <Accordion title="Configuration minimale saine pour une première installation">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Cela définit votre workspace et restreint qui peut déclencher le bot.

  </Accordion>

  <Accordion title="Comment configurer Tailscale sur un VPS et se connecter depuis mon Mac ?">
    Étapes minimales :

    1. **Installer + se connecter sur le VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installer + se connecter sur votre Mac**
       - Utilisez l’app Tailscale et connectez-vous au même tailnet.
    3. **Activer MagicDNS (recommandé)**
       - Dans la console d’administration Tailscale, activez MagicDNS afin que le VPS ait un nom stable.
    4. **Utiliser le nom d’hôte tailnet**
       - SSH : `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS : `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Si vous voulez l’interface Control sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde la gateway liée au loopback et expose HTTPS via Tailscale. Voir [Tailscale](/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un nœud Mac à une Gateway distante (Tailscale Serve) ?">
    Serve expose **Control UI + le WS Gateway**. Les nœuds se connectent via le même point de terminaison WS Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’app macOS en mode Remote** (la cible SSH peut être le nom d’hôte tailnet).
       L’app tunnelisera le port Gateway et se connectera comme nœud.
    3. **Approuvez le nœud** sur la gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentation : [Gateway protocol](/gateway/protocol), [Discovery](/gateway/discovery), [macOS remote mode](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un second ordinateur portable ou simplement ajouter un nœud ?">
    Si vous n’avez besoin que d’**outils locaux** (écran/caméra/exec) sur le second ordinateur portable, ajoutez-le comme
    **nœud**. Cela conserve une seule Gateway et évite de dupliquer la configuration. Les outils de nœud locaux sont
    actuellement réservés à macOS, mais nous prévoyons de les étendre à d’autres OS.

    Installez une seconde Gateway seulement lorsque vous avez besoin d’une **isolation forte** ou de deux bots complètement séparés.

    Documentation : [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement depuis le processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail courant
    - un `.env` global de repli depuis `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Aucun des fichiers `.env` ne remplace les variables d’environnement existantes.

    Vous pouvez aussi définir des variables d’environnement inline dans la configuration (appliquées seulement si elles sont absentes de l’environnement du processus) :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Voir [/environment](/help/environment) pour la priorité complète et les sources.

  </Accordion>

  <Accordion title="J’ai démarré la Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux correctifs courants :

    1. Mettez les clés manquantes dans `~/.openclaw/.env` pour qu’elles soient prises en compte même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’import du shell (commodité opt-in) :

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

    Cela exécute votre shell de login et importe uniquement les clés attendues manquantes (ne remplace jamais). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais models status affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si **l’import d’environnement shell** est activé. « Shell env: off »
    ne signifie **pas** que vos variables d’environnement sont absentes — cela signifie juste qu’OpenClaw ne chargera
    pas automatiquement votre shell de login.

    Si la Gateway s’exécute comme service (launchd/systemd), elle n’héritera pas de votre shell
    environnement. Corrigez cela de l’une de ces façons :

    1. Mettez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import du shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le à votre bloc `env` de configuration (appliqué uniquement s’il manque).

    Puis redémarrez la gateway et revérifiez :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (ainsi que `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/concepts/model-providers) et [/environment](/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et plusieurs chats

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Session management](/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais cela est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration sur inactivité. Lorsqu’elle est activée, le **message suivant**
    après la période d’inactivité démarre un nouvel id de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions — cela démarre simplement une nouvelle session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Y a-t-il un moyen de créer une équipe d’instances OpenClaw (un CEO et plusieurs agents) ?">
    Oui, via le **routage multi-agent** et les **sous-agents**. Vous pouvez créer un agent coordinateur
    et plusieurs agents workers avec leurs propres workspaces et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. C’est coûteux en jetons et souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    imaginons est un seul bot avec lequel vous discutez, avec différentes sessions pour le travail parallèle. Ce
    bot peut aussi lancer des sous-agents lorsque c’est nécessaire.

    Documentation : [Multi-agent routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué au milieu d’une tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Des chats longs, de grosses sorties d’outils ou de nombreux
    fichiers peuvent déclencher une compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` lorsque vous changez de sujet.
    - Gardez le contexte important dans le workspace et demandez au bot de le relire.
    - Utilisez des sous-agents pour les tâches longues ou parallèles afin que le chat principal reste plus petit.
    - Choisissez un modèle avec une fenêtre de contexte plus grande si cela arrive souvent.

  </Accordion>

  <Accordion title="Comment réinitialiser complètement OpenClaw tout en le gardant installé ?">
    Utilisez la commande reset :

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
    - Réinitialisation dev : `openclaw gateway --dev --reset` (dev uniquement ; efface la configuration dev + identifiants + sessions + workspace).

  </Accordion>

  <Accordion title='J’obtiens des erreurs "context too large" - comment réinitialiser ou compacter ?'>
    Utilisez l’une de ces options :

    - **Compacter** (conserve la conversation mais résume les tours plus anciens) :

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

    - Activez ou ajustez **l’élagage de session** (`agents.defaults.contextPruning`) pour couper les anciennes sorties d’outils.
    - Utilisez un modèle avec une plus grande fenêtre de contexte.

    Documentation : [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning), [Session management](/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi est-ce que je vois "LLM request rejected: messages.content.tool_use.input field required" ?'>
    C’est une erreur de validation du fournisseur : le modèle a émis un bloc `tool_use` sans
    l’`input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou un changement d’outil/schéma).

    Correctif : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi reçois-je des messages heartbeat toutes les 30 minutes ?">
    Les heartbeats s’exécutent toutes les **30m** par défaut (**1h** avec l’authentification OAuth). Ajustez ou désactivez-les :

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

    Si `HEARTBEAT.md` existe mais est effectivement vide (seulement des lignes vides et des
    en-têtes markdown comme `# Heading`), OpenClaw ignore l’exécution heartbeat pour économiser les appels API.
    Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les surcharges par agent utilisent `agents.list[].heartbeat`. Documentation : [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses de groupe sont bloquées tant que vous n’autorisez pas des expéditeurs (`groupPolicy: "allowlist"`).

    Si vous voulez que **vous seul** puissiez déclencher des réponses de groupe :

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

    Option 2 (si déjà configuré / sur liste d’autorisation) : lister les groupes depuis la configuration :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentation : [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes courantes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mention le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas dans la liste d’autorisation.

    Voir [Groups](/channels/groups) et [Group messages](/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/fils partagent-ils le contexte avec les DMs ?">
    Les chats directs sont regroupés dans la session principale par défaut. Les groupes/canaux ont leurs propres clés de session, et les topics Telegram / fils Discord sont des sessions séparées. Voir [Groups](/channels/groups) et [Group messages](/channels/group-messages).
  </Accordion>

  <Accordion title="Combien de workspaces et d’agents puis-je créer ?">
    Pas de limite stricte. Des dizaines (voire des centaines) conviennent, mais surveillez :

    - **Croissance disque :** sessions + transcriptions vivent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en jetons :** plus d’agents signifie plus d’utilisation concurrente du modèle.
    - **Surcharge opérationnelle :** profils d’authentification, workspaces et routage de canaux par agent.

    Conseils :

    - Gardez un workspace **actif** par agent (`agents.defaults.workspace`).
    - Élaguez les anciennes sessions (supprimez les JSONL ou les entrées de magasin) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les workspaces parasites et les décalages de profils.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou chats en même temps (Slack), et comment dois-je m’y prendre ?">
    Oui. Utilisez **Multi-Agent Routing** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/pair. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L’accès au navigateur est puissant mais pas « faire tout ce qu’un humain peut faire » — l’anti-bot, les CAPTCHAs et la MFA peuvent
    toujours bloquer l’automatisation. Pour le contrôle navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours actif (VPS/Mac mini).
    - Un agent par rôle (bindings).
    - Canal/canaux Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un nœud si nécessaire.

    Documentation : [Multi-Agent Routing](/concepts/multi-agent), [Slack](/channels/slack),
    [Browser](/tools/browser), [Nodes](/nodes).

  </Accordion>
</AccordionGroup>

## Modèles : valeurs par défaut, sélection, alias, changement

<AccordionGroup>
  <Accordion title='Qu’est-ce que le "modèle par défaut" ?'>
    Le modèle par défaut d’OpenClaw est tout simplement celui que vous définissez comme :

    ```
    agents.defaults.model.primary
    ```

    Les modèles sont référencés sous la forme `provider/model` (exemple : `openai/gpt-5.4`). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet ID de modèle exact, et ce n’est qu’ensuite qu’il se replie sur le fournisseur par défaut configuré comme chemin de compatibilité déprécié. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se replie sur le premier couple fournisseur/modèle configuré au lieu d’exposer un ancien défaut de fournisseur supprimé. Vous devriez quand même **définir explicitement** `provider/model`.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    **Valeur par défaut recommandée :** utilisez le modèle de dernière génération le plus puissant disponible dans votre pile fournisseur.
    **Pour les agents avec outils activés ou des entrées non fiables :** privilégiez la qualité du modèle au coût.
    **Pour les chats de routine / à faible enjeu :** utilisez des modèles de repli moins chers et routez par rôle d’agent.

    MiniMax a sa propre documentation : [MiniMax](/providers/minimax) et
    [Local models](/gateway/local-models).

    Règle empirique : utilisez le **meilleur modèle que vous pouvez vous permettre** pour le travail à forts enjeux, et un modèle moins cher
    pour le chat de routine ou les résumés. Vous pouvez router les modèles par agent et utiliser des sous-agents pour
    paralléliser les longues tâches (chaque sous-agent consomme des jetons). Voir [Models](/concepts/models) et
    [Sub-agents](/tools/subagents).

    Avertissement fort : les modèles plus faibles / trop quantifiés sont plus vulnérables aux injections de prompt et aux comportements dangereux. Voir [Security](/gateway/security).

    Plus de contexte : [Models](/concepts/models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Utilisez les **commandes de modèle** ou modifiez uniquement les champs **model**. Évitez les remplacements complets de configuration.

    Options sûres :

    - `/model` dans le chat (rapide, par session)
    - `openclaw models set ...` (met à jour uniquement la configuration modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Évitez `config.apply` avec un objet partiel à moins d’avoir l’intention de remplacer toute la configuration.
    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` et préférez `config.patch`. La charge utile lookup vous donne le chemin normalisé, la documentation/les contraintes du schéma peu profond et les résumés immédiats des enfants.
    pour les mises à jour partielles.
    Si vous avez écrasé la configuration, restaurez depuis une sauvegarde ou relancez `openclaw doctor` pour réparer.

    Documentation : [Models](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui. Ollama est le chemin le plus simple pour les modèles locaux.

    Configuration la plus rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Téléchargez un modèle local comme `ollama pull glm-4.7-flash`
    3. Si vous voulez aussi des modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard` et choisissez `Ollama`
    5. Choisissez `Local` ou `Cloud + Local`

    Remarques :

    - `Cloud + Local` vous donne des modèles cloud plus vos modèles Ollama locaux
    - les modèles cloud comme `kimi-k2.5:cloud` n’ont pas besoin d’un pull local
    - pour changer manuellement, utilisez `openclaw models list` et `openclaw models set ollama/<model>`

    Remarque de sécurité : les modèles plus petits ou fortement quantifiés sont plus vulnérables à l’injection de prompt. Nous recommandons fortement les **gros modèles** pour tout bot pouvant utiliser des outils.
    Si vous voulez tout de même des petits modèles, activez le sandboxing et des listes d’autorisation d’outils strictes.

    Documentation : [Ollama](/providers/ollama), [Local models](/gateway/local-models),
    [Model providers](/concepts/model-providers), [Security](/gateway/security),
    [Sandboxing](/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quels modèles utilisent OpenClaw, Flawd et Krill ?">
    - Ces déploiements peuvent différer et changer avec le temps ; il n’existe pas de recommandation fixe de fournisseur.
    - Vérifiez le paramètre runtime actuel sur chaque gateway avec `openclaw models status`.
    - Pour les agents sensibles à la sécurité / avec outils activés, utilisez le modèle de dernière génération le plus puissant disponible.
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

    Astuce : `/model status` affiche quel agent est actif, quel fichier `auth-profiles.json` est utilisé et quel profil d’authentification sera essayé ensuite.
    Il affiche aussi le point de terminaison du fournisseur (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

    **Comment retirer l’épingle d’un profil défini avec @profile ?**

    Relancez `/model` **sans** le suffixe `@profile` :

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si vous voulez revenir à la valeur par défaut, choisissez-la depuis `/model` (ou envoyez `/model <provider/model par défaut>`).
    Utilisez `/model status` pour confirmer quel profil d’authentification est actif.

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.2 pour les tâches quotidiennes et Codex 5.3 pour le code ?">
    Oui. Définissez l’un comme valeur par défaut et changez selon les besoins :

    - **Changement rapide (par session) :** `/model gpt-5.4` pour les tâches quotidiennes, `/model openai-codex/gpt-5.4` pour coder avec Codex OAuth.
    - **Défaut + changement :** définissez `agents.defaults.model.primary` sur `openai/gpt-5.4`, puis passez à `openai-codex/gpt-5.4` quand vous codez (ou l’inverse).
    - **Sous-agents :** routez les tâches de code vers des sous-agents avec un modèle par défaut différent.

    Voir [Models](/concepts/models) et [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title='Pourquoi vois-je "Model ... is not allowed" puis aucune réponse ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et toutes
    les surcharges de session. Choisir un modèle qui n’est pas dans cette liste renvoie :

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Cette erreur est renvoyée **à la place** d’une réponse normale. Correctif : ajoutez le modèle à
    `agents.defaults.models`, supprimez la liste d’autorisation ou choisissez un modèle depuis `/model list`.

  </Accordion>

  <Accordion title='Pourquoi vois-je "Unknown model: minimax/MiniMax-M2.7" ?'>
    Cela signifie que le **fournisseur n’est pas configuré** (aucune configuration de fournisseur MiniMax ni profil d’authentification
    n’a été trouvé), donc le modèle ne peut pas être résolu.

    Liste de vérification :

    1. Mettez à niveau vers une version actuelle d’OpenClaw (ou exécutez depuis les sources `main`), puis redémarrez la gateway.
    2. Assurez-vous que MiniMax est configuré (assistant ou JSON), ou qu’une auth
       MiniMax existe dans env/profils d’authentification afin que le fournisseur correspondant puisse être injecté
       (`MINIMAX_API_KEY` pour `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       stocké pour `minimax-portal`).
    3. Utilisez l’ID de modèle exact (sensible à la casse) pour votre chemin d’authentification :
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` pour une configuration
       par clé API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` pour une configuration OAuth.
    4. Exécutez :

       ```bash
       openclaw models list
       ```

       et choisissez dans la liste (ou `/model list` dans le chat).

    Voir [MiniMax](/providers/minimax) et [Models](/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax comme valeur par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez **MiniMax par défaut** et changez de modèle **par session** quand nécessaire.
    Les replis servent aux **erreurs**, pas aux « tâches difficiles », donc utilisez `/model` ou un agent séparé.

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

    Puis :

    ```
    /model gpt
    ```

    **Option B : agents séparés**

    - Agent A par défaut : MiniMax
    - Agent B par défaut : OpenAI
    - Routez par agent ou utilisez `/agent` pour changer

    Documentation : [Models](/concepts/models), [Multi-Agent Routing](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sont-ils des raccourcis intégrés ?">
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

  <Accordion title="Comment définir/surcharger des raccourcis de modèle (alias) ?">
    Les alias viennent de `agents.defaults.models.<modelId>.alias`. Exemple :

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

    Ensuite `/model sonnet` (ou `/<alias>` lorsque pris en charge) se résout en cet ID de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres fournisseurs comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement au jeton ; de nombreux modèles) :

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

    Si vous référencez un provider/model mais que la clé fournisseur requise est absente, vous obtiendrez une erreur runtime d’authentification (par exemple `No API key found for provider "zai"`).

    **No API key found for provider après ajout d’un nouvel agent**

    Cela signifie généralement que le **nouvel agent** possède un magasin d’authentification vide. L’authentification est par agent et
    stockée dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correctifs possibles :

    - Exécutez `openclaw agents add <id>` et configurez l’authentification durant l’assistant.
    - Ou copiez `auth-profiles.json` depuis le `agentDir` de l’agent principal vers le `agentDir` du nouvel agent.

    Ne réutilisez pas `agentDir` entre agents ; cela provoque des collisions d’authentification/session.

  </Accordion>
</AccordionGroup>

## Failover de modèle et "All models failed"

<AccordionGroup>
  <Accordion title="Comment fonctionne le failover ?">
    Le failover se produit en deux étapes :

    1. **Rotation de profil d’authentification** au sein d’un même fournisseur.
    2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

    Des cooldowns s’appliquent aux profils en échec (backoff exponentiel), de sorte qu’OpenClaw peut continuer à répondre même lorsqu’un fournisseur est limité ou temporairement en échec.

    Le bucket de limitation de débit inclut davantage que les simples réponses `429`. OpenClaw
    traite aussi des messages comme `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, et des limites périodiques
    de fenêtre d’usage (`weekly/monthly limit reached`) comme des limitations de débit dignes de failover.

    Certaines réponses qui ressemblent à de la facturation ne sont pas des `402`, et certaines réponses HTTP `402`
    restent aussi dans ce bucket transitoire. Si un fournisseur retourne un texte de facturation explicite sur
    `401` ou `403`, OpenClaw peut tout de même le garder dans la catégorie facturation, mais les correspondances de texte spécifiques au fournisseur restent limitées au fournisseur
    qui les possède (par exemple `Key limit exceeded` d’OpenRouter). Si à la place un message `402`
    ressemble à une fenêtre d’usage retentable ou à une
    limite de dépense d’organisation/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw le traite comme
    `rate_limit`, pas comme une longue désactivation de facturation.

    Les erreurs de dépassement de contexte sont différentes : des signatures comme
    `request_too_large`, `input exceeds the maximum number of tokens`,