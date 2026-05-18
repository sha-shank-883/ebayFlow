import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[100vh] flex-col items-center justify-center gap-4 bg-background">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">404 - Not Found</h2>
        <p className="text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
