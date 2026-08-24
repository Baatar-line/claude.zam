/** Mongolian labels for the career-content enums (§3), display-only. */
import type { AiRisk, DemandLevel, RoadmapCategory, Saturation } from "@prisma/client";

export const DEMAND_LABEL_MN: Readonly<Record<DemandLevel, string>> = {
  HIGH: "Өндөр эрэлттэй",
  MEDIUM: "Дунд зэргийн эрэлттэй",
  LOW: "Бага эрэлттэй",
};

export const AI_RISK_LABEL_MN: Readonly<Record<AiRisk, string>> = {
  LOW: "Хиймэл оюунаар орлогдох эрсдэл бага",
  MEDIUM: "Хиймэл оюунаар хэсэгчлэн орлогдож болзошгүй",
  HIGH: "Хиймэл оюунаар их хэмжээгээр орлогдож болзошгүй",
};

export const SATURATION_LABEL_MN: Readonly<Record<Saturation, string>> = {
  SATURATED: "Мэргэжилтэн олон, өрсөлдөөн өндөр",
  BALANCED: "Эрэлт нийлүүлэлт тэнцвэртэй",
  UNDERSUPPLIED: "Мэргэжилтэн дутагдалтай",
};

export const ROADMAP_CATEGORY_LABEL_MN: Readonly<Record<RoadmapCategory, string>> = {
  SUBJECT: "Хичээл",
  SKILL: "Ур чадвар",
  ACTIVITY: "Үйл ажиллагаа",
  EXPERIENCE: "Туршлага",
  RESOURCE: "Материал",
};
