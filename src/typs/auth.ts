import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const signupSchema = z.object({
  fname: z.string().min(1),
  lname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>