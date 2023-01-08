import { promiseGetRecoil, promiseSetRecoil } from 'recoil-outside';
import { getI18n } from 'react-i18next';
import { initAppDb } from '../indexedDb/dbUtility';
import { dbSaveNotifications } from '../indexedDb/dbNotifications';
import { apiHostState, appLangState, isOnlineState, sourceLangState } from '../states/main';
import { dbGetAppSettings } from '../indexedDb/dbAppSettings';
import {
  classCountState,
  congNameState,
  congNumberState,
  meetingDayState,
  meetingTimeState,
  pocketLocalIDState,
  pocketMembersState,
  usernameState,
} from '../states/congregation';
import appDb from '../indexedDb/appDb';
import { scheduleDataState, sourceDataState } from '../states/schedule';

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
  } = await dbGetAppSettings();

  await promiseSetRecoil(usernameState, username || '');
  await promiseSetRecoil(congNameState, cong_name || '');
  await promiseSetRecoil(congNumberState, cong_number || '');
  await promiseSetRecoil(classCountState, class_count || 1);
  await promiseSetRecoil(meetingDayState, meeting_day || 3);
  await promiseSetRecoil(meetingTimeState, meeting_time || new Date(Date.now()));
  await promiseSetRecoil(appLangState, app_lang || 'e');
  await promiseSetRecoil(sourceLangState, source_lang || 'e');
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
      return t('accountExist');
    case 'EMAIL_NOT_FOUND' || 'INVALID_EMAIL' || 'MISSING_EMAIL':
      return t('accountNotFound');
    case 'INVALID_PASSWORD':
      return t('incorrectInfo');
    case 'USER_DISABLED':
      return t('accountDisabled');
    case 'BLOCKED_TEMPORARILY_TRY_AGAIN' || 'BLOCKED_TEMPORARILY':
      return t('hostBlocked');
    case 'TOKEN_INVALID':
      return t('code2faIncorrect');
    case 'INTERNAL_ERROR':
      return t('internalError');
    default:
      return msg;
  }
};

export const getAssignmentName = (assType) => {
  if (assType === 101) {
    return getI18n().t('initialCall');
  }

  if (assType === 102) {
    return getI18n().t('returnVisit');
  }

  if (assType === 103) {
    return getI18n().t('bibleStudy');
  }

  if (assType === 104) {
    return getI18n().t('talk');
  }

  if (assType === 108) {
    return getI18n().t('memorialInvite');
  }
};
