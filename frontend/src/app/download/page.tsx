import { redirect } from "next/navigation";
import { DownloadShell } from "./_components/DownloadShell";

export const metadata = {
  title: "Téléchargement — Ricefy",
};

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ rice_id?: string }>;
}) {
  const { rice_id } = await searchParams;
  if (!rice_id) redirect("/configure");

  return <DownloadShell riceId={rice_id} />;
}
