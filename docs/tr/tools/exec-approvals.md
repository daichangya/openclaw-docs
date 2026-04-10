---
read_when:
    - Exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onay kullanıcı deneyimini uygulama
    - Sandbox kaçış istemlerini ve etkilerini inceleme
summary: Exec onayları, izin listeleri ve sandbox kaçış istemleri
title: Exec Onayları
x-i18n:
    generated_at: "2026-04-10T08:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec onayları

Exec onayları, sandbox içinde çalışan bir ajanın gerçek bir ana makinede (`gateway` veya `node`)
komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / düğüm ana makinesi korkuluğudur**.
Bunu bir güvenlik ara kilidi gibi düşünün:
komutlara yalnızca ilke + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte kabul ederse izin verilir.
Exec onayları, araç ilkesine ve yükseltilmiş kapılamaya **ek olarak** uygulanır (`elevated`, `full` olarak ayarlanırsa onaylar atlanır).
Geçerli ilke, `tools.exec.*` ile onay varsayılanlarının **daha sıkı** olanıdır; bir onay alanı belirtilmezse `tools.exec` değeri kullanılır.
Ana makine exec işlemi ayrıca o makinedeki yerel onay durumunu da kullanır. Ana makinede yerel
`~/.openclaw/exec-approvals.json` içindeki `ask: "always"`, oturum veya yapılandırma varsayılanları
`ask: "on-miss"` istese bile istem göstermeye devam eder.
İstenen ilkeyi, ana makine ilke kaynaklarını ve geçerli sonucu incelemek için
`openclaw approvals get`, `openclaw approvals get --gateway` veya
`openclaw approvals get --node <id|name|ip>` kullanın.
Yerel makine için `openclaw exec-policy show`, birleştirilmiş aynı görünümü gösterir ve
`openclaw exec-policy set|preset`, yerel istenen ilkeyi
yerel ana makine onay dosyasıyla tek adımda eşzamanlayabilir. Yerel bir kapsam `host=node`
istediğinde, `openclaw exec-policy show`, yerel onay dosyasının geçerli doğruluk kaynağı olduğunu
varsaymak yerine, o kapsamı çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama kullanıcı arayüzü **kullanılamıyorsa**, istem gerektiren her istek
**ask fallback** ile çözülür (varsayılan: deny).

Yerel sohbet onay istemcileri ayrıca bekleyen onay mesajında kanala özgü kolaylıklar sunabilir.
Örneğin Matrix, onay isteminde tepki kısayollarını önceden yerleştirebilir
(`✅` bir kez izin ver, `❌` reddet ve mevcut olduğunda `♾️` her zaman izin ver)
ve yine de mesaj içinde yedek olarak `/approve ...` komutlarını bırakabilir.

## Nerede uygulanır

Exec onayları, yürütmenin yapıldığı ana makinede yerel olarak uygulanır:

- **gateway ana makinesi** → gateway makinesindeki `openclaw` işlemi
- **node ana makinesi** → node çalıştırıcısı (macOS yardımcı uygulaması veya arayüzsüz node ana makinesi)

Güven modeli notu:

- Gateway tarafından kimliği doğrulanmış çağıranlar, o Gateway için güvenilir operatörlerdir.
- Eşlenmiş node’lar, bu güvenilir operatör yeteneğini node ana makinesine genişletir.
- Exec onayları, yanlışlıkla yürütme riskini azaltır, ancak kullanıcı başına bir kimlik doğrulama sınırı değildir.
- Onaylı node ana makinesi çalıştırmaları, kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, varsa env
  bağlaması ve uygulanabiliyorsa sabitlenmiş yürütülebilir dosya yolu.
- Kabuk script’leri ve yorumlayıcı/çalışma zamanı dosyalarının doğrudan çağrımları için OpenClaw ayrıca
  tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlı dosya, onaydan sonra ancak yürütmeden önce değişirse,
  kaymış içerik yürütülmek yerine çalıştırma reddedilir.
