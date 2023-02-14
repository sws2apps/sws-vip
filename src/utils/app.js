import { promiseGetRecoil, promiseSetRecoil } from 'recoil-outside';
import { getI18n } from 'react-i18next';
import { format } from 'date-fns';
import { initAppDb } from '../indexedDb/dbUtility';
import { dbSaveNotifications } from '../indexedDb/dbNotifications';
import { apiHostState, appLangState, avatarUrlState, isOnlineState, sourceLangState } from '../states/main';
import { dbGetAppSettings, dbUpdateAppSettings } from '../indexedDb/dbAppSettings';
import {
  classCountState,
  congNameState,
  congNumberState,
  meetingDayState,
  meetingTimeState,
  pocketLocalIDState,
  pocketMembersState,
  republishScheduleState,
  usernameState,
} from '../states/congregation';
import appDb from '../indexedDb/appDb';
import { scheduleDataState, scheduleLocalState, sourceDataState } from '../states/schedule';

export const loadApp = async () => {
  const I18n = getI18n();

  await initAppDb();
  const app_lang = localStorage.getItem('app_lang') || 'e';
  let {
    username,
    cong_number,
    cong_name,
    class_count,
    meeting_day,
    meeting_time,
    local_id,
    pocket_members,
    source_lang,
    user_avatar,
  } = await dbGetAppSettings();

  const isOnline = await promiseGetRecoil(isOnlineState);

  if (user_avatar) {
    if (typeof user_avatar === 'string' && isOnline) {
      await promiseSetRecoil(avatarUrlState, user_avatar);
    }

    if (typeof user_avatar === 'object') {
      const blob = new Blob([user_avatar]);
      const imgSrc = URL.createObjectURL(blob);
      await promiseSetRecoil(avatarUrlState, imgSrc);
    }
  }

  await promiseSetRecoil(usernameState, username || '');
  await promiseSetRecoil(congNameState, cong_name || '');
  await promiseSetRecoil(congNumberState, cong_number || '');
  await promiseSetRecoil(classCountState, class_count || 1);
  await promiseSetRecoil(meetingDayState, meeting_day || 3);
  await promiseSetRecoil(meetingTimeState, meeting_time || new Date(Date.now()));
  await promiseSetRecoil(appLangState, app_lang || 'e');
  await promiseSetRecoil(sourceLangState, source_lang);
  if (source_lang === undefined) await promiseSetRecoil(republishScheduleState, true);
  await promiseSetRecoil(pocketLocalIDState, local_id || '');
  await promiseSetRecoil(pocketMembersState, pocket_members || []);

  I18n.changeLanguage(app_lang);

  const schedules = await appDb.cong_schedule.toCollection().first();
  await promiseSetRecoil(scheduleDataState, schedules);

  const sources = await appDb.cong_sourceMaterial.toCollection().first();
  await promiseSetRecoil(sourceDataState, sources);
};

export const fetchNotifications = async () => {
  try {
    const isOnline = await promiseGetRecoil(isOnlineState);
    const apiHost = await promiseGetRecoil(apiHostState);

    if (isOnline && apiHost !== '') {
      const res = await fetch(`${apiHost}api/users/announcement`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          app: 'sws-vip',
        },
      });

      const data = await res.json();
      await dbSaveNotifications(data);
    }
  } catch {}
};

export const formatDateForCompare = (date) => {
  return new Date(date);
};

export const getErrorMessage = (msg) => {
  const { t } = getI18n();

  switch (msg) {
    case 'ACCOUNT_IN_USE':
      return t('accountExist', { ns: 'ui' });
    case 'EMAIL_NOT_FOUND':
      return t('accountNotFound', { ns: 'ui' });
    case 'INVALID_EMAIL':
      return t('accountNotFound', { ns: 'ui' });
    case 'MISSING_EMAIL':
      return t('accountNotFound', { ns: 'ui' });
    case 'INVALID_PASSWORD':
      return t('incorrectInfo', { ns: 'ui' });
    case 'USER_DISABLED':
      return t('accountDisabled', { ns: 'ui' });
    case 'BLOCKED_TEMPORARILY_TRY_AGAIN':
      return t('hostBlocked', { ns: 'ui' });
    case 'BLOCKED_TEMPORARILY':
      return t('hostBlocked', { ns: 'ui' });
    case 'TOKEN_INVALID':
      return t('code2faIncorrect', { ns: 'ui' });
    case 'INTERNAL_ERROR':
      return t('internalError', { ns: 'ui' });
    case 'ACCOUNT_CREATION_FAILED':
      return t('createAccountFailed', { ns: 'ui' });
    case 'EMAIL_NOT_SUPPORTED':
      return t('emailNotSupported', { ns: 'ui' });
    default:
      return msg;
  }
};

export const getAssignmentName = (assType) => {
  const { t } = getI18n();
  if (assType === 101 || (assType >= 140 && assType < 170)) {
    return t('initialCall', { ns: 'ui' });
  }

  if (assType === 102 || (assType >= 170 && assType < 200)) {
    return t('returnVisit', { ns: 'ui' });
  }

  if (assType === 103) {
    return t('bibleStudy', { ns: 'ui' });
  }

  if (assType === 104) {
    return t('talk', { ns: 'ui' });
  }

  if (assType === 108) {
    return t('memorialInvite', { ns: 'ui' });
  }
};

export const getCurrentWeekDate = async () => {
  const schedules = await promiseGetRecoil(scheduleLocalState);
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  let monDay = new Date(today.setDate(diff));

  let currentWeek = format(monDay, 'MM/dd/yyyy');
  let isExist = false;

  if (schedules.length > 0) {
    do {
      const fDate = format(monDay, 'MM/dd/yyyy');
      const schedule = schedules.find((data) => data.weekOf === fDate);
      if (schedule) {
        currentWeek = fDate;
        isExist = true;
      }
      monDay.setDate(monDay.getDate() + 7);
    } while (isExist === false);
  }

  return currentWeek;
};

export const saveProfilePic = async (url, provider) => {
  if (url && url !== '' && url !== null) {
    if (provider === 'yahoo.com') {
      await dbUpdateAppSettings({ user_avatar: url });
      await promiseSetRecoil(avatarUrlState, url);

      return;
    }

    if (provider !== 'microsoft.com') {
      const imageReceived = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = downloadedImg.width;
        canvas.height = downloadedImg.height;
        canvas.innerText = downloadedImg.alt;

        context.drawImage(downloadedImg, 0, 0);

        canvas.toBlob((done) => savePic(done));
      };

      const downloadedImg = new Image();
      downloadedImg.crossOrigin = 'Anonymous';
      downloadedImg.src = url;
      downloadedImg.addEventListener('load', imageReceived, false);

      const savePic = async (profileBlob) => {
        const profileBuffer = await profileBlob.arrayBuffer();
        await dbUpdateAppSettings({ user_avatar: profileBuffer });
        const imgSrc = URL.createObjectURL(profileBlob);
        await promiseSetRecoil(avatarUrlState, imgSrc);
      };

      return;
    }
  }

  await promiseSetRecoil(avatarUrlState, undefined);
};
