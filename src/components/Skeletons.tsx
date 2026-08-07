export function SkeletonCard() {
  return (
    <div className="w-[160px] shrink-0 sm:w-[200px] md:w-[220px]">
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="skeleton mt-2 h-3 w-3/4 rounded" />
      <div className="skeleton mt-1 h-2 w-1/2 rounded" />
    </div>
  );
}

export function SkeletonRow({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-8 md:mb-12">
      <div className="container-page mb-3">
        <div className="skeleton h-6 w-48 rounded" />
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-hidden px-4 sm:px-6 lg:px-10">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="container-page grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative h-[60vh] min-h-[400px] w-full">
      <div className="skeleton h-full w-full" />
      <div className="absolute bottom-16 left-4 right-4 sm:left-10 space-y-3">
        <div className="skeleton h-12 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="flex gap-3 pt-2">
          <div className="skeleton h-12 w-32 rounded-lg" />
          <div className="skeleton h-12 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
