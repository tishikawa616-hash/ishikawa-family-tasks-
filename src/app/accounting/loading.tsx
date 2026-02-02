export default function Loading() {
  return (
    <div className="min-h-screen p-6 bg-(--background) max-w-md mx-auto flex flex-col items-center pt-20">
      <div className="w-12 h-12 border-4 border-(--primary)/20 border-t-(--primary) rounded-full animate-spin mb-8"></div>
      
      {/* Skeleton Card */}
      <div className="w-full h-48 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 animate-pulse mb-8">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-8 bg-gray-200 rounded"></div>
           <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Skeleton List */}
      <div className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-20 bg-white rounded-[20px] shadow-sm border border-gray-100 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
