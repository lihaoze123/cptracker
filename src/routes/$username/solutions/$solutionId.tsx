import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$username/solutions/$solutionId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$username",
      params: { username: params.username },
      search: { solution: params.solutionId },
      replace: true,
    });
  },
});
