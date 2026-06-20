import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ImageOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { publicImageUrl } from "../../api/request";
import styles from "./AssetImage.module.css";

// 픽셀 정본: lib/components/asset_image_widget.dart
//   AssetImageWidget — URL/키 이미지 + 로딩 shimmer(1400ms) + 폴백
//   CharacterPortrait — 프로필(이니셜 아바타 폴백)
//   EvidenceThumb     — 증거 썸네일(아이콘 박스 폴백)
//   ScenarioCoverImage— 시나리오 커버(그라디언트+코드 폴백)
// 이미지 URL은 publicImageUrl 로 해석(http면 그대로, 키면 API base prefix — Flutter의 startsWith('http') 분기와 동일).

type Fit = "cover" | "contain";

export interface AssetImageProps {
  /** S3/CDN URL 또는 상대 키. 비면 폴백. */
  src?: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  radius?: number;
  fit?: Fit;
  /** src 없음/에러 시 박스를 채울 폴백. 미지정 시 기본(ImageOff). */
  fallback?: ReactNode;
  className?: string;
}

export function AssetImage({
  src,
  alt,
  width = "100%",
  height = "100%",
  radius,
  fit = "cover",
  fallback,
  className,
}: AssetImageProps) {
  const resolved = publicImageUrl(src);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
  }, [resolved]);

  const wrapStyle: CSSProperties = { width, height };
  if (radius != null) wrapStyle.borderRadius = radius;

  const showFallback = !resolved || status === "error";

  return (
    <span className={className ? `${styles.wrap} ${className}` : styles.wrap} style={wrapStyle}>
      {showFallback ? (
        fallback ?? (
          <span className={styles.defaultFallback}>
            <ImageOff size={20} strokeWidth={2} aria-hidden />
          </span>
        )
      ) : (
        <>
          <img
            className={`${styles.img} ${fit === "contain" ? styles.fitContain : styles.fitCover}`}
            src={resolved}
            alt={alt}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
          {status === "loading" ? <span className={styles.shimmer} aria-hidden /> : null}
        </>
      )}
    </span>
  );
}

// ── CharacterPortrait ─────────────────────────────────────────────────────────

export interface CharacterPortraitProps {
  name: string;
  size: number;
  /** portraitImageUrl */
  src?: string;
  /** 기본 r4(10). */
  radius?: number;
  isWitness?: boolean;
  className?: string;
}

export function CharacterPortrait({ name, size, src, radius = 10, isWitness = false, className }: CharacterPortraitProps) {
  const initial = [...name][0] ?? "?";
  const fallback = (
    <span
      className={`${styles.portraitFallback} ${isWitness ? styles.witness : styles.subject}`}
      style={{ fontSize: size * 0.38 }}
    >
      {initial}
    </span>
  );
  return (
    <AssetImage src={src} alt={name} width={size} height={size} radius={radius} fallback={fallback} className={className} />
  );
}

// ── EvidenceThumb ─────────────────────────────────────────────────────────────

export interface EvidenceThumbProps {
  icon: LucideIcon;
  /** CSS 색 문자열. 기본 --primary. */
  iconColor?: string;
  /** imageUrl */
  src?: string;
  /** 기본 34. */
  size?: number;
  className?: string;
}

export function EvidenceThumb({ icon: Icon, iconColor = "var(--primary)", src, size = 34, className }: EvidenceThumbProps) {
  const iconBox = (
    <span className={styles.iconBox}>
      <Icon size={Math.round(size * 0.5)} color={iconColor} strokeWidth={2} aria-hidden />
    </span>
  );

  if (src) {
    return (
      <AssetImage src={src} alt="" width={size} height={size} radius={4} fit="cover" fallback={iconBox} className={className} />
    );
  }
  return (
    <span className={className ? `${styles.thumbWrap} ${className}` : styles.thumbWrap} style={{ width: size, height: size }}>
      {iconBox}
    </span>
  );
}

// ── ScenarioCoverImage ────────────────────────────────────────────────────────

export interface ScenarioCoverImageProps {
  /** 폴백 그라디언트 중앙에 표시할 짧은 코드. */
  code: string;
  /** 예: 16/9. */
  aspectRatio: number;
  /** thumbnailUrl */
  src?: string;
  className?: string;
}

export function ScenarioCoverImage({ code, aspectRatio, src, className }: ScenarioCoverImageProps) {
  const gradient = (
    <span className={styles.coverGradient}>
      <span className={styles.coverCode}>{code}</span>
    </span>
  );
  return (
    <span className={className ? `${styles.cover} ${className}` : styles.cover} style={{ aspectRatio: `${aspectRatio}` }}>
      {src ? <AssetImage src={src} alt={code} width="100%" height="100%" fallback={gradient} /> : gradient}
    </span>
  );
}
