import { useState } from "react";
import type { ReactNode } from "react";
import { Search, SearchX, Plus } from "lucide-react";
import type { Evidence, Suspect } from "../../types";
import {
  Button,
  Pill,
  Kicker,
  StatRow,
  TextField,
  FilterChip,
  BottomNav,
  CASE_NAV_ITEMS,
  Spinner,
  Skeleton,
  ListSkeleton,
  Empty,
  Modal,
  ToastProvider,
  useToast,
  type ToastTone,
} from "../ui";
import {
  AssetImage,
  CharacterPortrait,
  EvidenceThumb,
  ScenarioCoverImage,
  EvidenceTile,
  EvidenceItem,
  SuspectCard,
  TimelineList,
  ImageViewerModal,
  evidenceCategoryIcon,
  type TimelineRow,
} from "../domain";
import styles from "./Gallery.module.css";

// 컴포넌트 킷 + 도메인 카드 육안 검증용 갤러리.
// main.tsx 가 #gallery 해시일 때만 lazy 로드 → 앱 번들/App.tsx 무영향.

// ── 샘플 데이터 (웹 도메인 타입) ──────────────────────────────────────────────
const FILTERS = ["전체", "물적", "문서", "디지털", "증언"];

const evUnlocked: Evidence = {
  evidenceId: 1,
  title: "찢긴 카페 영수증",
  isUnlocked: true,
  locationName: "주방",
  category: "DOCUMENT",
  categoryLabel: "문서",
};
const evDigital: Evidence = {
  evidenceId: 2,
  title: "삭제된 통화 로그",
  isUnlocked: true,
  locationName: "서재",
  category: "DIGITAL_LOG",
};
const evPhysical: Evidence = {
  evidenceId: 3,
  title: "깨진 와인잔",
  isUnlocked: true,
  locationName: "거실",
  category: "PHYSICAL",
};

const suspect: Suspect = {
  suspectId: 1,
  name: "박재민",
  role: "피해자의 사업 동료",
  isWitness: false,
  interrogationCount: 2,
};
const witness: Suspect = {
  suspectId: 2,
  name: "문하연",
  role: "현장 목격자",
  isWitness: true,
  interrogationCount: 0,
};

const timeline: TimelineRow[] = [
  { time: "21:00", label: "피해자 마지막 목격" },
  { time: "21:30", label: "정전 발생", description: "건물 전체가 약 5분간 정전됨" },
  { time: "22:10", label: "시신 발견", conflict: "용의자 진술과 30분 차이가 있음" },
];

// 온라인일 때만 로드되는 데모 이미지(오프라인이면 폴백 표시 — 그게 정본 갭 복원 포인트).
const DEMO_IMG = "https://picsum.photos/seed/clueroom/200/200";

// ── 레이아웃 헬퍼 ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <Kicker label={title} />
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

function Stack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

