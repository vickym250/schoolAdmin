export default function Header() {
  return (
    <div className="w-full bg-white shadow p-4 flex justify-between">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <button className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
    </div>
  );
}
