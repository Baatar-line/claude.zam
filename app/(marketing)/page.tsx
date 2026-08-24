import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { GROUP_WEIGHT, TRAIT_GROUP_LABEL_MN, TRAIT_GROUPS } from "@/lib/scoring/traits";

const DOORS = [
  {
    entryPath: "EXPLORE",
    titleMn: "Мэдэхгүй байна",
    bodyMn:
      "Ямар мэргэжил надад тохирохыг мэдэхгүй байна. Асуулт хариулаад, надад тохирох мэргэжлүүдийг олж өгөөрэй.",
    ctaMn: "Тохирохыг олоорой",
  },
  {
    entryPath: "VALIDATE",
    titleMn: "Аль хэдийн шийдсэн",
    bodyMn:
      "Ямар мэргэжил сурахаа аль хэдийн шийдчихсэн. Энэ сонголт надад хэр зохимжтойг шалгаж өгөөрэй.",
    ctaMn: "Сонголтоо шалгаарай",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <Container className="max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Мэргэжлээ олоход тусална
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
            20 орчим минутын үнэ төлбөргүй, нэрээ өгөх шаардлагагүй шалгалт. 7-12-р ангийн
            сурагчдад зориулсан.
          </p>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container className="grid max-w-5xl gap-6 sm:grid-cols-2">
          {DOORS.map((door) => (
            <Card key={door.entryPath} className="flex flex-col gap-4 p-8">
              <h2 className="text-2xl font-bold text-ink">{door.titleMn}</h2>
              <p className="flex-1 text-ink-soft">{door.bodyMn}</p>
              <Button href={`/test?path=${door.entryPath}`} size="lg" className="w-full">
                {door.ctaMn}
              </Button>
            </Card>
          ))}
        </Container>
      </section>

      <section className="border-t border-line bg-paper-raised py-16">
        <Container className="max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-ink">Юуг хэмждэг вэ</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {TRAIT_GROUPS.map((group) => (
              <div key={group} className="rounded-xl border border-line p-4 text-center">
                <div className="text-2xl font-bold text-accent">
                  {Math.round(GROUP_WEIGHT[group] * 100)}%
                </div>
                <div className="mt-1 font-semibold text-ink">{TRAIT_GROUP_LABEL_MN[group]}</div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-ink-soft">
            Оноог хиймэл оюун биш, энгийн томьёо тооцдог — ижил хариулт өгсөн хоёр хүн үргэлж
            ижил үр дүн авна.{" "}
            <a href="/about" className="font-medium text-accent underline underline-offset-2">
              Дэлгэрэнгүй
            </a>
          </p>
        </Container>
      </section>
    </>
  );
}
