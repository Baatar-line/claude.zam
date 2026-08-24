import { Container } from "@/components/ui/Container";
import {
  BAND_PARTIAL_MIN,
  BAND_STRONG_MIN,
  BAND_LABEL_MN,
  FLOOR_SCORE,
} from "@/lib/scoring/match-careers";
import { GROUP_WEIGHT, TRAIT_GROUP_LABEL_MN, TRAIT_GROUPS } from "@/lib/scoring/traits";

export default function AboutPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="text-3xl font-bold text-ink">Тухай</h1>

      <div className="mt-8 space-y-8 text-ink-soft [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>Оноог хиймэл оюун тооцдоггүй</h2>
          <p>
            Оноо, тохирлын хувь — эдгээрийн аль нь ч хиймэл оюунаар гарахгүй, бүгд энгийн
            томьёогоор гардаг. Ижил хариулт өгсөн хоёр сурагч үргэлж ижил үр дүн авах ёстой тул
            хөдөлгүүр дотор цаг, санамсаргүй тоо, сүлжээний дуудлага байхгүй.
          </p>
        </section>

        <section>
          <h2>Дөрвөн бүлэг, 23 шинж</h2>
          <p>Асуулт бүр эдгээрийн аль нэгийг хэмждэг:</p>
          <ul className="mt-3 space-y-2">
            {TRAIT_GROUPS.map((group) => (
              <li key={group} className="flex items-baseline justify-between border-b border-line-soft pb-2">
                <span className="font-medium text-ink">{TRAIT_GROUP_LABEL_MN[group]}</span>
                <span>{Math.round(GROUP_WEIGHT[group] * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Чадвар, сонирхол хамгийн өндөр жинтэй — учир нь ажил дээр удаан хугацаанд тогтвортой
            байдаг. Үнэт зүйл хамгийн хурдан өөрчлөгддөг тул хамгийн бага жинтэй.
          </p>
        </section>

        <section>
          <h2>Яагаад {FLOOR_SCORE}%-иас доош тоо харагддаггүй вэ</h2>
          <p>
            Дэлгэц дээр харагдах тохирлын хувь хэзээ ч {FLOOR_SCORE}%-иас доош буухгүй. Учир нь энэ
            тоо чиний тухай эцсийн шүүлт биш — хорин минутын шалгалтаар өнөөдөр хэмжсэн профайл,
            нэг мэргэжлийн ердийн профайл хоёрын хоорондох зай юм.
          </p>
        </section>

        <section>
          <h2>Түвшин</h2>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="font-medium text-ink">{BAND_STRONG_MIN}%+</span> —{" "}
              {BAND_LABEL_MN.STRONG}
            </li>
            <li>
              <span className="font-medium text-ink">
                {BAND_PARTIAL_MIN}–{BAND_STRONG_MIN - 1}%
              </span>{" "}
              — {BAND_LABEL_MN.PARTIAL}
            </li>
            <li>
              <span className="font-medium text-ink">{FLOOR_SCORE}–{BAND_PARTIAL_MIN - 1}%</span> —{" "}
              {BAND_LABEL_MN.DIVERGENT}
            </li>
          </ul>
          <p className="mt-3">
            &ldquo;Тохирохгүй&rdquo; гэсэн түвшин байхгүй — хамгийн доод түвшин ч сурагчийн өсгөж
            болох тодорхой шинжүүдтэй хамт гардаг.
          </p>
        </section>

        <section>
          <h2>Найдваргүй хариултыг хэрхэн танидаг вэ</h2>
          <p>
            Дараалан ижил байрлал сонгох, асуултыг уншилгүй хурдан хариулах зэрэг загварыг
            хөдөлгүүр илрүүлдэг. Илрүүлбэл сурагчийг зогсоохгүй — үр дүнгийн хуудсанд чимээгүй
            тэмдэглэл гарч, дахин өгөхийг санал болгодог.
          </p>
        </section>
      </div>
    </Container>
  );
}
