---
read_when:
    - Création ou débogage de plugins OpenClaw natifs
    - Compréhension du modèle de capacités des plugins ou des limites de propriété
    - Travail sur le pipeline de chargement ou le registre des plugins
    - Implémentation de hooks runtime de fournisseur ou de plugins de canal
sidebarTitle: Internals
summary: 'Internes des plugins : modèle de capacités, propriété, contrats, pipeline de chargement et assistants runtime'
title: Internes des plugins
x-i18n:
    generated_at: "2026-04-05T12:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes des plugins

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour des guides pratiques, consultez :
  - [Installer et utiliser des plugins](/tools/plugin) — guide utilisateur
  - [Premiers pas](/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d’ensemble du SDK](/plugins/sdk-overview) — carte d’importation et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins OpenClaw.

## Modèle public de capacités

Les capacités constituent le modèle public de **plugin natif** dans OpenClaw. Chaque
plugin OpenClaw natif s’enregistre contre un ou plusieurs types de capacités :

| Capacité              | Méthode d’enregistrement                         | Exemples de plugins                   |
| --------------------- | ------------------------------------------------ | ------------------------------------- |
| Inférence de texte    | `api.registerProvider(...)`                      | `openai`, `anthropic`                 |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                 |
| Voix                  | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`             |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voix en temps réel    | `api.registerRealtimeVoiceProvider(...)`         | `openai`                              |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                    |
| Génération d’images   | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax`  |
| Génération de vidéo   | `api.registerVideoGenerationProvider(...)`       | `qwen`                                |
| Web fetch             | `api.registerWebFetchProvider(...)`              | `firecrawl`                           |
| Recherche web         | `api.registerWebSearchProvider(...)`             | `google`                              |
| Canal / messagerie    | `api.registerChannel(...)`                       | `msteams`, `matrix`                   |

Un plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou des
services est un plugin **hérité hook-only**. Ce modèle reste entièrement pris en charge.

### Position actuelle sur la compatibilité externe

Le modèle de capacités est intégré au core et utilisé aujourd’hui par les plugins
groupés/natifs, mais la compatibilité des plugins externes nécessite encore un niveau
d’exigence plus élevé que « c’est exporté, donc c’est figé ».

Recommandations actuelles :

- **plugins externes existants :** maintenir le fonctionnement des intégrations basées sur les hooks ; considérer cela comme la référence de compatibilité
- **nouveaux plugins groupés/natifs :** préférer l’enregistrement explicite des capacités plutôt que des accès spécifiques à un fournisseur ou de nouveaux designs hook-only
- **plugins externes adoptant l’enregistrement de capacités :** autorisé, mais considérer les surfaces d’assistance spécifiques à une capacité comme évolutives sauf si la documentation marque explicitement le contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités constituent la direction voulue
- les hooks hérités restent la voie la plus sûre pour éviter les ruptures pour les plugins externes pendant la transition
- tous les sous-chemins d’assistance exportés ne se valent pas ; préférez le contrat étroit documenté, pas les exports d’assistance accidentels

### Formes de plugins

