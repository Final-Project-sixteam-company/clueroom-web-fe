// 정본: lib/screens/submit_screen.dart (+ submit_widgets.dart, submit_evidence_selector.dart)
//   SubmitHeader(경고+제목) + 1.진범 지목(드롭다운) + 2.동기/방법/은폐(3 TextField) + 3.제출 증거(셀렉터)
//   + 체크리스트(미충족 시) + 최종 추리 제출(danger). 제출 → 확인 Modal → onSubmit.
// 웹 보존(koo #4): 컨트롤드 — 폼 상태(culprit/evidence/texts)·submitting·submitDeduction 은 App 소유.
//   prop 계약 = 기존 인라인 SubmitScreen 동일 → App.tsx 호출부 무변경(태그명만 교체). canSubmit 계산도 웹 그대로.
// ⚠ 정본 차이(koo 확인): ① 정본 4번 '종합 추리 설명(선택)' summary 는 웹 계약에 없어 생략(웹 동작 보존).
//   ② 정본은 AppBar 없음(디바이스 back)인데 view-enum 웹은 back 필요 → 얇은 bar 추가. ③ 체크리스트는
//   정본대로 미충족 시에만 노출. ④ 확인 Modal = kit Modal(정본 SubmitConfirmDialog 근사) + 웹 요약(지목/증거).
import { useState } from "react";
import { ArrowLeft, TriangleAlert, CircleCheck, Circle } from "lucide-react";
import type { Suspect, Evidence } from "../../types";
import { Kicker, TextField, Button, Pill, Modal } from "../ui";
import { MIN_DEDUCTION_TEXT_LENGTH } from "../../config/env";
import styles from "./SubmitScreen.module.css";

const MAX_EVIDENCE = 15;

export interface SubmitScreenProps {
  suspects: Suspect[];
  evidences: Evidence[];
  selectedCulpritId: number | null;
  setSelectedCulpritId: (id: number | null) => void;
  selectedEvidenceIds: number[];
  setSelectedEvidenceIds: (ids: number[]) => void;
  motiveText: string;
  setMotiveText: (value: string) => void;
  methodText: string;
  setMethodText: (value: string) => void;
  coverUpText: string;
  setCoverUpText: (value: string) => void;
  submitting: boolean;
  error: string | null;
  pendingResult: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onRetryResult: () => void;
}

