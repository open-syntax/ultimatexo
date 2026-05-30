import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-dvh flex-col selection:bg-blue-500 selection:text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Navbar />

      <main className="relative z-10 container mx-auto flex min-h-0 max-w-7xl grow flex-col items-stretch justify-stretch px-4 py-8 pt-20 max-sm:py-4 max-sm:pt-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
