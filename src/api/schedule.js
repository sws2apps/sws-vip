import { getAuth } from 'firebase/auth';
import { promiseSetRecoil } from 'recoil-outside';
import { dbUpdateAppSettings } from '../indexedDb/dbAppSettings';
import { dbUpdateSchedule } from '../indexedDb/dbSchedule';
import { classCountState, republishScheduleState } from '../states/congregation';
import { rootModalOpenState, sourceLangState } from '../states/main';
import { getProfile } from './common';

export const dbRefreshLocalSchedule = async () => {
  const { apiHost, congID, isOnline, visitorID } = await getProfile();

  const auth = getAuth();
  const user = auth.currentUser;

  await promiseSetRecoil(rootModalOpenState, true);

  if (isOnline && apiHost !== '' && user && visitorID !== '') {
    const res = await fetch(`${apiHost}api/congregations/${congID}/meeting-schedule`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        visitorid: visitorID,
        uid: user.uid,
      },
    });

    const { cong_schedule, cong_sourceMaterial, class_count, source_lang, co_name, co_displayName } = await res.json();
    if (source_lang === undefined) {
      await promiseSetRecoil(republishScheduleState, true);
      await promiseSetRecoil(rootModalOpenState, false);
      return;
    }

    await dbUpdateSchedule({ cong_schedule, cong_sourceMaterial });
    await promiseSetRecoil(classCountState, class_count);
    await promiseSetRecoil(sourceLangState, source_lang);

    await dbUpdateAppSettings({ class_count, source_lang, co_name, co_displayName });
  }

  await promiseSetRecoil(rootModalOpenState, false);
};
