import GanttChart from "@/components/GanttChart";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">The Anchor</h1>
          <p className="text-slate-600">Organizing life before 30.</p>
        </header>

        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <GanttChart />
        </section>
      </div>
    </main>
  );
}