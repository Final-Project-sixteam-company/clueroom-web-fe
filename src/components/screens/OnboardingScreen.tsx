import { useRef, useState } from "react";
import {
  Search,
  FileText,
  Users,
  Lightbulb,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Button } from "../ui";
import styles from "./OnboardingScreen.module.css";

/**
 * 정본: lib/screens/onboarding_screen.dart
 * 픽셀=Flutter 5슬라이드. Flutter PageView(스와이프) → 가로 scroll-snap 컨테이너(네이티브 스와이프)
 * + '다음' 버튼은 다음 페이지로 smooth scroll. 인디케이터는 스크롤 위치로 활성 페이지 추적.
 * 완료/건너뛰기 → onComplete(App 이 markOnboardingSeen + 홈 라우팅 소유).
 * 아이콘은 Material → lucide 매핑(검색/문서/사람/전구/별, 킷 전역 트레이드오프).
 */
type Slide = { icon: LucideIcon; title: string; body: string };

const SLIDES: Slide[] = [
  {
    icon: Search,
    title: "사건을 선택하세요",
    body: "공식 시나리오 또는 유저가 만든 커스텀 사건 중 원하는 사건을 골라 조사를 시작하세요.",
  },
  {
    icon: FileText,
    title: "증거를 수집하세요",
    body: "현장에 흩어진 증거 카드를 수집하고, 시간이 지날수록 새 단서가 해금됩니다.",
  },
  {
    icon: Users,
    title: "AI 용의자를 심문하세요",
    body: "각 용의자는 AI로 구동됩니다. 날카로운 질문과 증거 제시로 모순을 찾아내세요.",
  },
  {
    icon: Lightbulb,
    title: "힌트를 활용하세요",
    body: "막히면 단계별 힌트를 사용할 수 있습니다. 단, 점수가 감점됩니다.",
  },
  {
    icon: Star,
    title: "최종 추리를 제출하세요",
    body: "범인, 동기, 범행 방법, 결정적 증거를 조합해 사건의 진상을 밝혀내세요.",
  },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const isLast = page === SLIDES.length - 1;

  function scrollToPage(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== page) setPage(index);
  }

  function complete() {
    if (navigating) return; // 이중 탭 방지 (Flutter _navigating)
    setNavigating(true);
    onComplete();
  }

  function next() {
    if (isLast) complete();
    else scrollToPage(page + 1);
  }

  return (
    <div className={styles.root}>
      {/* ── 건너뛰기 (ghost, 우상단) ── */}
      <div className={styles.skipRow}>
        <Button
          label="건너뛰기"
          variant="ghost"
          onPress={navigating ? undefined : complete}
        />
      </div>

      {/* ── 슬라이드 (PageView ↔ scroll-snap) ── */}
      <div className={styles.track} ref={trackRef} onScroll={handleScroll}>
        {SLIDES.map((slide) => {
          const Icon = slide.icon;
          return (
            <div className={styles.slide} key={slide.title}>
              <div className={styles.spacerTop} />
              <div className={styles.iconBadge}>
                <Icon size={36} strokeWidth={2} aria-hidden="true" />
              </div>
              <h2 className={styles.title}>{slide.title}</h2>
              <p className={styles.body}>{slide.body}</p>
              <div className={styles.spacerBottom} />
            </div>
          );
        })}
      </div>

      {/* ── 인디케이터 + 버튼 ── */}
      <div className={styles.footer}>
        <div className={styles.dots}>
          {SLIDES.map((slide, i) => (
            <span
              key={slide.title}
              className={i === page ? styles.dotActive : styles.dot}
            />
          ))}
        </div>
        <Button
          label={isLast ? "시작하기" : "다음"}
          variant="primary"
          expanded
          loading={isLast && navigating}
          onPress={navigating ? undefined : next}
        />
      </div>
    </div>
  );
}
