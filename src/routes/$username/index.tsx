import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/$username/")({
  validateSearch: z.object({
    solution: z.string().optional(),
  }),
});
