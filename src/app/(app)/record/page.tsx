import { Suspense } from "react";
import RecordEntryClient from "./RecordEntryClient";

export default function RecordEntryPage() {
  return (
    <Suspense fallback={null}>
      <RecordEntryClient />
    </Suspense>
  );
}
