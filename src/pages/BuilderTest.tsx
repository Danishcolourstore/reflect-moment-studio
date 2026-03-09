import { Card } from "@/components/ui/card";

export default function BuilderTest() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <Card className="w-full max-w-xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Builder Recovery Successful</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The generation engine is working again.
        </p>
      </Card>
    </div>
  );
}
