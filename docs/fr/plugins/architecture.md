---
read_when:
    - Création ou débogage de Plugins OpenClaw natifs
    - Comprendre le modèle de capacités des plugins ou les limites d’ownership
    - Travailler sur le pipeline de chargement ou le registre des plugins
    - Implémentation de hooks de runtime de provider ou de plugins de canal
sidebarTitle: Internals
summary: 'Internes des plugins : modèle de capacités, ownership, contrats, pipeline de chargement et assistants de runtime'
title: Internes des plugins
x-i18n:
    generated_at: "2026-04-23T14:00:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Internes des plugins

<Info>
  Ceci est la **référence d’architecture approfondie**. Pour des guides pratiques, voir :
  - [Install and use plugins](/fr/tools/plugin) — guide utilisateur
  - [Getting Started](/fr/plugins/building-plugins) — premier tutoriel de plugin
  - [Channel Plugins](/fr/plugins/sdk-channel-plugins) — créer un canal de messagerie
  - [Provider Plugins](/fr/plugins/sdk-provider-plugins) — créer un provider de modèle
  - [SDK Overview](/fr/plugins/sdk-overview) — carte d’import et API d’enregistrement
</Info>

Cette page couvre l’architecture interne du système de plugins OpenClaw.

## Modèle public de capacités

Les capacités sont le modèle public de **Plugin natif** dans OpenClaw. Chaque
Plugin OpenClaw natif s’enregistre pour un ou plusieurs types de capacités :

| Capacité              | Méthode d’enregistrement                       | Exemples de plugins                  |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| Inférence de texte    | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Backend d’inférence CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`                |
| Parole                | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transcription temps réel | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voix temps réel       | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Compréhension des médias | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                 |
| Génération d’images   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Génération de musique | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Génération de vidéo   | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Récupération Web      | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Recherche Web         | `api.registerWebSearchProvider(...)`           | `google`                             |
| Canal / messagerie    | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Un plugin qui enregistre zéro capacité mais fournit des hooks, des outils ou des
services est un plugin **legacy hook-only**. Ce modèle reste entièrement pris en charge.

### Position de compatibilité externe

Le modèle de capacités est intégré dans le cœur et utilisé aujourd’hui par les plugins
natifs/intégrés, mais la compatibilité des plugins externes a encore besoin d’un seuil plus strict que « c’est
exporté, donc c’est figé ».

Directives actuelles :

- **plugins externes existants :** maintenir le fonctionnement des intégrations basées sur des hooks ; traitez
  cela comme la base de compatibilité
- **nouveaux plugins natifs/intégrés :** préférez un enregistrement explicite des capacités plutôt que
  des intrusions spécifiques à un fournisseur ou de nouveaux modèles hook-only
- **plugins externes adoptant l’enregistrement des capacités :** autorisés, mais traitez les surfaces d’assistance
  spécifiques aux capacités comme évolutives, sauf si la documentation marque explicitement un contrat comme stable

Règle pratique :

- les API d’enregistrement de capacités sont la direction prévue
- les hooks legacy restent le chemin le plus sûr sans rupture pour les plugins externes pendant
  la transition
- toutes les sous-routes d’assistants exportées ne se valent pas ; préférez le contrat
  documenté étroit, et non des exports d’assistants incidentels

### Formes de plugins

OpenClaw classe chaque plugin chargé dans une forme selon son comportement réel
d’enregistrement (et pas seulement selon des métadonnées statiques) :

- **plain-capability** -- enregistre exactement un type de capacité (par exemple un
  plugin uniquement provider comme `mistral`)
- **hybrid-capability** -- enregistre plusieurs types de capacités (par exemple
  `openai` possède l’inférence de texte, la parole, la compréhension des médias et la génération
  d’images)
- **hook-only** -- enregistre uniquement des hooks (typés ou personnalisés), sans capacités,
  outils, commandes ni services
- **non-capability** -- enregistre des outils, des commandes, des services ou des routes mais aucune
  capacité

Utilisez `openclaw plugins inspect <id>` pour voir la forme d’un plugin et la répartition de ses capacités. Voir la [référence CLI](/fr/cli/plugins#inspect) pour les détails.

### Hooks legacy

Le hook `before_agent_start` reste pris en charge comme chemin de compatibilité pour
les plugins hook-only. Des plugins legacy réels en dépendent encore.

Orientation :

- le garder fonctionnel
- le documenter comme legacy
- préférer `before_model_resolve` pour le travail de remplacement de modèle/provider
- préférer `before_prompt_build` pour le travail de mutation de prompt
- ne le supprimer qu’après la baisse de l’usage réel et quand la couverture par fixtures prouve la sécurité de la migration

### Signaux de compatibilité

Quand vous exécutez `openclaw doctor` ou `openclaw plugins inspect <id>`, vous pouvez voir
l’une de ces étiquettes :

| Signal                   | Signification                                               |
| ------------------------ | ----------------------------------------------------------- |
| **config valid**         | La config est analysée correctement et les plugins sont résolus |
| **compatibility advisory** | Le plugin utilise un modèle pris en charge mais plus ancien (par ex. `hook-only`) |
| **legacy warning**       | Le plugin utilise `before_agent_start`, qui est obsolète    |
| **hard error**           | La config est invalide ou le plugin n’a pas pu être chargé  |

Ni `hook-only` ni `before_agent_start` ne casseront votre plugin aujourd’hui --
`hook-only` est informatif, et `before_agent_start` ne déclenche qu’un avertissement. Ces
signaux apparaissent aussi dans `openclaw status --all` et `openclaw plugins doctor`.

## Vue d’ensemble de l’architecture

Le système de plugins d’OpenClaw comporte quatre couches :

1. **Manifeste + découverte**
   OpenClaw trouve les plugins candidats à partir des chemins configurés, des racines de workspace,
   des racines globales de plugins et des plugins intégrés. La découverte lit d’abord les
   manifestes natifs `openclaw.plugin.json` ainsi que les manifestes de bundle pris en charge.
2. **Activation + validation**
   Le cœur décide si un plugin découvert est activé, désactivé, bloqué ou
   sélectionné pour un emplacement exclusif tel que la mémoire.
3. **Chargement du runtime**
   Les plugins OpenClaw natifs sont chargés in-process via jiti et enregistrent leurs
   capacités dans un registre central. Les bundles compatibles sont normalisés en
   enregistrements de registre sans importer de code runtime.
4. **Consommation de surface**
   Le reste d’OpenClaw lit le registre pour exposer les outils, canaux, configuration
   des providers, hooks, routes HTTP, commandes CLI et services.

Pour la CLI plugin en particulier, la découverte de commande racine est divisée en deux phases :

- les métadonnées au moment du parsing proviennent de `registerCli(..., { descriptors: [...] })`
- le vrai module CLI du plugin peut rester paresseux et s’enregistrer à la première invocation

Cela permet de garder le code CLI appartenant au plugin dans le plugin tout en laissant OpenClaw
réserver les noms de commandes racine avant le parsing.

La limite de conception importante :

- la découverte + la validation de la configuration doivent fonctionner à partir de **métadonnées de manifeste/schéma**
  sans exécuter de code de plugin
- le comportement runtime natif provient du chemin `register(api)` du module plugin

Cette séparation permet à OpenClaw de valider la configuration, d’expliquer les plugins manquants/désactivés et
de construire des indications UI/schéma avant que le runtime complet ne soit actif.

### Plugins de canal et outil de message partagé

Les plugins de canal n’ont pas besoin d’enregistrer un outil séparé send/edit/react pour
les actions de chat normales. OpenClaw conserve un seul outil `message` partagé dans le cœur, et
les plugins de canal possèdent la découverte et l’exécution spécifiques au canal qui le sous-tendent.

La limite actuelle est la suivante :

- le cœur possède l’hôte de l’outil `message` partagé, le câblage des prompts, la tenue des comptes des sessions/threads
  et la répartition de l’exécution
- les plugins de canal possèdent la découverte d’actions à portée, la découverte des capacités et tous
  les fragments de schéma spécifiques au canal
- les plugins de canal possèdent la grammaire de conversation de session spécifique au provider, par exemple
  la façon dont les ids de conversation encodent les ids de thread ou héritent de conversations parentes
- les plugins de canal exécutent l’action finale via leur adaptateur d’action

Pour les plugins de canal, la surface SDK est
`ChannelMessageActionAdapter.describeMessageTool(...)`. Cet appel de découverte unifié permet à un plugin
de renvoyer ensemble ses actions visibles, ses capacités et ses contributions au schéma
afin que ces éléments ne divergent pas.

Lorsqu’un paramètre d’outil de message spécifique à un canal transporte une source média telle qu’un
chemin local ou une URL média distante, le plugin doit aussi renvoyer
`mediaSourceParams` depuis `describeMessageTool(...)`. Le cœur utilise cette
liste explicite pour appliquer la normalisation des chemins sandbox et les indications d’accès média en sortie
sans coder en dur des noms de paramètres appartenant au plugin.
Préférez ici des mappages à portée d’action, et non une liste plate à l’échelle du canal, afin qu’un
paramètre média réservé à un profil ne soit pas normalisé sur des actions sans rapport comme
`send`.

Le cœur transmet la portée runtime dans cette étape de découverte. Les champs importants incluent :

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` entrant approuvé

