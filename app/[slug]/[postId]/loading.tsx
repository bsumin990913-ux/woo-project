/** 글 페이지 로딩 뼈대 */
export default function PostLoading() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="brand-glow">
        <div className="mx-auto max-w-2xl px-5 pt-5 pb-8">
          <div className="mb-9 flex items-center justify-between gap-3">
            <Bone className="h-[34px] w-32 rounded-full" />
            <div className="flex items-center gap-2">
              <Bone className="h-[34px] w-[34px] rounded-full" />
              <Bone className="h-[34px] w-[34px] rounded-full" />
            </div>
          </div>
          <Bone className="h-9 w-3/4" />
          <Bone className="mt-3 h-4 w-28" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 px-5 pb-20">
        <Bone className="aspect-[4/3] w-full rounded-[20px]" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
      </div>
    </main>
  );
}

function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />;
}
