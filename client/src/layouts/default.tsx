import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
  pageScrollable = false,
}: {
  children: React.ReactNode;
  pageScrollable?: boolean;
}) {
  return (
    <div
      className={`relative flex h-dvh flex-col selection:bg-blue-500 selection:text-white ${pageScrollable ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      <Navbar />

      <main className="relative z-10 container mx-auto flex min-h-0 max-w-7xl grow flex-col items-stretch justify-stretch px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
