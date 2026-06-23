import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Sparkles, Construction } from "lucide-react";

export const Route = createFileRoute("/app/assistant")({
  component: () => {
    return (
      <div className="max-w-3xl">
        <PageHeader title="PASA Assistant" sub="AI-powered help for parents and staff." action={<Sparkles className="size-5 text-accent" />} />
        <Card className="p-10 text-center">
          <Construction className="size-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            The PASA AI Assistant is currently under development. Once available, you'll be able to ask questions about your child's school schedule, academic progress, and how to use the platform.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            This feature will be included in a future update.
          </p>
        </Card>
      </div>
    );
  },
});
