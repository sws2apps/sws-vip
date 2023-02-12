import { useCallback, useEffect, useMemo } from 'react';
import { getAuth, signOut } from '@firebase/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import useFirebaseAuth from '../../hooks/useFirebaseAuth';
import { dbUpdateAppSettings } from '../../indexedDb/dbAppSettings';
import { deleteDb } from '../../indexedDb/dbUtility';
import {
  congAccountConnectedState,
  congIDState,
  congNameState,
  congNumberState,
  pocketLocalIDState,
  pocketMembersState,
} from '../../states/congregation';
import {
  apiHostState,
  isAppLoadState,
  isOnlineState,
  rootModalOpenState,
  userIDState,
  visitorIDState,
} from '../../states/main';

const UserAutoLogin = () => {
  let abortCont = useMemo(() => new AbortController(), []);

  const { isAuthenticated, user } = useFirebaseAuth();

  const setCongAccountConnected = useSetRecoilState(congAccountConnectedState);
  const setCongID = useSetRecoilState(congIDState);
  const setUserID = useSetRecoilState(userIDState);
  const setModalOpen = useSetRecoilState(rootModalOpenState);
  const setCongName = useSetRecoilState(congNameState);
  const setCongNumber = useSetRecoilState(congNumberState);
  const setPocketLocalID = useSetRecoilState(pocketLocalIDState);
  const setPocketMembers = useSetRecoilState(pocketMembersState);

  const isOnline = useRecoilValue(isOnlineState);
  const apiHost = useRecoilValue(apiHostState);
  const visitorID = useRecoilValue(visitorIDState);
  const isAppLoad = useRecoilValue(isAppLoadState);

  const handleDisapproved = useCallback(async () => {
    setModalOpen(true);
    await deleteDb();
    localStorage.removeItem('email');
    window.location.href = './';
  }, [setModalOpen]);

  const checkLogin = useCallback(async () => {
    try {
      if (apiHost !== '' && visitorID !== '') {
        const res = await fetch(`${apiHost}api/users/validate-me`, {
          signal: abortCont.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            visitorid: visitorID,
            uid: user.uid,
          },
        });

        const data = await res.json();
        // congregation found and role approved
        if (res.status === 200) {
          if (data.cong_role.includes('view_meeting_schedule')) {
            const { id, cong_id, cong_name, cong_number, pocket_local_id, pocket_members, username } = data;

            // save congregation update if any
            const obj = {
              username,
              cong_name,
              cong_number,
              isLoggedOut: false,
              local_id: pocket_local_id?.person_uid,
              pocket_members,
            };

            await dbUpdateAppSettings(obj);

            setCongID(cong_id);
            setUserID(id);
            setCongName(cong_name);
            setCongNumber(cong_number);
            setPocketLocalID(pocket_local_id?.person_uid || undefined);
            setPocketMembers(pocket_members);
            setCongAccountConnected(true);

            return;
          }

          // role disapproved
          await handleDisapproved();
          return;
        }

        if (res.status === 403) {
          const auth = getAuth();
          await signOut(auth);
          return;
        }

        // congregation not found
        if (res.status === 404) {
          // user not authorized and delete local data
          await handleDisapproved();
          return;
        }
      }
    } catch {}
  }, [
    apiHost,
    abortCont,
    handleDisapproved,
    visitorID,
    user,
    setCongAccountConnected,
    setCongID,
    setUserID,
    setCongName,
    setCongNumber,
    setPocketLocalID,
    setPocketMembers,
  ]);

  useEffect(() => {
    if (!isAppLoad && isOnline && isAuthenticated) {
      checkLogin();
    } else {
      setCongAccountConnected(false);
    }
  }, [isAppLoad, isAuthenticated, checkLogin, isOnline, setCongAccountConnected]);

  return <></>;
};

export default UserAutoLogin;
