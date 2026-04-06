---
read_when:
    - Créer ou déboguer des plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les limites de responsabilité
    - Travailler sur le pipeline de chargement des plugins ou le registre
    - Implémenter des hooks d'exécution de fournisseur ou des plugins de canal
sidebarTitle: Internals
summary: 'Internes des plugins : modèle de capacités, responsabilité, contrats, pipeline de chargement et aides d''exécution'
title: Internes des plugins
x-i18n:
    generated_at: "2026-04-06T03:12:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d39158455701dedfb75f6c20b8c69fd36ed9841f1d92bed1915f448df57fd47b
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes des plugins

<Info>
  Il s'agit de la **référence d'architecture approfondie**. Pour des guides pratiques, voir :
  - [Installer et utiliser des plugins](/fr/tools/plugin) — guide utilisateur
  - [Prise en main](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer un fournisseur de modèles
  - [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — table d'importation et API d'enregistrement
</Info>

Cette page couvre l'architecture interne du système de plugins OpenClaw.

## Modèle public de capacités

Les capacités constituent le modèle public des **plugins natifs** au sein d'OpenClaw. Chaque
plugin OpenClaw natif s'enregistre auprès d'un ou plusieurs types de capacités :

| Capacité             | Méthode d'enregistrement                      | Exemples de plugins                  |
| -------------------- | --------------------------------------------- | ------------------------------------ |
| Inférence de texte   | `api.registerProvider(...)`                   | `openai`, `anthropic`                |
| Parole               | `api.registerSpeechProvider(...)`             | `elevenlabs`, `microsoft`            |
| Transcription en temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voix en temps réel   | `api.registerRealtimeVoiceProvider(...)`      | `openai`                             |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Génération d'images  | `api.registerImageGenerationProvider(...)`    | `openai`, `google`, `fal`, `minimax` |
| Génération musicale  | `api.registerMusicGenerationProvider(...)`    | `google`, `minimax`                  |
| Génération de vidéo  | `api.registerVideoGenerationProvider(...)`    | `qwen`                               |
| Récupération web     | `api.registerWebFetchProvider(...)`           | `firecrawl`                          |
| Recherche web        | `api.registerWebSearchProvider(...)`          | `google`                             |
| Canal / messagerie   | `api.registerChannel(...)`                    | `msteams`, `matrix`                  |

Un plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou
des services est un plugin **hérité hook-only**. Ce modèle reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré dans le cœur et utilisé aujourd'hui par les plugins groupés/natifs,
mais la compatibilité des plugins externes exige encore un niveau d'exigence plus élevé que « c'est
exporté, donc c'est figé ».

Directives actuelles :

- **plugins externes existants :** maintenez les intégrations basées sur des hooks en état de fonctionnement ; traitez
  cela comme la base de compatibilité
- **nouveaux plugins groupés/natifs :** privilégiez l'enregistrement explicite des capacités plutôt que
  des accès spécifiques à un fournisseur ou de nouveaux conceptions hook-only
- **plugins externes adoptant l'enregistrement de capacités :** autorisés, mais traitez les
  surfaces d'aide propres aux capacités comme évolutives sauf si la documentation marque explicitement un
  contrat comme stable

Règle pratique :

- les API d'enregistrement de capacités constituent la direction voulue
- les hooks hérités restent la voie la plus sûre pour éviter les ruptures pour les plugins externes pendant
  la transition
- les sous-chemins d'aide exportés ne se valent pas tous ; privilégiez le contrat étroit documenté,
  pas les exports d'aide accessoires

### Formes de plugin

OpenClaw classe chaque plugin chargé selon une forme basée sur son comportement réel
d'enregistrement (et pas seulement sur des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin uniquement fournisseur comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l'inférence de texte, la parole, la compréhension des médias et la génération
  d'images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services
- **non-capability** -- enregistre des outils, des commandes, des services ou des routes mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d'un plugin et la répartition
des capacités. Voir [Référence CLI](/cli/plugins#inspect) pour les détails.

### Hooks hérités

Le hook `before_agent_start` reste pris en charge comme voie de compatibilité pour
les plugins hook-only. Des plugins hérités du monde réel en dépendent encore.

Orientation :

- le garder fonctionnel
- le documenter comme hérité
- préférer `before_model_resolve` pour le travail de remplacement de modèle/fournisseur
- préférer `before_prompt_build` pour le travail de mutation de prompt
- le retirer uniquement lorsque l'usage réel aura baissé et que la couverture par fixtures prouvera la sécurité de la migration

### Signaux de compatibilité

Lorsque vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l'une des étiquettes suivantes :

| Signal                     | Signification                                               |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | La configuration s'analyse correctement et les plugins se résolvent |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**         | Le plugin utilise `before_agent_start`, qui est déconseillé |
| **hard error**             | La configuration est invalide ou le plugin n'a pas pu se charger |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd'hui --
`hook-only` est indicatif, et `before_agent_start` ne déclenche qu'un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d'ensemble de l'architecture

Le système de plugins d'OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines d'espace de travail,
   des racines d'extensions globales et des extensions groupées. La découverte lit d'abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundles pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif comme la mémoire.
3. **Chargement à l'exécution**
   Les plugins OpenClaw natifs sont chargés dans le processus via jiti et enregistrent des
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code d'exécution.
4. **Consommation des surfaces**
   Le reste d'OpenClaw lit le registre pour exposer les outils, canaux, configuration de fournisseur,
   hooks, routes HTTP, commandes CLI et services.

Pour la CLI des plugins spécifiquement, la découverte des commandes racines est divisée en deux phases :

- les métadonnées au moment de l'analyse proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s'enregistrer lors du premier appel

Cela permet de garder le code CLI appartenant au plugin à l'intérieur du plugin tout en laissant OpenClaw
réserver les noms de commandes racines avant l'analyse.

Limite de conception importante :

- la découverte + la validation de la configuration doivent fonctionner à partir des **métadonnées de manifeste/schéma**
  sans exécuter le code du plugin
- le comportement natif à l'exécution provient du chemin `register(api)` du module du plugin

Cette séparation permet à OpenClaw de valider la configuration, d'expliquer les plugins manquants/désactivés et de
construire des indications d'UI/schéma avant que l'exécution complète ne soit active.

### Plugins de canal et outil message partagé

Les plugins de canal n'ont pas besoin d'enregistrer un outil séparé envoyer/modifier/réagir pour
les actions de chat normales. OpenClaw conserve un outil `message` partagé dans le cœur, et
les plugins de canal prennent en charge la découverte et l'exécution spécifiques au canal derrière celui-ci.

La limite actuelle est la suivante :

- le cœur possède l'hôte de l'outil `message` partagé, le câblage des prompts, la
  tenue des sessions/threads et la répartition de l'exécution
- les plugins de canal possèdent la découverte des actions à portée, la découverte des capacités et tous
  les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session propre au fournisseur, par exemple
  la manière dont les identifiants de conversation encodent les identifiants de thread ou héritent des conversations parentes
- les plugins de canal exécutent l'action finale via leur adaptateur d'action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin de
renvoyer ensemble ses actions visibles, ses capacités et ses contributions au schéma afin que ces éléments ne dérivent pas les uns des autres.

Le cœur transmet la portée d'exécution à cette étape de découverte. Les champs importants comprennent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant de confiance

Cela est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer
des actions de message en fonction du compte actif, du salon/thread/message courant ou
de l'identité du demandeur de confiance sans coder en dur des branches spécifiques au canal dans
l'outil `message` du cœur.

C'est pourquoi les changements de routage du runner embarqué restent du travail de plugin : le runner est
responsable de transmettre l'identité du chat/de la session en cours dans la limite de découverte du plugin
afin que l'outil `message` partagé expose la bonne surface possédée par le canal
pour le tour courant.

Pour les aides d'exécution appartenant au canal, les plugins groupés doivent conserver l'environnement d'exécution
dans leurs propres modules d'extension. Le cœur ne possède plus les environnements d'exécution d'actions de message
Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-chemins séparés `plugin-sdk/*-action-runtime`, et les plugins groupés
doivent importer directement leur propre code d'exécution local depuis leurs
modules appartenant à l'extension.

La même limite s'applique aux coutures SDK nommées par fournisseur en général : le cœur ne doit
pas importer de barrels de commodité spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d'un comportement, il doit soit consommer
le barrel `api.ts` / `runtime-api.ts` du plugin groupé lui-même, soit promouvoir ce besoin
dans une capacité générique étroite du SDK partagé.

Pour les sondages spécifiquement, il existe deux chemins d'exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle commun
  de sondage
- `actions.handleAction("poll")` est le chemin privilégié pour une sémantique de sondage spécifique au canal
  ou des paramètres de sondage supplémentaires

Le cœur diffère désormais l'analyse partagée des sondages jusqu'à ce que la répartition des sondages du plugin refuse
l'action, afin que les gestionnaires de sondage appartenant au plugin puissent accepter des champs de sondage
spécifiques au canal sans être bloqués d'abord par l'analyseur de sondage générique.

Voir [Pipeline de chargement](#load-pipeline) pour la séquence complète de démarrage.

## Modèle de responsabilité des capacités

OpenClaw traite un plugin natif comme la limite de responsabilité pour une **entreprise** ou une
**fonctionnalité**, et non comme un fourre-tout d'intégrations sans rapport.

Cela signifie que :

- un plugin d'entreprise doit généralement posséder toutes les surfaces OpenClaw de cette entreprise
- un plugin de fonctionnalité doit généralement posséder toute la surface de la fonctionnalité qu'il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter
  ad hoc le comportement des fournisseurs

Exemples :

- le plugin groupé `openai` possède le comportement de fournisseur de modèles OpenAI et le comportement OpenAI
  pour la parole + la voix en temps réel + la compréhension des médias + la génération d'images
- le plugin groupé `elevenlabs` possède le comportement de parole ElevenLabs
- le plugin groupé `microsoft` possède le comportement de parole Microsoft
- le plugin groupé `google` possède le comportement de fournisseur de modèles Google plus le comportement Google
  pour la compréhension des médias + la génération d'images + la recherche web
- le plugin groupé `firecrawl` possède le comportement de récupération web Firecrawl
- les plugins groupés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin groupé `qwen` possède le comportement de fournisseur de texte Qwen plus
  le comportement de compréhension des médias et de génération de vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d'appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées de parole
  plus la transcription en temps réel et la voix en temps réel au lieu
  d'importer directement des plugins fournisseurs

L'état final visé est le suivant :

- OpenAI vit dans un seul plugin même s'il couvre les modèles de texte, la parole, les images et la
  future vidéo
- un autre fournisseur peut faire la même chose pour son propre périmètre
- les canaux ne se soucient pas de savoir quel plugin fournisseur possède le fournisseur ; ils consomment le
  contrat de capacité partagé exposé par le cœur

C'est la distinction clé :

- **plugin** = limite de responsabilité
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n'est pas
« quel fournisseur doit coder en dur la gestion vidéo ? ». La première question est
« quel est le contrat de capacité vidéo du cœur ? ». Une fois ce contrat en place, les plugins fournisseurs
peuvent s'y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n'existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le cœur
2. l'exposer via l'API/l'exécution du plugin de manière typée
3. connecter les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela maintient une responsabilité explicite tout en évitant un comportement du cœur qui dépend d'un
seul fournisseur ou d'un chemin de code spécifique à un plugin particulier.

### Stratification des capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacités du cœur** : orchestration partagée, politique, fallback, règles de fusion de configuration, sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse vocale,
  génération d'images, futurs backends vidéo, points de terminaison d'usage
- **couche de plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, le TTS suit cette forme :

- le cœur possède la politique TTS au moment de la réponse, l'ordre de fallback, les préférences et la livraison sur les canaux
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l'aide d'exécution TTS pour la téléphonie

Le même modèle doit être privilégié pour les futures capacités.

### Exemple de plugin d'entreprise multi-capacités

Un plugin d'entreprise doit sembler cohérent vu de l'extérieur. Si OpenClaw a des
contrats partagés pour les modèles, la parole, la transcription en temps réel, la voix en temps réel, la compréhension des médias,
la génération d'images, la génération de vidéo, la récupération web et la recherche web,
un fournisseur peut posséder toutes ses surfaces au même endroit :

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

Ce qui compte n'est pas le nom exact des aides. C'est la forme qui compte :

- un seul plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et plugins de fonctionnalité consomment les aides `api.runtime.*`, pas le code du fournisseur
- les tests de contrat peuvent affirmer que le plugin a enregistré les capacités qu'il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une capacité partagée
unique. Le même modèle de responsabilité s'y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon les cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu de se
   connecter directement au code du fournisseur

Cela évite d'intégrer dans le cœur les hypothèses vidéo d'un fournisseur donné. Le plugin possède
la surface du fournisseur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération de vidéo suit déjà cette même séquence : le cœur possède le contrat de
capacité typé et l'aide d'exécution, et les plugins fournisseurs enregistrent
des implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d'une checklist concrète de déploiement ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface de l'API des plugins est volontairement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d'enregistrement pris en charge et
les aides d'exécution sur lesquelles un plugin peut s'appuyer.

Pourquoi c'est important :

- les auteurs de plugins disposent d'une norme interne stable unique
- le cœur peut rejeter les responsabilités dupliquées, comme deux plugins enregistrant le même
  identifiant de fournisseur
- le démarrage peut afficher des diagnostics exploitables pour les enregistrements malformés
- les tests de contrat peuvent imposer la responsabilité des plugins groupés et empêcher une dérive silencieuse

Il existe deux couches d'application :

1. **application de l'enregistrement à l'exécution**
   Le registre de plugins valide les enregistrements au fur et à mesure du chargement des plugins. Exemples :
   identifiants de fournisseur dupliqués, identifiants de fournisseur vocal dupliqués et
   enregistrements malformés produisent des diagnostics de plugin au lieu d'un comportement indéfini.
2. **tests de contrat**
   Les plugins groupés sont capturés dans des registres de contrat pendant les exécutions de test afin qu'OpenClaw
   puisse affirmer explicitement leur responsabilité. Aujourd'hui, cela est utilisé pour les fournisseurs de modèles,
   les fournisseurs vocaux, les fournisseurs de recherche web et la responsabilité de l'enregistrement groupé.

L'effet pratique est qu'OpenClaw sait, dès le départ, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer proprement, car la responsabilité est
déclarée, typée et testable plutôt qu'implicite.

### Ce qui appartient à un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par des canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- une politique spécifique à un fournisseur cachée dans le cœur
- des échappatoires ponctuelles de plugin qui contournent le registre
- du code de canal qui atteint directement une implémentation de fournisseur
- des objets d'exécution ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  de `api.runtime`

En cas de doute, augmentez le niveau d'abstraction : définissez d'abord la capacité, puis
laissez les plugins s'y brancher.

## Modèle d'exécution

Les plugins OpenClaw natifs s'exécutent **dans le processus** avec le Gateway. Ils ne sont pas
mis en sandbox. Un plugin natif chargé possède la même limite de confiance au niveau du processus que
le code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser le gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire à l'intérieur du
  processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu'OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout
des Skills groupés.

Utilisez des listes d'autorisation et des chemins explicites d'installation/chargement pour les plugins non groupés. Traitez
les plugins d'espace de travail comme du code de développement, pas comme des valeurs par défaut de production.

Pour les noms de packages d'espace de travail groupés, gardez l'identifiant de plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` lorsque
le package expose intentionnellement un rôle de plugin plus étroit.

Remarque de confiance importante :

- `plugins.allow` fait confiance aux **identifiants de plugin**, pas à la provenance de la source.
- Un plugin d'espace de travail avec le même identifiant qu'un plugin groupé masque intentionnellement
  la copie groupée lorsque ce plugin d'espace de travail est activé/autorisé.
- C'est normal et utile pour le développement local, les tests de correctifs et les correctifs à chaud.

## Limite d'exportation

OpenClaw exporte des capacités, pas des commodités d'implémentation.

Gardez l'enregistrement des capacités public. Réduisez les exports d'aide hors contrat :

- sous-chemins d'aide spécifiques à des plugins groupés
- sous-chemins de plomberie d'exécution non destinés à l'API publique
- aides de commodité spécifiques à un fournisseur
- aides de configuration/onboarding qui sont des détails d'implémentation

Certaines aides de plugins groupés restent encore dans la table d'exports générée du SDK
pour des raisons de compatibilité et de maintenance des plugins groupés. Exemples actuels :
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et plusieurs coutures `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d'implémentation, pas comme le modèle SDK recommandé pour
de nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvre les racines des plugins candidats
2. lit les manifestes natifs ou de bundles compatibles ainsi que les métadonnées de package
3. rejette les candidats non sûrs
4. normalise la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décide de l'activation pour chaque candidat
6. charge les modules natifs activés via jiti
7. appelle les hooks natifs `register(api)` (ou `activate(api)` — alias hérité) et collecte les enregistrements dans le registre de plugins
8. expose le registre aux surfaces commandes/exécution

<Note>
`activate` est un alias hérité de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l'appelle au même moment. Tous les plugins groupés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité se produisent **avant** l'exécution du runtime. Les candidats sont bloqués
lorsque l'entrée s'échappe de la racine du plugin, que le chemin est accessible en écriture par tous, ou que la propriété du chemin semble suspecte pour les plugins non groupés.

### Comportement orienté manifeste

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l'utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités de bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de Control UI
- afficher les métadonnées d'installation/catalogue

Pour les plugins natifs, le module d'exécution est la partie plan de données. Il enregistre
le comportement réel comme les hooks, les outils, les commandes ou les flux de fournisseur.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches dans le processus pour :

- les résultats de découverte
- les données du registre de manifestes
- les registres de plugins chargés

Ces caches réduisent la lourdeur des démarrages fréquents et les coûts répétés des commandes. Il est
correct de les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Remarque de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Ajustez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globals du cœur aléatoires. Ils s'enregistrent dans un
registre central des plugins.

Le registre suit :

- les enregistrements de plugins (identité, source, origine, statut, diagnostics)
- les outils
- les hooks hérités et les hooks typés
- les canaux
- les fournisseurs
- les gestionnaires RPC du gateway
- les routes HTTP
- les registrars CLI
- les services d'arrière-plan
- les commandes appartenant aux plugins

Les fonctionnalités du cœur lisent ensuite dans ce registre au lieu de parler directement
aux modules de plugin. Cela maintient un chargement à sens unique :

- module de plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Elle signifie que la plupart des surfaces du cœur n'ont
besoin que d'un seul point d'intégration : « lire le registre », et non « gérer spécialement chaque module de plugin ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir lorsqu'une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu'une requête de liaison a été approuvée ou refusée :

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

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les requêtes approuvées
- `request` : le résumé de la requête d'origine, l'indication de détachement, l'identifiant de l'expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne modifie pas qui est autorisé à lier une
conversation, et il s'exécute une fois le traitement d'approbation du cœur terminé.

## Hooks d'exécution des fournisseurs

Les plugins fournisseurs ont désormais deux couches :

- métadonnées de manifeste : `providerAuthEnvVars` pour la recherche peu coûteuse d'authentification env avant le chargement
  à l'exécution, plus `providerAuthChoices` pour les libellés peu coûteux de choix d'onboarding/authentification
  et les métadonnées d'indicateurs CLI avant le chargement à l'exécution
- hooks au moment de la configuration : `catalog` / `discovery` hérité plus `applyConfigDefaults`
- hooks à l'exécution : `normalizeModelId`, `normalizeTransport`,
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

OpenClaw possède toujours la boucle générique d'agent, le failover, la gestion des transcriptions et la
politique des outils. Ces hooks constituent la surface d'extension pour le comportement spécifique au fournisseur sans
avoir besoin d'un transport d'inférence entièrement personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le fournisseur a des identifiants basés sur env
que les chemins génériques d'authentification/statut/sélecteur de modèle doivent voir sans charger le runtime du plugin.
Utilisez le manifeste `providerAuthChoices` lorsque les surfaces CLI d'onboarding/choix d'authentification
doivent connaître l'identifiant de choix du fournisseur, les libellés de groupe et un câblage simple
de l'authentification par indicateur unique sans charger le runtime du fournisseur. Conservez le runtime du fournisseur
`envVars` pour des indications destinées aux opérateurs telles que les libellés d'onboarding ou les variables de configuration
client-id/client-secret OAuth.

### Ordre des hooks et usage

Pour les plugins modèle/fournisseur, OpenClaw appelle les hooks approximativement dans cet ordre.
La colonne « Quand l'utiliser » est le guide de décision rapide.

| #   | Hook                              | Ce qu'il fait                                                                          | Quand l'utiliser                                                                                                                           |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du fournisseur dans `models.providers` lors de la génération de `models.json` | Le fournisseur possède un catalogue ou des valeurs par défaut de base URL                                                                  |
| 2   | `applyConfigDefaults`             | Appliquer les valeurs par défaut globales appartenant au fournisseur lors de la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d'authentification, de env ou de la sémantique de famille de modèles du fournisseur |
| --  | _(built-in model lookup)_         | OpenClaw essaie d'abord le chemin normal registre/catalogue                            | _(pas un hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliser les alias hérités ou de préversion des identifiants de modèle avant la recherche | Le fournisseur possède le nettoyage des alias avant la résolution du modèle canonique                                                      |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille du fournisseur avant l'assemblage générique du modèle | Le fournisseur possède le nettoyage du transport pour des identifiants de fournisseur personnalisés de la même famille de transport |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution à l'exécution/du fournisseur    | Le fournisseur a besoin d'un nettoyage de configuration qui doit vivre avec le plugin ; les aides groupées de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer des réécritures de compatibilité d'usage du streaming natif aux fournisseurs de configuration | Le fournisseur a besoin de corrections de métadonnées d'usage natif dépendantes du point de terminaison                                   |
| 7   | `resolveConfigApiKey`             | Résoudre l'authentification par marqueur env pour les fournisseurs de configuration avant le chargement de l'authentification à l'exécution | Le fournisseur possède sa propre résolution de clé API à marqueur env ; `amazon-bedrock` possède également ici un résolveur intégré de marqueur env AWS |
| 8   | `resolveSyntheticAuth`            | Exposer une authentification locale/autohébergée ou basée sur la configuration sans persister du texte brut | Le fournisseur peut fonctionner avec un marqueur d'identifiant synthétique/local                                                           |
| 9   | `shouldDeferSyntheticProfileAuth` | Abaisser les espaces réservés de profils synthétiques stockés derrière l'authentification adossée à env/config | Le fournisseur stocke des profils synthétiques d'espace réservé qui ne doivent pas gagner en priorité                                      |
| 10  | `resolveDynamicModel`             | Fallback synchrone pour des identifiants de modèle appartenant au fournisseur qui ne sont pas encore dans le registre local | Le fournisseur accepte des identifiants de modèle amont arbitraires                                                                        |
| 11  | `prepareDynamicModel`             | Préparation asynchrone, puis `resolveDynamicModel` s'exécute à nouveau                 | Le fournisseur a besoin de métadonnées réseau avant de résoudre des identifiants inconnus                                                  |
| 12  | `normalizeResolvedModel`          | Réécriture finale avant que le runner embarqué n'utilise le modèle résolu              | Le fournisseur a besoin de réécritures de transport tout en utilisant quand même un transport du cœur                                     |
| 13  | `contributeResolvedModelCompat`   | Contribuer des drapeaux de compatibilité pour des modèles fournisseurs derrière un autre transport compatible | Le fournisseur reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du fournisseur |
| 14  | `capabilities`                    | Métadonnées de transcription/outillage appartenant au fournisseur utilisées par la logique partagée du cœur | Le fournisseur a besoin de particularités de transcription/famille de fournisseur                                                          |
| 15  | `normalizeToolSchemas`            | Normaliser les schémas d'outils avant que le runner embarqué ne les voie               | Le fournisseur a besoin d'un nettoyage de schéma de famille de transport                                                                   |
| 16  | `inspectToolSchemas`              | Afficher des diagnostics de schéma appartenant au fournisseur après normalisation      | Le fournisseur veut des avertissements par mot-clé sans apprendre au cœur des règles spécifiques à un fournisseur                         |
| 17  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif vs balisé                      | Le fournisseur a besoin d'une sortie raisonnement/finale balisée au lieu de champs natifs                                                 |
| 18  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d'options de flux | Le fournisseur a besoin de paramètres de requête par défaut ou d'un nettoyage de paramètres par fournisseur                               |
| 19  | `createStreamFn`                  | Remplacer complètement le chemin de flux normal par un transport personnalisé          | Le fournisseur a besoin d'un protocole filaire personnalisé, pas seulement d'un wrapper                                                   |
| 20  | `wrapStreamFn`                    | Wrapper de flux après l'application des wrappers génériques                            | Le fournisseur a besoin de wrappers de compatibilité en-têtes/corps/modèle de requête sans transport personnalisé                        |
| 21  | `resolveTransportTurnState`       | Attacher des en-têtes ou métadonnées natives par tour de transport                     | Le fournisseur veut que les transports génériques envoient une identité de tour native au fournisseur                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes natifs WebSocket ou une politique de cooldown de session         | Le fournisseur veut que les transports WS génériques ajustent les en-têtes de session ou la politique de fallback                        |
| 23  | `formatApiKey`                    | Formateur de profil d'authentification : le profil stocké devient la chaîne `apiKey` du runtime | Le fournisseur stocke des métadonnées d'authentification supplémentaires et a besoin d'une forme de jeton d'exécution personnalisée |
| 24  | `refreshOAuth`                    | Remplacement de l'actualisation OAuth pour des points de terminaison d'actualisation personnalisés ou une politique d'échec d'actualisation | Le fournisseur ne correspond pas aux actualiseurs partagés `pi-ai`                                                                       |
| 25  | `buildAuthDoctorHint`             | Indication de réparation ajoutée en cas d'échec de l'actualisation OAuth              | Le fournisseur a besoin d'une indication de réparation de l'authentification appartenant au fournisseur après un échec d'actualisation   |
| 26  | `matchesContextOverflowError`     | Détecteur d'erreur de dépassement de fenêtre de contexte appartenant au fournisseur    | Le fournisseur a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                           |
| 27  | `classifyFailoverReason`          | Classification de la raison de failover appartenant au fournisseur                     | Le fournisseur peut mapper des erreurs API/transport brutes vers rate-limit/surcharge/etc.                                                |
| 28  | `isCacheTtlEligible`              | Politique de cache de prompt pour les fournisseurs proxy/backhaul                      | Le fournisseur a besoin d'un contrôle TTL spécifique au proxy                                                                              |
| 29  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d'authentification manquante         | Le fournisseur a besoin d'une indication de récupération spécifique au fournisseur pour une authentification manquante                    |
| 30  | `suppressBuiltInModel`            | Suppression des modèles amont obsolètes plus indication optionnelle visible utilisateur | Le fournisseur a besoin de masquer des lignes amont obsolètes ou de les remplacer par une indication fournisseur                         |
| 31  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                  | Le fournisseur a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                              |
| 32  | `isBinaryThinking`                | Bascule on/off du raisonnement pour les fournisseurs à raisonnement binaire            | Le fournisseur n'expose qu'un raisonnement binaire activé/désactivé                                                                        |
| 33  | `supportsXHighThinking`           | Prise en charge du raisonnement `xhigh` pour certains modèles                          | Le fournisseur veut `xhigh` seulement sur un sous-ensemble de modèles                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Niveau `/think` par défaut pour une famille de modèles spécifique                      | Le fournisseur possède la politique `/think` par défaut d'une famille de modèles                                                           |
| 35  | `isModernModelRef`                | Détecteur de modèle moderne pour les filtres de profils actifs et la sélection smoke   | Le fournisseur possède la correspondance de modèles préférés en live/smoke                                                                 |
| 36  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le vrai jeton/la vraie clé juste avant l'inférence | Le fournisseur a besoin d'un échange de jeton ou d'un identifiant de requête de courte durée                                           |
| 37  | `resolveUsageAuth`                | Résoudre les identifiants d'usage/facturation pour `/usage` et les surfaces de statut associées | Le fournisseur a besoin d'une analyse personnalisée du jeton d'usage/quota ou d'un identifiant d'usage différent                        |
| 38  | `fetchUsageSnapshot`              | Récupérer et normaliser des instantanés d'usage/quota spécifiques au fournisseur après résolution de l'authentification | Le fournisseur a besoin d'un point de terminaison d'usage spécifique ou d'un parseur de charge utile spécifique                         |
| 39  | `createEmbeddingProvider`         | Construire un adaptateur d'embeddings appartenant au fournisseur pour memory/search    | Le comportement d'embeddings mémoire appartient au plugin fournisseur                                                                      |
| 40  | `buildReplayPolicy`               | Renvoyer une politique de replay contrôlant la gestion des transcriptions pour le fournisseur | Le fournisseur a besoin d'une politique de transcription personnalisée (par exemple suppression des blocs de réflexion)               |
| 41  | `sanitizeReplayHistory`           | Réécrire l'historique de replay après le nettoyage générique des transcriptions        | Le fournisseur a besoin de réécritures de replay spécifiques au fournisseur au-delà des aides partagées de compaction                   |
| 42  | `validateReplayTurns`             | Validation ou remodelage final des tours de replay avant le runner embarqué            | Le transport du fournisseur a besoin d'une validation plus stricte des tours après l'assainissement générique                            |
| 43  | `onModelSelected`                 | Exécuter des effets de bord post-sélection appartenant au fournisseur                  | Le fournisseur a besoin de télémétrie ou d'état appartenant au fournisseur lorsqu'un modèle devient actif                                |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d'abord le
plugin fournisseur correspondant, puis passent à d'autres plugins fournisseurs capables de hooks
jusqu'à ce que l'un d'eux modifie effectivement l'identifiant de modèle ou le transport/la configuration. Cela permet aux shims de fournisseur alias/compatibilité de continuer à fonctionner sans exiger que l'appelant sache quel
plugin groupé possède la réécriture. Si aucun hook fournisseur ne réécrit une entrée de configuration de la famille Google prise en charge, le normaliseur groupé de configuration Google applique encore ce nettoyage de compatibilité.

Si le fournisseur a besoin d'un protocole filaire entièrement personnalisé ou d'un exécuteur de requête personnalisé,
il s'agit d'une autre catégorie d'extension. Ces hooks servent au comportement du fournisseur
qui s'exécute quand même sur la boucle d'inférence normale d'OpenClaw.

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
  et `wrapStreamFn` parce qu'il possède la compatibilité future de Claude 4.6,
  les indications de famille de fournisseur, les indications de réparation d'authentification, l'intégration
  au point de terminaison d'usage, l'éligibilité du cache de prompt, les valeurs par défaut de configuration conscientes de l'authentification, la
  politique de réflexion par défaut/adaptative de Claude, ainsi que le façonnage de flux spécifique à Anthropic pour
  les en-têtes bêta, `/fast` / `serviceTier` et `context1m`.
- Les aides de flux spécifiques à Claude d'Anthropic restent pour l'instant dans la couture publique
  `api.ts` / `contract-api.ts` du plugin groupé. Cette surface du package
  exporte `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` ainsi que les builders de wrappers
  Anthropic de plus bas niveau au lieu d'élargir le SDK générique autour des règles d'en-têtes bêta d'un fournisseur.
- OpenAI utilise `resolveDynamicModel`, `normalizeResolvedModel` et
  `capabilities` ainsi que `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` et `isModernModelRef`
  parce qu'il possède la compatibilité future GPT-5.4, la normalisation directe OpenAI
  `openai-completions` -> `openai-responses`, les indications d'authentification conscientes de Codex,
  la suppression de Spark, les lignes synthétiques de liste OpenAI, et la politique de réflexion / modèle live de GPT-5 ; la famille de flux `openai-responses-defaults` possède les wrappers partagés natifs OpenAI Responses pour les
  en-têtes d'attribution, `/fast`/`serviceTier`, la verbosité du texte, la recherche web Codex native,
  le façonnage de charge utile de compatibilité raisonnement et la gestion du contexte Responses.
- OpenRouter utilise `catalog` ainsi que `resolveDynamicModel` et
  `prepareDynamicModel` parce que le fournisseur est pass-through et peut exposer de nouveaux
  identifiants de modèle avant les mises à jour du catalogue statique d'OpenClaw ; il utilise aussi
  `capabilities`, `wrapStreamFn` et `isCacheTtlEligible` pour garder hors du cœur
  les en-têtes de requête spécifiques au fournisseur, les métadonnées de routage, les correctifs de raisonnement et la politique de cache de prompt. Sa politique de replay provient de la
  famille `passthrough-gemini`, tandis que la famille de flux `openrouter-thinking`
  possède l'injection de raisonnement proxy ainsi que les skips pour modèles non pris en charge / `auto`.
- GitHub Copilot utilise `catalog`, `auth`, `resolveDynamicModel` et
  `capabilities` ainsi que `prepareRuntimeAuth` et `fetchUsageSnapshot` parce qu'il
  a besoin d'une connexion appareil appartenant au fournisseur, d'un comportement de fallback de modèle,
  de particularités de transcription Claude, d'un échange de jeton GitHub -> Copilot et d'un point
  de terminaison d'usage appartenant au fournisseur.
- OpenAI Codex utilise `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` et `augmentModelCatalog` ainsi que
  `prepareExtraParams`, `resolveUsageAuth` et `fetchUsageSnapshot` parce qu'il
  s'exécute toujours sur les transports OpenAI du cœur mais possède sa normalisation
  de transport/base URL, sa politique de fallback pour actualisation OAuth, son choix de transport par défaut,
  ses lignes synthétiques de catalogue Codex et l'intégration au point de terminaison d'usage ChatGPT ; il
  partage la même famille de flux `openai-responses-defaults` que l'OpenAI direct.
- Google AI Studio et Gemini CLI OAuth utilisent `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` et `isModernModelRef` parce que la
  famille de replay `google-gemini` possède le fallback de compatibilité future Gemini 3.1,
  la validation native Gemini du replay, l'assainissement du replay d'amorçage, le
  mode de sortie de raisonnement balisé et la correspondance de modèles modernes, tandis que la
  famille de flux `google-thinking` possède la normalisation des charges utiles de réflexion Gemini ;
  Gemini CLI OAuth utilise aussi `formatApiKey`, `resolveUsageAuth` et
  `fetchUsageSnapshot` pour le formatage du jeton, l'analyse du jeton et le
  câblage du point de terminaison de quota.
- Anthropic Vertex utilise `buildReplayPolicy` via la
  famille de replay `anthropic-by-model` afin que le nettoyage de replay spécifique à Claude reste
  limité aux identifiants Claude au lieu de tous les transports `anthropic-messages`.
- Amazon Bedrock utilise `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` et `resolveDefaultThinkingLevel` parce qu'il possède
  la classification spécifique à Bedrock des erreurs throttle/not-ready/context-overflow
  pour le trafic Anthropic-sur-Bedrock ; sa politique de replay partage encore la même
  garde `anthropic-by-model` réservée à Claude.
- OpenRouter, Kilocode, Opencode et Opencode Go utilisent `buildReplayPolicy`
  via la famille de replay `passthrough-gemini` parce qu'ils proxifient des modèles Gemini
  via des transports compatibles OpenAI et ont besoin de l'assainissement de signature de pensée Gemini sans validation native Gemini du replay ni réécritures d'amorçage.
- MiniMax utilise `buildReplayPolicy` via la
  famille de replay `hybrid-anthropic-openai` parce qu'un même fournisseur possède à la fois la sémantique
  Anthropic-message et la sémantique compatible OpenAI ; il garde l'abandon des blocs de réflexion
  réservés à Claude côté Anthropic tout en remplaçant le mode de sortie du raisonnement vers le natif, et la famille de flux `minimax-fast-mode` possède les réécritures de modèle fast-mode sur le chemin de flux partagé.
- Moonshot utilise `catalog` ainsi que `wrapStreamFn` parce qu'il utilise encore le transport
  partagé OpenAI mais a besoin d'une normalisation de charge utile de réflexion appartenant au fournisseur ; la famille de flux `moonshot-thinking` mappe la configuration ainsi que l'état `/think` vers sa charge utile native de réflexion binaire.
- Kilocode utilise `catalog`, `capabilities`, `wrapStreamFn` et
  `isCacheTtlEligible` parce qu'il a besoin d'en-têtes de requête appartenant au fournisseur,
  d'une normalisation de la charge utile de raisonnement, d'indications de transcription Gemini et d'un contrôle
  TTL du cache Anthropic ; la famille de flux `kilocode-thinking` garde l'injection de réflexion Kilo sur le chemin de flux proxy partagé tout en ignorant `kilo/auto` et les autres identifiants de modèles proxy qui ne prennent pas en charge les charges utiles de raisonnement explicites.
- Z.AI utilise `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` et `fetchUsageSnapshot` parce qu'il possède le fallback GLM-5,
  les valeurs par défaut `tool_stream`, l'UX de réflexion binaire, la correspondance des modèles modernes,
  et à la fois l'authentification d'usage + la récupération du quota ; la famille de flux `tool-stream-default-on` garde le wrapper `tool_stream` activé par défaut hors du code glue manuscrit par fournisseur.
- xAI utilise `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` et `isModernModelRef`
  parce qu'il possède la normalisation native du transport xAI Responses, les réécritures d'alias Grok fast-mode, le `tool_stream` par défaut, le nettoyage strict des outils / charges utiles de raisonnement, la réutilisation de l'authentification de fallback pour les outils appartenant au plugin, la résolution de compatibilité future des modèles Grok, ainsi que les correctifs de compatibilité appartenant au fournisseur comme le profil de schéma d'outil xAI, les mots-clés de schéma non pris en charge, `web_search` natif et le décodage des arguments d'appel d'outil en entités HTML.
- Mistral, OpenCode Zen et OpenCode Go utilisent uniquement `capabilities` afin de garder hors du cœur les particularités de transcription/outillage.
- Les fournisseurs groupés catalogue-only tels que `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` et `volcengine` utilisent
  uniquement `catalog`.
- Qwen utilise `catalog` pour son fournisseur de texte ainsi que des enregistrements partagés de compréhension des médias et de génération de vidéo pour ses surfaces multimodales.
- MiniMax et Xiaomi utilisent `catalog` ainsi que les hooks d'usage parce que leur comportement `/usage`
  appartient au plugin même si l'inférence passe encore par les transports partagés.

## Aides d'exécution

Les plugins peuvent accéder à certaines aides du cœur via `api.runtime`. Pour le TTS :

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

Remarques :

- `textToSpeech` renvoie la charge utile TTS normale du cœur pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection du fournisseur.
- Renvoie un buffer audio PCM + la fréquence d'échantillonnage. Les plugins doivent rééchantillonner/encoder pour les fournisseurs.
- `listVoices` est facultatif selon le fournisseur. Utilisez-le pour des sélecteurs de voix ou des flux de configuration appartenant au fournisseur.
- Les listes de voix peuvent inclure des métadonnées plus riches comme la locale, le genre et des tags de personnalité pour des sélecteurs conscients du fournisseur.
- OpenAI et ElevenLabs prennent aujourd'hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des fournisseurs vocaux via `api.registerSpeechProvider(...)`.

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

Remarques :

- Conservez la politique TTS, le fallback et la livraison des réponses dans le cœur.
- Utilisez des fournisseurs vocaux pour le comportement de synthèse appartenant au fournisseur.
- L'entrée héritée Microsoft `edge` est normalisée vers l'identifiant de fournisseur `microsoft`.
- Le modèle de responsabilité préféré est orienté entreprise : un même plugin fournisseur peut posséder
  les fournisseurs de texte, de parole, d'image et de futurs médias à mesure qu'OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un fournisseur typé
unique de compréhension des médias au lieu d'un sac générique clé/valeur :

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Remarques :

- Conservez l'orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Conservez le comportement du fournisseur dans le plugin fournisseur.
- L'expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l'aide d'exécution
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
  - les plugins de fonctionnalité/canal consomment `api.runtime.videoGeneration.*`

Pour les aides d'exécution de compréhension des médias, les plugins peuvent appeler :

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

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias
soit l'alias STT plus ancien :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée privilégiée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio de compréhension des médias du cœur (`tools.media.audio`) et l'ordre de fallback des fournisseurs.
- Renvoie `{ text: undefined }` lorsqu'aucune sortie de transcription n'est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste disponible comme alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Remarques :

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements persistants de session.
- OpenClaw n'honore ces champs de remplacement que pour les appelants de confiance.
- Pour les exécutions de fallback appartenant au plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins de confiance à des cibles canoniques spécifiques `provider/model`, ou `"*"` pour autoriser explicitement toute cible.
- Les exécutions de sous-agent de plugins non fiables fonctionnent toujours, mais les demandes de remplacement sont rejetées au lieu de retomber silencieusement sur un fallback.

Pour la recherche web, les plugins peuvent consommer l'aide d'exécution partagée au lieu
d'atteindre le câblage de l'outil agent :

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

Remarques :

- Conservez la sélection du fournisseur, la résolution des identifiants et la sémantique partagée des requêtes dans le cœur.
- Utilisez des fournisseurs de recherche web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée privilégiée pour les plugins de fonctionnalité/canal qui ont besoin d'un comportement de recherche sans dépendre du wrapper d'outil agent.

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

- `generate(...)` : générer une image en utilisant la chaîne configurée de fournisseurs de génération d'images.
- `listProviders(...)` : lister les fournisseurs disponibles de génération d'images et leurs capacités.

## Routes HTTP du Gateway

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

Champs de route :

- `path` : chemin de route sous le serveur HTTP du gateway.
- `auth` : requis. Utilisez `"gateway"` pour exiger l'authentification normale du gateway, ou `"plugin"` pour l'authentification/la vérification de webhook gérée par le plugin.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoyer `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer `auth` explicitement.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d'un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` sur le même niveau d'authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées d'exécution opérateur. Elles sont destinées aux webhooks/vérifications de signature gérés par le plugin, pas aux appels privilégiés aux aides du Gateway.
- Les routes `auth: "gateway"` s'exécutent à l'intérieur d'une portée d'exécution de requête Gateway, mais cette portée est volontairement conservative :
  - l'authentification bearer par secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées d'exécution des routes de plugin épinglées à `operator.write`, même si l'appelant envoie `x-openclaw-scopes`
  - les modes HTTP de confiance porteurs d'identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n'honorent `x-openclaw-scopes` que lorsque l'en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin porteuses d'identité, la portée d'exécution retombe sur `operator.write`
- Règle pratique : ne supposez pas qu'une route de plugin authentifiée gateway est implicitement une surface admin. Si votre route a besoin d'un comportement réservé à l'administration, exigez un mode d'authentification porteur d'identité et documentez le contrat explicite de l'en-tête `x-openclaw-scopes`.

## Chemins d'importation du SDK de plugin

Utilisez les sous-chemins du SDK au lieu de l'import monolithique `openclaw/plugin-sdk` lorsque
vous créez des plugins :

- `openclaw/plugin-sdk/plugin-entry` pour les primitives d'enregistrement des plugins.
- `openclaw/plugin-sdk/core` pour le contrat générique partagé côté plugin.
- `openclaw/plugin-sdk/config-schema` pour l'export du schéma Zod racine
  `openclaw.json` (`OpenClawSchema`).
- Primitives de canal stables telles que `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/secret-input` et
  `openclaw/plugin-sdk/webhook-ingress` pour le
  câblage partagé de configuration/authentification/réponse/webhook. `channel-inbound` est la maison partagée pour le debounce, la correspondance des mentions,
  le formatage d'enveloppe et les aides de contexte d'enveloppe entrante.
  `channel-setup` est la couture étroite de configuration d'installation facultative.
  `setup-runtime` est la surface de configuration sûre à l'exécution utilisée par `setupEntry` /
  démarrage différé, y compris les adaptateurs de patch de configuration sûrs à l'importation.
  `setup-adapter-runtime` est la couture d'adaptateur de configuration de compte consciente de env.
  `setup-tools` est la petite couture d'aide CLI/archive/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/runtime-store` et
  `openclaw/plugin-sdk/directory-runtime` pour les aides partagées d'exécution/de configuration.
  `telegram-command-config` est la couture publique étroite pour la
  normalisation/validation des commandes personnalisées Telegram et reste disponible même si la surface de contrat Telegram groupée est temporairement indisponible.
  `text-runtime` est la couture partagée texte/Markdown/journalisation, y compris
  la suppression du texte visible à l'assistant, les aides de rendu/fragmentation Markdown, les aides de rédaction,
  les aides de balises de directive et les utilitaires de texte sûr.
- Les coutures de canal spécifiques aux approbations doivent de préférence utiliser un seul contrat `approvalCapability` sur le plugin. Le cœur lit alors l'authentification des approbations, la livraison, le rendu et le routage natif via cette seule capacité au lieu de mélanger le comportement d'approbation dans des champs de plugin sans rapport.
- `openclaw/plugin-sdk/channel-runtime` est déconseillé et ne reste que comme shim
  de compatibilité pour les anciens plugins. Le nouveau code doit importer les primitives génériques plus étroites à la place, et le code du dépôt ne doit pas ajouter de nouveaux imports de ce shim.
- Les internes des extensions groupées restent privés. Les plugins externes doivent utiliser uniquement les sous-chemins `openclaw/plugin-sdk/*`. Le code du cœur/des tests OpenClaw peut utiliser les points d'entrée publics du dépôt sous une racine de package de plugin comme `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` et des fichiers à portée étroite tels que
  `login-qr-api.js`. N'importez jamais `src/*` d'un package de plugin depuis le cœur ou depuis une autre extension.
- Découpage des points d'entrée du dépôt :
  `<plugin-package-root>/api.js` est le barrel aides/types,
  `<plugin-package-root>/runtime-api.js` est le barrel réservé au runtime,
  `<plugin-package-root>/index.js` est le point d'entrée du plugin groupé,
  et `<plugin-package-root>/setup-entry.js` est le point d'entrée du plugin de configuration.
- Exemples actuels de fournisseurs groupés :
  - Anthropic utilise `api.js` / `contract-api.js` pour les aides de flux Claude telles que
    `wrapAnthropicProviderStream`, les aides d'en-têtes bêta et l'analyse de `service_tier`.
  - OpenAI utilise `api.js` pour les builders de fournisseurs, les aides de modèle par défaut et les builders de fournisseurs temps réel.
  - OpenRouter utilise `api.js` pour son builder de fournisseur ainsi que des aides d'onboarding/de configuration, tandis que `register.runtime.js` peut toujours réexporter des aides génériques `plugin-sdk/provider-stream` pour un usage local au dépôt.
- Les points d'entrée publics chargés via façade privilégient l'instantané de configuration actif à l'exécution
  lorsqu'il existe, puis retombent sur le fichier de configuration résolu sur disque lorsque
  OpenClaw ne sert pas encore d'instantané d'exécution.
- Les primitives partagées génériques restent le contrat public préféré du SDK. Un petit ensemble réservé de coutures d'aide marquées par des canaux groupés existe encore. Traitez-les comme des coutures de maintenance/compatibilité groupées, pas comme de nouvelles cibles d'importation pour des tiers ; les nouveaux contrats inter-canaux doivent toujours atterrir sur des sous-chemins génériques `plugin-sdk/*` ou sur les barrels locaux du plugin `api.js` /
  `runtime-api.js`.

Remarque de compatibilité :

- Évitez le barrel racine `openclaw/plugin-sdk` pour tout nouveau code.
- Préférez d'abord les primitives stables étroites. Les nouveaux sous-chemins
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool constituent le contrat visé pour le nouveau travail sur les plugins groupés et externes.
  L'analyse/la correspondance des cibles appartient à `openclaw/plugin-sdk/channel-targets`.
  Les barrières d'actions de message et les aides d'identifiant de message pour réactions appartiennent à
  `openclaw/plugin-sdk/channel-actions`.
- Les barrels d'aide spécifiques à une extension groupée ne sont pas stables par défaut. Si une
  aide n'est nécessaire que pour une extension groupée, gardez-la derrière la couture locale
  `api.js` ou `runtime-api.js` de l'extension au lieu de la promouvoir dans
  `openclaw/plugin-sdk/<extension>`.
- Les nouvelles coutures d'aide partagées doivent être génériques, et non marquées par un canal. L'analyse
  partagée des cibles appartient à `openclaw/plugin-sdk/channel-targets` ; les internes spécifiques à un canal restent derrière la couture `api.js` ou `runtime-api.js`
  locale du plugin propriétaire.
- Des sous-chemins spécifiques à une capacité tels que `image-generation`,
  `media-understanding` et `speech` existent parce que les plugins groupés/natifs les utilisent
  aujourd'hui. Leur présence ne signifie pas à elle seule que chaque aide exportée est un
  contrat externe figé à long terme.

## Schémas de l'outil message

Les plugins doivent posséder les contributions au schéma spécifiques au canal dans `describeMessageTool(...)`.
Gardez les champs spécifiques au fournisseur dans le plugin, pas dans le cœur partagé.

Pour les fragments de schéma partagés portables, réutilisez les aides génériques exportées via
`openclaw/plugin-sdk/channel-actions` :

- `createMessageToolButtonsSchema()` pour les charges utiles de style grille de boutons
- `createMessageToolCardSchema()` pour les charges utiles de carte structurée

Si une forme de schéma n'a de sens que pour un seul fournisseur, définissez-la dans les sources propres de ce plugin au lieu de la promouvoir dans le SDK partagé.

## Résolution de cible de canal

Les plugins de canal doivent posséder la sémantique de cible spécifique au canal. Gardez l'hôte
sortant partagé générique et utilisez la surface d'adaptateur de messagerie pour les règles du fournisseur :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans le répertoire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à la résolution de type identifiant au lieu de la recherche dans le répertoire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque le
  cœur a besoin d'une résolution finale appartenant au fournisseur après normalisation ou après un échec de recherche dans le répertoire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session spécifique au fournisseur une fois qu'une cible est résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent se produire avant la
  recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un identifiant de cible explicite/natif ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au fournisseur, pas pour une recherche large dans le répertoire.
- Conservez les identifiants natifs du fournisseur comme les identifiants de chat, identifiants de thread, JID, handles et identifiants de salon à l'intérieur des valeurs `target` ou des paramètres spécifiques au fournisseur, pas dans des champs génériques du SDK.

## Répertoires adossés à la configuration

Les plugins qui dérivent des entrées de répertoire depuis la configuration doivent conserver cette logique dans le
plugin et réutiliser les aides partagées de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu'un canal a besoin de pairs/groupes adossés à la configuration comme :

- pairs de DM pilotés par allowlist
- cartes de canaux/groupes configurées
- fallbacks de répertoire statiques à portée de compte

Les aides partagées dans `directory-runtime` ne gèrent que les opérations génériques :

- filtrage de requête
- application de limite
- aides de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L'inspection des comptes propre au canal et la normalisation des identifiants doivent rester dans l'implémentation du plugin.

## Catalogues de fournisseurs

Les plugins fournisseurs peuvent définir des catalogues de modèles pour l'inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle écrite par OpenClaw dans
`models.providers` :

- `{ provider }` pour une entrée fournisseur
- `{ providers }` pour plusieurs entrées fournisseur

Utilisez `catalog` lorsque le plugin possède des identifiants de modèle propres au fournisseur, des valeurs par défaut de base URL ou des métadonnées de modèle protégées par authentification.

`catalog.order` contrôle le moment où le catalogue d'un plugin fusionne par rapport aux
fournisseurs implicites intégrés d'OpenClaw :

- `simple` : fournisseurs simples pilotés par clé API ou env
- `profile` : fournisseurs qui apparaissent lorsque des profils d'authentification existent
- `paired` : fournisseurs qui synthétisent plusieurs entrées de fournisseur liées
- `late` : dernier passage, après les autres fournisseurs implicites

Les fournisseurs ultérieurs gagnent en cas de collision de clé, afin que les plugins puissent intentionnellement remplacer une entrée fournisseur intégrée avec le même identifiant fournisseur.

Compatibilité :

- `discovery` fonctionne encore comme alias hérité
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection en lecture seule des canaux

Si votre plugin enregistre un canal, il est préférable d'implémenter
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin d'exécution. Il peut supposer que les identifiants
  sont entièrement matérialisés et peut échouer rapidement lorsque les secrets requis sont absents.
- Les chemins de commande en lecture seule tels que `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` et les flux de doctor/réparation de configuration ne doivent pas avoir besoin de matérialiser les identifiants d'exécution simplement pour décrire la configuration.

Comportement recommandé pour `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs source/statut d'identifiant lorsque c'est pertinent, tels que :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n'avez pas besoin de renvoyer les valeurs brutes des jetons simplement pour signaler une disponibilité en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant) suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu'un identifiant est configuré via SecretRef mais indisponible dans le chemin de commande courant.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande » au lieu de planter ou d'indiquer à tort que le compte n'est pas configuré.

## Packs de packages

Un répertoire de plugin peut inclure un `package.json` avec `openclaw.extensions` :

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l'identifiant du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Barrière de sécurité : chaque entrée `openclaw.extensions` doit rester à l'intérieur du répertoire du plugin
après résolution des symlinks. Les entrées qui s'échappent du répertoire du package sont
rejetées.

Remarque de sécurité : `openclaw plugins install` installe les dépendances de plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement à l'exécution). Gardez les arbres de dépendances des plugins « JS/TS purs » et évitez les packages qui nécessitent des constructions `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger réservé à la configuration.
Lorsque OpenClaw a besoin des surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu'un plugin de canal est activé mais encore non configuré, il charge `setupEntry`
au lieu du point d'entrée complet du plugin. Cela permet de garder un démarrage et une configuration plus légers
lorsque votre point d'entrée principal câble aussi des outils, hooks ou autre code
réservé à l'exécution.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire choisir à un plugin de canal le même chemin `setupEntry` pendant la
phase de démarrage pré-écoute du gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway ne commence à écouter. En pratique, cela signifie que le point d'entrée de configuration
doit enregistrer toute capacité appartenant au canal dont le démarrage dépend, telle que :

- l'enregistrement du canal lui-même
- toutes les routes HTTP qui doivent être disponibles avant que le gateway ne commence à écouter
- toutes les méthodes gateway, outils ou services qui doivent exister pendant cette même fenêtre

Si votre point d'entrée complet possède encore une capacité de démarrage requise, n'activez pas
ce drapeau. Conservez le comportement par défaut du plugin et laissez OpenClaw charger le
point d'entrée complet au démarrage.

Les canaux groupés peuvent aussi publier des aides de surface de contrat réservées à la configuration que le cœur
peut consulter avant que le runtime complet du canal soit chargé. La surface actuelle de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu'il doit promouvoir une configuration de canal héritée à compte unique
dans `channels.<id>.accounts.*` sans charger le point d'entrée complet du plugin.
Matrix est l'exemple groupé actuel : il déplace seulement les clés d'authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte des surfaces de contrat groupées. Le temps d'importation reste léger ; la surface de promotion est chargée seulement lors du premier usage au lieu de réentrer dans le démarrage du canal groupé lors de l'importation du module.

Lorsque ces surfaces de démarrage incluent des méthodes RPC du gateway, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms administrateur du cœur (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se résolvent toujours
vers `operator.admin`, même si un plugin demande une portée plus étroite.

Exemple :

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
des indications d'installation via `openclaw.install`. Cela évite au cœur de contenir les données du catalogue.

Exemple :

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

Champs utiles de `openclaw.channel` au-delà de l'exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces plus riches de catalogue/statut
- `docsLabel` : remplace le texte du lien docs
- `preferOver` : identifiants de plugin/canal de priorité inférieure que cette entrée de catalogue doit surpasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie des surfaces de sélection
- `markdownCapable` : marque le canal comme compatible Markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu'il est défini à `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration/configure lorsqu'il est défini à `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias hérités toujours acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait entrer le canal dans le flux quickstart standard `allowFrom`
- `forceAccountBinding` : exige une liaison explicite de compte même lorsqu'un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d'annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple un export
de registre MPM). Déposez un fichier JSON à l'un des emplacements suivants :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. L'analyseur accepte aussi `"packages"` ou `"plugins"` comme alias hérités pour la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l'orchestration du contexte de session pour l'ingestion, l'assemblage
et la compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez cela lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut plutôt que
simplement ajouter memory search ou des hooks.

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

Si votre moteur ne possède **pas** l'algorithme de compaction, gardez `compact()`
implémenté et déléguez-le explicitement :

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

Lorsqu'un plugin a besoin d'un comportement qui ne correspond pas à l'API actuelle, ne contournez pas
le système de plugins via un accès privé direct. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez du comportement partagé que le cœur doit posséder : politique, fallback, fusion de configuration,
   cycle de vie, sémantique côté canal et forme de l'aide d'exécution.
2. ajouter des surfaces typées d'enregistrement/runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. câbler les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   pas en important directement une implémentation de fournisseur.
4. enregistrer les implémentations fournisseurs
   Les plugins fournisseurs enregistrent ensuite leurs backends sur cette capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que la responsabilité et la forme d'enregistrement restent explicites dans le temps.

C'est ainsi qu'OpenClaw reste opinionné sans devenir codé en dur selon la vision d'un seul
fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l'implémentation doit généralement toucher ces
surfaces ensemble :

- types de contrat du cœur dans `src/<capability>/types.ts`
- runner/aide d'exécution du cœur dans `src/<capability>/runtime.ts`
- surface d'enregistrement de l'API de plugin dans `src/plugins/types.ts`
- câblage du registre de plugins dans `src/plugins/registry.ts`
- exposition du runtime des plugins dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal doivent la consommer
- aides de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions de responsabilité/contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l'une de ces surfaces manque, c'est généralement le signe que la capacité n'est
pas encore complètement intégrée.

### Modèle de capacité

Modèle minimal :

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

Modèle de test de contrat :

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Cela garde la règle simple :

- le cœur possède le contrat de capacité + l'orchestration
- les plugins fournisseurs possèdent les implémentations fournisseurs
- les plugins de fonctionnalité/canal consomment les aides d'exécution
- les tests de contrat gardent la responsabilité explicite
