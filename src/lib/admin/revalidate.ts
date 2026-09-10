import { revalidatePath } from "next/cache";

/**
 * 관리자가 무언가 고치면 공개 화면을 즉시 새로 만들게 한다.
 *
 * 경로를 하나씩 적어두면 화면이 늘어날 때마다 빠뜨린다.
 * (실제로 /join 이 빠져 있었다.) 그래서 최상위 레이아웃 통째로 무효화한다.
 * 이 사이트는 화면 수가 적어서 전부 다시 만들어도 부담이 없고,
 * "고쳤는데 안 바뀐다"는 문제가 생길 여지를 없애는 편이 낫다.
 */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
}
