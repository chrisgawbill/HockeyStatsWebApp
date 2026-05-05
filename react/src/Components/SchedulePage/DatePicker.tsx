import { Row, ButtonGroup, Button } from 'react-bootstrap';

type DatePickerProps = {
	sortedGames: { date: string }[];
	selectedDate: Date;
	onDateChange: (date: Date) => void;
};

function parseLocalDate(dateStr: string | Date): Date {
	if (dateStr instanceof Date) {
		return new Date(
			dateStr.getFullYear(),
			dateStr.getMonth(),
			dateStr.getDate(),
		);
	}

	const [year, month, day] = dateStr.split('-').map(Number);
	return new Date(year, month - 1, day);
}

function toDateKey(d: Date): number {
	return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getCorrectDate(
	date: Date,
	lowerBound: Date,
	upperBound: Date,
	dayAddOrMinus: string,
	onDateChange: (date: Date) => void,
) {
	const newDate = new Date(date);
	if (dayAddOrMinus === 'add') {
		newDate.setDate(newDate.getDate() + 1);
	} else {
		newDate.setDate(newDate.getDate() - 1);
	}
	const newKey = toDateKey(newDate);
	const lowerKey = toDateKey(lowerBound);
	const upperKey = toDateKey(upperBound);
	if (newKey >= lowerKey && newKey <= upperKey) {
		onDateChange(newDate);
	}
}

const DatePicker = ({ sortedGames, selectedDate, onDateChange }: DatePickerProps) => {
	const lowerBound: Date = parseLocalDate(sortedGames[0].date);
	const upperBound: Date = parseLocalDate(
		sortedGames[sortedGames.length - 1].date,
	);
	const selectedKey = toDateKey(selectedDate);
	const isPrevButtonDisabled = selectedKey <= toDateKey(lowerBound);
	const isNextButtonDisabled = selectedKey >= toDateKey(upperBound);

	return (
		<Row className='date-row'>
			<ButtonGroup>
				<Button
					className='btn btn-primary schedule-nav-btn'
					onClick={() =>
						getCorrectDate(
							selectedDate,
							lowerBound,
							upperBound,
							'minus',
							onDateChange,
						)
					}
					disabled={isPrevButtonDisabled}
					aria-label='Previous day'
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
				<p className='schedule-date-label'>
					{selectedDate.toLocaleString('default', { month: 'long' })}{' '}
					{selectedDate.getDate()}, {selectedDate.getFullYear()}
				</p>
				<Button
					className='btn btn-primary schedule-nav-btn'
					onClick={() =>
						getCorrectDate(
							selectedDate,
							lowerBound,
							upperBound,
							'add',
							onDateChange,
						)
					}
					disabled={isNextButtonDisabled}
					aria-label='Next day'
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
