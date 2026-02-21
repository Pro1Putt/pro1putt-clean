import { Suspense } from "react";
import SignClient from "./SignClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignClient />
    </Suspense>
  );
}