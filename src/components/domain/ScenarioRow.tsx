import { Pill } from "../ui";
import type { PillTone } from "../ui";
import { AssetImage } from "./AssetImage";
import { formatDifficulty } from "../../api/normalizers";
import type { Scenario } from "../../types";
import styles from "./ScenarioRow.module.css";

// 픽셀 정본: lib/screens/scenario_library_screen.dart (_ScenarioRow / _CodeThumb / _ScenarioMeta / _ScenarioStats)
//   48×60 썸네일 + sp3 + 신축 메타(난이도 Pill + N분·용의자 N명 + 제목 2줄 + #태그 3개) + sp3 + 우측 통계(★평점 / 플레이수).
//
// 라이브러리와 북마크(저장한 사건)에서 공용으로 쓰는 시나리오 리스트 카드.
//   · 카드 썸네일: Flutter 는 48×60 코드 그라디언트지만 웹 Scenario 엔 code 가 없고 thumbnailUrl 이 있어
//     이미지 우선 + 타입별 그라디언트 폴백(48×60 프레임/보더/반경은 Flutter 그대로).

// 난이도 → Pill tone (Flutter: easy→success / medium→primary / hard→danger).
const DIFFICULTY_TONE: Record<string, PillTone> = {
  EASY: "success",
  HARD: "danger",
};

// Flutter _ScenarioStats._formatPlays 와 동일: 1000 이상은 'x.xk'.
function formatPlays(plays: number) {
  if (plays >= 1000) return `${(plays / 1000).toFixed(1)}k`;
  return String(plays);
}

export interface ScenarioRowProps {
  scenario: Scenario;
  onPress: () => void;
}

export function ScenarioRow({ scenario, onPress }: ScenarioRowProps) {
  const tone = DIFFICULTY_TONE[scenario.difficulty] ?? "primary";
  const isOfficial = scenario.scenarioType === "OFFICIAL";
  // 백엔드가 suspectCount 0(미집계)을 줄 때 "용의자 0명" 오인 방지 — 구절 숨김(Flutter 와 일관).
  const meta =
    scenario.suspectCount > 0
      ? `${scenario.estimatedPlayTimeMinutes}분 · 용의자 ${scenario.suspectCount}명`
      : `${scenario.estimatedPlayTimeMinutes}분`;
  const tags = (scenario.tags ?? []).slice(0, 3);

  return (
    <button type="button" className={styles.card} onClick={onPress}>
      <AssetImage
        src={scenario.thumbnailUrl}
        alt={`${scenario.title} 썸네일`}
        width={48}
        height={60}
        radius={8}
        fit="cover"
        className={styles.thumb}
        fallback={
          <span
            className={`${styles.thumbFallback} ${isOfficial ? styles.thumbOfficial : styles.thumbCustom}`}
            aria-hidden
          />
        }
      />

      <div className={styles.meta}>
        <div className={styles.metaTop}>
          <Pill label={formatDifficulty(scenario.difficulty)} tone={tone} />
          <span className={styles.sub}>{meta}</span>
        </div>
        <div className={styles.cardTitle}>{scenario.title}</div>
        {tags.length > 0 ? (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.stats}>
        <span className={styles.rating}>★ {scenario.averageRating.toFixed(1)}</span>
        <span className={styles.plays}>{formatPlays(scenario.playCount)}</span>
      </div>
    </button>
  );
}