C’est important pour les plugins sensibles au contexte. Un canal peut masquer ou exposer des
actions de message en fonction du compte actif, du salon/thread/message courant, ou
de l’identité approuvée du demandeur sans coder en dur des branches spécifiques au canal dans
l’outil `message` du cœur.

C’est pourquoi les changements de routage du runner embarqué restent du travail de plugin : le runner est
responsable de la transmission de l’identité actuelle de chat/session dans la limite de découverte du plugin afin que l’outil `message` partagé expose la bonne surface appartenant au canal pour le tour courant.

Pour les assistants d’exécution appartenant au canal, les plugins intégrés doivent conserver le runtime
d’exécution dans leurs propres modules d’extension. Le cœur ne possède plus les runtimes
d’actions de message Discord, Slack, Telegram ou WhatsApp sous `src/agents/tools`.
Nous ne publions pas de sous-routes séparées `plugin-sdk/*-action-runtime`, et les
plugins intégrés doivent importer directement leur propre code runtime local depuis leurs
modules appartenant à l’extension.

La même limite s’applique de manière générale aux joints SDK nommés par provider : le cœur ne doit
pas importer de barrels pratiques spécifiques à un canal pour Slack, Discord, Signal,
WhatsApp ou des extensions similaires. Si le cœur a besoin d’un comportement, il doit soit consommer le
barrel `api.ts` / `runtime-api.ts` du plugin intégré lui-même, soit promouvoir ce besoin
dans une capacité générique étroite du SDK partagé.

Pour les sondages en particulier, il existe deux chemins d’exécution :

- `outbound.sendPoll` est la base partagée pour les canaux qui correspondent au modèle de
  sondage commun
- `actions.handleAction("poll")` est le chemin préféré pour la sémantique de sondage spécifique au canal
  ou les paramètres de sondage supplémentaires

Le cœur diffère désormais l’analyse partagée des sondages jusqu’à ce que la répartition du sondage plugin refuse
l’action, afin que les gestionnaires de sondages appartenant au plugin puissent accepter des champs de sondage spécifiques au canal sans être bloqués d’abord par l’analyseur de sondage générique.

Voir [Load pipeline](#load-pipeline) pour la séquence complète de démarrage.

## Modèle d’ownership des capacités

OpenClaw traite un plugin natif comme la limite d’ownership pour une **entreprise** ou une
**fonctionnalité**, et non comme un fourre-tout d’intégrations sans rapport.

Cela signifie que :

- un plugin d’entreprise doit généralement posséder toutes les surfaces OpenClaw
  de cette entreprise
- un plugin de fonctionnalité doit généralement posséder la surface complète de la
  fonctionnalité qu’il introduit
- les canaux doivent consommer les capacités partagées du cœur au lieu de réimplémenter
  le comportement provider de manière ad hoc

Exemples :

- le plugin intégré `openai` possède le comportement de provider de modèle OpenAI ainsi que le comportement OpenAI
  pour la parole + la voix temps réel + la compréhension des médias + la génération d’images
- le plugin intégré `elevenlabs` possède le comportement de parole ElevenLabs
- le plugin intégré `microsoft` possède le comportement de parole Microsoft
- le plugin intégré `google` possède le comportement de provider de modèle Google ainsi que le comportement Google
  pour la compréhension des médias + la génération d’images + la recherche Web
- le plugin intégré `firecrawl` possède le comportement de récupération Web Firecrawl
- les plugins intégrés `minimax`, `mistral`, `moonshot` et `zai` possèdent leurs
  backends de compréhension des médias
- le plugin intégré `qwen` possède le comportement de provider de texte Qwen ainsi que
  le comportement de compréhension des médias et de génération de vidéo
- le plugin `voice-call` est un plugin de fonctionnalité : il possède le transport d’appel, les outils,
  la CLI, les routes et le pont de flux média Twilio, mais il consomme les capacités partagées de parole
  ainsi que de transcription temps réel et de voix temps réel au lieu
  d’importer directement les plugins fournisseurs

L’état final visé est :

- OpenAI vit dans un seul plugin même s’il couvre les modèles de texte, la parole, les images et
  la future vidéo
- un autre fournisseur peut faire de même pour sa propre surface
- les canaux ne se soucient pas du plugin fournisseur qui possède le provider ; ils consomment le
  contrat de capacité partagé exposé par le cœur

C’est la distinction clé :

- **plugin** = limite d’ownership
- **capacité** = contrat du cœur que plusieurs plugins peuvent implémenter ou consommer

Donc si OpenClaw ajoute un nouveau domaine comme la vidéo, la première question n’est pas
« quel provider doit coder en dur la gestion de la vidéo ? » La première question est « quel est
le contrat de capacité vidéo du cœur ? » Une fois ce contrat en place, les plugins fournisseurs
peuvent s’y enregistrer et les plugins de canal/fonctionnalité peuvent le consommer.

Si la capacité n’existe pas encore, la bonne démarche est généralement :

1. définir la capacité manquante dans le cœur
2. l’exposer de manière typée via l’API/le runtime du plugin
3. connecter les canaux/fonctionnalités à cette capacité
4. laisser les plugins fournisseurs enregistrer des implémentations

Cela garde un ownership explicite tout en évitant un comportement du cœur qui dépend d’un
seul fournisseur ou d’un chemin de code spécifique à un plugin ponctuel.

### Couches de capacités

Utilisez ce modèle mental pour décider où le code doit se trouver :

- **couche de capacité du cœur** : orchestration partagée, policy, fallback, règles de fusion
  de configuration, sémantique de livraison et contrats typés
- **couche de plugin fournisseur** : API spécifiques au fournisseur, authentification, catalogues de modèles, synthèse
  vocale, génération d’images, futurs backends vidéo, points de terminaison d’usage
- **couche de plugin canal/fonctionnalité** : intégration Slack/Discord/voice-call/etc.
  qui consomme les capacités du cœur et les présente sur une surface

Par exemple, le TTS suit cette structure :

- le cœur possède la policy TTS au moment de la réponse, l’ordre de fallback, les préférences et la livraison par canal
- `openai`, `elevenlabs` et `microsoft` possèdent les implémentations de synthèse
- `voice-call` consomme l’assistant runtime TTS de téléphonie

Ce même modèle doit être privilégié pour les futures capacités.

### Exemple de plugin d’entreprise multi-capacités

Un plugin d’entreprise doit sembler cohérent vu de l’extérieur. Si OpenClaw dispose de
contrats partagés pour les modèles, la parole, la transcription temps réel, la voix temps réel, la compréhension
des médias, la génération d’images, la génération de vidéo, la récupération Web et la recherche Web,
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
      // hooks auth/catalogue de modèles/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // config de parole fournisseur — implémenter directement l’interface SpeechProviderPlugin
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
        // logique d’identifiants + récupération
      }),
    );
  },
};

