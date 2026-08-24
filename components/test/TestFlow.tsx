"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  abandonSession,
  completeSession,
  loadTestContent,
  resumeByCode,
  saveAnswer,
  startSession,
} from "@/app/(test)/test/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { CareerPickerEntry, ClientBlock, ClientQuestion } from "@/lib/content/test-content";

import { ChoiceQuestion } from "./ChoiceQuestion";
import { RankQuestion } from "./RankQuestion";
import { SliderQuestion } from "./SliderQuestion";

const STORAGE_KEY = "zam_resume_code";
type EntryPath = "EXPLORE" | "VALIDATE";

type Phase =
  | { name: "entry" }
  | { name: "code" }
  | { name: "loading" }
  | { name: "block-intro"; block: ClientBlock }
  | { name: "question" }
  | { name: "completing" };

type AnswerPayload = { optionId?: string; rankOrder?: number[]; sliderValue?: number };

export function TestFlow({
  careers,
  initialEntryPath,
}: {
  careers: CareerPickerEntry[];
  initialEntryPath: EntryPath | null;
}) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>({ name: "entry" });
  const [gradeLevel, setGradeLevel] = useState(9);
  const [entryPath, setEntryPath] = useState<EntryPath>(initialEntryPath ?? "EXPLORE");
  const [chosenCareerSlug, setChosenCareerSlug] = useState(careers[0]?.slug ?? "");
  const [region, setRegion] = useState("");

  const [resumeCode, setResumeCode] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ClientBlock[]>([]);
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeInput, setResumeInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMn, setErrorMn] = useState<string | null>(null);

  const questionStartedAt = useRef(Date.now());

  useEffect(() => {
    if (phase.name === "question") questionStartedAt.current = Date.now();
  }, [phase, currentIndex]);

  // Resilience against an accidental reload mid-test (§5.2): the code is
  // shown once, so if it is still in this tab's sessionStorage, offer to
  // pick the session back up rather than dropping the student to the top.
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) void handleResumeCode(stored, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterQuestionAt(index: number, blockList: ClientBlock[], questionList: ClientQuestion[]) {
    const next = questionList[index];
    if (!next) {
      setPhase({ name: "completing" });
      return;
    }

    const previous = index > 0 ? questionList[index - 1] : undefined;
    const enteringNewBlock = previous === undefined || previous.blockId !== next.blockId;
    setCurrentIndex(index);

    if (enteringNewBlock) {
      const block = blockList.find((candidate) => candidate.key === next.blockId);
      if (block) {
        setPhase({ name: "block-intro", block });
        return;
      }
    }
    setPhase({ name: "question" });
  }

  async function handleStart(event: React.FormEvent) {
    event.preventDefault();
    setErrorMn(null);
    setSubmitting(true);

    const result = await startSession({
      gradeLevel,
      entryPath,
      chosenCareerSlug: entryPath === "VALIDATE" ? chosenCareerSlug : undefined,
      region: region.trim() || undefined,
    });

    setSubmitting(false);
    if (!result.ok) {
      setErrorMn(result.error.messageMn);
      return;
    }

    setResumeCode(result.data.resumeCode);
    sessionStorage.setItem(STORAGE_KEY, result.data.resumeCode);
    setPhase({ name: "code" });
  }

  async function handleConfirmCode() {
    setSubmitting(true);
    setErrorMn(null);
    const result = await loadTestContent({});
    setSubmitting(false);

    if (!result.ok) {
      setErrorMn(result.error.messageMn);
      return;
    }

    setBlocks(result.data.blocks);
    setQuestions(result.data.questions);
    setAnsweredCount(0);
    enterQuestionAt(0, result.data.blocks, result.data.questions);
  }

  async function handleResumeCode(code: string, silent: boolean) {
    setSubmitting(true);
    if (!silent) setErrorMn(null);

    const result = await resumeByCode({ code: code.trim().toUpperCase() });

    if (!result.ok) {
      setSubmitting(false);
      sessionStorage.removeItem(STORAGE_KEY);
      if (!silent) setErrorMn(result.error.messageMn);
      return;
    }

    setResumeCode(code.trim().toUpperCase());
    sessionStorage.setItem(STORAGE_KEY, code.trim().toUpperCase());

    if (result.data.completed) {
      router.push(`/r/${code.trim().toUpperCase()}`);
      return;
    }

    const content = await loadTestContent({});
    setSubmitting(false);

    if (!content.ok) {
      if (!silent) setErrorMn(content.error.messageMn);
      return;
    }

    setBlocks(content.data.blocks);
    setQuestions(content.data.questions);

    const answeredIds = new Set(result.data.answeredQuestionIds);
    setAnsweredCount(answeredIds.size);
    const firstUnanswered = content.data.questions.findIndex((q) => !answeredIds.has(q.id));

    if (firstUnanswered === -1) {
      setPhase({ name: "completing" });
      return;
    }
    setCurrentIndex(firstUnanswered);
    setPhase({ name: "question" });
  }

  async function submitAnswer(payload: AnswerPayload) {
    const current = questions[currentIndex];
    if (!current) return;

    setSubmitting(true);
    setErrorMn(null);

    const elapsedMs = Date.now() - questionStartedAt.current;
    const result = await saveAnswer({ questionId: current.id, elapsedMs, ...payload });

    setSubmitting(false);
    if (!result.ok) {
      setErrorMn(result.error.messageMn);
      return;
    }

    setAnsweredCount((count) => count + 1);
    enterQuestionAt(currentIndex + 1, blocks, questions);
  }

  useEffect(() => {
    if (phase.name !== "completing") return;

    let cancelled = false;
    (async () => {
      const result = await completeSession({});
      if (cancelled) return;

      if (!result.ok) {
        setErrorMn(result.error.messageMn);
        return;
      }

      sessionStorage.removeItem(STORAGE_KEY);
      if (resumeCode) router.push(`/r/${resumeCode}`);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.name]);

  async function handleStartOver() {
    sessionStorage.removeItem(STORAGE_KEY);
    await abandonSession({});
    setResumeCode(null);
    setBlocks([]);
    setQuestions([]);
    setCurrentIndex(0);
    setAnsweredCount(0);
    setPhase({ name: "entry" });
  }

  // --- entry ---------------------------------------------------------------
  if (phase.name === "entry") {
    return (
      <Container className="max-w-xl py-16">
        <h1 className="text-2xl font-bold text-ink">Эхлэхээсээ өмнө хэдэн зүйл асуя</h1>

        <form onSubmit={handleStart} className="mt-8 grid gap-6">
          <label className="grid gap-2">
            <span className="font-medium text-ink">Хэдэн ангид сурдаг вэ?</span>
            <select
              value={gradeLevel}
              onChange={(event) => setGradeLevel(Number(event.target.value))}
              className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-lg text-ink"
            >
              {[7, 8, 9, 10, 11, 12].map((grade) => (
                <option key={grade} value={grade}>
                  {grade}-р анги
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <span className="font-medium text-ink">Чиний зорилго</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEntryPath("EXPLORE")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${entryPath === "EXPLORE" ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft"}`}
              >
                Мэдэхгүй байна
              </button>
              <button
                type="button"
                onClick={() => setEntryPath("VALIDATE")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${entryPath === "VALIDATE" ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft"}`}
              >
                Аль хэдийн шийдсэн
              </button>
            </div>
          </div>

          {entryPath === "VALIDATE" && (
            <label className="grid gap-2">
              <span className="font-medium text-ink">Аль мэргэжлээ шалгуулах вэ?</span>
              <select
                value={chosenCareerSlug}
                onChange={(event) => setChosenCareerSlug(event.target.value)}
                className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-lg text-ink"
              >
                {careers.map((career) => (
                  <option key={career.slug} value={career.slug}>
                    {career.nameMn}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="grid gap-2">
            <span className="font-medium text-ink">
              Аймаг, дүүрэг <span className="font-normal text-ink-faint">(сонголтоор)</span>
            </span>
            <input
              type="text"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Жишээ нь: Улаанбаатар, Баянзүрх"
              className="rounded-xl border border-line bg-paper-raised px-4 py-3 text-lg text-ink"
            />
          </label>

          {errorMn && <p className="text-danger">{errorMn}</p>}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Уншиж байна..." : "Эхлүүлэх"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowResumeForm((prev) => !prev)}
            className="text-sm font-medium text-ink-soft underline underline-offset-2"
          >
            Өмнө нь эхэлсэн, кодтой юу?
          </button>
          {showResumeForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={resumeInput}
                onChange={(event) => setResumeInput(event.target.value)}
                placeholder="6 тэмдэгт код"
                maxLength={6}
                className="flex-1 rounded-xl border border-line bg-paper-raised px-4 py-3 text-center text-lg uppercase text-ink"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={submitting || resumeInput.trim().length !== 6}
                onClick={() => void handleResumeCode(resumeInput, false)}
              >
                Үргэлжлүүлэх
              </Button>
            </div>
          )}
        </div>
      </Container>
    );
  }

  // --- code reveal -----------------------------------------------------------
  if (phase.name === "code") {
    return (
      <Container className="max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Энэ кодоо бичиж ав</h1>
        <p className="mt-2 text-ink-soft">
          Дараа нь эсвэл өөр төхөөрөмж дээр үр дүнгээ харахад л энэ код хэрэгтэй болно. Бид
          үүнийг хадгалдаггүй тул алдвал сэргээх боломжгүй.
        </p>
        <div className="mx-auto mt-8 w-fit rounded-2xl border-2 border-accent bg-accent-soft px-10 py-6 text-4xl font-bold tracking-[0.3em] text-ink">
          {resumeCode}
        </div>
        <Button className="mt-8 w-full" size="lg" disabled={submitting} onClick={handleConfirmCode}>
          {submitting ? "Уншиж байна..." : "Бичиж авлаа, үргэлжлүүлэх"}
        </Button>
        {errorMn && <p className="mt-3 text-danger">{errorMn}</p>}
      </Container>
    );
  }

  // --- loading -----------------------------------------------------------
  if (phase.name === "loading") {
    return (
      <Container className="max-w-xl py-24 text-center text-ink-soft">Уншиж байна...</Container>
    );
  }

  // --- block intro -----------------------------------------------------------
  if (phase.name === "block-intro") {
    return (
      <Container className="max-w-xl py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Хэсэг {blocks.findIndex((b) => b.key === phase.block.key) + 1} / {blocks.length}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{phase.block.titleMn}</h1>
        <p className="mt-4 text-lg text-ink-soft">{phase.block.descriptionMn}</p>
        <Button className="mt-8 w-full" size="lg" onClick={() => setPhase({ name: "question" })}>
          Эхлэх
        </Button>
      </Container>
    );
  }

  // --- completing -----------------------------------------------------------
  if (phase.name === "completing") {
    return (
      <Container className="max-w-xl py-24 text-center">
        <p className="text-ink-soft">Үр дүнг тооцож байна...</p>
        {errorMn && (
          <div className="mt-4">
            <p className="text-danger">{errorMn}</p>
            <Button className="mt-3" onClick={() => setPhase({ name: "completing" })}>
              Дахин оролдох
            </Button>
          </div>
        )}
      </Container>
    );
  }

  // --- question -----------------------------------------------------------
  const question = questions[currentIndex];
  if (!question) {
    return <Container className="max-w-xl py-24 text-center text-ink-soft">Уншиж байна...</Container>;
  }

  return (
    <Container className="max-w-xl py-10">
      <div className="mb-8 flex items-center gap-4">
        <ProgressBar value={(answeredCount / Math.max(1, questions.length)) * 100} />
        <button
          type="button"
          onClick={() => void handleStartOver()}
          className="shrink-0 text-sm text-ink-faint underline underline-offset-2"
        >
          Дахин эхлэх
        </button>
      </div>

      <Card>
        <p className="text-xl font-semibold text-ink">{question.promptMn}</p>
        <div className="mt-6">
          {(question.kind === "SINGLE" ||
            question.kind === "ATTENTION_CHECK" ||
            question.kind === "TIMED_ABILITY") && (
            <ChoiceQuestion
              question={question}
              disabled={submitting}
              onAnswer={(optionId) => void submitAnswer({ optionId })}
              onTimeout={() => void submitAnswer({})}
            />
          )}
          {question.kind === "RANK" && (
            <RankQuestion
              question={question}
              disabled={submitting}
              onAnswer={(rankOrder) => void submitAnswer({ rankOrder })}
            />
          )}
          {question.kind === "SLIDER" && (
            <SliderQuestion
              question={question}
              disabled={submitting}
              onAnswer={(sliderValue) => void submitAnswer({ sliderValue })}
            />
          )}
        </div>
      </Card>

      <button
        type="button"
        disabled={submitting}
        onClick={() => void submitAnswer({})}
        className="mt-4 text-sm font-medium text-ink-faint underline underline-offset-2 disabled:opacity-40"
      >
        Алгасах →
      </button>

      {errorMn && <p className="mt-4 text-danger">{errorMn}</p>}
    </Container>
  );
}
