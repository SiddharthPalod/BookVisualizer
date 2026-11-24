import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#2a170b] text-amber-100 p-6 text-center select-none">
      <h2 className="text-2xl font-serif font-bold text-amber-200 mb-2">Shelf Not Found</h2>
      <p className="text-xs text-amber-300/70 mb-4">The requested page or shelf could not be located.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-colors shadow-md"
      >
        Return to Bookshelf
      </Link>
    </div>
  );
}
