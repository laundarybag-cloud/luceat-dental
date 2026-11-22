"use client";

import * as React from "react";
import {
  getServerSettings,
  getSettings,
  subscribeSettings,
  type ClinicSettings,
} from "@/lib/settings";

/**
 * Subscribes a component to the clinic settings store.
 *
 * `useSyncExternalStore` rather than context because the scheduling
 * functions read the same store from outside the component tree, and two
 * copies of this state would be exactly the kind of drift the rest of this
 * build avoids. The server snapshot is the shipped defaults, so the markup
 * matches on hydration.
 */
export function useSettings(): ClinicSettings {
  return React.useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getServerSettings
  );
}
