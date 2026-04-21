---
read_when:
    - Sohbet komutlarını kullanma veya yapılandırma
    - Komut yönlendirmesini veya izinleri hata ayıklama
summary: 'Slash komutları: metin ve yerel, yapılandırma ve desteklenen komutlar'
title: Slash Komutları
x-i18n:
    generated_at: "2026-04-21T09:06:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d90ddee54af7c05b7fdf486590561084581d750e42cd14674d43bbdc0984df5d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Slash Komutları

Komutlar Gateway tarafından işlenir. Çoğu komut `/` ile başlayan **bağımsız** bir mesaj olarak gönderilmelidir.
Yalnızca ana bilgisayara özel bash sohbet komutu `! <cmd>` kullanır (`/bash <cmd>` takma addır).

Birbiriyle ilişkili iki sistem vardır:

- **Komutlar**: bağımsız `/...` mesajları.
- **Yönergeler**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Yönergeler model mesajı görmeden önce mesajdan çıkarılır.
  - Normal sohbet mesajlarında (yalnızca yönergeden oluşmayan), “satır içi ipuçları” olarak değerlendirilirler ve oturum ayarlarını kalıcı yapmazlar.
  - Yalnızca yönergeden oluşan mesajlarda (mesaj yalnızca yönergeler içerir), oturumda kalıcı olurlar ve bir onay yanıtı verirler.
  - Yönergeler yalnızca **yetkili gönderenler** için uygulanır. `commands.allowFrom` ayarlıysa kullanılan tek
    izin listesi budur; aksi hâlde yetkilendirme kanal izin listeleri/eşleştirme ve `commands.useAccessGroups` üzerinden gelir.
    Yetkisiz gönderenler yönergeleri düz metin olarak görür.

Ayrıca birkaç **satır içi kısayol** da vardır (yalnızca izin listesinde/yetkili gönderenler): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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

- `commands.text` (varsayılan `true`) sohbet mesajlarında `/...` ayrıştırmayı etkinleştirir.
  - Yerel komutları olmayan yüzeylerde (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), bunu `false` yapsanız bile metin komutları çalışmaya devam eder.
