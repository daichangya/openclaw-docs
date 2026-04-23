---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinlerini hata ayıklama
summary: 'Slash komutları: metin ve yerel komutlar, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-23T09:12:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f6b454afa77cf02b2c307efcc99ef35d002cb560c427affaf03ac12b2b666e8
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Komutları

Komutlar Gateway tarafından işlenir. Çoğu komut, `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana makinede çalışan bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` bunun takma adıdır).

İlişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler, model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönerge olmayan), “satır içi ipuçları” olarak değerlendirilir ve kalıcı oturum ayarları olmaz.
  - Yalnızca yönergelerden oluşan mesajlarda (mesaj yalnızca yönergeler içeriyorsa), oturumda kalıcı olur ve bir onay yanıtı verir.
  - Yönergeler yalnızca **yetkili göndericiler** için uygulanır. `commands.allowFrom` ayarlıysa kullanılan tek
    izin listesi odur; aksi halde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz göndericiler, yönergeleri düz metin olarak görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde/yetkili göndericiler için): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutları ekleyene kadar); yerel desteği olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her skill için ayrı slash komut gerektirir).
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) ana makine kabuk komutlarını çalıştırmak için `! <cmd>` komutunu etkinleştirir (`/bash <cmd>` takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`) arka plan moduna geçmeden önce bash'in ne kadar bekleyeceğini kontrol eder (`0`, hemen arka plana alır).
- `commands.config` (varsayılan `false`) `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` komutunu etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` komutunu etkinleştirir (plugin keşfi/durumu artı kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` komutunu etkinleştirir (yalnızca çalışma zamanına ait geçersiz kılmalar).
- `commands.restart` (varsayılan `true`) `/restart` ve gateway restart aracı eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı) yalnızca sahibe açık komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- Kanal başına `channels.<channel>.commands.enforceOwnerForCommands` (isteğe bağlı, varsayılan `false`), yalnızca sahibe açık komutların o yüzeyde çalışması için **sahip kimliği** gerektirir. `true` olduğunda gönderen ya çözümlenmiş bir sahip adayıyla eşleşmeli (örneğin `commands.ownerAllowFrom` içindeki bir girdi veya sağlayıcının yerel sahip meta verisi) ya da dahili mesaj kanalında iç `operator.admin` kapsamına sahip olmalıdır. Kanal `allowFrom` içindeki joker bir girdi veya boş/çözümlenmemiş sahip aday listesi **yeterli değildir** — yalnızca sahibe açık komutlar o kanalda kapalı şekilde başarısız olur. Sahibe açık komutların yalnızca `ownerAllowFrom` ve standart komut izin listeleriyle denetlenmesini istiyorsanız bunu kapalı bırakın.
- `commands.ownerDisplay`, sahip kimliklerinin sistem isteminde nasıl görüneceğini belirler: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC gizlisini isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı başına izin listesi ayarlar. Yapılandırıldığında komutlar ve yönergeler için
  tek yetkilendirme kaynağı budur (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups`
  yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilse komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Geçerli doğruluk kaynağı:

- çekirdek yerleşik komutlar `src/auto-reply/commands-registry.shared.ts` dosyasından gelir
- oluşturulmuş dock komutları `src/auto-reply/commands-registry.data.ts` dosyasından gelir
- plugin komutları plugin `registerCommand()` çağrılarından gelir
- Gateway'inizde gerçekten kullanılabilir olmaları yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin plugin'lere bağlıdır

### Çekirdek yerleşik komutlar

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/reset soft [message]`, geçerli dökümü korur, yeniden kullanılan CLI backend oturum kimliklerini bırakır ve başlangıç/sistem istemi yüklemesini yerinde yeniden çalıştırır.
- `/compact [instructions]`, oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop`, geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>`, iş parçacığı bağlama süre sonunu yönetir.
- `/think <level>`, düşünme düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` veya ikili `on` gibi özel düzeyler yalnızca desteklendiği yerde bulunur. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full`, ayrıntılı çıktıyı değiştirir. Takma ad: `/v`.
- `/trace on|off`, geçerli oturum için plugin iz çıktısını değiştirir.
- `/fast [status|on|off]`, hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]`, akıl yürütme görünürlüğünü değiştirir. Takma ad: `/reason`.
- `/elevated [on|off|ask|full]`, yükseltilmiş modu değiştirir. Takma ad: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`, exec varsayılanlarını gösterir veya ayarlar.
- `/model [name|#|status]`, modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]`, sağlayıcıları veya bir sağlayıcıya ait modelleri listeler.
- `/queue <mode>`, kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help`, kısa yardım özetini gösterir.
- `/commands`, oluşturulmuş komut kataloğunu gösterir.
- `/tools [compact|verbose]`, geçerli aracının şu anda neleri kullanabildiğini gösterir.
- `/status`, varsa sağlayıcı kullanımı/kotasını da içeren çalışma zamanı durumunu gösterir.
- `/tasks`, geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]`, bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]`, geçerli oturumu HTML olarak dışa aktarır. Takma ad: `/export`.
- `/export-trajectory [path]`, geçerli oturum için JSONL [trajectory bundle](/tr/tools/trajectory) dışa aktarır. Takma ad: `/trajectory`.
- `/whoami`, gönderici kimliğinizi gösterir. Takma ad: `/id`.
- `/skill <name> [input]`, bir skill'i adına göre çalıştırır.
- `/allowlist [list|add|remove] ...`, izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>`, exec onay istemlerini çözümler.
- `/btw <question>`, gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn`, geçerli oturum için alt aracı çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`, ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>`, geçerli Discord iş parçacığını veya Telegram başlığını/konuşmasını bir oturum hedefine bağlar.
- `/unfocus`, geçerli bağlamayı kaldırır.
- `/agents`, geçerli oturum için iş parçacığına bağlı aracıları listeler.
- `/kill <id|#|all>`, çalışan bir veya tüm alt aracıları iptal eder.
- `/steer <id|#> <message>`, çalışan bir alt aracıya yönlendirme gönderir. Takma ad: `/tell`.
- `/config show|get|set|unset`, `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip için. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip için. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable`, plugin durumunu inceler veya değiştirir. `/plugin` bir takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset`, yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip için. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost`, yanıt başına kullanım alt bilgisini kontrol eder veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help`, TTS'yi kontrol eder. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart`, etkinleştirildiğinde OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always`, grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit`, gönderim ilkesini ayarlar. Yalnızca sahip için.
- `/bash <command>`, ana makine kabuk komutu çalıştırır. Yalnızca metin. Takma ad: `! <command>`. `commands.bash: true` ve `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]`, arka plan bash işini kontrol eder.
- `!stop [sessionId]`, arka plan bash işini durdurur.

### Oluşturulmuş dock komutları

Dock komutları, yerel komut desteği olan kanal plugin'lerinden oluşturulur. Geçerli paketlenmiş küme:

- `/dock-discord` (takma ad: `/dock_discord`)
- `/dock-mattermost` (takma ad: `/dock_mattermost`)
- `/dock-slack` (takma ad: `/dock_slack`)
- `/dock-telegram` (takma ad: `/dock_telegram`)

### Paketlenmiş plugin komutları

Paketlenmiş plugin'ler daha fazla slash komutu ekleyebilir. Bu depodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]`, bellek dreaming özelliğini değiştirir. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]`, cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Eşleştirme](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`, yüksek riskli telefon node komutlarını geçici olarak devreye alır.
- `/voice status|list [limit]|set <voiceId|name>`, Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` olur.
- `/card ...`, LINE zengin kart ön ayarları gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`, paketlenmiş Codex uygulama sunucusu harness'ini inceler ve denetler. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik skill komutları

Kullanıcının çağırabildiği Skills, slash komutları olarak da sunulur:

- `/skill <name> [input]`, genel giriş noktası olarak her zaman çalışır.
- skill'ler/plugin'ler bunları kaydederse `/prose` gibi doğrudan komutlar olarak da görünebilir.
- yerel skill komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` tarafından kontrol edilir.

Notlar:

- Komutlar, komut ile argümanlar arasına isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, bir model takma adını, `provider/model` biçimini veya bir sağlayıcı adını (bulanık eşleşme) kabul eder; eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` komutları da hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini kontrol eder; `/usage cost`, OpenClaw oturum günlüklerinden yerel bir maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin özelliklerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, plugin yapılandırmasını günceller ve yeniden başlatma istemi gösterebilir.
- Yalnızca Discord'a özgü yerel komut: `/vc join|leave|status`, sesli kanalları kontrol eder (`channels.discord.voice` ve yerel komutlar gerekir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkin iş parçacığı bağlamalarının açık olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose`'dan daha dardır: yalnızca plugin'e ait iz/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç konuşmasını kapalı tutar.
- `/fast on|off`, kalıcı bir oturum geçersiz kılması yapar. Bunu temizlemek ve yapılandırma varsayılanlarına dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özeldir: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` ile eşler; doğrudan herkese açık Anthropic istekleri, buna `api.anthropic.com` adresine OAuth ile kimlik doğrulanmış trafik de dahil, bunu `service_tier=auto` veya `standard_only` ile eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özetleri gerektiğinde yine gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` değeri `on` veya `full` olduğunda dahil edilir.
- `/reasoning`, `/verbose` ve `/trace`, grup ayarlarında risklidir: açığa çıkmasını istemediğiniz dahili akıl yürütmeyi, araç çıktısını veya plugin tanılamasını gösterebilirler. Özellikle grup sohbetlerinde kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcılaştırır.
- Aracı boşta ise bir sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlar.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
- **Hızlı yol:** izin verilen göndericilerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup bahsetme geçidi:** izin verilen göndericilerden gelen yalnızca komut içeren mesajlar bahsetme gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin verilen göndericiler):** bazı komutlar normal mesaj içine gömülü olduklarında da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status`, bir durum yanıtı tetikler ve kalan metin normal akıştan devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` token'ları düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` skill'ler slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine temizlenir (azami 32 karakter); çakışmalara sayısal sonek eklenir (ör. `_2`).
  - `/skill <name> [input]`, bir skill'i adına göre çalıştırır (yerel komut sınırları skill başına komutları engellediğinde kullanışlıdır).
  - Varsayılan olarak skill komutları modele normal istek olarak iletilir.
  - Skill'ler isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, model yok).
  - Örnek: `/prose` (OpenProse plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlamayı kullanır (ve gerekli argümanları atladığınızda düğme menülerini gösterir). Telegram ve Slack, bir komut seçenekleri destekliyorsa ve siz argümanı atladıysanız bir düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil, çalışma zamanı sorusunu yanıtlar: **bu aracının
bu konuşmada şu anda neleri kullanabildiğini**.

- Varsayılan `/tools` kompakt olup hızlı tarama için optimize edilmiştir.
- `/tools verbose`, kısa açıklamalar ekler.
- Argümanları destekleyen yerel komut yüzeyleri aynı mod anahtarını `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu yüzden aracı, kanal, iş parçacığı, gönderici yetkilendirmesi veya model değiştiğinde
  çıktı da değişebilir.
- `/tools`, çekirdek araçlar, bağlı plugin
  araçları ve kanala ait araçlar dahil, çalışma zamanında gerçekten erişilebilir olan araçları içerir.

Profil ve geçersiz kılma düzenlemeleri için `/tools` komutunu statik katalog gibi görmek yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kota** (örnek: “Claude %80 kaldı”), kullanım izleme etkinken geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` biçimine normalize eder; MiniMax için yalnızca kalan yüzde alanları gösterilmeden önce ters çevrilir ve `model_remains` yanıtlarında model etiketi taşıyan plan etiketiyle birlikte sohbet modeli girdisi tercih edilir.
- `/status` içindeki **token/cache satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son döküm kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine kazanır ve döküm yedeği, saklanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı modeli etiketini ve daha büyük, istem odaklı bir toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile kontrol edilir (normal yanıtlara eklenir).
- `/model status`, kullanım hakkında değil **modeller/auth/uç noktalar** hakkındadır.

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
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menüleri ile bir Gönder adımı içeren etkileşimli bir seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, kullanılabildiğinde yapılandırılmış sağlayıcı uç noktası (`baseUrl`) ve API modu (`api`) dahil ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanıza izin verir (disk değil, bellek). Yalnızca sahip için. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

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

## Plugin iz çıktısı

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı plugin iz/hata ayıklama satırlarını** değiştirmenize olanak tanır.

Örnekler:

```text
/trace
/trace on
/trace off
```

Notlar:

- Argümansız `/trace`, geçerli oturumun iz durumunu gösterir.
- `/trace on`, geçerli oturum için plugin iz satırlarını etkinleştirir.
- `/trace off`, bunları tekrar devre dışı bırakır.
- Plugin iz satırları `/status` içinde ve normal asistan yanıtından sonra takip tanılama mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı yine `/verbose` kapsamındadır.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip için. Varsayılan olarak devre dışıdır; `commands.config: true` ile etkinleştirin.

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
- `/config` güncellemeleri yeniden başlatmalar arasında kalıcıdır.

## MCP güncellemeleri

`/mcp`, OpenClaw tarafından yönetilen MCP sunucu tanımlarını `mcp.servers` altında yazar. Yalnızca sahip için. Varsayılan olarak devre dışıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi'ye ait proje ayarlarında değil, OpenClaw yapılandırmasında saklar.
- Hangi taşıma katmanlarının gerçekten yürütülebilir olduğuna çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen plugin'leri incelemesine ve yapılandırmada etkinlik durumunu değiştirmesine olanak tanır. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

Örnekler:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Notlar:

- `/plugins list` ve `/plugins show`, geçerli çalışma alanı ve disk üzerindeki yapılandırmaya karşı gerçek plugin keşfi kullanır.
- `/plugins enable|disable`, yalnızca plugin yapılandırmasını günceller; plugin'leri kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra uygulamak için Gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main` oturumunu paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (sohbet oturumunu `CommandTargetSessionKey` üzerinden hedefler)
- **`/stop`**, geçerli çalıştırmayı iptal edebilmek için etkin sohbet oturumunu hedefler.
- **Slack:** `channels.slack.slashCommand`, tek bir `/openclaw` tarzı komut için hâlâ desteklenir. `commands.native` etkinleştirirseniz yerleşik her komut için bir Slack slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argümanı menüleri geçici Block Kit düğmeleri olarak teslim edilir.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status`, Slack mesajlarında yine çalışır.

## BTW yan sorular

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı, **araçsız** tek seferlik bir çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- döküm geçmişine yazılmaz,
- normal asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, ana görev
devam ederken geçici bir açıklama istediğinizde `/btw` komutunu kullanışlı yapar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX
ayrıntıları için [BTW Yan Sorular](/tr/tools/btw) bölümüne bakın.
