import { z } from "zod";
import { Currencies } from "@/lib/currencies";

const currencyValues = Currencies.map((c) => c.value) as [string, ...string[]];

export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().min(3).max(100),
  date: z.coerce.date(),
  category: z.string(),
  type: z.union([z.literal("income"), z.literal("expense")]),
  currency: z.enum(currencyValues),
});

export type CreateTransactionSchemaType = z.infer<
  typeof CreateTransactionSchema
>;

/** Shared with DeleteTransaction Server Action — reject non-UUID ids early. */
export const DeleteTransactionIdSchema = z.string().uuid();