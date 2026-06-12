const SteamTotp = require('steam-totp');
const { LoginSession, EAuthTokenPlatformType, EAuthSessionGuardType } = require('steam-session');
require('dotenv').config();

class SteamAuthService {
  async init() {
    // создаём новую сессию при каждом вызове
    const session = new LoginSession(EAuthTokenPlatformType.SteamClient);

    // Генерируем 2FA из shared secret
    const twoFactorCode = SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET);

    // Подписываемся на событие steamGuard
    session.on('steamGuard', (_domain, callback) => {
      const code = SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET);
      callback(code);
    });

    // Стартуем авторизацию
    const result = await session.startWithCredentials({
      accountName: process.env.STEAM_USERNAME,
      password: process.env.STEAM_PASSWORD,
      steamGuardCode: twoFactorCode,
      rememberLogin: true
    });

    // Обработка дополнительных шагов (если есть)
    if (result.actionRequired) {
      result.validActions.forEach(action => {
        console.log(`Требуется подтверждение: ${EAuthSessionGuardType[action.type]}`, action.detail);
      });
    }

    // Ждём, пока сессия подтвердится, и вытягиваем steamLoginSecure
    return new Promise((resolve, reject) => {
      session.once('authenticated', async () => {
        try {
          const cookies = await session.getWebCookies();
          const steamLoginSecure = cookies
            .find(c => c.startsWith('steamLoginSecure='))
            .split('=')[1];
          resolve(steamLoginSecure);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = new SteamAuthService();