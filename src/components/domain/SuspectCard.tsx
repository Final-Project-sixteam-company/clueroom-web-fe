import { MessageCircle } from "lucide-react";
import type { Suspect } from "../../types";
import { Pill } from "../ui";
import { CharacterPortrait } from "./AssetImage";
import styles from "./SuspectCard.module.css";

// 픽셀 정본: lib/components/suspect_card.dart (SuspectCard)
//   pad 16, r4, 포트레이트 40(r3), 이름 titleM14, '증인' mute 필, role bodySm, 심문 칩.
//   데이터는 웹 Suspect 타입(portraitImageUrl/isWitness/interrogationCount).

export interface SuspectCardProps {
  suspect: Suspect;
  onPress?: () => void;
}

export function SuspectCard({ suspect, onPress }: SuspectCardProps) {
  const count = suspect.interrogationCount ?? 0;
  return (
    <button type="button" className={styles.card} onClick={onPress} disabled={onPress == null}>
      <span className={styles.row}>
        <CharacterPortrait
          name={suspect.name}
          size={40}
          src={suspect.portraitImageUrl}
          radius={8}
          isWitness={suspect.isWitness ?? false}
        />
        <span className={styles.info}>
          <span className={styles.nameRow}>
            <span className={styles.name}>{suspect.name}</span>
            {suspect.isWitness ? <Pill label="증인" tone="mute" /> : null}
          </span>
          {suspect.role ? <span className={styles.role}>{suspect.role}</span> : null}
          {count > 0 ? (
            <span className={styles.interrogationChip}>
              <MessageCircle size={11} strokeWidth={2} aria-hidden />
              {`심문 ${count}회`}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
