import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from '../Components/PageHeader';
import LoadingState from '../Components/LoadingState';
import { GetHealth, GetCacheReport } from '../Services/ApiHandler';
import styles from '../style/DiagnosticsPage.module.css';

const cx = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(' ');

const SESSION_KEY = 'diagnostics-key';

interface HealthData {
	status: string;
	version: string;
	environment: string;
	currentSeason: string;
	cacheWritable: boolean;
	anthropicKeyConfigured: boolean;
	uptime: number;
	currentTime: string;
}

interface CacheReportData {
	sections: Record<string, number>;
	largestSection: { type: string | null; size: number };
	total: number;
}

function formatBytes(bytes: number): string {
	if (!bytes) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.min(
		Math.floor(Math.log(bytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = bytes / Math.pow(1024, i);
	return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds: number): string {
	const s = Math.floor(seconds % 60);
	const m = Math.floor((seconds / 60) % 60);
	const h = Math.floor(seconds / 3600);
	const parts: string[] = [];
	if (h) parts.push(`${h}h`);
	if (h || m) parts.push(`${m}m`);
	parts.push(`${s}s`);
	return parts.join(' ');
}

function LockIcon() {
	return (
		<svg
			width='22'
			height='22'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
			<path d='M7 11V7a5 5 0 0 1 10 0v4' />
		</svg>
	);
}

function RefreshIcon() {
	return (
		<svg
			width='18'
			height='18'
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
			aria-hidden='true'
		>
			<polyline points='23 4 23 10 17 10' />
			<polyline points='1 20 1 14 7 14' />
			<path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' />
		</svg>
	);
}

function StatusBadge({
	ok,
	okLabel = 'Available',
	badLabel = 'Unavailable',
}: {
	ok: boolean;
	okLabel?: string;
	badLabel?: string;
}) {
	return (
		<span
			className={cx(
				styles['status-badge'],
				ok ? styles['status-badge--ok'] : styles['status-badge--bad'],
			)}
		>
			<span className={styles['status-badge__dot']} aria-hidden='true' />
			{ok ? okLabel : badLabel}
		</span>
	);
}

function StatCard({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className={styles['diagnostics-stat-card']}>
			<span className={styles['diagnostics-stat-card__label']}>{label}</span>
			<span className={styles['diagnostics-stat-card__value']}>{children}</span>
		</div>
	);
}

const DiagnosticsPage = () => {
	const [passphrase, setPassphrase] = useState('');
	const [health, setHealth] = useState<HealthData | null>(null);
	const [cacheReport, setCacheReport] = useState<CacheReportData | null>(null);
	const [authed, setAuthed] = useState(false);
	const [loading, setLoading] = useState(false);
	const [authError, setAuthError] = useState(false);
	const [fetchError, setFetchError] = useState(false);

	const loadDiagnostics = useCallback(async (key: string) => {
		setLoading(true);
		setAuthError(false);
		setFetchError(false);
		try {
			const [healthData, cacheData] = await Promise.all([
				GetHealth(key),
				GetCacheReport(key),
			]);
			setHealth(healthData);
			setCacheReport(cacheData);
			setAuthed(true);
			sessionStorage.setItem(SESSION_KEY, key);
		} catch (error: any) {
			sessionStorage.removeItem(SESSION_KEY);
			setAuthed(false);
			if (error?.response?.status === 401) {
				setAuthError(true);
			} else {
				setFetchError(true);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	// Re-use a passphrase stored earlier this tab session so a refresh keeps you in.
	useEffect(() => {
		const stored = sessionStorage.getItem(SESSION_KEY);
		if (stored) {
			setPassphrase(stored);
			loadDiagnostics(stored);
		}
	}, [loadDiagnostics]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const key = passphrase.trim();
		if (!key) return;
		loadDiagnostics(key);
	};

	const handleLock = () => {
		sessionStorage.removeItem(SESSION_KEY);
		setAuthed(false);
		setHealth(null);
		setCacheReport(null);
		setPassphrase('');
	};

	const renderGate = () => (
		<div className={styles['diagnostics-gate-wrap']}>
			<div className={styles['diagnostics-gate']}>
				<span className={styles['diagnostics-gate__icon']} aria-hidden='true'>
					<LockIcon />
				</span>
				<h1 className={styles['diagnostics-gate__title']}>Diagnostics</h1>
				<p className={styles['diagnostics-gate__desc']}>
					This page is restricted. Enter the diagnostics passphrase to view API
					status and cache usage.
				</p>
				<form
					className={styles['diagnostics-gate__form']}
					onSubmit={handleSubmit}
				>
					<input
						className={styles['diagnostics-gate__input']}
						type='password'
						value={passphrase}
						onChange={(e) => setPassphrase(e.target.value)}
						placeholder='Passphrase'
						aria-label='Diagnostics passphrase'
						autoComplete='current-password'
						autoFocus
					/>
					<button
						className={styles['diagnostics-gate__button']}
						type='submit'
						disabled={loading || !passphrase.trim()}
					>
						{loading ? 'Checking…' : 'Unlock'}
					</button>
					{authError && (
						<p className={styles['diagnostics-gate__error']}>
							Incorrect passphrase. Try again.
						</p>
					)}
					{fetchError && (
						<p className={styles['diagnostics-gate__error']}>
							Could not reach the API. Is the backend running?
						</p>
					)}
				</form>
			</div>
		</div>
	);

	const renderContent = () => {
		if (!health || !cacheReport) return null;
		const sectionRows = Object.entries(cacheReport.sections).sort(
			(a, b) => b[1] - a[1],
		);
		return (
			<div className={styles['diagnostics-page__content']}>
				<div className={styles['diagnostics-header']}>
					<h1 className={styles['diagnostics-title']}>Diagnostics</h1>
					<div className={styles['diagnostics-actions']}>
						<button
							className={styles['diagnostics-icon-btn']}
							onClick={() => loadDiagnostics(passphrase.trim())}
							disabled={loading}
							aria-label='Refresh diagnostics'
						>
							<RefreshIcon />
							<span>Refresh</span>
						</button>
						<button
							className={styles['diagnostics-icon-btn']}
							onClick={handleLock}
							aria-label='Lock diagnostics'
						>
							<LockIcon />
							<span>Lock</span>
						</button>
					</div>
				</div>

				<section className={styles['diagnostics-section']}>
					<h2 className={styles['diagnostics-section__title']}>API Status</h2>
					<div className={styles['diagnostics-grid']}>
						<StatCard label='Status'>
							<StatusBadge
								ok={health.status === 'ok'}
								okLabel='OK'
								badLabel='Down'
							/>
						</StatCard>
						<StatCard label='Cache Directory'>
							<StatusBadge
								ok={health.cacheWritable}
								okLabel='Writable'
								badLabel='Unavailable'
							/>
						</StatCard>
						<StatCard label='Anthropic Key'>
							<StatusBadge
								ok={health.anthropicKeyConfigured}
								okLabel='Configured'
								badLabel='Missing'
							/>
						</StatCard>
						<StatCard label='Version'>v{health.version}</StatCard>
						<StatCard label='Environment'>{health.environment}</StatCard>
						<StatCard label='Current Season'>{health.currentSeason}</StatCard>
						<StatCard label='Uptime'>{formatUptime(health.uptime)}</StatCard>
						<StatCard label='Server Time'>
							{new Date(health.currentTime).toLocaleString()}
						</StatCard>
					</div>
				</section>

				<section className={styles['diagnostics-section']}>
					<h2 className={styles['diagnostics-section__title']}>Cache Usage</h2>
					<div className={styles['cache-card']}>
						<div className={styles['cache-summary']}>
							<div className={styles['cache-summary__item']}>
								<span className={styles['cache-summary__label']}>Total</span>
								<span className={styles['cache-summary__value']}>
									{formatBytes(cacheReport.total)}
								</span>
							</div>
							<div className={styles['cache-summary__item']}>
								<span className={styles['cache-summary__label']}>
									Largest Section
								</span>
								<span className={styles['cache-summary__value']}>
									{cacheReport.largestSection.type ?? '—'}
								</span>
							</div>
						</div>
						<table className={styles['cache-table']}>
							<thead>
								<tr>
									<th className={styles['cache-table__section-col']}>
										Section
									</th>
									<th>Size</th>
									<th className={styles['cache-table__bar-col']}>Share</th>
								</tr>
							</thead>
							<tbody>
								{sectionRows.map(([type, size]) => {
									const pct =
										cacheReport.total ? (size / cacheReport.total) * 100 : 0;
									const isLargest = type === cacheReport.largestSection.type;
									return (
										<tr
											key={type}
											className={cx(
												isLargest && styles['cache-table__row--largest'],
											)}
										>
											<td className={styles['cache-table__section-col']}>
												{type}
											</td>
											<td>{formatBytes(size)}</td>
											<td className={styles['cache-table__bar-col']}>
												<span className={styles['cache-bar-track']}>
													<span
														className={styles['cache-bar-fill']}
														style={{ width: `${pct}%` }}
													/>
												</span>
												<span className={styles['cache-bar__pct']}>
													{pct.toFixed(0)}%
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		);
	};

	return (
		<div className={styles['diagnostics-page']}>
			<PageHeader />
			{loading && !authed ?
				<LoadingState label='Loading diagnostics' fullPage />
			: authed ?
				renderContent()
			:	renderGate()}
		</div>
	);
};

export default DiagnosticsPage;
