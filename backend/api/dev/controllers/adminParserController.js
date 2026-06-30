const ProxyModel = require('../../models/proxyModel');

const getProxies = async (req, res) => {
  try {
    const proxies = await ProxyModel.findAll();

    const summary = {
      total:     proxies.length,
      active:    proxies.filter(p => p.status === 'active').length,
      exhausted: proxies.filter(p => p.status === 'exhausted').length,
      dead:      proxies.filter(p => p.status === 'dead').length,
    };

    res.json({ proxies, summary });
  } catch (err) {
    console.error('[adminController/getProxies]', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProxies };