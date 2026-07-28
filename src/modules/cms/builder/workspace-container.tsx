"use client";

import { useRef } from "react";
import { useBuilderStore } from "./useBuilderStore";
import VisualBuilderWorkspace from "./workspace";

interface VisualBuilderContainerProps {
  initialCmsData: any;
  initialPages: any[];
}

export default function VisualBuilderContainer({
  initialCmsData,
  initialPages
}: VisualBuilderContainerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useBuilderStore.getState().setInitialState(initialCmsData || {}, initialPages || []);
    initialized.current = true;
  }

  return <VisualBuilderWorkspace />;
}