- `commands.native` (varsayılan `"auto"`) yerel komutları kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (slash komutlarını siz ekleyene kadar); yerel destek olmayan sağlayıcılarda yok sayılır.
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.native`, `channels.telegram.commands.native` veya `channels.slack.commands.native` ayarlayın (bool veya `"auto"`).
  - `false`, başlangıçta Discord/Telegram üzerinde daha önce kaydedilmiş komutları temizler. Slack komutları Slack uygulamasında yönetilir ve otomatik olarak kaldırılmaz.
- `commands.nativeSkills` (varsayılan `"auto"`) desteklendiğinde **Skill** komutlarını yerel olarak kaydeder.
  - Otomatik: Discord/Telegram için açık; Slack için kapalıdır (Slack her Skill için bir slash komutu oluşturmayı gerektirir).
  - Sağlayıcı başına geçersiz kılmak için `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` veya `channels.slack.commands.nativeSkills` ayarlayın (bool veya `"auto"`).
- `commands.bash` (varsayılan `false`) `! <cmd>` ile ana bilgisayar kabuk komutlarını çalıştırmayı etkinleştirir (`/bash <cmd>` takma addır; `tools.elevated` izin listeleri gerektirir).
- `commands.bashForegroundMs` (varsayılan `2000`) bash'in arka plan moduna geçmeden önce ne kadar bekleyeceğini denetler (`0`, hemen arka plana alır).
- `commands.config` (varsayılan `false`) `/config` özelliğini etkinleştirir (`openclaw.json` okur/yazar).
- `commands.mcp` (varsayılan `false`) `/mcp` özelliğini etkinleştirir (`mcp.servers` altındaki OpenClaw tarafından yönetilen MCP yapılandırmasını okur/yazar).
- `commands.plugins` (varsayılan `false`) `/plugins` özelliğini etkinleştirir (plugin keşfi/durumu artı kurulum + etkinleştirme/devre dışı bırakma denetimleri).
- `commands.debug` (varsayılan `false`) `/debug` özelliğini etkinleştirir (yalnızca çalışma zamanı geçersiz kılmaları).
- `commands.restart` (varsayılan `true`) `/restart` ve gateway yeniden başlatma araç eylemlerini etkinleştirir.
- `commands.ownerAllowFrom` (isteğe bağlı), yalnızca sahip için olan komut/araç yüzeyleri için açık sahip izin listesini ayarlar. Bu, `commands.allowFrom` değerinden ayrıdır.
- `commands.ownerDisplay`, sahip kimliklerinin sistem prompt'unda nasıl görüneceğini denetler: `raw` veya `hash`.
- `commands.ownerDisplaySecret`, `commands.ownerDisplay="hash"` olduğunda kullanılan HMAC gizlisini isteğe bağlı olarak ayarlar.
- `commands.allowFrom` (isteğe bağlı), komut yetkilendirmesi için sağlayıcı başına bir izin listesi ayarlar. Yapılandırıldığında bu,
  komutlar ve yönergeler için tek yetkilendirme kaynağı olur (kanal izin listeleri/eşleştirme ve `commands.useAccessGroups`
  yok sayılır). Genel varsayılan için `"*"` kullanın; sağlayıcıya özgü anahtarlar bunu geçersiz kılar.
- `commands.useAccessGroups` (varsayılan `true`), `commands.allowFrom` ayarlı değilken komutlar için izin listelerini/ilkeleri uygular.

## Komut listesi

Geçerli doğruluk kaynağı:

- core yerleşik komutları `src/auto-reply/commands-registry.shared.ts` içinden gelir
- oluşturulmuş dock komutları `src/auto-reply/commands-registry.data.ts` içinden gelir
- plugin komutları plugin `registerCommand()` çağrılarından gelir
- gateway'inizde gerçek kullanılabilirlik yine de yapılandırma bayraklarına, kanal yüzeyine ve kurulu/etkin plugin'lere bağlıdır

### Core yerleşik komutları

Bugün kullanılabilen yerleşik komutlar:

- `/new [model]` yeni bir oturum başlatır; `/reset` sıfırlama takma adıdır.
- `/compact [instructions]` oturum bağlamını sıkıştırır. Bkz. [/concepts/compaction](/tr/concepts/compaction).
- `/stop` geçerli çalıştırmayı iptal eder.
- `/session idle <duration|off>` ve `/session max-age <duration|off>`, iş parçacığı bağlama süresinin dolmasını yönetir.
- `/think <level>` thinking düzeyini ayarlar. Seçenekler etkin modelin sağlayıcı profilinden gelir; yaygın düzeyler `off`, `minimal`, `low`, `medium` ve `high` olup `xhigh`, `adaptive`, `max` veya yalnızca ikili `on` gibi özel düzeyler yalnızca desteklenen yerlerde bulunur. Takma adlar: `/thinking`, `/t`.
- `/verbose on|off|full` ayrıntılı çıktıyı değiştirir. Takma adı: `/v`.
- `/trace on|off` geçerli oturum için plugin izleme çıktısını değiştirir.
- `/fast [status|on|off]` hızlı modu gösterir veya ayarlar.
- `/reasoning [on|off|stream]` reasoning görünürlüğünü değiştirir. Takma adı: `/reason`.
- `/elevated [on|off|ask|full]` elevated modu değiştirir. Takma adı: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` varsayılan exec ayarlarını gösterir veya ayarlar.
- `/model [name|#|status]` modeli gösterir veya ayarlar.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` sağlayıcıları veya bir sağlayıcının modellerini listeler.
- `/queue <mode>`, kuyruk davranışını yönetir (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ve `debounce:2s cap:25 drop:summarize` gibi seçenekleri destekler.
- `/help` kısa yardım özetini gösterir.
- `/commands` oluşturulmuş komut kataloğunu gösterir.
- `/tools [compact|verbose]` geçerli ajanın şu anda neleri kullanabildiğini gösterir.
- `/status` çalışma zamanı durumunu, mevcutsa sağlayıcı kullanımı/kotasını da içerecek şekilde gösterir.
- `/tasks` geçerli oturum için etkin/son arka plan görevlerini listeler.
- `/context [list|detail|json]` bağlamın nasıl oluşturulduğunu açıklar.
- `/export-session [path]` geçerli oturumu HTML olarak dışa aktarır. Takma adı: `/export`.
- `/whoami` gönderen kimliğinizi gösterir. Takma adı: `/id`.
- `/skill <name> [input]` bir Skill'i ada göre çalıştırır.
- `/allowlist [list|add|remove] ...` izin listesi girdilerini yönetir. Yalnızca metin.
- `/approve <id> <decision>` exec onay istemlerini çözümler.
- `/btw <question>` gelecekteki oturum bağlamını değiştirmeden yan bir soru sorar. Bkz. [/tools/btw](/tr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` geçerli oturum için alt ajan çalıştırmalarını yönetir.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` ACP oturumlarını ve çalışma zamanı seçeneklerini yönetir.
- `/focus <target>` geçerli Discord iş parçacığını veya Telegram konusunu/konuşmasını bir oturum hedefine bağlar.
- `/unfocus` geçerli bağlamayı kaldırır.
- `/agents` geçerli oturum için iş parçacığına bağlı ajanları listeler.
- `/kill <id|#|all>` çalışan bir veya tüm alt ajanları iptal eder.
- `/steer <id|#> <message>` çalışan bir alt ajana yönlendirme gönderir. Takma adı: `/tell`.
- `/config show|get|set|unset` `openclaw.json` dosyasını okur veya yazar. Yalnızca sahip. `commands.config: true` gerektirir.
- `/mcp show|get|set|unset` `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırmasını okur veya yazar. Yalnızca sahip. `commands.mcp: true` gerektirir.
- `/plugins list|inspect|show|get|install|enable|disable` plugin durumunu inceler veya değiştirir. `/plugin` takma addır. Yazma işlemleri için yalnızca sahip. `commands.plugins: true` gerektirir.
- `/debug show|set|unset|reset` yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir. Yalnızca sahip. `commands.debug: true` gerektirir.
- `/usage off|tokens|full|cost` yanıt başına kullanım alt bilgisini denetler veya yerel maliyet özeti yazdırır.
- `/tts on|off|status|provider|limit|summary|audio|help` TTS'yi denetler. Bkz. [/tools/tts](/tr/tools/tts).
- `/restart` etkin olduğunda OpenClaw'ı yeniden başlatır. Varsayılan: etkin; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/activation mention|always` grup etkinleştirme modunu ayarlar.
- `/send on|off|inherit` gönderme ilkesini ayarlar. Yalnızca sahip.
- `/bash <command>` ana bilgisayar kabuk komutu çalıştırır. Yalnızca metin. Takma adı: `! <command>`. `commands.bash: true` ve ayrıca `tools.elevated` izin listeleri gerektirir.
- `!poll [sessionId]` arka plandaki bir bash işini kontrol eder.
- `!stop [sessionId]` arka plandaki bir bash işini durdurur.

