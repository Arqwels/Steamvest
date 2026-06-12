let isRunning = false;

async function runJob(name, fn, timeoutMs = 2 * 60 * 60 * 1000) {
  if (isRunning) {
    console.log(`[Cron] Пропускаем ${name} — другой парсер ещё работает`);
    return { skipped: true };
  }

  isRunning = true;
  const timeout = setTimeout(() => {
    console.error(`[Cron] ${name} завис — сбрасываем флаг`);
    isRunning = false;
  }, timeoutMs);

  try {
    await fn();
  } catch (err) {
    console.error(`[Cron] Ошибка в ${name}:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
    isRunning = false;
  }
}

function getStatus() {
  return { isRunning };
}

module.exports = { runJob, getStatus };
