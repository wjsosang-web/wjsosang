import { redirect } from "next/navigation";
import PostForm from "@/components/admin/PostForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import type { PostType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const { type } = await searchParams;
  const valid: PostType[] = ["notice", "activity", "event"];
  const postType = (valid.includes(type as PostType) ? type : "notice") as PostType;

  return <PostForm type={postType} />;
}