// ── 갤러리 본문 ───────────────────────────────────────────────────────────────
function GalleryBody() {
  const toast = useToast();
  const [filter, setFilter] = useState(0);
  const [navIndex, setNavIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [text, setText] = useState("");

  const fireToast = (tone: ToastTone) =>
    toast.show(
      tone === "primary" ? "단서가 추가됐어요" : tone === "success" ? "증거 분석이 완료됐어요" : "용의자가 도주했어요",
      { tone },
    );

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.heading}>ClueRoom 컴포넌트 킷</h1>
        <p className={styles.sub}>프리미티브 12 + 도메인 카드 — 픽셀 정본 대조용</p>

        {/* ── 프리미티브 ── */}
        <Section title="Button">
          <Stack>
            <Row>
              <Button label="Primary" onPress={() => {}} />
              <Button label="Secondary" variant="secondary" onPress={() => {}} />
              <Button label="Ghost" variant="ghost" onPress={() => {}} />
              <Button label="Danger" variant="danger" onPress={() => {}} />
            </Row>
            <Row>
              <Button label="아이콘" icon={Search} onPress={() => {}} />
              <Button label="로딩" loading onPress={() => {}} />
              <Button label="비활성" />
              <Button icon={Plus} ariaLabel="추가" onPress={() => {}} />
              <Button label="아이콘 전용 secondary" icon={Search} variant="secondary" onPress={() => {}} />
            </Row>
            <Button label="Expanded primary" expanded onPress={() => {}} />
          </Stack>
        </Section>

        <Section title="Pill">
          <Row>
            <Pill label="suspect" tone="primary" />
            <Pill label="alibi" tone="success" />
            <Pill label="guilty" tone="danger" />
            <Pill label="미상" tone="mute" />
          </Row>
        </Section>

        <Section title="Kicker">
          <Kicker label="suspect timeline" />
        </Section>

        <Section title="StatRow">
          <Stack>
            <StatRow
              cells={[
                { label: "진행 시간", value: "14:22" },
                { label: "확보 단서", value: "8/12", tone: "good" },
                { label: "위험도", value: "94%", tone: "warn" },
              ]}
            />
            <StatRow
              cells={[
                { label: "알리바이", value: "불확실", tone: "warn" },
                { label: "혈액형", value: "AB" },
                { label: "지문 일치", value: "100%", tone: "good" },
                { label: "접근 권한", value: "있음" },
              ]}
            />
          </Stack>
        </Section>

        <Section title="TextField">
          <Stack>
            <TextField placeholder="이름을 입력하세요" value={text} onChange={setText} />
            <TextField placeholder="검색" suffixIcon={Search} />
            <TextField placeholder="동기를 5자 이상 적어주세요" rows={3} maxLength={200} />
          </Stack>
        </Section>

        <Section title="FilterChip">
          <Row>
            {FILTERS.map((f, i) => (
              <FilterChip key={f} label={f} active={filter === i} onPress={() => setFilter(i)} />
            ))}
          </Row>
        </Section>

        <Section title="BottomNav">
          <BottomNav items={CASE_NAV_ITEMS} currentIndex={navIndex} onTap={setNavIndex} />
        </Section>

        <Section title="Spinner / Skeleton">
          <Stack>
            <Row>
              <Spinner />
              <Spinner size={24} />
            </Row>
            <Row>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={16} />
            </Row>
            <ListSkeleton itemCount={3} />
          </Stack>
        </Section>

        <Section title="Empty">
          <Empty
            icon={SearchX}
            title="단서가 없어요"
            subtitle="새로운 증거를 수집하거나 조건을 바꿔보세요"
            action={<Button label="단서 다시 찾기" variant="secondary" onPress={() => {}} />}
          />
        </Section>

        <Section title="Modal / Toast">
          <Stack>
            <Row>
              <Button label="Toast primary" variant="secondary" onPress={() => fireToast("primary")} />
              <Button label="Toast success" variant="secondary" onPress={() => fireToast("success")} />
              <Button label="Toast danger" variant="secondary" onPress={() => fireToast("danger")} />
            </Row>
            <Button label="Modal 열기" variant="secondary" onPress={() => setModalOpen(true)} />
          </Stack>
        </Section>

        {/* ── 도메인 ── */}
        <Section title="Portrait / Thumb / Cover">
          <Stack>
            <Row>
              <CharacterPortrait name="박재민" size={60} />
              <CharacterPortrait name="문하연" size={60} isWitness />
              <CharacterPortrait name="윤서하" size={60} src={DEMO_IMG} />
            </Row>
            <Row>
              <EvidenceThumb icon={evidenceCategoryIcon("PHYSICAL")} />
              <EvidenceThumb icon={evidenceCategoryIcon("DOCUMENT")} />
              <EvidenceThumb icon={evidenceCategoryIcon("DIGITAL_LOG")} />
              <EvidenceThumb icon={evidenceCategoryIcon("TESTIMONY")} />
              <EvidenceThumb icon={evidenceCategoryIcon("PHYSICAL")} src={DEMO_IMG} />
            </Row>
            <div className={styles.coverBox}>
              <ScenarioCoverImage code="CR-014" aspectRatio={16 / 9} />
            </div>
          </Stack>
        </Section>

        <Section title="EvidenceTile / EvidenceItem">
          <Stack>
            <EvidenceTile evidence={evUnlocked} onPress={() => {}} />
            <EvidenceTile evidence={evDigital} onPress={() => {}} isNew />
            <EvidenceTile evidence={evPhysical} onPress={() => {}} isNewlyUnlocked />
            <EvidenceTile evidence={evUnlocked} isTimeLocked />
            <EvidenceItem evidence={evDigital} onPress={() => {}} />
          </Stack>
        </Section>

        <Section title="SuspectCard">
          <Stack>
            <SuspectCard suspect={suspect} onPress={() => {}} />
            <SuspectCard suspect={witness} onPress={() => {}} />
          </Stack>
        </Section>

        <Section title="TimelineList">
          <TimelineList entries={timeline} />
        </Section>

        <Section title="ImageViewerModal">
          <Stack>
            <div className={styles.viewerThumb}>
              <AssetImage src={DEMO_IMG} alt="증거 이미지" width={64} height={64} radius={8} />
            </div>
            <Button label="이미지 뷰어 열기" variant="secondary" onPress={() => setViewerOpen(true)} />
          </Stack>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        title="증거 삭제"
        onClose={() => setModalOpen(false)}
        secondaryAction={<Button label="취소" variant="secondary" expanded onPress={() => setModalOpen(false)} />}
        primaryAction={<Button label="삭제" variant="danger" expanded onPress={() => setModalOpen(false)} />}
      >
        이 증거를 삭제하면 복구할 수 없어요. 계속할까요?
      </Modal>

      <ImageViewerModal open={viewerOpen} src={DEMO_IMG} label="찢긴 카페 영수증" onClose={() => setViewerOpen(false)} />
    </div>
  );
}

export default function Gallery() {
  return (
    <ToastProvider>
      <GalleryBody />
    </ToastProvider>
  );
}
