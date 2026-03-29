export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-swansons-cream px-4">
      <div className="bg-white rounded shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
        <p className="mb-6">You don't have permission to view this page.</p>
        <a href="/" className="text-green-700 underline">
          Back to Home
        </a>
      </div>
    </main>
  );
}