- Bu dosya bağlama kasıtlı olarak en iyi çabadır; her yorumlayıcı/çalışma zamanı yükleyici yolunun tam anlamsal modeli değildir.
  Onay modu bağlamak için tam olarak bir somut yerel dosya belirleyemezse,
  tam kapsama varmış gibi davranmak yerine onay destekli bir çalıştırma üretmeyi reddeder.

macOS ayrımı:

- **node ana makinesi hizmeti**, `system.run` isteğini yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, onayları uygular + komutu kullanıcı arayüzü bağlamında yürütür.

## Ayarlar ve depolama

Onaylar, yürütmenin yapıldığı ana makinede yerel bir JSON dosyasında tutulur:

`~/.openclaw/exec-approvals.json`

Örnek şema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Onaysız "YOLO" modu

Ana makine exec işleminin onay istemleri olmadan çalışmasını istiyorsanız, **her iki** ilke katmanını da açmanız gerekir:

- OpenClaw yapılandırmasında istenen exec ilkesi (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json` içindeki ana makineye yerel onay ilkesi

Açıkça sıkılaştırmadığınız sürece bu artık varsayılan ana makine davranışıdır:

- `tools.exec.security`: `gateway`/`node` üzerinde `full`
- `tools.exec.ask`: `off`
- ana makine `askFallback`: `full`

Önemli ayrım:

- `tools.exec.host=auto`, exec’in nerede çalışacağını seçer: varsa sandbox, yoksa gateway.
- YOLO, ana makine exec işleminin nasıl onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış ana makine exec ilkesinin üzerine ayrı bir sezgisel komut-gizleme onay kapısı eklemez.
- `auto`, gateway yönlendirmesini sandbox içindeki bir oturumdan serbest bir geçersiz kılma yapmaz. `host=node` için çağrı başına bir istek `auto` içinden kabul edilir ve `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yoksa `auto` içinden kabul edilir. Kararlı bir auto olmayan varsayılan istiyorsanız, `tools.exec.host` ayarlayın veya `/exec host=...` ifadesini açıkça kullanın.

Daha temkinli bir kurulum istiyorsanız, katmanlardan birini `allowlist` / `on-miss`
veya `deny` durumuna geri sıkılaştırın.

Kalıcı gateway ana makinesi "asla istem gösterme" kurulumu:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ardından ana makine onay dosyasını eşleşecek şekilde ayarlayın:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Geçerli makinede aynı gateway ana makinesi ilkesi için yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol her ikisini de günceller:

- yerel `tools.exec.host/security/ask`
- yerel `~/.openclaw/exec-approvals.json` varsayılanları

Bu kasıtlı olarak yalnızca yereldir. Gateway ana makinesi veya node ana makinesi onaylarını
uzaktan değiştirmeniz gerekiyorsa, `openclaw approvals set --gateway` veya
`openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

Bir node ana makinesi için aynı onay dosyasını bunun yerine o node üzerinde uygulayın:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Önemli yalnızca yerel sınırlama:

- `openclaw exec-policy`, node onaylarını eşzamanlamaz
- `openclaw exec-policy set --host node` reddedilir
- node exec onayları çalışma zamanında node’dan alınır, bu nedenle node hedefli güncellemeler için `openclaw approvals --node ...` kullanılmalıdır

Yalnızca oturum kısayolu:

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, bu oturum için exec onaylarını da atlayan bir acil durum kısayoludur.

Ana makine onay dosyası yapılandırmadan daha sıkı kalırsa, daha sıkı ana makine ilkesi yine kazanır.

## İlke düğmeleri

### Güvenlik (`exec.security`)

- **deny**: tüm ana makine exec isteklerini engeller.
- **allowlist**: yalnızca izin listesine alınmış komutlara izin verir.
- **full**: her şeye izin verir (`elevated` ile eşdeğer).

### Sor (`exec.ask`)

- **off**: asla istem gösterme.
- **on-miss**: yalnızca izin listesi eşleşmediğinde istem göster.
- **always**: her komutta istem göster.
- `allow-always` kalıcı güveni, geçerli ask modu `always` olduğunda istemleri bastırmaz

### Ask fallback (`askFallback`)

Bir istem gerekliyse ancak hiçbir kullanıcı arayüzüne ulaşılamıyorsa, fallback şuna karar verir:

- **deny**: engelle.
- **allowlist**: yalnızca izin listesi eşleşiyorsa izin ver.
- **full**: izin ver.

### Satır içi yorumlayıcı eval güçlendirmesi (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` olduğunda OpenClaw, yorumlayıcı ikilisinin kendisi izin listesinde olsa bile satır içi kod değerlendirme biçimlerini yalnızca onaylı olarak ele alır.

Örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Bu, tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyiciler için savunma amaçlı ek bir katmandır. Sıkı modda:

- bu komutlar yine de açık onay gerektirir;
- `allow-always`, bunlar için yeni izin listesi girdilerini otomatik olarak kalıcı hale getirmez.

## İzin listesi (ajan başına)

İzin listeleri **ajan başınadır**. Birden fazla ajan varsa,
macOS uygulamasında düzenlediğiniz ajanı değiştirin. Kalıplar **büyük/küçük harfe duyarsız glob eşleşmeleridir**.
Kalıplar **ikili dosya yollarına** çözülmelidir (yalnızca basename içeren girdiler yok sayılır).
Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi shell zincirleri yine de her üst düzey segmentin izin listesi kurallarını karşılamasını gerektirir.

Örnekler:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her izin listesi girdisi şunları izler:

- **id** kullanıcı arayüzü kimliği için kararlı UUID (isteğe bağlı)
- **son kullanım** zaman damgası
- **son kullanılan komut**
- **son çözümlenen yol**

## Skill CLI’lerini otomatik izinli yap

**Auto-allow skill CLIs** etkin olduğunda, bilinen Skills tarafından başvurulan yürütülebilir dosyalar
node’larda (macOS node veya arayüzsüz node ana makinesi) izin listesine alınmış kabul edilir. Bu,
skill bin listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Sıkı el ile izin listeleri istiyorsanız bunu devre dışı bırakın.

Önemli güven notları:

- Bu, el ile yol izin listesi girdilerinden ayrı bir **örtük kolaylık izin listesidir**.
- Bunun amacı, Gateway ile node’un aynı güven sınırı içinde olduğu güvenilir operatör ortamlarıdır.
- Sıkı açık güven gerekiyorsa, `autoAllowSkills: false` olarak bırakın ve yalnızca el ile yol izin listesi girdilerini kullanın.

## Güvenli ikili dosyalar (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi girdileri olmadan **stdin-only**
ikili dosyaların (örneğin `cut`) `allowlist` modunda çalışabileceği küçük bir liste tanımlar.
Güvenli ikili dosyalar konumsal dosya argümanlarını ve yol benzeri belirteçleri reddeder; böylece yalnızca gelen akış üzerinde çalışabilirler.
Bunu genel bir güven listesi değil, akış filtreleri için dar bir hızlı yol olarak değerlendirin.
Yorumlayıcı veya çalışma zamanı ikili dosyalarını (`python3`, `node`, `ruby`, `bash`, `sh`, `zsh` gibi)
`safeBins` içine **eklemeyin**.
Bir komut tasarım gereği kod değerlendirebiliyor, alt komut yürütebiliyor veya dosya okuyabiliyorsa,
açık izin listesi girdilerini tercih edin ve onay istemlerini etkin tutun.
Özel güvenli ikili dosyalar, `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
Doğrulama yalnızca argv biçiminden deterministik olarak yapılır (ana makine dosya sisteminde varlık denetimi yapılmaz), bu da
izin/vermeme farklarından dosya varlığı oracle davranışını önler.
Varsayılan güvenli ikili dosyalar için dosya odaklı seçenekler reddedilir (`sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file` gibi).
Güvenli ikili dosyalar ayrıca stdin-only
davranışını bozan seçenekler için ikili dosya başına açık bayrak ilkesi uygular (`sort -o/--output/--compress-program` ve grep özyinelemeli bayrakları gibi).
Uzun seçenekler güvenli ikili dosya modunda başarısızlıkta kapalı şekilde doğrulanır: bilinmeyen bayraklar ve belirsiz
kısaltmalar reddedilir.
Güvenli ikili dosya profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca argv belirteçlerinin yürütme sırasında **düz metin**
olarak ele alınmasını zorunlu kılar (globbing yok
ve stdin-only segmentler için `$VARS` genişletmesi yoktur); böylece `*` veya `$HOME/...` gibi kalıplar
dosya okumalarını kaçırmak için kullanılamaz.
Güvenli ikili dosyalar ayrıca güvenilir ikili dosya dizinlerinden çözülmelidir (sistem varsayılanları artı isteğe bağlı
`tools.exec.safeBinTrustedDirs`).
`PATH` girdilerine hiçbir zaman otomatik olarak güvenilmez.
Varsayılan güvenilir safe-bin dizinleri kasıtlı olarak asgari düzeydedir: `/bin`, `/usr/bin`.
Güvenli ikili dosyanız paket yöneticisi/kullanıcı yollarında bulunuyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça
`tools.exec.safeBinTrustedDirs` içine ekleyin.
Kabuk zincirleme ve yönlendirmelere `allowlist` modunda otomatik olarak izin verilmez.

Kabuk zincirlemeye (`&&`, `||`, `;`), her üst düzey segment izin listesi koşullarını sağlıyorsa
(güvenli ikili dosyalar veya skill otomatik izin dahil) izin verilir. Yönlendirmeler `allowlist` modunda desteklenmez.
Komut ikamesi (`$()` / ters tırnaklar), çift tırnak içinde olsa bile `allowlist` ayrıştırması sırasında reddedilir;
düz `$()` metnine ihtiyacınız varsa tek tırnak kullanın.
macOS yardımcı uygulama onaylarında, kabuk denetim veya genişletme sözdizimi
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham shell metni,
kabuk ikili dosyasının kendisi izin listesinde değilse `allowlist` kaçırması olarak değerlendirilir.
Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamındaki env geçersiz kılmaları
küçük ve açık bir izin listesine indirgenir (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
`allowlist` modunda allow-always kararları için bilinen dispatch sarmalayıcıları
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı
yolları yerine iç yürütülebilir dosya yollarını kalıcılaştırır. Kabuk çoklayıcıları (`busybox`, `toybox`) da kabuk applet’leri (`sh`, `ash`,
vb.) için açılarak çoklayıcı ikili dosyaları yerine iç yürütülebilir dosyalar kalıcılaştırılır. Bir sarmalayıcı veya
çoklayıcı güvenli şekilde açılamıyorsa, otomatik olarak hiçbir izin listesi girdisi kalıcılaştırılmaz.
`python3` veya `node` gibi yorumlayıcıları izin listesine alırsanız, satır içi eval’in hâlâ açık onay gerektirmesi için `tools.exec.strictInlineEval=true` tercih edin. Sıkı modda, `allow-always` yine de zararsız yorumlayıcı/script çağrılarını kalıcılaştırabilir, ancak satır içi eval taşıyıcıları otomatik olarak kalıcılaştırılmaz.

Varsayılan güvenli ikili dosyalar:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort`, varsayılan listede değildir. Açıkça etkinleştirirseniz,
stdin dışı iş akışları için açık izin listesi girdileri kullanmaya devam edin.
`grep` için safe-bin modunda, deseni `-e`/`--regexp` ile sağlayın; konumsal desen biçimi
reddedilir, böylece dosya işlenenleri belirsiz konumsal argümanlar olarak kaçırılamaz.

### Güvenli ikili dosyalar ile allowlist karşılaştırması

| Konu | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Amaç | Dar stdin filtrelerine otomatik izin vermek | Belirli yürütülebilir dosyalara açıkça güvenmek |
| Eşleşme türü | Yürütülebilir dosya adı + safe-bin argv ilkesi | Çözümlenmiş yürütülebilir dosya yolu glob kalıbı |
| Argüman kapsamı | Safe-bin profili ve düz belirteç kurallarıyla kısıtlanır | Yalnızca yol eşleşmesi; diğer açılardan argümanlar sizin sorumluluğunuzdadır |
| Tipik örnekler | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, özel CLI’ler |
| En iyi kullanım | İşlem hatlarında düşük riskli metin dönüşümleri | Daha geniş davranış veya yan etkilere sahip tüm araçlar |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya ajan başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya ajan başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya ajan başına `agents.list[].tools.exec.safeBinProfiles`). Ajan başına profil anahtarları genel anahtarları geçersiz kılar.
- allowlist girdileri, ana makineye yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında tutulur (veya Control UI / `openclaw approvals allowlist ...` üzerinden).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikili dosyaları açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` uyarısı verir.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikili dosyaları otomatik olarak iskeletlenmez.

Özel profil örneği:
__OC_I18N_900005__
`jq`yu açıkça `safeBins` içine dahil ederseniz, OpenClaw safe-bin
modunda yine de `env` yerleşik işlevini reddeder; böylece `jq -n env`, açık bir allowlist yolu
veya onay istemi olmadan ana makine işlem ortamını dökemez.

## Control UI düzenleme

Varsayılanları, ajan başına
geçersiz kılmaları ve allowlist’leri düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir ajan), ilkeyi ayarlayın,
allowlist kalıplarını ekleyin/kaldırın, ardından **Kaydet**’e tıklayın. Kullanıcı arayüzü, listeyi düzenli tutabilmeniz için
kalıp başına **son kullanım** meta verilerini gösterir.

Hedef seçici **Gateway**’i (yerel onaylar) veya bir **Node**’u seçer. Node’lar
`system.execApprovals.get/set` desteğini bildirmelidir (macOS uygulaması veya arayüzsüz node ana makinesi).
Bir node henüz exec approvals desteğini bildirmiyorsa, yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler (bkz. [Approvals CLI](/cli/approvals)).

## Onay akışı

İstem gerektiğinde gateway, operatör istemcilerine `exec.approval.requested` yayını yapar.
Control UI ve macOS uygulaması bunu `exec.approval.resolve` ile çözer, ardından gateway
onaylanan isteği node ana makinesine iletir.

`host=node` için onay istekleri kanonik bir `systemRunPlan` payload’ı içerir. Gateway,
onaylanmış `system.run`
isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, eşzamansız onay gecikmesi açısından önemlidir:

- node exec yolu başta tek bir kanonik plan hazırlar
- onay kaydı bu planı ve bağlama meta verilerini depolar
- onaylandıktan sonra son iletilen `system.run` çağrısı
  daha sonra çağıran tarafından yapılan düzenlemelere güvenmek yerine depolanan planı yeniden kullanır
- çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse, gateway
  iletilen çalıştırmayı onay uyuşmazlığı olarak reddeder

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları kasıtlı olarak tutucudur:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk script’i ve doğrudan çalışma zamanı dosyası biçimleri, tek bir somut yerel
  dosya anlık görüntüsüne en iyi çabayla bağlanır.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`), bağlamadan önce açılır.
