import styles from '@/features/board-game/components/RinkBoard.module.css';

/**
 * Pixel-art SVG rink markings overlay. Rendered position-absolute over the
 * RinkBoard grid so it scales with the board and never blocks pointer events.
 *
 * viewBox is 15 × 7 (wide) or 7 × 15 (narrow/portrait). One unit = one
 * board tile; tile centre = col+0.5 / row+0.5.
 */
interface RinkOverlayProps {
  narrow: boolean;
}

/** Faceoff circle with cross-hair, drawn at (cx, cy) in tile-unit space. */
function FaceoffCircle({ cx, cy }: { cx: number; cy: number }) {
  const r = 1.1;
  const crossLen = 0.3;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.07}
      />
      <circle cx={cx} cy={cy} r={0.14} fill="var(--color-rink-circle-red)" />
      <line
        x1={cx - crossLen}
        y1={cy}
        x2={cx + crossLen}
        y2={cy}
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.06}
      />
      <line
        x1={cx}
        y1={cy - crossLen}
        x2={cx}
        y2={cy + crossLen}
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.06}
      />
    </g>
  );
}

/** Centre-ice circle (larger ring) with a blue centre spot. */
function CenterCircle({ cx, cy }: { cx: number; cy: number }) {
  const r = 1.4;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.09}
      />
      <circle cx={cx} cy={cy} r={0.22} fill="var(--color-rink-line-blue)" />
    </g>
  );
}

/**
 * Goal crease — a thin rounded rectangle hugging the end boards.
 * Width is kept to ~1.4 tiles so it stays within col 1 (user) / col 13 (cpu)
 * and never overlaps the faceoff circles at col 2 / col 12.
 *
 *   user side: x=0,    width=1.4,  rows 2→5
 *   cpu  side: x=13.6, width=1.4,  rows 2→5
 */
function Crease({ side }: { side: 'user' | 'cpu' }) {
  const w = 1.4;
  const x = side === 'user' ? 0 : 15 - w;
  const y = 2;
  const h = 3;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={0.35}
      ry={0.35}
      fill="var(--color-rink-crease)"
      stroke="var(--color-rink-circle-red)"
      strokeWidth={0.06}
    />
  );
}

/** Small faceoff dot (no ring) for neutral-zone positions. */
function FaceoffDot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <circle cx={cx} cy={cy} r={0.16} fill="var(--color-rink-circle-red)" />
  );
}

function Markings15x7() {
  return (
    <>
      {/* Creases — narrow rects at each end, clear of faceoff circles */}
      <Crease side="user" />
      <Crease side="cpu" />

      {/* End-zone faceoff circles */}
      <FaceoffCircle cx={2.5} cy={1.5} />
      <FaceoffCircle cx={2.5} cy={5.5} />
      <FaceoffCircle cx={12.5} cy={1.5} />
      <FaceoffCircle cx={12.5} cy={5.5} />

      {/* Neutral-zone face-off dots (no ring) */}
      <FaceoffDot cx={5.5} cy={1.5} />
      <FaceoffDot cx={5.5} cy={5.5} />
      <FaceoffDot cx={9.5} cy={1.5} />
      <FaceoffDot cx={9.5} cy={5.5} />

      {/* Centre-ice circle + dot */}
      <CenterCircle cx={7.5} cy={3.5} />
    </>
  );
}

/**
 * Portrait (narrow) version. Engine coords → SVG coords:
 *   svgX = engineRow + 0.5  (tile centre)
 *   svgY = 15 - engineCol - 0.5
 */
function Markings7x15() {
  function t(col: number, row: number) {
    return { cx: row + 0.5, cy: 15 - col - 0.5 };
  }

  const uf1 = t(2, 1);
  const uf2 = t(2, 5);
  const cf1 = t(12, 1);
  const cf2 = t(12, 5);
  const nd1 = t(5, 1);
  const nd2 = t(5, 5);
  const nd3 = t(9, 1);
  const nd4 = t(9, 5);
  const center = t(7, 3);

  // Crease in portrait:
  //   user crease: engineCols 0–1.4, engineRows 2–5
  //     → svgX: rows 2–5 = 2..5, svgY: cols 0–1.4 → 15-0..15-1.4 = 13.6..15
  //   cpu  crease: engineCols 13.6–15, engineRows 2–5
  //     → svgY: 15-13.6..15-15 = 0..1.4
  const cw = 3; // height in portrait = 3 rows (svgX dimension)
  const ch = 1.4; // width in portrait = 1.4 cols (svgY dimension)
  return (
    <>
      {/* User crease — bottom of portrait (Blue net is at bottom) */}
      <rect
        x={2}
        y={15 - ch}
        width={cw}
        height={ch}
        rx={0.35}
        ry={0.35}
        fill="var(--color-rink-crease)"
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.06}
      />
      {/* CPU crease — top of portrait */}
      <rect
        x={2}
        y={0}
        width={cw}
        height={ch}
        rx={0.35}
        ry={0.35}
        fill="var(--color-rink-crease)"
        stroke="var(--color-rink-circle-red)"
        strokeWidth={0.06}
      />

      <FaceoffCircle cx={uf1.cx} cy={uf1.cy} />
      <FaceoffCircle cx={uf2.cx} cy={uf2.cy} />
      <FaceoffCircle cx={cf1.cx} cy={cf1.cy} />
      <FaceoffCircle cx={cf2.cx} cy={cf2.cy} />
      <FaceoffDot cx={nd1.cx} cy={nd1.cy} />
      <FaceoffDot cx={nd2.cx} cy={nd2.cy} />
      <FaceoffDot cx={nd3.cx} cy={nd3.cy} />
      <FaceoffDot cx={nd4.cx} cy={nd4.cy} />
      <CenterCircle cx={center.cx} cy={center.cy} />
    </>
  );
}

export default function RinkOverlay({ narrow }: RinkOverlayProps) {
  if (narrow) {
    return (
      <svg
        className={styles.rinkOverlay}
        viewBox="0 0 7 15"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <Markings7x15 />
      </svg>
    );
  }

  return (
    <svg
      className={styles.rinkOverlay}
      viewBox="0 0 15 7"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <Markings15x7 />
    </svg>
  );
}
