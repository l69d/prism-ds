import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allConcepts, getConcept, getModuleOfConcept } from "@/content/curriculum";
import { registry } from "@/content/registry";
import { ConceptLayout } from "@/components/content/concept-layout";
import { ComingSoon } from "@/components/content/coming-soon";

export function generateStaticParams() {
  return allConcepts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getConcept(slug);
  if (!c) return { title: "Not found" };
  return { title: c.title, description: c.blurb };
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = getConcept(slug);
  const mod = getModuleOfConcept(slug);
  if (!concept || !mod) notFound();

  const Content = registry[concept.slug];
  if (concept.status === "live" && Content) {
    return (
      <ConceptLayout concept={concept} module={mod}>
        <Content />
      </ConceptLayout>
    );
  }
  return <ComingSoon concept={concept} module={mod} />;
}
