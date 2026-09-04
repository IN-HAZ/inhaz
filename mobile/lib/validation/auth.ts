import { z } from "zod";

const moroccanPhoneRegex = /^(\+212|0)[5-7]\d{8}$/;

export const phoneSchema = z
  .string()
  .min(1, "Le numéro de téléphone est requis")
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => moroccanPhoneRegex.test(val),
    "Numéro de téléphone marocain invalide (ex: +212 600 000 000 ou 0600000000)"
  );

export const otpSchema = z
  .string()
  .min(1, "Le code de vérification est requis")
  .length(6, "Le code doit contenir exactement 6 chiffres")
  .regex(/^\d+$/, "Le code doit uniquement contenir des chiffres");

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});
