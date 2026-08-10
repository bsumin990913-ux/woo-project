export default function SetupNotice({ detail }: { detail?: string }) {
  return (
    <div className="card mx-auto max-w-xl space-y-4 p-7">
      <h2 className="t-h3 text-ink">아직 설정이 끝나지 않았어요</h2>
      <p className="t-sub">Supabase 연결이 필요합니다. 아래 순서대로 한 번만 해 두면 됩니다.</p>
      <ol className="text-ink-2 list-decimal space-y-2 pl-5 text-[15px] leading-7">
        <li>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold underline underline-offset-2"
          >
            supabase.com
          </a>{" "}
          에서 프로젝트를 만든다
        </li>
        <li>
          <code className="bg-surface-2 rounded-md px-1.5 py-0.5 font-mono text-xs">supabase/schema.sql</code> 내용을 SQL
          Editor 에 붙여넣고 Run
        </li>
        <li>
          프로젝트 폴더의 <code className="bg-surface-2 rounded-md px-1.5 py-0.5 font-mono text-xs">.env.local</code> 파일을
          열어 주소와 키를 채운다 (파일 안에 어디서 복사하는지 적혀 있습니다)
        </li>
        <li>개발 서버를 다시 시작한다</li>
      </ol>
      {detail && (
        <p className="bg-surface-2 text-ink-3 rounded-tds-md px-3 py-2.5 font-mono text-xs break-all">{detail}</p>
      )}
    </div>
  );
}
