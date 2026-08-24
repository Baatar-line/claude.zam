/**
 * DEVELOPMENT FIXTURE — not content.
 *
 * Its job is to prove the pipeline: migrate, validate, seed, score. Every
 * number in it is a placeholder, `needsVerification` is true throughout, and
 * `kind: "fixture"` exempts it from the §7 sourcing contract that the real
 * dataset must satisfy. §7 replaces this file with 30 sourced careers.
 *
 * `bun run seed` prints a warning when it writes this dataset, so it can
 * never be mistaken for shippable content.
 */
import type { Trait } from "@/lib/scoring/traits";
import { ALL_TRAITS } from "@/lib/scoring/traits";

import type { SeedDatasetInput } from "../schema";

/** Fills the traits a career does not care about with 0, so the authored
 *  object stays readable while the schema still sees all 23 keys. */
function weights(partial: Partial<Record<Trait, number>>): Record<Trait, number> {
  const full = {} as Record<Trait, number>;
  for (const trait of ALL_TRAITS) full[trait] = partial[trait] ?? 0;
  return full;
}

const PLACEHOLDER_SALARY_START = 1_000_000;
const PLACEHOLDER_SALARY_MID = 2_500_000;

export const fixtureDataset: SeedDatasetInput = {
  kind: "fixture",

  blocks: [
    {
      key: "chadvar",
      order: 0,
      titleMn: "Чадвар",
      descriptionMn: "Энэ хэсэгт цаг хэмжсэн бодлого байна — бод, харин бүү яараарай.",
    },
    {
      key: "sonirhol",
      order: 1,
      titleMn: "Сонирхол",
      descriptionMn: "Зөв, буруу хариулт байхгүй — юу чиний сонирхлыг татдгийг л сонго.",
    },
    {
      key: "zan-tolov",
      order: 2,
      titleMn: "Зан төлөв",
      descriptionMn: "Чи ямар хүн болохыг асууна — өдөр тутамдаа ихэвчлэн ямар байдгаараа хариул.",
    },
    {
      key: "unet-zuil",
      order: 3,
      titleMn: "Үнэт зүйл",
      descriptionMn: "Ажлаасаа юуг хамгийн их хүсдгээ бод.",
    },
  ],

  questions: [
    {
      key: "chadvar.logic.01",
      blockId: "chadvar",
      order: 0,
      variant: "BOTH",
      kind: "TIMED_ABILITY",
      timeLimitSec: 45,
      promptMn: "2, 4, 8, 16 ... дараагийн тоо аль нь вэ?",
      options: [
        { order: 0, labelMn: "20", traitDeltas: { LOGIC: 0 } },
        { order: 1, labelMn: "24", traitDeltas: { LOGIC: 0 } },
        { order: 2, labelMn: "32", traitDeltas: { LOGIC: 3, NUMERIC: 1 }, isCorrect: true },
        { order: 3, labelMn: "64", traitDeltas: { LOGIC: 0 } },
      ],
    },
    {
      key: "chadvar.numeric.01",
      blockId: "chadvar",
      order: 1,
      variant: "BOTH",
      kind: "TIMED_ABILITY",
      timeLimitSec: 45,
      promptMn: "Нэг дэвтэр 3000 төгрөг. 7 дэвтэр хэдэн төгрөг вэ?",
      options: [
        { order: 0, labelMn: "18 000", traitDeltas: { NUMERIC: 0 } },
        { order: 1, labelMn: "21 000", traitDeltas: { NUMERIC: 3, PROCESSING: 1 }, isCorrect: true },
        { order: 2, labelMn: "24 000", traitDeltas: { NUMERIC: 0 } },
      ],
    },
    {
      key: "chadvar.spatial.01",
      blockId: "chadvar",
      order: 2,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 60,
      promptMn: "Шоог зүүн тийш нэг удаа эргүүлбэл дээд тал нь аль нь болох вэ?",
      options: [
        { order: 0, labelMn: "Урд тал", traitDeltas: { SPATIAL: 3 }, isCorrect: true },
        { order: 1, labelMn: "Ар тал", traitDeltas: { SPATIAL: 0 } },
        { order: 2, labelMn: "Доод тал", traitDeltas: { SPATIAL: 0 } },
      ],
    },
    {
      key: "chadvar.logic.02",
      blockId: "chadvar",
      order: 3,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 40,
      promptMn: "А нь Б-гээс өндөр. В нь Б-гээс намхан. Хамгийн намхан нь хэн бэ?",
      options: [
        { order: 0, labelMn: "А", traitDeltas: { LOGIC: 0 } },
        { order: 1, labelMn: "Б", traitDeltas: { LOGIC: 0 } },
        { order: 2, labelMn: "В", traitDeltas: { LOGIC: 3 }, isCorrect: true },
        { order: 3, labelMn: "Мэдэхгүй", traitDeltas: { LOGIC: 0 } },
      ],
    },
    {
      key: "chadvar.numeric.02",
      blockId: "chadvar",
      order: 4,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 60,
      promptMn: "Куртка 40 хувиар хямдарч 30 000₮ болжээ. Анхны үнэ хэд байсан бэ?",
      options: [
        { order: 0, labelMn: "42 000₮", traitDeltas: { NUMERIC: 0 } },
        { order: 1, labelMn: "48 000₮", traitDeltas: { NUMERIC: 0 } },
        { order: 2, labelMn: "50 000₮", traitDeltas: { NUMERIC: 3, LOGIC: 1 }, isCorrect: true },
        { order: 3, labelMn: "70 000₮", traitDeltas: { NUMERIC: 0 } },
      ],
    },
    {
      key: "chadvar.spatial.02",
      blockId: "chadvar",
      order: 5,
      variant: "JUNIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 45,
      promptMn:
        "Ширээн дээр ном зүүн гар талд, дэвтэр баруун гар талд байрлажээ. Ширээг 180 градус эргүүлбэл дэвтэр аль тал руу шилжих вэ?",
      options: [
        { order: 0, labelMn: "Зүүн тийш", traitDeltas: { SPATIAL: 3 }, isCorrect: true },
        { order: 1, labelMn: "Баруун тийш", traitDeltas: { SPATIAL: 0 } },
        { order: 2, labelMn: "Урд тийш", traitDeltas: { SPATIAL: 0 } },
        { order: 3, labelMn: "Хойш", traitDeltas: { SPATIAL: 0 } },
      ],
    },
    {
      key: "chadvar.verbal.01",
      blockId: "chadvar",
      order: 6,
      variant: "BOTH",
      kind: "TIMED_ABILITY",
      timeLimitSec: 25,
      promptMn: "Ном нь Уншихтай адил бол, Хутга нь юутай адил вэ?",
      options: [
        { order: 0, labelMn: "Зүсэх", traitDeltas: { VERBAL: 3 }, isCorrect: true },
        { order: 1, labelMn: "Идэх", traitDeltas: { VERBAL: 0 } },
        { order: 2, labelMn: "Хийх", traitDeltas: { VERBAL: 0 } },
        { order: 3, labelMn: "Тоглох", traitDeltas: { VERBAL: 0 } },
      ],
    },
    {
      key: "chadvar.verbal.02",
      blockId: "chadvar",
      order: 7,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 25,
      promptMn: "\"Мунхаг\" гэдэг үгийн эсрэг утгатай үг аль нь вэ?",
      options: [
        { order: 0, labelMn: "Ухаалаг", traitDeltas: { VERBAL: 3 }, isCorrect: true },
        { order: 1, labelMn: "Залхуу", traitDeltas: { VERBAL: 0 } },
        { order: 2, labelMn: "Түргэн", traitDeltas: { VERBAL: 0 } },
        { order: 3, labelMn: "Дорой", traitDeltas: { VERBAL: 0 } },
      ],
    },
    {
      key: "chadvar.memory.01",
      blockId: "chadvar",
      order: 8,
      variant: "BOTH",
      kind: "TIMED_ABILITY",
      timeLimitSec: 20,
      promptMn:
        "Дараах үгсийг санаарай: ном, гар, нар, мод. Эдгээрийн аль нь жагсаалтад БАЙГААГҮЙ вэ?",
      options: [
        { order: 0, labelMn: "Ном", traitDeltas: { MEMORY: 0 } },
        { order: 1, labelMn: "Гар", traitDeltas: { MEMORY: 0 } },
        { order: 2, labelMn: "Ус", traitDeltas: { MEMORY: 3 }, isCorrect: true },
        { order: 3, labelMn: "Мод", traitDeltas: { MEMORY: 0 } },
      ],
    },
    {
      key: "chadvar.memory.02",
      blockId: "chadvar",
      order: 9,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 20,
      promptMn:
        "Дараах үгсийг санаарай: гал, ус, мод, чулуу, салхи, шороо. Эдгээрийн аль нь жагсаалтад БАЙГААГҮЙ вэ?",
      options: [
        { order: 0, labelMn: "Мод", traitDeltas: { MEMORY: 0 } },
        { order: 1, labelMn: "Гал", traitDeltas: { MEMORY: 0 } },
        { order: 2, labelMn: "Тэнгэр", traitDeltas: { MEMORY: 3 }, isCorrect: true },
        { order: 3, labelMn: "Салхи", traitDeltas: { MEMORY: 0 } },
      ],
    },
    {
      key: "chadvar.processing.01",
      blockId: "chadvar",
      order: 10,
      variant: "BOTH",
      kind: "TIMED_ABILITY",
      timeLimitSec: 15,
      promptMn: "Доорх эгнээнд аль байрлал дахь тоо бусдаас ялгаатай вэ? 82 - 82 - 28 - 82",
      options: [
        { order: 0, labelMn: "1-р байрлал", traitDeltas: { PROCESSING: 0 } },
        { order: 1, labelMn: "2-р байрлал", traitDeltas: { PROCESSING: 0 } },
        { order: 2, labelMn: "3-р байрлал", traitDeltas: { PROCESSING: 3 }, isCorrect: true },
        { order: 3, labelMn: "4-р байрлал", traitDeltas: { PROCESSING: 0 } },
      ],
    },
    {
      key: "chadvar.processing.02",
      blockId: "chadvar",
      order: 11,
      variant: "SENIOR",
      kind: "TIMED_ABILITY",
      timeLimitSec: 12,
      promptMn:
        "Доорх эгнээнд аль байрлал дахь тэмдэгт бусдаас ялгаатай вэ? XY - XY - YX - XY - XY",
      options: [
        { order: 0, labelMn: "1", traitDeltas: { PROCESSING: 0 } },
        { order: 1, labelMn: "2", traitDeltas: { PROCESSING: 0 } },
        { order: 2, labelMn: "3", traitDeltas: { PROCESSING: 3 }, isCorrect: true },
        { order: 3, labelMn: "4", traitDeltas: { PROCESSING: 0 } },
        { order: 4, labelMn: "5", traitDeltas: { PROCESSING: 0 } },
      ],
    },
    {
      key: "sonirhol.oroi.01",
      blockId: "sonirhol",
      order: 0,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Чөлөөт цагаараа аль нь чамд илүү сонирхолтой вэ?",
      options: [
        { order: 0, labelMn: "Эвдэрсэн юм задалж засах", traitDeltas: { REALISTIC: 3, LOGIC: 1 } },
        { order: 1, labelMn: "Ямар нэг зүйл яагаад тэгдгийг олж мэдэх", traitDeltas: { INVESTIGATIVE: 3 } },
        { order: 2, labelMn: "Зурах, бичих, хөгжим тоглох", traitDeltas: { ARTISTIC: 3, CREATIVITY: 1 } },
        { order: 3, labelMn: "Найзуудтайгаа ярилцаж, тусалж өнгөрөөх", traitDeltas: { SOCIAL: 3, HELPING: 1 } },
      ],
    },
    {
      key: "sonirhol.bag.01",
      blockId: "sonirhol",
      order: 1,
      variant: "BOTH",
      kind: "RANK",
      promptMn: "Багаар ажиллахад аль үүрэг чамд илүү таарах вэ? Эрэмбэлээрэй.",
      options: [
        { order: 0, labelMn: "Төлөвлөгөө гаргаж, бусдыг чиглүүлэх", traitDeltas: { ENTERPRISING: 3, EXTRAVERSION: 1 } },
        { order: 1, labelMn: "Судалгаа хийж, мэдээлэл цуглуулах", traitDeltas: { INVESTIGATIVE: 3 } },
        { order: 2, labelMn: "Гараар хийж, угсарч бүтээх", traitDeltas: { REALISTIC: 3 } },
        { order: 3, labelMn: "Бүртгэл хөтөлж, эмх цэгцтэй байлгах", traitDeltas: { CONVENTIONAL: 3 } },
      ],
    },
    {
      key: "sonirhol.medeelel.01",
      blockId: "sonirhol",
      order: 2,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Ном сонгохдоо аль төрлийг илүү сонирхох вэ?",
      options: [
        { order: 0, labelMn: "Адал явдалт, практик зөвлөгөө бүхий ном", traitDeltas: { REALISTIC: 2 } },
        { order: 1, labelMn: "Шинжлэх ухаан, нээлтийн тухай ном", traitDeltas: { INVESTIGATIVE: 3 } },
        { order: 2, labelMn: "Намтар, сэтгэл судлалын ном", traitDeltas: { SOCIAL: 2 } },
        { order: 3, labelMn: "Урлаг, яруу найргийн ном", traitDeltas: { ARTISTIC: 3 } },
      ],
    },
    {
      key: "sonirhol.songolt.01",
      blockId: "sonirhol",
      order: 3,
      variant: "BOTH",
      kind: "RANK",
      promptMn: "Долоо хоногийн амралтаараа юуг илүү хийхийг хүсэх вэ? Эрэмбэлээрэй.",
      options: [
        { order: 0, labelMn: "Жижиг бизнес эсвэл төсөл эхлүүлэх", traitDeltas: { ENTERPRISING: 3 } },
        { order: 1, labelMn: "Сайн дурын ажилд оролцох", traitDeltas: { SOCIAL: 3, HELPING: 1 } },
        { order: 2, labelMn: "Гар урлал хийх, засвар хийх", traitDeltas: { REALISTIC: 3 } },
        { order: 3, labelMn: "Дэвтэр, тооцоо цэгцлэх", traitDeltas: { CONVENTIONAL: 3 } },
      ],
    },
    {
      key: "sonirhol.baiguullaga.01",
      blockId: "sonirhol",
      order: 4,
      variant: "SENIOR",
      kind: "SINGLE",
      promptMn: "Ирээдүйн ажлын байрандаа аль орчинд илүү тохирох вэ?",
      options: [
        { order: 0, labelMn: "Тогтсон дүрэм журамтай, тоо баримттай ажилладаг газар", traitDeltas: { CONVENTIONAL: 3 } },
        { order: 1, labelMn: "Багийг удирдаж, шийдвэр гаргадаг газар", traitDeltas: { ENTERPRISING: 3 } },
        { order: 2, labelMn: "Судалгаа, шинжилгээ хийдэг газар", traitDeltas: { INVESTIGATIVE: 3 } },
        { order: 3, labelMn: "Хүмүүстэй байнга харьцдаг газар", traitDeltas: { SOCIAL: 3 } },
      ],
    },
    {
      key: "sonirhol.chiglel.01",
      blockId: "sonirhol",
      order: 5,
      variant: "BOTH",
      kind: "SLIDER",
      promptMn: "Аль нь чамд илүү тохирох вэ?",
      options: [
        { order: 0, labelMn: "Гараараа зүйл хийх, засах", traitDeltas: { REALISTIC: 4 } },
        { order: 1, labelMn: "Санаагаа зурж, бичиж илэрхийлэх", traitDeltas: { ARTISTIC: 4 } },
      ],
    },
    {
      key: "zan-tolov.tailwan.01",
      blockId: "zan-tolov",
      order: 0,
      variant: "BOTH",
      kind: "SLIDER",
      promptMn: "Шинэ хүмүүстэй танилцахад чи ямар байдаг вэ?",
      options: [
        { order: 0, labelMn: "Эхлээд ажиглаад чимээгүй байдаг", traitDeltas: { EXTRAVERSION: 0, OPENNESS: 1 } },
        { order: 1, labelMn: "Шууд ярьж эхэлдэг", traitDeltas: { EXTRAVERSION: 4, SOCIAL: 1 } },
      ],
    },
    {
      key: "zan-tolov.hariutslaga.01",
      blockId: "zan-tolov",
      order: 1,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Даалгавраа ихэвчлэн хэзээ хийдэг вэ?",
      options: [
        { order: 0, labelMn: "Өгсөн өдрөө нь эхэлдэг", traitDeltas: { CONSCIENTIOUSNESS: 3, STABILITY: 1 } },
        { order: 1, labelMn: "Дунд хугацаанд нь хийдэг", traitDeltas: { CONSCIENTIOUSNESS: 2 } },
        { order: 2, labelMn: "Сүүлийн шөнө нь хийдэг", traitDeltas: { CONSCIENTIOUSNESS: 0, OPENNESS: 1 } },
      ],
    },
    {
      key: "zan-tolov.anhaaral.01",
      blockId: "zan-tolov",
      order: 2,
      variant: "BOTH",
      kind: "ATTENTION_CHECK",
      promptMn: "Доорх хариултуудаас \"Гурав\" гэснийг сонгоно уу.",
      options: [
        { order: 0, labelMn: "Нэг", traitDeltas: {} },
        { order: 1, labelMn: "Хоёр", traitDeltas: {} },
        { order: 2, labelMn: "Гурав", traitDeltas: {}, isCorrect: true },
        { order: 3, labelMn: "Дөрөв", traitDeltas: {} },
      ],
    },
    {
      key: "zan-tolov.evseg.01",
      blockId: "zan-tolov",
      order: 3,
      variant: "BOTH",
      kind: "SLIDER",
      promptMn: "Найзтайгаа санал зөрөхөд чи ямар байдаг вэ?",
      options: [
        { order: 0, labelMn: "Өөрийн байр сууриа тууштай хамгаалдаг", traitDeltas: { AGREEABLENESS: 0 } },
        { order: 1, labelMn: "Эвлэрэх аргыг эрж хайдаг", traitDeltas: { AGREEABLENESS: 4 } },
      ],
    },
    {
      key: "zan-tolov.shine.01",
      blockId: "zan-tolov",
      order: 4,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Шинэ хичээл, дадлага эхлэхэд чи ямар байдаг вэ?",
      options: [
        { order: 0, labelMn: "Урам зоригтой, шууд туршиж үздэг", traitDeltas: { OPENNESS: 3 } },
        { order: 1, labelMn: "Эхлээд бусдыг ажиглаж, дараа нь оролддог", traitDeltas: { OPENNESS: 1, AGREEABLENESS: 1 } },
        { order: 2, labelMn: "Танил, дассан аргаа илүүд үздэг", traitDeltas: { CONSCIENTIOUSNESS: 2 } },
        { order: 3, labelMn: "Шаардлагатай болтол оролддоггүй", traitDeltas: { OPENNESS: 0 } },
      ],
    },
    {
      key: "zan-tolov.daramt.01",
      blockId: "zan-tolov",
      order: 5,
      variant: "BOTH",
      kind: "SLIDER",
      promptMn: "Шалгалтын өмнөх өдөр чи ямар байдаг вэ?",
      options: [
        { order: 0, labelMn: "Санаа зовж, тайван сууж чаддаггүй", traitDeltas: { STABILITY: 0 } },
        { order: 1, labelMn: "Тайван, төлөвлөгөөныхөө дагуу давтдаг", traitDeltas: { STABILITY: 4 } },
      ],
    },
    {
      key: "zan-tolov.anhaaral.02",
      blockId: "zan-tolov",
      order: 6,
      variant: "BOTH",
      kind: "ATTENTION_CHECK",
      promptMn: "Анхаарлаа шалгая: доорх сонголтуудаас \"Тав\" гэснийг сонгоно уу.",
      options: [
        { order: 0, labelMn: "Гурав", traitDeltas: {} },
        { order: 1, labelMn: "Дөрөв", traitDeltas: {} },
        { order: 2, labelMn: "Тав", traitDeltas: {}, isCorrect: true },
        { order: 3, labelMn: "Зургаа", traitDeltas: {} },
      ],
    },
    {
      key: "unet-zuil.ajil.01",
      blockId: "unet-zuil",
      order: 0,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Ирээдүйн ажлаасаа юуг хамгийн их хүсэх вэ?",
      options: [
        { order: 0, labelMn: "Тогтвортой, найдвартай байх", traitDeltas: { STABILITY_V: 3 } },
        { order: 1, labelMn: "Сайн цалин", traitDeltas: { INCOME: 3 } },
        { order: 2, labelMn: "Хүмүүст тусалдаг байх", traitDeltas: { HELPING: 3 } },
        { order: 3, labelMn: "Өөрийн санааг хэрэгжүүлэх эрх чөлөө", traitDeltas: { AUTONOMY: 3, CREATIVITY: 1 } },
      ],
    },
    {
      key: "unet-zuil.erembe.01",
      blockId: "unet-zuil",
      order: 1,
      variant: "SENIOR",
      kind: "RANK",
      promptMn: "Эдгээрийг чамд чухлаас нь эрэмбэлээрэй.",
      options: [
        { order: 0, labelMn: "Нэр хүндтэй мэргэжил", traitDeltas: { PRESTIGE: 3 } },
        { order: 1, labelMn: "Бүтээлч ажил", traitDeltas: { CREATIVITY: 3 } },
        { order: 2, labelMn: "Бие даан шийдвэр гаргах", traitDeltas: { AUTONOMY: 3 } },
        { order: 3, labelMn: "Найдвартай орлого", traitDeltas: { INCOME: 2, STABILITY_V: 2 } },
      ],
    },
    {
      key: "unet-zuil.medreh.01",
      blockId: "unet-zuil",
      order: 2,
      variant: "JUNIOR",
      kind: "SINGLE",
      promptMn: "Том болоод ажилдаа юу мэдрэхийг хамгийн их хүсэх вэ?",
      options: [
        { order: 0, labelMn: "Хүмүүс намайг хүндэлж, магтаасай", traitDeltas: { PRESTIGE: 3 } },
        { order: 1, labelMn: "Шинэ санаа гаргаж, өөрөө бүтээж байгаасай", traitDeltas: { CREATIVITY: 3 } },
        { order: 2, labelMn: "Тогтвортой, найдвартай байгаасай", traitDeltas: { STABILITY_V: 3 } },
        { order: 3, labelMn: "Их мөнгө олоосой", traitDeltas: { INCOME: 3 } },
      ],
    },
    {
      key: "unet-zuil.tsag.01",
      blockId: "unet-zuil",
      order: 3,
      variant: "BOTH",
      kind: "SLIDER",
      promptMn: "Ажлын талаар аль нь чамд илүү таалагдах вэ?",
      options: [
        { order: 0, labelMn: "Тогтмол цагтай, тодорхой дүрэмтэй ажил", traitDeltas: { STABILITY_V: 4 } },
        { order: 1, labelMn: "Өөрийн цагаа өөрөө удирдах эрх чөлөөтэй ажил", traitDeltas: { AUTONOMY: 4 } },
      ],
    },
    {
      key: "unet-zuil.tuslamj.01",
      blockId: "unet-zuil",
      order: 4,
      variant: "BOTH",
      kind: "SINGLE",
      promptMn: "Ажлын гурван санал ирвэл алийг нь сонгох вэ?",
      options: [
        { order: 0, labelMn: "Хүмүүст тусалж, тэдний амьдралыг сайжруулдаг ажил", traitDeltas: { HELPING: 3 } },
        { order: 1, labelMn: "Их цалинтай, тав тухтай ажил", traitDeltas: { INCOME: 3 } },
        { order: 2, labelMn: "Нэр хүндтэй, олонд танигдсан байгууллагын ажил", traitDeltas: { PRESTIGE: 3 } },
        { order: 3, labelMn: "Шинэ бүтээл, шинэ санаа гаргадаг ажил", traitDeltas: { CREATIVITY: 3 } },
      ],
    },
  ],

  careers: [
    {
      slug: "emch",
      nameMn: "Хүний их эмч",
      categoryMn: "Эрүүл мэнд",
      summaryMn: "Өвчтөнийг үзэж оношилж, эмчилгээг хариуцдаг эмнэлгийн мэргэжилтэн.",
      dayInLifeMn:
        "Өглөө эрт эргэлтээр эхэлж, хэвтэн эмчлүүлэгч бүрийн байдлыг шалгана. Өдрийн турш ампулаар өвчтөн үзэж, шинжилгээний хариу уншиж, оношоо нягтална. Хооронд нь өвчний түүх, тайлан бичих цаг гарна. Оройдоо ээлжийн эмчид мэдээллээ хүлээлгэж өгнө.",
      traitWeights: weights({
        LOGIC: 0.8, SPATIAL: 0.4, VERBAL: 0.7, NUMERIC: 0.5, MEMORY: 0.9, PROCESSING: 0.6,
        REALISTIC: 0.5, INVESTIGATIVE: 0.9, ARTISTIC: 0.1, SOCIAL: 0.8, ENTERPRISING: 0.3, CONVENTIONAL: 0.6,
        OPENNESS: 0.5, CONSCIENTIOUSNESS: 0.9, EXTRAVERSION: 0.5, AGREEABLENESS: 0.8, STABILITY: 0.9,
        STABILITY_V: 0.7, INCOME: 0.5, CREATIVITY: 0.2, HELPING: 1.0, AUTONOMY: 0.3, PRESTIGE: 0.7,
      }),
      demandNow: "HIGH",
      demandFuture: "HIGH",
      aiRisk: "LOW",
      aiRiskNoteMn:
        "Хиймэл оюун шинжилгээний зураг уншихад тусална, харин өвчтөнтэй ярьж шийдвэр гаргах хэсэг нь эмчид үлдэнэ.",
      saturation: "BALANCED",
      gradsPerYear: null,
      openingsPerYear: null,
      salaryStartMnt: PLACEHOLDER_SALARY_START,
      salaryMidMnt: PLACEHOLDER_SALARY_MID,
      yearsOfStudy: 6,
      yearsToIndependence: 9,
      requiredEeshSubjects: ["Биологи", "Хими"],
      adjacentCareerSlugs: ["bagsh", "programm-hangamjiin-injener", "barilgiin-injener"],
      needsVerification: true,
      realityChecks: [
        {
          order: 0,
          questionMn: "Их сургуулиа төгсөнгүүт бие даан өвчтөн үздэг үү?",
          factMn:
            "Үгүй. Төгссөний дараа мэргэшүүлэх сургалт үргэлжилдэг ба энэ хугацаанд ахлах эмчийн хяналтад ажилладаг.",
          weight: 4,
        },
        {
          order: 1,
          questionMn: "Эмчийн ажлын цагийн хэдэн хувь нь бичиг баримт вэ?",
          factMn:
            "Олон эмч ажлын цагийнхаа мэдэгдэхүйц хэсгийг өвчний түүх, тайлан бичихэд зарцуулдаг.",
          weight: 3,
        },
        {
          order: 2,
          questionMn: "Шөнийн ээлж хэр байнга байдаг вэ?",
          factMn:
            "Эмнэлгийн ихэнх салбарт шөнийн болон амралтын өдрийн ээлж нь ажлын хэвийн хэсэг байдаг.",
          weight: 3,
        },
      ],
      roadmapSteps: [
        {
          key: "emch.9.subject.biology",
          gradeLevel: 9,
          category: "SUBJECT",
          titleMn: "Биологийн суурь мэдлэгээ бэхжүүл",
          detailMn: "Эс, эрхтэн тогтолцооны сэдвүүдийг дутуу орхилгүй, тухай бүрд нь ойлгож яв.",
        },
        {
          key: "emch.11.experience.volunteer",
          gradeLevel: 11,
          category: "EXPERIENCE",
          titleMn: "Эмнэлгийн орчинтой танилц",
          detailMn: "Сайн дурын ажил, нээлттэй өдөрлөгөөр дамжуулан ажлын бодит орчныг өөрөө үз.",
        },
      ],
    },
    {
      slug: "programm-hangamjiin-injener",
      nameMn: "Программ хангамжийн инженер",
      categoryMn: "Технологи",
      summaryMn: "Хүмүүсийн ашигладаг программ, системийг зохиож бүтээдэг мэргэжилтэн.",
      dayInLifeMn:
        "Өглөө багийнхантайгаа богино уулзалт хийж, өнөөдөр юун дээр ажиллахаа тохирно. Дараа нь ихэнх цагийг бусдын бичсэн кодыг уншиж, алдаа хайж, өөрийн хэсгээ бичихэд зарцуулна. Үдээс хойш кодоо хянуулж, санал авч засна. Заримдаа ажиллахаа больсон системийг яаралтай засах шаардлага гарна.",
      traitWeights: weights({
        LOGIC: 1.0, SPATIAL: 0.5, VERBAL: 0.5, NUMERIC: 0.7, MEMORY: 0.5, PROCESSING: 0.8,
        REALISTIC: 0.3, INVESTIGATIVE: 0.9, ARTISTIC: 0.4, SOCIAL: 0.3, ENTERPRISING: 0.4, CONVENTIONAL: 0.5,
        OPENNESS: 0.8, CONSCIENTIOUSNESS: 0.7, EXTRAVERSION: 0.3, AGREEABLENESS: 0.4, STABILITY: 0.6,
        STABILITY_V: 0.4, INCOME: 0.8, CREATIVITY: 0.7, HELPING: 0.3, AUTONOMY: 0.8, PRESTIGE: 0.5,
      }),
      demandNow: "HIGH",
      demandFuture: "HIGH",
      aiRisk: "MEDIUM",
      aiRiskNoteMn:
        "Хиймэл оюун энгийн код бичих ажлыг ихээхэн авна, харин юуг яагаад барихаа шийдэх, системийг бүтнээр нь харах хэсэг нь хүнд үлдэнэ.",
      saturation: "BALANCED",
      gradsPerYear: null,
      openingsPerYear: null,
      salaryStartMnt: PLACEHOLDER_SALARY_START,
      salaryMidMnt: PLACEHOLDER_SALARY_MID,
      yearsOfStudy: 4,
      yearsToIndependence: 6,
      requiredEeshSubjects: ["Математик"],
      adjacentCareerSlugs: ["emch", "barilgiin-injener", "bagsh"],
      needsVerification: true,
      realityChecks: [
        {
          order: 0,
          questionMn: "Программист өдрийн ихэнх цагт шинэ код бичдэг үү?",
          factMn:
            "Үгүй. Бусдын бичсэн кодыг унших, алдаа хайх, засах нь шинэ код бичихээс их цаг авдаг.",
          weight: 4,
        },
        {
          order: 1,
          questionMn: "Их сургуульд заасан программчлалын хэл ажил дээр хэрэг болох уу?",
          factMn:
            "Хэрэглэгддэг хэл, хэрэгсэл байнга солигддог тул шинийг сурах чадвар нь тодорхой нэг хэлний мэдлэгээс чухал.",
          weight: 3,
        },
        {
          order: 2,
          questionMn: "Энэ ажил ганцаараа хийгддэг үү?",
          factMn:
            "Ихэнх төсөл багаар хийгддэг ба өөрийн шийдлээ бусдад тайлбарлах, тохирох чадвар шаарддаг.",
          weight: 3,
        },
      ],
      roadmapSteps: [
        {
          key: "programm.8.skill.first-program",
          gradeLevel: 8,
          category: "SKILL",
          titleMn: "Эхний программаа бич",
          detailMn: "Ямар нэг жижиг тоглоом эсвэл тооцоолуур бичиж, өөрөө ажиллуулж үз.",
        },
        {
          key: "programm.10.activity.olympiad",
          gradeLevel: 10,
          category: "ACTIVITY",
          titleMn: "Мэдээллийн технологийн олимпиадад оролц",
          detailMn: "Бодлого бодох дасгал нь логик сэтгэлгээг ажлын түвшинд ойртуулдаг.",
        },
      ],
    },
    {
      slug: "barilgiin-injener",
      nameMn: "Барилгын инженер",
      categoryMn: "Инженер",
      summaryMn: "Барилга байгууламжийн бүтцийг тооцоолж, зураг төслийг нь хариуцдаг инженер.",
      dayInLifeMn:
        "Өглөө талбай дээр очиж, ажлын явц зурагтай тохирч байгаа эсэхийг шалгана. Дараа нь оффист буцаж ирээд ачааллын тооцоо хийж, зургаа шинэчилнэ. Үдээс хойш гүйцэтгэгчтэй уулзаж, материалын өөрчлөлтийг зөвшөөрөх эсэхээ шийднэ. Өдрийн эцэст хийсэн шалгалтаа баримтжуулна.",
      traitWeights: weights({
        LOGIC: 0.8, SPATIAL: 0.9, VERBAL: 0.4, NUMERIC: 0.8, MEMORY: 0.5, PROCESSING: 0.5,
        REALISTIC: 0.9, INVESTIGATIVE: 0.6, ARTISTIC: 0.3, SOCIAL: 0.5, ENTERPRISING: 0.5, CONVENTIONAL: 0.8,
        OPENNESS: 0.4, CONSCIENTIOUSNESS: 0.9, EXTRAVERSION: 0.4, AGREEABLENESS: 0.5, STABILITY: 0.7,
        STABILITY_V: 0.7, INCOME: 0.6, CREATIVITY: 0.4, HELPING: 0.4, AUTONOMY: 0.4, PRESTIGE: 0.5,
      }),
      demandNow: "MEDIUM",
      demandFuture: "MEDIUM",
      aiRisk: "MEDIUM",
      aiRiskNoteMn:
        "Тооцоо, зураг боловсруулах хэсгийг программ хурдасгана, харин талбай дээрх шийдвэр, хариуцлагыг инженер өөрөө үүрнэ.",
      saturation: "BALANCED",
      gradsPerYear: null,
      openingsPerYear: null,
      salaryStartMnt: PLACEHOLDER_SALARY_START,
      salaryMidMnt: PLACEHOLDER_SALARY_MID,
      yearsOfStudy: 4,
      yearsToIndependence: 7,
      requiredEeshSubjects: ["Математик", "Физик"],
      adjacentCareerSlugs: ["programm-hangamjiin-injener", "emch", "bagsh"],
      needsVerification: true,
      realityChecks: [
        {
          order: 0,
          questionMn: "Барилгын инженер оффис дээр ажилладаг уу, талбай дээр үү?",
          factMn: "Хоёулаа. Зураг төсөл оффист хийгддэг бол гүйцэтгэлийн хяналт талбай дээр явагдана.",
          weight: 2,
        },
        {
          order: 1,
          questionMn: "Тооцооны алдаа гарвал юу болох вэ?",
          factMn:
            "Алдаа хүний аюулгүй байдалд шууд нөлөөлдөг тул давхар шалгалт, гарын үсэг, хувийн хариуцлага чанд байдаг.",
          weight: 4,
        },
        {
          order: 2,
          questionMn: "Бие даан төсөл хариуцахад хэр хугацаа орох вэ?",
          factMn:
            "Төгссөний дараа туршлагатай инженерийн хяналтад хэдэн жил ажилласны эцэст бие даан төсөл хариуцдаг.",
          weight: 4,
        },
      ],
      roadmapSteps: [],
    },
    {
      slug: "bagsh",
      nameMn: "Ерөнхий боловсролын багш",
      categoryMn: "Боловсрол",
      summaryMn: "Сурагчдад хичээл заан, тэдний суралцах явцыг хөтөлдөг мэргэжилтэн.",
      dayInLifeMn:
        "Өглөө хичээл эхлэхээс өмнө материалаа бэлдэж, ангиа бэлэн болгоно. Өдөрт хэд хэдэн хичээл заах ба анги бүрийн хурд өөр өөр байдаг. Завсарлагаанаар сурагчидтай ярилцаж, ойлгоогүй хэсгийг тайлбарлана. Хичээл тарсны дараа дэвтэр шалгаж, маргаашийн хичээлээ төлөвлөнө.",
      traitWeights: weights({
        LOGIC: 0.5, SPATIAL: 0.3, VERBAL: 0.9, NUMERIC: 0.4, MEMORY: 0.6, PROCESSING: 0.5,
        REALISTIC: 0.2, INVESTIGATIVE: 0.5, ARTISTIC: 0.5, SOCIAL: 1.0, ENTERPRISING: 0.5, CONVENTIONAL: 0.6,
        OPENNESS: 0.6, CONSCIENTIOUSNESS: 0.8, EXTRAVERSION: 0.7, AGREEABLENESS: 0.9, STABILITY: 0.8,
        STABILITY_V: 0.8, INCOME: 0.3, CREATIVITY: 0.6, HELPING: 0.9, AUTONOMY: 0.4, PRESTIGE: 0.4,
      }),
      demandNow: "MEDIUM",
      demandFuture: "MEDIUM",
      aiRisk: "LOW",
      aiRiskNoteMn:
        "Хиймэл оюун дасгал бэлдэх, шалгах ажлыг хөнгөвчилнө, харин сурагчийг сонирхуулж, урам өгөх хэсэг нь багшид үлдэнэ.",
      saturation: "BALANCED",
      gradsPerYear: null,
      openingsPerYear: null,
      salaryStartMnt: PLACEHOLDER_SALARY_START,
      salaryMidMnt: PLACEHOLDER_SALARY_MID,
      yearsOfStudy: 4,
      yearsToIndependence: 5,
      requiredEeshSubjects: ["Монгол хэл"],
      adjacentCareerSlugs: ["emch", "programm-hangamjiin-injener", "barilgiin-injener"],
      needsVerification: true,
      realityChecks: [
        {
          order: 0,
          questionMn: "Багшийн ажлын цаг хичээл тарахад дуусдаг уу?",
          factMn:
            "Үгүй. Хичээлд бэлдэх, дэвтэр шалгах, эцэг эхтэй уулзах цаг хичээлийн цагаас гадуур байдаг.",
          weight: 3,
        },
        {
          order: 1,
          questionMn: "Хамгийн их хүчин чармайлт юунд ордог вэ?",
          factMn:
            "Хичээлээ заахаас илүү ангийн сахилга, сурагч бүрийн ялгаатай хурдыг зохицуулах нь их хүч шаарддаг.",
          weight: 3,
        },
        {
          order: 2,
          questionMn: "Нэг ангид хэдэн сурагч байдаг вэ?",
          factMn:
            "Хотын том сургуулиудад нэг ангид олон сурагчтай байх нь элбэг ба энэ нь ажлын ачаалалд шууд нөлөөлдөг.",
          weight: 3,
        },
      ],
      roadmapSteps: [],
    },
  ],

  universities: [
    {
      key: "muis",
      nameMn: "Монгол Улсын Их Сургууль",
      city: "Улаанбаатар",
      isPublic: true,
      website: "https://www.num.edu.mn",
      needsVerification: true,
      programs: [
        {
          key: "muis.software-engineering",
          nameMn: "Программ хангамж",
          careerSlugs: ["programm-hangamjiin-injener"],
          tuitionMnt: null,
          eeshThreshold: null,
          durationYears: 4,
        },
        {
          key: "muis.teacher-training",
          nameMn: "Багш, монгол хэл уран зохиол",
          careerSlugs: ["bagsh"],
          tuitionMnt: null,
          eeshThreshold: null,
          durationYears: 4,
        },
      ],
    },
  ],

  scholarships: [
    {
      key: "mext",
      nameMn: "MEXT — Японы Засгийн газрын тэтгэлэг",
      country: "Япон",
      provider: "Японы Боловсрол, соёл, спорт, шинжлэх ухаан, технологийн яам",
      coverageMn: "Сургалтын төлбөр, амьжиргааны тэтгэмж, нислэгийн зардлыг хамардаг.",
      deadlineMonth: 5,
      eligibilityMn: "Насны болон дүнгийн шаардлагыг жил бүр элчин сайдын яам зарладаг.",
      url: "https://www.studyinjapan.go.jp/en/",
      careerSlugs: ["programm-hangamjiin-injener", "barilgiin-injener"],
      needsVerification: true,
    },
  ],

  schools: [
    {
      key: "test-school",
      nameMn: "Туршилтын сургууль",
      aimag: "Улаанбаатар",
      contactEmail: "test@example.com",
      classes: [{ code: "23R-8A", gradeLevel: 8, teacherName: "Туршилтын багш" }],
    },
  ],
};
