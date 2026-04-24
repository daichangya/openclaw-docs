---
read_when:
    - Nouvelle installation, onboarding bloqué, ou erreurs au premier lancement
    - Choisir l’authentification et les abonnements fournisseur
    - Impossible d’accéder à docs.openclaw.ai, impossible d’ouvrir le tableau de bord, installation bloquée
sidebarTitle: First-run FAQ
summary: 'FAQ : démarrage rapide et configuration du premier lancement — installation, onboarding, authentification, abonnements, échecs initiaux'
title: 'FAQ : configuration du premier lancement'
x-i18n:
    generated_at: "2026-04-24T07:14:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Questions/réponses de démarrage rapide et de premier lancement. Pour les opérations quotidiennes, les modèles, l’authentification, les sessions
  et le dépannage, voir la [FAQ](/fr/help/faq) principale.

  ## Démarrage rapide et configuration du premier lancement

  <AccordionGroup>
  <Accordion title="Je suis bloqué, quel est le moyen le plus rapide de me débloquer ?">
    Utilisez un agent IA local capable de **voir votre machine**. C’est bien plus efficace que de demander
    sur Discord, car la plupart des cas « je suis bloqué » sont des **problèmes de configuration locale ou d’environnement** que
    des assistants distants ne peuvent pas inspecter.

    - **Claude Code** : [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex** : [https://openai.com/codex/](https://openai.com/codex/)

    Ces outils peuvent lire le dépôt, exécuter des commandes, inspecter les journaux et aider à corriger votre configuration
    au niveau machine (PATH, services, permissions, fichiers d’authentification). Donnez-leur le **checkout complet des sources** via
    l’installation hackable (git) :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Cela installe OpenClaw **depuis un checkout git**, afin que l’agent puisse lire le code + la documentation et
    raisonner sur la version exacte que vous exécutez. Vous pouvez toujours revenir à la version stable plus tard
    en relançant l’installateur sans `--install-method git`.

    Astuce : demandez à l’agent de **planifier et superviser** la correction (étape par étape), puis d’exécuter seulement les
    commandes nécessaires. Cela garde les changements limités et plus faciles à auditer.

    Si vous découvrez un vrai bug ou une correction, veuillez ouvrir une issue GitHub ou envoyer une PR :
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Commencez par ces commandes (partagez les sorties lorsque vous demandez de l’aide) :

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Ce qu’elles font :

    - `openclaw status` : instantané rapide de la santé du gateway/de l’agent + configuration de base.
    - `openclaw models status` : vérifie l’authentification fournisseur + la disponibilité des modèles.
    - `openclaw doctor` : valide et répare les problèmes courants de configuration/d’état.

    Autres vérifications CLI utiles : `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Boucle rapide de débogage : [Les 60 premières secondes si quelque chose est cassé](#first-60-seconds-if-something-is-broken).
    Documentation d’installation : [Installer](/fr/install), [Options de l’installateur](/fr/install/installer), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Heartbeat est toujours ignoré. Que signifient les raisons d’ignorance ?">
    Raisons courantes d’ignorance de Heartbeat :

    - `quiet-hours` : en dehors de la plage d’heures actives configurée
    - `empty-heartbeat-file` : `HEARTBEAT.md` existe mais ne contient qu’une structure vide/avec en-têtes uniquement
    - `no-tasks-due` : le mode tâche de `HEARTBEAT.md` est actif mais aucun des intervalles de tâche n’est encore arrivé à échéance
    - `alerts-disabled` : toute la visibilité Heartbeat est désactivée (`showOk`, `showAlerts` et `useIndicator` sont tous désactivés)

    En mode tâche, les horodatages d’échéance ne sont avancés qu’après l’achèvement
    d’une véritable exécution Heartbeat. Les exécutions ignorées ne marquent pas les tâches comme terminées.

    Documentation : [Heartbeat](/fr/gateway/heartbeat), [Automatisation et tâches](/fr/automation).

  </Accordion>

  <Accordion title="Méthode recommandée pour installer et configurer OpenClaw">
    Le dépôt recommande une exécution depuis les sources et l’utilisation de l’onboarding :

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    L’assistant peut aussi construire automatiquement les ressources d’interface. Après l’onboarding, vous exécutez généralement le Gateway sur le port **18789**.

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
    L’assistant ouvre votre navigateur avec une URL de tableau de bord propre (sans jeton) juste après l’onboarding et affiche aussi le lien dans le résumé. Gardez cet onglet ouvert ; s’il ne s’est pas lancé, copiez/collez l’URL affichée sur la même machine.
  </Accordion>

  <Accordion title="Comment authentifier le tableau de bord sur localhost vs à distance ?">
    **Localhost (même machine) :**

    - Ouvrez `http://127.0.0.1:18789/`.
    - Si une authentification par secret partagé est demandée, collez le jeton ou le mot de passe configuré dans les paramètres de Control UI.
    - Source du jeton : `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`).
    - Source du mot de passe : `gateway.auth.password` (ou `OPENCLAW_GATEWAY_PASSWORD`).
    - Si aucun secret partagé n’est encore configuré, générez un jeton avec `openclaw doctor --generate-gateway-token`.

    **Pas sur localhost :**

    - **Tailscale Serve** (recommandé) : gardez l’attachement en loopback, exécutez `openclaw gateway --tailscale serve`, ouvrez `https://<magicdns>/`. Si `gateway.auth.allowTailscale` vaut `true`, les en-têtes d’identité satisfont l’authentification Control UI/WebSocket (sans coller de secret partagé, en supposant un hôte gateway de confiance) ; les API HTTP exigent toujours une authentification par secret partagé sauf si vous utilisez délibérément `none` en ingress privé ou l’authentification HTTP trusted-proxy.
      Les mauvaises tentatives d’authentification concurrentes Serve provenant du même client sont sérialisées avant que le limiteur d’échec d’authentification ne les enregistre, ainsi la seconde mauvaise tentative peut déjà afficher `retry later`.
    - **Attachement tailnet** : exécutez `openclaw gateway --bind tailnet --token "<token>"` (ou configurez une authentification par mot de passe), ouvrez `http://<tailscale-ip>:18789/`, puis collez le secret partagé correspondant dans les paramètres du tableau de bord.
    - **Proxy inverse sensible à l’identité** : gardez le Gateway derrière un trusted proxy non-loopback, configurez `gateway.auth.mode: "trusted-proxy"`, puis ouvrez l’URL du proxy.
    - **Tunnel SSH** : `ssh -N -L 18789:127.0.0.1:18789 user@host` puis ouvrez `http://127.0.0.1:18789/`. L’authentification par secret partagé s’applique toujours via le tunnel ; collez le jeton ou mot de passe configuré si demandé.

    Voir [Tableau de bord](/fr/web/dashboard) et [Surfaces Web](/fr/web) pour les modes d’attachement et les détails d’authentification.

  </Accordion>

  <Accordion title="Pourquoi y a-t-il deux configurations d’approbation d’exécution pour les approbations de chat ?">
    Elles contrôlent des couches différentes :

    - `approvals.exec` : transfère les invites d’approbation vers des destinations de chat
    - `channels.<channel>.execApprovals` : fait agir ce canal comme client d’approbation natif pour les approbations d’exécution

    La politique d’exécution de l’hôte reste le véritable contrôle d’approbation. La configuration de chat contrôle seulement où les
    invites d’approbation apparaissent et comment les gens peuvent répondre.

    Dans la plupart des configurations, vous n’avez **pas** besoin des deux :

    - Si le chat prend déjà en charge les commandes et réponses, `/approve` dans le même chat fonctionne via le chemin partagé.
    - Si un canal natif pris en charge peut déduire les approbateurs en toute sécurité, OpenClaw active désormais automatiquement les approbations natives DM-first lorsque `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`.
    - Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal ; l’agent ne doit inclure une commande manuelle `/approve` que si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin.
    - Utilisez `approvals.exec` uniquement lorsque les invites doivent aussi être transférées vers d’autres chats ou des salons ops explicites.
    - Utilisez `channels.<channel>.execApprovals.target: "channel"` ou `"both"` uniquement lorsque vous voulez explicitement que les invites d’approbation soient publiées dans la salle/le sujet d’origine.
    - Les approbations de Plugin sont encore distinctes : elles utilisent `/approve` dans le même chat par défaut, un transfert facultatif `approvals.plugin`, et seuls certains canaux natifs conservent en plus une gestion native des approbations de Plugin.

    En bref : le transfert sert au routage, la configuration de client natif sert à une UX plus riche spécifique au canal.
    Voir [Approbations d’exécution](/fr/tools/exec-approvals).

  </Accordion>

  <Accordion title="De quel runtime ai-je besoin ?">
    Node **>= 22** est requis. `pnpm` est recommandé. Bun n’est **pas recommandé** pour le Gateway.
  </Accordion>

  <Accordion title="Est-ce que ça fonctionne sur Raspberry Pi ?">
    Oui. Le Gateway est léger — la documentation indique que **512MB-1GB de RAM**, **1 cœur**, et environ **500MB**
    de disque suffisent pour un usage personnel, et précise qu’un **Raspberry Pi 4 peut l’exécuter**.

    Si vous voulez plus de marge (journaux, médias, autres services), **2GB sont recommandés**, mais ce
    n’est pas un minimum strict.

    Astuce : un petit Pi/VPS peut héberger le Gateway, et vous pouvez appairer des **Nodes** sur votre ordinateur portable/téléphone pour
    l’écran/caméra/canvas local ou l’exécution de commandes. Voir [Nodes](/fr/nodes).

  </Accordion>

  <Accordion title="Des conseils pour les installations Raspberry Pi ?">
    Version courte : ça fonctionne, mais attendez-vous à quelques aspérités.

    - Utilisez un OS **64-bit** et gardez Node >= 22.
    - Préférez l’installation **hackable (git)** pour voir les journaux et mettre à jour rapidement.
    - Commencez sans canaux/Skills, puis ajoutez-les un par un.
    - Si vous rencontrez d’étranges problèmes binaires, il s’agit généralement d’un problème de **compatibilité ARM**.

    Documentation : [Linux](/fr/platforms/linux), [Installer](/fr/install).

  </Accordion>

  <Accordion title="C’est bloqué sur wake up my friend / l’onboarding n’aboutit pas. Que faire ?">
    Cet écran dépend du fait que le Gateway soit joignable et authentifié. Le TUI envoie aussi
    automatiquement « Wake up, my friend! » au premier hatch. Si vous voyez cette ligne sans **aucune réponse**
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

    3. Si cela bloque toujours, exécutez :

    ```bash
    openclaw doctor
    ```

    Si le Gateway est distant, assurez-vous que le tunnel/la connexion Tailscale fonctionne et que l’interface
    pointe vers le bon Gateway. Voir [Accès distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Puis-je migrer ma configuration vers une nouvelle machine (Mac mini) sans refaire l’onboarding ?">
    Oui. Copiez le **répertoire d’état** et l’**espace de travail**, puis exécutez Doctor une fois. Cela
    conserve votre bot « exactement identique » (mémoire, historique de session, authentification et état
    de canal) à condition de copier **les deux** emplacements :

    1. Installez OpenClaw sur la nouvelle machine.
    2. Copiez `$OPENCLAW_STATE_DIR` (par défaut : `~/.openclaw`) depuis l’ancienne machine.
    3. Copiez votre espace de travail (par défaut : `~/.openclaw/workspace`).
    4. Exécutez `openclaw doctor` et redémarrez le service Gateway.

    Cela préserve la configuration, les profils d’authentification, les identifiants WhatsApp, les sessions et la mémoire. Si vous êtes en
    mode distant, rappelez-vous que l’hôte gateway possède le stockage des sessions et l’espace de travail.

    **Important :** si vous ne commit/push que votre espace de travail sur GitHub, vous sauvegardez
    **la mémoire + les fichiers bootstrap**, mais **pas** l’historique de session ni l’authentification. Ceux-ci vivent
    sous `~/.openclaw/` (par exemple `~/.openclaw/agents/<agentId>/sessions/`).

    Lié : [Migration](/fr/install/migrating), [Où les choses vivent sur disque](#where-things-live-on-disk),
    [Espace de travail d’agent](/fr/concepts/agent-workspace), [Doctor](/fr/gateway/doctor),
    [Mode distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où puis-je voir les nouveautés de la dernière version ?">
    Consultez le changelog GitHub :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Les entrées les plus récentes sont en haut. Si la section du haut est marquée **Unreleased**, la section datée suivante
    est la dernière version publiée. Les entrées sont regroupées par **Highlights**, **Changes** et
    **Fixes** (plus des sections docs/autres si nécessaire).

  </Accordion>

  <Accordion title="Impossible d’accéder à docs.openclaw.ai (erreur SSL)">
    Certaines connexions Comcast/Xfinity bloquent incorrectement `docs.openclaw.ai` via Xfinity
    Advanced Security. Désactivez-la ou ajoutez `docs.openclaw.ai` à la liste blanche, puis réessayez.
    Merci de nous aider à le débloquer en signalant ici : [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Si vous ne pouvez toujours pas accéder au site, la documentation est dupliquée sur GitHub :
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Différence entre stable et beta">
    **Stable** et **beta** sont des **dist-tags npm**, pas des lignes de code séparées :

    - `latest` = stable
    - `beta` = build précoce pour les tests

    En général, une version stable arrive d’abord sur **beta**, puis une étape explicite
    de promotion déplace cette même version vers `latest`. Les mainteneurs peuvent aussi
    publier directement vers `latest` si nécessaire. C’est pourquoi beta et stable peuvent
    pointer vers la **même version** après promotion.

    Voir ce qui a changé :
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Pour les commandes d’installation en une ligne et la différence entre beta et dev, voir l’accordéon ci-dessous.

  </Accordion>

  <Accordion title="Comment installer la version beta et quelle est la différence entre beta et dev ?">
    **Beta** est le dist-tag npm `beta` (peut correspondre à `latest` après promotion).
    **Dev** est la tête mouvante de `main` (git) ; lorsqu’elle est publiée, elle utilise le dist-tag npm `dev`.

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

    Documentation : [Mise à jour](/fr/cli/update), [Canaux de développement](/fr/install/development-channels),
    [Installer](/fr/install).

  </Accordion>

  <Accordion title="Combien de temps prennent généralement l’installation et l’onboarding ?">
    Ordre de grandeur :

    - **Installation :** 2 à 5 minutes
    - **Onboarding :** 5 à 15 minutes selon le nombre de canaux/modèles que vous configurez

    Si cela bloque, utilisez [Installateur bloqué](#quick-start-and-first-run-setup)
    et la boucle rapide de débogage dans [Je suis bloqué](#quick-start-and-first-run-setup).

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
    # install.ps1 n'a pas encore de drapeau -Verbose dédié.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Plus d’options : [Options de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="L’installation Windows indique git not found ou openclaw not recognized">
    Deux problèmes Windows courants :

    **1) erreur npm spawn git / git not found**

    - Installez **Git for Windows** et assurez-vous que `git` est dans votre PATH.
    - Fermez et rouvrez PowerShell, puis relancez l’installateur.

    **2) openclaw is not recognized après l’installation**

    - Votre dossier bin global npm n’est pas dans le PATH.
    - Vérifiez le chemin :

      ```powershell
      npm config get prefix
      ```

    - Ajoutez ce répertoire à votre PATH utilisateur (pas besoin du suffixe `\bin` sous Windows ; sur la plupart des systèmes, c’est `%AppData%\npm`).
    - Fermez et rouvrez PowerShell après avoir mis à jour le PATH.

    Si vous voulez la configuration Windows la plus fluide, utilisez **WSL2** plutôt que Windows natif.
    Documentation : [Windows](/fr/platforms/windows).

  </Accordion>

  <Accordion title="La sortie exec sous Windows affiche du texte chinois illisible — que dois-je faire ?">
    Il s’agit généralement d’un décalage de page de codes de console dans les shells Windows natifs.

    Symptômes :

    - la sortie `system.run`/`exec` affiche du chinois en mojibake
    - la même commande s’affiche correctement dans un autre profil de terminal

    Solution de contournement rapide dans PowerShell :

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Puis redémarrez le Gateway et réessayez votre commande :

    ```powershell
    openclaw gateway restart
    ```

    Si vous reproduisez encore cela sur la dernière version d’OpenClaw, suivez/signalez-le dans :

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentation n’a pas répondu à ma question — comment obtenir une meilleure réponse ?">
    Utilisez l’**installation hackable (git)** afin d’avoir localement toutes les sources et la documentation, puis demandez
    à votre bot (ou Claude/Codex) _depuis ce dossier_ afin qu’il puisse lire le dépôt et répondre précisément.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Plus de détails : [Installer](/fr/install) et [Options de l’installateur](/fr/install/installer).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur Linux ?">
    Réponse courte : suivez le guide Linux, puis lancez l’onboarding.

    - Chemin rapide Linux + installation du service : [Linux](/fr/platforms/linux).
    - Guide complet : [Prise en main](/fr/start/getting-started).
    - Installateur + mises à jour : [Installation et mises à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Comment installer OpenClaw sur un VPS ?">
    N’importe quel VPS Linux fonctionne. Installez sur le serveur, puis utilisez SSH/Tailscale pour atteindre le Gateway.

    Guides : [exe.dev](/fr/install/exe-dev), [Hetzner](/fr/install/hetzner), [Fly.io](/fr/install/fly).
    Accès distant : [Gateway distant](/fr/gateway/remote).

  </Accordion>

  <Accordion title="Où sont les guides d’installation cloud/VPS ?">
    Nous maintenons un **hub d’hébergement** avec les fournisseurs courants. Choisissez-en un et suivez le guide :

    - [Hébergement VPS](/fr/vps) (tous les fournisseurs en un seul endroit)
    - [Fly.io](/fr/install/fly)
    - [Hetzner](/fr/install/hetzner)
    - [exe.dev](/fr/install/exe-dev)

    Comment cela fonctionne dans le cloud : le **Gateway s’exécute sur le serveur**, et vous y accédez
    depuis votre ordinateur portable/téléphone via la Control UI (ou Tailscale/SSH). Votre état + votre espace de travail
    vivent sur le serveur, donc traitez l’hôte comme la source de vérité et sauvegardez-le.

    Vous pouvez appairer des **Nodes** (Mac/iOS/Android/headless) à ce Gateway cloud pour accéder
    à l’écran/caméra/canvas local ou exécuter des commandes sur votre ordinateur portable tout en gardant le
    Gateway dans le cloud.

    Hub : [Plateformes](/fr/platforms). Accès distant : [Gateway distant](/fr/gateway/remote).
    Nodes : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je demander à OpenClaw de se mettre à jour lui-même ?">
    Réponse courte : **possible, non recommandé**. Le flux de mise à jour peut redémarrer le
    Gateway (ce qui coupe la session active), peut nécessiter un checkout git propre, et
    peut demander une confirmation. Plus sûr : exécuter les mises à jour depuis un shell en tant qu’opérateur.

    Utilisez la CLI :

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Si vous devez absolument automatiser depuis un agent :

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentation : [Mise à jour](/fr/cli/update), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Que fait réellement l’onboarding ?">
    `openclaw onboard` est le chemin de configuration recommandé. En **mode local**, il vous guide à travers :

    - **Configuration modèle/authentification** (OAuth fournisseur, clés API, setup-token Anthropic, plus options de modèles locaux telles que LM Studio)
    - emplacement de l’**espace de travail** + fichiers bootstrap
    - **Paramètres Gateway** (bind/port/auth/tailscale)
    - **Canaux** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, plus plugins de canal intégrés comme QQ Bot)
    - **Installation du daemon** (LaunchAgent sur macOS ; unité utilisateur systemd sur Linux/WSL2)
    - **Vérifications de santé** et sélection des **Skills**

    Il avertit aussi si votre modèle configuré est inconnu ou si l’authentification est absente.

  </Accordion>

  <Accordion title="Ai-je besoin d’un abonnement Claude ou OpenAI pour l’exécuter ?">
    Non. Vous pouvez exécuter OpenClaw avec des **clés API** (Anthropic/OpenAI/autres) ou avec
    des **modèles uniquement locaux** afin que vos données restent sur votre appareil. Les abonnements (Claude
    Pro/Max ou OpenAI Codex) sont des moyens facultatifs d’authentifier ces fournisseurs.

    Pour Anthropic dans OpenClaw, la distinction pratique est :

    - **Clé API Anthropic** : facturation normale de l’API Anthropic
    - **Authentification Claude CLI / abonnement Claude dans OpenClaw** : le personnel Anthropic
      nous a indiqué que cet usage est de nouveau autorisé, et OpenClaw traite l’utilisation de `claude -p`
      comme autorisée pour cette intégration, sauf si Anthropic publie une nouvelle
      politique

    Pour les hôtes gateway de longue durée, les clés API Anthropic restent la configuration la plus
    prévisible. L’OAuth OpenAI Codex est explicitement pris en charge pour les outils externes comme OpenClaw.

    OpenClaw prend aussi en charge d’autres options hébergées de type abonnement, notamment
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, et
    **Z.AI / GLM Coding Plan**.

    Documentation : [Anthropic](/fr/providers/anthropic), [OpenAI](/fr/providers/openai),
    [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax), [Modèles GLM](/fr/providers/glm),
    [Modèles locaux](/fr/gateway/local-models), [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser un abonnement Claude Max sans clé API ?">
    Oui.

    Le personnel Anthropic nous a dit que l’usage de type Claude CLI dans OpenClaw est de nouveau autorisé, donc
    OpenClaw traite l’authentification par abonnement Claude et l’usage de `claude -p` comme autorisés
    pour cette intégration, sauf si Anthropic publie une nouvelle politique. Si vous voulez
    la configuration côté serveur la plus prévisible, utilisez à la place une clé API Anthropic.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement Claude (Claude Pro ou Max) ?">
    Oui.

    Le personnel Anthropic nous a indiqué que cet usage est de nouveau autorisé, donc OpenClaw traite
    la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés pour cette intégration
    sauf si Anthropic publie une nouvelle politique.

    Le setup-token Anthropic reste disponible comme chemin de jeton pris en charge par OpenClaw, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsque c’est disponible.
    Pour les charges de travail de production ou multi-utilisateurs, l’authentification par clé API Anthropic reste le
    choix le plus sûr et le plus prévisible. Si vous voulez d’autres options hébergées de type abonnement
    dans OpenClaw, voir [OpenAI](/fr/providers/openai), [Qwen / Model
    Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), et [Modèles
    GLM](/fr/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Pourquoi est-ce que je vois HTTP 429 rate_limit_error venant d’Anthropic ?">
    Cela signifie que votre **quota/limite de débit Anthropic** est épuisé pour la fenêtre actuelle. Si vous
    utilisez **Claude CLI**, attendez la réinitialisation de la fenêtre ou passez à une offre supérieure. Si vous
    utilisez une **clé API Anthropic**, vérifiez la console Anthropic
    pour l’utilisation/la facturation et augmentez les limites si nécessaire.

    Si le message est spécifiquement :
    `Extra usage is required for long context requests`, la requête essaie d’utiliser
    la bêta 1M de contexte d’Anthropic (`context1m: true`). Cela ne fonctionne que lorsque votre
    identifiant est éligible à la facturation long contexte (facturation par clé API ou
    chemin de connexion Claude OpenClaw avec Extra Usage activé).

    Astuce : définissez un **modèle de repli** afin qu’OpenClaw puisse continuer à répondre pendant qu’un fournisseur est limité par débit.
    Voir [Modèles](/fr/cli/models), [OAuth](/fr/concepts/oauth), et
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/fr/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock est-il pris en charge ?">
    Oui. OpenClaw dispose d’un fournisseur intégré **Amazon Bedrock (Converse)**. Avec les marqueurs d’environnement AWS présents, OpenClaw peut auto-découvrir le catalogue Bedrock streaming/texte et le fusionner comme fournisseur implicite `amazon-bedrock` ; sinon vous pouvez activer explicitement `plugins.entries.amazon-bedrock.config.discovery.enabled` ou ajouter une entrée de fournisseur manuelle. Voir [Amazon Bedrock](/fr/providers/bedrock) et [Fournisseurs de modèles](/fr/providers/models). Si vous préférez un flux de clés géré, un proxy compatible OpenAI devant Bedrock reste une option valide.
  </Accordion>

  <Accordion title="Comment fonctionne l’authentification Codex ?">
    OpenClaw prend en charge **OpenAI Code (Codex)** via OAuth (connexion ChatGPT). Utilisez
    `openai-codex/gpt-5.5` pour l’OAuth Codex via l’exécuteur PI par défaut. Utilisez
    `openai/gpt-5.4` pour l’accès direct actuel par clé API OpenAI. L’accès direct par clé API à GPT-5.5
    est pris en charge une fois qu’OpenAI l’active sur l’API publique ; aujourd’hui
    GPT-5.5 utilise l’abonnement/OAuth via `openai-codex/gpt-5.5` ou des exécutions natives du serveur d’application Codex avec `openai/gpt-5.5` et `embeddedHarness.runtime: "codex"`.
    Voir [Fournisseurs de modèles](/fr/concepts/model-providers) et [Onboarding (CLI)](/fr/start/wizard).
  </Accordion>

  <Accordion title="Pourquoi OpenClaw mentionne-t-il encore openai-codex ?">
    `openai-codex` est l’ID de fournisseur et de profil d’authentification pour l’OAuth ChatGPT/Codex.
    C’est aussi le préfixe explicite du modèle PI pour l’OAuth Codex :

    - `openai/gpt-5.4` = route directe actuelle par clé API OpenAI dans PI
    - `openai/gpt-5.5` = future route directe par clé API une fois qu’OpenAI activera GPT-5.5 sur l’API
    - `openai-codex/gpt-5.5` = route OAuth Codex dans PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = route native du serveur d’application Codex
    - `openai-codex:...` = ID de profil d’authentification, pas une référence de modèle

    Si vous voulez le chemin direct de facturation/limites OpenAI Platform, définissez
    `OPENAI_API_KEY`. Si vous voulez l’authentification par abonnement ChatGPT/Codex, connectez-vous avec
    `openclaw models auth login --provider openai-codex` et utilisez
    des références de modèle `openai-codex/*` pour les exécutions PI.

  </Accordion>

  <Accordion title="Pourquoi les limites OAuth Codex peuvent-elles différer de ChatGPT web ?">
    L’OAuth Codex utilise des fenêtres de quota dépendant du plan gérées par OpenAI. En pratique,
    ces limites peuvent différer de l’expérience site/app ChatGPT, même lorsque
    les deux sont liés au même compte.

    OpenClaw peut afficher les fenêtres actuellement visibles d’utilisation/quota fournisseur dans
    `openclaw models status`, mais il n’invente ni ne normalise les droits ChatGPT web en accès API direct. Si vous voulez le chemin direct de facturation/limites OpenAI Platform, utilisez `openai/*` avec une clé API.

  </Accordion>

  <Accordion title="Prenez-vous en charge l’authentification par abonnement OpenAI (Codex OAuth) ?">
    Oui. OpenClaw prend entièrement en charge **l’OAuth d’abonnement OpenAI Code (Codex)**.
    OpenAI autorise explicitement l’usage de l’OAuth par abonnement dans des outils/flux externes
    comme OpenClaw. L’onboarding peut exécuter le flux OAuth pour vous.

    Voir [OAuth](/fr/concepts/oauth), [Fournisseurs de modèles](/fr/concepts/model-providers), et [Onboarding (CLI)](/fr/start/wizard).

  </Accordion>

  <Accordion title="Comment configurer Gemini CLI OAuth ?">
    Gemini CLI utilise un **flux d’authentification de Plugin**, pas un client id ou secret dans `openclaw.json`.

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

  <Accordion title="Un modèle local convient-il pour des discussions décontractées ?">
    En général non. OpenClaw a besoin d’un grand contexte + d’une forte sécurité ; les petites cartes tronquent et fuient. Si vous y tenez, exécutez la version de modèle **la plus grande** possible en local (LM Studio) et voir [/gateway/local-models](/fr/gateway/local-models). Les modèles plus petits/quantifiés augmentent le risque d’injection de prompt — voir [Sécurité](/fr/gateway/security).
  </Accordion>

  <Accordion title="Comment garder le trafic des modèles hébergés dans une région spécifique ?">
    Choisissez des points de terminaison épinglés par région. OpenRouter expose des options hébergées aux États-Unis pour MiniMax, Kimi et GLM ; choisissez la variante hébergée aux États-Unis pour garder les données dans la région. Vous pouvez toujours lister Anthropic/OpenAI à côté en utilisant `models.mode: "merge"` afin que les modèles de repli restent disponibles tout en respectant le fournisseur régional que vous avez sélectionné.
  </Accordion>

  <Accordion title="Dois-je acheter un Mac Mini pour installer ça ?">
    Non. OpenClaw fonctionne sur macOS ou Linux (Windows via WSL2). Un Mac mini est facultatif — certaines personnes
    en achètent un comme hôte toujours allumé, mais un petit VPS, serveur domestique ou boîtier de type Raspberry Pi fonctionne aussi.

    Vous n’avez besoin d’un Mac **que pour les outils exclusivement macOS**. Pour iMessage, utilisez [BlueBubbles](/fr/channels/bluebubbles) (recommandé) — le serveur BlueBubbles fonctionne sur n’importe quel Mac, et le Gateway peut tourner sur Linux ou ailleurs. Si vous voulez d’autres outils exclusivement macOS, exécutez le Gateway sur un Mac ou appairez un node macOS.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes), [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Ai-je besoin d’un Mac mini pour la prise en charge d’iMessage ?">
    Vous avez besoin d’un **appareil macOS** connecté à Messages. Ce n’est **pas** obligatoirement un Mac mini —
    n’importe quel Mac fonctionne. **Utilisez [BlueBubbles](/fr/channels/bluebubbles)** (recommandé) pour iMessage — le serveur BlueBubbles fonctionne sur macOS, tandis que le Gateway peut tourner sur Linux ou ailleurs.

    Configurations courantes :

    - Exécuter le Gateway sur Linux/VPS, et exécuter le serveur BlueBubbles sur n’importe quel Mac connecté à Messages.
    - Tout exécuter sur le Mac si vous voulez la configuration la plus simple sur une seule machine.

    Documentation : [BlueBubbles](/fr/channels/bluebubbles), [Nodes](/fr/nodes),
    [Mode distant Mac](/fr/platforms/mac/remote).

  </Accordion>

  <Accordion title="Si j’achète un Mac mini pour exécuter OpenClaw, puis-je le connecter à mon MacBook Pro ?">
    Oui. Le **Mac mini peut exécuter le Gateway**, et votre MacBook Pro peut se connecter comme
    **node** (appareil compagnon). Les nodes n’exécutent pas le Gateway — ils fournissent des
    capacités supplémentaires comme screen/camera/canvas et `system.run` sur cet appareil.

    Modèle courant :

    - Gateway sur le Mac mini (toujours allumé).
    - Le MacBook Pro exécute l’application macOS ou un hôte node et s’appaire au Gateway.
    - Utilisez `openclaw nodes status` / `openclaw nodes list` pour le voir.

    Documentation : [Nodes](/fr/nodes), [CLI Nodes](/fr/cli/nodes).

  </Accordion>

  <Accordion title="Puis-je utiliser Bun ?">
    Bun n’est **pas recommandé**. Nous constatons des bugs à l’exécution, surtout avec WhatsApp et Telegram.
    Utilisez **Node** pour des gateways stables.

    Si vous voulez quand même expérimenter avec Bun, faites-le sur un gateway hors production
    sans WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram : que doit contenir allowFrom ?">
    `channels.telegram.allowFrom` correspond à **l’ID utilisateur Telegram de l’expéditeur humain** (numérique). Ce n’est pas le nom d’utilisateur du bot.

    La configuration demande uniquement des ID utilisateur numériques. Si vous avez déjà des entrées héritées `@username` dans la configuration, `openclaw doctor --fix` peut essayer de les résoudre.

    Plus sûr (sans bot tiers) :

    - Envoyez un DM à votre bot, puis exécutez `openclaw logs --follow` et lisez `from.id`.

    API Bot officielle :

    - Envoyez un DM à votre bot, puis appelez `https://api.telegram.org/bot<bot_token>/getUpdates` et lisez `message.from.id`.

    Tiers (moins privé) :

    - Envoyez un DM à `@userinfobot` ou `@getidsbot`.

    Voir [/channels/telegram](/fr/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Plusieurs personnes peuvent-elles utiliser un seul numéro WhatsApp avec différentes instances OpenClaw ?">
    Oui, via le **routage multi-agent**. Associez le **DM** WhatsApp de chaque expéditeur (pair `kind: "direct"`, expéditeur E.164 comme `+15551234567`) à un `agentId` différent, afin que chaque personne dispose de son propre espace de travail et de son propre stockage de session. Les réponses continuent de provenir du **même compte WhatsApp**, et le contrôle d’accès DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) est global par compte WhatsApp. Voir [Routage multi-agent](/fr/concepts/multi-agent) et [WhatsApp](/fr/channels/whatsapp).
  </Accordion>

  <Accordion title='Puis-je avoir un agent "fast chat" et un agent "Opus for coding" ?'>
    Oui. Utilisez le routage multi-agent : donnez à chaque agent son propre modèle par défaut, puis associez les routes entrantes (compte fournisseur ou pairs spécifiques) à chaque agent. Un exemple de configuration se trouve dans [Routage multi-agent](/fr/concepts/multi-agent). Voir aussi [Modèles](/fr/concepts/models) et [Configuration](/fr/gateway/configuration).
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
    Les versions récentes préfixent aussi des répertoires bin utilisateur courants sur les services Linux systemd (par exemple `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) et respectent `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` et `FNM_DIR` lorsqu’ils sont définis.

  </Accordion>

  <Accordion title="Différence entre l’installation git hackable et npm install">
    - **Installation git hackable :** checkout complet des sources, modifiable, idéale pour les contributeurs.
      Vous exécutez les builds localement et pouvez corriger le code/la documentation.
    - **npm install :** installation globale de la CLI, sans dépôt, idéale pour « juste l’exécuter ».
      Les mises à jour proviennent des dist-tags npm.

    Documentation : [Prise en main](/fr/start/getting-started), [Mise à jour](/fr/install/updating).

  </Accordion>

  <Accordion title="Puis-je basculer plus tard entre les installations npm et git ?">
    Oui. Installez l’autre variante, puis exécutez Doctor afin que le service gateway pointe vers le nouveau point d’entrée.
    Cela **ne supprime pas vos données** — cela change seulement l’installation du code OpenClaw. Votre état
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

    Doctor détecte une incompatibilité de point d’entrée du service gateway et propose de réécrire la configuration du service pour qu’elle corresponde à l’installation actuelle (utilisez `--repair` en automatisation).

    Conseils de sauvegarde : voir [Stratégie de sauvegarde](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dois-je exécuter le Gateway sur mon ordinateur portable ou sur un VPS ?">
    Réponse courte : **si vous voulez une fiabilité 24/7, utilisez un VPS**. Si vous voulez la
    solution la plus simple et que le mode veille/redémarrages ne vous gênent pas, exécutez-le localement.

    **Ordinateur portable (Gateway local)**

    - **Avantages :** pas de coût serveur, accès direct aux fichiers locaux, fenêtre de navigateur active.
    - **Inconvénients :** veille/coupures réseau = déconnexions, mises à jour/redémarrages de l’OS interrompent, la machine doit rester éveillée.

    **VPS / cloud**

    - **Avantages :** toujours allumé, réseau stable, pas de problèmes de veille d’ordinateur portable, plus facile à maintenir en fonctionnement.
    - **Inconvénients :** souvent en mode headless (utilisez des captures d’écran), accès distant uniquement aux fichiers, vous devez utiliser SSH pour les mises à jour.

    **Remarque spécifique à OpenClaw :** WhatsApp/Telegram/Slack/Mattermost/Discord fonctionnent tous très bien depuis un VPS. Le seul vrai compromis concerne **le navigateur headless** vs une fenêtre visible. Voir [Browser](/fr/tools/browser).

    **Valeur par défaut recommandée :** VPS si vous avez déjà subi des déconnexions du gateway. Le mode local est excellent lorsque vous utilisez activement le Mac et voulez un accès aux fichiers locaux ou une automatisation UI avec un navigateur visible.

  </Accordion>

  <Accordion title="Est-il important d’exécuter OpenClaw sur une machine dédiée ?">
    Ce n’est pas obligatoire, mais **recommandé pour la fiabilité et l’isolation**.

    - **Hôte dédié (VPS/Mac mini/Pi) :** toujours allumé, moins d’interruptions liées à la veille/aux redémarrages, permissions plus propres, plus facile à maintenir en fonctionnement.
    - **Ordinateur portable/de bureau partagé :** tout à fait acceptable pour les tests et l’usage actif, mais attendez-vous à des pauses lorsque la machine se met en veille ou se met à jour.

    Si vous voulez le meilleur des deux mondes, gardez le Gateway sur un hôte dédié et appairez votre ordinateur portable comme **node** pour les outils locaux screen/camera/exec. Voir [Nodes](/fr/nodes).
    Pour les conseils de sécurité, lisez [Sécurité](/fr/gateway/security).

  </Accordion>

  <Accordion title="Quelles sont les exigences minimales pour un VPS et quel OS recommandez-vous ?">
    OpenClaw est léger. Pour un Gateway de base + un canal de chat :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM, ~500MB de disque.
    - **Recommandé :** 1-2 vCPU, 2GB de RAM ou plus pour de la marge (journaux, médias, canaux multiples). Les outils node et l’automatisation navigateur peuvent être gourmands en ressources.

    OS : utilisez **Ubuntu LTS** (ou tout Debian/Ubuntu moderne). Le chemin d’installation Linux y est le mieux testé.

    Documentation : [Linux](/fr/platforms/linux), [Hébergement VPS](/fr/vps).

  </Accordion>

  <Accordion title="Puis-je exécuter OpenClaw dans une VM et quelles sont les exigences ?">
    Oui. Traitez une VM comme un VPS : elle doit être toujours allumée, joignable, et disposer de suffisamment
    de RAM pour le Gateway et tous les canaux que vous activez.

    Recommandations de base :

    - **Minimum absolu :** 1 vCPU, 1GB de RAM.
    - **Recommandé :** 2GB de RAM ou plus si vous exécutez plusieurs canaux, de l’automatisation navigateur ou des outils média.
    - **OS :** Ubuntu LTS ou un autre Debian/Ubuntu moderne.

    Si vous êtes sur Windows, **WSL2 est la configuration de style VM la plus simple** et offre la meilleure
    compatibilité outillage. Voir [Windows](/fr/platforms/windows), [Hébergement VPS](/fr/vps).
    Si vous exécutez macOS dans une VM, voir [VM macOS](/fr/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Lié

- [FAQ](/fr/help/faq) — la FAQ principale (modèles, sessions, gateway, sécurité, plus)
- [Vue d’ensemble de l’installation](/fr/install)
- [Prise en main](/fr/start/getting-started)
- [Dépannage](/fr/help/troubleshooting)