export default plugin;
```

Ce qui compte n’est pas le nom exact des assistants. C’est la structure qui compte :

- un plugin possède la surface du fournisseur
- le cœur possède toujours les contrats de capacité
- les canaux et plugins de fonctionnalité consomment les assistants `api.runtime.*`, pas le code du fournisseur
- les tests de contrat peuvent vérifier que le plugin a enregistré les capacités qu’il
  prétend posséder

### Exemple de capacité : compréhension vidéo

OpenClaw traite déjà la compréhension image/audio/vidéo comme une capacité
partagée unique. Le même modèle d’ownership s’y applique :

1. le cœur définit le contrat de compréhension des médias
2. les plugins fournisseurs enregistrent `describeImage`, `transcribeAudio` et
   `describeVideo` selon le cas
3. les plugins de canal et de fonctionnalité consomment le comportement partagé du cœur au lieu de
   se connecter directement au code fournisseur

Cela évite d’intégrer dans le cœur les hypothèses vidéo d’un fournisseur. Le plugin possède
la surface fournisseur ; le cœur possède le contrat de capacité et le comportement de fallback.

La génération de vidéo utilise déjà cette même séquence : le cœur possède le contrat de
capacité typé et l’assistant runtime, et les plugins fournisseurs enregistrent des
implémentations `api.registerVideoGenerationProvider(...)` dessus.

Besoin d’une checklist concrète de déploiement ? Voir
[Capability Cookbook](/fr/plugins/architecture).

## Contrats et application

La surface de l’API plugin est intentionnellement typée et centralisée dans
`OpenClawPluginApi`. Ce contrat définit les points d’enregistrement pris en charge et
les assistants runtime sur lesquels un plugin peut s’appuyer.

Pourquoi c’est important :

- les auteurs de plugins obtiennent une norme interne stable unique
- le cœur peut rejeter un ownership dupliqué, par exemple deux plugins enregistrant le même
  id de provider
- le démarrage peut faire remonter des diagnostics exploitables pour un enregistrement mal formé
- les tests de contrat peuvent imposer l’ownership des plugins intégrés et empêcher une dérive silencieuse

Il existe deux couches d’application :

1. **application de l’enregistrement à l’exécution**
   Le registre des plugins valide les enregistrements au chargement des plugins. Exemples :
   les ids de provider dupliqués, les ids de provider de parole dupliqués et les enregistrements
   mal formés produisent des diagnostics de plugin au lieu d’un comportement indéfini.
2. **tests de contrat**
   Les plugins intégrés sont capturés dans des registres de contrat pendant les exécutions de test afin
   qu’OpenClaw puisse affirmer explicitement l’ownership. Aujourd’hui, cela est utilisé pour les
   providers de modèles, les providers de parole, les providers de recherche Web et l’ownership d’enregistrement des plugins intégrés.

L’effet pratique est qu’OpenClaw sait, en amont, quel plugin possède quelle
surface. Cela permet au cœur et aux canaux de se composer proprement car l’ownership est
déclaré, typé et testable au lieu d’être implicite.

### Ce qui doit appartenir à un contrat

Les bons contrats de plugin sont :

- typés
- petits
- spécifiques à une capacité
- possédés par le cœur
- réutilisables par plusieurs plugins
- consommables par les canaux/fonctionnalités sans connaissance du fournisseur

Les mauvais contrats de plugin sont :

- de la policy spécifique à un fournisseur cachée dans le cœur
- des échappatoires ponctuelles de plugin qui contournent le registre
- du code de canal qui va directement dans une implémentation fournisseur
- des objets runtime ad hoc qui ne font pas partie de `OpenClawPluginApi` ou
  de `api.runtime`

En cas de doute, augmentez le niveau d’abstraction : définissez d’abord la capacité, puis
laissez les plugins s’y brancher.

## Modèle d’exécution

Les plugins OpenClaw natifs s’exécutent **dans le processus** avec le Gateway. Ils ne sont
pas sandboxés. Un plugin natif chargé a la même limite de confiance au niveau processus que
le code du cœur.

Implications :

- un plugin natif peut enregistrer des outils, des gestionnaires réseau, des hooks et des services
- un bug dans un plugin natif peut faire planter ou déstabiliser le gateway
- un plugin natif malveillant équivaut à une exécution de code arbitraire dans le
  processus OpenClaw

Les bundles compatibles sont plus sûrs par défaut parce qu’OpenClaw les traite actuellement
comme des packs de métadonnées/contenu. Dans les versions actuelles, cela signifie surtout des
Skills intégrées.

Utilisez des listes d’autorisation et des chemins explicites d’installation/chargement pour les plugins non intégrés.
Traitez les plugins de workspace comme du code de développement, et non comme des valeurs par défaut de production.

Pour les noms de packages de workspace intégrés, gardez l’id du plugin ancré dans le nom npm :
`@openclaw/<id>` par défaut, ou un suffixe typé approuvé tel que
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quand
le package expose intentionnellement un rôle de plugin plus étroit.

Note importante sur la confiance :

- `plugins.allow` fait confiance aux **ids de plugin**, pas à la provenance de la source.
- Un plugin de workspace avec le même id qu’un plugin intégré masque intentionnellement
  la copie intégrée quand ce plugin de workspace est activé/sur liste d’autorisation.
- C’est normal et utile pour le développement local, les tests de correctifs et les hotfixes.
- La confiance envers les plugins intégrés est résolue à partir de l’instantané de la source — le manifeste et
  le code sur disque au moment du chargement — plutôt qu’à partir des métadonnées d’installation. Un enregistrement
  d’installation corrompu ou substitué ne peut pas élargir silencieusement la surface de confiance
  d’un plugin intégré au-delà de ce que la source réelle revendique.

## Limite d’export

OpenClaw exporte des capacités, pas des commodités d’implémentation.

Gardez public l’enregistrement des capacités. Réduisez les exports d’assistants hors contrat :

- sous-routes d’assistants spécifiques à un plugin intégré
- sous-routes de plomberie runtime non destinées à une API publique
- assistants pratiques spécifiques à un fournisseur
- assistants de configuration/onboarding qui sont des détails d’implémentation

Certaines sous-routes d’assistants de plugins intégrés restent encore dans la carte
d’export SDK générée pour des raisons de compatibilité et de maintenance des plugins intégrés. Les exemples actuels incluent
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, ainsi que plusieurs joints `plugin-sdk/matrix*`. Traitez-les comme
des exports réservés de détail d’implémentation, et non comme le modèle SDK recommandé pour les
nouveaux plugins tiers.

## Pipeline de chargement

Au démarrage, OpenClaw fait approximativement ceci :

1. découvrir les racines candidates de plugins
2. lire les manifestes natifs ou compatibles bundle et les métadonnées de package
3. rejeter les candidats non sûrs
4. normaliser la configuration des plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. décider de l’activation pour chaque candidat
6. charger les modules natifs activés : les modules intégrés construits utilisent un chargeur natif ;
   les plugins natifs non construits utilisent jiti
7. appeler les hooks natifs `register(api)` et collecter les enregistrements dans le registre des plugins
8. exposer le registre aux surfaces de commandes/runtime

<Note>
`activate` est un alias legacy de `register` — le chargeur résout celui qui est présent (`def.register ?? def.activate`) et l’appelle au même endroit. Tous les plugins intégrés utilisent `register` ; préférez `register` pour les nouveaux plugins.
</Note>

Les barrières de sécurité ont lieu **avant** l’exécution runtime. Les candidats sont bloqués
lorsque l’entrée sort de la racine du plugin, que le chemin est modifiable par tous ou que l’ownership du chemin
semble suspect pour des plugins non intégrés.

### Comportement manifest-first

Le manifeste est la source de vérité du plan de contrôle. OpenClaw l’utilise pour :

- identifier le plugin
- découvrir les canaux/Skills/schémas de configuration déclarés ou les capacités du bundle
- valider `plugins.entries.<id>.config`
- enrichir les libellés/placeholders de Control UI
- afficher les métadonnées d’installation/de catalogue
- préserver des descripteurs peu coûteux d’activation et de configuration sans charger le runtime du plugin

Pour les plugins natifs, le module runtime est la partie plan de données. Il enregistre le
comportement réel comme les hooks, outils, commandes ou flux de provider.

Les blocs facultatifs du manifeste `activation` et `setup` restent sur le plan de contrôle.
Ce sont uniquement des descripteurs de métadonnées pour la planification d’activation et la découverte de configuration ;
ils ne remplacent pas l’enregistrement runtime, `register(...)` ou `setupEntry`.
Les premiers consommateurs d’activation en direct utilisent désormais les indices du manifeste sur les commandes, canaux et providers
pour restreindre le chargement des plugins avant une matérialisation plus large du registre :

- Le chargement CLI se restreint aux plugins qui possèdent la commande primaire demandée
- la résolution de configuration/de plugin de canal se restreint aux plugins qui possèdent l’id de
  canal demandé
- la résolution explicite de configuration/runtime de provider se restreint aux plugins qui possèdent l’
  id de provider demandé

La découverte de configuration préfère maintenant les ids possédés par les descripteurs tels que `setup.providers` et
`setup.cliBackends` pour restreindre les plugins candidats avant de revenir à
`setup-api` pour les plugins qui ont encore besoin de hooks runtime au moment de la configuration. Si plus d’un
plugin découvert revendique le même id normalisé de provider de configuration ou de backend CLI,
la recherche de configuration refuse le propriétaire ambigu au lieu de s’appuyer sur l’ordre de
découverte.

### Ce que le chargeur met en cache

OpenClaw conserve de courts caches in-process pour :

- les résultats de découverte
- les données du registre de manifeste
- les registres de plugins chargés

Ces caches réduisent les démarrages par salves et le surcoût des commandes répétées. Il faut
les considérer comme des caches de performance de courte durée, et non comme de la persistance.

Note de performance :

- Définissez `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` pour désactiver ces caches.
- Réglez les fenêtres de cache avec `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` et
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modèle de registre

Les plugins chargés ne modifient pas directement des globals aléatoires du cœur. Ils s’enregistrent dans un
registre central des plugins.

Le registre suit :

- les enregistrements de plugin (identité, source, origine, statut, diagnostics)
- les outils
- les hooks legacy et les hooks typés
- les canaux
- les providers
- les gestionnaires RPC Gateway
- les routes HTTP
- les enregistreurs CLI
- les services en arrière-plan
- les commandes possédées par le plugin

Les fonctionnalités du cœur lisent ensuite dans ce registre au lieu de parler directement aux modules
de plugin. Cela garde le chargement à sens unique :

- module plugin -> enregistrement dans le registre
- runtime du cœur -> consommation du registre

Cette séparation est importante pour la maintenabilité. Cela signifie que la plupart des surfaces du cœur n’ont
besoin que d’un seul point d’intégration : « lire le registre », et non « gérer
spécifiquement chaque module plugin ».

## Callbacks de liaison de conversation

Les plugins qui lient une conversation peuvent réagir quand une approbation est résolue.

Utilisez `api.onConversationBindingResolved(...)` pour recevoir un callback après qu’une demande de liaison
est approuvée ou refusée :

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Une liaison existe maintenant pour ce plugin + cette conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // La demande a été refusée ; effacer tout état local en attente.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Champs de la charge utile du callback :

- `status` : `"approved"` ou `"denied"`
- `decision` : `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding` : la liaison résolue pour les demandes approuvées
- `request` : le résumé de la demande d’origine, l’indication de détachement, l’id de l’expéditeur et
  les métadonnées de conversation

Ce callback est uniquement une notification. Il ne change pas qui est autorisé à lier une
conversation, et il s’exécute après la fin du traitement d’approbation du cœur.

## Hooks runtime de provider

Les plugins provider ont maintenant deux couches :

- métadonnées de manifeste : `providerAuthEnvVars` pour une recherche peu coûteuse de l’authentification provider par env
  avant le chargement runtime, `providerAuthAliases` pour les variantes de provider qui partagent
  l’authentification, `channelEnvVars` pour une recherche peu coûteuse des env/de la configuration de canal avant le chargement
  runtime, ainsi que `providerAuthChoices` pour des libellés peu coûteux de onboarding/choix d’authentification et
  des métadonnées de drapeaux CLI avant le chargement runtime
- hooks au moment de la configuration : `catalog` / ancien `discovery` plus `applyConfigDefaults`
- hooks runtime : `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw possède toujours la boucle générique d’agent, le failover, la gestion des transcriptions et la
policy des outils. Ces hooks constituent la surface d’extension pour le comportement spécifique au provider sans
nécessiter un transport d’inférence entièrement personnalisé.

