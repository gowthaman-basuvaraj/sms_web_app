export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-8 border-gray-500 border-t-8 border-t-gray-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-xl font-semibold text-gray-700">Loading...</p>
      </div>
    </div>
  );
}
