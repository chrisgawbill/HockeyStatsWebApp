import React, { useEffect, useMemo } from 'react';
import { useListOfGames } from '../Data/Context/ScheduleContext';
import PageHeader from '../Components/PageHeader';
import { Container } from 'react-bootstrap';
import { ScheduledGame } from '../Data/Models/ScheduledGame';
import styles from '../style/SchedulePage.module.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScheduleCard from '../Components/SchedulePage/ScheduleCard';
import DatePicker from '../Components/SchedulePage/DatePicker';

function parseLocalDate(dateStr: string | null): Date | null {
	if (!dateStr) return null;

	const parts = dateStr.split('-').map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

	const [year, month, day] = parts;
	return new Date(year, month - 1, day);
}

function formatDateParam(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function SchedulePage() {
	const {
		listOfGamesData,
		loadingListOfGamesData,
		selectedDateGames,
		fetchGamesByDate,
	} = useListOfGames();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const selectedDateParam = searchParams.get('date');
	const selectedDate = useMemo(
		() => parseLocalDate(selectedDateParam) ?? new Date(),
		[selectedDateParam],
	);

	const sortedGames = useMemo(
		() =>
			[...(listOfGamesData ?? [])].sort(
				(a: ScheduledGame, b: ScheduledGame) =>
					new Date(a.date).getTime() - new Date(b.date).getTime(),
			),
		[listOfGamesData],
	);

	useEffect(() => {
		if (!loadingListOfGamesData && listOfGamesData?.length > 0) {
			fetchGamesByDate(selectedDate);
		}
	}, [fetchGamesByDate, listOfGamesData, loadingListOfGamesData, selectedDate]);

	const handleDateChange = (date: Date) => {
		setSearchParams({ date: formatDateParam(date) });
		fetchGamesByDate(date);
	};

	if (loadingListOfGamesData) {
		return <div>Loading...</div>;
	}
	if (!listOfGamesData || listOfGamesData.length === 0) {
		return <div>No games scheduled</div>;
	}

	const isGameCompleted = (game: ScheduledGame): boolean => {
		return game.gameState === 'OFF' || game.gameState === 'FINAL';
	};

	const goToGameDetails = (game: ScheduledGame) => {
		if (isGameCompleted(game)) {
			navigate(`/game/${game.gameId}`, {
				state: {
					sourcePath: `/schedule?date=${formatDateParam(selectedDate)}`,
					fallbackPath: `/schedule?date=${formatDateParam(selectedDate)}`,
					activeNavPath: '/schedule',
				},
			});
		}
	};

	return (
		<>
			<PageHeader />
			<Container fluid className={styles["schedule-page"]}>
				<DatePicker
					sortedGames={sortedGames}
					selectedDate={selectedDate}
					onDateChange={handleDateChange}
				/>
				{selectedDateGames.map((game: ScheduledGame) => {
					return (
						<ScheduleCard
							key={game.gameId}
							game={game}
							isGameCompleted={isGameCompleted}
							goToGameDetails={goToGameDetails}
						/>
					);
				})}
			</Container>
		</>
	);
}

export default SchedulePage;
