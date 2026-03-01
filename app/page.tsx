export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white shadow p-6">
        <h1 className="text-2xl font-semibold mb-2">Sage MVP</h1>
        <p className="text-gray-600 mb-6">Choose a tool:</p>

        <div className="space-y-3">
          <a
            href="/scan"
            className="block w-full text-center rounded-lg bg-green-600 text-white py-3 font-medium hover:bg-green-700"
          >
            Scan Plant Tag (OCR)
          </a>

          {/* placeholder buttons for future */}
          <button
            disabled
            className="w-full rounded-lg bg-gray-100 text-gray-400 py-3 font-medium cursor-not-allowed"
          >
            Dashboard (coming soon)
          </button>
        </div>
      </div>
    </main>
  );
}
