import { z } from "zod"

export const TipAPIBodySchema = z.object({
    user: z.object({
        userid: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email()
    }),
    provider: z.string().min(1),
    message: z.string().optional(),
    amount: z.number().min(1),
    currency: z.enum(["AUD", "BRL", "CAD", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN", "NOK", "NZD", "PHP", "PLN", "GBP", "RUB",
        "SGD", "SEK", "CHF", "TWD", "THB", "TRY", "USD", "INR", "UAH", "RON"]),
    imported: z.boolean()
})

export type TipAPIBody = z.infer<typeof TipAPIBodySchema>