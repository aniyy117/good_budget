export const MAX_DATE_RANGE_DAYS = 90;

/** Calendar months as Select options (value = 0–11). */
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, value) => ({
  value,
  label: new Date(2000, value, 1).toLocaleString(undefined, {
    month: "long",
  }),
}));
