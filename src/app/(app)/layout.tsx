import { AppHeader } from "@/components/app-header";

/** Layout of the signed-in screens: header + page. URLs have no "(app)". */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
        {children}
      </main>
    </>
  );
}
