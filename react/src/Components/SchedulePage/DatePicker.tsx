import { Row, ButtonGroup, Button } from 'react-bootstrap';
import styles from '../../style/SchedulePage.module.css';

type ScheduleView = 'day' | 'week' | 'month';

type DatePickerProps = {
	sortedGames: { date: Date }[];
	selectedDate: Date;
	view: ScheduleView;
	onDateChange: (date: Date) => void;
};

/**
 * Converts a Date to a YYYYMMDD number for local-day comparisons that ignore
 * time-of-day.
 */
function toDateKey(d: Date): number {
	return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/**
 * Returns the Sunday-start anchor for the week containing `date`.
 */
function startOfWeek(date: Date): Date {
	const start = new Date(date);
	start.setDate(date.getDate() - date.getDay());
	return start;
}

/**
 * Returns the first and last local calendar days spanned by the active view.
 * Used for display labels and for disabling prev/next buttons at season bounds.
 */
function periodBounds(date: Date, view: ScheduleView): [Date, Date] {
	if (view === 'week') {
		const start = startOfWeek(date);
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return [start, end];
	}
	if (view === 'month') {
		const start = new Date(date.getFullYear(), date.getMonth(), 1);
		const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return [start, end];
	}
	return [date, date];
}

/**
 * Moves the schedule anchor by one active-view unit and returns a new Date.
 */
function stepAnchor(date: Date, view: ScheduleView, direction: 1 | -1): Date {
	if (view === 'week') {
		const next = new Date(date);
		next.setDate(date.getDate() + 7 * direction);
		return next;
	}
	if (view === 'month') {
		return new Date(date.getFullYear(), date.getMonth() + direction, 1);
	}
	const next = new Date(date);
	next.setDate(date.getDate() + direction);
	return next;
}

/**
 * Formats the visible schedule period as a day, week range, or month label for
 * the pager header.
 */
function formatPeriodLabel(date: Date, view: ScheduleView): string {
	if (view === 'month') {
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}
	if (view === 'week') {
		const [start, end] = periodBounds(date, view);
		const startStr = start.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
		const endStr = end.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
		});
		return `${startStr} – ${endStr}, ${end.getFullYear()}`;
	}
	return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Prev/next pager for the schedule, stepping by the active view's unit (day, week,
 * or month). The arrows are bounded by the loaded season — the first and last game
 * dates in `sortedGames` — so the user can't page past where games exist.
 */
const DatePicker = ({
	sortedGames,
	selectedDate,
	view,
	onDateChange,
}: DatePickerProps) => {
	const lowerBound: Date = sortedGames[0].date;
	const upperBound: Date = sortedGames[sortedGames.length - 1].date;

	const [periodStart, periodEnd] = periodBounds(selectedDate, view);
	const isPrevButtonDisabled = toDateKey(periodStart) <= toDateKey(lowerBound);
	const isNextButtonDisabled = toDateKey(periodEnd) >= toDateKey(upperBound);

	/**
	 * Steps the current anchor by one view unit, clamps it inside the loaded
	 * season bounds, and emits the resulting date to the parent page.
	 */
	const goTo = (direction: 1 | -1) => {
		let next = stepAnchor(selectedDate, view, direction);
		if (toDateKey(next) < toDateKey(lowerBound)) next = lowerBound;
		if (toDateKey(next) > toDateKey(upperBound)) next = upperBound;
		onDateChange(next);
	};

	return (
		<Row className={styles["date-row"]}>
			<ButtonGroup>
				<Button
					className={`btn btn-primary ${styles["schedule-nav-btn"]}`}
					onClick={() => goTo(-1)}
					disabled={isPrevButtonDisabled}
					aria-label={`Previous ${view}`}
				>
					<svg
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<polyline points='15 18 9 12 15 6' />
					</svg>
				</Button>
				<p className={styles["schedule-date-label"]}>
					{formatPeriodLabel(selectedDate, view)}
				</p>
				<Button
					className={`btn btn-primary ${styles["schedule-nav-btn"]}`}
					onClick={() => goTo(1)}
					disabled={isNextButtonDisabled}
					aria-label={`Next ${view}`}
				>
					<svg
						width='20'
						height='20'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						strokeLinejoin='round'
						aria-hidden='true'
					>
						<polyline points='9 18 15 12 9 6' />
					</svg>
				</Button>
			</ButtonGroup>
		</Row>
	);
};
export default DatePicker;
