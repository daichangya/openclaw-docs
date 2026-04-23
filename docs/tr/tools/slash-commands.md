---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinleri hata ayıklama
summary: 'Eğik çizgi komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Eğik Çizgi Komutları
x-i18n:
    generated_at: "2026-04-23T13:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Eğik çizgi komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makineye özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun bir takma adıdır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönerge olmayan), “satır içi ipuçları” olarak değerlendirilir ve oturum ayarlarını **kalıcı hale getirmez**.
  - Yalnızca yönergeden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturumda kalıcı olur ve bir onay yanıtı verir.
  - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlanmışsa, kullanılan tek izin listesi budur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz gönderenlerde yönergeler düz metin olarak değerlendirilir.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde olan/yetkili gönderenler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalışır, model mesajı görmeden önce çıkarılır ve kalan metin normal akıştan geçmeye devam eder.

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

- `commands.text` (varsayılan `true`), sohbet mesajlarında `/...` ayrıştırmasını etkinleştirir.
  - Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`), yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (eğik çizgi komutları ekleyene kadar); yerel destek sunmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarını kullanın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerindeki daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`), desteklendiğinde **Skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her Skill için ayrı bir eğik çizgi komutu oluşturulmasını gerektirir).
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarını kullanın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`), ana makinenin kabuk komutlarını çalıştırmak için `! <cmd>` kullanımını etkinleştirir (`/bash <cmd>` bunun bir takma adıdır; `tools.elevated` izin listeleri gerekir).
- `commands.bashForegroundMs` (varsayılan `2000`), arka plan moduna geçmeden önce bash’in ne kadar bekleyeceğini kontrol eder (`0`, hemen arka plana alır).
- `commands.config` (varsayılan `false`), `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar).
- `commands.mcp` (varsayılan `false`), `/mcp` komutunu etkinleştirir (OpenClaw tarafından yönetilen `mcp.servers` altındaki MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`), `/plugins` komutunu etkinleştirir (plugin keşfi/durumu ile kurulum + etkinleştirme/devre dışı bırakma kontrolleri).
- `commands.debug` (varsayılan `false`), `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`), `/restart` komutunu ve gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip için olan komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- Kanal başına `channels.<channel>.commands.enforceOwnerForCommands` (isteğe bağlı, varsayılan `false`), bu yüzeyde yalnızca sahip için olan komutların çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderenin ya çözülmüş bir sahip adayıyla eşleşmesi gerekir (örneğin `commands.ownerAllowFrom` içindeki bir giriş veya sağlayıcıya özgü yerel sahip meta verisi) ya da dahili bir mesaj kanalında dahili `operator.admin` kapsamına sahip olması gerekir. Kanal `allowFrom` içindeki joker bir giriş veya boş/çözümlenmemiş bir sahip-aday listesi **yeterli değildir** — yalnızca sahip için olan komutlar bu kanalda kapalı şekilde başarısız olur. Yalnızca sahip için olan komutların sadece `ownerAllowFrom` ve standart komut izin listeleriyle sınırlandırılmasını istiyorsanız bunu kapalı bırakın.
- `commands.ownerDisplay`, sistem isteminde sahip kimliklerinin nasıl görüneceğini kontrol eder: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC sırrını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı başına bir izin listesi ayarlar. Yapılandırıldığında, komutlar ve yönergeler için kullanılan tek yetkilendirme kaynağı budur (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilken komutlar için izin listelerini/politikaları uygular.

## Komut listesi

Geçerli source-of-truth:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- plugin komutları, plugin `registerCommand()` çağrılarından gelir
- gateway’inizdeki gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin plugin’lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]` geçerli transkripti korur, yeniden kullanılan CLI backend oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süresinin dolmasını yönetir.
- `/think <level>` düşünme düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` değerleridir, `xhigh`, `adaptive`, `max` veya ikili `on` gibi özel düzeyler ise yalnızca desteklenen yerlerde vardır. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
- `/trace on|off` geçerli oturum için plugin izleme çıktısını açar/kapatır.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` muhakeme görünürlüğünü açar/kapatır. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` elevated modunu açar/kapatır. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` bir sağlayıcı için sağlayıcıları veya modelleri listeler.
- `/queue <mode>` kuyruk davranışını (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri yönetir.
- `/help` kısa yardım özetini gösterir.
- `/commands` oluşturulmuş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli aracının şu anda neleri kullanabildiğini gösterir.
- `/status`, mevcut olduğunda `Runtime`/`Runner` etiketleri ve sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu gösterir.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/export-trajectory [path]` geçerli oturum için bir JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Takma ad: `/trajectory`.
- `/whoami` gönderen kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]` bir Skill’i adına göre çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt aracı çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord iş parçacığını veya Telegram konu/görüşmesini bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için iş parçacığına bağlı aracıları listeler.
- `/kill <id|#|all>` çalışan bir veya tüm alt aracıları iptal eder.
- `/steer <id|#> <message>` çalışan bir alt aracıya yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` OpenClaw tarafından yönetilen `mcp.servers` altındaki MCP sunucusu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri yalnızca sahip içindir. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini kontrol eder veya yerel bir maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS’yi kontrol eder. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkin olduğunda OpenClaw’ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderme politikasını ayarlar. Yalnızca sahip.
- `/bash <command>` ana makine kabuk komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` arka plan bash işini kontrol eder.
- `!stop [sessionId]` arka plan bash işini durdurur.

### Oluşturulmuş dock komutları

Dock komutları, yerel komut desteği olan kanal plugin’lerinden üretilir. Geçerli paketli küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketli plugin komutları

Paketli plugin’ler daha fazla eğik çizgi komutu ekleyebilir. Bu depodaki mevcut paketli komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Eşleştirme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord’da yerel komut adı `/talkvoice` şeklindedir.
- `/card ...` LINE zengin kart önayarları gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketli Codex uygulama sunucusu harness’ını inceler ve kontrol eder. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik Skill komutları

Kullanıcının çağırabildiği Skills, eğik çizgi komutları olarak da sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- Skill’ler, Skill/plugin bunları kaydederse `/prose` gibi doğrudan komutlar olarak da görünebilir.
- Yerel skill-komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından kontrol edilir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını kabul eder (bulanık eşleştirme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, plugin yapılandırmasını günceller ve yeniden başlatma istemi gösterebilir.
- Yalnızca Discord’a özgü yerel komut: `/vc join|leave|status` ses kanallarını kontrol eder (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkin iş parçacığı bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük için tasarlanmıştır; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose`’dan daha dardır: yalnızca plugin’e ait izleme/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç konuşmasını kapalı tutar.
- `/fast on|off`, oturum geçersiz kılmasını kalıcı hale getirir. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özetleri ilgili olduğunda yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: açığa çıkarmayı düşünmediğiniz iç muhakemeyi, araç çıktısını veya plugin tanılarını gösterebilirler. Özellikle grup sohbetlerinde kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı hale getirir.
- Aracı boştaysa, sonraki çalıştırma bunu hemen kullanır.
- Zaten etkin bir çalıştırma varsa, OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı turuna kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
- **Grup mention kapılaması:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** belirli komutlar normal bir mesaja gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtını tetikler ve kalan metin normal akıştan geçmeye devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, eğik çizgi komutları olarak sunulur. Adlar `a-z0-9_` olarak temizlenir (en fazla 32 karakter); çakışmalara sayısal son ekler eklenir (ör. `_2`).
  - `/skill <name> [input]`, bir Skill’i adına göre çalıştırır (yerel komut sınırları Skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak Skill komutları modele normal bir istek olarak iletilir.
  - Skills isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse plugin’i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için autocomplete kullanır (gerekli argümanları atladığınızda düğme menüleri de kullanılır). Telegram ve Slack, bir komut seçimleri destekliyorsa ve siz argümanı atlarsanız bir düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusuna değil, bir çalışma zamanı sorusuna yanıt verir: **bu aracının şu anda
bu konuşmada neleri kullanabildiği**.

- Varsayılan `/tools` kompakttır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı kip değiştiriciyi `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır, bu nedenle aracıyı, kanalı, iş parçacığını, gönderen yetkilendirmesini veya modeli değiştirmek çıktıyı değiştirebilir.
- `/tools`, çekirdek araçlar, bağlı plugin araçları ve kanala ait araçlar dahil çalışma zamanında gerçekten erişilebilir olan araçları içerir.

Profil ve geçersiz kılma düzenlemeleri için `/tools`’u statik bir katalog gibi ele almak yerine Control UI Tools panelini veya config/catalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kota** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde gösterilir. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca kalan değeri içeren yüzde alanları görüntülemeden önce tersine çevrilir ve `model_remains` yanıtları sohbet modeli girdisini, ayrıca modele etiketlenmiş plan etiketiyle birlikte tercih eder.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine önceliklidir ve transkript yedeği, saklanan toplamlar eksik olduğunda veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve daha büyük istem odaklı bir toplamı da geri getirebilir.
- **Runtime ve runner:** `/status`, etkin yürütme yolu ve sandbox durumu için `Runtime`, oturumu gerçekte kimin çalıştırdığı için ise `Runner` bildirir: gömülü Pi, CLI destekli bir sağlayıcı veya bir ACP harness/backend’i.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtların sonuna eklenir).
- `/model status`, kullanım hakkında değil, **modeller/kimlik doğrulama/uç noktalar** hakkındadır.

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

- `/model` ve `/model list`, kompakt, numaralandırılmış bir seçici gösterir (model ailesi + kullanılabilir sağlayıcılar).
- Discord’da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API kipini (`api`) içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmalarını ayarlamanızı sağlar (disk değil, bellek). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

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
- Tüm geçersiz kılmaları temizlemek ve disk üzerindeki yapılandırmaya dönmek için `/debug reset` kullanın.

## Plugin izleme çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı plugin izleme/hata ayıklama satırlarını** açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Argümansız `/trace`, geçerli oturum izleme durumunu gösterir.
- `/trace on`, geçerli oturum için plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal yardımcı yanıtından sonra gelen bir takip tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` çalışma zamanına özel yapılandırma geçersiz kılmalarını yönetmeye devam eder.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.config: true` kullanın.

Örnekler:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Notlar:

- Yapılandırma yazmadan önce doğrulanır; geçersiz değişiklikler reddedilir.
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## MCP güncellemeleri

`/mcp`, OpenClaw tarafından yönetilen MCP sunucusu tanımlarını `mcp.servers` altına yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.mcp: true` kullanın.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi’ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar.
- Hangi taşıma türlerinin gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen plugin’leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına olanak tanır. Salt okunur akışlarda takma ad olarak `/plugin` kullanılabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ve disk üzerindeki yapılandırmaya karşı gerçek plugin keşfini kullanır.
- `/plugins enable|disable`, yalnızca plugin yapılandırmasını günceller; plugin’leri kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway’i yeniden başlatın.

## Yüzey notları

- **Metin komutları** normal sohbet oturumunda çalışır (DM’ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar** yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, geçerli çalıştırmayı iptal edebilmesi için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirilirse, her yerleşik komut için ayrı bir Slack eğik çizgi komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri ephemeral Block Kit düğmeleri olarak iletilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` yerine `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru** sormayı sağlar.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal bir yardımcı mesajı yerine canlı bir yan sonuç olarak teslim edilir.

Bu da `/btw` komutunu, ana görev sürerken geçici bir açıklama istediğinizde kullanışlı hale getirir.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
