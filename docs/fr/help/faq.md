---
read_when:
    - Répondre aux questions courantes sur la configuration, l’installation, l’onboarding ou le support d’exécution
    - Trier les problèmes signalés par les utilisateurs avant un débogage plus approfondi
summary: Questions fréquentes sur l’installation, la configuration et l’utilisation d’OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-06T03:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d6d09621c6033d580cbcf1ff46f81587d69404d6f64c8d8fd8c3f09185bb920
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Réponses rapides avec dépannage plus approfondi pour des configurations réelles (développement local, VPS, multi-agent, OAuth/clés API, basculement de modèle). Pour les diagnostics d’exécution, voir [Dépannage](/fr/gateway/troubleshooting). Pour la référence complète de configuration, voir [Configuration](/fr/gateway/configuration).

## Les 60 premières secondes si quelque chose est cassé

1. **Statut rapide (première vérification)**

   ```bash
   openclaw status
   ```

   Résumé local rapide : OS + mise à jour, accessibilité de la gateway/du service, agents/sessions, configuration du provider + problèmes d’exécution (quand la gateway est accessible).

2. **Rapport copiable/collable (sûr à partager)**

   ```bash
   openclaw status --all
   ```

   Diagnostic en lecture seule avec fin de logs (jetons masqués).

3. **État du daemon + du port**

   ```bash
   openclaw gateway status
   ```

   Affiche l’exécution du superviseur par rapport à l’accessibilité RPC, l’URL cible de la sonde et la configuration probablement utilisée par le service.

4. **Sondes approfondies**

   ```bash
   openclaw status --deep
   ```

   Exécute une sonde de santé active de la gateway, y compris les sondes de canal quand elles sont prises en charge
   (nécessite une gateway accessible). Voir [Santé](/fr/gateway/health).

5. **Suivre le dernier log**

   ```bash
   openclaw logs --follow
   ```

   Si le RPC est indisponible, utilisez à la place :

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Les logs de fichiers sont distincts des logs de service ; voir [Journalisation](/fr/logging) et [Dépannage](/fr/gateway/troubleshooting).

6. **Exécuter Doctor (réparations)**

   ```bash
   openclaw doctor
   ```

   Répare/migre la configuration et l’état + exécute des vérifications de santé. Voir [Doctor](/fr/gateway/doctor).

