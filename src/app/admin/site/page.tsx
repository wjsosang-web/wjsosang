import { redirect } from "next/navigation";
import ListEditor from "@/components/admin/ListEditor";
import SiteTextForm from "@/components/admin/SiteTextForm";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import {
  savePresidentMessage,
  saveSiteInfo,
  saveStory,
} from "@/lib/admin/actions";
import {
  getFaqs,
  getHistory,
  getPresidentMessage,
  getPrograms,
  getSiteInfo,
  getStats,
  getStory,
} from "@/lib/repo";

export const dynamic = "force-dynamic";

/** 아이콘은 정해진 것 중에서 고른다. 없는 이름을 적으면 기본 아이콘이 나온다. */
const ICONS = ["users", "chart", "chat", "heart", "megaphone", "store", "calendar", "form", "camera", "link"];

export default async function AdminSitePage() {
  if (!(await getCurrentAdmin())) redirect("/admin/login");

  const [info, story, president, programs, history, faqs, stats] = await Promise.all([
    getSiteInfo(),
    getStory(),
    getPresidentMessage(),
    getPrograms(),
    getHistory(),
    getFaqs(),
    getStats(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">협회 정보</h1>
        <p className="mt-1 text-[13px] text-muted">
          홈페이지 곳곳에 나오는 연락처와 소개 글입니다. 여기서 고치면 해당하는 화면이
          모두 함께 바뀝니다.
        </p>
      </div>

      <SiteTextForm
        title="기본 정보"
        description="협회문의 화면, 푸터, 헤더 전화 버튼에 쓰입니다."
        action={saveSiteInfo}
        fields={[
          { name: "name", label: "협회 이름", defaultValue: info.name, type: "half", required: true },
          { name: "shortName", label: "줄임말", defaultValue: info.shortName, type: "half" },
          {
            name: "phone",
            label: "대표 전화",
            defaultValue: info.phone,
            type: "half",
            placeholder: "010-0000-0000",
          },
          {
            name: "phoneOwner",
            label: "전화 받는 사람",
            defaultValue: info.phoneOwner,
            type: "half",
            placeholder: "이종현 사무국장",
            hint: "협회문의 화면에 '○○에게 연결됩니다'로 나옵니다. 비우면 안 나옵니다.",
          },
          { name: "email", label: "이메일", defaultValue: info.email, type: "half" },
          {
            name: "foundedYear",
            label: "설립 연도",
            defaultValue: info.foundedYear,
            type: "half",
          },
          { name: "address", label: "주소", defaultValue: info.address },
          {
            name: "addressDetail",
            label: "주소 아래 한 줄",
            defaultValue: info.addressDetail,
            type: "half",
            placeholder: "원주청년소상공인협회 사무국",
          },
          {
            name: "officeHours",
            label: "운영시간",
            defaultValue: info.officeHours,
            type: "half",
          },
          { name: "transport", label: "찾아오는 길", defaultValue: info.transport },
          { name: "parking", label: "주차 안내", defaultValue: info.parking },
          { name: "mapUrl", label: "지도 주소", defaultValue: info.mapUrl, type: "half" },
          {
            name: "instagramUrl",
            label: "협회 인스타그램",
            defaultValue: info.instagramUrl,
            type: "half",
          },
          {
            name: "youtubeUrl",
            label: "협회 유튜브",
            defaultValue: info.youtubeUrl,
            type: "half",
          },
          {
            name: "tagline",
            label: "푸터 한 줄 문구",
            defaultValue: info.tagline,
            type: "half",
          },
          {
            name: "slogan",
            label: "슬로건",
            defaultValue: info.slogan,
            type: "long",
            rows: 3,
            hint: "메인홈 가운데 진한 띠에 크게 나옵니다.",
          },
        ]}
      />

      <SiteTextForm
        title="협회 이야기"
        description="협회소개 가운데 들어가는 글입니다."
        action={saveStory}
        fields={[
          { name: "heading", label: "제목", defaultValue: story.heading, type: "half" },
          { name: "note", label: "곁들이는 한 줄", defaultValue: story.note, type: "half" },
          { name: "lead", label: "머리글", defaultValue: story.lead, type: "long", rows: 2 },
          {
            name: "paragraphs",
            label: "본문",
            defaultValue: story.paragraphs.join("\n\n"),
            type: "long",
            rows: 10,
            hint: "빈 줄을 넣으면 문단이 나뉩니다.",
          },
        ]}
      />

      <SiteTextForm
        title="회장 인사말"
        description="사진은 조직도 관리의 회장 항목에서 바꿉니다."
        action={savePresidentMessage}
        fields={[
          {
            name: "quote",
            label: "굵게 나오는 문장",
            defaultValue: president.quote,
            type: "long",
            rows: 2,
          },
          { name: "body", label: "본문", defaultValue: president.body, type: "long", rows: 6 },
          { name: "note", label: "손글씨 문구", defaultValue: president.note, type: "half" },
          { name: "plaque", label: "액자 문구", defaultValue: president.plaque, type: "half" },
        ]}
      />

      <ListEditor
        settingKey="stats"
        title="숫자로 보는 원청협"
        description="지금은 메인홈에서 빼두었지만, 협회소개 등에서 다시 쓸 수 있습니다."
        fields={[
          { name: "value", label: "숫자", placeholder: "176" },
          { name: "label", label: "이름", placeholder: "함께하는 회원" },
          { name: "description", label: "설명", type: "long" },
          { name: "icon", label: "아이콘", options: ICONS },
        ]}
        rows={stats.map((s) => ({
          id: s.id,
          value: s.value,
          label: s.label,
          description: s.description,
          icon: s.icon,
        }))}
        newRow={{ id: "", value: "", label: "", description: "", icon: "users" }}
      />

      <ListEditor
        settingKey="programs"
        title="주요사업"
        description="협회소개의 주요사업 칸입니다."
        fields={[
          { name: "title", label: "사업명" },
          { name: "icon", label: "아이콘", options: ICONS },
          { name: "description", label: "설명", type: "long" },
        ]}
        rows={programs.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          icon: p.icon,
        }))}
        newRow={{ id: "", title: "", description: "", icon: "users" }}
      />

      <ListEditor
        settingKey="history"
        title="연혁"
        description="위에서부터 나오는 순서대로 정렬됩니다."
        fields={[
          { name: "year", label: "연도", placeholder: "2026" },
          { name: "title", label: "제목" },
          { name: "text", label: "설명", type: "long" },
        ]}
        rows={history.map((h) => ({
          id: h.id,
          year: h.year,
          title: h.title,
          text: h.text,
          upcoming: h.upcoming === true,
        }))}
        newRow={{ id: "", year: "", title: "", text: "", upcoming: false }}
      />

      <ListEditor
        settingKey="faqs"
        title="자주 묻는 질문"
        description="협회문의 화면 아래에 나옵니다."
        fields={[
          { name: "question", label: "질문", type: "long" },
          { name: "answer", label: "답변", type: "long" },
        ]}
        rows={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
        newRow={{ id: "", question: "", answer: "" }}
      />
    </div>
  );
}
