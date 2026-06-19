// 정본: lib/screens/scene_screen.dart (SceneScreen)
//   서브헤더 'CRIME SCENE' + 힌트 버튼 → 현장 맵(4:3) → '주요 현장 정보' 장소 리스트 → 선택 장소 이미지.
// 웹 보존(koo #4):
//   · 맵/장소 이미지는 탭 시 onOpenImage(이미지 뷰어) — 기존 웹 LocationPanel 동작 보존.
//   · 힌트는 정본이 AppBar 버튼 → showHintModal(미이식 game_modal) → kit Modal 임시(브리핑과 동일 방침).
// 정본 차이(주석): 정본 _SceneMap 은 마커를 그리지 않음(샘플 핀만) → 웹의 맵 카운트 마커는 미표시
//   (해금 수는 장소 카드 '해금 n/m' 필로 노출되어 정보 손실 없음). 샘플 장소 fallback 은 웹에 없어 제외.
import { useState } from "react";
import { Lightbulb, Map, MapPin, Image as ImageIcon } from "lucide-react";
import type { CaseLocation, Hint, ImagePreview } from "../../../types";
import { Kicker, Empty, Pill, Modal, Button, ListSkeleton } from "../../ui";
import { AssetImage } from "../../domain";
import styles from "./SceneTab.module.css";

function MapPlaceholder() {
  return (
    <div className={styles.mapPlaceholder}>
      <Map size={48} strokeWidth={2} className={styles.mapPlaceholderIcon} aria-hidden />
      <span className={styles.mapPlaceholderText}>건물 평면도 영역</span>
    </div>
  );
}

export interface SceneTabProps {
  locations: CaseLocation[];
  mapImageUrl?: string;
  hints: Hint[];
  loading: boolean;
  onOpenImage: (preview: ImagePreview) => void;
  onUseHint: (hint: Hint) => void;
}

export function SceneTab({
  locations,
  mapImageUrl,
  hints,
  loading,
  onOpenImage,
  onUseHint,
}: SceneTabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const selected =
    selectedIndex != null && selectedIndex < locations.length
      ? locations[selectedIndex]
      : null;

  return (
    <div className={styles.tab}>
      {/* 고정 서브헤더(정본 AppBar: CRIME SCENE + 힌트) */}
      <div className={styles.subHeader}>
        <span className={styles.subTitle}>CRIME SCENE</span>
        <span className={styles.spacer} />
        <button
          className={styles.hintBtn}
          onClick={() => setHintOpen(true)}
          type="button"
          aria-label="힌트 보기"
        >
          <Lightbulb size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className={styles.scroll}>
        {/* 현장 맵 (4:3) */}
        <div className={styles.map}>
          {mapImageUrl ? (
            <button
              className={styles.mapBtn}
              onClick={() =>
                onOpenImage({
                  url: mapImageUrl,
                  title: "현장 지도",
                  subtitle: "CRIME SCENE",
                })
              }
              type="button"
              aria-label="현장 지도 크게 보기"
            >
              <AssetImage
                src={mapImageUrl}
                alt="현장 지도"
                width="100%"
                height="100%"
                fit="cover"
                fallback={<MapPlaceholder />}
              />
            </button>
          ) : (
            <MapPlaceholder />
          )}
        </div>

        {/* 주요 현장 정보 */}
        {locations.length > 0 ? (
          <>
            <Kicker label="주요 현장 정보" className={styles.kicker} />
            <div className={styles.locList}>
              {locations.map((loc, i) => {
                const active = selectedIndex === i;
                return (
                  <button
                    key={loc.locationId}
                    className={`${styles.locCard} ${active ? styles.locActive : ""}`}
                    onClick={() => setSelectedIndex(active ? null : i)}
                    type="button"
                  >
                    <MapPin size={18} strokeWidth={2} className={styles.locIcon} aria-hidden />
                    <span className={styles.locInfo}>
                      <span className={styles.locName}>{loc.name}</span>
                      {loc.floor ? (
                        <span className={styles.locFloor}>{loc.floor}</span>
                      ) : null}
                    </span>
                    <Pill
                      label={`해금 ${loc.unlockedEvidenceCount}/${loc.totalEvidenceCount}`}
                      tone="mute"
                    />
                    {loc.imageUrl ? (
                      <ImageIcon size={14} strokeWidth={2} className={styles.locPhoto} aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* 선택된 장소 이미지(있을 때만) */}
            {selected && selected.imageUrl ? (
              <button
                className={styles.locImageCard}
                onClick={() =>
                  onOpenImage({
                    url: selected.imageUrl!,
                    title: selected.name,
                    subtitle: selected.floor ?? "장소 이미지",
                  })
                }
                type="button"
                aria-label={`${selected.name} 이미지 크게 보기`}
              >
                <AssetImage
                  src={selected.imageUrl}
                  alt={selected.name}
                  width="100%"
                  height={160}
                  fit="cover"
                  fallback={
                    <div className={styles.locImageFallback}>
                      <MapPin size={32} strokeWidth={2} aria-hidden />
                    </div>
                  }
                />
                <span className={styles.locImageOverlay}>{selected.name}</span>
              </button>
            ) : null}
          </>
        ) : loading ? (
          <ListSkeleton itemCount={4} className={styles.skeleton} />
        ) : (
          <>
            <Kicker label="현장 정보" className={styles.kicker} />
            <Empty
              icon={Map}
              title="현장 정보 준비 중"
              subtitle="이 시나리오의 현장 데이터는 곧 제공될 예정입니다."
            />
          </>
        )}
      </div>

      {/* 힌트 Modal (kit Modal 임시 — 정본은 HintSheet 바텀시트) */}
      <Modal
        open={hintOpen}
        title="수사 힌트"
        onClose={() => setHintOpen(false)}
        secondaryAction={null}
        primaryAction={
          <Button label="닫기" variant="primary" expanded onPress={() => setHintOpen(false)} />
        }
      >
        {hints.length === 0 ? (
          <p className={styles.hintEmpty}>아직 사용할 수 있는 힌트가 없습니다.</p>
        ) : (
          <div className={styles.hintList}>
            {hints.map((h) => (
              <div className={styles.hintCard} key={h.hintId}>
                <div className={styles.hintMeta}>
                  <span className={styles.hintLevel}>힌트 {h.hintLevel}</span>
                  <span className={styles.hintDesc}>
                    {h.isUsed
                      ? h.content || "사용한 힌트입니다."
                      : h.isAvailable
                        ? `사용 시 ${h.penaltyScore}점이 차감됩니다.`
                        : h.remainingMinutes != null
                          ? `${h.remainingMinutes}분 후 사용할 수 있습니다.`
                          : "아직 사용할 수 없습니다."}
                  </span>
                </div>
                {!h.isUsed ? (
                  <Button
                    label="사용"
                    variant="secondary"
                    onPress={h.isAvailable ? () => onUseHint(h) : undefined}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
