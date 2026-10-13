const WorkspaceSkeleton = ({ fullScreen = false }) => (
  <div className={`flex ${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'} items-center justify-center bg-[#0D1119] text-[#DDE5F2]`}>
    <div className="flex flex-col items-center gap-3">
      <div aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-[#4B8DFF] border-t-transparent" />
      <p className="text-sm font-medium">Loading QAForge...</p>
    </div>
  </div>
)

export default WorkspaceSkeleton