- OpenClaw, bir yorumlayıcı/çalışma zamanı komutu için tam olarak bir somut yerel dosya belirleyemezse
  (örneğin paket script’leri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çoklu dosya
  biçimleri), onay destekli yürütme,
  kapsadığına dair anlamsal kapsam iddiasında bulunmak yerine reddedilir.
- Bu iş akışları için sandbox, ayrı bir ana makine sınırı veya operatörün daha geniş çalışma zamanı anlambilimini kabul ettiği açık güvenilir
  allowlist/full iş akışını tercih edin.

Onay gerektiğinde exec aracı hemen bir onay kimliğiyle döner. Daha sonraki sistem olaylarını (`Exec finished` / `Exec denied`) ilişkilendirmek için bu kimliği kullanın. Zaman aşımından önce karar gelmezse,
istek bir onay zaman aşımı olarak değerlendirilir ve ret nedeni olarak gösterilir.

### Takip teslim davranışı

Onaylı eşzamansız exec tamamlandıktan sonra OpenClaw aynı oturuma bir takip `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi o kanalı kullanır.
- Harici hedef olmayan yalnızca webchat veya iç oturum akışlarında, takip teslimi yalnızca oturum içinde kalır (`deliver: false`).
- Bir çağıran, çözümlenebilir harici kanal olmadan açıkça katı harici teslim isterse, istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve hiçbir harici kanal çözümlenemiyorsa, teslim başarısız olmak yerine yalnızca oturum içi teslimata düşürülür.

Onay iletişim kutusu şunları içerir:

- komut + argümanlar
- cwd
- ajan kimliği
- çözümlenmiş yürütülebilir dosya yolu
- ana makine + ilke meta verileri

Eylemler:

- **Bir kez izin ver** → şimdi çalıştır
- **Her zaman izin ver** → allowlist’e ekle + çalıştır
- **Reddet** → engelle

## Sohbet kanallarına onay yönlendirme

Exec onay istemlerini herhangi bir sohbet kanalına (plugin kanalları dahil) yönlendirebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim işlem hattını kullanır.

Yapılandırma:
__OC_I18N_900006__
Sohbette yanıt:
__OC_I18N_900007__
`/approve` komutu hem exec onaylarını hem de plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse, otomatik olarak plugin onaylarını da kontrol eder.

### Plugin onayı yönlendirme

Plugin onayı yönlendirme, exec onaylarıyla aynı teslim işlem hattını kullanır ancak kendi
bağımsız yapılandırmasına `approvals.plugin` altında sahiptir. Birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900008__
Yapılandırma şekli `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de
plugin onayları için aynı onay düğmelerini gösterir. Paylaşılan etkileşimli kullanıcı arayüzü olmayan kanallar
düz metne ve `/approve` yönergelerine geri düşer.

