import { promiseSetRecoil } from 'recoil-outside';
import { appNotificationsState } from '../states/main';
import { LANGUAGE_LIST } from '../locales/langList';
import appDb from './appDb';

export const dbGetNotifications = async () => {
  const notifications = await appDb.table('notifications').toArray();

  return notifications;
};

export const dbSaveNotifications = async (data) => {
  let notifications = await dbGetNotifications();

  await appDb.notifications.clear();

  for await (const announcement of data) {
    let obj = {};
    const notification = notifications.find((item) => item.notification_id === announcement.id);

    obj.isRead = notification ? notification.isRead : false;
    obj.notification_id = announcement.id;
    obj.content = {};
    LANGUAGE_LIST.forEach((lang) => {
      const code = lang.code.toUpperCase();
      obj.content[code] = announcement.data[code];
    });

    await appDb.notifications.add(obj);
  }

  notifications = await dbGetNotifications();

  await promiseSetRecoil(appNotificationsState, notifications);
};

export const dbReadNotification = async (id) => {
  let notifications = await dbGetNotifications();

  const notification = notifications.find((item) => item.notification_id === id);

  if (notification) {
    await appDb.notifications.update(notification.id, { isRead: true });
  }

  notifications = await dbGetNotifications();
  await promiseSetRecoil(appNotificationsState, notifications);
};
