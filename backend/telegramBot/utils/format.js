function duration(minutes) {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function statusIcon(status) {
  return status === 'running'   ? '🔄'
    : status === 'completed' ? '✅'
    : status === 'stopped'   ? '🛑'
    : '❓';
}

function proxyIcon(status) {
  return status === 'active'    ? '🟢'
    : status === 'exhausted' ? '🟡'
    : '🔴';
}

function formatSkinsRun(run) {
  if (!run) return '— нет данных';
  const icon = statusIcon(run.status);
  const dur = duration(run.duration_minutes ?? 0);
  const saveRate = run.save_rate != null ? ` (${run.save_rate}%)` : '';

  return (
    `${icon} <b>Прогон #${run.id}</b> — ${run.status}\n` +
    `⏱ ${dur}\n` +
    `📦 Найдено на Steam: <b>${run.total_count ?? 0}</b>\n` +
    `💾 Записано: <b>${run.saved_count ?? 0}</b>${saveRate}\n` +
    `❌ Ошибок: <b>${run.failed_count ?? 0}</b>` +
    (run.stop_reason ? `\n⚠️ Причина: <code>${run.stop_reason}</code>` : '') +
    `\n🕐 Начало: ${formatDate(run.started_at)}` +
    (run.finished_at ? `\n🕑 Конец: ${formatDate(run.finished_at)}` : '')
  );
}

function formatStatsRun(run) {
  if (!run) return '— нет данных';
  const icon = statusIcon(run.status);
  const dur = duration(run.duration_minutes ?? 0);
  const successRate = run.success_rate != null ? ` (${run.success_rate}%)` : '';
  const progress = run.status === 'running' && run.progress_pct != null
    ? `\n⏳ Прогресс: <b>${run.progress_pct}%</b>`
    : '';

  return (
    `${icon} <b>Прогон #${run.id}</b> — ${run.status}\n` +
    `⏱ ${dur}\n` +
    `📦 Скинов: <b>${run.total_skins ?? 0}</b>\n` +
    `✅ Успешно: <b>${run.success_count ?? 0}</b>${successRate}\n` +
    `❌ Ошибок: <b>${run.failed_count ?? 0}</b>` +
    progress +
    (run.proxies_count > 0 ? `\n🌐 Прокси: <b>${run.proxies_count}</b> шт.` : '') +
    (run.stop_reason ? `\n⚠️ Причина: <code>${run.stop_reason}</code>` : '') +
    `\n🕐 Начало: ${formatDate(run.started_at)}` +
    (run.finished_at ? `\n🕑 Конец: ${formatDate(run.finished_at)}` : '')
  );
}

function formatProxiesList(proxies, summary) {
  const header =
    `🌐 <b>Прокси (${summary.total})</b>\n` +
    `🟢 Активных: <b>${summary.active}</b> | ` +
    `🟡 Исчерпано: <b>${summary.exhausted}</b> | ` +
    `🔴 Мёртвых: <b>${summary.dead}</b>\n\n`;

  const list = proxies.map((p, i) => {
    const icon = proxyIcon(p.status);
    const checked = p.last_checked_at
      ? `проверен ${formatDate(p.last_checked_at)}`
      : 'не проверялся';
    return `${icon} <code>${i + 1}. ${p.url_masked}</code>\n ${checked} | fail: ${p.fail_count}`;
  }).join('\n\n');

  return header + (list || '— список пуст');
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = {
  formatSkinsRun,
  formatStatsRun,
  formatProxiesList,
  formatDate,
  statusIcon,
};
