export const ActionType = {
  Research: "research",
  Build: "build",
  Diplomacy: "diplomacy",
  Military: "military",
  Economy: "economy",
  Intelligence: "intelligence",
  Politics: "politics"
} as const;

export type ActionType =
  (typeof ActionType)[keyof typeof ActionType];
