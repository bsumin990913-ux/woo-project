/** 폴더 페이지가 준비되는 동안 같은 뼈대를 먼저 그린다 (레이아웃 점프 없음) */
export default function FolderLoading() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="brand-hero">
        <div className="mx-auto max-w-2xl px-5 pt-5 pb-16">
          <div className="mb-10 flex items-center justify-between">
            <Bone className="h-8 w-24 rounded-full" />
            <Bone className="h-9 w-9 rounded-full" />
          </div>
          <div className="flex flex-col items-center">
            <Bone className="rounded-sheet mb-5 h-24 w-24" />
            <Bone className="h-8 w-48" />
            <Bone className="mt-3 h-5 w-64" />
            <Bone className="mt-5 h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>

      <div className="sheet relative -mt-8">
        <div className="mx-auto max-w-2xl px-5 pt-4 pb-20">
          <div className="sheet-grabber mb-8" />
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="rounded-tds-xl h-[74px] w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />;
}
