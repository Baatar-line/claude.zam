import { getCareerPickerList } from "@/lib/content/test-content";
import { TestFlow } from "@/components/test/TestFlow";

type EntryPath = "EXPLORE" | "VALIDATE";

function readEntryPath(value: string | string[] | undefined): EntryPath | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "EXPLORE" || raw === "VALIDATE" ? raw : null;
}

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [careers] = await Promise.all([getCareerPickerList()]);

  return <TestFlow careers={careers} initialEntryPath={readEntryPath(params.path)} />;
}