export function SubmitScreen({
  suspects,
  evidences,
  selectedCulpritId,
  setSelectedCulpritId,
  selectedEvidenceIds,
  setSelectedEvidenceIds,
  motiveText,
  setMotiveText,
  methodText,
  setMethodText,
  coverUpText,
  setCoverUpText,
  submitting,
  error,
  pendingResult,
  onBack,
  onSubmit,
  onRetryResult,
}: SubmitScreenProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedSuspect = suspects.find((s) => s.suspectId === selectedCulpritId);
  const selectedEvidences = evidences.filter((e) =>
    selectedEvidenceIds.includes(e.evidenceId),
  );
  const motiveReady = motiveText.trim().length >= MIN_DEDUCTION_TEXT_LENGTH;
  const methodReady = methodText.trim().length >= MIN_DEDUCTION_TEXT_LENGTH;
  const coverUpReady = coverUpText.trim().length >= MIN_DEDUCTION_TEXT_LENGTH;
  const evidenceReady =
    selectedEvidenceIds.length >= 1 && selectedEvidenceIds.length <= MAX_EVIDENCE;
  const allMet =
    !!selectedCulpritId && motiveReady && methodReady && coverUpReady && evidenceReady;
  const canSubmit = allMet && !submitting && !pendingResult;

  const reqs: [string, boolean][] = [
    ["진범을 지목했습니다", !!selectedCulpritId],
    [`범행 동기 ${MIN_DEDUCTION_TEXT_LENGTH}자 이상`, motiveReady],
    [`범행 방법 ${MIN_DEDUCTION_TEXT_LENGTH}자 이상`, methodReady],
    [`은폐 방법 ${MIN_DEDUCTION_TEXT_LENGTH}자 이상`, coverUpReady],
    [`제출 증거 1~${MAX_EVIDENCE}개`, evidenceReady],
  ];

  function toggleEvidence(id: number) {
    const active = selectedEvidenceIds.includes(id);
    if (active) {
      setSelectedEvidenceIds(selectedEvidenceIds.filter((x) => x !== id));
    } else if (selectedEvidenceIds.length < MAX_EVIDENCE) {
      setSelectedEvidenceIds([...selectedEvidenceIds, id]);
    }
  }

  return (
    <section className={styles.screen}>
      <header className={styles.bar}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          disabled={submitting}
          aria-label="수사로 돌아가기"
          type="button"
        >
          <ArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <div className={styles.scroll}>
        {/* 헤더(경고 아이콘 + 제목 + 안내) */}
        <div className={styles.header}>
          <TriangleAlert size={48} strokeWidth={2} className={styles.warnIcon} aria-hidden />
          <h1 className={styles.title}>사건 종결 및 추리 제출</h1>
          <p className={styles.subtitle}>
            {"범인을 지목하고 사건의 전말을 제출합니다.\n이 결정은 되돌릴 수 없습니다."}
          </p>
        </div>

        {/* 1. 진범 지목 */}
        <Kicker label="1. FINAL SUSPECT · 진범 지목" className={styles.kicker} />
        <select
          className={styles.select}
          value={selectedCulpritId ?? ""}
          onChange={(e) => setSelectedCulpritId(Number(e.target.value) || null)}
        >
          <option value="">범인 선택</option>
          {suspects.map((s) => (
            <option key={s.suspectId} value={s.suspectId}>
              {s.role ? `${s.name} · ${s.role}` : s.name}
            </option>
          ))}
        </select>

        {/* 2. 동기/방법/은폐 */}
        <Kicker label="2. 범행 동기 및 방법" className={styles.kicker} />
        <div className={styles.fields}>
          <TextField
            value={motiveText}
            onChange={setMotiveText}
            placeholder="범인이 피해자를 해친 동기는 무엇인가요?"
            rows={3}
            ariaLabel="범행 동기"
          />
          <TextField
            value={methodText}
            onChange={setMethodText}
            placeholder="어떤 방법으로 범행을 저질렀나요?"
            rows={3}
            ariaLabel="범행 방법"
          />
          <TextField
            value={coverUpText}
            onChange={setCoverUpText}
            placeholder="범행을 어떻게 은폐하려 했나요?"
            rows={3}
            ariaLabel="은폐 방법"
          />
        </div>

        {/* 3. 제출 증거 */}
        <Kicker
          label={`3. 제출 증거 · ${selectedEvidenceIds.length}/${MAX_EVIDENCE} 선택`}
          className={styles.kicker}
        />
        {evidences.length === 0 ? (
          <p className={styles.emptyText}>제출할 수 있는 증거가 아직 없습니다.</p>
        ) : (
          <div className={styles.selector}>
            {selectedEvidences.length > 0 ? (
              <div className={styles.selectedPills}>
                {selectedEvidences.map((e) => (
                  <button
                    key={e.evidenceId}
                    className={styles.pillBtn}
                    onClick={() => toggleEvidence(e.evidenceId)}
                    type="button"
                  >
                    <Pill label={e.title} tone="primary" />
                  </button>
                ))}
              </div>
            ) : null}
            <div className={styles.evRows}>
              {evidences.map((e) => {
                const active = selectedEvidenceIds.includes(e.evidenceId);
                const disabled = !active && selectedEvidenceIds.length >= MAX_EVIDENCE;
                return (
                  <button
                    key={e.evidenceId}
                    className={`${styles.evRow} ${active ? styles.evRowActive : ""}`}
                    onClick={() => toggleEvidence(e.evidenceId)}
                    disabled={disabled}
                    aria-pressed={active}
                    type="button"
                  >
                    {active ? (
                      <CircleCheck size={16} strokeWidth={2} className={styles.evCheckOn} aria-hidden />
                    ) : (
                      <Circle size={16} strokeWidth={2} className={styles.evCheckOff} aria-hidden />
                    )}
                    <span className={styles.evName}>{e.title}</span>
                    <span className={styles.evLoc}>{e.locationName ?? "위치 미상"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 체크리스트(미충족 시) */}
        {!allMet ? (
          <div className={styles.checklist}>
            <p className={styles.checkTitle}>제출하려면 아래 항목을 완료해 주세요</p>
            {reqs.map(([label, met]) => (
              <div className={styles.checkRow} key={label}>
                {met ? (
                  <CircleCheck size={16} strokeWidth={2} className={styles.checkOn} aria-hidden />
                ) : (
                  <Circle size={16} strokeWidth={2} className={styles.checkOff} aria-hidden />
                )}
                <span className={met ? styles.checkLabelMet : styles.checkLabel}>{label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        {pendingResult ? (
          <div className={styles.pendingCard}>
            <p className={styles.pendingTitle}>결과 조회 대기</p>
            <p className={styles.pendingBody}>
              최종 추리는 제출되었습니다. 결과 화면 데이터가 준비되면 다시 불러올 수 있습니다.
            </p>
            <Button
              label={submitting ? "결과 확인 중" : "결과 다시 불러오기"}
              variant="secondary"
              expanded
              onPress={submitting ? undefined : onRetryResult}
            />
          </div>
        ) : null}

        <Button
          label={submitting ? "제출 중..." : "최종 추리 제출"}
          variant="danger"
          expanded
          onPress={canSubmit ? () => setConfirmOpen(true) : undefined}
          className={styles.submitBtn}
        />
      </div>

      {/* 제출 확인(정본 SubmitConfirmDialog 근사) */}
      <Modal
        open={confirmOpen}
        title="최종 추리 제출"
        onClose={() => setConfirmOpen(false)}
        secondaryAction={
          <Button
            label="취소"
            variant="secondary"
            expanded
            onPress={submitting ? undefined : () => setConfirmOpen(false)}
          />
        }
        primaryAction={
          <Button
            label={submitting ? "제출 중..." : "제출"}
            variant="danger"
            expanded
            onPress={
              submitting
                ? undefined
                : () => {
                    setConfirmOpen(false);
                    onSubmit();
                  }
            }
          />
        }
      >
        <p className={styles.confirmText}>
          {"제출하면 사건이 종결됩니다. 제출 후에는 답안을 수정할 수 없습니다.\n정말 제출하시겠습니까?"}
        </p>
        <div className={styles.confirmStats}>
          <span className={styles.confirmStat}>
            지목 · {selectedSuspect?.name ?? "—"}
          </span>
          <span className={styles.confirmStat}>증거 · {selectedEvidenceIds.length}개</span>
        </div>
      </Modal>
    </section>
  );
}
