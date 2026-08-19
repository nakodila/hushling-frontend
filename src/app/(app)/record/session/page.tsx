import { Suspense } from "react";
import SessionClient from "./SessionClient";

export default function RecordSessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionClient />
    </Suspense>
  );
}
