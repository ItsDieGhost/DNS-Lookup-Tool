export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-gray-400">Consultando registros DNS...</span>
    </div>
  );
}
