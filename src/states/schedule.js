import { getI18n } from 'react-i18next';
import { atom, selector } from 'recoil';
import { dbGetAppSettings } from '../indexedDb/dbAppSettings';
import { getAssignmentName } from '../utils/app';
import { monthNamesState } from './main';

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
        for (const item of midweekMeeting) {
          const schedules = item.schedules;
          for (const tmpSchedule of schedules) {
            schedule.push(tmpSchedule);
          }
        }
      }

      // loop through all sources to build weekly schedule
      const srcMidweekMeeting = sources.midweekMeeting;
      if (srcMidweekMeeting) {
        for (const item of srcMidweekMeeting) {
          const sources = item.sources;
          for (const weekData of sources) {
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

export const myAssignmentsState = selector({
  key: 'myAssignments',
  get: async ({ get }) => {
    const { t } = getI18n();

    const { local_id, pocket_members } = await dbGetAppSettings();
    const schedules = get(scheduleLocalState);
    const monthNames = get(monthNamesState);

    const d = new Date();
    const todayDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayValue = todayDate.getDay();
    const diff = todayDate.getDate() - dayValue + (dayValue === 0 ? -6 : 1);
    const currentWeekDate = new Date(todayDate.setDate(diff));

    const msInDay = 24 * 60 * 60 * 1000;

    const fldCheck = [
      'chairmanMM_A',
      'chairmanMM_B',
      'opening_prayer',
      'tgw_talk',
      'tgw_gems',
      'bRead_stu_A',
      'bRead_stu_B',
      'ass1_stu_A',
      'ass1_ass_A',
      'ass1_stu_B',
      'ass1_ass_B',
      'ass2_stu_A',
      'ass2_ass_A',
      'ass2_stu_B',
      'ass2_ass_B',
      'ass3_stu_A',
      'ass3_ass_A',
      'ass3_stu_B',
      'ass3_ass_B',
      'ass4_stu_A',
      'ass4_ass_A',
      'ass4_stu_B',
      'ass4_ass_B',
      'lc_part1',
      'lc_part2',
      'cbs_conductor',
      'cbs_reader',
      'closing_prayer',
    ];

    let myItems = [];
    for (const schedule of schedules) {
      const weekDate = new Date(schedule.weekOf);
      const dayDiff = Math.round((weekDate - currentWeekDate) / msInDay);

      if (dayDiff >= 0) {
        fldCheck.forEach((fld) => {
          const fldDispName = `${fld}_dispName`;
          const fldValue = schedule[fld];
          const fldDispNameValue = schedule[fldDispName];

          let isFound = false;
          let isBehalf = false;

          if (fldValue === local_id) {
            isFound = true;
          }

          if (pocket_members.some((member) => member.person_uid === fldValue)) {
            isFound = true;
            isBehalf = true;
          }

          if (isFound) {
            const split = schedule.weekOf.split('/');
            const monthIndex = +split[0] - 1;
            const monthValue = `${monthNames[monthIndex]} ${split[2]}`;

            const obj = {};
            obj.month_value = monthValue;
            obj.id = window.crypto.randomUUID();
            obj.weekOf = schedule.weekOf;
            obj.person = fldValue;
            obj.personDispName = fldDispNameValue;

            // Chairman History
            if (fld === 'chairmanMM_A') {
              obj.assignmentName = t('chairmanMidweekMeeting2', { ns: 'ui' });
            }

            // Aux Class Counselor History
            if (fld === 'chairmanMM_B') {
              obj.assignmentName = t('auxClassCounselor', { ns: 'ui' });
            }

            // Opening Prayer
            if (fld === 'opening_prayer') {
              obj.assignmentName = t('openingPrayerMidweekMeeting', { ns: 'ui' });
            }

            // TGW Talk 10 min. History
            if (fld === 'tgw_talk') {
              obj.assignmentName = t('tgwTalk', { ns: 'ui' });
              obj.assignmentSource = schedule.tgwTalk_src;
            }

            // TGW Spiritual Gems History
            if (fld === 'tgw_gems') {
              obj.assignmentName = t('tgwGems2', { ns: 'ui' });
            }

            //Bible Reading History
            if (fld.startsWith('bRead_stu_')) {
              const stuclass = fld.split('_')[2];
              obj.assignmentName = t('bibleReading', { ns: 'ui' });
              obj.class = stuclass;
              obj.studyPoint = schedule.bibleReading_study;
              obj.assignmentSource = schedule.bibleReading_src;
            }

            //AYF Assigment History
            if (fld.startsWith('ass') && fld.includes('_stu_')) {
              const stuclass = fld.split('_')[2];
              const weekFld = fld.split('_')[0] + '_type';
              const studyFld = fld.split('_')[0] + '_study';
              const timeFld = fld.split('_')[0] + '_time';
              const sourceFld = fld.split('_')[0] + '_src';
              const assistantFld = fld.replace('_stu_', '_ass_');
              const assistantFldDispName = `${assistantFld}_dispName`;
              const assType = schedule[weekFld];
              const studyPoint = schedule[studyFld];
              const assSource = schedule[sourceFld];
              const assTime = schedule[timeFld];
              const assistantDispName = schedule[assistantFldDispName];

              obj.assignmentName = getAssignmentName(assType);
              if (assType !== 104) {
                obj.assignmentName += ` - ${t('student', { ns: 'ui' })}`;
              }

              obj.assistantDispName = assistantDispName;
              obj.assignmentTime = assTime;
              obj.assignmentSource = assSource;
              obj.assignmentType = 'ayf';
              obj.class = stuclass;
              obj.studyPoint = studyPoint;
            }

            //AYF Assistant History
            if (fld.startsWith('ass') && fld.includes('_ass_')) {
              const stuclass = fld.split('_')[2];
              const studyFld = fld.split('_')[0] + '_study';
              const weekFld = fld.split('_')[0] + '_type';
              const sourceFld = fld.split('_')[0] + '_src';
              const timeFld = fld.split('_')[0] + '_time';
              const studentFld = fld.replace('_ass_', '_stu_');
              const studentFldDispName = `${studentFld}_dispName`;
              const studyPoint = schedule[studyFld];
              const assSource = schedule[sourceFld];
              const assTime = schedule[timeFld];
              const studentDispName = schedule[studentFldDispName];
              const assType = schedule[weekFld];

              obj.assignmentName = `${getAssignmentName(assType)} - ${t('assistant', { ns: 'ui' })}`;
              obj.studentForAssistant = studentDispName;
              obj.assignmentTime = assTime;
              obj.assignmentSource = assSource;
              obj.assignmentType = 'ayf';
              obj.class = stuclass;
              obj.studyPoint = studyPoint;
            }

            // LC Assignment History
            if (fld.startsWith('lc_part')) {
              const lcIndex = fld.slice(-1);
              const fldSource = `lcPart${lcIndex}_src`;
              const fldTime = `lcPart${lcIndex}_time`;
              const fldContent = `lcPart${lcIndex}_content`;

              obj.assignmentName = t('lcPart', { ns: 'ui' });
              obj.assignmentTime = schedule[fldTime];
              obj.assignmentSource = schedule[fldSource];
              obj.assignmentContent = schedule[fldContent];
            }

            // CBS Conductor History
            if (fld === 'cbs_conductor') {
              obj.assignmentName = t('cbsConductor', { ns: 'ui' });
              obj.assignmentSource = schedule.cbs_src;
            }

            // CBS Reader History
            if (fld === 'cbs_reader') {
              obj.assignmentName = t('cbsReader', { ns: 'ui' });
              obj.assignmentSource = schedule.cbs_src;
            }

            // Closing Prayer
            if (fld === 'closing_prayer') {
              obj.assignmentName = t('closingPrayerMidweekMeeting', { ns: 'ui' });
            }

            obj.isBehalf = isBehalf;

            myItems.push(obj);
          }
        });
      }
    }

    const finalResult = [...myItems];
    finalResult.reverse();

    return finalResult;
  },
});
