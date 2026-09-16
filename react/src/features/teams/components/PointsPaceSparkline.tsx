import styles from '@/features/teams/components/TeamPage.module.css';

interface PointsPaceSparklineProps {
  values: number[];
}

export default function PointsPaceSparkline({
  values,
}: PointsPaceSparklineProps) {
  const width = 240;
  const height = 72;
  const padding = 6;
  const points = values.map((value, index) => {
    const x =
      values.length <= 1
        ? width / 2
        : padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = padding + (1 - Math.max(0, Math.min(1, value))) * (height - padding * 2);
    return `${x},${y}`;
  });
  const referenceY = height / 2;

  return (
    <svg
      className={styles['points-sparkline']}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Rolling points percentage over completed games"
    >
      <line
        x1={padding}
        x2={width - padding}
        y1={referenceY}
        y2={referenceY}
        className={styles['points-sparkline__reference']}
      />
      {points.length > 0 && (
        <polyline
          points={points.join(' ')}
          className={styles['points-sparkline__line']}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
