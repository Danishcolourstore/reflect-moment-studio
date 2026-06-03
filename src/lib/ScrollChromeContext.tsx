import { createContext, useContext } from "react";

type ChromeState = "visible" | "hidden";

interface ScrollChromeValue {
  headerState: ChromeState;
  navState: ChromeState;
}

const ScrollChromeContext = createContext<ScrollChromeValue>({
  headerState: "visible",
  navState: "visible",
});

export const ScrollChromeProvider = ScrollChromeContext.Provider;

export function useScrollChrome(): ScrollChromeValue {
  return useContext(ScrollChromeContext);
}
