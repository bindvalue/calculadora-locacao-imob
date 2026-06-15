"use client";

import { Suspense } from "react";
import Avaliar from "../../../page-components/Avaliar";

export const dynamic = 'force-dynamic';

export default function AvaliarTokenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Avaliar />
    </Suspense>
  );
}
