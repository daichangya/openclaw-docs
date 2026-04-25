---
read_when:
    - Nouvelle installation, onboarding bloqué ou erreurs au premier lancement
    - Choisir l’authentification et les abonnements du fournisseur
    - Impossible d’accéder à docs.openclaw.ai, impossible d’ouvrir le tableau de bord, installation bloquée
sidebarTitle: First-run FAQ
summary: 'FAQ : démarrage rapide et configuration lors du premier lancement — installation, onboarding, authentification, abonnements, échecs initiaux'
title: 'FAQ : configuration du premier lancement'
x-i18n:
    generated_at: "2026-04-25T18:19:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  Questions-réponses de démarrage rapide et du premier lancement. Pour les opérations quotidiennes, les modèles, l’authentification, les sessions,
  et le dépannage, consultez la [FAQ](/fr/help/faq) principale.

  ## Démarrage rapide et configuration du premier lancement

  <AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local capable de **voir votre machine**. C’est bien plus efficace que de demander
    sur Discord, car la plupart des cas « je suis bloqué » sont des **problèmes de configuration locale ou d’environnement**
    que les personnes qui vous aident à distance ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux, et aider à corriger
    la configuration de votre machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur la **copie complète des sources** via
    l’installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **à partir d’une copie git**, afin que l’agent puisse lire le code et la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pouvez toujours revenir ensuite à la version stable
    en relançant l’installateur sans `--install-method git`.

    Conseil : demandez à l’agent de **planifier et superviser** la correction (étape par étape), puis de n’exécuter que les
    commandes nécessaires. Cela garde les changements limités et plus faciles à auditer.

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

    - `openclaw status` : instantané rapide de l’état du gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification du fournisseur + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/d’état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle de débogage rapide : [Les 60 premières secondes si quelque chose est cassé](#first-60-seconds-if-something-is-broken).
    Documentation d’installation : [Installer](/fr/install), [Options de l’installateur](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continue d’être ignoré. Que signifient les raisons d’ignorance ?">
    Raisons courantes d’ignorance de Heartbeat :

    - `quiet-hours` : en dehors de la fenêtre configurée des heures actives
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide ou uniquement des en-têtes
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif, mais aucun des intervalles de tâche n’est encore dû
    - `alerts-disabled` : toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d’échéance ne sont avancés qu’après la fin
    d’une véritable exécution de Heartbeat.
    Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/fr/gateway/heartbeat), [Automation & Tasks](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande d’exécuter depuis les sources et d’utiliser l’onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L’assistant peut également construire automatiquement les assets de l’interface. Après l’onboarding, vous exécutez généralement le Gateway sur le port **18789**.

    Depuis les sources (contributeurs/dev) :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Si vous n’avez pas encore d’installation globale, exécutez-le via `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Comment ouvrir le tableau de bord après l’onboarding ?">
    L’assistant ouvre votre navigateur avec une URL propre du tableau de bord (sans token) juste après l’onboarding et affiche également le lien dans le récapitulatif. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord sur localhost ou à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - S’il demande une authentification par secret partagé, collez le token ou le mot de passe configuré dans les paramètres de l’UI de contrôle.
    - Source du token : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un token avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : conservez l’association loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification de l’UI de contrôle/WebSocket (pas de secret partagé à coller, hôte Gateway considéré comme de confiance) ; les API HTTP exigent toujours une authentification par secret partagé sauf si vous utilisez délibérément l’entrée privée `none` ou l’authentification HTTP trusted-proxy.
      Les mauvaises tentatives d’authentification Serve simultanées depuis le même client sont sérialisées avant que le limiteur d’échec d’authentification ne les enregistre, donc la deuxième mauvaise tentative peut déjà afficher `retry later`.
    - **Association tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez l’authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse sensible à l’identité** : gardez le Gateway derrière un trusted proxy non-loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours à travers le tunnel ; collez le token ou le mot de passe configuré si on vous le demande.

    Consultez [Dashboard](/fr/web/dashboard) et [Surfaces web](/fr/web) pour les modes d’association et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi existe-t-il deux configurations d’approbation exec pour les approbations par chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les invites d’approbation vers les destinations de chat
    - `channels.<channel>.execApprovals` : fait de ce canal un client d’approbation natif pour les approbations exec

    La politique exec de l’hôte reste la véritable porte d’approbation. La configuration du chat ne contrôle que l’endroit où les invites d’approbation
    apparaissent et la manière dont les utilisateurs peuvent y répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et les réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déterminer les approbateurs en toute sécurité, OpenClaw active désormais automatiquement les approbations natives DM-first lorsque `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`.
    - Lorsque les cartes/boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal ; l’agent ne doit inclure une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement lorsque les invites doivent aussi être transférées à d’autres chats ou à des salons ops explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous souhaitez explicitement que les invites d’approbation soient republiées dans le salon/topic d’origine.
    - Les approbations de Plugin sont encore séparées : elles utilisent par défaut `/approve` dans le même chat, le transfert optionnel `approvals.plugin`, et seuls certains canaux natifs conservent en plus une gestion native des approbations de Plugin.

    En bref : le transfert sert au routage, la configuration du client natif sert à une UX spécifique au canal plus riche.
    Consultez [Approvals Exec](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun n’est **pas recommandé** pour le Gateway.
  </Accordion>

  <Accordion title="Est-ce que cela fonctionne sur Raspberry Pi ?">
    Oui. Le Gateway est léger — la documentation indique que **512 Mo à 1 Go de RAM**, **1 cœur**, et environ **500 Mo**
    de disque suffisent pour un usage personnel, et précise qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2 Go sont recommandés**, mais ce
    n’est pas un minimum strict.

    Conseil : un petit Pi/VPS peut héberger le Gateway, et vous pouvez appairer des **nodes** sur votre ordinateur portable/téléphone pour
    l’écran/la caméra/le canvas locaux ou l’exécution de commandes. Consultez [Nodes](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations sur Raspberry Pi ?">
    En bref : cela fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64 bits** et gardez Node >= 22.
    - Préférez l’installation **hackable (git)** afin de pouvoir voir les journaux et mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d’étranges problèmes binaires, il s’agit généralement d’un problème de **compatibilité ARM**.

    Documentation : [Linux](/fr/platforms/linux), [Installer](/fr/install).

  </Accordion>

  <Accordion title="C’est bloqué sur wake up my friend / l’onboarding n’éclot pas. Que faire ?">
    Cet écran dépend du fait que le Gateway soit joignable et authentifié. Le TUI envoie aussi
    automatiquement « Wake up, my friend! » lors de la première éclosion. Si vous voyez cette ligne **sans réponse**
    et que les tokens restent à 0, l’agent ne s’est jamais exécuté.

    1. Redémarrez le Gateway :

    ```bash
    openclaw gateway restart
    ```

    2. Vérifiez l’état + l’authentification :

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Si cela bloque encore, exécutez :

    ```bash
    openclaw doctor
    ```

    Si le Gateway est distant, assurez-vous que le tunnel/la connexion Tailscale fonctionne et que l’UI
    pointe vers le bon Gateway. Consultez [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et le **workspace**, puis exécutez Doctor une fois. Cela
    permet de conserver votre bot « exactement identique » (mémoire, historique de session, authentification et
    état des canaux) tant que vous copiez **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre workspace (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, n’oubliez pas que l’hôte gateway possède le magasin de sessions et le workspace.

    **Important :** si vous ne committez/poussez que votre workspace sur GitHub, vous sauvegardez
    **la mémoire + les fichiers de bootstrap**, mais **pas** l’historique des sessions ni l’authentification. Ceux-ci se trouvent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Voir aussi : [Migration](/fr/install/migrating), [Où les éléments se trouvent sur le disque](#where-things-live-on-disk),
    [Workspace d’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où puis-je voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    correspond à la dernière version publiée. Les entrées sont regroupées par **Highlights**, **Changes**, et
    **Fixes** (plus des sections docs/autres si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-le ou ajoutez `docs.openclaw.ai` à la liste d’autorisation, puis réessayez.
    Merci de nous aider à le débloquer en le signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas accéder au site, la documentation est répliquée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **dist-tags npm**, pas des lignes de code séparées :

    - `latest` = stable
    - `beta` = build précoce pour les tests

    En général, une release stable arrive d’abord sur **beta**, puis une étape de
    promotion explicite déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement vers `latest` si nécessaire. C’est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d’installation en une ligne et la différence entre beta et dev, consultez l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (il peut correspondre à `latest` après promotion).
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

    Plus de détails : [Canaux de développement](/fr/install/development-channels) et [Options de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment essayer les tout derniers éléments ?">
    Deux options :

    1. **Canal dev (copie git) :**

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

    Documentation : [Mise à jour](/fr/cli/update), [Canaux de développement](/fr/install/development-channels),
    [Installation](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Estimation approximative :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela bloque, utilisez [Installateur bloqué](#quick-start-and-first-run-setup)
    et la boucle de débogage rapide dans [Je suis bloqué](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installateur bloqué ? Comment obtenir plus de retours ?">
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
    # install.ps1 n’a pas encore de flag -Verbose dédié.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d’options : [Options de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="L’installation Windows indique git introuvable ou openclaw non reconnu">
    Deux problèmes Windows courants :

    **1) erreur npm spawn git / git introuvable**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez puis rouvrez PowerShell, puis relancez l’installateur.

    **2) openclaw n’est pas reconnu après l’installation**

    - Votre dossier npm global bin n’est pas dans le PATH.
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
    Il s’agit généralement d’un décalage de page de codes de console dans les shells Windows natifs.

    Symptômes :

    - La sortie `system.run`/`exec` affiche le chinois en mojibake
    - La même commande s’affiche correctement dans un autre profil de terminal

    Solution de contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Redémarrez ensuite le Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez encore ce problème sur la dernière version d’OpenClaw, suivez/signalalez-le ici :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question — comment obtenir une meilleure réponse ?">
    Utilisez l’**installation hackable (git)** afin d’avoir localement l’ensemble des sources et de la documentation, puis posez la question
    à votre bot (ou à Claude/Codex) _depuis ce dossier_ afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installation](/fr/install) et [Options de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l’onboarding.

    - Chemin rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Procédure complète : [Bien démarrer](/fr/start/getting-started).
    - Installateur + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux fonctionne. Installez sur le serveur, puis utilisez SSH/Tailscale pour accéder au Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où se trouvent les guides d’installation cloud/VPS ?">
    Nous maintenons un **hub d’hébergement** avec les fournisseurs les plus courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les fournisseurs au même endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Fonctionnement dans le cloud : le **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via l’UI de contrôle (ou Tailscale/SSH). Votre état et votre workspace
    vivent sur le serveur ; traitez donc l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez appairer des **nodes** (Mac/iOS/Android/headless) à ce Gateway cloud pour accéder
    à l’écran/la caméra/le canvas locaux ou exécuter des commandes sur votre ordinateur portable tout en conservant le
    Gateway dans le cloud.

    Hub : [Plateformes](/fr/platforms). Accès distant : [Gateway distant](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **c’est possible, mais non recommandé**. Le flux de mise à jour peut redémarrer le
    Gateway (ce qui coupe la session active), peut nécessiter une copie git propre, et
    peut demander une confirmation. Plus sûr : exécutez les mises à jour depuis un shell en tant qu’opérateur.

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

    Documentation : [Mise à jour](/fr/cli/update), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le chemin de configuration recommandé. En **mode local**, il vous guide à travers :

    - la **configuration du modèle/de l’authentification** (OAuth fournisseur, clés API, setup-token Anthropic, plus les options de modèles locaux comme LM Studio)
    - l’emplacement du **workspace** + les fichiers de bootstrap
    - les **paramètres du Gateway** (bind/port/auth/tailscale)
    - les **canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus les plugins de canaux intégrés comme QQ Bot)
    - l’**installation du daemon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - les **vérifications de santé** et la sélection des **Skills**

    Il avertit également si votre modèle configuré est inconnu ou si l’authentification est absente.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour exécuter cela ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec
    des **modèles uniquement locaux** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces fournisseurs.

    Pour Anthropic dans OpenClaw, la distinction pratique est la suivante :

    - **Clé API Anthropic** : facturation normale de l’API Anthropic
    - **Authentification Claude CLI / abonnement Claude dans OpenClaw** : le personnel d’Anthropic
      nous a indiqué que cet usage est de nouveau autorisé, et OpenClaw considère l’usage de `claude -p`
      comme approuvé pour cette intégration, sauf si Anthropic publie une nouvelle
      politique

    Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la configuration la plus
    prévisible. L’OAuth OpenAI Codex est explicitement pris en charge pour les outils externes
    comme OpenClaw.

    OpenClaw prend également en charge d’autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, et
    **Z.AI / GLM Coding Plan**.

    Documentation : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Modèles GLM](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé API ?">
    Oui.

    Le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est de nouveau autorisé ; ainsi,
    OpenClaw considère l’authentification par abonnement Claude et l’usage de `claude -p` comme approuvés
    pour cette intégration, sauf si Anthropic publie une nouvelle politique. Si vous souhaitez
    la configuration côté serveur la plus prévisible, utilisez plutôt une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui.

    Le personnel d’Anthropic nous a indiqué que cet usage est de nouveau autorisé ; ainsi, OpenClaw considère
    la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés pour cette intégration
    sauf si Anthropic publie une nouvelle politique.

    Le setup-token Anthropic reste disponible comme chemin de token OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.
    Pour les charges de travail de production ou multi-utilisateurs, l’authentification par clé API Anthropic reste le
    choix le plus sûr et le plus prévisible. Si vous voulez d’autres options hébergées de type abonnement
    dans OpenClaw, consultez [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), et [Modèles
    GLM](/fr/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Pourquoi est-ce que je vois une erreur HTTP 429 rate_limit_error d’Anthropic ?">
    Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre en cours. Si vous
    utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
    utilisez une **clé API Anthropic**, vérifiez la console Anthropic
    pour l’usage/la facturation et augmentez les limites si nécessaire.

    Si le message est précisément :
    `Extra usage is required for long context requests`, la requête essaie d’utiliser
    la bêta 1M de contexte d’Anthropic (`context1m: true`). Cela ne fonctionne que lorsque votre
    identifiant est éligible à la facturation long contexte (facturation par clé API ou
    chemin de connexion Claude OpenClaw avec Extra Usage activé).

    Conseil : définissez un **modèle de secours** afin qu’OpenClaw puisse continuer à répondre pendant qu’un fournisseur est limité par le débit.
    Consultez [Modèles](/fr/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw inclut un fournisseur **Amazon Bedrock (Converse)**. Lorsque les marqueurs d’environnement AWS sont présents, OpenClaw peut découvrir automatiquement le catalogue Bedrock streaming/texte et le fusionner comme fournisseur implicite `amazon-bedrock` ; sinon, vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuelle. Consultez [Amazon Bedrock](/fr/providers/bedrock) et [Fournisseurs de modèles](/fr/providers/models). Si vous préférez un flux de clés géré, un proxy compatible OpenAI devant Bedrock reste une option valable.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). Utilisez
    `openai-codex/gpt-5.5` pour l’OAuth Codex via le runner PI par défaut. Utilisez
    `openai/gpt-5.5` pour un accès direct avec clé API OpenAI. GPT-5.5 peut aussi utiliser
    l’abonnement/OAuth via `openai-codex/gpt-5.5` ou des exécutions natives du serveur d’application Codex
    avec `openai/gpt-5.5` et `embeddedHarness.runtime: "codex"`.
    Consultez [Fournisseurs de modèles](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi OpenClaw mentionne-t-il encore openai-codex ?">
    `openai-codex` est l’identifiant du fournisseur et du profil d’authentification pour l’OAuth ChatGPT/Codex.
    C’est aussi le préfixe de modèle PI explicite pour l’OAuth Codex :

    - `openai/gpt-5.5` = route actuelle directe avec clé API OpenAI dans PI
    - `openai-codex/gpt-5.5` = route OAuth Codex dans PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = route native du serveur d’application Codex
    - `openai-codex:...` = identifiant de profil d’authentification, pas une référence de modèle

    Si vous voulez le chemin direct de facturation/limites OpenAI Platform, définissez
    `OPENAI_API_KEY`. Si vous voulez l’authentification par abonnement ChatGPT/Codex, connectez-vous avec
    `openclaw models auth login --provider openai-codex` et utilisez
    les références de modèle `openai-codex/*` pour les exécutions PI.

  </Accordion>

  <Accordion title="Pourquoi les limites OAuth Codex peuvent-elles différer de ChatGPT web ?">
    L’OAuth Codex utilise des fenêtres de quota gérées par OpenAI et dépendantes du plan. En pratique,
    ces limites peuvent différer de l’expérience sur le site/l’application ChatGPT, même lorsque
    les deux sont liées au même compte.

    OpenClaw peut afficher les fenêtres d’usage/quota actuellement visibles du fournisseur dans
    `openclaw models status`, mais il n’invente ni ne normalise les
    droits ChatGPT web en accès API direct. Si vous voulez le chemin direct de facturation/limites OpenAI Platform,
    utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement OpenAI (OAuth Codex) ?">
    Oui. OpenClaw prend entièrement en charge **l’OAuth d’abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l’usage de l’OAuth d’abonnement dans des outils/workflows externes
    comme OpenClaw. L’onboarding peut exécuter le flux OAuth pour vous.

    Consultez [OAuth](/fr/concepts/oauth), [Fournisseurs de modèles](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer l’OAuth Gemini CLI ?">
    Gemini CLI utilise un **flux d’authentification de Plugin**, pas un client id ni un secret dans `openclaw.json`.

    Étapes :

    1. Installez Gemini CLI localement afin que `gemini` soit dans le `PATH`
       - Homebrew : `brew install gemini-cli`
       - npm : `npm install -g @google/gemini-cli`
    2. Activez le Plugin : `openclaw plugins enable google`
    3. Connectez-vous : `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modèle par défaut après connexion : `google-gemini-cli/gemini-3-flash-preview`
    5. Si les requêtes échouent, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte gateway

    Cela stocke les jetons OAuth dans les profils d’authentification sur l’hôte gateway. Détails : [Fournisseurs de modèles](/fr/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modèle local convient-il pour des conversations occasionnelles ?">
    En général non. OpenClaw a besoin d’un contexte large et d’une sécurité forte ; les petits modèles tronquent et fuient. Si vous y tenez, exécutez la build de modèle **la plus grande** que vous pouvez en localement (LM Studio) et consultez [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d’injection de prompt — consultez [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment conserver le trafic des modèles hébergés dans une région spécifique ?">
    Choisissez des endpoints épinglés à une région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour conserver les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté de ceux-ci en utilisant `models.mode: "merge"` afin que les modèles de secours restent disponibles tout en respectant le fournisseur régional sélectionné.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac mini pour installer cela ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif — certaines personnes
    en achètent un comme hôte toujours allumé, mais un petit VPS, un serveur domestique ou une machine de classe Raspberry Pi fonctionnent aussi.

    Vous n’avez besoin d’un Mac **que pour les outils exclusivement macOS**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) — le serveur BlueBubbles fonctionne sur n’importe quel Mac, et le Gateway peut fonctionner sur Linux ou ailleurs. Si vous voulez d’autres outils exclusivement macOS, exécutez le Gateway sur un Mac ou appairez un Node macOS.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin d’un **appareil macOS** connecté à Messages. Ce n’est **pas** obligatoirement un Mac mini —
    n’importe quel Mac convient. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage — le serveur BlueBubbles fonctionne sur macOS, tandis que le Gateway peut fonctionner sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter le Gateway sur Linux/VPS, et exécuter le serveur BlueBubbles sur n’importe quel Mac connecté à Messages.
    - Exécuter l’ensemble sur le Mac si vous voulez la configuration mono-machine la plus simple.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter le Gateway**, et votre MacBook Pro peut se connecter comme
    **Node** (appareil compagnon). Les nodes n’exécutent pas le Gateway — ils fournissent des
    capacités supplémentaires comme l’écran/la caméra/le canvas et `system.run` sur cet appareil.

    Schéma courant :

    - Gateway sur le Mac mini (toujours allumé).
    - Le MacBook Pro exécute l’application macOS ou un hôte Node et s’appaire au Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Documentation : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun n’est **pas recommandé**. Nous constatons des bugs d’exécution, en particulier avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez malgré tout expérimenter avec Bun, faites-le sur un gateway non productif
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que faut-il mettre dans allowFrom ?">
    `channels.telegram.allowFrom` correspond à **l’identifiant utilisateur Telegram de l’expéditeur humain** (numérique). Ce n’est pas le nom d’utilisateur du bot.

    La configuration demande uniquement des identifiants utilisateur numériques. Si vous avez déjà des entrées héritées `@username` dans la configuration, `openclaw doctor --fix` peut essayer de les résoudre.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    API Bot officielle :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Consultez [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un même numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Associez le **DM** WhatsApp de chaque expéditeur (peer `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne ait son propre workspace et son propre magasin de sessions. Les réponses proviennent toujours du **même compte WhatsApp**, et le contrôle d’accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Consultez [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je exécuter un agent "fast chat" et un agent "Opus for coding" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis associez les routes entrantes (compte fournisseur ou peers spécifiques) à chacun. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Consultez aussi [Modèles](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew fonctionne-t-il sur Linux ?">
    Oui. Homebrew prend en charge Linux (Linuxbrew). Configuration rapide :

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Si vous exécutez OpenClaw via systemd, assurez-vous que le PATH du service inclut `/home/linuxbrew/.linuxbrew/bin` (ou votre préfixe brew) afin que les outils installés par `brew` soient résolus dans les shells non connectés.
    Les builds récentes préfixent également les répertoires bin utilisateur courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation git hackable et npm install">
    - **Installation hackable (git) :** copie complète des sources, modifiable, idéale pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **npm install :** installation CLI globale, sans dépôt, idéale pour « il suffit de l’exécuter ».
      Les mises à jour viennent des dist-tags npm.

    Documentation : [Bien démarrer](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre les installations npm et git ?">
    Oui. Installez l’autre variante, puis exécutez Doctor afin que le service gateway pointe vers le nouvel entrypoint.
    Cela **ne supprime pas vos données** — cela ne change que l’installation du code OpenClaw. Votre état
    (`~/.openclaw`) et votre workspace (`~/.openclaw/workspace`) restent intacts.

    Depuis npm vers git :

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Depuis git vers npm :

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor détecte une incompatibilité de point d’entrée du service gateway et propose de réécrire la configuration du service pour correspondre à l’installation actuelle (utilisez `--repair` dans l’automatisation).

    Conseils de sauvegarde : consultez [Stratégie de sauvegarde](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter le Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24 h/24 et 7 j/7, utilisez un VPS**. Si vous voulez la
    friction la plus faible et que vous acceptez la mise en veille/les redémarrages, exécutez-le localement.

    **Ordinateur portable (Gateway local)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur visible.
    - **Inconvénients :** mise en veille/pertes réseau = déconnexions, mises à jour/redémarrages de l’OS interrompent le service, la machine doit rester éveillée.

    **VPS / cloud**

    - **Avantages :** toujours allumé, réseau stable, pas de problèmes de mise en veille d’ordinateur portable, plus facile à maintenir en fonctionnement.
    - **Inconvénients :** souvent headless (utilisez des captures d’écran), accès uniquement aux fichiers distants, vous devez utiliser SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous très bien sur un VPS. Le seul vrai compromis est **navigateur headless** ou fenêtre visible. Consultez [Navigateur](/fr/tools/browser).

    **Valeur par défaut recommandée :** VPS si vous avez déjà eu des déconnexions du gateway. Le mode local est idéal lorsque vous utilisez activement le Mac et que vous voulez un accès aux fichiers locaux ou une automatisation de l’interface avec un navigateur visible.

  </Accordion>

  <Accordion title="Dans quelle mesure est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais c’est **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours allumé, moins d’interruptions dues à la mise en veille/aux redémarrages, permissions plus propres, plus facile à maintenir en fonctionnement.
    - **Ordinateur portable/de bureau partagé :** tout à fait acceptable pour les tests et l’usage actif, mais attendez-vous à des pauses lorsque la machine se met en veille ou effectue des mises à jour.

    Si vous voulez le meilleur des deux mondes, gardez le Gateway sur un hôte dédié et appairez votre ordinateur portable comme **Node** pour les outils locaux d’écran/caméra/exec. Consultez [Nodes](/fr/nodes).
    Pour les conseils de sécurité, lisez [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et quel OS est recommandé ?">
    OpenClaw est léger. Pour un Gateway de base + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM, ~500 Mo de disque.
    - **Recommandé :** 1 à 2 vCPU, 2 Go de RAM ou plus pour avoir de la marge (journaux, médias, plusieurs canaux). Les outils Node et l’automatisation du navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou toute distribution Debian/Ubuntu moderne). Le parcours d’installation Linux y est le mieux testé.

    Documentation : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours allumée, accessible, et avoir assez de
    RAM pour le Gateway et tous les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1 Go de RAM.
    - **Recommandé :** 2 Go de RAM ou plus si vous exécutez plusieurs canaux, de l’automatisation de navigateur, ou des outils multimédias.
    - **OS :** Ubuntu LTS ou une autre distribution Debian/Ubuntu moderne.

    Si vous êtes sous Windows, **WSL2 est la configuration de type VM la plus simple** et offre la meilleure
    compatibilité des outils. Consultez [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, consultez [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Liens associés

- [FAQ](/fr/help/faq) — la FAQ principale (modèles, sessions, gateway, sécurité, etc.)
- [Vue d’ensemble de l’installation](/fr/install)
- [Bien démarrer](/fr/start/getting-started)
- [Dépannage](/fr/help/troubleshooting)
