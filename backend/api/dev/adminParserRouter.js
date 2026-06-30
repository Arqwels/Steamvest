const express  = require('express');
const router   = express.Router();
const SkinsParserRun    = require('../models/skinsParserRun');
const StatsParserRun = require('../models/statsParserRun');
const ProxyModel   = require('../models/proxyModel');
const { checkAllProxies, syncProxiesToDB } = require('../../parser/services/proxyCheckerService');
// const requireRole  = require('../middleware/requireRole');

// router.use(requireRole('admin'));

// ─── Parser Runs ───────────────────────────────────────────────

// GET /admin/parser/runs — история всех прогонов
router.get('/parser/runs', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await ParserRun.findAndCountAll({
      order:  [['started_at', 'DESC']],
      limit,
      offset,
    });

    const runs = rows.map(run => formatRun(run));
    res.json({ runs, total: count, page, limit });
  } catch (err) {
    console.error('[AdminRouter] /parser/runs:', err.message);
    res.status(500).json({ error: 'Ошибка при получении прогонов' });
  }
});

// GET /admin/parser/runs/current — текущий прогон или последний
router.get('/parser/runs/current', async (req, res) => {
  try {
    const run = await ParserRun.findOne({ where: { status: 'running' }, order: [['started_at', 'DESC']] })
             || await ParserRun.findOne({ order: [['started_at', 'DESC']] });

    if (!run) return res.json({ run: null });

    const formatted = formatRun(run);
    const processed = run.success_count + run.failed_count;
    formatted.progress_pct = run.total_skins > 0
      ? parseFloat(((processed / run.total_skins) * 100).toFixed(1))
      : 0;

    res.json({ run: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении текущего прогона' });
  }
});

// GET /admin/parser/runs/:id — конкретный прогон
router.get('/parser/runs/:id', async (req, res) => {
  try {
    const run = await ParserRun.findByPk(req.params.id);
    if (!run) return res.status(404).json({ error: 'Прогон не найден' });
    res.json({ run: formatRun(run) });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении прогона' });
  }
});

// ─── Proxies ───────────────────────────────────────────────────

// GET /admin/proxies — список всех прокси со статусами
router.get('/proxies', async (req, res) => {
  try {
    const proxies = await ProxyModel.findAll({ order: [['id', 'ASC']] });
    const summary = buildSummary(proxies);
    const list    = proxies.map(p => formatProxy(p));
    res.json({ proxies: list, summary });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении прокси' });
  }
});

// POST /admin/proxies/sync — синхронизировать PROXY_LIST из ENV в БД
router.post('/proxies/sync', async (req, res) => {
  try {
    const count = await syncProxiesToDB();
    res.json({ message: `Синхронизировано ${count} прокси из ENV` });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при синхронизации прокси' });
  }
});

// POST /admin/proxies/check — запустить проверку всех прокси (async)
let isChecking = false;

router.post('/proxies/check', (req, res) => {
  if (isChecking) {
    return res.status(409).json({ error: 'Проверка уже запущена' });
  }

  res.status(202).json({ message: 'Проверка запущена — результаты появятся в GET /admin/proxies' });

  isChecking = true;
  checkAllProxies()
    .catch(err => console.error('[AdminRouter] Ошибка проверки прокси:', err.message))
    .finally(() => { isChecking = false; });
});

// ─── Skins Runs ────────────────────────────────────────────────

router.get('/parser/skins/runs', async (req, res) => {
  try {
    const limit  = Math.min(100, parseInt(req.query.limit) || 5);
    const { count, rows } = await SkinsParserRun.findAndCountAll({
      order: [['started_at', 'DESC']], limit,
    });
    res.json({ runs: rows.map(formatRun), total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/parser/skins/runs/current', async (req, res) => {
  try {
    const run = await SkinsParserRun.findOne({ where: { status: 'running' }, order: [['started_at', 'DESC']] })
             || await SkinsParserRun.findOne({ order: [['started_at', 'DESC']] });
    res.json({ run: run ? formatRun(run) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stats Runs ────────────────────────────────────────────────

router.get('/parser/stats/runs', async (req, res) => {
  try {
    const limit  = Math.min(100, parseInt(req.query.limit) || 5);
    const { count, rows } = await StatsParserRun.findAndCountAll({
      order: [['started_at', 'DESC']], limit,
    });
    res.json({ runs: rows.map(formatRun), total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/parser/stats/runs/current', async (req, res) => {
  try {
    const run = await StatsParserRun.findOne({ where: { status: 'running' }, order: [['started_at', 'DESC']] })
             || await StatsParserRun.findOne({ order: [['started_at', 'DESC']] });
    res.json({ run: run ? formatRun(run) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ───────────────────────────────────────────────────

function formatRun(run) {
  const durationMs  = run.finished_at
    ? new Date(run.finished_at) - new Date(run.started_at)
    : Date.now()   - new Date(run.started_at);
  const total       = run.total_skins || 0;
  const successRate = total > 0
    ? parseFloat(((run.success_count / total) * 100).toFixed(1))
    : null;

  return {
    id:              run.id,
    started_at:      run.started_at,
    finished_at:     run.finished_at,
    duration_minutes: Math.round(durationMs / 60_000),
    status:          run.status,
    total_skins:     run.total_skins,
    success_count:   run.success_count,
    failed_count:    run.failed_count,
    success_rate:    successRate,
    proxies_used:    run.proxies_used,
    proxies_count:   run.proxies_used?.length || 0,
    stop_reason:     run.stop_reason,
  };
}

function formatProxy(p) {
  return {
    id:              p.id,
    url_masked:      maskUrl(p.url),
    status:          p.status,
    fail_count:      p.fail_count,
    last_used_at:    p.last_used_at,
    last_checked_at: p.last_checked_at,
    is_alive:        p.is_alive,
    is_steam_ok:     p.is_steam_ok,
  };
}

function buildSummary(proxies) {
  return {
    total:     proxies.length,
    active:    proxies.filter(p => p.status === 'active').length,
    exhausted: proxies.filter(p => p.status === 'exhausted').length,
    dead:      proxies.filter(p => p.status === 'dead').length,
  };
}

function maskUrl(url) {
  return url ? url.replace(/:([^@]+)@/, ':****@') : null;
}

module.exports = router;