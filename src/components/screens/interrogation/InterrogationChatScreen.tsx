// 정본: lib/screens/interrogation_chat_screen.dart
//   (+ interrogation_{app_bar,bubbles,input_bar,suggested_questions,waiting_bubble}.dart)
//   AppBar(back + 이름/역할 + 증거 제시) + 메시지 리스트(용의자/탐정 말풍선 + 대기 버블)
//   + 추천 질문 칩 바 + 입력 바(증거 제시/연동 + 질문 입력 + 전송).
// 웹 보존(koo #4): 컨트롤드 컴포넌트 — messages/question/pendingEvidence/sendQuestion 은 App 소유.
//   prop 계약 = 기존 인라인 ChatScreen 과 동일 → App.tsx 호출부 무변경(태그명만 교체).
// ⚠ 정본 차이(koo 확인용):
//   ① 추천 질문 = 웹 캔드 3개(하드코딩)를 Flutter SuggestedQuestionsBar 픽셀로 렌더(정본은 동적 guidance;
//      웹 챗 계약엔 suggestedQuestions 미전달 → 웹 동작 보존). chip tap = prefill only(자동 전송 금지).
//   ② 정본 AppBar 의 힌트 버튼은 웹 챗 계약(hints 미전달)에 없어 생략 — 현장 탭서 힌트 접근 가능
//      (추후 HintSheet 와 함께 추가 가능).
//   ③ 증거 제시 = 웹 EvidencePickerDialog → 바텀시트 EvidencePresentSheet 로 픽셀 이식(정본 game_modal).
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Send, Link2, X } from "lucide-react";
import type { Suspect, Evidence, ChatMessage } from "../../../types";
import { Button, TextField, Spinner } from "../../ui";
import { EvidencePresentSheet } from "./EvidencePresentSheet";
import styles from "./InterrogationChatScreen.module.css";

// 웹 캔드 추천 질문(하드코딩, 웹 동작 보존). 정본은 동적 guidance.
const CANNED_QUESTIONS = [
  "그 시간에 어디에 있었나요?",
  "피해자와 마지막으로 나눈 대화는 무엇인가요?",
  "이 진술과 맞지 않는 부분을 설명해 주세요.",
];

// 정본 SuspectBubble: 24 그라디언트 아바타(이니셜) + bgElev 말풍선(좌상 r1, 나머지 r4).
function SuspectBubble({ text, name }: { text: string; name: string }) {
  const initial = name.length > 0 ? Array.from(name)[0] : "?";
  return (
    <div className={styles.rowSuspect}>
      <span className={styles.avatar}>{initial}</span>
      <div className={styles.suspectBubble}>{text}</div>
    </div>
  );
}

// 정본 DetectiveBubble: 우측 정렬, primarySoft(또는 증거 제시 시 successSoft) 말풍선(우상 r1).
function DetectiveBubble({ text, isEvidence }: { text: string; isEvidence: boolean }) {
  return (
    <div className={styles.rowDetective}>
      <div
        className={`${styles.detectiveBubble} ${isEvidence ? styles.detectiveEvidence : ""}`}
      >
        {isEvidence ? (
          <span className={styles.evidenceTag}>
            <FileText size={14} strokeWidth={2} aria-hidden />
            증거 제시
          </span>
        ) : null}
        <span className={styles.detectiveText}>{text}</span>
      </div>
    </div>
  );
}

// 정본 WaitingBubble: bgHover 아바타(스피너) + bgElev 말풍선(스피너).
function WaitingBubble() {
  return (
    <div className={styles.rowSuspect}>
      <span className={`${styles.avatar} ${styles.avatarWaiting}`}>
        <Spinner size={14} />
      </span>
      <div className={styles.suspectBubble}>
        <Spinner size={16} color="var(--text-mute)" />
      </div>
    </div>
  );
}

export interface InterrogationChatScreenProps {
  suspect: Suspect;
  messages: ChatMessage[];
  question: string;
  setQuestion: (value: string) => void;
  pendingEvidence?: Evidence;
  evidences: Evidence[];
  loading: boolean;
  onBack: () => void;
  onPrefill: (question: string) => void;
  onAttachEvidence: (evidenceId: number) => void;
  onClearEvidence: () => void;
  onSend: () => void;
}

export function InterrogationChatScreen({
  suspect,
  messages,
  question,
  setQuestion,
  pendingEvidence,
  evidences,
  loading,
  onBack,
  onPrefill,
  onAttachEvidence,
  onClearEvidence,
  onSend,
}: InterrogationChatScreenProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 새 메시지/대기 시 하단으로 스크롤(정본 scrollToBottom — 프리젠테이션만).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const canPresent = evidences.length > 0 && !loading;

  return (
    <section className={styles.screen}>
      {/* ── AppBar(back + 이름/역할 + 증거 제시) ── */}
      <header className={styles.appBar}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          aria-label="뒤로"
          type="button"
        >
          <ArrowLeft size={20} strokeWidth={2} aria-hidden />
        </button>
        <div className={styles.appBarTitle}>
          <span className={styles.suspectName}>{suspect.name}</span>
          <span className={styles.suspectRole}>{suspect.role ?? "심문 대상"}</span>
        </div>
        <button
          className={styles.appBarAction}
          onClick={() => setPickerOpen(true)}
          disabled={!canPresent}
          aria-label="증거 제시"
          type="button"
        >
          <FileText size={20} strokeWidth={2} aria-hidden />
        </button>
      </header>

      {/* ── 메시지 리스트 ── */}
      <div className={styles.messages} ref={listRef}>
        {messages.map((m, i) =>
          m.sender === "suspect" ? (
            <SuspectBubble key={i} text={m.text} name={suspect.name} />
          ) : (
            <DetectiveBubble
              key={i}
              text={m.text}
              isEvidence={m.presentedEvidenceId != null}
            />
          ),
        )}
        {loading ? <WaitingBubble /> : null}
      </div>

      {/* ── 추천 질문 칩 바(prefill only) ── */}
      <div className={styles.suggested}>
        {CANNED_QUESTIONS.map((q) => (
          <button
            key={q}
            className={styles.suggestedChip}
            onClick={() => onPrefill(q)}
            disabled={loading}
            type="button"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── 입력 바 ── */}
      <div className={styles.inputBar}>
        {pendingEvidence ? (
          <div className={styles.prefillChip}>
            <Link2 size={16} strokeWidth={2} className={styles.prefillIcon} aria-hidden />
            <span className={styles.prefillText}>
              증거 연동됨: {pendingEvidence.title}
            </span>
            <button
              className={styles.prefillClose}
              onClick={onClearEvidence}
              aria-label="증거 연동 해제"
              type="button"
            >
              <X size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : (
          <Button
            label="증거 제시"
            variant="secondary"
            icon={FileText}
            expanded
            onPress={canPresent ? () => setPickerOpen(true) : undefined}
          />
        )}
        <div className={styles.inputRow}>
          <div className={styles.inputField}>
            <TextField
              value={question}
              onChange={setQuestion}
              placeholder="질문을 입력하세요..."
              maxLength={500}
              ariaLabel="질문 입력"
            />
          </div>
          <Button
            label=""
            icon={Send}
            variant="primary"
            ariaLabel="전송"
            onPress={loading ? undefined : onSend}
          />
        </div>
      </div>

      {pickerOpen ? (
        <EvidencePresentSheet
          evidences={evidences}
          selectedEvidenceId={pendingEvidence?.evidenceId}
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => {
            onAttachEvidence(id);
            setPickerOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}
