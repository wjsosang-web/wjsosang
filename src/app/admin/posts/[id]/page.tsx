import { notFound, redirect } from "next/navigation";
import PostForm from "@/components/admin/PostForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { deletePost } from "@/lib/admin/actions";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { getPostById } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <PostForm type={post.type} post={post} />

      <form action={deletePost} className="rounded-xl border border-coral/25 bg-coral-tint p-5">
        <input type="hidden" name="id" value={post.id} />
        <p className="text-[13.5px] font-bold text-coral">글 삭제</p>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">
          삭제하면 되돌릴 수 없습니다. 딸린 사진도 함께 지워집니다.
        </p>
        <DeleteButton label="이 글 삭제하기" confirmText="정말 삭제하시겠습니까?" />
      </form>
    </div>
  );
}
