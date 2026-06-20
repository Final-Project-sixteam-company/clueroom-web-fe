// 정본: lib/screens/suspect_detail_screen.dart (+ suspect_detail_{bottom_bar,cards,widgets}.dart, GAMEPLAY_SPEC §10)
//   bare AppBar(WITNESS/SUSPECT) + 프로필(80 아바타·이름·역할·증인 Pill·성격 뱃지) + 피해자와의 관계
//   + 관련 증거 + 진술 카드 + 이전 심문 로그 + 하단 바(뒤로/심문하기/범인 지목).
// 웹 보존(koo #4): prop 계약 = 기존 인라인 SuspectDetailScreen 동일 → App.tsx 호출부 무변경(태그명만 교체).
// ⚠ 정본 차이(koo 확인): ① 범인 지목 → 정본은 AccuseDialog 확인 후 SubmitScreen, 웹은 onSelectCulprit 직행
//   (웹 동작 보존, 라벨만 정본 '범인 지목'). ② 정본 아바타는 탭→이미지 뷰어인데 웹 계약에 onOpenImage 미전달
//   → 탭 생략. ③ 관련 증거는 정본도 onTap no-op이나 웹은 onEvidenceDetail 진입 보존(탭 가능).
import { ArrowLeft, FileText } from "lucide-react";
import type { Suspect, Evidence, InterrogationLog } from "../../types";
import { Pill, Kicker, Button } from "../ui";
import { CharacterPortrait, EvidenceItem } from "../domain";
import styles from "./SuspectDetailScreen.module.css";

function LogCard({ log }: { log: InterrogationLog }) {
  return (
    <div className={styles.logCard}>
      {log.presentedEvidence ? (
        <span className={styles.logEvidence}>
          <FileText size={12} strokeWidth={2} aria-hidden />
          증거 제시 · {log.presentedEvidence.title}
        </span>
      ) : null}
      <p className={styles.logQ}>Q. {log.question}</p>
      <p className={styles.logA}>A. {log.answer}</p>
    </div>
  );
}

export interface SuspectDetailScreenProps {
  suspect: Suspect;
  evidences: Evidence[];
  logs: InterrogationLog[];
  loading: boolean;
  onBack: () => void;
  onChat: () => void;
  onSelectCulprit: () => void;
  onEvidenceDetail: (evidence: Evidence) => void;
}

export function SuspectDetailScreen({
  suspect,
  evidences,
  logs,
  loading,
  onBack,
  onChat,
  onSelectCulprit,
  onEvidenceDetail,
}: SuspectDetailScreenProps) {
  const related = evidences.filter((e) =>
    e.relatedSuspects?.some((r) => r.suspectId === suspect.suspectId),
  );

  return (
    <section className={styles.screen}>
      <header className={styles.bar}>
        <button className={styles.backBtn} onClick={onBack} aria-label="뒤로" type="button">
          <ArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
        <span className={styles.barTitle}>{suspect.isWitness ? "WITNESS" : "SUSPECT"}</span>
      </header>

      <div className={styles.scroll}>
        {/* 프로필 */}
        <div className={styles.profile}>
          <CharacterPortrait
            name={suspect.name}
            size={80}
            src={suspect.portraitImageUrl}
            radius={12}
            isWitness={suspect.isWitness ?? false}
          />
          <h1 className={styles.name}>{suspect.name}</h1>
          <div className={styles.roleRow}>
            <span className={styles.role}>{suspect.role ?? "역할 미상"}</span>
            {suspect.isWitness ? <Pill label="증인" tone="mute" /> : null}
          </div>
          {suspect.personalityTone ? (
            <span className={styles.toneBadge}>{suspect.personalityTone}</span>
          ) : null}
        </div>

        {suspect.relationToVictim ? (
          <>
            <Kicker label="피해자와의 관계" className={styles.kicker} />
            <div className={styles.infoCard}>{suspect.relationToVictim}</div>
          </>
        ) : null}

        {related.length > 0 ? (
          <>
            <Kicker label="관련 증거" className={styles.kicker} />
            <div className={styles.evList}>
              {related.map((e) => (
                <EvidenceItem key={e.evidenceId} evidence={e} onPress={() => onEvidenceDetail(e)} />
              ))}
            </div>
          </>
        ) : null}

        <Kicker label="진술" className={styles.kicker} />
        <div className={styles.statementCard}>
          <p className={styles.statementText}>
            {suspect.publicStatement ? `"${suspect.publicStatement}"` : "아직 확보된 진술이 없습니다."}
          </p>
          {suspect.alibi ? (
            <>
              <p className={styles.alibiLabel}>알리바이</p>
              <p className={styles.alibiText}>{suspect.alibi}</p>
            </>
          ) : null}
          {suspect.publicAlibi ? (
            <>
              <p className={styles.alibiLabel}>공개 알리바이</p>
              <p className={styles.alibiText}>{suspect.publicAlibi}</p>
            </>
          ) : null}
        </div>

        <Kicker
          label={logs.length > 0 ? `이전 심문 · ${logs.length}건` : "이전 심문"}
          className={styles.kicker}
        />
        {loading ? (
          <p className={styles.muted}>심문 기록을 불러오고 있습니다.</p>
        ) : logs.length === 0 ? (
          <p className={styles.muted}>아직 이 인물에게 진행한 심문이 없습니다.</p>
        ) : (
          <div className={styles.logList}>
            {logs.map((log) => (
              <LogCard key={log.interrogationId} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 바(정본 SuspectDetailBottomBar) */}
      <div className={styles.bottomBar}>
        <div className={styles.barBtn1}>
          <Button label="뒤로" variant="secondary" expanded onPress={onBack} />
        </div>
        <div className={styles.barBtn2}>
          <Button label="심문하기" variant="primary" expanded onPress={onChat} />
        </div>
        {!suspect.isWitness ? (
          <div className={styles.barBtn1}>
            <Button label="범인 지목" variant="danger" expanded onPress={onSelectCulprit} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
