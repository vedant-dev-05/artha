import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  /** Counts towards expenditure totals. */
  spending: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "food",
    label: "Food & dining",
    shortLabel: "Food",
    icon: "restaurant",
    color: "#1B4332",
    spending: true,
  },
  {
    id: "transport",
    label: "Transport",
    shortLabel: "Transport",
    icon: "directions_bus",
    color: "#2D6A4F",
    spending: true,
  },
  {
    id: "shopping",
    label: "Shopping",
    shortLabel: "Shopping",
    icon: "shopping_bag",
    color: "#40916C",
    spending: true,
  },
  {
    id: "entertainment",
    label: "Entertainment",
    shortLabel: "Fun",
    icon: "movie",
    color: "#52B788",
    spending: true,
  },
  {
    id: "education",
    label: "Education",
    shortLabel: "Education",
    icon: "school",
    color: "#74C69D",
    spending: true,
  },
  {
    id: "bills",
    label: "Bills & utilities",
    shortLabel: "Bills",
    icon: "receipt_long",
    color: "#6B705C",
    spending: true,
  },
  {
    id: "health",
    label: "Health",
    shortLabel: "Health",
    icon: "favorite",
    color: "#95D5B2",
    spending: true,
  },
  {
    id: "travel",
    label: "Travel",
    shortLabel: "Travel",
    icon: "flight",
    color: "#B7B7A4",
    spending: true,
  },
  {
    id: "other",
    label: "Other expenses",
    shortLabel: "Other",
    icon: "category",
    color: "#C1C8C2",
    spending: true,
  },
  {
    id: "transfers",
    label: "Transfers",
    shortLabel: "Transfers",
    icon: "swap_horiz",
    color: "#717973",
    spending: false,
  },
  {
    id: "income",
    label: "Income / credits",
    shortLabel: "Income",
    icon: "south_west",
    color: "#1B6B44",
    spending: false,
  },
  {
    id: "uncategorised",
    label: "Needs category",
    shortLabel: "Uncategorised",
    icon: "help",
    color: "#9A5B13",
    spending: false,
  },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.id, category]));

export function getCategory(id: CategoryId): CategoryMeta {
  return CATEGORY_MAP.get(id) ?? CATEGORY_MAP.get("uncategorised")!;
}

export function isSpendingCategory(id: CategoryId): boolean {
  return getCategory(id).spending;
}

/** Categories offered when recording an expense. */
export const EXPENSE_CATEGORY_IDS: CategoryId[] = CATEGORIES.filter(
  (category) => category.spending,
).map((category) => category.id);

/** Categories that can appear in the donut / category breakdown. */
export const BREAKDOWN_CATEGORY_IDS: CategoryId[] = CATEGORIES.filter(
  (category) => category.spending,
).map((category) => category.id);
