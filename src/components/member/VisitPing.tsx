"use client";

import { useEffect } from "react";

/**
 * 방문했다고 서버에 한 번 알린다.
 *
 * 화면마다 부르면 한 번 둘러보는 동안 여러 번 가므로, 이 브라우저 창에서
 * 한 번만 부른다. 서버도 하루 한 번만 세지만, 쓸데없는 요청은 줄이는 편이 낫다.
 *
 * 다만 "한 번 불렀으니 끝" 으로 두면 안 된다. 대부분은 로그인하지 않은 채로
 * 들어와서 둘러보다가 로그인한다. 첫 호출 때 표시를 남겨 버리면 그날은
 * 영영 세지 않는다. 그래서 로그인한 것이 확인됐을 때만 표시를 남긴다.
 */

const KEY = "wjsosang:visit-pinged";

export default function VisitPing() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY) === "1") return;
    } catch {
      // 저장소가 막혀 있으면 매번 부른다. 서버가 하루 한 번만 세니 문제없다.
    }

    void fetch("/api/visit", { method: "POST" })
      .then((res) => res.json() as Promise<{ loggedIn?: boolean }>)
      .then((data) => {
        if (!data.loggedIn) return;
        try {
          window.sessionStorage.setItem(KEY, "1");
        } catch {
          /* 저장이 막혀도 서버가 하루 한 번만 센다 */
        }
      })
      .catch(() => {
        /* 방문 세는 일로 화면이 멈추면 안 된다 */
      });
  }, []);

  return null;
}
