import { Spinner } from "@/components/Spinner";

type PageLoaderProps = {
  message?: string;
};

export function PageLoader({ message = "Loading…" }: PageLoaderProps) {
  return (
    <main className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <Spinner className="h-5 w-5" label={message} />
        <span>{message}</span>
      </div>
    </main>
  );
}
