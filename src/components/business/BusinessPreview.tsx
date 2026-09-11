"use client";

import { useEffect, useState } from "react";
import BusinessCard from "@/components/common/BusinessCard";
import { reshuffleForViewer, type BusinessCard as CardData } from "@/lib/search";

/**
 * 메인 화면의 회원업장 미리보기.
 *
 * 그려 보낸 화면은 모두에게 같은 것이 저장되기 때문에, 서버에서 고른 여덟 곳은
 * 누가 들어와도 같다. 그래서 화면이 뜬 뒤 브라우저에서 다시 섞어 여덟 곳을 고른다.
 * 새로고침할 때마다, 보는 사람마다 다른 업장이 나온다.
 */
export default function BusinessPreview({ cards, count }: { cards: CardData[]; count: number }) {
  const [shown, setShown] = useState(() => cards.slice(0, count));

  useEffect(() => setShown(reshuffleForViewer(cards).slice(0, count)), [cards, count]);

  return (
    <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {shown.map((b) => (
        <li key={b.id}>
          <BusinessCard business={b} />
        </li>
      ))}
    </ul>
  );
}
