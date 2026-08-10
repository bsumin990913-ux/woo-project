export default function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="card mx-auto max-w-xl space-y-4 p-7">
      <h2 className="text-lg font-bold">아직 설정이 끝나지 않았어요</h2>
      <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
        Supabase 연결이 필요합니다. 아래 순서대로 한 번만 해 두면 됩니다.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
        <li>
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            supabase.com
          </a>{" "}
          에서 프로젝트를 만든다
        </li>
        <li>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">supabase/schema.sql</code> 내용을
          SQL Editor 에 붙여넣고 Run
        </li>
        <li>
          프로젝트 폴더의{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">.env.local</code> 파일을 열어 주소와
          키를 채운다 (파일 안에 어디서 복사하는지 적혀 있습니다)
        </li>
        <li>개발 서버를 다시 시작한다</li>
      </ol>
      {detail && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs break-all text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {detail}
        </p>
      )}
    </div>
  );
}
