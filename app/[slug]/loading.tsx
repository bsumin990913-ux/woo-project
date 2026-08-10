/** 폴더 페이지가 준비되는 동안 같은 뼈대를 먼저 그린다 (레이아웃 점프 없음) */
export default function FolderLoading() {
  return (
    <main className="bg-canvas min-h-screen">
      <div className="mx-auto max-w-lg px-5 pt-4 pb-10">
        {/* 공유 + 다크모드, 둘 다 --control-sm(34px) */}
        <div className="mb-6 flex items-center justify-end gap-2">
          <Bone className="h-[34px] w-[34px] rounded-full" />
          <Bone className="h-[34px] w-[34px] rounded-full" />
        </div>

        <div className="flex flex-col items-center">
          <Bone className="mb-4 h-[104px] w-[104px] rounded-full" />
          <Bone className="h-8 w-44" />
          <Bone className="mt-2.5 h-4 w-64" />
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-2 px-5 pb-16">
        <Bone className="mb-3 h-3.5 w-12" />
        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="rounded-tds-lg h-[58px] w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}

function Bone({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-2 animate-pulse rounded-lg ${className}`} />;
}
