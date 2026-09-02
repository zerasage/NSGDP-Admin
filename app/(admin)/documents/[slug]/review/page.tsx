import { redirect } from "next/navigation";

export default async function DocumentReviewRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/documents/${slug}`);
}
