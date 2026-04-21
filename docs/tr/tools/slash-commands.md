---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinleri hata ayıklama
summary: 'Eğik çizgi komutları: metin ile yerel, yapılandırma ve desteklenen komutlar'
title: Eğik Çizgi Komutları
x-i18n:
    generated_at: "2026-04-21T17:45:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26923608329ba2aeece2d4bc8edfa40ae86e03719a9f590f26ff79f57d97521d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Eğik çizgi komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makinede çalışan bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun bir takma adıdır).

İlgili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönergeden oluşmayan), “satır içi ipuçları” olarak değerlendirilirler ve oturum ayarlarını **kalıcı olarak değiştirmezler**.
  - Yalnızca yönergelerden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturuma kalıcı olarak uygulanırlar ve bir onay yanıtı verirler.
  - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlıysa, kullanılan tek
    izin listesi odur; aksi takdirde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz gönderenler yönergeleri düz metin olarak görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde olan/yetkili gönderenler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Bunlar hemen çalıştırılır, model görmeden önce mesajdan çıkarılır ve kalan metin normal akıştan geçmeye devam eder.

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

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir.
  - Yerel komut desteği olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` olarak ayarlasanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (siz eğik çizgi komutlarını ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` kullanın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack, her skill için ayrı bir eğik çizgi komutu oluşturmayı gerektirir).
  - Sağlayıcı bazında geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` kullanın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) `! <cmd>` ile ana makine kabuk komutlarını çalıştırmayı etkinleştirir (`/bash <cmd>` bir takma addır; `tools.elevated` izin listeleri gerekir).
- `commands.bashForegroundMs` (varsayılan `2000`) bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini kontrol eder (`0` hemen arka plana alır).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (OpenClaw tarafından yönetilen MCP yapılandırmasını `mcp.servers` altında okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (Plugin keşfi/durumu ile kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` ile Gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı) yalnızca sahip için olan komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` listesinden ayrıdır.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini kontrol eder: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılacak HMAC sırrını isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı) komut yetkilendirmesi için sağlayıcı bazlı bir izin listesi ayarlar. Yapılandırıldığında, komutlar ve yönergeler için
  tek yetkilendirme kaynağı bu olur (`commands.useAccessGroups` ile kanal izin listeleri/eşleştirme yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özel anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilse komutlar için izin listelerini/politikaları uygular.

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` içinden gelir
- üretilmiş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- Plugin komutları Plugin `registerCommand()` çağrılarından gelir
- Gateway'inizdeki gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin Plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]` geçerli dökümü korur, yeniden kullanılan CLI arka uç oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>` iş parçacığı bağlama süresinin dolmasını yönetir.
- `/think <level>` düşünme düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` gibi özel düzeyler veya ikili `on` yalnızca desteklenen yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı açar/kapatır. Takma ad: `/v`.
- `/trace on|off` geçerli oturum için Plugin izleme çıktısını açar/kapatır.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` muhakeme görünürlüğünü açar/kapatır. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]` elevated modunu açar/kapatır. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcının modellerini listeler.
- `/queue <mode>` kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help` kısa yardım özetini gösterir.
- `/commands` üretilmiş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status` varsa sağlayıcı kullanımı/kotası dahil çalışma zamanı durumunu gösterir.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl birleştirildiğini açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/whoami` gönderen kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]` bir skill'i adıyla çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord iş parçacığını veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için iş parçacığına bağlı ajanları listeler.
- `/kill <id|#|all>` çalışan alt ajanlardan birini veya tümünü iptal eder.
- `/steer <id|#> <message>` çalışan bir alt ajana yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını `mcp.servers` altında okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` Plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanı yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini kontrol eder veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS'yi kontrol eder. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkinleştirildiğinde OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderim ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>` bir ana makine kabuk komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve ayrıca `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` arka plan bash işini denetler.
- `!stop [sessionId]` arka plan bash işini durdurur.

### Üretilmiş dock komutları

Dock komutları, yerel komut desteğine sahip kanal Plugin'lerinden üretilir. Geçerli paketli küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketli Plugin komutları

Paketli Plugin'ler daha fazla eğik çizgi komutu ekleyebilir. Bu depodaki geçerli paketli komutlar:

