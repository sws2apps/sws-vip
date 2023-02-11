import { getAuth } from 'firebase/auth';
import { getI18n } from 'react-i18next';
import { promiseGetRecoil, promiseSetRecoil } from 'recoil-outside';
import { dbUpdateAppSettings } from '../indexedDb/dbAppSettings';
import { congIDState, pocketMembersState } from '../states/congregation';
import { isOAuthAccountUpgradeState, qrCodePathState, secretTokenPathState, userIDState } from '../states/main';
import { appMessageState, appSeverityState, appSnackOpenState } from '../states/notification';
import { loadApp } from '../utils/app';
import { getProfile } from './common';

export const apiSendAuthorization = async () => {
  try {
    const { apiHost, isOnline, visitorID } = await getProfile();

    const auth = getAuth();
    const user = auth.currentUser;

    if (isOnline && apiHost !== '' && visitorID && user) {
      const res = await fetch(`${apiHost}user-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          uid: user.uid,
        },
        body: JSON.stringify({ visitorid: visitorID }),
      });
      const data = await res.json();

      if (res.status === 200) {
        return { isVerifyMFA: true };
      } else {
        if (data.secret && data.qrCode) {
          await promiseSetRecoil(secretTokenPathState, data.secret);
          await promiseSetRecoil(qrCodePathState, data.qrCode);
          return { isSetupMFA: true };
        }
        if (data.message) {
          await promiseSetRecoil(appMessageState, data.message);
          await promiseSetRecoil(appSeverityState, 'warning');
          await promiseSetRecoil(appSnackOpenState, true);
        }
      }
      return {};
    }

    return {};
  } catch (err) {
    await promiseSetRecoil(appMessageState, err.message);
    await promiseSetRecoil(appSeverityState, 'error');
    await promiseSetRecoil(appSnackOpenState, true);
  }
};

export const apiHandleVerifyOTP = async (userOTP, isSetup) => {
  try {
    const { t } = getI18n();

    const { apiHost, visitorID } = await getProfile();

    const auth = getAuth();
    const user = auth.currentUser;

    if (userOTP.length === 6) {
      if (apiHost !== '') {
        const res = await fetch(`${apiHost}api/mfa/verify-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            visitorid: visitorID,
            uid: user.uid,
          },
          body: JSON.stringify({ token: userOTP }),
        });

        const data = await res.json();
        if (res.status === 200) {
          const { id, cong_id, cong_name, cong_role, cong_number, pocket_local_id, pocket_members, username } = data;

          if (cong_role.length > 0) {
            // role approved
            if (cong_role.includes('view_meeting_schedule')) {
              await promiseSetRecoil(congIDState, cong_id);
              // save congregation update if any
              const obj = {
                username,
                cong_name,
                cong_number,
                local_id: pocket_local_id === null ? '' : pocket_local_id.person_uid,
                pocket_members,
              };

              await dbUpdateAppSettings(obj);
              await promiseSetRecoil(userIDState, id);
              await promiseSetRecoil(pocketMembersState, pocket_members);
              await loadApp();

              return { success: true };
            }
            return { unauthorized: true };
          }
          return { unauthorized: true };
        } else {
          if (data.message) {
            if (data.message === 'TOKEN_INVALID') data.message = t('mfaTokenInvalidExpired', { ns: 'ui' });
            await promiseSetRecoil(appMessageState, data.message);
            await promiseSetRecoil(appSeverityState, 'warning');
            await promiseSetRecoil(appSnackOpenState, true);
            return {};
          }

          if (!isSetup && data.secret) {
            await promiseSetRecoil(secretTokenPathState, data.secret);
            await promiseSetRecoil(qrCodePathState, data.qrCode);
            return { reenroll: true };
          }
        }
      }
    }
  } catch (err) {
    await promiseSetRecoil(appMessageState, err.message);
    await promiseSetRecoil(appSeverityState, 'error');
    await promiseSetRecoil(appSnackOpenState, true);
    return {};
  }
};

export const apiRequestPasswordlesssLink = async (email, uid) => {
  const { t } = getI18n();

  try {
    const { apiHost, appLang } = await getProfile();

    const isOAuthAccountUpgrade = await promiseGetRecoil(isOAuthAccountUpgradeState);

    if (apiHost !== '') {
      const res = await fetch(`${apiHost}user-passwordless-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          applanguage: appLang,
        },
        body: JSON.stringify({ email, uid }),
      });

      const data = await res.json();
      if (res.status === 200) {
        localStorage.setItem('emailForSignIn', email);
        if (isOAuthAccountUpgrade) {
          await promiseSetRecoil(appMessageState, t('oauthAccountUpgradeEmailComplete', { ns: 'ui' }));
        } else {
          await promiseSetRecoil(appMessageState, t('emailAuthSent', { ns: 'ui' }));
        }

        await promiseSetRecoil(appSeverityState, 'success');
        await promiseSetRecoil(appSnackOpenState, true);
        return { isSuccess: true };
      } else {
        if (data.message) {
          await promiseSetRecoil(appMessageState, data.message);
          await promiseSetRecoil(appSeverityState, 'warning');
          await promiseSetRecoil(appSnackOpenState, true);
          return {};
        }
      }
    }
  } catch (err) {
    await promiseSetRecoil(appMessageState, t('sendEmailError', { ns: 'ui' }));
    await promiseSetRecoil(appSeverityState, 'error');
    await promiseSetRecoil(appSnackOpenState, true);
    return {};
  }
};

export const apiUpdatePasswordlessInfo = async (uid, fullname) => {
  const { t } = getI18n();

  try {
    const { apiHost, visitorID } = await getProfile();

    if (apiHost !== '') {
      const tmpEmail = localStorage.getItem('emailForSignIn');

      const res = await fetch(`${apiHost}user-passwordless-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          uid,
        },
        body: JSON.stringify({ email: tmpEmail, visitorid: visitorID, fullname }),
      });

      const data = await res.json();

      if (res.status === 200) {
        localStorage.removeItem('emailForSignIn');
        return { isVerifyMFA: true, tmpEmail };
      } else {
        if (data.secret && data.qrCode) {
          localStorage.removeItem('emailForSignIn');
          await promiseSetRecoil(secretTokenPathState, data.secret);
          await promiseSetRecoil(qrCodePathState, data.qrCode);
          return { isSetupMFA: true, tmpEmail };
        }
        if (data.message) {
          await promiseSetRecoil(appMessageState, t('verifyEmailError', { ns: 'ui' }));
          await promiseSetRecoil(appSeverityState, 'warning');
          await promiseSetRecoil(appSnackOpenState, true);
          return {};
        }
      }
    }
  } catch (err) {
    await promiseSetRecoil(appMessageState, t('verifyEmailError', { ns: 'ui' }));
    await promiseSetRecoil(appSeverityState, 'error');
    await promiseSetRecoil(appSnackOpenState, true);
    return {};
  }
};