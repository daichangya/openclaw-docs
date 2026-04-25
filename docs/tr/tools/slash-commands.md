---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinlerini ayıklama
summary: 'Slash komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Slash komutları
x-i18n:
    generated_at: "2026-04-25T13:59:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b95f33df9a05bd74855695c29b5c449af7a73714596932be5ce923a1ddab8ee7
    source_path: tools/slash-commands.md
    workflow: 15
---

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **tek başına** bir mesaj olarak gönderilmelidir.
Yalnızca host üzerinde çalışan bash sohbet komutu `! <cmd>` biçimini kullanır (`/bash <cmd>` bunun takma adıdır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: tek başına `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönerge olmayan), “satır içi ipuçları” olarak ele alınırlar ve oturum ayarlarını kalıcılaştırmazlar.
  - Yalnızca yönerge içeren mesajlarda (mesaj yalnızca yönergeler içerdiğinde), oturuma kalıcı olarak yazılırlar ve bir onay yanıtı verirler.
  - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa kullanılan tek izin listesi odur; aksi takdirde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz gönderenler için yönergeler düz metin olarak ele alınır.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izinli/yetkili gönderenler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan devam eder.

## Yapılandırma

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmasını etkinleştirir.
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutları ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack, skill başına bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) host shell komutlarını çalıştırmak için `! <cmd>` biçimini etkinleştirir (`/bash <cmd>` takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`), arka plan moduna geçmeden önce bash'in ne kadar bekleyeceğini denetler (`0`, hemen arka plana atar).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu artı kurulum ve etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` artı gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip erişimine açık komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- Kanal başına `channels.<channel>.commands.enforceOwnerForCommands` (isteğe bağlı, varsayılan `false`) yalnızca sahip erişimine açık komutların bu yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderen ya çözülmüş bir sahip adayıyla eşleşmelidir (örneğin `commands.ownerAllowFrom` içindeki bir giriş veya sağlayıcıya özgü yerel sahip meta verisi) ya da dahili bir mesaj kanalında `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içindeki joker karakterli bir giriş veya boş/çözümlenmemiş bir sahip adayı listesi **yeterli değildir** — yalnızca sahip erişimine açık komutlar bu kanalda kapalı başarısız olur. Yalnızca sahip erişimine açık komutların yalnızca `ownerAllowFrom` ve standart komut izin listeleriyle kapılanmasını istiyorsanız bunu kapalı bırakın.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini denetler: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC gizli değerini isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı başına izin listesi ayarlar. Yapılandırıldığında, komutlar ve yönergeler için tek yetkilendirme kaynağı bu olur (`commands.useAccessGroups` ile kanal izin listeleri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlanmamışsa komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- gateway'inizdeki gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]` geçerli transcript'i korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]` oturum bağlamında Compaction yapar. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>` thread bağlama süresi sonunu yönetir.
- `/think <level>` thinking seviyesini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın seviyeler `off`, `minimal`, `low`, `medium` ve `high` olup, `xhigh`, `adaptive`, `max` veya yalnızca desteklenen yerlerde ikili `on` gibi özel seviyeler de vardır. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı değiştirir. Takma ad: `/v`.
- `/trace on|off` geçerli oturum için Plugin iz çıktısını değiştirir.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` reasoning görünürlüğünü değiştirir. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` yükseltilmiş modu değiştirir. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcının modellerini listeler.
- `/queue <mode>` kuyruk davranışını (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri yönetir.
- `/help` kısa yardım özetini gösterir.
- `/commands` üretilmiş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status` mevcut olduğunda `Execution`/`Runtime` etiketleri ve sağlayıcı kullanımı/kotası dahil yürütme/çalışma zamanı durumunu gösterir.
- `/crestodian <request>` sahip DM'sinden Crestodian kurulum ve onarım yardımcısını çalıştırır.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl bir araya getirildiğini açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/export-trajectory [path]` geçerli oturum için bir JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Takma ad: `/trajectory`.
- `/whoami` gönderici kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]` bir skill'i adıyla çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord thread'ini veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için thread'e bağlı ajanları listeler.
- `/kill <id|#|all>` çalışan bir veya tüm alt ajanları iptal eder.
- `/steer <id|#> <message>` çalışan bir alt ajana yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` Plugin durumunu inceler veya değiştirir. `/plugin` takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS'i denetler. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkin olduğunda OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderme ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>` bir host shell komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` artı `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` arka plan bash işini denetler.
- `!stop [sessionId]` arka plan bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteğine sahip kanal Plugin'lerinden üretilir. Mevcut paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş Plugin komutları

Paketlenmiş Plugin'ler daha fazla slash komutu ekleyebilir. Bu depodaki mevcut paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` memory Dreaming özelliğini değiştirir. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Eşleştirme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord üzerinde yerel komut adı `/talkvoice` olur.
- `/card ...` LINE zengin kart ön ayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketlenmiş Codex app-server bağlayıcısını inceler ve denetler. Bkz. [Codex Bağlayıcısı](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcı tarafından çağrılabilen Skills de slash komutları olarak açığa çıkarılır:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- bir skill/Plugin bunları kaydederse Skills `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından denetlenir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` komutları da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını denetler (metin olarak mevcut değildir). `join`, bir guild ve seçilmiş ses/stage kanalı gerektirir. `channels.discord.voice` ve yerel komutlar gereklidir.
- Discord thread bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) etkin thread bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Ajanları](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose` komutundan daha dardır: yalnızca Plugin'e ait iz/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç konuşmasını kapalı tutar.
- `/fast on|off`, oturum geçersiz kılmasını kalıcılaştırır. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI'deki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex, bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşler; doğrudan genel Anthropic istekleri, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil, bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: açığa çıkarmayı amaçlamadığınız dahili reasoning'i, araç çıktısını veya Plugin tanılamalarını gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcılaştırır.
- Ajan boşta ise, sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinse, OpenClaw canlı değişikliği beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen değişiklik daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
- Yerel TUI'de `/crestodian [request]`, normal ajan TUI'sinden
  Crestodian'a döner. Bu, mesaj kanalı kurtarma modundan ayrıdır ve
  uzaktan yapılandırma yetkisi vermez.
- **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup bahsetme kapısı:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar bahsetme gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** bazı komutlar normal bir mesaj içine gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtını tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` token'ları düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, slash komutları olarak açığa çıkarılır. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır (ör. `_2`).
  - `/skill <name> [input]`, bir skill'i adıyla çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skills isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord, dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atladığınızda düğme menüleri). Telegram ve Slack, bir komut seçimleri desteklediğinde ve argümanı atladığınızda bir düğme menüsü gösterir. Dinamik seçimler hedef oturum modeline göre çözülür; bu nedenle `/think` seviyeleri gibi modele özgü seçenekler o oturumun `/model` geçersiz kılmasını izler.

## `/tools`

`/tools`, yapılandırma sorusu değil, çalışma zamanı sorusuna yanıt verir: **bu ajanın şu anda
bu konuşmada neleri kullanabildiği**.

- Varsayılan `/tools` kompakt yapıdadır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı mod değişimini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu nedenle ajanı, kanalı, thread'i, gönderici yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı
  Plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilir araçları içerir.

Profil ve geçersiz kılma düzenlemesi için `/tools` komutunu statik katalog gibi değerlendirmek yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçiminde normalize eder; MiniMax için yalnızca kalan yüzde alanları gösterilmeden önce ters çevrilir ve `model_remains` yanıtları sohbet modeli girdisini artı model etiketli plan etiketini tercih eder.
- `/status` içindeki **Token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transcript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transcript geri dönüşü etkin çalışma zamanı model etiketini ve saklanan toplamlar eksik veya daha küçük olduğunda daha büyük istem odaklı toplamı da kurtarabilir.
- **Execution ve runtime:** `/status`, etkin sandbox yolu için `Execution`, oturumu gerçekte kimin çalıştırdığını göstermek için ise `Runtime` bildirir: `OpenClaw Pi Default`, `OpenAI Codex`, bir CLI arka ucu veya bir ACP arka ucu.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil **modeller/auth/uç noktalarla** ilgilidir.

## Model seçimi (`/model`)

`/model`, bir yönerge olarak uygulanır.

Örnekler:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Notlar:

- `/model` ve `/model list`, kompakt, numaralı bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord üzerinde `/model` ve `/models`, sağlayıcı ve model açılır listeleri artı bir Submit adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanıza izin verir (diskte değil, bellekte). Yalnızca sahip erişimine açıktır. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Notlar:

- Geçersiz kılmalar yeni yapılandırma okumalarına hemen uygulanır, ancak `openclaw.json` dosyasına yazılmaz.
- Tüm geçersiz kılmaları temizlemek ve diskteki yapılandırmaya dönmek için `/debug reset` kullanın.

## Plugin iz çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı Plugin iz/hata ayıklama satırlarını** değiştirmenize izin verir.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Argümansız `/trace`, geçerli oturum iz durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin iz satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin iz satırları `/status` içinde ve normal asistan yanıtından sonra takip tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` komutuna aittir.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip erişimine açıktır. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.config: true` kullanın.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notlar:

- Yazmadan önce yapılandırma doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcı olur.

## MCP güncellemeleri

`/mcp`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu tanımlarına yazar. Yalnızca sahip erişimine açıktır. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.mcp: true` kullanın.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarına değil, OpenClaw yapılandırmasına kaydeder.
- Hangi taşımaların gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen Plugin'leri incelemesine ve yapılandırmada etkinlik durumunu değiştirmesine izin verir. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanına ve disk üzerindeki yapılandırmaya göre gerçek Plugin keşfi kullanır.
- `/plugins enable|disable`, yalnızca Plugin yapılandırmasını günceller; Plugin'leri kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main`i paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` aracılığıyla sohbet oturumunu hedefler)
- **`/stop`**, geçerli çalıştırmayı iptal edebilmesi için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argüman menüleri geçici Block Kit düğmeleri olarak teslim edilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transcript geçmişine yazılmaz,
- normal asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, ana
görev devam ederken geçici bir açıklama istediğinizde `/btw` komutunu kullanışlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX
ayrıntıları için [BTW Yan Soruları](/tr/tools/btw) bölümüne bakın.

## İlgili

- [Skills](/tr/tools/skills)
- [Skills yapılandırması](/tr/tools/skills-config)
- [Skills oluşturma](/tr/tools/creating-skills)
