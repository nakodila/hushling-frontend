import { Suspense } from "react";
import UpgradeClient from "./UpgradeClient";

export default function RecordUpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradeClient />
    </Suspense>
  );
}
