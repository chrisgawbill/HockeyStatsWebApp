const inFlightServiceTasks = new Map();

function isDomainPersistenceConfigured() {
	return Boolean(process.env.DATABASE_URL || process.env.CACHE_DATABASE_URL);
}

function runServiceTask(label, serviceFn) {
	if (process.env.DISABLE_DOMAIN_PERSISTENCE === 'true') return null;
	if (!isDomainPersistenceConfigured()) return null;
	if (inFlightServiceTasks.has(label)) return null;

	const promise = Promise.resolve()
		.then(serviceFn)
		.catch((error) => {
			console.error(`Domain service task failed for ${label}:`, error);
		})
		.finally(() => inFlightServiceTasks.delete(label));

	inFlightServiceTasks.set(label, promise);
	return null;
}

module.exports = {
	runServiceTask,
	isDomainPersistenceConfigured,
};
