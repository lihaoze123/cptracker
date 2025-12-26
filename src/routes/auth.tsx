import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const authSearchSchema = z.object({
  view: z.enum(["login", "sign-up", "forgot-password", "update-password"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
});
