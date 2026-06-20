import { Sheet, Button, Kicker } from "../../ui";
import styles from "./CaseBriefingSheet.module.css";

// 픽셀 정본: lib/components/game_modals.dart _BriefingSheet / _BriefingInfoRow.
//   제목('사건 브리핑' titleL) + 시나리오명 + 사건 개요(Kicker+summary) + 피해자 정보(InfoRow ×2)
//   + 탐정 목표(danger 박스) + 닫기. 공유 Sheet 프리미티브(슬라이드 모션 + 핸들) 위, 본문 스크롤.
//   데이터 = 세션 dashboard.briefing(summary/victimName/foundLocation) — 웹 보존(koo #4).
//   탐정 목표 3줄은 Flutter 하드코딩 정본 그대로.

const GOALS =
  "1. 진범을 찾아라\n2. 살해 방법과 동기를 밝혀라\n3. 최종 추리를 뒷받침할 증거를 확보하라";

export interface CaseBriefingSheetProps {
  open: boolean;
  scenarioTitle?: string;
  summary?: string;
  victimName?: string;
  foundLocation?: string;
  onClose: () => void;
}

export function CaseBriefingSheet({
  open,
  scenarioTitle,
  summary,
  victimName,
  foundLocation,
  onClose,
}: CaseBriefingSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} ariaLabel="사건 브리핑">
      <div className={styles.scroll}>
        <h2 className={styles.title}>사건 브리핑</h2>
        {scenarioTitle ? (
          <p className={styles.subtitle}>{scenarioTitle}</p>
        ) : null}

        {summary ? (
          <section className={styles.section}>
            <Kicker label="사건 개요" className={styles.kicker} />
            <p className={styles.body}>{summary}</p>
          </section>
        ) : null}

        <section className={styles.section}>
          <Kicker label="피해자 정보" className={styles.kicker} />
          <InfoRow label="피해자" value={victimName || "미상"} />
          <InfoRow label="발견 장소" value={foundLocation || "미상"} />
        </section>

        <section className={styles.section}>
          <Kicker label="탐정 목표" className={styles.kicker} />
          <div className={styles.goals}>{GOALS}</div>
        </section>

        <div className={styles.footer}>
          <Button label="닫기" variant="secondary" expanded onPress={onClose} />
        </div>
      </div>
    </Sheet>
  );
}

// ── 정보 행 (_BriefingInfoRow) — 라벨(72) + 값 ───────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}
