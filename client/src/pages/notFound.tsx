import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/layouts/default";
import { usePageMeta } from "@/hooks/usePageMeta";

function NotFound() {
  const navigate = useNavigate();

  usePageMeta({
    title: "Page Not Found",
    description:
      "The page you're looking for doesn't exist. Play Ultimate Tic-Tac-Toe online for free at UltimateXO.",
    noIndex: true,
  });

  return (
    <DefaultLayout>
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground-900 dark:text-foreground text-5xl font-black tracking-tight">
            404
          </h1>
          <h2 className="text-foreground-900 dark:text-foreground text-2xl font-bold">
            Page Not Found
          </h2>
          <p className="text-foreground-500 text-sm">
            This page doesn&apos;t exist or has moved.
          </p>
        </div>
        <Button color="primary" onPress={() => navigate("/")}>
          Play Ultimate Tic-Tac-Toe
        </Button>
      </div>
    </DefaultLayout>
  );
}

export default NotFound;
