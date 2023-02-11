import { promiseGetRecoil } from 'recoil-outside';
import { apiHostState, appLangState, isOnlineState, visitorIDState } from '../states/main';
import { congIDState } from '../states/congregation';

export const getProfile = async () => {
  const apiHost = await promiseGetRecoil(apiHostState);
  const visitorID = await promiseGetRecoil(visitorIDState);
  const appLang = await promiseGetRecoil(appLangState);
  const isOnline = await promiseGetRecoil(isOnlineState);
  const congID = await promiseGetRecoil(congIDState);

  return { apiHost, appLang, congID, isOnline, visitorID };
};
