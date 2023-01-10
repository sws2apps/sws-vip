import { promiseGetRecoil, promiseSetRecoil } from 'recoil-outside';
import { dbUpdateAppSettings } from '../indexedDb/dbAppSettings';
import { dbUpdateSchedule } from '../indexedDb/dbSchedule';
import { classCountState, congIDState, republishScheduleState } from '../states/congregation';
import {
  apiHostState,
  isOnlineState,
  rootModalOpenState,
  sourceLangState,
  userEmailState,
  visitorIDState,
} from '../states/main';

export const dbRefreshLocalSchedule = async () => {
  await promiseSetRecoil(rootModalOpenState, true);

  const isOnline = await promiseGetRecoil(isOnlineState);
  const apiHost = await promiseGetRecoil(apiHostState);
  const visitorID = await promiseGetRecoil(visitorIDState);
  const userEmail = await promiseGetRecoil(userEmailState);
  const congID = await promiseGetRecoil(congIDState);

  if (isOnline && apiHost !== '' && userEmail !== '' && visitorID !== '') {
    const res = await fetch(`${apiHost}api/congregations/${congID}/meeting-schedule`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        visitorid: visitorID,
        email: userEmail,
      },
    });

    const { cong_schedule, cong_sourceMaterial, class_count, source_lang } = await res.json();
    if (source_lang === undefined) {
      await promiseSetRecoil(republishScheduleState, true);
      return;
    }

    await dbUpdateSchedule({ cong_schedule, cong_sourceMaterial });
    await dbUpdateAppSettings({ class_count });
    await promiseSetRecoil(classCountState, class_count);
    await dbUpdateAppSettings({ source_lang });
    await promiseSetRecoil(sourceLangState, source_lang);
  }

  await promiseSetRecoil(rootModalOpenState, false);
};
