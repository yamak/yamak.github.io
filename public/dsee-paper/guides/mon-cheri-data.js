'use strict';
window.GUIDE = {
  "id": "paper-04",
  "title": "Mon CHÉRI",
  "fullTitle": "Mon CHÉRI: Mitigating Uninitialized Memory Access with Conditional Capabilities",
  "subtitle": "Bir işaretçi doğru nesneyi gösteriyor olabilir. Peki o nesneye daha önce gerçekten yazıldı mı?",
  "authors": "Merve Gülmez · Håkan Englund · Jan Tobias Mühlberg · Thomas Nyman",
  "venue": "IEEE S&P 2025",
  "minutes": 45,
  "pdf": "../papers/04-mon-cheri-mitigating-uninitialized-memory-access-with-conditional-capabilities.pdf",
  "overview": {
    "name": "Mon CHÉRI",
    "thesis": "Belleğe erişim yetkisini yalnız adres ve izinlere değil, daha önce yapılmış işlemlere de bağlamak.",
    "problem": "C/C++ programı bir değişken için yer ayırdığında bellekte eski içerik bulunabilir. Değer atanmadan okunan bu içerik bir anahtarın parçasını sızdırabilir veya programın kararlarını bozabilir. İşaretçinin nesne sınırları içinde olması bu hatayı önlemez.",
    "gap": "CHERI capability’leri erişimin hangi nesneye ve hangi izinle yapılabildiğini sınırlar. Fakat okunabilir bir nesnenin başlatılmış olup olmadığını normal izin bitlerinden anlayamaz. Derleyici uyarıları da her yürütme yolundaki başlatılma durumunu kesin olarak çözemez.",
    "solution": "Yazarlar conditional capability modelini önerir. Write-before-Read politikasında bir operation bound, yazılmış önekin sonunu takip eder; henüz bu öneke katılmamış bölgeden okuma donanım hatası üretir. Derleyici ve bellek ayırıcı bu durumu taşıyan capability’leri doğru üretip günceller.",
    "example": "Bir paket için 8 bayt ayırdığını düşün. İlk 4 baytı doldurup 8 baytı birden göndermek, kalan eski içeriği açığa çıkarabilir. Öğretici modelde ilk dört bayt okunabilir; beşinci baytı okumak ise Write-before-Read denetimine takılır.",
    "contribution": "Katkı, geçmiş işlemlere bağlı izinleri CHERI-RISC-V’ye eklemek ve bunun için donanım, LLVM dönüşümleri ve allocator desteğini birlikte geliştirmektir. QEMU işlevsel testleri ve FPGA deneyleri aynı tasarımın farklı yönlerini değerlendirir.",
    "takeaway": "Nesneye erişim yetkisi ile nesnenin okunmaya hazır olması iki ayrı koşuldur.",
    "limit": "Prototip sıralı başlatılabilen önek modeline dayanır; alias güncellemeleri ve fonksiyonlar arası aktarım ek dikkat gerektirir. Juliet başarısı bütün C/C++ programları için eksiksiz tespit garantisi değildir.",
    "route": [
      "Açık: sınırlar içinde başlatılmamış okuma",
      "Fikir: geçmiş işleme bağlı izin",
      "Sonuç: donanım + derleyici + allocator"
    ],
    "page": 1
  },
  "sections": [
    {
      "id": "problem",
      "title": "1. Sınırlar içinde kalan bir bellek hatası",
      "kicker": "TEMEL FİKİR",
      "page": 1,
      "lead": "Bir adres geçerli olabilir; o adresteki değeri okumak yine de hatalı olabilir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Başlatılmamış değer</h3><p><code>int x;</code> bir alan ayırır, fakat C dilinde okunabilir anlamlı bir değer atandığını göstermez. Eski yığın veya heap içeriği yeni nesneyle karıştırılabilir. Koşullu bir atama bazı yürütme yollarında hiç çalışmayabilir.</p></div><div class=\"card\"><h3>CHERI’nin sağladığı ve eksik kalan bilgi</h3><p>Capability nesne sınırlarını, izinleri ve geçerliliği taşır. Nesnenin içindeki bir adres bu denetimleri geçebilir. Başlatılma geçmişi ayrıca tutulmadığında okuma henüz yazılmamış içeriğe ulaşabilir.</p></div></div><div class=\"callout\">Makale bir taşma savunmasının yerine geçmez; mevcut CHERI denetimlerine yeni bir koşul ekler.</div>"
    },
    {
      "id": "policy",
      "title": "2. İzinleri geçmiş işleme bağlamak",
      "kicker": "KOŞULLU YETKİ",
      "page": 4,
      "lead": "Conditional permission, bir işlem gerçekleşmeden başka bir işlemin yetkisini açmaz.",
      "html": "<p>Write-before-Read (WbR), belleğin okunabilmesi için önce yazılmasını ister. Erişim hem geleneksel capability izinlerinden hem de koşullu denetimden geçmelidir. WbR koşulunun sağlanması, temel capability’de bulunmayan okuma yetkisini kendiliğinden üretmez.</p><div class=\"table-wrap\"><table><thead><tr><th>Politika</th><th>İlke</th><th>Olası kullanım</th></tr></thead><tbody><tr><td>Write-before-Read</td><td>Önce yaz, sonra oku</td><td>Başlatılmamış veri erişimi</td></tr><tr><td>Write-before-Execute</td><td>Önce yaz, sonra yürüt</td><td>Üretilen kod tamponu</td></tr><tr><td>Write-Once</td><td>Bir kez yazılabilen alan</td><td>Tek seferlik yapılandırma</td></tr><tr><td>Execute-Once</td><td>Bir kez yürütülebilen alan</td><td>Başlangıç kodu</td></tr></tbody></table></div><div class=\"callout\">Tablo 1 kavramsal politika ailesini verir. Bütün politika örneklerinin aynı uygulama testleriyle veya aynı prototip kapsamıyla doğrulandığını varsayma.</div>"
    },
    {
      "id": "bounds",
      "title": "3. LB, OB ve UB: iki sınır yerine üç işaret",
      "kicker": "MEKANİZMA",
      "page": 4,
      "lead": "Operation bound, yazılmış kesintisiz önekin nerede bittiğini anlatır.",
      "html": "<p>Nesne alt sınırı LB ve üst sınırı UB arasında kalır. Yeni WbR tahsisinde OB başlangıca eşittir. Uygun, OB’ye bitişik store işlemleri öneki genişletir. Okuma, normal nesne sınırlarına ek olarak bu okunabilir alanın içinde kalmalıdır. Aşağıdaki model yarı açık aralıklar kullanır; gerçek capability kodlamasının bit düzeyindeki karşılığı değildir.</p><div class=\"lab\"><div class=\"lab-header\"><h3>8 baytlık tamponu adım adım başlat</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><div id=\"mon-memory\" class=\"stage-nodes\"></div><div class=\"state-box\" id=\"mon-bound-out\" aria-live=\"polite\"></div><div class=\"controls\"><button type=\"button\" class=\"small-button\" id=\"mon-write\">Sonraki baytı yaz</button><button type=\"button\" class=\"small-button\" id=\"mon-read\">OB adresini oku</button><button type=\"button\" class=\"small-button\" id=\"mon-reset\">Sıfırla</button></div></div></div>"
    },
    {
      "id": "sequence",
      "title": "4. Ortadaki boşluğu tek bir sınır anlatamaz",
      "kicker": "SIRALI BAŞLATMA",
      "page": 14,
      "lead": "Bir operation bound, her bayt için bağımsız başlatılma biti tutan bir harita değildir.",
      "html": "<p>Bir yapının son alanına önce yazıp ilk alanını boş bırakırsan, yalnız bir önek sınırıyla bu parçalı durumu ifade edemezsin. Aradaki boşluk okunabilir ilan edilemez. Prototipin sıralı yazma varsayımı, alanları farklı sırayla başlatan yapılar ve padding için yazılım düzenlemelerini gerekli kılabilir.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Boşluk bırakan yazmayı incele</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"mon-pattern\">Başlatma düzeni</label><select id=\"mon-pattern\"><option value=\"prefix\">0, 1, 2, 3 sırasıyla yaz</option><option value=\"gap\">Önce yalnız 4. bayta yaz</option><option value=\"zero\">Önce bütün alanı memset ile başlat</option></select><div class=\"state-box\" id=\"mon-pattern-out\" aria-live=\"polite\"></div></div></div><div class=\"callout\">Makale bitmap veya shadow memory ile parçalı izlemeyi alternatif olarak tartışır; bunu mevcut prototipin özelliği gibi okumamak gerekir.</div>"
    },
    {
      "id": "compiler",
      "title": "5. Donanımın görmesi gereken capability’yi üretmek",
      "kicker": "DERLEYİCİ",
      "page": 5,
      "lead": "Doğru denetim, doğru işaretçinin doğru yaşam döngüsüyle kullanılmasına bağlıdır.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Politikayı etkinleştirme</h3><p>Derleyici seçeneği WbR’yi yığın değişkenlerine uygular. Fonksiyon ve değişken öznitelikleri daha seçici kullanım sağlar. LLVM pass’i gerekli capability’lere sınır ve başlangıç operation bound işlemleri ekler.</p></div><div class=\"card\"><h3>Gereksiz enstrümantasyonu azaltma</h3><p>Statik olarak okuma öncesi tamamen başlatıldığı gösterilen değişkenlerde WbR eklememek mümkündür. Bu bir optimizasyondur; belirsiz bütün durumları statik olarak çözmüş olmayı gerektirmez.</p></div></div><p>İşlemci tarafında yeni komut desteği, operand çözümleme, store sırasında sınır güncellemesi ve load sırasında koşul denetimi birlikte gerekir. Yalnız C kaynak koduna bir etiket eklemek donanım koruması sağlamaz.</p>"
    },
    {
      "id": "alias",
      "title": "6. Aynı nesne, eskimiş iki capability",
      "kicker": "STORE LINEARIZATION",
      "page": 8,
      "lead": "Store işlemi capability durumunu değiştirince işaretçi kopyaları sıradan değişmez adresler gibi davranamaz.",
      "html": "<p>Derleyicinin aynı tahsis için ürettiği farklı capability değerleri farklı operation bound durumları taşıyabilir. Bir store’dan sonra daha eski capability ile load yapmak, başlatılmış bir alanı hâlâ başlatılmamış gösterebilir. Store linearization, güncel capability değerini sonraki kullanımlara ve kontrol akışı birleşmelerine taşımaya çalışır.</p><div class=\"lab\"><div class=\"lab-header\"><h3>Güncel sınır hangi kopyada?</h3><p>Öğretici model; donanım emülasyonu veya ölçüm değildir.</p></div><div class=\"lab-body\"><label for=\"mon-alias\">Okumada kullanılan capability</label><select id=\"mon-alias\"><option value=\"fresh\">Yazmadan sonraki güncel capability</option><option value=\"stale\">Yazmadan önceki eski kopya</option></select><div class=\"state-box\" id=\"mon-alias-out\" aria-live=\"polite\"></div></div></div><div class=\"callout\">Bu demo derleyicinin capability kopyaları arasındaki durum aktarımını açıklar. Her alias’ın donanım tarafından otomatik ve küresel olarak güncellendiğini varsaymaz.</div>"
    },
    {
      "id": "heap",
      "title": "7. Heap desteği malloc sınırında başlar",
      "kicker": "ALLOCATOR",
      "page": 9,
      "lead": "Yeni tahsis edilen nesneye sıfır uzunluklu okunabilir önek verilmelidir.",
      "html": "<p>Makale CheriFreeRTOS ve TLSF allocator’larını değiştirir. Tahsis boyutuna göre normal nesne sınırları kurulduktan sonra, dönen capability için WbR etkinleştirilip operation bound başlangıca çekilir. Böylece daha önce aynı bellek adresinde yaşamış nesnenin yazılmış olması yeni nesneyi başlatılmış yapmaz.</p><div class=\"two-col\"><div class=\"card\"><h3>malloc ile calloc arasındaki fark</h3><p>malloc alanı ayırır; sıfırlama garantisi vermez. WbR, hangi alanların gerçekten yazıldığını izler. calloc benzeri sıfırlama ise fiziksel yazmalarla varsayılan içeriği oluşturur.</p></div><div class=\"card\"><h3>Güven sınırı</h3><p>Koşulsuz ve daha geniş erişim veren eski bir capability üzerinden nesneye ulaşılabiliyorsa yalnız yeni işaretçinin korunması yeterli değildir. Politikanın tahsis ve kullanım yollarında doğru uygulanması gerekir.</p></div></div>"
    },
    {
      "id": "hardware",
      "title": "8. Capability büyümeden durum eklemek",
      "kicker": "DONANIM",
      "page": 6,
      "lead": "Sıkıştırılmış operation bound, var olan capability gösteriminin kullanılmayan adres bitlerinden yararlanır.",
      "html": "<p>Mon CHÉRI 128 bitlik capability içine operation bound eklemek için adres alanının kullanılmayan üst 16 bitini değerlendirir. Bu, sınırsız ek metadata alanı değildir: adresleme ve sıkıştırma kısıtları tasarıma eşlik eder. Koşullu izin türleri prototipte yazılım tanımlı izin bitleri üzerinden kodlanır.</p><p>Load ve store denetimleri işlem hattındaki mevcut bounds kontrolleriyle paralel düzenlenir. Store’un güncellediği OB, hemen sonraki komut tarafından kullanılacaksa bir veri bağımlılığı doğar. Bypass yolu güncel değeri ileri taşıyarak gereksiz duraklamayı önlemeyi hedefler.</p><div class=\"callout\">Yeni ISA ve işlemci desteği gerekir; değişmemiş bir CHERI çekirdeğinde yalnız derleyiciyi değiştirerek aynı denetim elde edilmez.</div>"
    },
    {
      "id": "detection",
      "title": "9. Juliet başarısının paydasını doğru oku",
      "kicker": "GÜVENLİK DENEYİ",
      "page": 9,
      "lead": "Test sonucu, seçilen test grubu ve derleme düzeni içinde anlamlıdır.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Deney</th><th>Bildirilen sonuç</th><th>Yorum</th></tr></thead><tbody><tr><td>CWE-457 kötü örnekleri</td><td>560 / 560 tespit</td><td>Seçilen başlatılmamış değişken testleri</td></tr><tr><td>İyi örnekler</td><td>560 içinde 6 yanlış pozitif</td><td>Yaklaşık %1; kopyalanıp sonra üzerine yazılan veriler</td></tr><tr><td>Linearization kapalı</td><td>119 / 560 yanlış pozitif</td><td>Durum aktarımının doğruluk maliyeti</td></tr></tbody></table></div><p>Yazarlar testlerde değişkenleri volatile yaparak optimizasyonun hatalı okumaları kaldırmasını engeller; testleri -O2 ile çalıştırır. Bu düzen, araç karşılaştırmalarını ve tespit yüzdelerini yorumlarken göz önünde tutulmalıdır. Mimari WbR ihlali ile daha sonra etkisiz kalan bir kopyanın uygulama riski aynı ölçüt değildir.</p>"
    },
    {
      "id": "cost",
      "title": "10. %3,5 hangi tabana göre?",
      "kicker": "PERFORMANS",
      "page": 11,
      "lead": "CHERI maliyeti ile koşullu izin uzantısının ek maliyetini birbirinden ayır.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Ölçüm</th><th>Platform / taban</th><th>Bildirilen sonuç</th></tr></thead><tbody><tr><td>CoreMark WbR ek maliyeti</td><td>CHERI purecap üzerine</td><td>Yaklaşık %3,5</td></tr><tr><td>WbR + purecap toplam etkisi</td><td>Capability denetimi kapalı taban</td><td>Yaklaşık %7 performans etkisi</td></tr><tr><td>Donanım alanı</td><td>CHERI-Flute64 karşılaştırması</td><td>Yaklaşık %2 artış</td></tr></tbody></table></div><p>FPGA prototipi VCU118 üzerinde 100 MHz’te sentezlenir. Store linearization bu deneyde ek maliyetin önemli kısmını oluşturur. CoreMark, allocator mikrodeneyi ve alan sayıları farklı soruları cevaplar; aynı yüzdeyi bütün gerçek uygulamalara veya her koşullu politika türüne taşımak doğru değildir.</p>"
    },
    {
      "id": "limits",
      "title": "11. Prototipin sınırları araştırma fırsatıdır",
      "kicker": "SINIRLAR",
      "page": 14,
      "lead": "Fonksiyon sınırları, parçalı başlatma ve sıkıştırma tasarımın açık işlerini gösterir.",
      "html": "<div class=\"two-col\"><div class=\"card\"><h3>Fonksiyonlar arası aktarım</h3><p>Mevcut linearization esas olarak fonksiyon içi analize dayanır. Callee’den caller’a güncel conditional capability’yi döndürmek açık aktarım gerektirebilir. Makale borrow checking ile daha geniş program analizini gelecek çalışma olarak tartışır.</p></div><div class=\"card\"><h3>Temsil ve politika kapsamı</h3><p>Operation bound kodlaması ve hassasiyeti sınırlıdır. Sıralı olmayan yapı alanları ve padding yazılım önlemleri gerektirebilir. Tek bir mod kodlaması, bütün koşullu politikaların aynı capability’de serbestçe birleştirildiği anlamına gelmez.</p></div></div><div class=\"callout\">WbR bir yazmanın uygulama açısından doğru değeri ürettiğini kanıtlamaz. Yanlış veya saldırgan kontrollü bir değeri yazmak da “önce yaz” koşulunu sağlayabilir.</div>"
    },
    {
      "id": "synthesis",
      "title": "12. CHERIoT ile aynı parçayı mı çözüyor?",
      "kicker": "BÜYÜK RESİM",
      "page": 14,
      "lead": "Capability mimarisindeki farklı güvenlik hedeflerini birlikte düşün.",
      "html": "<div class=\"table-wrap\"><table><thead><tr><th>Soru</th><th>İlgili mekanizma</th></tr></thead><tbody><tr><td>Nesnenin dışına erişebilir miyim?</td><td>Capability sınırları ve izinleri</td></tr><tr><td>Serbest bırakılmış nesneyi kullanabilir miyim?</td><td>Zamansal güvenlik / revocation</td></tr><tr><td>Henüz yazılmamış alanı okuyabilir miyim?</td><td>Mon CHÉRI WbR koşulu</td></tr><tr><td>Bir bileşen diğerinin yetkisini kullanabilir mi?</td><td>Compartment ve arayüz tasarımı</td></tr></tbody></table></div><p>Okuma notuna şu zinciri yaz: hata sınıfı → gerekli geçmiş bilgisi → bu bilginin nerede tutulduğu → derleyicinin koruması gereken ilişki → ölçümün hangi koşulu sınadığı. Böylece donanım ilkesini, dil semantiğini ve uygulama güvenliğini birbirine karıştırmadan katkıyı konumlandırabilirsin.</p>"
    }
  ],
  "quiz": [
    {
      "q": "Geçerli, nesne içindeki bir capability neden başlatılmamış okumayı engellemeyebilir?",
      "options": [
        "Sınırlar başlatılma geçmişini ifade etmez.",
        "CHERI bütün izinleri kaldırır.",
        "Heap nesneleri hiç okunamaz."
      ],
      "correct": 0,
      "why": "Adres sınırı ve R izni, o konuma daha önce yazıldığını söylemez; WbR bu ek koşulu taşır."
    },
    {
      "q": "Yeni WbR tahsisinde okunabilir önek ne kadardır?",
      "options": [
        "Nesnenin yarısı",
        "Sıfır bayt",
        "Önceki nesnenin boyutu"
      ],
      "correct": 1,
      "why": "OB başlangıca kurulur. Önceki tahsisin içeriği yeni nesnenin başlatıldığı anlamına gelmez."
    },
    {
      "q": "Arada boşluk bırakan bir store neden tüm öneki okunabilir yapamaz?",
      "options": [
        "Boşluk hâlâ yazılmamıştır.",
        "Store komutu daima yasaktır.",
        "UB artık yoktur."
      ],
      "correct": 0,
      "why": "Tek önek sınırı aradaki yazılmamış baytları güvenli biçimde başlatılmış ilan edemez."
    },
    {
      "q": "Store linearization hangi ilişkiyi korumaya çalışır?",
      "options": [
        "Ağ paketlerinin sırasını",
        "Güncel capability durumunun sonraki kullanımlara taşınmasını",
        "İşletim sistemi önceliklerini"
      ],
      "correct": 1,
      "why": "Store OB’yi değiştirdiği için sonraki load eski capability durumunu kullanmamalıdır."
    },
    {
      "q": "Juliet’te %100 tespit hangi iddiayı destekler?",
      "options": [
        "Bütün C/C++ hataları çözülmüştür.",
        "Yanlış pozitif olamaz.",
        "Seçilen 560 kötü CWE-457 örneği düzenlenen deneyde tespit edilmiştir."
      ],
      "correct": 2,
      "why": "Sonucun kapsamı test grubu, volatile düzenlemesi ve kullanılan derleme ortamıyla sınırlıdır."
    },
    {
      "q": "Bildirilen yaklaşık %3,5 ek maliyetin karşılaştırması nedir?",
      "options": [
        "WbR’nin CHERI purecap üzerine etkisi",
        "Her gömülü cihazın toplam enerji kaybı",
        "Bütün C programlarının en kötü süresi"
      ],
      "correct": 0,
      "why": "CoreMark FPGA deneyinde WbR ek etkisi purecap tabanıyla karşılaştırılır; toplam maliyetin tabanı farklıdır."
    },
    {
      "q": "WbR koşulunu sağlayan bir yazma neyi kanıtlar?",
      "options": [
        "Değerin fiziksel sensör açısından doğru olduğunu",
        "İlgili bölgenin politika kapsamında yazıldığını",
        "Programın bütün mantığının doğru olduğunu"
      ],
      "correct": 1,
      "why": "Geçmiş yazma ile doğru uygulama değeri farklıdır; WbR işlevsel doğruluk kanıtı değildir."
    },
    {
      "q": "Sıralı olmayan başlatmayı bitmap ile izleme çalışmada nasıl konumlanır?",
      "options": [
        "Bütün prototiplerde varsayılan özellik",
        "Normal CHERI’nin zorunlu özelliği",
        "Alternatif / gelecek tasarım seçeneği"
      ],
      "correct": 2,
      "why": "Makale tek OB modelinin kısıtını anlatırken bitmap ve shadow memory seçeneklerini tartışır."
    }
  ],
  "glossary": [
    [
      "Uninitialized memory",
      "Yeni nesne için geçerli bir değer yazılmadan kalan bellek."
    ],
    [
      "Undefined behavior",
      "Dil kurallarının program davranışı için garanti vermediği durum."
    ],
    [
      "Capability",
      "Adres, sınır, izin ve geçerlilik bilgisi taşıyan yetkili işaretçi."
    ],
    [
      "Conditional permission",
      "Önceki işleme bağlı olarak erişime izin veren ek politika."
    ],
    [
      "Write-before-Read",
      "Okumadan önce ilgili alanın yazılmış olmasını isteyen koşul."
    ],
    [
      "LB",
      "Nesnenin alt adres sınırı."
    ],
    [
      "UB",
      "Nesnenin üst adres sınırı."
    ],
    [
      "OB",
      "Koşulun sağlandığı alanı izleyen operation bound."
    ],
    [
      "Önek",
      "Başlangıçtan itibaren arada boşluk bulunmayan bölge."
    ],
    [
      "Alias",
      "Aynı nesneye erişen başka işaretçi veya capability değeri."
    ],
    [
      "Store linearization",
      "Store ile değişen capability durumunu sonraki kullanımlara taşıyan derleyici dönüşümü."
    ],
    [
      "SSA",
      "LLVM’de her değerin tek tanımı olacak şekilde kullanılan ara temsil."
    ],
    [
      "Instrumentation",
      "İzleme veya koruma için programa eklenen işlem ve metadata."
    ],
    [
      "Purecap",
      "İşaretçilerin capability olarak kullanıldığı derleme / yürütme modeli."
    ],
    [
      "Allocator",
      "Bellek tahsis eden ve geri alan bileşen."
    ],
    [
      "TLSF",
      "Gerçek zamanlı kullanım için tasarlanmış bir bellek ayırma yaklaşımı."
    ],
    [
      "Padding",
      "Yapı alanları arasında hizalama için bırakılan baytlar."
    ],
    [
      "Volatile",
      "Derleyicinin erişimleri kaldırma veya birleştirme serbestliğini sınırlayan C niteliği."
    ],
    [
      "False positive",
      "Değerlendirmede iyi sayılan örneğin koruma tarafından işaretlenmesi."
    ],
    [
      "Bypass",
      "İşlem hattında yeni sonucu ihtiyaç duyan aşamaya ileri taşıyan veri yolu."
    ],
    [
      "QEMU",
      "Bu çalışmada mimari uzantının işlevsel değerlendirmesi için kullanılan emülatör."
    ],
    [
      "CoreMark",
      "İşlemci performansını değerlendirmede kullanılan benchmark; tam uygulama garantisi değildir."
    ]
  ]
};
window.GUIDE.init = function () {
const $=s=>document.querySelector(s);let written=0;
function render(){ $('#mon-memory').innerHTML=Array.from({length:8},(_,i)=>'<div class="stage-node '+(i<written?'active':'')+'">'+i+'<br>'+(i<written?'Yazıldı':'Bekliyor')+'</div>').join('');$('#mon-bound-out').textContent='LB = 0 · OB = '+written+' · UB = 8. Okunabilir aralık: [0, '+written+').';$('#mon-write').disabled=written===8;}
$('#mon-write').onclick=()=>{written=Math.min(8,written+1);render()};$('#mon-reset').onclick=()=>{written=0;render()};$('#mon-read').onclick=()=>{$('#mon-bound-out').textContent=written===8?'OB = UB = 8: bu adres nesnenin dışında. Normal bounds denetimi reddeder.':'OB adresi '+written+' henüz okunabilir önekte değil: WbR koruma hatası.'};render();
function pattern(){const v=$('#mon-pattern').value;$('#mon-pattern-out').textContent=v==='prefix'?'Kesintisiz ilk dört bayt yazıldı: modelde OB = 4. [0, 4) okunabilir.':v==='gap'?'Yalnız 4. bayta yazmak [0, 4) boşluğunu kapatmaz. Tek OB, bu parçalı başlatmayı tam ifade edemez; tüm önek açılamaz.':'Bütün sekiz bayta yazıldı: OB = 8. Bu ön başlatma yazma maliyeti taşır.'}$('#mon-pattern').onchange=pattern;pattern();
function alias(){ $('#mon-alias-out').textContent=$('#mon-alias').value==='fresh'?'Güncel capability OB = 4 taşıyor: ilk baytı okuma koşulu sağlanır.':'Eski kopya OB = 0 taşıyor: aynı nesneye rağmen okuma reddedilir. Derleyici güncel durumu sonraki kullanıma taşımalıdır.'}$('#mon-alias').onchange=alias;alias();
};