### Her kanalda aynı sohbetten onaylar

Bir exec veya plugin onay isteği teslim edilebilir bir sohbet yüzeyinden geldiğinde, artık aynı sohbet
bunu varsayılan olarak `/approve` ile onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak
Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin komutu yolu, o konuşma için normal kanal kimlik doğrulama modelini kullanır. Kaynak sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin beklemede kalması için artık
ayrı bir yerel teslim bağdaştırıcısına gerek yoktur.

Discord ve Telegram da aynı sohbetten `/approve` desteği sunar, ancak yerel onay teslimi devre dışı olsa bile
bu kanallar yetkilendirme için yine de çözümlenmiş approver listelerini kullanır.

Gateway’i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için,
bu fallback kasıtlı olarak "approval not found" hatalarıyla sınırlıdır. Gerçek bir
exec onayı reddi/hatası sessizce plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar ayrıca yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbetten `/approve`
akışına ek olarak approver DM’leri, kaynak sohbet fanout’unu ve kanala özgü etkileşimli onay kullanıcı deneyimini ekler.

Yerel onay kartları/düğmeleri kullanılabildiğinde, bu yerel kullanıcı arayüzü ajana yönelik
birincil yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya
yalnızca manuel onayın kaldığını söylemedikçe ajan ayrıca yinelenen düz bir sohbet
`/approve` komutunu da yansıtmamalıdır.