Utilisez le manifeste `providerAuthEnvVars` lorsque le provider dispose d’identifiants basés sur l’env
que les chemins génériques auth/status/model-picker doivent voir sans charger le runtime du plugin. Utilisez le manifeste
`providerAuthAliases` lorsqu’un id provider doit réutiliser les variables env, profils d’authentification, authentification adossée à la configuration et choix de onboarding de clé API d’un autre id provider. Utilisez le manifeste
`providerAuthChoices` lorsque les surfaces CLI de onboarding/choix d’authentification
doivent connaître l’id de choix du provider, les libellés de groupe et le câblage simple d’authentification par drapeau unique sans charger le runtime du provider. Conservez `envVars` du runtime provider pour les indications orientées opérateur telles que les libellés de onboarding ou les variables de configuration
client-id/client-secret OAuth.

Utilisez le manifeste `channelEnvVars` lorsqu’un canal a une authentification ou une configuration pilotée par env que
le fallback générique shell-env, les vérifications config/status ou les invites de configuration doivent voir
sans charger le runtime du canal.

### Ordre des hooks et usage

Pour les plugins modèle/provider, OpenClaw appelle les hooks à peu près dans cet ordre.
La colonne « Quand l’utiliser » sert de guide de décision rapide.

| #   | Hook                              | Ce qu’il fait                                                                                                   | Quand l’utiliser                                                                                                                              |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publier la configuration du provider dans `models.providers` pendant la génération de `models.json`            | Le provider possède un catalogue ou des valeurs par défaut d’URL de base                                                                      |
| 2   | `applyConfigDefaults`             | Appliquer des valeurs par défaut globales appartenant au provider pendant la matérialisation de la configuration | Les valeurs par défaut dépendent du mode d’authentification, de l’env ou de la sémantique de famille de modèles du provider                  |
| --  | _(built-in model lookup)_         | OpenClaw essaie d’abord le chemin normal registre/catalogue                                                     | _(pas un hook de plugin)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normaliser les alias legacy ou preview de model-id avant la recherche                                           | Le provider possède le nettoyage des alias avant la résolution du modèle canonique                                                            |
| 4   | `normalizeTransport`              | Normaliser `api` / `baseUrl` de la famille de providers avant l’assemblage générique du modèle                 | Le provider possède le nettoyage du transport pour des ids provider personnalisés dans la même famille de transport                           |
| 5   | `normalizeConfig`                 | Normaliser `models.providers.<id>` avant la résolution runtime/provider                                         | Le provider a besoin d’un nettoyage de configuration qui doit vivre avec le plugin ; les assistants intégrés de la famille Google servent aussi de filet de sécurité pour les entrées de configuration Google prises en charge |
| 6   | `applyNativeStreamingUsageCompat` | Appliquer aux providers de configuration les réécritures de compatibilité d’usage de streaming natif           | Le provider a besoin de correctifs de métadonnées d’usage de streaming natif pilotés par le point de terminaison                             |
| 7   | `resolveConfigApiKey`             | Résoudre l’authentification à marqueur env pour les providers de configuration avant le chargement de l’auth runtime | Le provider a une résolution de clé API à marqueur env appartenant au provider ; `amazon-bedrock` dispose aussi ici d’un résolveur intégré de marqueur env AWS |
| 8   | `resolveSyntheticAuth`            | Faire remonter une authentification locale/autohébergée ou adossée à la configuration sans persister le texte en clair | Le provider peut fonctionner avec un marqueur d’identifiant synthétique/local                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Superposer les profils d’authentification externes appartenant au provider ; la `persistence` par défaut est `runtime-only` pour les identifiants possédés par la CLI/l’app | Le provider réutilise des identifiants d’authentification externes sans persister des refresh tokens copiés ; déclarez `contracts.externalAuthProviders` dans le manifeste |
| 10  | `shouldDeferSyntheticProfileAuth` | Faire passer les placeholders de profil synthétique stockés derrière l’authentification adossée à l’env/à la configuration | Le provider stocke des profils placeholders synthétiques qui ne doivent pas avoir la priorité                                                 |
| 11  | `resolveDynamicModel`             | Fallback synchrone pour des ids de modèle appartenant au provider qui ne sont pas encore dans le registre local | Le provider accepte des ids de modèles amont arbitraires                                                                                      |
| 12  | `prepareDynamicModel`             | Warm-up asynchrone, puis `resolveDynamicModel` s’exécute à nouveau                                               | Le provider a besoin de métadonnées réseau avant de résoudre des ids inconnus                                                                 |
| 13  | `normalizeResolvedModel`          | Réécriture finale avant que le runner embarqué n’utilise le modèle résolu                                       | Le provider a besoin de réécritures de transport mais utilise toujours un transport du cœur                                                   |
| 14  | `contributeResolvedModelCompat`   | Contribuer des drapeaux de compatibilité pour des modèles fournisseur derrière un autre transport compatible     | Le provider reconnaît ses propres modèles sur des transports proxy sans prendre le contrôle du provider                                       |
| 15  | `capabilities`                    | Métadonnées de transcription/outillage appartenant au provider utilisées par la logique partagée du cœur        | Le provider a besoin de particularités de transcription/famille de provider                                                                   |
| 16  | `normalizeToolSchemas`            | Normaliser les schémas d’outils avant que le runner embarqué ne les voie                                         | Le provider a besoin d’un nettoyage de schéma de famille de transport                                                                         |
| 17  | `inspectToolSchemas`              | Faire remonter des diagnostics de schéma appartenant au provider après normalisation                             | Le provider veut des avertissements sur les mots-clés sans enseigner au cœur des règles spécifiques au provider                              |
| 18  | `resolveReasoningOutputMode`      | Sélectionner le contrat de sortie de raisonnement natif ou balisé                                                | Le provider a besoin d’une sortie raisonnement/finale balisée au lieu de champs natifs                                                       |
| 19  | `prepareExtraParams`              | Normalisation des paramètres de requête avant les wrappers génériques d’options de flux                          | Le provider a besoin de paramètres de requête par défaut ou d’un nettoyage des paramètres propre au provider                                  |
| 20  | `createStreamFn`                  | Remplacer entièrement le chemin de flux normal par un transport personnalisé                                     | Le provider a besoin d’un protocole filaire personnalisé, pas seulement d’un wrapper                                                          |
| 21  | `wrapStreamFn`                    | Wrapper de flux après l’application des wrappers génériques                                                      | Le provider a besoin de wrappers de compatibilité en-têtes/corps de requête/modèle sans transport personnalisé                               |
| 22  | `resolveTransportTurnState`       | Attacher des en-têtes natifs par tour ou des métadonnées de transport                                            | Le provider veut que les transports génériques envoient une identité de tour native au provider                                               |
| 23  | `resolveWebSocketSessionPolicy`   | Attacher des en-têtes WebSocket natifs ou une policy de refroidissement de session                               | Le provider veut que les transports WS génériques ajustent les en-têtes de session ou la policy de fallback                                  |
| 24  | `formatApiKey`                    | Formateur de profil d’authentification : le profil stocké devient la chaîne `apiKey` du runtime                 | Le provider stocke des métadonnées d’authentification supplémentaires et a besoin d’une forme de jeton runtime personnalisée                 |
| 25  | `refreshOAuth`                    | Remplacement du rafraîchissement OAuth pour des points de terminaison de rafraîchissement personnalisés ou une policy d’échec de rafraîchissement | Le provider ne correspond pas aux rafraîchisseurs partagés `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Indication de réparation ajoutée quand le rafraîchissement OAuth échoue                                          | Le provider a besoin d’une guidance de réparation d’authentification appartenant au provider après un échec de rafraîchissement              |
| 27  | `matchesContextOverflowError`     | Correspondance d’erreur de dépassement de fenêtre de contexte appartenant au provider                            | Le provider a des erreurs brutes de dépassement que les heuristiques génériques manqueraient                                                  |
| 28  | `classifyFailoverReason`          | Classification de la raison du failover appartenant au provider                                                  | Le provider peut mapper des erreurs brutes d’API/de transport vers rate-limit/surcharge/etc.                                                 |
| 29  | `isCacheTtlEligible`              | Policy de prompt-cache pour les providers proxy/backhaul                                                         | Le provider a besoin d’un contrôle TTL de cache spécifique au proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Remplacement du message générique de récupération d’authentification manquante                                   | Le provider a besoin d’une indication de récupération d’authentification manquante spécifique au provider                                     |
| 31  | `suppressBuiltInModel`            | Suppression des modèles amont obsolètes plus indication d’erreur facultative orientée utilisateur               | Le provider a besoin de masquer des lignes amont obsolètes ou de les remplacer par une indication fournisseur                                |
| 32  | `augmentModelCatalog`             | Lignes de catalogue synthétiques/finales ajoutées après la découverte                                            | Le provider a besoin de lignes synthétiques de compatibilité future dans `models list` et les sélecteurs                                     |
| 33  | `resolveThinkingProfile`          | Définition du niveau `/think` spécifique au modèle, libellés d’affichage et valeur par défaut                   | Le provider expose une échelle de réflexion personnalisée ou un libellé binaire pour certains modèles                                        |
| 34  | `isBinaryThinking`                | Hook de compatibilité de bascule de raisonnement activé/désactivé                                                | Le provider n’expose qu’un raisonnement binaire activé/désactivé                                                                              |
| 35  | `supportsXHighThinking`           | Hook de compatibilité pour le support du raisonnement `xhigh`                                                    | Le provider veut `xhigh` seulement sur un sous-ensemble de modèles                                                                            |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilité pour le niveau `/think` par défaut                                                         | Le provider possède la policy `/think` par défaut pour une famille de modèles                                                                 |
| 37  | `isModernModelRef`                | Correspondance de modèle moderne pour les filtres de profils live et la sélection smoke                       | Le provider possède la correspondance du modèle préféré live/smoke                                                                            |
| 38  | `prepareRuntimeAuth`              | Échanger un identifiant configuré contre le vrai jeton/la vraie clé runtime juste avant l’inférence          | Le provider a besoin d’un échange de jeton ou d’un identifiant de requête de courte durée                                                    |
| 39  | `resolveUsageAuth`                | Résoudre les identifiants d’usage/facturation pour `/usage` et les surfaces d’état associées                 | Le provider a besoin d’une analyse personnalisée du jeton d’usage/quota ou d’un identifiant d’usage différent                               |
| 40  | `fetchUsageSnapshot`              | Récupérer et normaliser les instantanés d’usage/quota spécifiques au provider après résolution de l’authentification | Le provider a besoin d’un point de terminaison d’usage spécifique au provider ou d’un parseur de charge utile                              |
| 41  | `createEmbeddingProvider`         | Construire un adaptateur d’embedding appartenant au provider pour la mémoire/la recherche                     | Le comportement d’embedding mémoire appartient au plugin provider                                                                             |
| 42  | `buildReplayPolicy`               | Renvoyer une policy de relecture contrôlant la gestion des transcriptions pour le provider                    | Le provider a besoin d’une policy de transcription personnalisée (par exemple, suppression de blocs de réflexion)                            |
| 43  | `sanitizeReplayHistory`           | Réécrire l’historique de relecture après le nettoyage générique des transcriptions                            | Le provider a besoin de réécritures de relecture spécifiques au provider au-delà des assistants partagés de Compaction                      |
| 44  | `validateReplayTurns`             | Validation finale ou remise en forme des tours de relecture avant le runner embarqué                          | Le transport provider a besoin d’une validation plus stricte des tours après l’assainissement générique                                      |
| 45  | `onModelSelected`                 | Exécuter des effets de bord post-sélection appartenant au provider                                            | Le provider a besoin de télémétrie ou d’un état appartenant au provider quand un modèle devient actif                                        |

`normalizeModelId`, `normalizeTransport` et `normalizeConfig` vérifient d’abord le
plugin provider correspondant, puis passent aux autres plugins provider capables de hooks
jusqu’à ce que l’un modifie réellement l’id de modèle ou le transport/la configuration. Cela permet
aux shims provider d’alias/de compatibilité de continuer à fonctionner sans obliger l’appelant à savoir quel
plugin intégré possède la réécriture. Si aucun hook provider ne réécrit une entrée de configuration
prise en charge de la famille Google, le normaliseur de configuration Google intégré applique quand même
ce nettoyage de compatibilité.

Si le provider a besoin d’un protocole filaire entièrement personnalisé ou d’un exécuteur de requêtes personnalisé,
il s’agit d’une autre classe d’extension. Ces hooks servent au comportement provider qui
s’exécute toujours sur la boucle d’inférence normale d’OpenClaw.

### Exemple de provider

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

Les plugins provider intégrés utilisent les hooks ci-dessus dans des combinaisons adaptées aux
besoins de chaque fournisseur en matière de catalogue, authentification, réflexion, relecture et suivi d’usage. L’ensemble exact
des hooks par provider se trouve avec le code source du plugin sous `extensions/` ; traitez
cela comme la liste faisant autorité au lieu de la reproduire ici.

Modèles illustratifs :

- **Providers de catalogue pass-through** (OpenRouter, Kilocode, Z.AI, xAI) enregistrent
  `catalog` ainsi que `resolveDynamicModel`/`prepareDynamicModel` afin de pouvoir faire apparaître
  les ids de modèles amont avant le catalogue statique d’OpenClaw.
- **Providers avec point de terminaison OAuth + usage** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) associent `prepareRuntimeAuth` ou `formatApiKey`
  à `resolveUsageAuth` + `fetchUsageSnapshot` pour posséder l’échange de jetons et
  l’intégration `/usage`.
- **Nettoyage de relecture / transcription** est partagé via des familles nommées :
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Les providers y adhèrent via `buildReplayPolicy`
  au lieu que chacun implémente son propre nettoyage de transcription.
- **Providers intégrés catalogue uniquement** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) n’enregistrent que `catalog` et utilisent
  la boucle d’inférence partagée.
- **Assistants de flux spécifiques à Anthropic** (en-têtes beta, `/fast`/`serviceTier`,
  `context1m`) vivent à l’intérieur du joint public `api.ts` /
  `contract-api.ts` du plugin intégré Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) plutôt que dans le
  SDK générique.

## Assistants de runtime

Les plugins peuvent accéder à certains assistants du cœur via `api.runtime`. Pour le TTS :

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

- `textToSpeech` renvoie la charge utile normale de sortie TTS du cœur pour les surfaces fichier/note vocale.
- Utilise la configuration `messages.tts` du cœur et la sélection de provider.
- Renvoie un buffer audio PCM + une fréquence d’échantillonnage. Les plugins doivent rééchantillonner/encoder pour les providers.
- `listVoices` est facultatif selon le provider. Utilisez-le pour les sélecteurs de voix appartenant au fournisseur ou les flux de configuration.
- Les listes de voix peuvent inclure des métadonnées plus riches telles que la locale, le genre et des tags de personnalité pour des sélecteurs conscients du provider.
- OpenAI et ElevenLabs prennent aujourd’hui en charge la téléphonie. Microsoft non.

Les plugins peuvent aussi enregistrer des providers de parole via `api.registerSpeechProvider(...)`.

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

- Gardez la policy TTS, le fallback et la livraison des réponses dans le cœur.
- Utilisez des providers de parole pour le comportement de synthèse appartenant au fournisseur.
- L’entrée legacy `edge` de Microsoft est normalisée vers l’id provider `microsoft`.
- Le modèle d’ownership préféré est orienté entreprise : un seul plugin fournisseur peut posséder
  le texte, la parole, l’image et les futurs providers de médias à mesure qu’OpenClaw ajoute ces
  contrats de capacité.

Pour la compréhension image/audio/vidéo, les plugins enregistrent un provider typé unique de
compréhension des médias au lieu d’un sac générique clé/valeur :

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

- Gardez l’orchestration, le fallback, la configuration et le câblage des canaux dans le cœur.
- Gardez le comportement fournisseur dans le plugin provider.
- L’expansion additive doit rester typée : nouvelles méthodes facultatives, nouveaux champs de
  résultat facultatifs, nouvelles capacités facultatives.
- La génération de vidéo suit déjà le même modèle :
  - le cœur possède le contrat de capacité et l’assistant runtime
  - les plugins fournisseurs enregistrent `api.registerVideoGenerationProvider(...)`
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

Pour la transcription audio, les plugins peuvent utiliser soit le runtime de compréhension des médias
soit l’alias STT plus ancien :

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facultatif quand le MIME ne peut pas être déduit de manière fiable :
  mime: "audio/ogg",
});
```

