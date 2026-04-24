import React from "react";
import "../../../style/LandingPage/SlidingToggle.css";

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
    <div className="sliding-toggle">
      <div
        className="sliding-toggle__indicator"
        style={{
          transform:
            activeIndex === 1 ? "translateX(calc(100% + 4px))" : "translateX(0)",
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`sliding-toggle__btn${value === opt.value ? " sliding-toggle__btn--active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
