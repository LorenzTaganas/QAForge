const WorkspaceSkeleton = ({ fullScreen = false }) => (
  <div className={`flex ${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'} items-center justify-center bg-[#070B14] text-white`}>
    <div className="flex flex-col items-center gap-5 p-8 rounded-2xl border border-[#2B416C] bg-[#101726]/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,240,255,0.2)]">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing sci-fi radar ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full border border-[#00F0FF]/40 opacity-75" />
        {/* Spinning tech core */}
        <div className="h-12 w-12 animate-spin rounded-xl border-2 border-[#00F0FF] border-t-transparent shadow-[0_0_15px_#00F0FF]" />
        <div className="absolute h-4 w-4 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00F0FF]">Loading QAForge</p>
        <p className="text-[11px] text-[#8B97A9]">Initializing isometric command modules...</p>
      </div>
    </div>
  </div>
)

export default WorkspaceSkeleton
