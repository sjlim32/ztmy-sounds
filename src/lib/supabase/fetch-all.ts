/** 한 번에 청하는 행 수 — Supabase 기본 max_rows(1000)와 같게. */
const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/**
 * 1000행이 넘을 수 있는 조회를 끝까지 받는다 — Supabase는 max_rows를 넘는 행을 오류
 * 없이 잘라서, 세트리스트처럼 계속 늘어나는 표는 어느 날 조용히 일부가 빠진다.
 * page(from, to)는 같은 조회에 정렬(.order — 페이지가 겹치거나 빠지지 않게)과
 * .range(from, to)를 붙여 돌려준다. 서버의 max_rows가 PAGE_SIZE보다 작아도 빠지지
 * 않게, 받은 행 수만큼 다음 위치로 가고 빈 페이지가 오면 끝낸다.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PageResult<T>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  for (;;) {
    const from = rows.length;
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: rows, error };
    if (!data || data.length === 0) return { data: rows, error: null };
    rows.push(...data);
  }
}
