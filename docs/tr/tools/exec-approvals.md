---
read_when:
    - Exec onaylarını veya izin listelerini yapılandırma
    - macOS uygulamasında exec onay UX’ini uygulama
    - Sandbox’tan çıkış istemlerini ve etkilerini gözden geçirme
summary: Exec onayları, izin listeleri ve sandbox’tan çıkış istemleri
title: Exec Onayları
x-i18n:
    generated_at: "2026-04-21T09:06:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Exec Onayları

Exec onayları, sandbox içindeki bir aracının gerçek bir host üzerinde (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / Node host korkuluğudur**. Bunu bir güvenlik kilidi gibi düşünün:
komutlara yalnızca ilke + izin listesi + (isteğe bağlı) kullanıcı onayı birlikte kabul ettiğinde izin verilir.
Exec onayları, araç ilkesi ve elevated geçitlemesine **ek olarak** uygulanır (`elevated` değeri `full` ise onaylar atlanır).
Etkili ilke, `tools.exec.*` ile onay varsayılanlarının **daha katı** olanıdır; bir onay alanı atlanmışsa `tools.exec` değeri kullanılır.
Host exec, o makinedeki yerel onay durumunu da kullanır. Yerel hosttaki
`~/.openclaw/exec-approvals.json` içinde `ask: "always"` olması, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile istem göstermeye devam eder.
İstenen ilkeyi, host ilke kaynaklarını ve etkili sonucu incelemek için
`openclaw approvals get`, `openclaw approvals get --gateway` veya
`openclaw approvals get --node <id|name|ip>` kullanın.
Yerel makine için `openclaw exec-policy show` aynı birleştirilmiş görünümü sunar ve
`openclaw exec-policy set|preset`, yerel istenen ilkeyi
yerel host onay dosyasıyla tek adımda eşzamanlayabilir. Yerel bir kapsam `host=node`
istediğinde, `openclaw exec-policy show`, yerel onay dosyasını etkili doğruluk kaynağı gibi
göstermek yerine bu kapsamı çalışma zamanında node tarafından yönetiliyor olarak raporlar.

Yardımcı uygulama UI’ı **kullanılamıyorsa**, istem gerektiren her istek
**ask fallback** ile çözülür (varsayılan: deny).

Yerel sohbet onay istemcileri, bekleyen onay mesajında kanala özgü kolaylıklar da sunabilir.
Örneğin Matrix, onay istemine reaction kısayolları ekebilir
(`✅` bir kez izin ver, `❌` reddet ve mümkün olduğunda `♾️` her zaman izin ver)
ve yine de yedek olarak mesaj içinde `/approve ...` komutlarını bırakır.

## Nerede uygulanır

Exec onayları, yürütme host’unda yerel olarak uygulanır:

- **Gateway host** → Gateway makinesindeki `openclaw` süreci
- **Node host** → node runner (macOS yardımcı uygulaması veya başsız node host)

Güven modeli notu:

- Gateway auth ile doğrulanmış çağıranlar, bu Gateway için güvenilir operatörlerdir.
- Eşlenmiş node’lar, bu güvenilir operatör yeteneğini node host’a genişletir.
- Exec onayları, kazara yürütme riskini azaltır, ancak kullanıcı başına bir auth sınırı değildir.
- Onaylanmış node-host çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, mevcutsa env
  bağlaması ve uygunsa sabitlenmiş çalıştırılabilir dosya yolu.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca
  tek bir somut yerel dosya işlenenini bağlamaya çalışır. Bu bağlanan dosya onaydan sonra ama yürütmeden önce değişirse,
  kaymış içeriği yürütmek yerine çalıştırma reddedilir.
- Bu dosya bağlaması bilerek en iyi çaba düzeyindedir, her
  yorumlayıcı/çalışma zamanı yükleyici yolunun tam anlamsal modeli değildir. Onay modu bağlanacak tam olarak bir somut yerel
  dosya belirleyemezse, tam kapsam varmış gibi davranmak yerine onay destekli çalıştırma vermeyi reddeder.

macOS ayrımı:

- **node host hizmeti**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulamasına** iletir.
- **macOS uygulaması**, UI bağlamında onayları uygular + komutu yürütür.

## Ayarlar ve depolama

Onaylar, yürütme host’undaki yerel bir JSON dosyasında yaşar:

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

Host exec’in onay istemleri olmadan çalışmasını istiyorsanız, **iki** ilke katmanını da açmanız gerekir:

- OpenClaw yapılandırmasındaki istenen exec ilkesi (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json` içindeki host-yerel onay ilkesi

Siz açıkça sıkılaştırmadıkça bu artık varsayılan host davranışıdır:

- `tools.exec.security`: `gateway`/`node` üzerinde `full`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Önemli ayrım:

- `tools.exec.host=auto`, exec’in nerede çalışacağını seçer: mümkünse sandbox, değilse Gateway.
- YOLO, host exec’in nasıl onaylanacağını seçer: `security=full` artı `ask=off`.
- YOLO modunda OpenClaw, yapılandırılmış host exec ilkesi üzerine ayrı bir sezgisel komut gizleme onay geçidi veya script-preflight reddetme katmanı eklemez.
- `auto`, sandbox içindeki bir oturumdan Gateway yönlendirmesini ücretsiz bir geçersiz kılma hâline getirmez. Çağrı başına `host=node` isteğine `auto` içinden izin verilir ve `host=gateway` yalnızca etkin bir sandbox çalışma zamanı yoksa `auto` içinden izin alır. Kararlı, auto olmayan bir varsayılan istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` değerini açıkça kullanın.

Daha muhafazakâr bir kurulum istiyorsanız, katmanlardan birini `allowlist` / `on-miss`
veya `deny` değerine geri sıkılaştırın.

Kalıcı Gateway-host “asla istem gösterme” kurulumu:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ardından host onay dosyasını buna uyacak şekilde ayarlayın:

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

Geçerli makinede aynı Gateway-host ilkesi için yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol şunların ikisini de günceller:

- yerel `tools.exec.host/security/ask`
- yerel `~/.openclaw/exec-approvals.json` varsayılanları

Bu bilerek yalnızca yerlidir. Gateway-host veya node-host onaylarını uzaktan değiştirmeniz gerekiyorsa,
`openclaw approvals set --gateway` veya
`openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

Bir node host için, aynı onay dosyasını bunun yerine o node üzerinde uygulayın:

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
- node exec onayları çalışma zamanında node’dan alınır; bu nedenle node hedefli güncellemeler `openclaw approvals --node ...` kullanmalıdır

Yalnızca oturum kısayolu:

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, o oturum için exec onaylarını da atlayan bir break-glass kısayoludur.

Host onay dosyası yapılandırmadan daha katı kalırsa, daha katı host ilkesi yine kazanır.

## İlke düğmeleri

### Güvenlik (`exec.security`)

- **deny**: tüm host exec isteklerini engelle.
- **allowlist**: yalnızca izin listesine alınmış komutlara izin ver.
- **full**: her şeye izin ver (elevated ile eşdeğer).

### Ask (`exec.ask`)

- **off**: asla istem gösterme.
- **on-miss**: yalnızca izin listesi eşleşmediğinde istem göster.
- **always**: her komutta istem göster.
- Etkili ask modu `always` olduğunda `allow-always` kalıcı güven yeni istemleri bastırmaz

### Ask fallback (`askFallback`)

İstem gerekiyorsa ama hiçbir UI erişilebilir değilse fallback karar verir:

- **deny**: engelle.
- **allowlist**: yalnızca izin listesi eşleşirse izin ver.
- **full**: izin ver.

### Satır içi yorumlayıcı eval sertleştirmesi (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` olduğunda, OpenClaw satır içi kod-eval biçimlerini, yorumlayıcı ikili dosyasının kendisi izin listesinde olsa bile yalnızca onay ile çalışabilir olarak ele alır.

Örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Bu, tek bir kararlı dosya işlenenine temiz biçimde eşlenmeyen yorumlayıcı yükleyicileri için katmanlı savunmadır. Katı modda:

- bu komutlar yine de açık onay gerektirir;
- `allow-always`, bunlar için yeni izin listesi girdilerini otomatik olarak kalıcılaştırmaz.

## İzin listesi (aracı başına)

İzin listeleri **aracı başınadır**. Birden fazla aracı varsa, macOS uygulamasında
düzenlediğiniz aracıyı değiştirin. Örüntüler **büyük/küçük harfe duyarsız glob eşleşmeleri**dir.
Örüntüler **ikili dosya yollarına** çözülmelidir (yalnızca basename girişleri yok sayılır).
Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi kabuk zincirlerinde, yine de her üst düzey parçanın izin listesi kurallarını karşılaması gerekir.

Örnekler:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her izin listesi girdisi şunları izler:

- **id** UI kimliği için kullanılan kararlı UUID (isteğe bağlı)
- **last used** zaman damgası
- **last used command**
- **last resolved path**

## Skill CLI’lerini otomatik izin verme

**Auto-allow skill CLIs** etkin olduğunda, bilinen Skills tarafından başvurulan çalıştırılabilir dosyalar
node’larda (macOS node veya başsız node host) izin listesinde kabul edilir. Bu,
Skill bin listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Katı manuel izin listeleri istiyorsanız bunu devre dışı bırakın.

Önemli güven notları:

- Bu, manuel yol izin listesi girdilerinden ayrı **örtük bir kolaylık izin listesi**dir.
- Gateway ve node aynı güven sınırı içindeyken, güvenilir operatör ortamları için tasarlanmıştır.
- Katı açık güven istiyorsanız, `autoAllowSkills: false` olarak bırakın ve yalnızca manuel yol izin listesi girdilerini kullanın.

## Güvenli ikili dosyalar (yalnızca stdin)

`tools.exec.safeBins`, açık izin listesi girdileri olmadan **yalnızca stdin** ikili dosyalarının (örneğin `cut`)
`allowlist` modunda çalışabileceği küçük bir liste tanımlar. Güvenli ikili dosyalar
konumsal dosya argümanlarını ve yol benzeri token’ları reddeder; dolayısıyla yalnızca gelen akış üzerinde çalışabilirler.
Bunu genel güven listesi değil, akış filtreleri için dar bir hızlı yol olarak değerlendirin.
Yorumlayıcı veya çalışma zamanı ikili dosyalarını (örneğin `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`)
`safeBins` listesine **eklemeyin**.
Bir komut tasarım gereği kod değerlendirebiliyor, alt komut çalıştırabiliyor veya dosya okuyabiliyorsa, açık izin listesi girdilerini tercih edin ve onay istemlerini etkin tutun.
Özel güvenli ikili dosyalar `tools.exec.safeBinProfiles.<bin>` içinde açık bir profil tanımlamalıdır.
Doğrulama yalnızca argv biçiminden deterministik olarak yapılır (host dosya sistemi varlık denetimleri yoktur); bu da
izin ver/reddet farklarından doğabilecek dosya varlığı oracle davranışını önler.
Varsayılan güvenli ikili dosyalar için dosya odaklı seçenekler reddedilir (örneğin `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Güvenli ikili dosyalar ayrıca, yalnızca stdin
davranışını bozan seçenekler için açık ikili dosya başına bayrak ilkesi uygular (örneğin `sort -o/--output/--compress-program` ve grep özyinelemeli bayraklar).
Uzun seçenekler, safe-bin modunda fail-closed olarak doğrulanır: bilinmeyen bayraklar ve belirsiz
kısaltmalar reddedilir.
Safe-bin profiline göre reddedilen bayraklar:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Güvenli ikili dosyalar ayrıca argv token’larını yürütme anında **düz metin** olarak ele almaya zorlar (stdin-only parçalar için globbing
ve `$VARS` genişletmesi yoktur); böylece `*` veya `$HOME/...` gibi örüntüler
dosya okumayı gizlice sokmak için kullanılamaz.
Güvenli ikili dosyalar ayrıca güvenilir ikili dosya dizinlerinden çözülmelidir (sistem varsayılanları artı isteğe bağlı
`tools.exec.safeBinTrustedDirs`). `PATH` girdileri asla otomatik güvenilir sayılmaz.
Varsayılan güvenilir safe-bin dizinleri bilerek en aza indirilmiştir: `/bin`, `/usr/bin`.
Safe-bin çalıştırılabilir dosyanız paket yöneticisi/kullanıcı yollarında yaşıyorsa (örneğin
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), bunları açıkça
`tools.exec.safeBinTrustedDirs` içine ekleyin.
Kabuk zincirleme ve yönlendirmelere allowlist modunda otomatik izin verilmez.

Kabuk zincirleme (`&&`, `||`, `;`), her üst düzey parçanın izin listesini karşıladığı durumda
(benzer şekilde safe bins veya Skill otomatik izin verme dâhil) izinlidir. Yönlendirmeler allowlist modunda desteklenmez.
Komut ikamesi (`$()` / ters tırnaklar), çift tırnak içinde olanlar da dâhil olmak üzere
allowlist ayrıştırması sırasında reddedilir; düz `$()` metnine ihtiyacınız varsa tek tırnak kullanın.
macOS yardımcı uygulama onaylarında, kabuk denetim veya genişletme söz dizimi
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) içeren ham kabuk metni,
kabuk ikili dosyasının kendisi izin listesinde değilse izin listesi ıskası olarak değerlendirilir.
Kabuk sarmalayıcıları için (`bash|sh|zsh ... -c/-lc`), istek kapsamlı env geçersiz kılmaları
küçük bir açık izin listesine düşürülür (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Allowlist modunda allow-always kararları için, bilinen dispatch sarmalayıcıları
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sarmalayıcı yolları yerine iç çalıştırılabilir yollarını kalıcılaştırır.
Kabuk çoklayıcıları (`busybox`, `toybox`) da shell applet’ler (`sh`, `ash`,
vb.) için açılır; böylece çoklayıcı ikili dosyaları yerine iç çalıştırılabilir dosyalar kalıcılaştırılır. Bir sarmalayıcı veya
çoklayıcı güvenle açılamazsa, hiçbir allowlist girdisi otomatik olarak kalıcılaştırılmaz.
`python3` veya `node` gibi yorumlayıcıları izin listesine alıyorsanız, satır içi eval’in hâlâ açık onay gerektirmesi için `tools.exec.strictInlineEval=true` tercih edin. Katı modda `allow-always` yine de zararsız yorumlayıcı/script çağrılarını kalıcılaştırabilir, ancak satır içi eval taşıyıcıları otomatik olarak kalıcılaştırılmaz.

Varsayılan safe bins:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` ve `sort` varsayılan listede değildir. Bunları açıkça dahil ederseniz,
stdin dışı iş akışları için açık allowlist girdileri tutun.
`grep` için safe-bin modunda kalıbı `-e`/`--regexp` ile sağlayın; konumsal kalıp biçimi
reddedilir, böylece dosya işlenenleri belirsiz konumsallar olarak gizlice geçirilemez.

### Safe bins ile allowlist karşılaştırması

| Konu             | `tools.exec.safeBins`                                 | Allowlist (`exec-approvals.json`)                           |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Amaç             | Dar stdin filtrelerine otomatik izin verme            | Belirli çalıştırılabilir dosyalara açıkça güvenme           |
| Eşleşme türü     | Çalıştırılabilir adı + safe-bin argv ilkesi           | Çözümlenmiş çalıştırılabilir yol glob örüntüsü              |
| Argüman kapsamı  | Safe-bin profili ve literal-token kurallarıyla kısıtlı | Yalnızca yol eşleşmesi; argümanlar aksi halde sizin sorumluluğunuzdadır |
| Tipik örnekler   | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, özel CLI’ler             |
| En iyi kullanım  | Pipeline içindeki düşük riskli metin dönüşümleri      | Daha geniş davranışı veya yan etkileri olan her araç        |

Yapılandırma konumu:

- `safeBins`, yapılandırmadan gelir (`tools.exec.safeBins` veya aracı başına `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs`, yapılandırmadan gelir (`tools.exec.safeBinTrustedDirs` veya aracı başına `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles`, yapılandırmadan gelir (`tools.exec.safeBinProfiles` veya aracı başına `agents.list[].tools.exec.safeBinProfiles`). Aracı başına profil anahtarları genel anahtarları geçersiz kılar.
- allowlist girdileri, host-yerel `~/.openclaw/exec-approvals.json` içinde `agents.<id>.allowlist` altında yaşar (veya Control UI / `openclaw approvals allowlist ...` aracılığıyla).
- `openclaw security audit`, yorumlayıcı/çalışma zamanı ikili dosyaları açık profiller olmadan `safeBins` içinde göründüğünde `tools.exec.safe_bins_interpreter_unprofiled` uyarısı verir.
- `openclaw doctor --fix`, eksik özel `safeBinProfiles.<bin>` girdilerini `{}` olarak iskeletleyebilir (sonrasında gözden geçirip sıkılaştırın). Yorumlayıcı/çalışma zamanı ikili dosyaları otomatik iskeletlenmez.

Özel profil örneği:
__OC_I18N_900005__
`jq` değerini açıkça `safeBins` içine alırsanız, OpenClaw safe-bin
modunda yine de `env` built-in’ini reddeder; böylece `jq -n env`, açık bir allowlist yolu
veya onay istemi olmadan host süreç ortamını dökemez.

## Control UI düzenleme

Varsayılanları, aracı başına
geçersiz kılmaları ve allowlist’leri düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir aracı), ilkeyi ayarlayın,
allowlist örüntülerini ekleyin/kaldırın, sonra **Kaydet**’e basın. UI, listeyi düzenli tutabilmeniz için
örüntü başına **son kullanım** meta verisini gösterir.

Hedef seçici **Gateway**’i (yerel onaylar) veya bir **Node**’u seçer. Node’ların
`system.execApprovals.get/set` ilan etmesi gerekir (macOS uygulaması veya başsız node host).
Bir node henüz exec onayları ilan etmiyorsa, kendi yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, Gateway veya node düzenlemeyi destekler (bkz. [Approvals CLI](/cli/approvals)).

## Onay akışı

İstem gerektiğinde Gateway, operatör istemcilerine `exec.approval.requested` yayını yapar.
Control UI ve macOS uygulaması bunu `exec.approval.resolve` ile çözer, ardından Gateway
onaylanmış isteği node host’a iletir.

`host=node` için onay istekleri, kanonik bir `systemRunPlan` payload’ı içerir. Gateway,
onaylanmış `system.run` isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, eşzamansız onay gecikmesi için önemlidir:

- node exec yolu baştan tek bir kanonik plan hazırlar
- onay kaydı bu planı ve bağlama meta verisini saklar
- onaylandıktan sonra iletilen son `system.run` çağrısı, sonraki çağıran düzenlemelerine güvenmek yerine
  saklanan planı yeniden kullanır
- çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya
  `sessionKey` değerlerini değiştirirse, Gateway iletilen
  çalıştırmayı onay uyumsuzluğu olarak reddeder

## Yorumlayıcı/çalışma zamanı komutları

Onay destekli yorumlayıcı/çalışma zamanı çalıştırmaları bilerek muhafazakârdır:

- Tam argv/cwd/env bağlamı her zaman bağlanır.
- Doğrudan kabuk betiği ve doğrudan çalışma zamanı dosya biçimleri, tek bir somut yerel
  dosya snapshot’ına bağlanmak için en iyi çaba ile işlenir.
- Hâlâ tek bir doğrudan yerel dosyaya çözümlenen yaygın paket yöneticisi sarmalayıcı biçimleri (örneğin
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) bağlamadan önce açılır.
- OpenClaw bir yorumlayıcı/çalışma zamanı komutu için tam olarak tek bir somut yerel dosya
  belirleyemezse (örneğin paket script’leri, eval biçimleri, çalışma zamanına özgü yükleyici zincirleri veya belirsiz çoklu dosya
  biçimleri), anlamsal kapsam varmış gibi iddia etmek yerine onay destekli yürütme reddedilir.
- Bu iş akışları için sandboxing, ayrı bir host sınırı veya operatörün daha geniş çalışma zamanı semantiğini kabul ettiği
  açık güvenilir allowlist/full iş akışını tercih edin.

Onaylar gerektiğinde, exec aracı bir onay kimliğiyle hemen döner. Daha sonraki sistem olaylarını
(`Exec finished` / `Exec denied`) ilişkilendirmek için bu kimliği kullanın. Zaman aşımından önce
karar gelmezse, istek onay zaman aşımı olarak değerlendirilir ve ret nedeni olarak gösterilir.

### Sonraki teslim davranışı

Onaylanmış eşzamansız bir exec bittikten sonra OpenClaw, aynı oturuma bir takip `agent` turu gönderir.

- Geçerli bir harici teslim hedefi varsa (teslim edilebilir kanal artı hedef `to`), takip teslimi o kanalı kullanır.
- Harici hedefi olmayan yalnızca webchat veya iç oturum akışlarında, takip teslimi yalnızca oturum içi kalır (`deliver: false`).
- Bir çağıran çözümlenebilir harici kanal olmadan açıkça katı harici teslim isterse, istek `INVALID_REQUEST` ile başarısız olur.
- `bestEffortDeliver` etkinse ve harici kanal çözümlenemiyorsa, teslim başarısız olmak yerine yalnızca oturuma düşürülür.

Onay iletişim kutusu şunları içerir:

- komut + argümanlar
- cwd
- aracı kimliği
- çözümlenmiş çalıştırılabilir yol
- host + ilke meta verisi

Eylemler:

- **Allow once** → şimdi çalıştır
- **Always allow** → allowlist’e ekle + çalıştır
- **Deny** → engelle

## Sohbet kanallarına onay iletme

Exec onay istemlerini herhangi bir sohbet kanalına (Plugin kanalları dâhil) iletebilir ve
bunları `/approve` ile onaylayabilirsiniz. Bu, normal giden teslim hattını kullanır.

Yapılandırma:
__OC_I18N_900006__
Sohbette yanıt verin:
__OC_I18N_900007__
`/approve` komutu hem exec onaylarını hem de Plugin onaylarını işler. Kimlik bekleyen bir exec onayıyla eşleşmezse, bunun yerine otomatik olarak Plugin onaylarını denetler.

### Plugin onayı iletme

Plugin onayı iletme, exec onaylarıyla aynı teslim hattını kullanır ancak
`approvals.plugin` altında kendi bağımsız yapılandırmasına sahiptir. Bunlardan birini etkinleştirmek veya devre dışı bırakmak diğerini etkilemez.
__OC_I18N_900008__
Yapılandırma biçimi `approvals.exec` ile aynıdır: `enabled`, `mode`, `agentFilter`,
`sessionFilter` ve `targets` aynı şekilde çalışır.

Paylaşılan etkileşimli yanıtları destekleyen kanallar, hem exec hem de
Plugin onayları için aynı onay düğmelerini gösterir. Paylaşılan etkileşimli UI olmayan kanallar,
`/approve` yönergeleri içeren düz metne düşer.

### Her kanalda aynı sohbetten onay

Bir exec veya Plugin onay isteği teslim edilebilir bir sohbet yüzeyinden geldiğinde, aynı sohbet
artık varsayılan olarak bunu `/approve` ile onaylayabilir. Bu, mevcut Web UI ve terminal UI akışlarına ek olarak
Slack, Matrix ve Microsoft Teams gibi kanallar için de geçerlidir.

Bu paylaşılan metin-komutu yolu, o konuşma için normal kanal auth modelini kullanır. Başlangıçtaki
sohbet zaten komut gönderebiliyor ve yanıt alabiliyorsa, onay isteklerinin artık
beklemede kalmak için ayrı bir yerel teslim adaptörüne ihtiyacı yoktur.

Discord ve Telegram da aynı sohbetten `/approve` desteği sunar, ancak bu kanallar
yerel onay teslimi devre dışı olsa bile yetkilendirme için hâlâ
çözümlenmiş approver listesini kullanır.

Gateway’i doğrudan çağıran Telegram ve diğer yerel onay istemcileri için,
bu fallback bilerek “approval not found” hatalarıyla sınırlıdır. Gerçek bir
exec onayı reddi/hatası sessizce Plugin onayı olarak yeniden denenmez.

### Yerel onay teslimi

Bazı kanallar yerel onay istemcileri olarak da davranabilir. Yerel istemciler, paylaşılan aynı sohbetten `/approve`
akışının üzerine approver DM’leri, kaynak sohbet fanout’u ve kanala özgü etkileşimli onay UX’i ekler.

Yerel onay kartları/düğmeleri mevcut olduğunda, bu yerel UI aracıya dönük birincil yoldur. Araç sonucu sohbet onaylarının kullanılamadığını veya
tek kalan yolun manuel onay olduğunu söylemedikçe, aracı ayrıca yinelenen düz sohbet
`/approve` komutunu tekrar etmemelidir.

Genel model:

- host exec ilkesi, exec onayının gerekip gerekmediğine yine karar verir
- `approvals.exec`, onay istemlerinin diğer sohbet hedeflerine iletilmesini denetler
- `channels.<channel>.execApprovals`, o kanalın yerel onay istemcisi olarak davranıp davranmadığını denetler

Yerel onay istemcileri, şu koşulların tümü doğru olduğunda DM-first teslimi otomatik etkinleştirir:

- kanal yerel onay teslimini destekliyorsa
- approver’lar açık `execApprovals.approvers` değerinden veya o
  kanalın belgelenmiş fallback kaynaklarından çözümlenebiliyorsa
- `channels.<channel>.execApprovals.enabled` ayarlanmamışsa veya `"auto"` ise

Bir yerel onay istemcisini açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Approver’lar çözümlendiğinde
zorla açmak için `enabled: true` ayarlayın. Herkese açık kaynak sohbet teslimi ise
`channels.<channel>.execApprovals.target` üzerinden açık kalır.

SSS: [Sohbet onayları için neden iki exec onay yapılandırması var?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Bu yerel onay istemcileri, paylaşılan aynı sohbetten `/approve` akışı ve paylaşılan onay düğmeleri üzerine
DM yönlendirme ve isteğe bağlı kanal fanout ekler.

Paylaşılan davranış:

- Slack, Matrix, Microsoft Teams ve benzeri teslim edilebilir sohbetler, aynı sohbetten `/approve` için normal kanal auth modelini kullanır
- yerel bir onay istemcisi otomatik etkinleştiğinde, varsayılan yerel teslim hedefi approver DM’leridir
- Discord ve Telegram için yalnızca çözümlenen approver’lar onaylayabilir veya reddedebilir
- Discord approver’ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Telegram approver’ları açık olabilir (`execApprovals.approvers`) veya mevcut sahip yapılandırmasından çıkarılabilir (`allowFrom`, ayrıca desteklenen yerlerde doğrudan mesaj `defaultTo`)
- Slack approver’ları açık olabilir (`execApprovals.approvers`) veya `commands.ownerAllowFrom` değerinden çıkarılabilir
- Slack yerel düğmeleri onay kimliği türünü korur; böylece `plugin:` kimlikleri ikinci bir Slack-yerel fallback katmanı olmadan Plugin onaylarını çözebilir
- Matrix yerel DM/kanal yönlendirmesi ve reaction kısayolları hem exec hem de Plugin onaylarını işler;
  Plugin yetkilendirmesi yine `channels.matrix.dm.allowFrom` üzerinden gelir
- istekte bulunan kişinin approver olması gerekmez
- kaynağın olduğu sohbet zaten komutları ve yanıtları destekliyorsa, o sohbet doğrudan `/approve` ile onaylayabilir
- yerel Discord onay düğmeleri onay kimliği türüne göre yönlendirir: `plugin:` kimlikleri doğrudan Plugin onaylarına gider, diğer her şey exec onaylarına gider
- yerel Telegram onay düğmeleri, `/approve` ile aynı sınırlı exec-to-plugin fallback yolunu izler
- yerel `target` kaynak sohbet teslimini etkinleştirdiğinde, onay istemleri komut metnini içerir
- bekleyen exec onayları varsayılan olarak 30 dakika sonra sona erer
- hiçbir operatör UI’ı veya yapılandırılmış onay istemcisi isteği kabul edemiyorsa, istem `askFallback` değerine düşer

Telegram varsayılan olarak approver DM’lerini kullanır (`target: "dm"`). Onay istemlerinin
kaynak Telegram sohbetinde/konusunda da görünmesini istediğinizde bunu `channel` veya `both` olarak değiştirebilirsiniz. Telegram forum
konuları için OpenClaw, onay istemi ve onay sonrası takip için konuyu korur.

Bkz.:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### macOS IPC akışı
__OC_I18N_900009__
Güvenlik notları:

- Unix socket modu `0600`, token `exec-approvals.json` içinde saklanır.
- Aynı UID eş denetimi.
- Challenge/response (nonce + HMAC token + istek özeti) + kısa TTL.

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut running bildirim eşiğini aşarsa)
- `Exec finished`
- `Exec denied`

Bunlar, node olayı bildirdikten sonra aracının oturumuna gönderilir.
Gateway-host exec onayları da komut bittiğinde (ve isteğe bağlı olarak eşikten uzun sürdüğünde) aynı yaşam döngüsü olaylarını yayar.
Onay geçitli exec’ler, kolay ilişkilendirme için bu mesajlarda onay kimliğini `runId` olarak yeniden kullanır.

## Reddedilen onay davranışı

Eşzamansız bir exec onayı reddedildiğinde, OpenClaw aracının oturumdaki aynı komutun
önceki herhangi bir çalıştırmasından gelen çıktıyı yeniden kullanmasını engeller. Ret nedeni,
komut çıktısı bulunmadığına dair açık yönlendirmeyle iletilir; bu da
aracının yeni çıktı varmış gibi davranmasını veya daha önceki başarılı bir çalıştırmadan kalan eski sonuçlarla
reddedilen komutu tekrar etmesini durdurur.

## Etkiler

- **full** güçlüdür; mümkünse allowlist tercih edin.
- **ask**, hızlı onaylara izin verirken sizi döngü içinde tutar.
- Aracı başına allowlist’ler, bir aracının onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili göndericilerden** gelen host exec isteklerine uygulanır. Yetkisiz göndericiler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar.
  Host exec’i kesin olarak engellemek için onay güvenliğini `deny` yapın veya araç ilkesiyle `exec` aracını reddedin.

İlgili:

- [Exec tool](/tr/tools/exec)
- [Elevated mode](/tr/tools/elevated)
- [Skills](/tr/tools/skills)

## İlgili

- [Exec](/tr/tools/exec) — kabuk komutu yürütme aracı
- [Sandboxing](/tr/gateway/sandboxing) — sandbox kipleri ve çalışma alanı erişimi
- [Security](/tr/gateway/security) — güvenlik modeli ve sertleştirme
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) — her biri ne zaman kullanılmalı