### Oluşturulmuş dock komutları

Dock komutları, yerel komut desteğine sahip kanal plugin'lerinden oluşturulur. Geçerli paketlenmiş küme:

- `/dock-discord` (takma adı: `/dock_discord`)
- `/dock-mattermost` (takma adı: `/dock_mattermost`)
- `/dock-slack` (takma adı: `/dock_slack`)
- `/dock-telegram` (takma adı: `/dock_telegram`)

### Paketlenmiş plugin komutları

Paketlenmiş plugin'ler daha fazla slash komutu ekleyebilir. Bu depodaki geçerli paketlenmiş komutlar:

- `/dreaming [on|off|status|help]` bellek Dreaming özelliğini değiştirir. Bkz. [Dreaming](/tr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` cihaz eşleştirme/kurulum akışını yönetir. Bkz. [Pairing](/tr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` yüksek riskli telefon node komutlarını geçici olarak silahlandırır.
- `/voice status|list [limit]|set <voiceId|name>` Talk ses yapılandırmasını yönetir. Discord'da yerel komut adı `/talkvoice` şeklindedir.
- `/card ...` LINE rich card önayarları gönderir. Bkz. [LINE](/tr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` paketlenmiş Codex app-server harness'ini inceler ve denetler. Bkz. [Codex Harness](/tr/plugins/codex-harness).
- Yalnızca QQBot komutları:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Dinamik Skill komutları

Kullanıcı tarafından çağrılabilen Skills ayrıca slash komutları olarak da sunulur:

- `/skill <name> [input]` her zaman genel giriş noktası olarak çalışır.
- Skills, Skill/plugin bunları kaydettiğinde `/prose` gibi doğrudan komutlar olarak da görünebilir.
- Yerel Skill-komutu kaydı `commands.nativeSkills` ve `channels.<provider>.commands.nativeSkills` ile denetlenir.

Notlar:

- Komutlar, komut ile argümanlar arasında isteğe bağlı `:` kabul eder (ör. `/think: high`, `/send: on`, `/help:`).
- `/new <model>`, model takma adı, `provider/model` veya sağlayıcı adı kabul eder (bulanık eşleşme); eşleşme yoksa metin mesaj gövdesi olarak değerlendirilir.
- Tam sağlayıcı kullanım dökümü için `openclaw status --usage` kullanın.
- `/allowlist add|remove`, `commands.config=true` gerektirir ve kanal `configWrites` ayarına uyar.
- Çok hesaplı kanallarda, yapılandırma hedefli `/allowlist --account <id>` ve `/config set channels.<provider>.accounts.<id>...` de hedef hesabın `configWrites` ayarına uyar.
- `/usage`, yanıt başına kullanım alt bilgisini denetler; `/usage cost`, OpenClaw oturum günlüklerinden yerel maliyet özeti yazdırır.
- `/restart` varsayılan olarak etkindir; devre dışı bırakmak için `commands.restart: false` ayarlayın.
- `/plugins install <spec>`, `openclaw plugins install` ile aynı plugin spec'lerini kabul eder: yerel yol/arşiv, npm paketi veya `clawhub:<pkg>`.
- `/plugins enable|disable`, plugin yapılandırmasını günceller ve yeniden başlatma isteyebilir.
- Yalnızca Discord yerel komutu: `/vc join|leave|status`, ses kanallarını denetler (`channels.discord.voice` ve yerel komutlar gerektirir; metin olarak kullanılamaz).
- Discord iş parçacığı bağlama komutları (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), etkili iş parçacığı bağlamalarının etkin olmasını gerektirir (`session.threadBindings.enabled` ve/veya `channels.discord.threadBindings.enabled`).
- ACP komut başvurusu ve çalışma zamanı davranışı: [ACP Agents](/tr/tools/acp-agents).
- `/verbose`, hata ayıklama ve ek görünürlük içindir; normal kullanımda **kapalı** tutun.
- `/trace`, `/verbose` komutundan daha dardır: yalnızca plugin sahipli izleme/hata ayıklama satırlarını gösterir ve normal ayrıntılı araç gürültüsünü kapalı tutar.
- `/fast on|off`, oturum geçersiz kılmasını kalıcı yapar. Bunu temizlemek ve yapılandırma varsayılanlarına geri dönmek için Sessions UI içindeki `inherit` seçeneğini kullanın.
- `/fast`, sağlayıcıya özgüdür: OpenAI/OpenAI Codex bunu yerel Responses uç noktalarında `service_tier=priority` olarak eşlerken, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel Anthropic istekleri bunu `service_tier=auto` veya `standard_only` olarak eşler. Bkz. [OpenAI](/tr/providers/openai) ve [Anthropic](/tr/providers/anthropic).
- Araç hata özetleri uygun olduğunda yine de gösterilir, ancak ayrıntılı hata metni yalnızca `/verbose` `on` veya `full` olduğunda eklenir.
- `/reasoning`, `/verbose` ve `/trace` grup ayarlarında risklidir: açığa çıkarmayı istemediğiniz iç reasoning'i, araç çıktısını veya plugin tanılarını gösterebilirler. Özellikle grup sohbetlerinde kapalı bırakmayı tercih edin.
- `/model`, yeni oturum modelini hemen kalıcı yapar.
- Ajan boştaysa sonraki çalıştırma bunu hemen kullanır.
- Bir çalıştırma zaten etkinse OpenClaw canlı geçişi beklemede olarak işaretler ve yalnızca temiz bir yeniden deneme noktasında yeni modele yeniden başlatır.
- Araç etkinliği veya yanıt çıktısı zaten başlamışsa, bekleyen geçiş daha sonraki bir yeniden deneme fırsatına veya bir sonraki kullanıcı dönüşüne kadar kuyrukta kalabilir.
- **Hızlı yol:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar hemen işlenir (kuyruğu + modeli atlar).
- **Grup mention geçitleme:** izin listesindeki gönderenlerden gelen yalnızca komut içeren mesajlar mention gereksinimlerini atlar.
- **Satır içi kısayollar (yalnızca izin listesindeki gönderenler):** belirli komutlar normal bir mesaja gömülü olduğunda da çalışır ve model kalan metni görmeden önce çıkarılır.
  - Örnek: `hey /status`, durum yanıtını tetikler ve kalan metin normal akıştan geçmeye devam eder.
- Şu anda: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Yetkisiz yalnızca komut içeren mesajlar sessizce yok sayılır ve satır içi `/...` belirteçleri düz metin olarak değerlendirilir.
- **Skill komutları:** `user-invocable` Skills, slash komutları olarak sunulur. Adlar `a-z0-9_` biçimine dönüştürülür (en fazla 32 karakter); çakışmalara sayısal sonek eklenir (ör. `_2`).
  - `/skill <name> [input]`, bir Skill'i ada göre çalıştırır (yerel komut sınırları Skill başına komutları engellediğinde yararlıdır).
  - Varsayılan olarak Skill komutları modele normal bir istek olarak iletilir.
  - Skills isteğe bağlı olarak komutu doğrudan bir araca yönlendirmek için `command-dispatch: tool` bildirebilir (deterministik, modelsiz).
  - Örnek: `/prose` (OpenProse plugin'i) — bkz. [OpenProse](/tr/prose).
- **Yerel komut argümanları:** Discord dinamik seçenekler için otomatik tamamlama kullanır (ve gerekli argümanları atlarsanız düğme menüleri gösterir). Telegram ve Slack, komut seçimleri destekliyorsa ve siz argümanı atladıysanız düğme menüsü gösterir.

## `/tools`

`/tools`, bir yapılandırma sorusunu değil bir çalışma zamanı sorusunu yanıtlar: **bu ajanın
şu anda bu konuşmada ne kullanabildiğini**.

- Varsayılan `/tools` sıkıştırılmıştır ve hızlı tarama için optimize edilmiştir.
- `/tools verbose` kısa açıklamalar ekler.
- Argüman destekleyen yerel komut yüzeyleri aynı mod anahtarını `compact|verbose` olarak sunar.
- Sonuçlar oturum kapsamlıdır; bu yüzden ajanı, kanalı, iş parçacığını, gönderen yetkilendirmesini veya modeli değiştirmek
  çıktıyı değiştirebilir.
- `/tools`, gerçekten çalışma zamanında erişilebilir olan araçları içerir; buna core araçlar, bağlı
  plugin araçları ve kanal sahipli araçlar dahildir.

Profil ve geçersiz kılma düzenlemesi için `/tools` komutunu statik katalog gibi görmek yerine
Control UI Tools panelini veya yapılandırma/katalog yüzeylerini kullanın.

## Kullanım yüzeyleri (nerede ne gösterilir)

- **Sağlayıcı kullanımı/kotası** (örnek: “Claude %80 kaldı”), kullanım izleme etkin olduğunda geçerli model sağlayıcısı için `/status` içinde görünür. OpenClaw sağlayıcı pencerelerini `% kaldı` olarak normalize eder; MiniMax için yalnızca kalan yüzde alanları görüntülemeden önce ters çevrilir ve `model_remains` yanıtları sohbet-model girdisini artı model etiketli plan etiketini tercih eder.
- `/status` içindeki **token/önbellek satırları**, canlı oturum anlık görüntüsü seyrek olduğunda en son transkript kullanım girdisine geri dönebilir. Mevcut sıfır olmayan canlı değerler yine kazanır ve transkript fallback, saklanan toplamlar eksik veya daha küçük olduğunda etkin çalışma zamanı model etiketini artı daha büyük prompt odaklı toplamı da kurtarabilir.
- **Yanıt başına token/maliyet**, `/usage off|tokens|full` ile denetlenir (normal yanıtlara eklenir).
- `/model status`, kullanım ile değil **modeller/kimlik doğrulama/uç noktalar** ile ilgilidir.

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

- `/model` ve `/model list`, sıkıştırılmış, numaralı bir seçici gösterir (model ailesi + mevcut sağlayıcılar).
- Discord'da `/model` ve `/models`, sağlayıcı ve model açılır menülerinin yanı sıra bir Submit adımı içeren etkileşimli seçici açar.
- `/model <#>`, bu seçiciden seçim yapar (ve mümkün olduğunda geçerli sağlayıcıyı tercih eder).
- `/model status`, mevcut olduğunda yapılandırılmış sağlayıcı uç noktasını (`baseUrl`) ve API modunu (`api`) da içeren ayrıntılı görünümü gösterir.

## Hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlamanızı sağlar (bellek, disk değil). Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

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

`/trace`, tam ayrıntılı modu açmadan **oturum kapsamlı plugin izleme/hata ayıklama satırlarını**
değiştirmenizi sağlar.

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
- Plugin izleme satırları `/status` içinde ve normal asistan yanıtından sonra takip tanı mesajı olarak görünebilir.
- `/trace`, `/debug` yerine geçmez; `/debug` hâlâ yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını yönetir.
- `/trace`, `/verbose` yerine geçmez; normal ayrıntılı araç/durum çıktısı hâlâ `/verbose` alanına aittir.

## Yapılandırma güncellemeleri

`/config`, disk üzerindeki yapılandırmanıza (`openclaw.json`) yazar. Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.config: true` ile etkinleştirin.

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

`/mcp`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu tanımlarını yazar. Yalnızca sahip içindir. Varsayılan olarak devre dışıdır; `commands.mcp: true` ile etkinleştirin.

Örnekler:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Notlar:

- `/mcp`, yapılandırmayı Pi sahipli proje ayarlarına değil OpenClaw yapılandırmasına depolar.
- Hangi taşımaların gerçekten yürütülebileceğine çalışma zamanı bağdaştırıcıları karar verir.

## Plugin güncellemeleri

`/plugins`, operatörlerin keşfedilen plugin'leri incelemesine ve yapılandırmada etkinleştirmeyi değiştirmesine izin verir. Salt okunur akışlar takma ad olarak `/plugin` kullanabilir. Varsayılan olarak devre dışıdır; `commands.plugins: true` ile etkinleştirin.

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
- `/plugins enable|disable`, yalnızca plugin yapılandırmasını günceller; plugin'leri kurmaz veya kaldırmaz.
- Etkinleştirme/devre dışı bırakma değişikliklerinden sonra bunları uygulamak için gateway'i yeniden başlatın.

## Yüzey notları

- **Metin komutları**, normal sohbet oturumunda çalışır (DM'ler `main` paylaşır, grupların kendi oturumu vardır).
- **Yerel komutlar**, yalıtılmış oturumlar kullanır:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (önek `channels.slack.slashCommand.sessionPrefix` ile yapılandırılabilir)
  - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey` aracılığıyla sohbet oturumunu hedefler)
- **`/stop`**, geçerli sohbet oturumunu hedefler; böylece geçerli çalıştırmayı iptal edebilir.
- **Slack:** tek `/openclaw` tarzı komut için `channels.slack.slashCommand` hâlâ desteklenir. `commands.native` etkinleştirirseniz, yerleşik her komut için Slack'te bir slash komutu oluşturmanız gerekir (`/help` ile aynı adlar). Slack için komut argüman menüleri geçici Block Kit düğmeleri olarak sunulur.
  - Slack yerel istisnası: Slack `/status` komutunu ayırdığı için `/status` değil `/agentstatus` kaydedin. Metin `/status` Slack mesajlarında yine çalışır.

## BTW yan sorular

`/btw`, geçerli oturum hakkında hızlı bir **yan soru**dur.

Normal sohbetten farklı olarak:

- geçerli oturumu arka plan bağlamı olarak kullanır,
- ayrı, **araçsız** bir tek seferlik çağrı olarak çalışır,
- gelecekteki oturum bağlamını değiştirmez,
- transkript geçmişine yazılmaz,
- normal asistan mesajı yerine canlı yan sonuç olarak teslim edilir.

Bu, `/btw` komutunu ana
görev devam ederken geçici bir açıklama istediğinizde kullanışlı kılar.

Örnek:

```text
/btw şu anda ne yapıyoruz?
```

Tam davranış ve istemci UX
ayrıntıları için bkz. [BTW Yan Sorular](/tr/tools/btw).