Remarques :

- `api.runtime.mediaUnderstanding.*` est la surface partagée préférée pour la
  compréhension image/audio/vidéo.
- Utilise la configuration audio du cœur pour la compréhension des médias (`tools.media.audio`) et l’ordre de fallback des providers.
- Renvoie `{ text: undefined }` quand aucune sortie de transcription n’est produite (par exemple entrée ignorée/non prise en charge).
- `api.runtime.stt.transcribeAudioFile(...)` reste un alias de compatibilité.

Les plugins peuvent aussi lancer des exécutions de sous-agent en arrière-plan via `api.runtime.subagent` :

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

- `provider` et `model` sont des remplacements facultatifs par exécution, pas des changements persistants de session.
- OpenClaw n’honore ces champs de remplacement que pour les appelants approuvés.
- Pour les exécutions de fallback possédées par un plugin, les opérateurs doivent activer explicitement `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Utilisez `plugins.entries.<id>.subagent.allowedModels` pour restreindre les plugins approuvés à des cibles canoniques `provider/model` spécifiques, ou `"*"` pour autoriser explicitement n’importe quelle cible.
- Les exécutions de sous-agent de plugins non approuvés continuent de fonctionner, mais les demandes de remplacement sont rejetées au lieu de retomber silencieusement en fallback.

Pour la recherche Web, les plugins peuvent consommer l’assistant runtime partagé au lieu
d’aller dans le câblage des outils d’agent :

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

Les plugins peuvent aussi enregistrer des providers de recherche Web via
`api.registerWebSearchProvider(...)`.

Remarques :

- Gardez dans le cœur la sélection de provider, la résolution des identifiants et la sémantique partagée des requêtes.
- Utilisez des providers de recherche Web pour les transports de recherche spécifiques au fournisseur.
- `api.runtime.webSearch.*` est la surface partagée préférée pour les plugins de fonctionnalité/canal qui ont besoin d’un comportement de recherche sans dépendre du wrapper d’outil d’agent.

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

- `generate(...)` : générer une image en utilisant la chaîne configurée de providers de génération d’images.
- `listProviders(...)` : lister les providers de génération d’images disponibles et leurs capacités.

## Routes HTTP Gateway

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

Champs de route :

- `path` : chemin de route sous le serveur HTTP du gateway.
- `auth` : requis. Utilisez `"gateway"` pour exiger l’authentification normale du gateway, ou `"plugin"` pour l’authentification gérée par le plugin/la vérification de webhook.
- `match` : facultatif. `"exact"` (par défaut) ou `"prefix"`.
- `replaceExisting` : facultatif. Permet au même plugin de remplacer son propre enregistrement de route existant.
- `handler` : renvoie `true` lorsque la route a traité la requête.

Remarques :

- `api.registerHttpHandler(...)` a été supprimé et provoquera une erreur de chargement du plugin. Utilisez `api.registerHttpRoute(...)` à la place.
- Les routes de plugin doivent déclarer explicitement `auth`.
- Les conflits exacts `path + match` sont rejetés sauf si `replaceExisting: true`, et un plugin ne peut pas remplacer la route d’un autre plugin.
- Les routes qui se chevauchent avec des niveaux `auth` différents sont rejetées. Gardez les chaînes de retombée `exact`/`prefix` au même niveau d’authentification uniquement.
- Les routes `auth: "plugin"` ne reçoivent **pas** automatiquement les portées runtime opérateur. Elles sont destinées aux webhooks/vérifications de signature gérés par le plugin, et non aux appels privilégiés aux assistants Gateway.
- Les routes `auth: "gateway"` s’exécutent à l’intérieur d’une portée runtime de requête Gateway, mais cette portée est volontairement conservative :
  - l’authentification bearer à secret partagé (`gateway.auth.mode = "token"` / `"password"`) maintient les portées runtime des routes de plugin épinglées à `operator.write`, même si l’appelant envoie `x-openclaw-scopes`
  - les modes HTTP approuvés porteurs d’identité (par exemple `trusted-proxy` ou `gateway.auth.mode = "none"` sur une entrée privée) n’honorent `x-openclaw-scopes` que lorsque l’en-tête est explicitement présent
  - si `x-openclaw-scopes` est absent sur ces requêtes de route de plugin porteuses d’identité, la portée runtime retombe sur `operator.write`
- Règle pratique : ne supposez pas qu’une route de plugin authentifiée par gateway est une surface d’administration implicite. Si votre route a besoin d’un comportement réservé aux administrateurs, exigez un mode d’authentification porteur d’identité et documentez le contrat explicite de l’en-tête `x-openclaw-scopes`.

## Chemins d’import du SDK plugin

Utilisez des sous-routes SDK étroites au lieu du barrel racine monolithique `openclaw/plugin-sdk`
lors de la création de nouveaux plugins. Sous-routes du cœur :

| Sous-route                          | Objectif                                           |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitives d’enregistrement de plugin              |
| `openclaw/plugin-sdk/channel-core`  | Assistants d’entrée/de construction de canal       |
| `openclaw/plugin-sdk/core`          | Assistants partagés génériques et contrat ombrelle |
| `openclaw/plugin-sdk/config-schema` | Schéma Zod racine `openclaw.json` (`OpenClawSchema`) |

Les plugins de canal choisissent parmi une famille de joints étroits — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` et `channel-actions`. Le comportement d’approbation doit se consolider
sur un seul contrat `approvalCapability` au lieu d’être mélangé entre des champs de plugin sans rapport.
Voir [Channel plugins](/fr/plugins/sdk-channel-plugins).

