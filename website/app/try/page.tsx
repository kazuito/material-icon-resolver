import { Suspense } from "react";
import { IconResolver } from "@/app/_components/icon-resolver";

export default function TryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 sm:px-6">
      <Suspense>
        <IconResolver />
      </Suspense>
    </main>
  );
}
