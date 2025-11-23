import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(1, "Senha é obrigatória")
  .min(6, "Senha deve ter pelo menos 6 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[!@#$%^&*]/, "Senha deve conter pelo menos um caractere especial");

export const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

// Critérios de acessibilidade disponíveis
export const ACCESSIBILITY_CRITERIA = [
  'Acesso',
  'Banheiro', 
  'Estacionamento',
  'Elevador',
  'Sinalização'
] as const;

export const criteriaSchema = z.object({
  name: z.enum(ACCESSIBILITY_CRITERIA, {
    message: "Critério inválido"
  }),
  rating: z.number().min(1, "Nota deve ser pelo menos 1").max(5, "Nota deve ser no máximo 5")
});

export const reviewSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  criteria: z
    .array(criteriaSchema)
    .min(1, "Pelo menos um critério deve ser avaliado")
    .max(5, "Máximo 5 critérios por avaliação"),
  photos: z
    .array(z.string())
    .max(5, "Máximo 5 fotos por avaliação")
    .default([])
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ReviewFormData = z.output<typeof reviewSchema>;
export type CriteriaData = z.infer<typeof criteriaSchema>;
