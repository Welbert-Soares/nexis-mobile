import { useCssElement } from "react-native-css";

import { Link as RouterLink } from "expo-router";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
} from "react-native";

// react-native-css needs each element explicitly wrapped for className support.
// `useCssElement` infers over the full component type; with React Native 0.86
// that tips a few components (Link, ScrollView) into "union type too complex"
// (TS2589/TS2590). Funnelling every call through this helper collapses that
// inference — each wrapper's own props type below stays the public contract.
function useCssEl(
  Component: React.ComponentType<any>,
  props: object,
  mapping: Record<string, "style" | "contentContainerStyle">
): React.ReactElement {
  return useCssElement(Component, props, mapping) as React.ReactElement;
}

// CSS-enabled Link
export const Link = (
  props: React.ComponentProps<typeof RouterLink> & { className?: string }
) => {
  return useCssEl(RouterLink as React.ComponentType<any>, props, {
    className: "style",
  });
};
Link.displayName = "CSS(Link)";

// View
export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};

export const View = (props: ViewProps) => {
  return useCssEl(RNView, props, { className: "style" });
};
View.displayName = "CSS(View)";

// Text
export const Text = (
  props: React.ComponentProps<typeof RNText> & { className?: string }
) => {
  return useCssEl(RNText, props, { className: "style" });
};
Text.displayName = "CSS(Text)";

// ScrollView
export const ScrollView = (
  props: React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
) => {
  return useCssEl(RNScrollView, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
};
ScrollView.displayName = "CSS(ScrollView)";

// Pressable
export const Pressable = (
  props: React.ComponentProps<typeof RNPressable> & { className?: string }
) => {
  return useCssEl(RNPressable, props, { className: "style" });
};
Pressable.displayName = "CSS(Pressable)";

// TextInput
export const TextInput = (
  props: React.ComponentProps<typeof RNTextInput> & { className?: string }
) => {
  return useCssEl(RNTextInput, props, { className: "style" });
};
TextInput.displayName = "CSS(TextInput)";