Les assistants de runtime et de configuration vivent sous des sous-routes `*-runtime`
correspondantes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` est obsolète — c’est un shim de compatibilité pour
les anciens plugins. Le nouveau code doit importer des primitives génériques plus étroites à la place.
</Info>

Points d’entrée internes au dépôt (par racine de package de plugin intégré) :

- `index.js` — entrée du plugin intégré
- `api.js` — barrel d’assistants/types
- `runtime-api.js` — barrel runtime uniquement
- `setup-entry.js` — entrée de configuration du plugin

Les plugins externes ne doivent importer que des sous-routes `openclaw/plugin-sdk/*`. N’importez jamais
le `src/*` d’un autre package plugin depuis le cœur ou depuis un autre plugin.
Les points d’entrée chargés par façade préfèrent l’instantané actif de configuration runtime lorsqu’il existe,
puis retombent sur le fichier de configuration résolu sur disque.

Les sous-routes spécifiques à des capacités comme `image-generation`, `media-understanding`
et `speech` existent parce que les plugins intégrés les utilisent aujourd’hui. Elles ne sont pas
automatiquement des contrats externes figés à long terme — consultez la page de référence SDK
concernée lorsque vous vous appuyez dessus.

## Schémas d’outils de message

Les plugins doivent posséder les contributions au schéma `describeMessageTool(...)` spécifiques au canal
pour les primitives non liées au message telles que les réactions, les lectures et les sondages.
La présentation d’envoi partagée doit utiliser le contrat générique `MessagePresentation`
au lieu de champs natifs au provider pour boutons, composants, blocs ou cartes.
Voir [Message Presentation](/fr/plugins/message-presentation) pour le contrat,
les règles de fallback, le mappage provider et la checklist pour les auteurs de plugins.

Les plugins capables d’envoyer déclarent ce qu’ils peuvent rendre via les capacités de message :

- `presentation` pour les blocs de présentation sémantiques (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` pour les demandes de livraison épinglée

Le cœur décide s’il rend la présentation nativement ou s’il la dégrade en texte.
N’exposez pas d’échappatoires UI natives au provider depuis l’outil de message générique.
Les assistants SDK obsolètes pour les schémas natifs legacy restent exportés pour les
plugins tiers existants, mais les nouveaux plugins ne doivent pas les utiliser.

## Résolution de cible de canal

Les plugins de canal doivent posséder la sémantique de cible spécifique au canal. Gardez l’hôte
sortant partagé générique et utilisez la surface d’adaptateur de messagerie pour les règles provider :

- `messaging.inferTargetChatType({ to })` décide si une cible normalisée
  doit être traitée comme `direct`, `group` ou `channel` avant la recherche dans l’annuaire.
- `messaging.targetResolver.looksLikeId(raw, normalized)` indique au cœur si une
  entrée doit passer directement à une résolution de type id au lieu d’une recherche dans l’annuaire.
- `messaging.targetResolver.resolveTarget(...)` est le fallback du plugin lorsque
  le cœur a besoin d’une résolution finale appartenant au provider après normalisation ou après un
  échec dans l’annuaire.
- `messaging.resolveOutboundSessionRoute(...)` possède la construction de route de session
  spécifique au provider une fois qu’une cible est résolue.

Découpage recommandé :

- Utilisez `inferTargetChatType` pour les décisions de catégorie qui doivent avoir lieu avant
  la recherche de pairs/groupes.
- Utilisez `looksLikeId` pour les vérifications de type « traiter ceci comme un id de cible explicite/natif ».
- Utilisez `resolveTarget` pour le fallback de normalisation spécifique au provider, pas pour
  une recherche large dans l’annuaire.
- Gardez les ids natifs au provider comme les ids de chat, ids de thread, JID, handles et ids de salon
  à l’intérieur des valeurs `target` ou de paramètres spécifiques au provider, pas dans des champs SDK génériques.

## Annuaires adossés à la configuration

Les plugins qui dérivent des entrées d’annuaire de la configuration doivent garder cette logique dans le
plugin et réutiliser les assistants partagés de
`openclaw/plugin-sdk/directory-runtime`.

Utilisez cela lorsqu’un canal a besoin de pairs/groupes adossés à la configuration comme :

- pairs DM pilotés par liste d’autorisation
- mappages configurés de canaux/groupes
- fallbacks d’annuaire statiques à portée de compte

Les assistants partagés dans `directory-runtime` ne gèrent que des opérations génériques :

- filtrage de requête
- application de limite
- assistants de déduplication/normalisation
- construction de `ChannelDirectoryEntry[]`

L’inspection de compte spécifique au canal et la normalisation des ids doivent rester dans l’
implémentation du plugin.

## Catalogues de providers

Les plugins provider peuvent définir des catalogues de modèles pour l’inférence avec
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` renvoie la même forme que celle qu’OpenClaw écrit dans
`models.providers` :

- `{ provider }` pour une entrée provider
- `{ providers }` pour plusieurs entrées provider

Utilisez `catalog` lorsque le plugin possède les ids de modèles spécifiques au provider, des valeurs par défaut d’URL de base
ou des métadonnées de modèles protégées par l’authentification.

`catalog.order` contrôle le moment où le catalogue d’un plugin fusionne par rapport aux
providers implicites intégrés d’OpenClaw :

- `simple` : providers simples à clé API ou pilotés par env
- `profile` : providers qui apparaissent lorsque des profils d’authentification existent
- `paired` : providers qui synthétisent plusieurs entrées provider liées
- `late` : dernier passage, après les autres providers implicites

Les providers plus tardifs l’emportent en cas de collision de clé, de sorte que les plugins peuvent
volontairement remplacer une entrée provider intégrée avec le même id provider.

Compatibilité :

- `discovery` fonctionne toujours comme alias legacy
- si `catalog` et `discovery` sont tous deux enregistrés, OpenClaw utilise `catalog`

## Inspection en lecture seule des canaux

Si votre plugin enregistre un canal, préférez l’implémentation de
`plugin.config.inspectAccount(cfg, accountId)` en plus de `resolveAccount(...)`.

Pourquoi :

- `resolveAccount(...)` est le chemin runtime. Il peut supposer que les identifiants
  sont entièrement matérialisés et échouer rapidement quand les secrets requis sont absents.
- Les chemins de commande en lecture seule comme `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, et les flux doctor/réparation
  de configuration ne doivent pas avoir besoin de matérialiser les identifiants runtime juste pour
  décrire la configuration.

Comportement recommandé de `inspectAccount(...)` :

- Renvoyer uniquement un état descriptif du compte.
- Préserver `enabled` et `configured`.
- Inclure les champs de source/statut d’identifiant quand c’est pertinent, comme :
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Vous n’avez pas besoin de renvoyer les valeurs brutes des jetons juste pour signaler une disponibilité
  en lecture seule. Renvoyer `tokenStatus: "available"` (et le champ source correspondant)
  suffit pour les commandes de type statut.
- Utilisez `configured_unavailable` lorsqu’un identifiant est configuré via SecretRef mais
  indisponible dans le chemin de commande courant.

Cela permet aux commandes en lecture seule de signaler « configuré mais indisponible dans ce chemin de commande »
au lieu de planter ou d’indiquer à tort que le compte n’est pas configuré.

## Package packs

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

Chaque entrée devient un plugin. Si le pack liste plusieurs extensions, l’id du plugin
devient `name/<fileBase>`.

Si votre plugin importe des dépendances npm, installez-les dans ce répertoire afin que
`node_modules` soit disponible (`npm install` / `pnpm install`).

Barrière de sécurité : chaque entrée `openclaw.extensions` doit rester à l’intérieur du
répertoire du plugin après résolution des symlinks. Les entrées qui sortent du répertoire du package sont
rejetées.

Note de sécurité : `openclaw plugins install` installe les dépendances de plugin avec
`npm install --omit=dev --ignore-scripts` (pas de scripts de cycle de vie, pas de dépendances de développement au runtime). Gardez les arbres de dépendances de plugin « JS/TS purs » et évitez les packages qui nécessitent des builds `postinstall`.

Facultatif : `openclaw.setupEntry` peut pointer vers un module léger de configuration uniquement.
Quand OpenClaw a besoin de surfaces de configuration pour un plugin de canal désactivé, ou
lorsqu’un plugin de canal est activé mais reste non configuré, il charge `setupEntry`
au lieu de l’entrée complète du plugin. Cela garde le démarrage et la configuration plus légers
lorsque l’entrée principale du plugin câble aussi des outils, hooks ou d’autres
éléments de code uniquement runtime.

Facultatif : `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
peut faire adhérer un plugin de canal au même chemin `setupEntry` pendant la phase
de démarrage pré-écoute du gateway, même lorsque le canal est déjà configuré.

Utilisez cela uniquement si `setupEntry` couvre entièrement la surface de démarrage qui doit exister
avant que le gateway ne commence à écouter. En pratique, cela signifie que l’entrée de configuration
doit enregistrer chaque capacité appartenant au canal dont le démarrage dépend, telle que :

- l’enregistrement du canal lui-même
- toute route HTTP qui doit être disponible avant que le gateway ne commence à écouter
- toute méthode Gateway, tout outil ou tout service qui doit exister pendant cette même fenêtre

Si votre entrée complète possède encore une capacité de démarrage requise, n’activez pas
ce drapeau. Gardez le plugin sur le comportement par défaut et laissez OpenClaw charger
l’entrée complète au démarrage.

Les canaux intégrés peuvent aussi publier des assistants de surface de contrat réservés à la configuration que le cœur
peut consulter avant le chargement du runtime complet du canal. La surface actuelle de promotion de configuration est :

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Le cœur utilise cette surface lorsqu’il doit promouvoir une configuration legacy de canal à compte unique
vers `channels.<id>.accounts.*` sans charger l’entrée complète du plugin.
Matrix est l’exemple intégré actuel : il déplace uniquement les clés d’authentification/bootstrap dans un
compte promu nommé lorsque des comptes nommés existent déjà, et il peut préserver une
clé de compte par défaut non canonique configurée au lieu de toujours créer
`accounts.default`.

Ces adaptateurs de patch de configuration gardent paresseuse la découverte de la surface de contrat intégrée. Le temps
d’import reste léger ; la surface de promotion n’est chargée qu’à la première utilisation au lieu de
réentrer dans le démarrage du canal intégré lors de l’import du module.

Quand ces surfaces de démarrage incluent des méthodes RPC Gateway, gardez-les sur un
préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
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

### Métadonnées de catalogue de canal

Les plugins de canal peuvent annoncer des métadonnées de configuration/découverte via `openclaw.channel` et
des indices d’installation via `openclaw.install`. Cela garde les données du catalogue du cœur vides.

Exemple :

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (auto-hébergé)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat auto-hébergé via des bots webhook Nextcloud Talk.",
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

Champs `openclaw.channel` utiles au-delà de l’exemple minimal :

- `detailLabel` : libellé secondaire pour des surfaces de catalogue/statut plus riches
- `docsLabel` : remplace le texte du lien vers la documentation
- `preferOver` : ids de plugin/canal de priorité inférieure que cette entrée de catalogue doit dépasser
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras` : contrôles de copie pour la surface de sélection
- `markdownCapable` : marque le canal comme compatible markdown pour les décisions de formatage sortant
- `exposure.configured` : masque le canal des surfaces de liste des canaux configurés lorsqu’il vaut `false`
- `exposure.setup` : masque le canal des sélecteurs interactifs de configuration lorsqu’il vaut `false`
- `exposure.docs` : marque le canal comme interne/privé pour les surfaces de navigation de documentation
- `showConfigured` / `showInSetup` : alias legacy encore acceptés pour compatibilité ; préférez `exposure`
- `quickstartAllowFrom` : fait adhérer le canal au flux standard quickstart `allowFrom`
- `forceAccountBinding` : exige une liaison de compte explicite même lorsqu’un seul compte existe
- `preferSessionLookupForAnnounceTarget` : préfère la recherche de session lors de la résolution des cibles d’annonce

OpenClaw peut aussi fusionner des **catalogues de canaux externes** (par exemple, un export de
registre MPM). Déposez un fichier JSON à l’un de ces emplacements :

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou pointez `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) vers
un ou plusieurs fichiers JSON (délimités par virgule/point-virgule/`PATH`). Chaque fichier doit
contenir `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Le parseur accepte aussi `"packages"` ou `"plugins"` comme alias legacy de la clé `"entries"`.

## Plugins de moteur de contexte

Les plugins de moteur de contexte possèdent l’orchestration du contexte de session pour l’ingestion, l’assemblage
et la Compaction. Enregistrez-les depuis votre plugin avec
`api.registerContextEngine(id, factory)`, puis sélectionnez le moteur actif avec
`plugins.slots.contextEngine`.

Utilisez ceci lorsque votre plugin doit remplacer ou étendre le pipeline de contexte par défaut
plutôt que simplement ajouter une recherche mémoire ou des hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Si votre moteur ne possède **pas** l’algorithme de Compaction, gardez `compact()`
implémenté et déléguez-le explicitement :

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Ajouter une nouvelle capacité

Lorsqu’un plugin a besoin d’un comportement qui ne correspond pas à l’API actuelle, ne contournez pas
le système de plugins avec une intrusion privée. Ajoutez la capacité manquante.

Séquence recommandée :

1. définir le contrat du cœur
   Décidez quel comportement partagé le cœur doit posséder : policy, fallback, fusion de configuration,
   cycle de vie, sémantique côté canal et forme de l’assistant runtime.
2. ajouter des surfaces typées d’enregistrement/runtime de plugin
   Étendez `OpenClawPluginApi` et/ou `api.runtime` avec la plus petite
   surface de capacité typée utile.
3. connecter les consommateurs cœur + canal/fonctionnalité
   Les canaux et plugins de fonctionnalité doivent consommer la nouvelle capacité via le cœur,
   et non en important directement une implémentation fournisseur.
4. enregistrer les implémentations fournisseurs
   Les plugins fournisseurs enregistrent ensuite leurs backends contre la capacité.
5. ajouter une couverture de contrat
   Ajoutez des tests afin que l’ownership et la forme d’enregistrement restent explicites dans le temps.

C’est ainsi qu’OpenClaw reste prescriptif sans devenir codé en dur selon la vision du monde d’un
fournisseur. Voir le [Capability Cookbook](/fr/plugins/architecture)
pour une checklist concrète de fichiers et un exemple détaillé.

### Checklist de capacité

Lorsque vous ajoutez une nouvelle capacité, l’implémentation doit généralement toucher ensemble ces
surfaces :

- types de contrat du cœur dans `src/<capability>/types.ts`
- runner/assistant runtime du cœur dans `src/<capability>/runtime.ts`
- surface d’enregistrement de l’API plugin dans `src/plugins/types.ts`
- câblage du registre des plugins dans `src/plugins/registry.ts`
- exposition runtime de plugin dans `src/plugins/runtime/*` lorsque les plugins de fonctionnalité/canal
  doivent le consommer
- assistants de capture/test dans `src/test-utils/plugin-registration.ts`
- assertions d’ownership/de contrat dans `src/plugins/contracts/registry.ts`
- documentation opérateur/plugin dans `docs/`

Si l’une de ces surfaces manque, c’est généralement le signe que la capacité n’est
pas encore pleinement intégrée.

### Modèle de capacité

Motif minimal :

```ts
// contrat du cœur
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// assistant runtime partagé pour les plugins de fonctionnalité/canal
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

- le cœur possède le contrat de capacité + l’orchestration
- les plugins fournisseurs possèdent les implémentations fournisseurs
- les plugins de fonctionnalité/canal consomment des assistants runtime
- les tests de contrat gardent l’ownership explicite