7. **Instantané de la gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # affiche l’URL cible + le chemin de config en cas d’erreur
   ```

   Demande à la gateway en cours d’exécution un instantané complet (WS uniquement). Voir [Santé](/fr/gateway/health).

## Démarrage rapide et première configuration

<AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local capable de **voir votre machine**. C’est bien plus efficace que de demander
    sur Discord, car la plupart des cas de « je suis bloqué » sont des **problèmes de configuration locale ou d’environnement**
    que les aides à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les logs et aider à corriger
    votre configuration au niveau machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur le **checkout complet du code source** via
    l’installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **depuis un checkout git**, afin que l’agent puisse lire le code + la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pourrez toujours revenir à la version stable plus tard
    en relançant l’installateur sans `--install-method git`.

    Conseil : demandez à l’agent de **planifier et superviser** la correction (étape par étape), puis d’exécuter uniquement les
    commandes nécessaires. Cela garde les changements petits et plus faciles à auditer.

    Si vous découvrez un vrai bug ou un correctif, merci de créer une issue GitHub ou d’envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties quand vous demandez de l’aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu’elles font :

    - `openclaw status` : instantané rapide de la santé de la gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification des providers + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](#les-60-premieres-secondes-si-quelque-chose-est-casse).
    Documentation d’installation : [Installer](/fr/install), [Drapeaux de l’installateur](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue à être ignoré. Que signifient les raisons d’ignoré ?">
    Raisons courantes d’ignoré de heartbeat :

    - `quiet-hours` : en dehors de la fenêtre `active-hours` configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide/en-têtes uniquement
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif mais aucun des intervalles de tâche n’est encore dû
    - `alerts-disabled` : toute la visibilité heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d’échéance ne sont avancés qu’après qu’une véritable exécution heartbeat
    se termine. Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Docs : [Heartbeat](/fr/gateway/heartbeat), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande d’exécuter depuis le code source et d’utiliser l’onboarding :

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
    pnpm ui:build # installe automatiquement les dépendances UI au premier lancement
    openclaw onboard
    ```

    Si vous n’avez pas encore d’installation globale, exécutez-la via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le dashboard après l’onboarding ?">
    L’assistant ouvre votre navigateur avec une URL de dashboard propre (sans jeton) juste après l’onboarding et affiche aussi le lien dans le résumé. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le dashboard sur localhost vs à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S’il demande une authentification par secret partagé, collez le jeton ou le mot de passe configuré dans les paramètres de Control UI.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un jeton avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez le bind sur loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification Control UI/WebSocket (pas de secret partagé collé, suppose un hôte gateway de confiance) ; les API HTTP exigent toujours une authentification par secret partagé sauf si vous utilisez délibérément `none` pour l’ingress privé ou une authentification HTTP par proxy de confiance.
      Les mauvaises tentatives d’authentification Serve concurrentes depuis le même client sont sérialisées avant que le limiteur d’échec d’authentification ne les enregistre, donc la deuxième mauvaise tentative peut déjà afficher `retry later`.
    - **Bind tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez une authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du dashboard.
    - **Reverse proxy à identité** : gardez la Gateway derrière un proxy de confiance non-loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours via le tunnel ; collez le jeton ou mot de passe configuré si demandé.

    Voir [Dashboard](/web/dashboard) et [Surfaces web](/web) pour les modes de bind et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi y a-t-il deux configurations d’approbation exec pour les approbations de chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transmet les demandes d’approbation vers les destinations de chat
    - `channels.<channel>.execApprovals` : fait de ce canal un client d’approbation natif pour les approbations exec

    La politique d’exécution de l’hôte reste toujours la véritable barrière d’approbation. La configuration de chat contrôle uniquement où les demandes d’approbation
    apparaissent et comment les personnes peuvent y répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs en toute sécurité, OpenClaw active maintenant automatiquement les approbations natives DM-first quand `channels.<channel>.execApprovals.enabled` est non défini ou `"auto"`.
    - Quand des cartes/boutons d’approbation natifs sont disponibles, cette UI native est le chemin principal ; l’agent ne doit inclure une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations de chat sont indisponibles ou que l’approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement quand les demandes doivent aussi être transmises à d’autres chats ou à des salons ops explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement si vous voulez explicitement que les demandes d’approbation soient republiées dans le salon/topic d’origine.
    - Les approbations de plugins sont encore distinctes : elles utilisent `/approve` dans le même chat par défaut, une transmission `approvals.plugin` facultative, et seuls certains canaux natifs gardent une gestion native des approbations de plugins en plus.

    En bref : la transmission sert au routage, la configuration du client natif sert à une UX plus riche spécifique au canal.
    Voir [Approbations Exec](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun est **déconseillé** pour la Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. La Gateway est légère - la documentation indique **512MB-1GB de RAM**, **1 cœur** et environ **500MB**
    de disque comme suffisants pour un usage personnel, et précise qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (logs, médias, autres services), **2GB est recommandé**, mais ce
    n’est pas un minimum strict.

    Conseil : un petit Pi/VPS peut héberger la Gateway, et vous pouvez appairer des **nodes** sur votre ordinateur portable/téléphone pour
    l’écran/la caméra/le canvas local ou l’exécution de commandes. Voir [Nodes](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    Version courte : ça fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l’**installation hackable (git)** pour pouvoir voir les logs et mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d’étranges problèmes binaires, il s’agit généralement d’un problème de **compatibilité ARM**.

    Docs : [Linux](/fr/platforms/linux), [Installer](/fr/install).

  </Accordion>

  <Accordion title="C’est bloqué sur wake up my friend / l’onboarding n’éclot pas. Que faire ?">
    Cet écran dépend d’une Gateway accessible et authentifiée. La TUI envoie aussi
    automatiquement « Wake up, my friend! » au premier hatch. Si vous voyez cette ligne avec **aucune réponse**
    et que les jetons restent à 0, l’agent n’a jamais été exécuté.

    1. Redémarrez la Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez le statut + l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela bloque toujours, exécutez :

    ```bash
    openclaw doctor
    ```

    Si la Gateway est distante, assurez-vous que la connexion tunnel/Tailscale est active et que l’UI
    pointe vers la bonne Gateway. Voir [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et le **workspace**, puis exécutez Doctor une fois. Cela
    garde votre bot « exactement pareil » (mémoire, historique de session, auth, et état des canaux)
    tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre workspace (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’auth, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, rappelez-vous que l’hôte gateway possède le stockage des sessions et le workspace.

    **Important :** si vous ne faites que commit/push votre workspace vers GitHub, vous sauvegardez
    **la mémoire + les fichiers bootstrap**, mais **pas** l’historique des sessions ni l’authentification. Ceux-ci se trouvent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Lié à : [Migration](/fr/install/migrating), [Où les choses sont stockées sur disque](#ou-les-choses-sont-stockees-sur-disque),
    [Workspace d’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    est la dernière version publiée. Les entrées sont regroupées par **Highlights**, **Changes** et
    **Fixes** (plus docs/autres sections si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-le ou autorisez `docs.openclaw.ai`, puis réessayez.
    Merci de nous aider à le débloquer en le signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas accéder au site, la documentation est répliquée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **npm dist-tags**, pas des lignes de code séparées :

    - `latest` = stable
    - `beta` = build anticipée pour les tests

    En général, une version stable arrive d’abord sur **beta**, puis une étape de
    promotion explicite déplace cette même version vers `latest`. Les maintainers peuvent aussi
    publier directement sur `latest` si nécessaire. C’est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d’installation en une ligne et la différence entre beta et dev, voir l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mouvante de `main` (git) ; quand elle est publiée, elle utilise le dist-tag npm `dev`.

    Commandes en une ligne (macOS/Linux) :

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installateur Windows (PowerShell) :
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Drapeaux de l’installateur](/fr/install/installer).

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

    Si vous préférez un clone propre manuellement, utilisez :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Docs : [Mise à jour](/cli/update), [Canaux de développement](/fr/install/development-channels),
    [Installer](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Guide approximatif :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela bloque, utilisez [Installateur bloqué](#demarrage-rapide-et-premiere-configuration)
    et la boucle de débogage rapide dans [Je suis bloqué](#demarrage-rapide-et-premiere-configuration).

  </Accordion>

  <Accordion title="Installateur bloqué ? Comment obtenir plus de retours ?">
    Relancez l’installateur avec une **sortie détaillée** :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installation beta avec verbosité :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Pour une installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Équivalent Windows (PowerShell) :

    ```powershell
    # install.ps1 n’a pas encore de drapeau -Verbose dédié.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d’options : [Drapeaux de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="L’installation Windows indique git not found ou openclaw not recognized">
    Deux problèmes Windows courants :

    **1) erreur npm spawn git / git not found**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez et rouvrez PowerShell, puis relancez l’installateur.

    **2) openclaw is not recognized après l’installation**

    - Votre dossier npm global bin n’est pas dans le PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sur Windows ; sur la plupart des systèmes il s’agit de `%AppData%\npm`).
    - Fermez et rouvrez PowerShell après la mise à jour du PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** au lieu de Windows natif.
    Docs : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="La sortie exec sous Windows affiche du texte chinois illisible - que dois-je faire ?">
    Il s’agit généralement d’un décalage de page de code de console dans les shells Windows natifs.

    Symptômes :

    - La sortie `system.run`/`exec` affiche le chinois en mojibake
    - La même commande apparaît correctement dans un autre profil de terminal

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

    Si vous reproduisez toujours cela sur la dernière version d’OpenClaw, suivez/signalez-le ici :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question - comment obtenir une meilleure réponse ?">
    Utilisez l’**installation hackable (git)** pour avoir localement le code source et la documentation complets, puis demandez
    à votre bot (ou à Claude/Codex) _depuis ce dossier_ afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installer](/fr/install) et [Drapeaux de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis exécutez l’onboarding.

    - Chemin rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Procédure complète : [Bien démarrer](/fr/start/getting-started).
    - Installateur + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux fonctionne. Installez-le sur le serveur, puis utilisez SSH/Tailscale pour atteindre la Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway distante](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où sont les guides d’installation cloud/VPS ?">
    Nous avons un **hub d’hébergement** avec les providers courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les providers au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Fonctionnement dans le cloud : la **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via le Control UI (ou Tailscale/SSH). Votre état + workspace
    résident sur le serveur, donc considérez l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez appairer des **nodes** (Mac/iOS/Android/headless) à cette Gateway cloud pour accéder
    à l’écran/la caméra/le canvas locaux ou exécuter des commandes sur votre ordinateur portable tout en gardant la
    Gateway dans le cloud.

    Hub : [Plateformes](/fr/platforms). Accès distant : [Gateway distante](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **possible, pas recommandé**. Le flux de mise à jour peut redémarrer la
    Gateway (ce qui fait tomber la session active), peut nécessiter un checkout git propre, et
    peut demander une confirmation. Plus sûr : exécuter les mises à jour depuis un shell en tant qu’opérateur.

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

    Docs : [Mise à jour](/cli/update), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le chemin de configuration recommandé. En **mode local**, il vous guide à travers :

    - **Configuration modèle/auth** (OAuth provider, clés API, setup-token Anthropic historique, ainsi que des options de modèles locaux comme LM Studio)
    - Emplacement du **workspace** + fichiers bootstrap
    - **Paramètres de gateway** (bind/port/auth/tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus des plugins de canal groupés comme QQ Bot)
    - **Installation du daemon** (LaunchAgent sur macOS ; unité systemd utilisateur sur Linux/WSL2)
    - **Vérifications de santé** et sélection des **Skills**

    Il avertit aussi si votre modèle configuré est inconnu ou s’il manque une authentification.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour l’utiliser ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec des
    **modèles locaux uniquement** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces providers.

    Pour Anthropic dans OpenClaw, la distinction pratique est :

    - **Clé API Anthropic** : facturation API Anthropic normale
    - **Authentification par abonnement Claude dans OpenClaw** : Anthropic a indiqué aux utilisateurs d’OpenClaw le
      **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** que cela nécessite
      **Extra Usage** facturé séparément de l’abonnement

    Nos reproductions locales montrent aussi que `claude -p --append-system-prompt ...` peut
    rencontrer la même protection Extra Usage lorsque l’invite ajoutée identifie
    OpenClaw, alors que la même chaîne d’invite **ne** reproduit **pas** ce blocage sur
    le chemin SDK Anthropic + clé API. OpenAI Codex OAuth est explicitement
    pris en charge pour des outils externes comme OpenClaw.

    OpenClaw prend aussi en charge d’autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** et
    **Z.AI / GLM Coding Plan**.

    Docs : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Modèles GLM](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé API ?">
    Oui, mais considérez-le comme une **authentification par abonnement Claude avec Extra Usage**.

    Les abonnements Claude Pro/Max n’incluent pas de clé API. Dans OpenClaw, cela
    signifie que la notice de facturation spécifique à OpenClaw d’Anthropic s’applique : le trafic d’abonnement
    exige **Extra Usage**. Si vous voulez du trafic Anthropic sans
    ce chemin Extra Usage, utilisez plutôt une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui, mais l’interprétation prise en charge est maintenant :

    - Anthropic dans OpenClaw avec un abonnement signifie **Extra Usage**
    - Anthropic dans OpenClaw sans ce chemin signifie **clé API**

    Le setup-token Anthropic reste disponible comme chemin OpenClaw historique/manuel,
    et la notice de facturation spécifique à OpenClaw d’Anthropic s’y applique toujours. Nous
    avons aussi reproduit localement la même protection de facturation avec un usage direct
    de `claude -p --append-system-prompt ...` lorsque l’invite ajoutée
    identifie OpenClaw, alors que la même chaîne d’invite ne l’a **pas** reproduite sur
    le chemin SDK Anthropic + clé API.

    Pour les charges de travail de production ou multi-utilisateurs, l’authentification par clé API Anthropic est le
    choix recommandé le plus sûr. Si vous voulez d’autres options hébergées de type abonnement
    dans OpenClaw, voir [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), et
    [Modèles GLM](/fr/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Pourquoi vois-je HTTP 429 rate_limit_error de la part d’Anthropic ?">
Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
utilisez une **clé API Anthropic**, vérifiez la console Anthropic
pour l’utilisation/la facturation et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, la requête essaie d’utiliser
    la bêta 1M de contexte d’Anthropic (`context1m: true`). Cela ne fonctionne que si votre
    identifiant est éligible à la facturation long contexte (facturation par clé API ou
    chemin de connexion Claude d’OpenClaw avec Extra Usage activé).

    Conseil : définissez un **modèle de secours** afin qu’OpenClaw puisse continuer à répondre lorsqu’un provider est limité.
    Voir [Modèles](/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw dispose d’un provider groupé **Amazon Bedrock (Converse)**. Avec des marqueurs d’environnement AWS présents, OpenClaw peut auto-détecter le catalogue Bedrock streaming/texte et le fusionner comme provider implicite `amazon-bedrock` ; sinon vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée provider manuelle. Voir [Amazon Bedrock](/fr/providers/bedrock) et [Providers de modèles](/fr/providers/models). Si vous préférez un flux de clé géré, un proxy compatible OpenAI devant Bedrock reste une option valable.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). L’onboarding peut exécuter le flux OAuth et définira le modèle par défaut sur `openai-codex/gpt-5.4` quand cela est approprié. Voir [Providers de modèles](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement OpenAI (Codex OAuth) ?">
    Oui. OpenClaw prend entièrement en charge **l’OAuth par abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l’utilisation d’un OAuth par abonnement dans des outils/workflows externes
    comme OpenClaw. L’onboarding peut exécuter le flux OAuth pour vous.

    Voir [OAuth](/fr/concepts/oauth), [Providers de modèles](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer Gemini CLI OAuth ?">
    Gemini CLI utilise un **flux d’authentification plugin**, pas un client id ou secret dans `openclaw.json`.

    Utilisez plutôt le provider Gemini API :

    1. Activez le plugin : `openclaw plugins enable google`
    2. Exécutez `openclaw onboard --auth-choice gemini-api-key`
    3. Définissez un modèle Google tel que `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Un modèle local convient-il pour des conversations occasionnelles ?">
    En général non. OpenClaw nécessite un grand contexte + une forte sûreté ; les petites cartes tronquent et fuient. Si vous devez le faire, exécutez le build de modèle **le plus grand** possible localement (LM Studio) et consultez [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque de prompt injection - voir [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic de modèle hébergé dans une région spécifique ?">
    Choisissez des endpoints épinglés à une région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour garder les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté en utilisant `models.mode: "merge"` afin que les secours restent disponibles tout en respectant le provider régional que vous sélectionnez.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour installer cela ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif - certaines personnes
    en achètent un comme hôte toujours allumé, mais un petit VPS, serveur domestique ou boîtier de classe Raspberry Pi fonctionne aussi.

    Vous n’avez besoin d’un Mac **que pour les outils macOS uniquement**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) - le serveur BlueBubbles s’exécute sur n’importe quel Mac, et la Gateway peut s’exécuter sur Linux ou ailleurs. Si vous voulez d’autres outils uniquement macOS, exécutez la Gateway sur un Mac ou appairez un node macOS.

    Docs : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin de **n’importe quel appareil macOS** connecté à Messages. Il ne doit **pas** forcément s’agir d’un Mac mini -
    n’importe quel Mac convient. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage - le serveur BlueBubbles s’exécute sur macOS, tandis que la Gateway peut s’exécuter sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter la Gateway sur Linux/VPS, et le serveur BlueBubbles sur n’importe quel Mac connecté à Messages.
    - Tout exécuter sur le Mac si vous voulez la configuration à machine unique la plus simple.

    Docs : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter la Gateway**, et votre MacBook Pro peut se connecter comme
    **node** (appareil compagnon). Les nodes n’exécutent pas la Gateway - ils fournissent des
    capacités supplémentaires comme l’écran/la caméra/le canvas et `system.run` sur cet appareil.

    Schéma courant :

    - Gateway sur le Mac mini (toujours allumé).
    - Le MacBook Pro exécute l’app macOS ou un hôte node et s’apparie à la Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Docs : [Nodes](/fr/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun est **déconseillé**. Nous observons des bugs d’exécution, surtout avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez tout de même expérimenter avec Bun, faites-le sur une gateway non production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` est **l’ID utilisateur Telegram de l’expéditeur humain** (numérique). Ce n’est pas le nom d’utilisateur du bot.

    L’onboarding accepte une entrée `@username` et la résout en ID numérique, mais l’autorisation OpenClaw utilise uniquement des ID numériques.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    Bot API officielle :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Voir [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un seul numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Liez le **DM** WhatsApp de chaque expéditeur (peer `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne ait son propre workspace et son propre stockage de session. Les réponses proviennent toujours du **même compte WhatsApp**, et le contrôle d’accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Voir [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent "chat rapide" et un agent "Opus pour coder" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis liez les routes entrantes (compte provider ou peers spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Voir aussi [Modèles](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés via `brew` soient résolus dans les shells non connectés.
    Les versions récentes préfixent aussi les répertoires bin utilisateurs courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation git hackable et npm install">
    - **Installation git hackable :** checkout complet du code source, modifiable, idéal pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **npm install :** installation globale de la CLI, sans dépôt, idéale pour « l’exécuter simplement ».
      Les mises à jour proviennent des dist-tags npm.

    Docs : [Bien démarrer](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre les installations npm et git ?">
    Oui. Installez l’autre variante, puis exécutez Doctor afin que le service gateway pointe vers le nouveau point d’entrée.
    Cela **ne supprime pas vos données** - cela ne change que l’installation du code OpenClaw. Votre état
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

    Doctor détecte une incohérence de point d’entrée du service gateway et propose de réécrire la configuration du service pour correspondre à l’installation actuelle (utilisez `--repair` en automatisation).

    Conseils de sauvegarde : voir [Stratégie de sauvegarde](#ou-les-choses-sont-stockees-sur-disque).

  </Accordion>

  <Accordion title="Dois-je exécuter la Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24/7, utilisez un VPS**. Si vous voulez
    le moins de friction possible et que le mode veille/redémarrage vous convient, exécutez-la localement.

    **Ordinateur portable (Gateway locale)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible.
    - **Inconvénients :** veille/coupures réseau = déconnexions, mises à jour/redémarrages OS interrompent, la machine doit rester réveillée.

    **VPS / cloud**

    - **Avantages :** toujours allumé, réseau stable, pas de problèmes de veille de portable, plus facile à garder en marche.
    - **Inconvénients :** souvent headless (utilisez des captures d’écran), accès uniquement distant aux fichiers, vous devez passer par SSH pour les mises à jour.

    **Note spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent très bien depuis un VPS. Le seul véritable compromis est **navigateur headless** vs fenêtre visible. Voir [Navigateur](/fr/tools/browser).

    **Par défaut recommandé :** VPS si vous avez déjà eu des déconnexions de gateway. Le local est excellent lorsque vous utilisez activement le Mac et voulez l’accès aux fichiers locaux ou l’automatisation UI avec un navigateur visible.

  </Accordion>

  <Accordion title="Est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours allumé, moins d’interruptions dues à la veille/aux redémarrages, permissions plus propres, plus facile à garder en fonctionnement.
    - **Ordinateur portable/de bureau partagé :** tout à fait acceptable pour tester et pour un usage actif, mais attendez-vous à des pauses quand la machine se met en veille ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez la Gateway sur un hôte dédié et appairez votre ordinateur portable comme **node** pour les outils locaux d’écran/caméra/exec. Voir [Nodes](/fr/nodes).
    Pour les recommandations de sécurité, lisez [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales d’un VPS et l’OS recommandé ?">
    OpenClaw est léger. Pour une Gateway de base + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1GB RAM, ~500MB de disque.
    - **Recommandé :** 1-2 vCPU, 2GB RAM ou plus pour de la marge (logs, médias, plusieurs canaux). Les outils Node et l’automatisation du navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou tout Debian/Ubuntu moderne). Le chemin d’installation Linux y est le mieux testé.

    Docs : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours allumée, accessible, et disposer de suffisamment de
    RAM pour la Gateway et les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1GB RAM.
    - **Recommandé :** 2GB RAM ou plus si vous exécutez plusieurs canaux, l’automatisation du navigateur ou des outils média.
    - **OS :** Ubuntu LTS ou un autre Debian/Ubuntu moderne.

    Si vous êtes sous Windows, **WSL2 est la configuration de style VM la plus simple** et offre la meilleure
    compatibilité d’outillage. Voir [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, voir [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Qu’est-ce qu’OpenClaw ?

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’OpenClaw, en un paragraphe ?">
    OpenClaw est un assistant IA personnel que vous exécutez sur vos propres appareils. Il répond sur les surfaces de messagerie que vous utilisez déjà (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, et des plugins de canal groupés comme QQ Bot) et peut aussi faire de la voix + un Canvas en direct sur les plateformes prises en charge. La **Gateway** est le plan de contrôle toujours actif ; l’assistant est le produit.
  </Accordion>

  <Accordion title="Proposition de valeur">
    OpenClaw n’est pas « juste un wrapper Claude ». C’est un **plan de contrôle local-first** qui vous permet d’exécuter un
    assistant performant sur **votre propre matériel**, joignable depuis les applications de chat que vous utilisez déjà, avec
    des sessions avec état, de la mémoire et des outils - sans confier le contrôle de vos workflows à un
    SaaS hébergé.

    Points forts :

    - **Vos appareils, vos données :** exécutez la Gateway où vous voulez (Mac, Linux, VPS) et gardez le
      workspace + l’historique des sessions en local.
    - **De vrais canaux, pas un bac à sable web :** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      plus la voix mobile et Canvas sur les plateformes prises en charge.
    - **Agnostique vis-à-vis des modèles :** utilisez Anthropic, OpenAI, MiniMax, OpenRouter, etc., avec routage
      et basculement par agent.
    - **Option uniquement locale :** exécutez des modèles locaux pour que **toutes les données puissent rester sur votre appareil** si vous le souhaitez.
    - **Routage multi-agent :** agents séparés par canal, compte ou tâche, chacun avec son propre
      workspace et ses valeurs par défaut.
    - **Open source et hackable :** inspectez, étendez et auto-hébergez sans enfermement propriétaire.

    Docs : [Gateway](/fr/gateway), [Canaux](/fr/channels), [Multi-agent](/fr/concepts/multi-agent),
    [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Je viens de l’installer - que dois-je faire d’abord ?">
    Bons premiers projets :

    - Construire un site web (WordPress, Shopify ou un simple site statique).
    - Prototyper une application mobile (plan, écrans, API).
    - Organiser fichiers et dossiers (nettoyage, nommage, étiquetage).
    - Connecter Gmail et automatiser des résumés ou suivis.

    Il peut gérer de grosses tâches, mais il fonctionne mieux quand vous les divisez en phases et
    utilisez des sub agents pour le travail parallèle.

  </Accordion>

  <Accordion title="Quels sont les cinq principaux cas d’usage quotidiens d’OpenClaw ?">
    Les gains du quotidien ressemblent généralement à ceci :

    - **Briefings personnels :** résumés de la boîte mail, du calendrier et des actualités qui vous intéressent.
    - **Recherche et rédaction :** recherche rapide, résumés et premières versions pour emails ou documents.
    - **Rappels et suivis :** relances et checklists pilotées par cron ou heartbeat.
    - **Automatisation du navigateur :** remplir des formulaires, collecter des données et répéter des tâches web.
    - **Coordination inter-appareils :** envoyer une tâche depuis votre téléphone, laisser la Gateway l’exécuter sur un serveur, puis récupérer le résultat dans le chat.

  </Accordion>

  <Accordion title="OpenClaw peut-il aider pour la génération de leads, la prospection, les pubs et les blogs pour un SaaS ?">
    Oui pour la **recherche, la qualification et la rédaction**. Il peut analyser des sites, créer des shortlists,
    résumer des prospects et écrire des brouillons de messages de prospection ou de textes publicitaires.

    Pour la **prospection ou les campagnes publicitaires**, gardez un humain dans la boucle. Évitez le spam, respectez les lois locales et
    les politiques des plateformes, et vérifiez tout avant envoi. Le schéma le plus sûr consiste à laisser
    OpenClaw rédiger, puis à approuver.

    Docs : [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quels sont les avantages par rapport à Claude Code pour le développement web ?">
    OpenClaw est un **assistant personnel** et une couche de coordination, pas un remplacement d’IDE. Utilisez
    Claude Code ou Codex pour la boucle de codage directe la plus rapide dans un dépôt. Utilisez OpenClaw lorsque vous
    voulez une mémoire durable, un accès multi-appareils et de l’orchestration d’outils.

    Avantages :

    - **Mémoire persistante + workspace** entre les sessions
    - **Accès multiplateforme** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration d’outils** (navigateur, fichiers, planification, hooks)
    - **Gateway toujours active** (exécution sur un VPS, interaction depuis n’importe où)
    - **Nodes** pour navigateur/écran/caméra/exec locaux

    Showcase : [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills et automatisation

<AccordionGroup>
  <Accordion title="Comment personnaliser des Skills sans garder le dépôt modifié ?">
    Utilisez des surcharges gérées au lieu de modifier la copie du dépôt. Placez vos modifications dans `~/.openclaw/skills/<name>/SKILL.md` (ou ajoutez un dossier via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json`). La précédence est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → groupé → `skills.load.extraDirs`, donc les surcharges gérées l’emportent toujours sur les Skills groupés sans toucher à git. Si vous avez besoin que le Skill soit installé globalement mais visible uniquement pour certains agents, gardez la copie partagée dans `~/.openclaw/skills` et contrôlez la visibilité avec `agents.defaults.skills` et `agents.list[].skills`. Seules les modifications dignes d’être remontées en amont doivent vivre dans le dépôt et partir en PR.
  </Accordion>

  <Accordion title="Puis-je charger des Skills depuis un dossier personnalisé ?">
    Oui. Ajoutez des répertoires supplémentaires via `skills.load.extraDirs` dans `~/.openclaw/openclaw.json` (priorité la plus faible). La priorité par défaut est `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → groupé → `skills.load.extraDirs`. `clawhub` installe par défaut dans `./skills`, qu’OpenClaw traite comme `<workspace>/skills` à la session suivante. Si le Skill ne doit être visible que pour certains agents, combinez cela avec `agents.defaults.skills` ou `agents.list[].skills`.
  </Accordion>

  <Accordion title="Comment utiliser différents modèles pour différentes tâches ?">
    Aujourd’hui, les schémas pris en charge sont :

    - **Tâches cron** : les tâches isolées peuvent définir une surcharge `model` par tâche.
    - **Sub-agents** : routez les tâches vers des agents séparés avec des modèles par défaut différents.
    - **Bascule à la demande** : utilisez `/model` pour changer le modèle de la session actuelle à tout moment.

    Voir [Tâches cron](/fr/automation/cron-jobs), [Routage multi-agent](/fr/concepts/multi-agent), et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Le bot se fige pendant un gros travail. Comment déporter cela ?">
    Utilisez des **sub-agents** pour les tâches longues ou parallèles. Les sub-agents s’exécutent dans leur propre session,
    renvoient un résumé et gardent votre chat principal réactif.

    Demandez à votre bot de « lancer un sub-agent pour cette tâche » ou utilisez `/subagents`.
    Utilisez `/status` dans le chat pour voir ce que fait la Gateway en ce moment (et si elle est occupée).

    Conseil jetons : les tâches longues et les sub-agents consomment tous deux des jetons. Si le coût est un sujet, définissez un
    modèle moins cher pour les sub-agents via `agents.defaults.subagents.model`.

    Docs : [Sub-agents](/fr/tools/subagents), [Tâches d’arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Comment fonctionnent les sessions de subagent liées à un thread sur Discord ?">
    Utilisez des liaisons de thread. Vous pouvez lier un thread Discord à un subagent ou à une cible de session afin que les messages de suivi dans ce thread restent sur cette session liée.

    Flux de base :

    - Lancez avec `sessions_spawn` en utilisant `thread: true` (et éventuellement `mode: "session"` pour un suivi persistant).
    - Ou liez manuellement avec `/focus <target>`.
    - Utilisez `/agents` pour inspecter l’état de la liaison.
    - Utilisez `/session idle <duration|off>` et `/session max-age <duration|off>` pour contrôler le retrait automatique du focus.
    - Utilisez `/unfocus` pour détacher le thread.

    Configuration requise :

    - Valeurs globales par défaut : `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Surcharges Discord : `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Liaison automatique au lancement : définissez `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs : [Sub-agents](/fr/tools/subagents), [Discord](/fr/channels/discord), [Référence de configuration](/fr/gateway/configuration-reference), [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagent a terminé, mais la mise à jour de fin est partie au mauvais endroit ou n’a jamais été publiée. Que dois-je vérifier ?">
    Vérifiez d’abord la route de demandeur résolue :

    - La livraison en mode fin de subagent préfère tout thread lié ou route de conversation lorsqu’il en existe un.
    - Si l’origine de la fin ne transporte qu’un canal, OpenClaw retombe sur la route stockée de la session demandeuse (`lastChannel` / `lastTo` / `lastAccountId`) afin que la livraison directe puisse quand même réussir.
    - Si ni route liée ni route stockée exploitable n’existent, la livraison directe peut échouer et le résultat retombe sur une livraison de session en file d’attente au lieu d’être publié immédiatement dans le chat.
    - Des cibles invalides ou obsolètes peuvent toujours forcer le repli vers la file d’attente ou un échec final de livraison.
    - Si la dernière réponse assistant visible de l’enfant est exactement le jeton silencieux `NO_REPLY` / `no_reply`, ou exactement `ANNOUNCE_SKIP`, OpenClaw supprime volontairement l’annonce au lieu de publier une progression plus ancienne devenue obsolète.
    - Si l’enfant a expiré après seulement des appels d’outils, l’annonce peut réduire cela à un court résumé de progression partielle au lieu de rejouer la sortie brute des outils.

    Débogage :

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Sub-agents](/fr/tools/subagents), [Tâches d’arrière-plan](/fr/automation/tasks), [Outil de session](/fr/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron ou les rappels ne se déclenchent pas. Que dois-je vérifier ?">
    Cron s’exécute dans le processus Gateway. Si la Gateway ne tourne pas en continu,
    les tâches planifiées ne s’exécuteront pas.

    Liste de vérification :

    - Confirmez que cron est activé (`cron.enabled`) et que `OPENCLAW_SKIP_CRON` n’est pas défini.
    - Vérifiez que la Gateway fonctionne 24/7 (pas de veille/redémarrages).
    - Vérifiez les paramètres de fuseau horaire de la tâche (`--tz` vs fuseau de l’hôte).

    Débogage :

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs : [Tâches cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Cron s’est déclenché, mais rien n’a été envoyé au canal. Pourquoi ?">
    Vérifiez d’abord le mode de livraison :

    - `--no-deliver` / `delivery.mode: "none"` signifie qu’aucun message externe n’est attendu.
    - Une cible d’annonce manquante ou invalide (`channel` / `to`) signifie que le runner a ignoré la livraison sortante.
    - Les échecs d’authentification du canal (`unauthorized`, `Forbidden`) signifient que le runner a tenté de livrer mais que les identifiants l’ont bloqué.
    - Un résultat isolé silencieux (`NO_REPLY` / `no_reply` uniquement) est traité comme intentionnellement non livrable, donc le runner supprime aussi la livraison de secours en file d’attente.

    Pour les tâches cron isolées, le runner possède la livraison finale. L’agent est censé
    renvoyer un résumé en texte brut que le runner enverra. `--no-deliver` garde
    ce résultat en interne ; cela ne permet pas à l’agent d’envoyer directement avec
    l’outil de message à la place.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches cron](/fr/automation/cron-jobs), [Tâches d’arrière-plan](/fr/automation/tasks).

  </Accordion>

  <Accordion title="Pourquoi une exécution cron isolée a-t-elle changé de modèle ou réessayé une fois ?">
    Il s’agit généralement du chemin de bascule de modèle en direct, pas d’une planification en double.

    Cron isolé peut persister un transfert de modèle à l’exécution et réessayer lorsque l’exécution active
    lève `LiveSessionModelSwitchError`. Le réessai conserve le
    provider/modèle basculé, et si la bascule transportait une nouvelle surcharge de profil d’auth, cron
    la persiste aussi avant de réessayer.

    Règles de sélection associées :

    - La surcharge de modèle du hook Gmail gagne d’abord quand elle s’applique.
    - Ensuite le `model` par tâche.
    - Ensuite toute surcharge de modèle de session cron stockée.
    - Ensuite la sélection normale de modèle agent/par défaut.

    La boucle de réessai est bornée. Après la tentative initiale plus 2 réessais de bascule,
    cron abandonne au lieu de boucler indéfiniment.

    Débogage :

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs : [Tâches cron](/fr/automation/cron-jobs), [CLI cron](/cli/cron).

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

    La commande native `openclaw skills install` écrit dans le répertoire `skills/`
    du workspace actif. Installez la CLI séparée `clawhub` uniquement si vous voulez publier ou
    synchroniser vos propres Skills. Pour des installations partagées entre agents, placez le Skill sous
    `~/.openclaw/skills` et utilisez `agents.defaults.skills` ou
    `agents.list[].skills` si vous voulez restreindre les agents qui peuvent le voir.

  </Accordion>

  <Accordion title="OpenClaw peut-il exécuter des tâches selon un planning ou en continu en arrière-plan ?">
    Oui. Utilisez le planificateur Gateway :

    - **Tâches cron** pour les tâches planifiées ou récurrentes (persistent après les redémarrages).
    - **Heartbeat** pour les vérifications périodiques de la « session principale ».
    - **Tâches isolées** pour des agents autonomes qui publient des résumés ou livrent dans des chats.

    Docs : [Tâches cron](/fr/automation/cron-jobs), [Automatisation et tâches](/fr/automation),
    [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title="Puis-je exécuter des Skills Apple uniquement macOS depuis Linux ?">
    Pas directement. Les Skills macOS sont conditionnés par `metadata.openclaw.os` plus les binaires requis, et les Skills n’apparaissent dans l’invite système que lorsqu’ils sont éligibles sur l’**hôte Gateway**. Sous Linux, les Skills `darwin` uniquement (comme `apple-notes`, `apple-reminders`, `things-mac`) ne se chargeront pas à moins que vous ne contourniez ce filtrage.

    Vous avez trois schémas pris en charge :

    **Option A - exécuter la Gateway sur un Mac (le plus simple).**
    Exécutez la Gateway là où les binaires macOS existent, puis connectez-vous depuis Linux en [mode distant](#gateway-ports-already-running-and-remote-mode) ou via Tailscale. Les Skills se chargent normalement parce que l’hôte Gateway est macOS.

    **Option B - utiliser un node macOS (sans SSH).**
    Exécutez la Gateway sur Linux, appairez un node macOS (app de barre de menu), et définissez **Node Run Commands** sur « Always Ask » ou « Always Allow » sur le Mac. OpenClaw peut traiter les Skills uniquement macOS comme éligibles lorsque les binaires requis existent sur le node. L’agent exécute ces Skills via l’outil `nodes`. Si vous choisissez « Always Ask », l’approbation « Always Allow » dans l’invite ajoute cette commande à la liste d’autorisation.

    **Option C - proxy des binaires macOS via SSH (avancé).**
    Gardez la Gateway sur Linux, mais faites résoudre les binaires CLI requis vers des wrappers SSH qui s’exécutent sur un Mac. Puis surchargez le Skill pour autoriser Linux afin qu’il reste éligible.

    1. Créez un wrapper SSH pour le binaire (exemple : `memo` pour Apple Notes) :

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Placez le wrapper dans le `PATH` sur l’hôte Linux (par exemple `~/bin/memo`).
    3. Surchargez les métadonnées du Skill (workspace ou `~/.openclaw/skills`) pour autoriser Linux :

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Démarrez une nouvelle session afin que l’instantané des Skills soit actualisé.

  </Accordion>

  <Accordion title="Avez-vous une intégration Notion ou HeyGen ?">
    Pas intégrée aujourd’hui.

    Options :

    - **Skill / plugin personnalisé :** idéal pour un accès API fiable (Notion/HeyGen ont tous deux des API).
    - **Automatisation du navigateur :** fonctionne sans code mais c’est plus lent et plus fragile.

    Si vous voulez garder le contexte par client (workflows d’agence), un schéma simple est :

    - Une page Notion par client (contexte + préférences + travail en cours).
    - Demander à l’agent de récupérer cette page au début d’une session.

    Si vous voulez une intégration native, ouvrez une demande de fonctionnalité ou construisez un Skill
    ciblant ces API.

    Installer des Skills :

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Les installations natives atterrissent dans le répertoire `skills/` du workspace actif. Pour des Skills partagés entre agents, placez-les dans `~/.openclaw/skills/<name>/SKILL.md`. Si seuls certains agents doivent voir une installation partagée, configurez `agents.defaults.skills` ou `agents.list[].skills`. Certains Skills attendent des binaires installés via Homebrew ; sur Linux, cela signifie Linuxbrew (voir l’entrée FAQ Homebrew Linux ci-dessus). Voir [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config), et [ClawHub](/fr/tools/clawhub).

  </Accordion>

  <Accordion title="Comment utiliser mon Chrome déjà connecté avec OpenClaw ?">
    Utilisez le profil navigateur intégré `user`, qui s’attache via Chrome DevTools MCP :

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Si vous voulez un nom personnalisé, créez un profil MCP explicite :

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Ce chemin est local à l’hôte. Si la Gateway s’exécute ailleurs, exécutez soit un hôte node sur la machine du navigateur, soit utilisez un CDP distant à la place.

    Limites actuelles de `existing-session` / `user` :

    - les actions sont pilotées par `ref`, pas par sélecteur CSS
    - les téléversements nécessitent `ref` / `inputRef` et ne prennent actuellement en charge qu’un seul fichier à la fois
    - `responsebody`, l’export PDF, l’interception des téléchargements et les actions par lot nécessitent encore un navigateur géré ou un profil CDP brut

  </Accordion>
</AccordionGroup>

## Sandbox et mémoire

<AccordionGroup>
  <Accordion title="Existe-t-il une documentation dédiée au sandboxing ?">
    Oui. Voir [Sandboxing](/fr/gateway/sandboxing). Pour la configuration spécifique à Docker (gateway complète dans Docker ou images de sandbox), voir [Docker](/fr/install/docker).
  </Accordion>

  <Accordion title="Docker paraît limité - comment activer toutes les fonctionnalités ?">
    L’image par défaut privilégie la sécurité et s’exécute sous l’utilisateur `node`, donc elle n’inclut
    ni paquets système, ni Homebrew, ni navigateurs groupés. Pour une configuration plus complète :

    - Persistez `/home/node` avec `OPENCLAW_HOME_VOLUME` pour que les caches survivent.
    - Intégrez les dépendances système dans l’image avec `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installez les navigateurs Playwright via la CLI groupée :
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Définissez `PLAYWRIGHT_BROWSERS_PATH` et assurez-vous que ce chemin est persisté.

    Docs : [Docker](/fr/install/docker), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Puis-je garder les DM privés mais rendre les groupes publics/sandboxés avec un seul agent ?">
    Oui - si votre trafic privé correspond aux **DM** et votre trafic public à des **groupes**.

    Utilisez `agents.defaults.sandbox.mode: "non-main"` afin que les sessions de groupe/canal (clés non principales) s’exécutent dans Docker, tandis que la session DM principale reste sur l’hôte. Puis restreignez les outils disponibles dans les sessions sandboxées via `tools.sandbox.tools`.

    Procédure de configuration + exemple : [Groupes : DM personnels + groupes publics](/fr/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Référence de configuration clé : [Configuration Gateway](/fr/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Comment lier un dossier hôte dans le sandbox ?">
    Définissez `agents.defaults.sandbox.docker.binds` sur `["host:path:mode"]` (par ex., `"/home/user/src:/src:ro"`). Les liaisons globales + par agent fusionnent ; les liaisons par agent sont ignorées quand `scope: "shared"`. Utilisez `:ro` pour tout ce qui est sensible et rappelez-vous que les binds contournent les murs du système de fichiers du sandbox.

    OpenClaw valide les sources de bind à la fois contre le chemin normalisé et le chemin canonique résolu via l’ancêtre existant le plus profond. Cela signifie que les échappements via parent symlink restent bloqués même lorsque le dernier segment du chemin n’existe pas encore, et que les vérifications de racines autorisées s’appliquent toujours après résolution des symlinks.

    Voir [Sandboxing](/fr/gateway/sandboxing#custom-bind-mounts) et [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) pour des exemples et des notes de sécurité.

  </Accordion>

  <Accordion title="Comment fonctionne la mémoire ?">
    La mémoire OpenClaw est simplement constituée de fichiers Markdown dans le workspace de l’agent :

    - Notes quotidiennes dans `memory/YYYY-MM-DD.md`
    - Notes de long terme sélectionnées dans `MEMORY.md` (sessions principales/privées uniquement)

    OpenClaw exécute aussi une **vidange mémoire silencieuse avant compactage** pour rappeler au modèle
    d’écrire des notes durables avant l’auto-compaction. Cela ne s’exécute que lorsque le workspace
    est accessible en écriture (les sandboxes en lecture seule l’ignorent). Voir [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="La mémoire oublie constamment des choses. Comment les rendre durables ?">
    Demandez au bot **d’écrire le fait en mémoire**. Les notes de long terme vont dans `MEMORY.md`,
    le contexte de court terme va dans `memory/YYYY-MM-DD.md`.

    C’est encore un domaine que nous améliorons. Il est utile de rappeler au modèle de stocker des souvenirs ;
    il saura quoi faire. S’il continue d’oublier, vérifiez que la Gateway utilise le même
    workspace à chaque exécution.

    Docs : [Mémoire](/fr/concepts/memory), [Workspace d’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La mémoire persiste-t-elle pour toujours ? Quelles sont les limites ?">
    Les fichiers de mémoire vivent sur le disque et persistent jusqu’à ce que vous les supprimiez. La limite est votre
    stockage, pas le modèle. Le **contexte de session** reste toutefois limité par la fenêtre de contexte du modèle,
    donc les longues conversations peuvent être compactées ou tronquées. C’est pourquoi la recherche
    mémoire existe - elle ne réinjecte en contexte que les parties pertinentes.

    Docs : [Mémoire](/fr/concepts/memory), [Contexte](/fr/concepts/context).

  </Accordion>

  <Accordion title="La recherche sémantique en mémoire nécessite-t-elle une clé API OpenAI ?">
    Seulement si vous utilisez les **embeddings OpenAI**. Codex OAuth couvre le chat/les complétions et
    **ne** donne **pas** accès aux embeddings, donc **se connecter avec Codex (OAuth ou la
    connexion CLI Codex)** n’aide pas pour la recherche sémantique en mémoire. Les embeddings OpenAI
    nécessitent toujours une vraie clé API (`OPENAI_API_KEY` ou `models.providers.openai.apiKey`).

    Si vous ne définissez pas explicitement de provider, OpenClaw en sélectionne automatiquement un lorsqu’il
    peut résoudre une clé API (profils d’auth, `models.providers.*.apiKey`, ou variables d’environnement).
    Il préfère OpenAI si une clé OpenAI est résolue, sinon Gemini si une clé Gemini
    est résolue, puis Voyage, puis Mistral. Si aucune clé distante n’est disponible, la recherche
    mémoire reste désactivée jusqu’à ce que vous la configuriez. Si vous avez un chemin de modèle local
    configuré et présent, OpenClaw
    préfère `local`. Ollama est pris en charge quand vous définissez explicitement
    `memorySearch.provider = "ollama"`.

    Si vous préférez rester en local, définissez `memorySearch.provider = "local"` (et éventuellement
    `memorySearch.fallback = "none"`). Si vous voulez des embeddings Gemini, définissez
    `memorySearch.provider = "gemini"` et fournissez `GEMINI_API_KEY` (ou
    `memorySearch.remote.apiKey`). Nous prenons en charge les modèles d’embedding **OpenAI, Gemini, Voyage, Mistral, Ollama ou local** -
    voir [Mémoire](/fr/concepts/memory) pour les détails de configuration.

  </Accordion>
</AccordionGroup>

## Où les choses sont stockées sur disque

<AccordionGroup>
  <Accordion title="Toutes les données utilisées avec OpenClaw sont-elles enregistrées localement ?">
    Non - **l’état d’OpenClaw est local**, mais **les services externes voient toujours ce que vous leur envoyez**.

    - **Local par défaut :** les sessions, fichiers de mémoire, configuration et workspace vivent sur l’hôte Gateway
      (`~/.openclaw` + votre répertoire de workspace).
    - **Distant par nécessité :** les messages que vous envoyez aux providers de modèles (Anthropic/OpenAI/etc.) vont vers
      leurs API, et les plateformes de chat (WhatsApp/Telegram/Slack/etc.) stockent les données de messages sur leurs
      serveurs.
    - **Vous contrôlez l’empreinte :** utiliser des modèles locaux garde les invites sur votre machine, mais le trafic
      des canaux passe toujours par les serveurs du canal.

    Lié à : [Workspace d’agent](/fr/concepts/agent-workspace), [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Où OpenClaw stocke-t-il ses données ?">
    Tout vit sous `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) :

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config principale (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth historique (copié dans les profils d’auth au premier usage) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profils d’auth (OAuth, clés API, et `keyRef`/`tokenRef` facultatifs) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Charge utile secrète facultative stockée en fichier pour les providers `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Fichier de compatibilité historique (entrées `api_key` statiques nettoyées) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | État des providers (par ex. `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | État par agent (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Historique et état des conversations (par agent)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Métadonnées de session (par agent)                                 |

    Chemin historique mono-agent : `~/.openclaw/agent/*` (migré par `openclaw doctor`).

    Votre **workspace** (AGENTS.md, fichiers mémoire, Skills, etc.) est séparé et configuré via `agents.defaults.workspace` (par défaut : `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Où doivent vivre AGENTS.md / SOUL.md / USER.md / MEMORY.md ?">
    Ces fichiers vivent dans le **workspace d’agent**, pas dans `~/.openclaw`.

    - **Workspace (par agent)** : `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (ou repli historique `memory.md` lorsque `MEMORY.md` est absent),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facultatif.
    - **Répertoire d’état (`~/.openclaw`)** : config, état des canaux/providers, profils d’auth, sessions, logs,
      et Skills partagés (`~/.openclaw/skills`).

    Le workspace par défaut est `~/.openclaw/workspace`, configurable via :

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Si le bot « oublie » après un redémarrage, confirmez que la Gateway utilise le même
    workspace à chaque lancement (et rappelez-vous : le mode distant utilise le **workspace de l’hôte gateway**,
    pas celui de votre ordinateur portable local).

    Conseil : si vous voulez un comportement ou une préférence durable, demandez au bot de **l’écrire dans
    AGENTS.md ou MEMORY.md** plutôt que de vous reposer sur l’historique du chat.

    Voir [Workspace d’agent](/fr/concepts/agent-workspace) et [Mémoire](/fr/concepts/memory).

  </Accordion>

  <Accordion title="Stratégie de sauvegarde recommandée">
    Placez votre **workspace d’agent** dans un dépôt git **privé** et sauvegardez-le quelque part
    de privé (par exemple GitHub privé). Cela capture la mémoire + les fichiers AGENTS/SOUL/USER
    et vous permet de restaurer plus tard « l’esprit » de l’assistant.

    **Ne** committez **rien** sous `~/.openclaw` (identifiants, sessions, jetons ou charges utiles de secrets chiffrées).
    Si vous avez besoin d’une restauration complète, sauvegardez séparément le workspace et le répertoire d’état
    (voir la question sur la migration ci-dessus).

    Docs : [Workspace d’agent](/fr/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Comment désinstaller complètement OpenClaw ?">
    Voir le guide dédié : [Désinstaller](/fr/install/uninstall).
  </Accordion>

  <Accordion title="Les agents peuvent-ils travailler en dehors du workspace ?">
    Oui. Le workspace est le **cwd par défaut** et l’ancre mémoire, pas un sandbox strict.
    Les chemins relatifs se résolvent dans le workspace, mais les chemins absolus peuvent accéder à d’autres
    emplacements de l’hôte à moins que le sandboxing ne soit activé. Si vous avez besoin d’isolation, utilisez
    [`agents.defaults.sandbox`](/fr/gateway/sandboxing) ou des paramètres de sandbox par agent. Si vous
    voulez qu’un dépôt soit le répertoire de travail par défaut, pointez le
    `workspace` de cet agent vers la racine du dépôt. Le dépôt OpenClaw n’est que du code source ; gardez le
    workspace séparé sauf si vous voulez intentionnellement que l’agent y travaille.

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

  <Accordion title="Mode distant : où se trouve le stockage des sessions ?">
    L’état des sessions appartient à l’**hôte gateway**. Si vous êtes en mode distant, le stockage de session qui vous intéresse est sur la machine distante, pas sur votre ordinateur portable local. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>
</AccordionGroup>

## Bases de la configuration

<AccordionGroup>
  <Accordion title="Quel est le format de la config ? Où se trouve-t-elle ?">
    OpenClaw lit une config **JSON5** facultative depuis `$OPENCLAW_CONFIG_PATH` (par défaut : `~/.openclaw/openclaw.json`) :

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Si le fichier est absent, il utilise des valeurs par défaut relativement sûres (y compris un workspace par défaut de `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='J’ai défini gateway.bind: "lan" (ou "tailnet") et maintenant rien n’écoute / l’UI dit unauthorized'>
    Les binds non-loopback **exigent un chemin d’authentification gateway valide**. En pratique cela signifie :

    - authentification par secret partagé : jeton ou mot de passe
    - `gateway.auth.mode: "trusted-proxy"` derrière un reverse proxy à identité correctement configuré et non-loopback

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

    Notes :

    - `gateway.remote.token` / `.password` **n’activent pas** à eux seuls l’authentification de la gateway locale.
    - Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement quand `gateway.auth.*` n’est pas défini.
    - Pour l’authentification par mot de passe, définissez `gateway.auth.mode: "password"` plus `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`) à la place.
    - Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue de manière fermée (pas de repli distant masqué).
    - Les configurations Control UI à secret partagé s’authentifient via `connect.params.auth.token` ou `connect.params.auth.password` (stockés dans les paramètres app/UI). Les modes à identité comme Tailscale Serve ou `trusted-proxy` utilisent des en-têtes de requête à la place. Évitez de mettre des secrets partagés dans les URL.
    - Avec `gateway.auth.mode: "trusted-proxy"`, les reverse proxies loopback du même hôte **ne** satisfont **pas** l’authentification trusted-proxy. Le proxy de confiance doit être une source non-loopback configurée.

  </Accordion>

  <Accordion title="Pourquoi ai-je maintenant besoin d’un jeton sur localhost ?">
    OpenClaw applique l’authentification de gateway par défaut, y compris sur loopback. Dans le chemin par défaut normal, cela signifie une authentification par jeton : si aucun chemin d’authentification explicite n’est configuré, le démarrage de la gateway se résout en mode jeton et en génère un automatiquement, en l’enregistrant dans `gateway.auth.token`, donc les **clients WS locaux doivent s’authentifier**. Cela bloque les autres processus locaux qui tentent d’appeler la Gateway.

    Si vous préférez un autre chemin d’authentification, vous pouvez explicitement choisir le mode mot de passe (ou, pour les reverse proxies non-loopback à identité, `trusted-proxy`). Si vous **voulez vraiment** un loopback ouvert, définissez explicitement `gateway.auth.mode: "none"` dans votre configuration. Doctor peut générer un jeton pour vous à tout moment : `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Dois-je redémarrer après avoir changé la configuration ?">
    La Gateway surveille la configuration et prend en charge le rechargement à chaud :

    - `gateway.reload.mode: "hybrid"` (par défaut) : applique à chaud les changements sûrs, redémarre pour les changements critiques
    - `hot`, `restart`, `off` sont également pris en charge

  </Accordion>

  <Accordion title="Comment désactiver les slogans CLI fantaisistes ?">
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

    - `off` : masque le texte du slogan mais garde la ligne titre/version de la bannière.
    - `default` : utilise `All your chats, one OpenClaw.` à chaque fois.
    - `random` : slogans tournants amusants/de saison (comportement par défaut).
    - Si vous ne voulez aucune bannière du tout, définissez la variable d’environnement `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Comment activer la recherche web (et web fetch) ?">
    `web_fetch` fonctionne sans clé API. `web_search` dépend du
    provider sélectionné :

    - Les providers adossés à une API comme Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity et Tavily nécessitent leur configuration habituelle par clé API.
    - Ollama Web Search ne nécessite pas de clé, mais il utilise votre hôte Ollama configuré et nécessite `ollama signin`.
    - DuckDuckGo ne nécessite pas de clé, mais il s’agit d’une intégration non officielle basée sur HTML.
    - SearXNG est sans clé / auto-hébergé ; configurez `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Recommandé :** exécutez `openclaw configure --section web` et choisissez un provider.
    Alternatives par variables d’environnement :

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
              provider: "firecrawl", // facultatif ; omettez pour l’auto-détection
            },
          },
        },
    }
    ```

    La configuration spécifique au provider pour la recherche web se trouve maintenant sous `plugins.entries.<plugin>.config.webSearch.*`.
    Les anciens chemins de provider `tools.web.search.*` se chargent encore temporairement pour compatibilité, mais ne doivent pas être utilisés pour les nouvelles configurations.
    La configuration de repli web-fetch Firecrawl se trouve sous `plugins.entries.firecrawl.config.webFetch.*`.

    Notes :

    - Si vous utilisez des listes d’autorisation, ajoutez `web_search`/`web_fetch`/`x_search` ou `group:web`.
    - `web_fetch` est activé par défaut (sauf si explicitement désactivé).
    - Si `tools.web.fetch.provider` est omis, OpenClaw auto-détecte le premier provider de repli fetch prêt à partir des identifiants disponibles. Aujourd’hui le provider groupé est Firecrawl.
    - Les daemons lisent les variables d’environnement depuis `~/.openclaw/.env` (ou l’environnement du service).

    Docs : [Outils web](/fr/tools/web).

  </Accordion>

  <Accordion title="config.apply a effacé ma config. Comment récupérer et éviter cela ?">
    `config.apply` remplace **toute la configuration**. Si vous envoyez un objet partiel, tout
    le reste est supprimé.

    Récupération :

    - Restaurez depuis une sauvegarde (git ou une copie de `~/.openclaw/openclaw.json`).
    - Si vous n’avez pas de sauvegarde, relancez `openclaw doctor` et reconfigurez les canaux/modèles.
    - Si c’était inattendu, signalez un bug et incluez votre dernière configuration connue ou toute sauvegarde.
    - Un agent de codage local peut souvent reconstruire une configuration fonctionnelle à partir des logs ou de l’historique.

    Pour l’éviter :

    - Utilisez `openclaw config set` pour les petits changements.
    - Utilisez `openclaw configure` pour les modifications interactives.
    - Utilisez d’abord `config.schema.lookup` quand vous n’êtes pas sûr du chemin exact ou de la forme d’un champ ; il renvoie un nœud de schéma superficiel plus les résumés immédiats des enfants pour approfondir.
    - Utilisez `config.patch` pour les modifications RPC partielles ; gardez `config.apply` pour le remplacement complet de la configuration uniquement.
    - Si vous utilisez l’outil `gateway` réservé au propriétaire depuis une exécution d’agent, il rejettera toujours les écritures vers `tools.exec.ask` / `tools.exec.security` (y compris les alias historiques `tools.bash.*` qui se normalisent vers les mêmes chemins exec protégés).

    Docs : [Config](/cli/config), [Configurer](/cli/configure), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Comment exécuter une Gateway centrale avec des workers spécialisés sur plusieurs appareils ?">
    Le schéma courant est **une Gateway** (par ex. Raspberry Pi) plus des **nodes** et des **agents** :

    - **Gateway (centrale) :** possède les canaux (Signal/WhatsApp), le routage et les sessions.
    - **Nodes (appareils) :** les Macs/iOS/Android se connectent comme périphériques et exposent des outils locaux (`system.run`, `canvas`, `camera`).
    - **Agents (workers) :** cerveaux/workspaces séparés pour des rôles spécialisés (par ex. « opérations Hetzner », « données personnelles »).
    - **Sub-agents :** lancent du travail d’arrière-plan à partir d’un agent principal lorsque vous voulez du parallélisme.
    - **TUI :** se connecte à la Gateway et permet de basculer d’agent/session.

    Docs : [Nodes](/fr/nodes), [Accès distant](/fr/gateway/remote), [Routage multi-agent](/fr/concepts/multi-agent), [Sub-agents](/fr/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Le navigateur OpenClaw peut-il s’exécuter en headless ?">
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

    La valeur par défaut est `false` (avec interface). Le mode headless est plus susceptible de déclencher des contrôles anti-bot sur certains sites. Voir [Navigateur](/fr/tools/browser).

    Le mode headless utilise le **même moteur Chromium** et fonctionne pour la plupart des automatisations (formulaires, clics, scraping, connexions). Les principales différences :

    - Pas de fenêtre de navigateur visible (utilisez des captures d’écran si vous avez besoin de visuels).
    - Certains sites sont plus stricts avec l’automatisation en mode headless (CAPTCHA, anti-bot).
      Par exemple, X/Twitter bloque souvent les sessions headless.

  </Accordion>

  <Accordion title="Comment utiliser Brave pour le contrôle du navigateur ?">
    Définissez `browser.executablePath` vers votre binaire Brave (ou tout navigateur basé sur Chromium) et redémarrez la Gateway.
    Voir les exemples complets de configuration dans [Navigateur](/fr/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateways distantes et nodes

<AccordionGroup>
  <Accordion title="Comment les commandes se propagent-elles entre Telegram, la gateway et les nodes ?">
    Les messages Telegram sont gérés par la **gateway**. La gateway exécute l’agent et
    n’appelle les nodes via la **WebSocket Gateway** que lorsqu’un outil node est nécessaire :

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Les nodes ne voient pas le trafic provider entrant ; ils ne reçoivent que des appels RPC node.

  </Accordion>

  <Accordion title="Comment mon agent peut-il accéder à mon ordinateur si la Gateway est hébergée à distance ?">
    Réponse courte : **appairez votre ordinateur comme node**. La Gateway s’exécute ailleurs, mais elle peut
    appeler les outils `node.*` (écran, caméra, système) sur votre machine locale via la WebSocket Gateway.

    Configuration typique :

    1. Exécutez la Gateway sur l’hôte toujours allumé (VPS/serveur domestique).
    2. Placez l’hôte Gateway + votre ordinateur sur le même tailnet.
    3. Assurez-vous que la WS Gateway est accessible (bind tailnet ou tunnel SSH).
    4. Ouvrez l’app macOS localement et connectez-vous en mode **Remote over SSH** (ou en tailnet direct)
       afin qu’elle puisse s’enregistrer comme node.
    5. Approuvez le node sur la Gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Aucun pont TCP séparé n’est requis ; les nodes se connectent via la WebSocket Gateway.

    Rappel sécurité : appairer un node macOS autorise `system.run` sur cette machine. N’appairez
    que des appareils de confiance et consultez [Sécurité](/fr/gateway/security).

    Docs : [Nodes](/fr/nodes), [Protocole Gateway](/fr/gateway/protocol), [mode distant macOS](/fr/platforms/mac/remote), [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Tailscale est connecté mais je n’obtiens aucune réponse. Que faire ?">
    Vérifiez les bases :

    - La Gateway est en cours d’exécution : `openclaw gateway status`
    - Santé de la Gateway : `openclaw status`
    - Santé des canaux : `openclaw channels status`

    Puis vérifiez l’authentification et le routage :

    - Si vous utilisez Tailscale Serve, assurez-vous que `gateway.auth.allowTailscale` est correctement défini.
    - Si vous vous connectez via un tunnel SSH, confirmez que le tunnel local est actif et pointe vers le bon port.
    - Confirmez que vos listes d’autorisation (DM ou groupe) incluent votre compte.

    Docs : [Tailscale](/fr/gateway/tailscale), [Accès distant](/fr/gateway/remote), [Canaux](/fr/channels).

  </Accordion>

  <Accordion title="Deux instances OpenClaw peuvent-elles se parler entre elles (local + VPS) ?">
    Oui. Il n’existe pas de pont « bot-à-bot » intégré, mais vous pouvez le mettre en place de plusieurs
    façons fiables :

    **Le plus simple :** utilisez un canal de chat normal auquel les deux bots ont accès (Telegram/Slack/WhatsApp).
    Faites envoyer un message du Bot A au Bot B, puis laissez le Bot B répondre normalement.

    **Pont CLI (générique) :** exécutez un script qui appelle l’autre Gateway avec
    `openclaw agent --message ... --deliver`, en ciblant un chat où l’autre bot
    écoute. Si l’un des bots est sur un VPS distant, pointez votre CLI vers cette Gateway distante
    via SSH/Tailscale (voir [Accès distant](/fr/gateway/remote)).

    Exemple de schéma (à exécuter depuis une machine qui peut joindre la Gateway cible) :

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Conseil : ajoutez une barrière pour que les deux bots ne bouclent pas sans fin (réponse sur mention uniquement,
    listes d’autorisation de canal, ou règle « ne pas répondre aux messages de bot »).

    Docs : [Accès distant](/fr/gateway/remote), [CLI Agent](/cli/agent), [Envoi Agent](/fr/tools/agent-send).

  </Accordion>

  <Accordion title="Ai-je besoin de VPS séparés pour plusieurs agents ?">
    Non. Une Gateway peut héberger plusieurs agents, chacun avec son propre workspace, ses modèles par défaut
    et son routage. C’est la configuration normale et elle est bien moins chère et plus simple que d’exécuter
    un VPS par agent.

    Utilisez des VPS séparés seulement lorsque vous avez besoin d’une isolation forte (frontières de sécurité) ou de
    configurations très différentes que vous ne voulez pas partager. Sinon, gardez une seule Gateway et
    utilisez plusieurs agents ou sub-agents.

  </Accordion>

  <Accordion title="Y a-t-il un avantage à utiliser un node sur mon ordinateur portable personnel plutôt que SSH depuis un VPS ?">
    Oui - les nodes sont la manière de premier ordre d’atteindre votre ordinateur portable depuis une Gateway distante, et ils
    débloquent plus qu’un simple accès shell. La Gateway s’exécute sur macOS/Linux (Windows via WSL2) et est
    légère (un petit VPS ou une machine de classe Raspberry Pi suffit ; 4 GB de RAM est largement suffisant), donc une
    configuration courante est un hôte toujours allumé plus votre ordinateur portable comme node.

    - **Pas de SSH entrant requis.** Les nodes se connectent en sortie à la WebSocket Gateway et utilisent l’appairage d’appareil.
    - **Contrôles d’exécution plus sûrs.** `system.run` est limité par les listes d’autorisation/approbations node sur cet ordinateur portable.
    - **Davantage d’outils d’appareil.** Les nodes exposent `canvas`, `camera` et `screen` en plus de `system.run`.
    - **Automatisation de navigateur locale.** Gardez la Gateway sur un VPS, mais exécutez Chrome localement via un hôte node sur l’ordinateur portable, ou attachez-vous au Chrome local sur l’hôte via Chrome MCP.

    SSH convient pour un accès shell ponctuel, mais les nodes sont plus simples pour les workflows d’agent continus et
    l’automatisation d’appareil.

    Docs : [Nodes](/fr/nodes), [CLI Nodes](/cli/nodes), [Navigateur](/fr/tools/browser).

  </Accordion>

  <Accordion title="Les nodes exécutent-ils un service gateway ?">
    Non. Une seule **gateway** doit s’exécuter par hôte sauf si vous exécutez intentionnellement des profils isolés (voir [Passerelles multiples](/fr/gateway/multiple-gateways)). Les nodes sont des périphériques qui se connectent
    à la gateway (nodes iOS/Android, ou « mode node » macOS dans l’app de barre de menu). Pour les hôtes node headless
    et le contrôle CLI, voir [CLI Node host](/cli/node).

    Un redémarrage complet est requis pour les changements `gateway`, `discovery` et `canvasHost`.

  </Accordion>

  <Accordion title="Existe-t-il un moyen API / RPC d’appliquer une configuration ?">
    Oui.

    - `config.schema.lookup` : inspecter un sous-arbre de configuration avec son nœud de schéma superficiel, son indice UI correspondant et les résumés immédiats des enfants avant écriture
    - `config.get` : récupérer l’instantané actuel + son hash
    - `config.patch` : mise à jour partielle sûre (préférée pour la plupart des modifications RPC)
    - `config.apply` : valider + remplacer toute la configuration, puis redémarrer
    - L’outil d’exécution `gateway` réservé au propriétaire refuse toujours de réécrire `tools.exec.ask` / `tools.exec.security` ; les alias historiques `tools.bash.*` se normalisent vers les mêmes chemins exec protégés

  </Accordion>

  <Accordion title="Configuration minimale raisonnable pour une première installation">
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

    Si vous voulez le Control UI sans SSH, utilisez Tailscale Serve sur le VPS :

    ```bash
    openclaw gateway --tailscale serve
    ```

    Cela garde la gateway liée à loopback et expose du HTTPS via Tailscale. Voir [Tailscale](/fr/gateway/tailscale).

  </Accordion>

  <Accordion title="Comment connecter un node Mac à une Gateway distante (Tailscale Serve) ?">
    Serve expose le **Control UI + WS de la Gateway**. Les nodes se connectent via le même endpoint WS Gateway.

    Configuration recommandée :

    1. **Assurez-vous que le VPS + le Mac sont sur le même tailnet**.
    2. **Utilisez l’app macOS en mode Remote** (la cible SSH peut être le nom d’hôte tailnet).
       L’app tunnelisera le port Gateway et se connectera comme node.
    3. **Approuvez le node** sur la gateway :

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Docs : [Protocole Gateway](/fr/gateway/protocol), [Découverte](/fr/gateway/discovery), [mode distant macOS](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dois-je installer sur un deuxième ordinateur portable ou simplement ajouter un node ?">
    Si vous n’avez besoin que d’**outils locaux** (écran/caméra/exec) sur le deuxième ordinateur portable, ajoutez-le comme
    **node**. Cela garde une seule Gateway et évite de dupliquer la configuration. Les outils de node local sont
    actuellement macOS uniquement, mais nous prévoyons de les étendre à d’autres OS.

    N’installez une deuxième Gateway que lorsque vous avez besoin d’une **isolation forte** ou de deux bots complètement séparés.

    Docs : [Nodes](/fr/nodes), [CLI Nodes](/cli/nodes), [Passerelles multiples](/fr/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variables d’environnement et chargement de .env

<AccordionGroup>
  <Accordion title="Comment OpenClaw charge-t-il les variables d’environnement ?">
    OpenClaw lit les variables d’environnement du processus parent (shell, launchd/systemd, CI, etc.) et charge en plus :

    - `.env` depuis le répertoire de travail courant
    - un `.env` global de secours depuis `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Aucun des deux fichiers `.env` ne remplace les variables d’environnement existantes.

    Vous pouvez aussi définir des variables d’environnement inline dans la configuration (appliquées uniquement si absentes de l’environnement du processus) :

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Voir [/environment](/fr/help/environment) pour la précédence complète et les sources.

  </Accordion>

  <Accordion title="J’ai démarré la Gateway via le service et mes variables d’environnement ont disparu. Que faire ?">
    Deux correctifs courants :

    1. Placez les clés manquantes dans `~/.openclaw/.env` pour qu’elles soient prises en compte même lorsque le service n’hérite pas de l’environnement de votre shell.
    2. Activez l’import depuis le shell (commodité optionnelle) :

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

    Cela exécute votre shell de connexion et n’importe que les clés attendues manquantes (ne remplace jamais). Équivalents en variables d’environnement :
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='J’ai défini COPILOT_GITHUB_TOKEN, mais models status affiche "Shell env: off." Pourquoi ?'>
    `openclaw models status` indique si **l’import d’environnement depuis le shell** est activé. « Shell env: off »
    ne signifie **pas** que vos variables d’environnement sont absentes - cela signifie seulement qu’OpenClaw ne chargera
    pas automatiquement votre shell de connexion.

    Si la Gateway s’exécute comme service (launchd/systemd), elle n’héritera pas de l’environnement de votre shell.
    Corrigez cela d’une des façons suivantes :

    1. Placez le jeton dans `~/.openclaw/.env` :

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Ou activez l’import depuis le shell (`env.shellEnv.enabled: true`).
    3. Ou ajoutez-le à votre bloc `env` de configuration (s’applique uniquement s’il manque).

    Puis redémarrez la gateway et revérifiez :

    ```bash
    openclaw models status
    ```

    Les jetons Copilot sont lus depuis `COPILOT_GITHUB_TOKEN` (également `GH_TOKEN` / `GITHUB_TOKEN`).
    Voir [/concepts/model-providers](/fr/concepts/model-providers) et [/environment](/fr/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions et multiples chats

<AccordionGroup>
  <Accordion title="Comment démarrer une nouvelle conversation ?">
    Envoyez `/new` ou `/reset` comme message autonome. Voir [Gestion des sessions](/fr/concepts/session).
  </Accordion>

  <Accordion title="Les sessions se réinitialisent-elles automatiquement si je n’envoie jamais /new ?">
    Les sessions peuvent expirer après `session.idleMinutes`, mais cela est **désactivé par défaut** (valeur par défaut **0**).
    Définissez une valeur positive pour activer l’expiration sur inactivité. Lorsqu’elle est activée, le **message suivant**
    après la période d’inactivité démarre un nouvel ID de session pour cette clé de chat.
    Cela ne supprime pas les transcriptions - cela démarre simplement une nouvelle session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Existe-t-il un moyen de faire une équipe d’instances OpenClaw (un CEO et beaucoup d’agents) ?">
    Oui, via le **routage multi-agent** et les **sub-agents**. Vous pouvez créer un agent
    coordinateur et plusieurs agents workers avec leurs propres workspaces et modèles.

    Cela dit, il vaut mieux voir cela comme une **expérience amusante**. C’est gourmand en jetons et souvent
    moins efficace que d’utiliser un seul bot avec des sessions séparées. Le modèle typique que nous
    imaginons est un bot avec lequel vous parlez, avec différentes sessions pour le travail parallèle. Ce
    bot peut aussi lancer des sub-agents si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Sub-agents](/fr/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Pourquoi le contexte a-t-il été tronqué en pleine tâche ? Comment l’éviter ?">
    Le contexte de session est limité par la fenêtre du modèle. Les longs chats, les grosses sorties d’outils ou de nombreux
    fichiers peuvent déclencher une compaction ou une troncature.

    Ce qui aide :

    - Demandez au bot de résumer l’état actuel et de l’écrire dans un fichier.
    - Utilisez `/compact` avant les longues tâches, et `/new` quand vous changez de sujet.
    - Gardez le contexte important dans le workspace et demandez au bot de le relire.
    - Utilisez des sub-agents pour les tâches longues ou parallèles afin que le chat principal reste plus petit.
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

    Notes :

    - L’onboarding propose aussi **Reset** s’il détecte une configuration existante. Voir [Onboarding (CLI)](/fr/start/wizard).
    - Si vous avez utilisé des profils (`--profile` / `OPENCLAW_PROFILE`), réinitialisez chaque répertoire d’état (les valeurs par défaut sont `~/.openclaw-<profile>`).
    - Réinitialisation dev : `openclaw gateway --dev --reset` (dev uniquement ; efface configuration dev + identifiants + sessions + workspace).

  </Accordion>

  <Accordion title='J’obtiens des erreurs "context too large" - comment réinitialiser ou compacter ?'>
    Utilisez l’une de ces options :

    - **Compacter** (garde la conversation mais résume les anciens tours) :

      ```
      /compact
      ```

      ou `/compact <instructions>` pour guider le résumé.

    - **Réinitialiser** (nouvel ID de session pour la même clé de chat) :

      ```
      /new
      /reset
      ```

    Si cela continue d’arriver :

    - Activez ou ajustez **l’élagage de session** (`agents.defaults.contextPruning`) pour couper les anciennes sorties d’outils.
    - Utilisez un modèle avec une fenêtre de contexte plus grande.

    Docs : [Compaction](/fr/concepts/compaction), [Élagage de session](/fr/concepts/session-pruning), [Gestion des sessions](/fr/concepts/session).

  </Accordion>

  <Accordion title='Pourquoi vois-je "LLM request rejected: messages.content.tool_use.input field required" ?'>
    Il s’agit d’une erreur de validation du provider : le modèle a émis un bloc `tool_use` sans le
    `input` requis. Cela signifie généralement que l’historique de session est obsolète ou corrompu (souvent après de longs fils
    ou un changement de schéma/d’outil).

    Correctif : démarrez une nouvelle session avec `/new` (message autonome).

  </Accordion>

  <Accordion title="Pourquoi reçois-je des messages heartbeat toutes les 30 minutes ?">
    Les heartbeats s’exécutent toutes les **30m** par défaut (**1h** lors de l’utilisation d’une auth OAuth). Ajustez ou désactivez-les :

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // ou "0m" pour désactiver
          },
        },
      },
    }
    ```

    Si `HEARTBEAT.md` existe mais est en pratique vide (uniquement des lignes blanches et des
    en-têtes markdown comme `# Heading`), OpenClaw ignore l’exécution heartbeat pour économiser les appels API.
    Si le fichier est absent, le heartbeat s’exécute quand même et le modèle décide quoi faire.

    Les surcharges par agent utilisent `agents.list[].heartbeat`. Docs : [Heartbeat](/fr/gateway/heartbeat).

  </Accordion>

  <Accordion title='Dois-je ajouter un "compte bot" à un groupe WhatsApp ?'>
    Non. OpenClaw s’exécute sur **votre propre compte**, donc si vous êtes dans le groupe, OpenClaw peut le voir.
    Par défaut, les réponses en groupe sont bloquées jusqu’à ce que vous autorisiez les expéditeurs (`groupPolicy: "allowlist"`).

    Si vous voulez que **vous seul** puissiez déclencher des réponses dans les groupes :

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
    Option 1 (la plus rapide) : suivez les logs et envoyez un message de test dans le groupe :

    ```bash
    openclaw logs --follow --json
    ```

    Recherchez `chatId` (ou `from`) se terminant par `@g.us`, comme :
    `1234567890-1234567890@g.us`.

    Option 2 (si déjà configuré/en allowlist) : lister les groupes depuis la config :

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Docs : [WhatsApp](/fr/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Pourquoi OpenClaw ne répond-il pas dans un groupe ?">
    Deux causes fréquentes :

    - Le filtrage par mention est activé (par défaut). Vous devez @mentionner le bot (ou correspondre à `mentionPatterns`).
    - Vous avez configuré `channels.whatsapp.groups` sans `"*"` et le groupe n’est pas dans la liste d’autorisation.

    Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).

  </Accordion>

  <Accordion title="Les groupes/threads partagent-ils le contexte avec les DM ?">
    Les chats directs se replient sur la session principale par défaut. Les groupes/canaux ont leurs propres clés de session, et les topics Telegram / threads Discord sont des sessions séparées. Voir [Groupes](/fr/channels/groups) et [Messages de groupe](/fr/channels/group-messages).
  </Accordion>

  <Accordion title="Combien de workspaces et d’agents puis-je créer ?">
    Aucune limite stricte. Des dizaines (voire des centaines) conviennent, mais surveillez :

    - **Croissance du disque :** les sessions + transcriptions vivent sous `~/.openclaw/agents/<agentId>/sessions/`.
    - **Coût en jetons :** plus d’agents signifie plus d’utilisation simultanée des modèles.
    - **Surcharge ops :** profils d’auth, workspaces et routage de canal par agent.

    Conseils :

    - Gardez un workspace **actif** par agent (`agents.defaults.workspace`).
    - Épurez les anciennes sessions (supprimez JSONL ou les entrées de stockage) si le disque grossit.
    - Utilisez `openclaw doctor` pour repérer les workspaces errants et les incohérences de profil.

  </Accordion>

  <Accordion title="Puis-je exécuter plusieurs bots ou chats en même temps (Slack), et comment dois-je configurer cela ?">
    Oui. Utilisez le **routage multi-agent** pour exécuter plusieurs agents isolés et router les messages entrants par
    canal/compte/peer. Slack est pris en charge comme canal et peut être lié à des agents spécifiques.

    L’accès au navigateur est puissant mais pas « faire tout ce qu’un humain peut faire » - l’anti-bot, les CAPTCHA et le MFA peuvent
    encore bloquer l’automatisation. Pour le contrôle du navigateur le plus fiable, utilisez Chrome MCP local sur l’hôte,
    ou utilisez CDP sur la machine qui exécute réellement le navigateur.

    Configuration recommandée :

    - Hôte Gateway toujours allumé (VPS/Mac mini).
    - Un agent par rôle (liaisons).
    - Canal/canaux Slack liés à ces agents.
    - Navigateur local via Chrome MCP ou un node si nécessaire.

    Docs : [Routage multi-agent](/fr/concepts/multi-agent), [Slack](/fr/channels/slack),
    [Navigateur](/fr/tools/browser), [Nodes](/fr/nodes).

  </Accordion>
</AccordionGroup>

## Modèles : valeurs par défaut, sélection, alias, bascule

<AccordionGroup>
  <Accordion title='Qu’est-ce que le "modèle par défaut" ?'>
    Le modèle par défaut d’OpenClaw est ce que vous définissez comme :

    ```
    agents.defaults.model.primary
    ```

    Les modèles sont référencés sous la forme `provider/model` (exemple : `openai/gpt-5.4`). Si vous omettez le provider, OpenClaw essaie d’abord un alias, puis une correspondance unique de provider configuré pour cet ID de modèle exact, et seulement ensuite retombe sur le provider par défaut configuré comme chemin de compatibilité déprécié. Si ce provider n’expose plus le modèle par défaut configuré, OpenClaw retombe sur le premier provider/modèle configuré au lieu de faire remonter une valeur par défaut obsolète d’un provider supprimé. Vous devez toutefois **définir explicitement** `provider/model`.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    **Valeur par défaut recommandée :** utilisez le meilleur modèle de dernière génération disponible dans votre pile de providers.
    **Pour les agents avec outils activés ou entrée non fiable :** privilégiez la force du modèle au coût.
    **Pour les conversations routinières / à faible enjeu :** utilisez des modèles de secours moins chers et routez par rôle d’agent.

    MiniMax a sa propre documentation : [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

    Règle générale : utilisez le **meilleur modèle que vous pouvez vous permettre** pour les travaux à fort enjeu, et un modèle moins cher
    pour les conversations de routine ou les résumés. Vous pouvez router les modèles par agent et utiliser des sub-agents pour
    paralléliser les longues tâches (chaque sub-agent consomme des jetons). Voir [Modèles](/fr/concepts/models) et
    [Sub-agents](/fr/tools/subagents).

    Avertissement fort : les modèles plus faibles / trop quantifiés sont plus vulnérables à la prompt
    injection et aux comportements dangereux. Voir [Sécurité](/fr/gateway/security).

    Plus de contexte : [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma config ?">
    Utilisez les **commandes de modèle** ou ne modifiez que les champs **model**. Évitez les remplacements complets de configuration.

    Options sûres :

    - `/model` dans le chat (rapide, par session)
    - `openclaw models set ...` (met à jour seulement la config de modèle)
    - `openclaw configure --section model` (interactif)
    - modifier `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Évitez `config.apply` avec un objet partiel sauf si vous avez l’intention de remplacer toute la config.
    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` et préférez `config.patch`. La charge utile de lookup vous donne le chemin normalisé, la doc/les contraintes du schéma superficiel et les résumés immédiats des enfants.
    pour les mises à jour partielles.
    Si vous avez écrasé la config, restaurez depuis une sauvegarde ou relancez `openclaw doctor` pour réparer.

    Docs : [Modèles](/fr/concepts/models), [Configurer](/cli/configure), [Config](/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui. Ollama est le chemin le plus simple pour les modèles locaux.

    Configuration la plus rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Téléchargez un modèle local tel que `ollama pull glm-4.7-flash`
    3. Si vous voulez aussi des modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard` et choisissez `Ollama`
    5. Choisissez `Local` ou `Cloud + Local`

    Notes :

    - `Cloud + Local` vous donne des modèles cloud plus vos modèles Ollama locaux
    - les modèles cloud tels que `kimi-k2.5:cloud` n’ont pas besoin de téléchargement local
    - pour une bascule manuelle, utilisez `openclaw models list` et `openclaw models set ollama/<model>`

    Note de sécurité : les modèles plus petits ou fortement quantifiés sont plus vulnérables à la prompt
    injection. Nous recommandons fortement de **gros modèles** pour tout bot pouvant utiliser des outils.
    Si vous voulez malgré tout de petits modèles, activez le sandboxing et des listes d’autorisation d’outils strictes.

    Docs : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Providers de modèles](/fr/concepts/model-providers), [Sécurité](/fr/gateway/security),
    [Sandboxing](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quels modèles utilisent OpenClaw, Flawd et Krill ?">
    - Ces déploiements peuvent différer et évoluer dans le temps ; il n’existe pas de recommandation fixe de provider.
    - Vérifiez le paramètre d’exécution actuel sur chaque gateway avec `openclaw models status`.
    - Pour les agents sensibles en matière de sécurité / avec outils activés, utilisez le meilleur modèle de dernière génération disponible.
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

    Vous pouvez aussi forcer un profil d’auth spécifique pour le provider (par session) :

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Conseil : `/model status` affiche quel agent est actif, quel fichier `auth-profiles.json` est utilisé, et quel profil d’auth sera essayé ensuite.
    Il affiche aussi l’endpoint configuré du provider (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

    **Comment désépingler un profil défini avec @profile ?**

    Relancez `/model` **sans** le suffixe `@profile` :

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si vous voulez revenir à la valeur par défaut, sélectionnez-la depuis `/model` (ou envoyez `/model <default provider/model>`).
    Utilisez `/model status` pour confirmer quel profil d’auth est actif.

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.2 pour les tâches quotidiennes et Codex 5.3 pour le code ?">
    Oui. Définissez-en un comme valeur par défaut et basculez selon le besoin :

    - **Bascule rapide (par session) :** `/model gpt-5.4` pour les tâches quotidiennes, `/model openai-codex/gpt-5.4` pour coder avec Codex OAuth.
    - **Par défaut + bascule :** définissez `agents.defaults.model.primary` sur `openai/gpt-5.4`, puis passez à `openai-codex/gpt-5.4` quand vous codez (ou l’inverse).
    - **Sub-agents :** routez les tâches de code vers des sub-agents avec un modèle par défaut différent.

    Voir [Modèles](/fr/concepts/models) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer fast mode pour GPT 5.4 ?">
    Utilisez soit une bascule de session, soit une valeur par défaut de configuration :

    - **Par session :** envoyez `/fast on` pendant que la session utilise `openai/gpt-5.4` ou `openai-codex/gpt-5.4`.
    - **Valeur par défaut par modèle :** définissez `agents.defaults.models["openai/gpt-5.4"].params.fastMode` sur `true`.
    - **Codex OAuth aussi :** si vous utilisez aussi `openai-codex/gpt-5.4`, définissez le même drapeau là aussi.

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

    Pour OpenAI, fast mode correspond à `service_tier = "priority"` sur les requêtes Responses natives prises en charge. Les surcharges de session `/fast` priment sur les valeurs par défaut de configuration.

    Voir [Thinking and fast mode](/fr/tools/thinking) et [OpenAI fast mode](/fr/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Pourquoi est-ce que je vois "Model ... is not allowed" puis aucune réponse ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et toute
    surcharge de session. Choisir un modèle qui n’est pas dans cette liste renvoie :

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Cette erreur est renvoyée **à la place** d’une réponse normale. Correctif : ajoutez le modèle à
    `agents.defaults.models`, supprimez la liste d’autorisation, ou choisissez un modèle dans `/model list`.

  </Accordion>

  <Accordion title='Pourquoi vois-je "Unknown model: minimax/MiniMax-M2.7" ?'>
    Cela signifie que le **provider n’est pas configuré** (aucune configuration MiniMax ou aucun profil
    d’auth trouvé), donc le modèle ne peut pas être résolu.

    Liste de vérification :

    1. Mettez à niveau vers une version OpenClaw actuelle (ou exécutez depuis la source `main`), puis redémarrez la gateway.
    2. Assurez-vous que MiniMax est configuré (assistant ou JSON), ou qu’une auth MiniMax
       existe dans l’environnement/les profils d’auth afin que le provider correspondant puisse être injecté
       (`MINIMAX_API_KEY` pour `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       stocké pour `minimax-portal`).
    3. Utilisez l’ID de modèle exact (sensible à la casse) pour votre chemin d’auth :
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` pour une configuration
       par clé API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` pour une configuration OAuth.
    4. Exécutez :

       ```bash
       openclaw models list
       ```

       et choisissez dans la liste (ou `/model list` dans le chat).

    Voir [MiniMax](/fr/providers/minimax) et [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez **MiniMax comme valeur par défaut** et changez de modèle **par session** lorsque nécessaire.
    Les secours servent aux **erreurs**, pas aux « tâches difficiles », donc utilisez `/model` ou un agent séparé.

    **Option A : bascule par session**

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

    Docs : [Modèles](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent), [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

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

  <Accordion title="Comment définir/remplacer des raccourcis de modèle (aliases) ?">
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

    Ensuite `/model sonnet` (ou `/<alias>` lorsque pris en charge) se résout vers cet ID de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres providers comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement au jeton ; beaucoup de modèles) :

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

    Si vous référencez un provider/modèle mais que la clé provider requise est manquante, vous obtiendrez une erreur d’authentification à l’exécution (par ex. `No API key found for provider "zai"`).

    **No API key found for provider après l’ajout d’un nouvel agent**

    Cela signifie généralement que le **nouvel agent** possède un stockage d’auth vide. L’auth est par agent et
    est stockée dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Options de correction :

    - Exécutez `openclaw agents add <id>` et configurez l’auth pendant l’assistant.
    - Ou copiez `auth-profiles.json` depuis le `agentDir` de l’agent principal vers le `agentDir` du nouvel agent.

    **Ne** réutilisez **pas** `agentDir` entre agents ; cela provoque des collisions auth/session.

  </Accordion>
</AccordionGroup>

## Basculement de modèle et "All models failed"

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Le basculement se fait en deux étapes :

    1. **Rotation des profils d’auth** dans le même provider.
    2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

    Des délais de refroidissement s’appliquent aux profils en échec (backoff exponentiel), afin qu’OpenClaw puisse continuer à répondre même lorsqu’un provider est limité ou en échec temporaire.

    Le compartiment de limitation de débit inclut plus que les simples réponses `429`. OpenClaw
    traite aussi comme dignes de basculement des messages comme `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, et les
    limites périodiques de fenêtre d’usage (`weekly/monthly limit reached`) comme des
    limitations de débit.

    Certaines réponses ressemblant à de la facturation ne sont pas des `402`, et certaines réponses HTTP `402`
    restent aussi dans ce compartiment transitoire. Si un provider renvoie
    un texte explicite de facturation sur `401` ou `403`, OpenClaw peut toujours le garder dans
    la voie facturation, mais les matchers de texte spécifiques au provider restent limités au
    provider qui les possède (par exemple OpenRouter `Key limit exceeded`). Si un message `402`
    ressemble plutôt à une fenêtre d’usage réessayable ou à une
    limite de dépense organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw le traite comme
    `rate_limit