import React from "react";
import styles from "../../../style/LandingPage/SlidingToggle.module.css";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
}

export default function SlidingToggle<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div className={styles["sliding-toggle"]}>
      <div
        className={styles["sliding-toggle__indicator"]}
        style={{
          transform:
            activeIndex === 1 ? "translateX(calc(100% + 4px))" : "translateX(0)",
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          className={cx(styles["sliding-toggle__btn"], value === opt.value && styles["sliding-toggle__btn--active"])}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
