import { atom, selector } from 'recoil';

export const isRefreshScheduleOpenState = atom({
  key: 'isRefreshScheduleOpen',
  default: false,
});

export const scheduleDataState = atom({
  key: 'scheduleData',
  default: {},
});

export const sourceDataState = atom({
  key: 'sourceDataState',
  default: {},
});

export const scheduleLocalState = selector({
  key: 'scheduleLocal',
  get: ({ get }) => {
    const schedules = get(scheduleDataState);
    const sources = get(sourceDataState);
    let schedule = [];

    if (schedules && sources) {
      // loop through all schedules to build weekly schedule
      const { midweekMeeting } = schedules;
      if (midweekMeeting) {
        for (let a = 0; a < midweekMeeting.length; a++) {
          const schedules = midweekMeeting[a].schedules;
          for (let b = 0; b < schedules.length; b++) {
            schedule.push(schedules[b]);
          }
        }
      }

      // loop through all sources to build weekly schedule
      const srcMidweekMeeting = sources.midweekMeeting;
      if (srcMidweekMeeting) {
        for (let a = 0; a < srcMidweekMeeting.length; a++) {
          const src = srcMidweekMeeting[a].sources;
          for (let b = 0; b < src.length; b++) {
            const weekData = src[b];

            let obj = {};
            obj = { ...weekData };

            // find existing week in schedule
            const found = schedule.find((week) => week.weekOf === weekData.weekOf);

            if (found) {
              obj = { ...obj, ...found };
              schedule = [...schedule.filter((week) => week.weekOf !== weekData.weekOf)];
            }

            schedule.push(obj);
          }
        }
      }
    }

    return schedule;
  },
});
