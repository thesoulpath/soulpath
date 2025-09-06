export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="relative">
        {/* Constellation background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] opacity-50" />
        
        {/* Loading spinner */}
        <div className="relative z-10">
          <div className="w-16 h-16 border-4 border-[#FFD700]/20 border-t-[#FFD700] rounded-full animate-spin" />
          <div className="mt-4 text-center">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce mx-auto mb-2" />
            <p className="text-[#FFD700] text-lg font-semibold">Loading SoulPath...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
