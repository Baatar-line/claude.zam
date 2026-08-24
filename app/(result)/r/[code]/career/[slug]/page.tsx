import { CareerDetailView } from "@/components/result/CareerDetailView";

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ code: string; slug: string }>;
}) {
  const { code, slug } = await params;
  return <CareerDetailView code={code.toUpperCase()} slug={slug} />;
}