- `/dreaming [on|off|status|help]` bellek dreaming özelliğini açar/kapatır. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon Node komutlarını geçici olarak etkinleştirir.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...` LINE zengin kart önayarlarını gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketli Codex uygulama sunucusu harness'ını inceler ve kontrol eder. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabildiği skill'ler de eğik çizgi komutları olarak sunulur:

- `/skill <name> [input]` genel giriş noktası olarak her zaman çalışır.
- bir skill/Plugin bunları kaydederse skill'ler `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından kontrol edilir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı bir `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını (bulanık eşleşme) kabul eder; eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı Plugin belirtimlerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, Plugin yapılandırmasını günceller ve yeniden başlatma istemi gösterebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını kontrol eder (`channels.discord.voice` ve yerel komutlar gerekir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkin iş parçacığı bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose` seçeneğinden daha dardır: yalnızca Plugin'e ait izleme/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç gevezeliğini kapalı tutar.
- `/fast on|off`, oturum düzeyinde bir geçersiz kılmayı kalıcı hale getirir. Bunu temizleyip yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- İlgili olduğunda araç hata özetleri yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda dahil edilir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: açığa çıkarmak istemediğiniz iç muhakemeyi, araç çıktısını veya Plugin tanılamalarını gösterebilirler. Özellikle grup sohbetlerinde bunları kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı hale getirir.
- Ajan boştaysa, sonraki çalıştırma bunu hemen kullanır.
- Zaten etkin bir çalıştırma varsa, OpenClaw canlı bir değişikliği beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
- Araç etkinliği veya yanıt çıktısı zaten başladıysa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı sırasına kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruk + model atlanır).
- **Grup mention geçidi:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** bazı komutlar normal bir mesajın içine gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status` bir durum yanıtı tetikler ve kalan metin normal akıştan geçmeye devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` skill'ler eğik çizgi komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (en fazla 32 karakter); çakışmalar sayısal sonekler alır (ör. `_2`).
  - `/skill <name> [input]` bir skill'i adıyla çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal bir istek olarak iletilir.
  - Skill'ler isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse Plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlamayı kullanır (ve gerekli argümanları atladığınızda düğme menülerini). Telegram ve Slack, bir komut seçenekleri destekliyorsa ve siz argümanı atladıysanız bir düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusuna değil, çalışma zamanı sorusuna yanıt verir: **bu ajanın şu anda
bu konuşmada neyi kullanabildiği**.

- Varsayılan `/tools` kompaktır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri, aynı kip değiştiricisini `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; yani ajanı, kanalı, iş parçacığını, gönderen yetkisini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, çalışma zamanında gerçekten erişilebilir olan araçları içerir; buna çekirdek araçlar, bağlı
  Plugin araçları ve kanala ait araçlar dahildir.

Profil ve geçersiz kılma düzenleme için, `/tools` komutunu sabit bir katalog gibi ele almak yerine Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne görünür)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw, sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca kalan yüzde alanları görüntülemeden önce ters çevrilir ve `model_remains` yanıtları sohbet modeli girdisini ve model etiketli bir plan etiketini tercih eder.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrekse en son döküm kullanım girdisine geri dönebilir. Sıfır olmayan mevcut canlı değerler yine önceliklidir ve döküm geri dönüşü, depolanmış toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini ve istem odaklı daha büyük bir toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtlara eklenir).
- `/model status`, kullanımla değil, **modeller/kimlik doğrulama/uç noktalar** ile ilgilidir.

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

- `/model` ve `/model list`, kompakt ve numaralandırılmış bir seçici gösterir (model ailesi + mevcut sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Submit adımını içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, varsa yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API kipini (`api`) içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanızı sağlar (bellekte, diskte değil). Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.debug: true` kullanın.

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

## Plugin izleme çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı Plugin izleme/hata ayıklama satırlarını** açıp kapatmanızı sağlar.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Argümansız `/trace`, geçerli oturumun izleme durumunu gösterir.
- `/trace on`, geçerli oturum için Plugin izleme satırlarını etkinleştirir.
- `/trace off`, bunları yeniden devre dışı bırakır.
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, diskteki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.config: true` kullanın.

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

`/mcp`, OpenClaw tarafından yönetilen MCP sunucu tanımlarını `mcp.servers` altında yazar. Yalnızca sahip. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.mcp: true` kullanın.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında depolar.
- Hangi taşıma türlerinin gerçekten çalıştırılabilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilmiş Plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi açıp kapatmasına olanak tanır. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; etkinleştirmek için `commands.plugins: true` kullanın.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanına ve diskteki yapılandırmaya göre gerçek Plugin keşfini kullanır.
- `/plugins enable|disable` yalnızca Plugin yapılandırmasını günceller; Plugin kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için Gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` aracılığıyla hedefler)
- **`/stop`**, etkin sohbet oturumunu hedefler; böylece geçerli çalıştırmayı iptal edebilir.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz, her yerleşik komut için Slack'te bir eğik çizgi komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri, geçici Block Kit düğmeleri olarak gönderilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil, `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine çalışır.

## BTW yan soruları

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı bir **araçsız** tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- döküm geçmişine yazılmaz,
- normal bir asistan mesajı yerine canlı bir yan sonuç olarak iletilir.

Bu da `/btw` komutunu, ana görev devam ederken geçici bir açıklama istediğinizde kullanışlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX ayrıntıları için [BTW Side Questions](/tr/tools/btw) bölümüne bakın.
