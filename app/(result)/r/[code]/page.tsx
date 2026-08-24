import { ResultView } from "@/components/result/ResultView";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ResultView code={code.toUpperCase()} />;
}