Genel model:

- exec onayının gerekip gerekmediğine ana makine exec ilkesi yine karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine yönlendirilmesini kontrol eder
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmayacağını kontrol eder

Yerel onay istemcileri, aşağıdakilerin tümü doğru olduğunda DM-first teslimini otomatik olarak etkinleştirir:

- kanal yerel onay teslimini destekliyorsa
- approver’lar açık `execApprovals.approvers` veya o
  kanalın belgelenmiş fallback kaynaklarından çözümlenebiliyorsa
- `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise

Yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Approver’lar çözümlendiğinde
zorla açmak için `enabled: true` ayarlayın. Genel kaynak sohbet teslimi,
`channels.<channel>.execApprovals.target` üzerinden açık kalır.

SSS: [Sohbet onayları için neden iki exec onayı yapılandırması var?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan
aynı sohbet `/approve` akışı ve paylaşılan onay düğmelerinin üzerine DM yönlendirmesi ve isteğe bağlı kanal fanout ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler, aynı sohbetten `/approve` için
  normal kanal kimlik doğrulama modelini kullanır
- bir yerel onay istemcisi otomatik olarak etkinleştiğinde, varsayılan yerel teslim hedefi approver DM’leridir
- Discord ve Telegram için yalnızca çözümlenmiş approver’lar onaylayabilir veya reddedebilir
- Discord approver’ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Telegram approver’ları açık olabilir (`execApprovals.approvers`) veya mevcut owner yapılandırmasından çıkarılabilir (`allowFrom`, ayrıca desteklenen yerlerde doğrudan mesaj `defaultTo`)
- Slack approver’ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` üzerinden çıkarılabilir
- Slack yerel düğmeleri, onay kimliği türünü korur; böylece `plugin:` kimlikleri ikinci bir Slack’e özgü fallback katmanı olmadan
  plugin onaylarını çözebilir
