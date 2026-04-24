---
read_when:
    - Choisir ou changer de modèles, configurer des alias
    - Débogage du basculement de modèle / « All models failed »
    - Comprendre les profils d’authentification et comment les gérer
sidebarTitle: Models FAQ
summary: 'FAQ : valeurs par défaut des modèles, sélection, alias, bascule, basculement et profils d’authentification'
title: 'FAQ : modèles et authentification'
x-i18n:
    generated_at: "2026-04-24T07:14:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Questions-réponses sur les modèles et les profils d’authentification. Pour la configuration, les sessions, le gateway, les canaux et le dépannage, consultez la [FAQ](/fr/help/faq) principale.

  ## Modèles : valeurs par défaut, sélection, alias, changement

  <AccordionGroup>
  <Accordion title='Qu’est-ce que le "modèle par défaut" ?'>
    Le modèle par défaut d’OpenClaw est celui que vous définissez comme :

    ```
    agents.defaults.model.primary
    ```

    Les modèles sont référencés sous la forme `provider/model` (exemple : `openai/gpt-5.4` ou `openai-codex/gpt-5.5`). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite revient au fournisseur par défaut configuré comme chemin de compatibilité déconseillé. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw revient au premier couple fournisseur/modèle configuré au lieu d’afficher une ancienne valeur par défaut supprimée. Vous devriez quand même définir **explicitement** `provider/model`.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    **Valeur par défaut recommandée :** utilisez le modèle le plus puissant et de dernière génération disponible dans votre pile de fournisseurs.
    **Pour les agents avec outils activés ou recevant des entrées non fiables :** privilégiez la puissance du modèle au coût.
    **Pour le chat courant / à faible enjeu :** utilisez des modèles de repli moins chers et routez selon le rôle de l’agent.

    MiniMax a sa propre documentation : [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

    Règle générale : utilisez le **meilleur modèle que vous pouvez vous permettre** pour les tâches à fort enjeu, et un modèle moins cher
    pour le chat courant ou les résumés. Vous pouvez router les modèles par agent et utiliser des sous-agents pour
    paralléliser les tâches longues (chaque sous-agent consomme des jetons). Voir [Models](/fr/concepts/models) et
    [Sous-agents](/fr/tools/subagents).

    Avertissement important : les modèles plus faibles ou trop quantifiés sont plus vulnérables à l’injection
    de prompt et aux comportements dangereux. Voir [Security](/fr/gateway/security).

    Plus de contexte : [Models](/fr/concepts/models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Utilisez des **commandes de modèle** ou modifiez uniquement les champs **model**. Évitez les remplacements complets de configuration.

    Options sûres :

    - `/model` dans le chat (rapide, par session)
    - `openclaw models set ...` (met à jour uniquement la configuration du modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Évitez `config.apply` avec un objet partiel sauf si vous avez l’intention de remplacer toute la configuration.
    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` et préférez `config.patch`.
    La charge utile de lookup vous donne le chemin normalisé, la documentation/les contraintes superficielles du schéma et les résumés immédiats des enfants.
    pour les mises à jour partielles.
    Si vous avez écrasé la configuration, restaurez depuis une sauvegarde ou relancez `openclaw doctor` pour réparer.

    Documentation : [Models](/fr/concepts/models), [Configure](/fr/cli/configure), [Config](/fr/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui. Ollama est le chemin le plus simple pour les modèles locaux.

    Configuration la plus rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Récupérez un modèle local comme `ollama pull gemma4`
    3. Si vous voulez aussi des modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard` et choisissez `Ollama`
    5. Choisissez `Local` ou `Cloud + Local`

    Remarques :

    - `Cloud + Local` vous donne les modèles cloud ainsi que vos modèles Ollama locaux
    - les modèles cloud comme `kimi-k2.5:cloud` n’ont pas besoin d’un pull local
    - pour un changement manuel, utilisez `openclaw models list` et `openclaw models set ollama/<model>`

    Remarque de sécurité : les modèles plus petits ou fortement quantifiés sont plus vulnérables à l’injection
    de prompt. Nous recommandons fortement les **grands modèles** pour tout bot pouvant utiliser des outils.
    Si vous voulez malgré tout de petits modèles, activez le sandboxing et des listes d’autorisation strictes d’outils.

    Documentation : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Fournisseurs de modèles](/fr/concepts/model-providers), [Security](/fr/gateway/security),
    [Sandboxing](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quels modèles utilisent OpenClaw, Flawd et Krill ?">
    - Ces déploiements peuvent différer et évoluer dans le temps ; il n’existe pas de recommandation fixe de fournisseur.
    - Vérifiez le paramètre runtime actuel sur chaque gateway avec `openclaw models status`.
    - Pour les agents sensibles à la sécurité ou avec outils activés, utilisez le modèle le plus puissant et de dernière génération disponible.
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

    Vous pouvez lister les modèles disponibles avec `/model`, `/model list` ou `/model status`.

    `/model` (et `/model list`) affiche un sélecteur compact numéroté. Sélectionnez par numéro :

    ```
    /model 3
    ```

    Vous pouvez aussi forcer un profil d’authentification spécifique pour le fournisseur (par session) :

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Astuce : `/model status` montre quel agent est actif, quel fichier `auth-profiles.json` est utilisé, et quel profil d’authentification sera tenté ensuite.
    Il montre aussi le point de terminaison configuré du fournisseur (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

    **Comment retirer l’épinglage d’un profil défini avec @profile ?**

    Relancez `/model` **sans** le suffixe `@profile` :

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si vous voulez revenir à la valeur par défaut, sélectionnez-la depuis `/model` (ou envoyez `/model <default provider/model>`).
    Utilisez `/model status` pour confirmer quel profil d’authentification est actif.

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.5 pour les tâches quotidiennes et Codex 5.5 pour le code ?">
    Oui. Définissez-en un comme valeur par défaut et changez selon le besoin :

    - **Changement rapide (par session) :** `/model openai/gpt-5.4` pour les tâches actuelles via l’API OpenAI directe avec clé API ou `/model openai-codex/gpt-5.5` pour les tâches GPT-5.5 Codex OAuth.
    - **Valeur par défaut :** définissez `agents.defaults.model.primary` sur `openai/gpt-5.4` pour l’usage avec clé API ou sur `openai-codex/gpt-5.5` pour l’usage GPT-5.5 Codex OAuth.
    - **Sous-agents :** routez les tâches de code vers des sous-agents avec un autre modèle par défaut.

    L’accès direct par clé API à `openai/gpt-5.5` est pris en charge dès qu’OpenAI active
    GPT-5.5 sur l’API publique. D’ici là, GPT-5.5 est réservé à l’abonnement/OAuth.

    Voir [Models](/fr/concepts/models) et [Slash commands](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer le mode rapide pour GPT 5.5 ?">
    Utilisez soit un basculement de session, soit une valeur par défaut de configuration :

    - **Par session :** envoyez `/fast on` pendant que la session utilise `openai/gpt-5.4` ou `openai-codex/gpt-5.5`.
    - **Valeur par défaut par modèle :** définissez `agents.defaults.models["openai/gpt-5.4"].params.fastMode` ou `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` sur `true`.

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
          },
        },
      },
    }
    ```

    Pour OpenAI, le mode rapide correspond à `service_tier = "priority"` sur les requêtes Responses natives prises en charge. Le `/fast` de session l’emporte sur les valeurs par défaut de configuration.

    Voir [Thinking and fast mode](/fr/tools/thinking) et [OpenAI fast mode](/fr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Pourquoi vois-je "Model ... is not allowed" puis aucune réponse ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et pour tout
    remplacement de session. Choisir un modèle qui n’est pas dans cette liste renvoie :

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Cette erreur est renvoyée **à la place** d’une réponse normale. Correctif : ajoutez le modèle à
    `agents.defaults.models`, supprimez la liste d’autorisation ou choisissez un modèle depuis `/model list`.

  </Accordion>

  <Accordion title='Pourquoi vois-je "Unknown model: minimax/MiniMax-M2.7" ?'>
    Cela signifie que le **fournisseur n’est pas configuré** (aucune configuration MiniMax ni aucun profil
    d’authentification n’a été trouvé), donc le modèle ne peut pas être résolu.

    Liste de vérification :

    1. Mettez à jour vers une version actuelle d’OpenClaw (ou exécutez depuis la source `main`), puis redémarrez le gateway.
    2. Assurez-vous que MiniMax est configuré (assistant ou JSON), ou que l’authentification MiniMax
       existe dans env/profils d’authentification afin que le fournisseur correspondant puisse être injecté
       (`MINIMAX_API_KEY` pour `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax
       stocké pour `minimax-portal`).
    3. Utilisez l’identifiant de modèle exact (sensible à la casse) pour votre chemin d’authentification :
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` pour une
       configuration par clé API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` pour une configuration OAuth.
    4. Exécutez :

       ```bash
       openclaw models list
       ```

       et choisissez dans la liste (ou `/model list` dans le chat).

    Voir [MiniMax](/fr/providers/minimax) et [Models](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez **MiniMax par défaut** et changez de modèle **par session** lorsque nécessaire.
    Les modèles de repli sont là pour les **erreurs**, pas pour les « tâches difficiles », donc utilisez `/model` ou un agent séparé.

    **Option A : changer par session**

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

    - Agent A par défaut : MiniMax
    - Agent B par défaut : OpenAI
    - Routez par agent ou utilisez `/agent` pour changer

    Documentation : [Models](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent), [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sont-ils des raccourcis intégrés ?">
    Oui. OpenClaw fournit quelques raccourcis par défaut (appliqués uniquement lorsque le modèle existe dans `agents.defaults.models`) :

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` pour les configurations avec clé API, ou `openai-codex/gpt-5.5` lorsqu’il est configuré pour Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si vous définissez votre propre alias avec le même nom, votre valeur l’emporte.

  </Accordion>

  <Accordion title="Comment définir/remplacer des raccourcis de modèle (alias) ?">
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

    Ensuite `/model sonnet` (ou `/<alias>` lorsque pris en charge) se résout vers cet identifiant de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres fournisseurs comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement au jeton ; nombreux modèles) :

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

    Si vous référencez un fournisseur/modèle mais que la clé fournisseur requise est absente, vous obtiendrez une erreur d’authentification runtime (par ex. `No API key found for provider "zai"`).

    **No API key found for provider après ajout d’un nouvel agent**

    Cela signifie généralement que le **nouvel agent** a un stockage d’authentification vide. L’authentification est par agent et
    stockée dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Options de correction :

    - Exécutez `openclaw agents add <id>` et configurez l’authentification pendant l’assistant.
    - Ou copiez `auth-profiles.json` depuis le `agentDir` de l’agent principal vers le `agentDir` du nouvel agent.

    Ne réutilisez **pas** `agentDir` entre agents ; cela provoque des collisions d’authentification/session.

  </Accordion>
</AccordionGroup>

## Basculement de modèle et « All models failed »

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Le basculement se produit en deux étapes :

    1. **Rotation de profil d’authentification** au sein du même fournisseur.
    2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

    Des cooldowns s’appliquent aux profils en échec (backoff exponentiel), ce qui permet à OpenClaw de continuer à répondre même lorsqu’un fournisseur est limité en débit ou temporairement en échec.

    Le compartiment de limitation de débit inclut plus que de simples réponses `429`. OpenClaw
    traite aussi des messages comme `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, ainsi que les
    limites périodiques de fenêtre d’utilisation (`weekly/monthly limit reached`) comme
    des limitations de débit justifiant un basculement.

    Certaines réponses ayant l’air liées à la facturation ne sont pas des `402`, et certaines réponses HTTP `402`
    restent aussi dans ce compartiment transitoire. Si un fournisseur renvoie
    un texte explicite de facturation sur `401` ou `403`, OpenClaw peut tout de même maintenir cela dans
    le couloir de facturation, mais les correspondances de texte spécifiques au fournisseur restent limitées au
    fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Si un message `402`
    ressemble plutôt à une fenêtre d’utilisation retentable ou à une
    limite de dépense d’organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw le traite comme
    `rate_limit`, et non comme une désactivation longue liée à la facturation.

    Les erreurs de dépassement de contexte sont différentes : des signatures comme
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, ou `ollama error: context length
    exceeded` restent sur le chemin compaction/nouvelle tentative au lieu d’avancer dans le repli de modèle.

    Le texte générique d’erreur serveur est intentionnellement plus étroit que « tout ce qui
    contient unknown/error ». OpenClaw traite bien des formes transitoires limitées au fournisseur
    telles que le simple `An unknown error occurred` d’Anthropic, le simple
    `Provider returned error` d’OpenRouter, les erreurs de stop-reason comme `Unhandled stop reason:
    error`, les charges utiles JSON `api_error` avec un texte serveur transitoire
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), ainsi que les erreurs de fournisseur occupé telles que `ModelNotReadyException` comme
    des signaux de délai d’attente/surcharge justifiant un basculement lorsque le contexte fournisseur
    correspond.
    Le texte générique de repli interne comme `LLM request failed with an unknown
    error.` reste conservateur et ne déclenche pas à lui seul le repli de modèle.

  </Accordion>

  <Accordion title='Que signifie "No credentials found for profile anthropic:default" ?'>
    Cela signifie que le système a tenté d’utiliser l’ID de profil d’authentification `anthropic:default`, mais n’a pas pu trouver d’identifiants pour celui-ci dans le stockage attendu.

    **Liste de vérification :**

    - **Confirmez où vivent les profils d’authentification** (nouveaux vs anciens chemins)
      - Actuel : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Hérité : `~/.openclaw/agent/*` (migré par `openclaw doctor`)
    - **Confirmez que votre variable d’environnement est chargée par le Gateway**
      - Si vous définissez `ANTHROPIC_API_KEY` dans votre shell mais exécutez le Gateway via systemd/launchd, il se peut qu’il n’en hérite pas. Placez-la dans `~/.openclaw/.env` ou activez `env.shellEnv`.
    - **Assurez-vous de modifier le bon agent**
      - Les configurations multi-agent signifient qu’il peut y avoir plusieurs fichiers `auth-profiles.json`.
    - **Vérifiez l’état du modèle/de l’authentification**
      - Utilisez `openclaw models status` pour voir les modèles configurés et si les fournisseurs sont authentifiés.

    **Liste de vérification pour "No credentials found for profile anthropic"**

    Cela signifie que l’exécution est épinglée à un profil d’authentification Anthropic, mais que le Gateway
    ne parvient pas à le trouver dans son stockage d’authentification.

    - **Utilisez Claude CLI**
      - Exécutez `openclaw models auth login --provider anthropic --method cli --set-default` sur l’hôte du gateway.
    - **Si vous voulez utiliser une clé API à la place**
      - Placez `ANTHROPIC_API_KEY` dans `~/.openclaw/.env` sur l’**hôte gateway**.
      - Effacez tout ordre épinglé qui force un profil manquant :

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirmez que vous exécutez les commandes sur l’hôte gateway**
      - En mode distant, les profils d’authentification vivent sur la machine gateway, pas sur votre portable.

  </Accordion>

  <Accordion title="Pourquoi a-t-il aussi essayé Google Gemini puis échoué ?">
    Si votre configuration de modèle inclut Google Gemini comme modèle de repli (ou si vous avez basculé vers un raccourci Gemini), OpenClaw l’essaiera pendant le repli de modèle. Si vous n’avez pas configuré les identifiants Google, vous verrez `No API key found for provider "google"`.

    Correctif : fournissez une authentification Google, ou supprimez/évitez les modèles Google dans `agents.defaults.model.fallbacks` / les alias afin que le repli n’y soit pas routé.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Cause : l’historique de session contient des **blocs de réflexion sans signature** (souvent issus d’un
    flux interrompu/partiel). Google Antigravity exige des signatures pour les blocs de réflexion.

    Correctif : OpenClaw retire désormais les blocs de réflexion non signés pour Google Antigravity Claude. Si cela apparaît encore, démarrez une **nouvelle session** ou définissez `/thinking off` pour cet agent.

  </Accordion>
</AccordionGroup>

## Profils d’authentification : ce qu’ils sont et comment les gérer

Associé : [/concepts/oauth](/fr/concepts/oauth) (flux OAuth, stockage des jetons, modèles multi-comptes)

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’un profil d’authentification ?">
    Un profil d’authentification est un enregistrement nommé d’identifiants (OAuth ou clé API) lié à un fournisseur. Les profils vivent dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quels sont les ID de profil typiques ?">
    OpenClaw utilise des ID préfixés par le fournisseur comme :

    - `anthropic:default` (courant lorsqu’aucune identité e-mail n’existe)
    - `anthropic:<email>` pour les identités OAuth
    - des ID personnalisés de votre choix (par ex. `anthropic:work`)

  </Accordion>

  <Accordion title="Puis-je contrôler quel profil d’authentification est essayé en premier ?">
    Oui. La configuration prend en charge des métadonnées facultatives pour les profils et un ordre par fournisseur (`auth.order.<provider>`). Cela ne stocke **pas** les secrets ; cela mappe des ID à fournisseur/mode et définit l’ordre de rotation.

    OpenClaw peut temporairement ignorer un profil s’il est dans un court **cooldown** (limitations de débit/délais d’attente/échecs d’authentification) ou dans un état **disabled** plus long (facturation/crédits insuffisants). Pour l’inspecter, exécutez `openclaw models status --json` et vérifiez `auth.unusableProfiles`. Réglage : `auth.cooldowns.billingBackoffHours*`.

    Les cooldowns de limitation de débit peuvent être limités au modèle. Un profil en cooldown
    pour un modèle peut rester utilisable pour un modèle frère chez le même fournisseur,
    tandis que les fenêtres de facturation/désactivation bloquent toujours l’ensemble du profil.

    Vous pouvez également définir un remplacement d’ordre **par agent** (stocké dans `auth-state.json` de cet agent) via la CLI :

    ```bash
    # Utilise par défaut l'agent par défaut configuré (omettez --agent)
    openclaw models auth order get --provider anthropic

    # Verrouiller la rotation sur un seul profil (n'essayer que celui-ci)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou définir un ordre explicite (repli au sein du fournisseur)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Effacer le remplacement (retour à config auth.order / round-robin)
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

  <Accordion title="OAuth vs clé API - quelle différence ?">
    OpenClaw prend en charge les deux :

    - **OAuth** exploite souvent l’accès par abonnement (le cas échéant).
    - **Les clés API** utilisent une facturation au jeton.

    L’assistant prend explicitement en charge Anthropic Claude CLI, OpenAI Codex OAuth et les clés API.

  </Accordion>
</AccordionGroup>

## Associé

- [FAQ](/fr/help/faq) — la FAQ principale
- [FAQ — démarrage rapide et configuration au premier lancement](/fr/help/faq-first-run)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
