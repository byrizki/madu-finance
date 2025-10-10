"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ShowValuesContextValue {
  showValues: boolean;
  setShowValues: (value: boolean) => void;
  toggleShowValues: () => void;
}

const ShowValuesContext = createContext<ShowValuesContextValue | undefined>(undefined);

export function ShowValuesProvider({
  children,
  defaultVisible = false,
}: {
  children: React.ReactNode;
  defaultVisible?: boolean;
}) {
  const [showValues, setShowValues] = useState(defaultVisible);

  const toggleShowValues = useCallback(() => {
    setShowValues((prev) => !prev);
  }, []);

  const value = useMemo(() => ({ showValues, setShowValues, toggleShowValues }), [showValues, toggleShowValues]);

  return <ShowValuesContext.Provider value={value}>{children}</ShowValuesContext.Provider>;
}

export function useShowValues() {
  const context = useContext(ShowValuesContext);
  if (!context) {
    throw new Error("useShowValues must be used within a ShowValuesProvider");
  }
  return context;
}