OpenClaw classe chaque plugin chargé dans une forme selon son comportement
réel d’enregistrement (et pas seulement selon les métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un plugin fournisseur uniquement comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple `openai` gère l’inférence de texte, la voix, la compréhension des médias et la génération d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités, outils, commandes ni services
- **non-capability** -- enregistre des outils, commandes, services ou routes, mais pas de capacités

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et la
répartition de ses capacités. Consultez [Référence CLI](/cli/plugins#inspect) pour les détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour
les plugins hook-only. Des plugins hérités du monde réel en dépendent encore.

Orientation :

- le maintenir fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de l’invite
- ne le supprimer qu’une fois que l’usage réel aura baissé et que la couverture des fixtures prouvera la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’un de ces libellés :

| Signal                     | Signification                                                |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | La configuration s’analyse correctement et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est obsolète     |
| **hard error**             | La configuration est invalide ou le plugin n’a pas pu se charger |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est informatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d’espace de travail,
   des racines globales d’extensions et des extensions groupées. La découverte lit d’abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le core décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un slot exclusif tel que la mémoire.
3. **Chargement runtime**
   Les plugins OpenClaw natifs sont chargés en processus via jiti et enregistrent des
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code runtime.
4. **Consommation des surfaces**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration des fournisseurs,
   hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins en particulier, la découverte des commandes racine est divisée en deux phases :

- les métadonnées au moment de l’analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le véritable module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela permet de garder le code CLI possédé par le plugin à l’intérieur du plugin tout en laissant OpenClaw
réserver les noms de commandes racine avant l’analyse.

Limite de conception importante :

- la découverte + validation de configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du plugin
- le comportement runtime natif provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et
de construire les indications UI/schéma avant que le runtime complet ne soit actif.

### Plugins de canal et outil message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé d’envoi/édition/réaction pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le core, et
les plugins de canal possèdent la découverte et l’exécution spécifiques au canal derrière celui-ci.

La limite actuelle est la suivante :

- le core possède l’hôte de l’outil `message` partagé, le câblage de l’invite, la comptabilité des sessions/fils
  et la distribution de l’exécution
- les plugins de canal possèdent la découverte des actions dans leur portée, la découverte des capacités,
  et les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire spécifique au fournisseur pour les conversations de session, par exemple
  la manière dont les identifiants de conversation encodent les identifiants de fil ou héritent des conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin de renvoyer ses actions visibles, ses capacités et ses contributions de schéma
ensemble afin que ces éléments ne divergent pas.

Le core transmet la portée runtime dans cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

Cela est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message selon le compte actif, le salon/fil/message courant, ou
l’identité de confiance du demandeur, sans coder en dur des branches spécifiques au canal dans l’outil `message` du core.

C’est la raison pour laquelle les modifications de routage embedded-runner restent un travail de plugin : le runner est
responsable de transmettre l’identité du chat/de la session en cours dans la limite de découverte du plugin afin que l’outil `message` partagé expose la bonne surface
possédée par le canal pour le tour courant.

Pour les assistants d’exécution possédés par un canal, les plugins groupés doivent garder le runtime d’exécution
dans leurs propres modules d’extension. Le core ne possède plus les runtimes
d’action de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les plugins groupés
doivent importer directement leur propre code runtime local depuis leurs
modules possédés par l’extension.

La même limite s’applique de manière générale aux coutures SDK nommées par fournisseur : le core ne
doit pas importer de barils de commodité spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp ou d’autres extensions similaires. Si le core a besoin d’un comportement, il doit soit
consommer le propre baril `api.ts` / `runtime-api.ts` du plugin groupé, soit
promouvoir le besoin dans une capacité générique étroite dans le SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle
  commun de sondage
- `actions.handleAction("poll")` est le chemin préféré pour les sémantiques de sondage propres au canal ou les paramètres supplémentaires de sondage

Le core diffère désormais l’analyse partagée des sondages jusqu’à ce que la distribution de sondage du plugin refuse
l’action, afin que les gestionnaires de sondage possédés par un plugin puissent accepter des
champs de sondage propres au canal sans être bloqués d’abord par l’analyseur générique des sondages.

Consultez [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de propriété des capacités

OpenClaw considère un plugin natif comme la limite de propriété pour une **entreprise** ou une
**fonctionnalité**, et non comme un assemblage de différentes intégrations sans lien.

Cela signifie :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw de cette entreprise
- un plugin de fonctionnalité doit généralement posséder la surface complète de la fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du core au lieu de réimplémenter ad hoc le comportement des fournisseurs

Exemples :

- le plugin groupé `openai` possède le comportement du fournisseur de modèles OpenAI et le comportement OpenAI
  voix + temps réel + compréhension des médias + génération d’images
- le plugin groupé `elevenlabs` possède le comportement de voix ElevenLabs
- le plugin groupé `microsoft` possède le comportement de voix Microsoft
- le plugin groupé `google` possède le comportement du fournisseur de modèles Google plus le comportement Google
  compréhension des médias + génération d’images + recherche web
- le plugin groupé `firecrawl` possède le comportement web-fetch Firecrawl
- les plugins groupés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin groupé `qwen` possède le comportement du fournisseur de texte Qwen ainsi que le comportement
  compréhension des médias et génération de vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont Twilio de flux média, mais il consomme les capacités partagées voix
  ainsi que transcription temps réel et voix temps réel au lieu d’importer directement des plugins de fournisseur

L’état final recherché est :

- OpenAI vit dans un seul plugin même s’il couvre les modèles texte, la voix, les images et
  la future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur propriétaire ; ils consomment le
  contrat de capacité partagée exposé par le core

Voici la distinction clé :

- **plugin** = limite de propriété
- **capacité** = contrat du core que plusieurs plugins peuvent implémenter ou consommer

Ainsi, si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel fournisseur doit coder en dur la gestion de la vidéo ? ». La première question est
« quel est le contrat de capacité vidéo du core ? ». Une fois ce contrat en place, les plugins
fournisseur peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, l’action correcte consiste généralement à :

1. définir la capacité manquante dans le core
2. l’exposer via l’API/runtime du plugin de manière typée
3. connecter les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseur enregistrer leurs implémentations

Cela garde la propriété explicite tout en évitant un comportement du core dépendant d’un
seul fournisseur ou d’un chemin de code spécifique à un plugin particulier.

### Superposition des capacités

Utilisez ce modèle mental pour décider où le code doit vivre :

- **couche de capacité du core** : orchestration partagée, politique, repli, règles de fusion de configuration,
  sémantiques de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale,
  génération d’images, futurs backends vidéo, points de terminaison d’usage
- **couche de plugin de canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc. qui
  consomme les capacités du core et les présente sur une surface

Par exemple, TTS suit cette forme :

- le core possède la politique TTS au moment de la réponse, l’ordre de repli, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant runtime TTS de téléphonie

Ce même modèle doit être préféré pour les capacités futures.

### Exemple de plugin d’entreprise multi-capacités

Un plugin d’entreprise doit paraître cohérent de l’extérieur. Si OpenClaw possède des
contrats partagés pour les modèles, la voix, la transcription temps réel, la voix en temps réel, la compréhension des médias,
la génération d’images, la génération de vidéo, web fetch et la recherche web,
un fournisseur peut posséder toutes ses surfaces en un seul endroit :

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

L’important n’est pas le nom exact des assistants. C’est la forme qui compte :

- un seul plugin possède la surface du fournisseur
- le core possède toujours les contrats de capacités
- les canaux et plugins de fonctionnalité consomment les assistants `api.runtime.*`, pas le code du fournisseur
- des tests de contrat peuvent vérifier que le plugin a bien enregistré les capacités qu’il prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une seule
capacité partagée. Le même modèle de propriété s’y applique :

1. le core définit le contrat de compréhension des médias
2. les plugins fournisseur enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les canaux et plugins de fonctionnalité consomment le comportement partagé du core au lieu de
   se connecter directement au code du fournisseur

Cela évite d’intégrer dans le core les hypothèses vidéo d’un seul fournisseur. Le plugin possède
la surface du fournisseur ; le core possède le contrat de capacité et le comportement de repli.

La génération de vidéo suit déjà cette même séquence : le core possède le contrat de capacité
typé et l’assistant runtime, et les plugins fournisseur enregistrent des
implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist de déploiement concrète ? Consultez
[Capability Cookbook](/tools/capability-cookbook).

## Contrats et application

La surface API des plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants runtime sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins disposent d’un standard interne unique et stable
- le core peut rejeter des cas de propriété dupliquée comme deux plugins enregistrant le même identifiant de fournisseur
- le démarrage peut afficher des diagnostics exploitables pour les enregistrements mal formés
- les tests de contrat peuvent appliquer la propriété des plugins groupés et éviter les dérives silencieuses

Il existe deux couches d’application :

1. **application de l’enregistrement runtime**
   Le registre des plugins valide les enregistrements pendant le chargement des plugins. Exemples :
   identifiants de fournisseur dupliqués, identifiants de fournisseur voix dupliqués et
   enregistrements mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins groupés sont capturés dans des registres de contrat pendant les tests afin
   qu’OpenClaw puisse vérifier explicitement la propriété. Aujourd’hui, cela est utilisé pour les
   fournisseurs de modèles, fournisseurs de voix, fournisseurs de recherche web et la propriété des enregistrements groupés.

L’effet concret est qu’OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au core et aux canaux de se composer proprement car la propriété est
déclarée, typée et testable plutôt qu’implicite.

### Ce qui doit entrer dans un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le core
- réutilisables par plusieurs plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique à un fournisseur cachée dans le core
- des échappatoires spécifiques à un plugin qui contournent le registre
- du code de canal qui atteint directement une implémentation fournisseur
- des objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  `api.runtime`

En cas de doute, élevez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le même processus** que la passerelle. Ils ne sont pas
sandboxés. Un plugin natif chargé a la même limite de confiance au niveau du processus que
le code du core.

Implications :

- un plugin natif peut enregistrer des outils, gestionnaires réseau, hooks et services
- un bug de plugin natif peut faire planter ou déstabiliser la passerelle
- un plugin natif malveillant équivaut à une exécution de code arbitraire à l’intérieur du processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut car OpenClaw les traite actuellement
comme des packs de métadonnées/de contenu. Dans les versions actuelles, cela signifie
principalement les Skills groupés.

Utilisez des listes d’autorisation et des chemins d’installation/de chargement explicites pour les plugins non groupés. Traitez
les plugins d’espace de travail comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de package d’espace de travail groupés, gardez l’identifiant du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de plugin plus étroit.

Remarque importante sur la confiance :

- `plugins.allow` fait confiance aux **identifiants de plugin**, pas à la provenance de la source.
- Un plugin d’espace de travail avec le même identifiant qu’un plugin groupé masque intentionnellement la copie groupée lorsque ce plugin d’espace de travail est activé / autorisé par liste.
- C’est normal et utile pour le développement local, les tests de patch et les correctifs urgents.

## Limite d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez public l’enregistrement des capacités. Réduisez les exports d’assistance non contractuels :

- sous-chemins d’assistance spécifiques à un plugin groupé
- sous-chemins de plomberie runtime non destinés à une API publique
- assistants de commodité spécifiques à un fournisseur
- assistants de configuration/onboarding qui sont des détails d’implémentation

Certains sous-chemins d’assistance de plugins groupés restent encore dans la carte d’export SDK générée pour des raisons de compatibilité et de maintenance des plugins groupés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et plusieurs coutures `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour les
nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines de plugins candidates
2. lit les manifestes natifs ou de bundle compatible et les métadonnées de package
3. rejette les candidats dangereux
4. normalise la configuration du plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l’activation de chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — alias hérité) et collecte les enregistrements dans le registre des plugins
8. expose le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias hérité de `register` — le chargeur résout la présence de l’un ou l’autre (`def.register ?? def.activate`) et l’appelle au même moment. Tous les plugins groupés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité se produisent **avant** l’exécution runtime. Les candidats sont bloqués
lorsque le point d’entrée s’échappe de la racine du plugin, que le chemin est modifiable par tout le monde, ou que la propriété du chemin semble suspecte pour les plugins non groupés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schéma de configuration ou capacités de bundle déclarés
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de l’interface de contrôle
- afficher les métadonnées d’installation/catalogue

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre
le comportement réel comme les hooks, outils, commandes ou flux de fournisseur.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches en processus pour :

- les résultats de découverte
- les données du registre de manifeste
- les registres de plugins chargés

Ces caches réduisent les surcharges de démarrage brusques et les coûts des commandes répétées. Ils peuvent être considérés comme des caches de performance de courte durée, et non comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des variables globales arbitraires du core. Ils s’enregistrent dans un
registre central des plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC de la passerelle
- les routes HTTP
- les enregistreurs CLI
- les services en arrière-plan
- les commandes possédées par le plugin

Les fonctionnalités du core lisent ensuite ce registre au lieu de parler directement aux modules de plugin.
Cela conserve un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du core -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du core
n’ont besoin que d’un seul point d’intégration : « lire le registre », et non « traiter chaque module de plugin comme un cas particulier ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu’une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison a été approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: la liaison résolue pour les demandes approuvées
- `request`: le résumé de la demande d’origine, l’indication de détachement, l’identifiant de l’expéditeur et les métadonnées de conversation

Ce callback sert uniquement de notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du core.

## Hooks runtime de fournisseur

Les plugins fournisseur ont désormais deux couches :

- métadonnées de manifeste : `providerAuthEnvVars` pour une recherche bon marché de l’authentification par env avant le chargement du runtime, plus `providerAuthChoices` pour des libellés bon marché de l’onboarding/choix d’authentification et des métadonnées CLI avant le chargement du runtime
- hooks au moment de la configuration : `catalog` / ancien `discovery` plus `applyConfigDefaults`
- hooks runtime : `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle d’agent générique, le failover, la gestion des transcriptions et
la politique des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique à un fournisseur sans
nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur possède des identifiants basés sur des variables d’environnement
que les chemins génériques auth/status/model-picker doivent voir sans charger le runtime du plugin.
Utilisez le manifeste `providerAuthChoices` lorsque les surfaces CLI d’onboarding/choix d’authentification
doivent connaître l’identifiant de choix du fournisseur, les libellés de groupe et un câblage d’authentification simple
à un seul indicateur sans charger le runtime du fournisseur. Conservez `envVars` du runtime fournisseur pour les indications destinées aux opérateurs telles que les libellés d’onboarding ou les variables d’installation
client-id/client-secret OAuth.

### Ordre des hooks et utilisation

Pour les plugins de modèle/fournisseur, OpenClaw appelle les hooks approximativement dans cet ordre.
La colonne « Quand utiliser » sert de guide rapide.

| #   | Hook                              | Ce qu’il fait                                                                        | Quand l’utiliser                                                                                                                           |
| --- | --------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du fournisseur dans `models.providers` pendant la génération de `models.json` | Le fournisseur possède un catalogue ou des valeurs par défaut de base URL                                                           |
| 2   | `applyConfigDefaults`             | Appliquer des valeurs par défaut globales possédées par le fournisseur pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’env ou de la sémantique de la famille de modèles du fournisseur |
| --  | _(recherche de modèle intégrée)_  | OpenClaw essaie d’abord le chemin normal registre/catalogue                           | _(pas un hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliser les alias hérités ou preview de model-id avant la recherche               | Le fournisseur possède un nettoyage d’alias avant la résolution canonique du modèle                                                        |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille de fournisseurs avant l’assemblage générique du modèle | Le fournisseur possède un nettoyage du transport pour des identifiants de fournisseur personnalisés dans la même famille de transport |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution runtime/fournisseur           | Le fournisseur a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les assistants groupés de la famille Google complètent aussi les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer des réécritures de compatibilité d’usage du streaming natif aux fournisseurs configurés | Le fournisseur a besoin de correctifs de métadonnées d’usage du streaming natif pilotés par le point de terminaison                |
| 7   | `resolveConfigApiKey`             | Résoudre l’authentification env-marker des fournisseurs configurés avant le chargement de l’authentification runtime | Le fournisseur possède une résolution de clé API env-marker ; `amazon-bedrock` dispose aussi ici d’un résolveur AWS env-marker intégré |
| 8   | `resolveSyntheticAuth`            | Exposer une authentification locale/autohébergée ou adossée à la configuration sans persister de texte brut | Le fournisseur peut fonctionner avec un marqueur d’identifiant synthétique                                                         |
| 9   | `shouldDeferSyntheticProfileAuth` | Abaisser les placeholders synthétiques stockés derrière une authentification adossée à env/config | Le fournisseur stocke des profils synthétiques placeholders qui ne doivent pas gagner la priorité                                      |
| 10  | `resolveDynamicModel`             | Repli synchrone pour des model ids possédés par le fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des model ids arbitraires en amont                                                                           |
| 11  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s’exécute à nouveau               | Le fournisseur a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                         |
| 12  | `normalizeResolvedModel`          | Réécriture finale avant que l’embedded runner n’utilise le modèle résolu             | Le fournisseur a besoin de réécritures de transport tout en utilisant un transport core                                                  |
| 13  | `contributeResolvedModelCompat`   | Contribuer des indicateurs de compatibilité pour des modèles de fournisseur derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur                      |
| 14  | `capabilities`                    | Métadonnées de transcription/outillage possédées par le fournisseur utilisées par la logique partagée du core | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                    |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d’outil avant que l’embedded runner ne les voie               | Le fournisseur a besoin d’un nettoyage du schéma de la famille de transport                                                              |
| 16  | `inspectToolSchemas`              | Faire remonter des diagnostics de schéma possédés par le fournisseur après normalisation | Le fournisseur veut des avertissements de mots-clés sans enseigner au core des règles spécifiques au fournisseur                   |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou à balises                 | Le fournisseur a besoin d’une sortie de raisonnement/finale à balises au lieu de champs natifs                                          |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux | Le fournisseur a besoin de paramètres de requête par défaut ou d’un nettoyage par fournisseur                                       |
| 19  | `createStreamFn`                  | Remplacer complètement le chemin de flux normal par un transport personnalisé         | Le fournisseur a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                  |
| 20  | `wrapStreamFn`                    | Wrapper de flux après application des wrappers génériques                            | Le fournisseur a besoin de wrappers de compatibilité d’en-têtes/corps/modèle sans transport personnalisé                                |
| 21  | `resolveTransportTurnState`       | Attacher des en-têtes ou métadonnées natives par tour de transport                    | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                    |
| 22  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes WebSocket natifs ou une politique de refroidissement de session | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de repli                         |
| 23  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne runtime `apiKey` | Le fournisseur stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée |
| 24  | `refreshOAuth`                    | Remplacement du rafraîchissement OAuth pour des points de terminaison personnalisés ou une politique d’échec de rafraîchissement | Le fournisseur ne correspond pas aux rafraîchisseurs partagés `pi-ai`                                                           |
| 25  | `buildAuthDoctorHint`             | Indication de réparation ajoutée lorsqu’un rafraîchissement OAuth échoue             | Le fournisseur a besoin de consignes de réparation d’authentification après un échec de rafraîchissement                                |
| 26  | `matchesContextOverflowError`     | Correspondance spécifique au fournisseur pour le débordement de fenêtre de contexte   | Le fournisseur a des erreurs brutes de débordement que les heuristiques génériques manqueraient                                         |
| 27  | `classifyFailoverReason`          | Classification spécifique au fournisseur de la raison de failover                     | Le fournisseur peut mapper les erreurs brutes API/transport vers rate-limit/surcharge/etc.                                               |
| 28  | `isCacheTtlEligible`              | Politique de cache d’invite pour les fournisseurs proxy/backhaul                      | Le fournisseur a besoin d’un contrôle TTL spécifique au proxy                                                                            |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante        | Le fournisseur a besoin d’une indication spécifique au fournisseur                                                                       |
| 30  | `suppressBuiltInModel`            | Suppression de modèles amont obsolètes avec indication d’erreur facultative côté utilisateur | Le fournisseur a besoin de masquer des lignes amont obsolètes ou de les remplacer par une indication fournisseur                  |
| 31  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après découverte                    | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                             |
| 32  | `isBinaryThinking`                | Bascule on/off du raisonnement pour les fournisseurs à raisonnement binaire           | Le fournisseur n’expose qu’un raisonnement binaire activé/désactivé                                                                      |
| 33  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour des modèles sélectionnés                 | Le fournisseur veut `xhigh` uniquement sur un sous-ensemble de modèles                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille de modèles spécifique                     | Le fournisseur possède la politique par défaut `/think` pour une famille de modèles                                                      |
| 35  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profils live et la sélection smoke | Le fournisseur possède la correspondance des modèles préférés live/smoke                                                              |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le véritable jeton/clé runtime juste avant l’inférence | Le fournisseur a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                       |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d’usage/facturation pour `/usage` et les surfaces de statut liées | Le fournisseur a besoin d’une analyse personnalisée du jeton de quota/usage ou d’un identifiant d’usage différent                |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser des instantanés spécifiques au fournisseur après résolution de l’authentification | Le fournisseur a besoin d’un point de terminaison d’usage spécifique ou d’un parseur de payload                                  |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d’embedding possédé par le fournisseur pour mémoire/recherche | Le comportement des embeddings mémoire doit vivre avec le plugin fournisseur                                                         |
| 40  | `buildReplayPolicy`               | Renvoyer une politique de replay contrôlant la gestion des transcriptions pour le fournisseur | Le fournisseur a besoin d’une politique de transcription personnalisée (par ex. suppression des blocs de réflexion)              |
| 41  | `sanitizeReplayHistory`           | Réécrire l’historique de replay après le nettoyage générique des transcriptions       | Le fournisseur a besoin de réécritures de replay spécifiques au fournisseur au-delà des assistants partagés de compactage               |
| 42  | `validateReplayTurns`             | Validation ou remodelage final des tours de replay avant l’embedded runner            | Le transport du fournisseur a besoin d’une validation plus stricte après l’assainissement générique                                     |
| 43  | `onModelSelected`                 | Exécuter des effets de bord possédés par le fournisseur après la sélection            | Le fournisseur a besoin de télémétrie ou d’état possédé par le fournisseur lorsqu’un modèle devient actif                              |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin fournisseur correspondant, puis passent à d’autres plugins fournisseur capables de hooks
jusqu’à ce que l’un d’eux modifie effectivement l’identifiant de modèle ou le transport/configuration. Cela permet de
faire fonctionner les shims d’alias/compat sans exiger que l’appelant sache quel
plugin groupé possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de
configuration Google compatible, le normaliseur groupé de configuration Google applique toujours ce nettoyage de compatibilité.

Si le fournisseur a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requête personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks sont destinés au comportement d’un fournisseur qui
s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

### Exemple de fournisseur

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemples intégrés

- Anthropic utilise `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  et `wrapStreamFn` parce qu’il possède la compatibilité future Claude 4.6,
  les indications de famille de fournisseur, les consignes de réparation de l’authentification,
  l’intégration du point de terminaison d’usage, l’éligibilité au cache d’invite, les valeurs par défaut de configuration tenant compte de l’authentification, la politique de réflexion
  par défaut/adaptative de Claude, et la mise en forme de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier`, et `context1m`.
- Les assistants de flux spécifiques à Claude d’Anthropic restent pour l’instant dans la propre couture
  publique `api.ts` / `contract-api.ts` du plugin groupé. Cette surface de package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, et les constructeurs
  de wrapper Anthropic de plus bas niveau au lieu d’élargir le SDK générique autour des règles d’en-tête bêta propres à un fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel`, et
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, et `isModernModelRef`
  parce qu’il possède la compatibilité future GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indications d’authentification sensibles à Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique de réflexion /
  modèle live GPT-5 ; la famille de flux `openai-responses-defaults` possède les
  wrappers partagés natifs OpenAI Responses pour les en-têtes d’attribution,
  `/fast`/`serviceTier`, la verbosité du texte, la recherche web native Codex,
  la mise en forme de payload de compatibilité du raisonnement, et la gestion du contexte Responses.
- OpenRouter utilise `catalog` plus `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est pass-through et peut exposer de nouveaux
  identifiants de modèle avant la mise à jour du catalogue statique d’OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn`, et `isCacheTtlEligible` pour garder hors du core
  les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et la politique de cache d’invite. Sa politique de replay provient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l’injection de raisonnement proxy et les exclusions de modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel`, et
  `capabilities` plus `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu’il
  a besoin d’une connexion par appareil possédée par le fournisseur, d’un comportement de repli de modèle, de particularités de transcription Claude, d’un échange
  jeton GitHub -> jeton Copilot, et d’un point de terminaison d’usage possédé par le fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, et `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il
  s’exécute encore sur les transports OpenAI du core mais possède sa normalisation
  de transport/base URL, sa politique de repli de rafraîchissement OAuth, son choix de transport par défaut,
  ses lignes synthétiques du catalogue Codex, et l’intégration du point de terminaison d’usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` qu’OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le repli de compatibilité future Gemini 3.1,
  la validation native du replay Gemini, l’assainissement de replay bootstrap, le mode de sortie du raisonnement
  à balises, et la correspondance de modèles modernes, tandis que la
  famille de flux `google-thinking` possède la normalisation des payloads de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth`, et
  `fetchUsageSnapshot` pour le formatage des jetons, l’analyse des jetons, et le câblage du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage de replay spécifique à Claude reste
  limité aux identifiants Claude au lieu de tous les transports `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, et `resolveDefaultThinkingLevel` parce qu’il possède
  la classification spécifique Bedrock des erreurs de limitation/pas prêt/débordement de contexte
  pour le trafic Anthropic-sur-Bedrock ; sa politique de replay partage toujours la même
  garde spécifique à Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode, et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu’ils proxifient des modèles
  Gemini via des transports compatibles OpenAI et ont besoin d’un assainissement
  de signature de réflexion Gemini sans validation native du replay Gemini ni réécritures bootstrap.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu’un seul fournisseur possède à la fois
  la sémantique Anthropic-message et OpenAI-compatible ; cela permet de conserver la suppression des blocs de réflexion spécifiques à Claude côté Anthropic tout en rétablissant le mode de sortie du raisonnement en natif, et la famille de flux `minimax-fast-mode` possède
  les réécritures de modèles fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog` plus `wrapStreamFn` parce qu’il utilise encore le transport
  OpenAI partagé mais a besoin d’une normalisation de payload de réflexion possédée par le fournisseur ; la
  famille de flux `moonshot-thinking` mappe la configuration plus l’état `/think` sur son payload de réflexion binaire natif.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn`, et
  `isCacheTtlEligible` parce qu’il a besoin d’en-têtes de requête possédés par le fournisseur,
  de normalisation de payload de raisonnement, d’indications de transcription Gemini, et d’un contrôle TTL de cache Anthropic ; la famille de flux `kilocode-thinking` conserve l’injection de réflexion Kilo sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et les autres identifiants de modèles proxy qui ne prennent pas en charge des payloads de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, et `fetchUsageSnapshot` parce qu’il possède le repli GLM-5,
  les valeurs par défaut `tool_stream`, l’UX de réflexion binaire, la correspondance des modèles modernes, et à la fois
  l’authentification d’usage + la récupération du quota ; la famille de flux `tool-stream-default-on` garde
  le wrapper `tool_stream` activé par défaut hors de la colle écrite à la main par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, et `isModernModelRef`
  parce qu’il possède la normalisation native du transport xAI Responses, les réécritures
  d’alias fast-mode Grok, la valeur par défaut `tool_stream`, le nettoyage strict des outils / payloads de raisonnement, le repli d’authentification pour les outils possédés par le plugin, la résolution future des modèles Grok, et les correctifs de compatibilité possédés par le fournisseur tels que le profil de schéma d’outil xAI, les mots-clés de schéma non pris en charge, `web_search` natif, et le décodage des arguments d’appel d’outil d’entités HTML.
- Mistral, OpenCode Zen, et OpenCode Go utilisent uniquement `capabilities` pour garder
  les particularités de transcription/outillage hors du core.
- Les fournisseurs groupés catalog-only tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que les enregistrements partagés de compréhension des médias et de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` plus des hooks d’usage parce que leur comportement `/usage`
  est possédé par le plugin même si l’inférence s’exécute encore via les transports partagés.

## Assistants runtime

Les plugins peuvent accéder à certains assistants sélectionnés du core via `api.runtime`. Pour TTS :

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Remarques :

- `textToSpeech` renvoie la charge utile de sortie TTS normale du core pour les surfaces fichier/message vocal.
- Utilise la configuration `messages.tts` du core et la sélection du fournisseur.
- Renvoie un tampon audio PCM + la fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour les sélecteurs de voix ou les flux de configuration possédés par le fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que locale, genre et tags de personnalité pour des sélecteurs sensibles au fournisseur.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft ne la prend pas en charge.

Les plugins peuvent aussi enregistrer des fournisseurs de voix via `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Remarques :

- Gardez la politique TTS, le repli et la livraison des réponses dans le core.
- Utilisez les fournisseurs de voix pour le comportement de synthèse possédé par le fournisseur.
- L’entrée héritée Microsoft `edge` est normalisée vers l’identifiant de fournisseur `microsoft`.
- Le modèle de propriété préféré est orienté entreprise : un seul plugin fournisseur peut posséder
  le texte, la voix, l’image et les futurs fournisseurs média à mesure qu’OpenClaw ajoute ces
  contrats de capacités.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un fournisseur de compréhension des médias
typé plutôt qu’un sac générique clé/valeur :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Gardez l’orchestration, le repli, la configuration et le câblage des canaux dans le core.
- Gardez le comportement fournisseur dans le plugin fournisseur.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le core possède le contrat de capacité et l’assistant runtime
  - les plugins fournisseur enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les assistants runtime de compréhension des médias, les plugins peuvent appeler :

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias,
soit l’ancien alias STT :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du core (`tools.media.audio`) et l’ordre de repli du fournisseur.
- Renvoie `{ text: undefined }` lorsqu’aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions en arrière-plan de sous-agents via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des modifications persistantes de session.
- OpenClaw ne respecte ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de repli possédées par un plugin, les opérateurs doivent explicitement activer `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de revenir silencieusement au comportement par défaut.

Pour la recherche web, les plugins peuvent consommer l’assistant runtime partagé au lieu
de dépendre du câblage de l’outil agent :

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Les plugins peuvent aussi enregistrer des fournisseurs de recherche web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Gardez dans le core la sélection du fournisseur, la résolution des identifiants et les sémantiques partagées des requêtes.
- Utilisez les fournisseurs de recherche web pour les transports de recherche spécifiques à un fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper de l’outil agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: générer une image en utilisant la chaîne configurée de fournisseurs de génération d’images.
- `listProviders(...)`: lister les fournisseurs disponibles de génération d’images et leurs capacités.

## Routes HTTP de la passerelle

Les plugins peuvent exposer des points de terminaison HTTP avec `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Champs de la route :

- `path`: chemin de route sous le serveur HTTP de la passerelle.
- `auth`: obligatoire. Utilisez `"gateway"` pour exiger l’authentification normale de la passerelle, ou `"plugin"` pour une authentification / vérification de webhook gérée par le plugin.
- `match`: facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting`: facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler`: renvoyer `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se recouvrent avec différents niveaux `auth` sont rejetées. Gardez les chaînes de repli `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles servent aux webhooks gérés par le plugin / à la vérification de signatures, pas aux appels privilégiés d’assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent dans une portée runtime de requête Gateway, mais cette portée est volontairement conservatrice :
  - l’authentification bearer à secret partagé (`gateway.auth.mode = "token"` / `"password"`) garde les portées runtime des routes de plugin épinglées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) respectent `x-openclaw-scopes` uniquement lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin porteuses d’identité, la portée runtime revient à `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par la passerelle constitue implicitement une surface admin. Si votre route a besoin d’un comportement réservé à l’admin, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’importation du SDK de plugin

Utilisez les sous-chemins du SDK au lieu de l’importation monolithique `openclaw/plugin-sdk` lors de
l’écriture de plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d’enregistrement des plugins.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé orienté plugin.
- `openclaw/plugin-sdk/config-schema` pour l’export du schéma Zod racine de `openclaw.json`
  (`OpenClawSchema`).
- Primitives stables de canal telles que `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, et
  `openclaw/plugin-sdk/webhook-ingress` pour le câblage partagé de configuration/authentification/réponse/webhook.
  `channel-inbound` est l’emplacement partagé pour l’antirebond, la correspondance des mentions,
  le formatage des enveloppes et les assistants de contexte d’enveloppe entrante.
  `channel-setup` est la couture étroite de configuration pour installation facultative.
  `setup-runtime` est la surface de configuration sûre pour le runtime utilisée par `setupEntry` /
  le démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l’importation.
  `setup-adapter-runtime` est la couture d’adaptateur de configuration de compte sensible à l’env.
  `setup-tools` est la petite couture d’assistance CLI/archive/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sous-chemins de domaine tels que `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, et
  `openclaw/plugin-sdk/directory-runtime` pour des assistants runtime/configuration partagés.
  `telegram-command-config` est la couture publique étroite pour la normalisation/validation des
  commandes personnalisées Telegram et reste disponible même si la surface de contrat
  Telegram groupée est temporairement indisponible.
  `text-runtime` est la couture partagée texte/markdown/journalisation, incluant
  la suppression du texte visible par l’assistant, les assistants de rendu/découpage markdown, les assistants d’expurgation,
  les assistants de balises de directive et les utilitaires de texte sûr.
- Les coutures de canal spécifiques à l’approbation doivent préférer un contrat unique `approvalCapability`
  sur le plugin. Le core lit alors l’authentification, la livraison, le rendu et
  le comportement de routage natif des approbations via cette seule capacité au lieu de mélanger
  le comportement d’approbation dans des champs de plugin sans lien.
- `openclaw/plugin-sdk/channel-runtime` est obsolète et ne reste qu’en tant que
  shim de compatibilité pour les anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports de ce shim.
- Les internes des extensions groupées restent privés. Les plugins externes ne doivent utiliser que les sous-chemins `openclaw/plugin-sdk/*`. Le code core/tests d’OpenClaw peut utiliser les points d’entrée publics du dépôt sous la racine d’un package de plugin tels que `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, et des fichiers étroitement ciblés comme
  `login-qr-api.js`. N’importez jamais `src/*` d’un package de plugin depuis le core ou depuis une autre extension.
- Découpage des points d’entrée du dépôt :
  `<plugin-package-root>/api.js` est le baril helpers/types,
  `<plugin-package-root>/runtime-api.js` est le baril runtime-only,
  `<plugin-package-root>/index.js` est l’entrée du plugin groupé,
  et `<plugin-package-root>/setup-entry.js` est l’entrée du plugin de configuration.
- Exemples actuels de fournisseurs groupés :
  - Anthropic utilise `api.js` / `contract-api.js` pour des assistants de flux Claude tels que
    `wrapAnthropicProviderStream`, les assistants d’en-têtes bêta, et l’analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les constructeurs de fournisseurs, les assistants de modèles par défaut, et les constructeurs de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son constructeur de fournisseur ainsi que les assistants d’onboarding/configuration, tandis que `register.runtime.js` peut toujours réexporter des assistants génériques `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d’entrée publics chargés via façade préfèrent l’instantané de configuration runtime actif
  lorsqu’il existe, puis reviennent au fichier de configuration résolu sur disque lorsqu’OpenClaw ne sert pas encore d’instantané runtime.
- Les primitives partagées génériques restent le contrat public préféré du SDK. Un petit ensemble réservé de coutures d’assistance de canaux groupés marqués par leur marque subsiste encore. Traitez-les comme des coutures de maintenance/compatibilité des bundles, et non comme de nouvelles cibles d’importation tierces ; les nouveaux contrats transversaux doivent toujours être placés sur des sous-chemins génériques `plugin-sdk/*` ou sur les barils locaux au plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le baril racine `openclaw/plugin-sdk` pour le nouveau code.
- Préférez d’abord les primitives stables et étroites. Les nouveaux sous-chemins
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat voulu pour le nouveau travail sur les plugins groupés et externes.
  L’analyse/la correspondance des cibles doit vivre sur `openclaw/plugin-sdk/channel-targets`.
  Les barrières des actions de message et les assistants d’identifiant de message de réaction vivent sur
  `openclaw/plugin-sdk/channel-actions`.
- Les barils d’assistance spécifiques à une extension groupée ne sont pas stables par défaut. Si un assistant
  n’est nécessaire que pour une extension groupée, gardez-le derrière la couture locale
  `api.js` ou `runtime-api.js` de l’extension au lieu de le promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles coutures d’assistance partagées doivent être génériques, pas marquées par un canal. L’analyse partagée
  des cibles doit vivre sur `openclaw/plugin-sdk/channel-targets` ; les internes spécifiques à un canal restent derrière la couture locale `api.js` ou `runtime-api.js` du plugin propriétaire.
- Les sous-chemins spécifiques à une capacité comme `image-generation`,
  `media-understanding`, et `speech` existent parce que les plugins groupés/natifs les utilisent aujourd’hui. Leur présence ne signifie pas à elle seule que chaque assistant exporté constitue un contrat externe figé à long terme.

## Schémas de l’outil message

Les plugins doivent posséder les contributions de schéma spécifiques au canal dans `describeMessageTool(...)`.
Gardez les champs spécifiques au fournisseur dans le plugin, pas dans le core partagé.

Pour les fragments de schéma partagés et portables, réutilisez les assistants génériques exportés via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles structurées de cartes

Si une forme de schéma n’a de sens que pour un seul fournisseur, définissez-la dans les sources
propres à ce plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution des cibles de canal

Les plugins de canal doivent posséder la sémantique spécifique au canal des cibles. Gardez l’hôte de sortie
partagé générique et utilisez la surface de l’adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée doit
  être traitée comme `direct`, `group`, ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au core si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le repli du plugin lorsque le
  core a besoin d’une résolution finale possédée par le fournisseur après normalisation ou après un échec de recherche dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur une fois qu’une cible est résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant la recherche
  dans les peers/groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le repli de normalisation spécifique au fournisseur, pas pour une large recherche dans le répertoire.
- Gardez les identifiants natifs au fournisseur comme chat ids, thread ids, JIDs, handles et room ids
  dans les valeurs `target` ou les paramètres spécifiques au fournisseur, pas dans les champs SDK génériques.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire depuis la configuration doivent garder cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez ceci lorsqu’un canal a besoin de peers/groupes adossés à la configuration tels que :

- peers DM pilotés par liste d’autorisation
- cartes configurées de canaux/groupes
- replis statiques de répertoire à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage des requêtes
- application des limites
- déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection spécifique au canal des comptes et la normalisation des identifiants doivent rester dans l’implémentation du plugin.

## Catalogues de fournisseurs

Les plugins fournisseur peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée de fournisseur
- `{ providers }` pour plusieurs entrées de fournisseur

Utilisez `catalog` lorsque le plugin possède des model ids spécifiques au fournisseur, des valeurs par défaut de base URL, ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin est fusionné par rapport aux fournisseurs implicites intégrés d’OpenClaw :

- `simple`: fournisseurs simples basés sur clé API ou env
- `profile`: fournisseurs qui apparaissent lorsque des profils d’authentification existent
- `paired`: fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late`: dernier passage, après les autres fournisseurs implicites

Les fournisseurs tardifs l’emportent en cas de collision de clé, de sorte que les plugins peuvent intentionnellement remplacer une entrée de fournisseur intégrée avec le même identifiant.

Compatibilité :

- `discovery` fonctionne toujours comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection en lecture seule des canaux

Si votre plugin enregistre un canal, préférez implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer immédiatement lorsque les secrets requis manquent.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation de configuration
  ne doivent pas avoir à matérialiser des identifiants runtime juste pour décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement l’état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs source/statut des identifiants lorsque cela est pertinent, par exemple :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer des valeurs brutes de jeton uniquement pour signaler une disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour les commandes de type status.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande actuel.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou de déclarer à tort que le compte n’est pas configuré.

## Packs de package

Un répertoire de plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’identifiant du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Barrière de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du répertoire du plugin
après résolution des liens symboliques. Les entrées qui s’échappent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances de plugins avec
`npm install --omit=dev --ignore-scripts` (pas de scripts lifecycle, pas de dépendances dev au runtime). Gardez les arborescences de dépendances des plugins « pure JS/TS » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsqu’OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais pas encore configuré, il charge `setupEntry`
au lieu du point d’entrée complet du plugin. Cela garde le démarrage et la configuration plus légers
lorsque votre point d’entrée principal configure aussi des outils, hooks ou autres
codes réservés au runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire en sorte qu’un plugin de canal utilise le même chemin `setupEntry` pendant la phase de démarrage pré-écoute de la passerelle, même lorsque le canal est déjà configuré.

Utilisez ceci uniquement lorsque `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que la passerelle commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité possédée par le canal dont le démarrage dépend, par exemple :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant le début de l’écoute de la passerelle
- toute méthode de passerelle, outil ou service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger
l’entrée complète pendant le démarrage.

Les canaux groupés peuvent aussi publier des assistants de surface de contrat réservés à la configuration que le core
peut consulter avant le chargement complet du runtime du canal. La surface actuelle de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le core utilise cette surface lorsqu’il doit promouvoir une ancienne configuration de canal à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple groupé actuel : il ne déplace que les clés d’auth/bootstrap dans un
compte nommé promu lorsque des comptes nommés existent déjà, et il peut préserver une clé
default-account configurée non canonique au lieu de toujours créer `accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte des surfaces contractuelles groupées. Le temps d’importation reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de réentrer dans le démarrage du canal groupé à l’importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC de passerelle, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms admin du core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un plugin demande une portée plus étroite.

Exemple :

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Métadonnées de catalogue de canaux

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indications d’installation via `openclaw.install`. Cela évite au core d’avoir des données codées en dur.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Champs utiles de `openclaw.channel` au-delà de l’exemple minimal :

- `detailLabel`: libellé secondaire pour des surfaces plus riches de catalogue/statut
- `docsLabel`: remplacer le texte du lien de documentation
- `preferOver`: identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: contrôles de texte pour la surface de sélection
- `markdownCapable`: marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `showConfigured`: masque le canal des surfaces de listing des canaux configurés lorsqu’il est défini à `false`
- `quickstartAllowFrom`: fait entrer le canal dans le flux quickstart standard `allowFrom`
- `forceAccountBinding`: exige une liaison explicite de compte même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget`: préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export
de registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L’analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour
l’ingestion, l’assemblage et le compactage. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez ceci lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut plutôt que simplement ajouter de la recherche mémoire ou des hooks.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si votre moteur **ne possède pas** l’algorithme de compactage, gardez `compact()`
implémenté et déléguez explicitement :

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez
pas le système de plugins avec un accès privé. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du core
   Décidez du comportement partagé que le core doit posséder : politique, repli, fusion de configuration,
   cycle de vie, sémantique orientée canal, et forme de l’assistant runtime.
2. ajouter des surfaces d’enregistrement/runtime typées pour les plugins
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la surface de capacité typée
   la plus petite utile.
3. connecter le core et les consommateurs canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le core,
   pas en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseur
   Les plugins fournisseur enregistrent ensuite leurs backends sur la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la propriété et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste opinionné sans être codé en dur selon la vision du monde
d’un seul fournisseur. Consultez le [Capability Cookbook](/tools/capability-cookbook)
pour une checklist de fichiers concrète et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher
ces surfaces ensemble :

- types de contrat du core dans `src/<capability>/types.ts`
- runner/assistant runtime du core dans `src/<capability>/runtime.ts`
- surface d’enregistrement dans l’API plugin dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition runtime du plugin dans `src/plugins/runtime/*` lorsque des plugins de fonctionnalité/canal doivent la consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de propriété/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, cela indique généralement que la capacité n’est pas encore entièrement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Motif de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le core possède le contrat de capacité + l’orchestration
- les plugins fournisseur possèdent les implémentations fournisseur
- les plugins de fonctionnalité/canal consomment les assistants runtime
- les tests de contrat gardent la propriété explicite