- Matrix yerel DM/kanal yönlendirmesi ve tepki kısayolları hem exec hem de plugin onaylarını işler;
  plugin yetkilendirmesi yine `channels.matrix.dm.allowFrom` üzerinden gelir
- istekte bulunan kişinin approver olması gerekmez
- kaynak sohbet, zaten komutları ve yanıtları destekliyorsa `/approve` ile doğrudan onaylayabilir
- yerel Discord onay düğmeleri, onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri
  doğrudan plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri, `/approve` ile aynı sınırlı exec-to-plugin fallback davranışını izler
- yerel `target`, kaynak sohbet teslimini etkinleştirdiğinde onay istemleri komut metnini içerir
- bekleyen exec onaylarının varsayılan süresi 30 dakika sonra dolar
- hiçbir operatör kullanıcı arayüzü veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa, istem `askFallback` davranışına geri düşer

Telegram varsayılan olarak approver DM’lerini kullanır (`target: "dm"`). Onay istemlerinin
kaynak Telegram sohbetinde/konusunda da görünmesini istiyorsanız bunu `channel` veya `both` olarak değiştirebilirsiniz. Telegram forum
konuları için OpenClaw, onay istemi ve onay sonrası takip için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900009__
Güvenlik notları:

- Unix socket modu `0600`, token `exec-approvals.json` içinde depolanır.
- Aynı UID eş denetimi.
- Sınama/yanıt (nonce + HMAC token + istek hash’i) + kısa TTL.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak yüzeye çıkarılır:

- `Exec running` (yalnızca komut çalışma bildirimi eşiğini aşarsa)
- `Exec finished`
- `Exec denied`

Bunlar, node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway ana makinesi exec onayları, komut tamamlandığında (ve isteğe bağlı olarak eşikten daha uzun çalıştığında)
aynı yaşam döngüsü olaylarını yayar.
Onay kapılı exec’ler, kolay ilişkilendirme için bu mesajlarda `runId` olarak onay kimliğini yeniden kullanır.

## Reddedilen onay davranışı

Eşzamansız bir exec onayı reddedildiğinde OpenClaw, ajanın
oturumda aynı komutun daha önceki herhangi bir çalıştırmasından çıktı yeniden kullanmasını engeller. Ret nedeni,
komut çıktısının mevcut olmadığına dair açık yönlendirmeyle birlikte iletilir; bu da
ajanın yeni çıktı varmış gibi davranmasını veya daha önce başarılı olmuş bir çalıştırmadan kalan sonuçlarla
reddedilen komutu yinelemesini durdurur.

## Etkiler

- **full** güçlüdür; mümkün olduğunda allowlist’leri tercih edin.
- **ask**, hızlı onaylara izin verirken sizi de sürecin içinde tutar.
- Ajan başına allowlist’ler, bir ajanın onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili göndericilerden** gelen ana makine exec istekleri için uygulanır. Yetkisiz göndericiler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar.
  Ana makine exec işlemini kesin olarak engellemek için onay güvenliğini `deny` olarak ayarlayın veya araç ilkesi üzerinden `exec` aracını reddedin.

İlgili:

- [Exec aracı](/tr/tools/exec)
- [Elevated modu](/tr/tools/elevated)
- [Skills](/tr/tools/skills)

## İlgili

- [Exec](/tr/tools/exec) — kabuk komutu yürütme aracı
- [Sandboxing](/tr/gateway/sandboxing) — sandbox modları ve çalışma alanı erişimi
- [Security](/tr/gateway/security) — güvenlik modeli ve güçlendirme
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — her biri ne zaman kullanılmalı
