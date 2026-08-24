"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { updateSupplementary, viewResult } from "@/app/(result)/r/[code]/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { TraitBar } from "@/components/ui/TraitBar";
import {
  IQ_DISCLAIMER_MN,
  IQ_SCORE_MAX,
  IQ_SCORE_MIN,
  MBTI_DISCLAIMER_MN,
  MBTI_LABEL_MN,
  MBTI_NOTE_MN,
  MBTI_TYPES,
  iqBandFor,
} from "@/lib/content/supplementary";
import { TRAIT_GROUPS } from "@/lib/scoring/traits";

type ViewResultData = Extract<Awaited<ReturnType<typeof viewResult>>, { ok: true }>["data"];

const BAND_VARIANT = { STRONG: "strong", PARTIAL: "partial", DIVERGENT: "divergent" } as const;

export function ResultView({ code }: { code: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "not-found" }
    | { status: "not-completed" }
    | { status: "ready"; data: Extract<ViewResultData, { completed: true }> }
  >({ status: "loading" });

  useEffect(() => {
    void (async () => {
      const result = await viewResult({ code });
      if (!result.ok) {
        setState({ status: "not-found" });
        return;
      }
      if (!result.data.completed) {
        setState({ status: "not-completed" });
        return;
      }
      setState({ status: "ready", data: result.data });
    })();
  }, [code]);

  if (state.status === "loading") {
    return <Container className="max-w-2xl py-24 text-center text-ink-soft">Уншиж байна...</Container>;
  }

  if (state.status === "not-found") {
    return (
      <Container className="max-w-2xl py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Код олдсонгүй</h1>
        <p className="mt-3 text-ink-soft">Кодоо шалгаад дахин оруулаарай.</p>
        <Button href="/test" className="mt-6">Шалгалт руу буцах</Button>
      </Container>
    );
  }

  if (state.status === "not-completed") {
    return (
      <Container className="max-w-2xl py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Шалгалт дуусаагүй байна</h1>
        <p className="mt-3 text-ink-soft">Энэ кодтой шалгалт дуусаагүй байна. Үргэлжлүүлээрэй.</p>
        <Button href="/test" className="mt-6">Үргэлжлүүлэх</Button>
      </Container>
    );
  }

  const { data } = state;
  const chosenMatch = data.chosenCareer
    ? data.careerMatches.find((match) => match.slug === data.chosenCareer?.slug)
    : undefined;

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-3xl font-bold text-ink">Чиний үр дүн</h1>

      {data.validityFlags.length > 0 && (
        <Callout className="mt-4">
          Зарим хариулт яаравчлан өгөгдсөн бололтой. Хүсвэл дахин өгч, илүү нарийвчилсан үр дүн
          авч болно.
        </Callout>
      )}

      {data.entryPath === "VALIDATE" && data.chosenCareer && chosenMatch && (
        <Card className="mt-6">
          <p className="text-sm font-medium text-ink-soft">Чиний сонгосон мэргэжил</p>
          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">{data.chosenCareer.nameMn}</h2>
            <Badge variant={BAND_VARIANT[chosenMatch.band]}>{chosenMatch.score}%</Badge>
          </div>
          <p className="mt-2 text-ink-soft">{chosenMatch.bandLabelMn}</p>
          <Link
            href={`/r/${code}/career/${data.chosenCareer.slug}`}
            className="mt-3 inline-block font-medium text-accent underline underline-offset-2"
          >
            Дэлгэрэнгүй үзэх
          </Link>
        </Card>
      )}

      <h2 className="mt-10 text-xl font-bold text-ink">Хамгийн тохирох мэргэжлүүд</h2>
      <div className="mt-4 grid gap-4">
        {data.careerMatches.slice(0, 5).map((match) => (
          <Card key={match.slug}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink-faint">{match.categoryMn}</p>
                <h3 className="text-lg font-bold text-ink">{match.nameMn}</h3>
              </div>
              <Badge variant={BAND_VARIANT[match.band]}>{match.score}%</Badge>
            </div>
            <p className="mt-2 text-ink-soft">{match.summaryMn}</p>
            <Link
              href={`/r/${code}/career/${match.slug}`}
              className="mt-3 inline-block font-medium text-accent underline underline-offset-2"
            >
              Дэлгэрэнгүй үзэх
            </Link>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink">Шинжийн задаргаа</h2>
      <div className="mt-4 grid gap-6">
        {TRAIT_GROUPS.map((group) => (
          <div key={group}>
            <p className="mb-3 font-semibold text-ink">
              {data.traits.find((trait) => trait.group === group)?.groupLabelMn}
            </p>
            <div className="grid gap-3">
              {data.traits
                .filter((trait) => trait.group === group)
                .map((trait) => (
                  <TraitBar
                    key={trait.trait}
                    labelMn={trait.labelMn}
                    value={trait.normalized}
                    measured={trait.measured}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <SupplementarySection
        code={code}
        mbtiType={data.mbtiType}
        iqScore={data.iqScore}
      />
    </Container>
  );
}

function SupplementarySection({
  code,
  mbtiType,
  iqScore,
}: {
  code: string;
  mbtiType: string | null;
  iqScore: number | null;
}) {
  const [mbti, setMbti] = useState(mbtiType ?? "");
  const [iq, setIq] = useState(iqScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSavedNote(null);
    const iqValue = iq.trim() === "" ? null : Number(iq);
    const result = await updateSupplementary({
      code,
      mbtiType: mbti === "" ? null : mbti,
      iqScore: iqValue,
    });
    setSaving(false);
    setSavedNote(result.ok ? "Хадгалагдлаа." : result.error.messageMn);
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="text-xl font-bold text-ink">Нэмэлт мэдээлэл (сонголтоор)</h2>
      <p className="mt-2 text-sm text-ink-soft">
        MBTI төрөл эсвэл өмнө нь өгсөн IQ оноогоо мэдэж байгаа бол доор оруулж болно. Эдгээр нь
        дээрх тохирлын хувь, шинжийн онооноос аль алинд нь нөлөөлдөггүй — зөвхөн нэмэлт өнцөг.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">MBTI төрөл</span>
          <select
            value={mbti}
            onChange={(event) => setMbti(event.target.value)}
            className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
          >
            <option value="">Сонгоогүй</option>
            {MBTI_TYPES.map((type) => (
              <option key={type} value={type}>
                {type} — {MBTI_LABEL_MN[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">IQ оноо</span>
          <input
            type="number"
            min={IQ_SCORE_MIN}
            max={IQ_SCORE_MAX}
            value={iq}
            onChange={(event) => setIq(event.target.value)}
            placeholder="Жишээ нь: 110"
            className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-ink"
          />
        </label>
      </div>

      <Button variant="secondary" className="mt-4" disabled={saving} onClick={() => void save()}>
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </Button>
      {savedNote && <p className="mt-2 text-sm text-ink-soft">{savedNote}</p>}

      {mbti !== "" && (
        <Callout className="mt-4">
          <span className="font-medium text-ink">
            {mbti} — {MBTI_LABEL_MN[mbti as keyof typeof MBTI_LABEL_MN]}.
          </span>{" "}
          {MBTI_NOTE_MN[mbti as keyof typeof MBTI_NOTE_MN]}
          <br />
          <span className="text-ink-faint">{MBTI_DISCLAIMER_MN}</span>
        </Callout>
      )}

      {iq.trim() !== "" && !Number.isNaN(Number(iq)) && (
        <Callout className="mt-3">
          <span className="font-medium text-ink">{iqBandFor(Number(iq)).labelMn}.</span>{" "}
          {iqBandFor(Number(iq)).noteMn}
          <br />
          <span className="text-ink-faint">{IQ_DISCLAIMER_MN}</span>
        </Callout>
      )}
    </div>
  );
}
