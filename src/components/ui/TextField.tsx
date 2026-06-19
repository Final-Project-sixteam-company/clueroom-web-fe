import type { ChangeEvent } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./TextField.module.css";

// 픽셀 정본: lib/components/ms_text_field.dart (MSTextField)
// bg, r3, 1px line → focus 1.5px primary + glow(primary@28 spread3 blur0)@dur2.
// pad L12/TB9(멀티라인 TB12), suffix 아이콘 20.
// 포커스 상태는 :focus-within 로 JS 없이 처리.

export interface TextFieldProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  suffixIcon?: LucideIcon;
  maxLength?: number;
  /** Flutter maxLines. >1 이면 textarea. 기본 1. */
  rows?: number;
  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
}

export function TextField({
  value,
  defaultValue,
  onChange,
  placeholder,
  suffixIcon: Suffix,
  maxLength,
  rows = 1,
  disabled,
  id,
  name,
  ariaLabel,
  className,
}: TextFieldProps) {
  const multiline = rows > 1;

  const fieldClass = [
    styles.field,
    multiline ? styles.multiline : "",
    Suffix ? styles.hasSuffix : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value);
  const handleTextarea = (e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value);

  return (
    <div className={fieldClass}>
      {multiline ? (
        <textarea
          className={styles.input}
          value={value}
          defaultValue={defaultValue}
          onChange={handleTextarea}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          id={id}
          name={name}
          aria-label={ariaLabel}
        />
      ) : (
        <input
          className={styles.input}
          type="text"
          value={value}
          defaultValue={defaultValue}
          onChange={handleInput}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          id={id}
          name={name}
          aria-label={ariaLabel}
        />
      )}
      {Suffix ? (
        <span className={styles.suffix}>
          <Suffix size={20} strokeWidth={2} aria-hidden />
        </span>
      ) : null}
    </div>
  );
}
