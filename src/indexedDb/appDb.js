import Dexie from 'dexie';

let appDb = new Dexie('sws_vip');
appDb.version(1).stores({
  app_settings: '++id, username, cong_number, cong_name, class_count, meeting_day, meeting_time, userPass, isLoggedOut',
});
appDb.version(2).stores({
  app_settings:
    '++id, username, cong_number, cong_name, class_count, meeting_day, meeting_time, userPass, isLoggedOut, local_id, pocket_members',
});
appDb.version(3).stores({
  cong_schedule: '++schedule_id, midweek_meeting, weekend_talk, weekend_otherParts',
  cong_sourceMaterial: '++source_id, midweek_meeting, weekend_talk, weekend_otherParts',
});
appDb.version(4).stores({
  app_settings:
    '++id, username, cong_number, cong_name, class_count, meeting_day, meeting_time, userPass, isLoggedOut, local_id, pocket_members, source_lang',
});
appDb.version(5).stores({
  app_settings:
    '++id, username, cong_number, cong_name, class_count, meeting_day, meeting_time, userPass, isLoggedOut, local_id, pocket_members, source_lang, user_avatar, account_version',
});
appDb.version(6).stores({
  announcements: '&announcement_id, title, body',
});
appDb.version(7).stores({
  app_settings:
    '++id, username, cong_number, cong_name, class_count, meeting_day, meeting_time, userPass, isLoggedOut, local_id, pocket_members, source_lang, user_avatar, account_version, co_name, co_displayName',
});

appDb.on('populate', function () {
  appDb.app_settings.add({
    id: 1,
    cong_number: 0,
    cong_name: '',
    class_count: 1,
    meeting_day: 1,
    source_lang: 'e',
    account_version: 'v2',
  });
});

export default appDb;
