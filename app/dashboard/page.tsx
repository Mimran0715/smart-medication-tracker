export default function Dashboard() {
  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border p-4 rounded">Glucose</div>
        <div className="border p-4 rounded">Adherence</div>
        <div className="border p-4 rounded">Quick Actions</div>
      </div>
    </main>
  );
}