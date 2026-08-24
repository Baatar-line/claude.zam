"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { loadCareerDetail, toggleRoadmapStep } from "@/app/(result)/r/[code]/actions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Container } from "@/components/ui/Container";
import { Tabs } from "@/components/ui/Tabs";
import { TraitBar } from "@/components/ui/TraitBar";
import {
  AI_RISK_LABEL_MN,
  DEMAND_LABEL_MN,
  ROADMAP_CATEGORY_LABEL_MN,
  SATURATION_LABEL_MN,
} from "@/lib/content/career-labels";
import { TRAIT_GROUP_LABEL_MN } from "@/lib/scoring/traits";

type DetailData = Extract<Awaited<ReturnType<typeof loadCareerDetail>>, { ok: true }>["data"];

const BAND_VARIANT = { STRONG: "strong", PARTIAL: "partial", DIVERGENT: "divergent" } as const;
const MNT = new Intl.NumberFormat("mn-MN");

export function CareerDetailView({ code, slug }: { code: string; slug: string }) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "not-found" } | { status: "ready"; data: DetailData }
  >({ status: "loading" });

  useEffect(() => {
    void (async () => {
      const result = await loadCareerDetail({ code, slug });
      setState(result.ok ? { status: "ready", data: result.data } : { status: "not-found" });
    })();
  }, [code, slug]);

  if (state.status === "loading") {
    return <Container className="max-w-2xl py-24 text-center text-ink-soft">Уншиж байна...</Container>;
  }

  if (state.status === "not-found") {
    return (
      <Container className="max-w-2xl py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Олдсонгүй</h1>
        <Link href={`/r/${code}`} className="mt-4 inline-block text-accent underline underline-offset-2">
          Үр дүн рүү буцах
        </Link>
      </Container>
    );
  }

  const { data } = state;
  const { career, match, explanation, adjacentCareers, programs, scholarships } = data;

  const domestic = programs.filter((p) => p.university.country === "Монгол");
  const abroad = programs.filter((p) => p.university.country !== "Монгол");

  return (
    <Container className="max-w-2xl py-12">
      <Link href={`/r/${code}`} className="text-sm font-medium text-accent underline underline-offset-2">
        ← Үр дүн рүү буцах
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-faint">{career.categoryMn}</p>
          <h1 className="text-3xl font-bold text-ink">{career.nameMn}</h1>
        </div>
        {match && <Badge variant={BAND_VARIANT[match.band]}>{match.score}%</Badge>}
      </div>
      <p className="mt-3 text-lg text-ink-soft">{career.summaryMn}</p>

      {match && (
        <Card className="mt-6">
          <p className="font-semibold text-ink">Юугаараа тохирч байна вэ</p>
          <div className="mt-3 grid gap-3">
            {(["ability", "interest", "personality", "value"] as const).map((group) => (
              <TraitBar
                key={group}
                labelMn={TRAIT_GROUP_LABEL_MN[group]}
                value={match.subScores[group]}
              />
            ))}
          </div>
          {explanation.topPositive.length > 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              <span className="font-medium text-ink">Давуу тал: </span>
              {explanation.topPositive.join(", ")}
            </p>
          )}
          {explanation.topGaps.length > 0 && (
            <p className="mt-1 text-sm text-ink-soft">
              <span className="font-medium text-ink">Бэхжүүлбэл зохих зүйл: </span>
              {explanation.topGaps.join(", ")}
            </p>
          )}
        </Card>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">Өдөр тутмын ажил</h2>
        <p className="mt-2 text-ink-soft">{career.dayInLifeMn}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">Мэдэж байсан уу?</h2>
        <div className="mt-3 grid gap-2">
          {career.realityChecks.map((item) => (
            <RealityCheckItem key={item.order} questionMn={item.questionMn} factMn={item.factMn} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-ink-faint">Эрэлт</p>
          <p className="font-medium text-ink">{DEMAND_LABEL_MN[career.demandNow]}</p>
          <p className="text-sm text-ink-soft">Ирээдүйд: {DEMAND_LABEL_MN[career.demandFuture]}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-faint">Хиймэл оюун</p>
          <p className="font-medium text-ink">{AI_RISK_LABEL_MN[career.aiRisk]}</p>
          <p className="text-sm text-ink-soft">{career.aiRiskNoteMn}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink-faint">Цалин (сар)</p>
          <p className="font-medium text-ink">
            {MNT.format(career.salaryStartMnt)}₮ – {MNT.format(career.salaryMidMnt)}₮
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-faint">Хэдэн жил суралцах</p>
          <p className="font-medium text-ink">{career.yearsOfStudy} жил</p>
          <p className="text-sm text-ink-soft">{SATURATION_LABEL_MN[career.saturation]}</p>
        </Card>
      </section>

      {career.requiredEeshSubjects.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Ямар хичээлдээ сайн байх ёстой вэ</h2>
          <p className="mt-2 text-ink-soft">
            Энэ мэргэжлээр суралцахын тулд ЭЕШ-д дараах хичээлүүдээр сайн бэлтгэгдсэн байх шаардлагатай:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {career.requiredEeshSubjects.map((subject) => (
              <Badge key={subject} variant="accent">{subject}</Badge>
            ))}
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Хаана суралцаж болох вэ</h2>
          <div className="mt-3">
            <Tabs
              tabs={[
                {
                  key: "domestic",
                  labelMn: `Монголд (${domestic.length})`,
                  content: <ProgramList programs={domestic} emptyMn="Одоогоор мэдээлэл алга." />,
                },
                {
                  key: "abroad",
                  labelMn: `Гадаадад (${abroad.length})`,
                  content: <ProgramList programs={abroad} emptyMn="Одоогоор мэдээлэл алга." />,
                },
              ]}
            />
          </div>
        </section>
      )}

      {scholarships.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Тэтгэлэг</h2>
          <div className="mt-3 grid gap-3">
            {scholarships.map((scholarship) => (
              <Card key={scholarship.nameMn}>
                <p className="font-semibold text-ink">{scholarship.nameMn}</p>
                <p className="text-sm text-ink-faint">
                  {scholarship.country} — {scholarship.provider}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{scholarship.coverageMn}</p>
                <a
                  href={scholarship.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2"
                >
                  Дэлгэрэнгүй
                </a>
              </Card>
            ))}
          </div>
        </section>
      )}

      {adjacentCareers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Ойролцоо мэргэжлүүд</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {adjacentCareers.map((adjacent) => (
              <Link
                key={adjacent.slug}
                href={`/r/${code}/career/${adjacent.slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-accent hover:bg-accent-soft"
              >
                {adjacent.nameMn}
              </Link>
            ))}
          </div>
        </section>
      )}

      {career.roadmapSteps.length > 0 && (
        <RoadmapSection code={code} steps={career.roadmapSteps} />
      )}
    </Container>
  );
}

function RealityCheckItem({ questionMn, factMn }: { questionMn: string; factMn: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left font-medium text-ink"
      >
        {questionMn}
        <span className="text-ink-faint">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="mt-2 text-ink-soft">{factMn}</p>}
    </Card>
  );
}

function ProgramList({
  programs,
  emptyMn,
}: {
  programs: DetailData["programs"];
  emptyMn: string;
}) {
  if (programs.length === 0) return <p className="text-sm text-ink-faint">{emptyMn}</p>;
  return (
    <div className="grid gap-3">
      {programs.map((program) => (
        <Card key={`${program.university.nameMn}-${program.nameMn}`}>
          <p className="font-semibold text-ink">{program.nameMn}</p>
          <p className="text-sm text-ink-soft">
            {program.university.nameMn} — {program.university.city}, {program.university.country}
          </p>
          <p className="mt-1 text-sm text-ink-faint">{program.durationYears} жил</p>
          {program.tuitionMnt !== null && (
            <p className="text-sm text-ink-faint">Төлбөр: {MNT.format(program.tuitionMnt)}₮/жил</p>
          )}
          {program.quotaNotes && <p className="mt-1 text-sm text-ink-soft">{program.quotaNotes}</p>}
          {program.university.website && (
            <a
              href={program.university.website}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2"
            >
              Сургуулийн вэбсайт
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}

function RoadmapSection({ code, steps }: { code: string; steps: DetailData["career"]["roadmapSteps"] }) {
  const [progress, setProgress] = useState(() => new Map(steps.map((step) => [step.id, step.done])));
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(stepId: string, done: boolean) {
    setPending(stepId);
    setProgress((prev) => new Map(prev).set(stepId, done));
    const result = await toggleRoadmapStep({ code, roadmapStepId: stepId, done });
    setPending(null);
    if (!result.ok) {
      setProgress((prev) => new Map(prev).set(stepId, !done));
    }
  }

  const byCategory = new Map<string, typeof steps>();
  for (const step of steps) {
    const list = byCategory.get(step.category) ?? [];
    list.push(step);
    byCategory.set(step.category, list);
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-ink">Дараагийн алхмууд</h2>
      <div className="mt-3 grid gap-6">
        {[...byCategory.entries()].map(([category, categorySteps]) => (
          <div key={category}>
            <p className="mb-2 font-semibold text-ink">
              {ROADMAP_CATEGORY_LABEL_MN[category as keyof typeof ROADMAP_CATEGORY_LABEL_MN]}
            </p>
            <div className="grid gap-3">
              {categorySteps.map((step) => (
                <Card key={step.id} className="p-4">
                  <Checkbox
                    label={`${step.titleMn} (${step.gradeLevel}-р анги)`}
                    checked={progress.get(step.id) ?? false}
                    disabled={pending === step.id}
                    onChange={(event) => void toggle(step.id, event.target.checked)}
                  />
                  <p className="mt-2 pl-8 text-sm text-ink-soft">{step.detailMn}</p>
                  {step.resourceUrl && (
                    <a
                      href={step.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block pl-8 text-sm font-medium text-accent underline underline-offset-2"
                    >
                      Материал
                    </a>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
