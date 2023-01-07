import { useCallback, useEffect, useMemo } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { dbUpdateAppSettings } from '../../indexedDb/dbAppSettings';
import { deleteDb } from '../../indexedDb/dbUtility';
import {
  congAccountConnectedState,
  congIDState,
  congNameState,
  congNumberState,
  isAdminCongState,
  pocketLocalIDState,
  pocketMembersState,
} from '../../states/congregation';
import {
  apiHostState,
  isOnlineState,
  rootModalOpenState,
  userEmailState,
  userIDState,
  visitorIDState,
} from '../../states/main';

const UserAutoLogin = () => {
  let abortCont = useMemo(() => new AbortController(), []);

  const [userEmail, setUserEmail] = useRecoilState(userEmailState);

  const setCongAccountConnected = useSetRecoilState(congAccountConnectedState);
  const setIsAdminCong = useSetRecoilState(isAdminCongState);
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

  const handleDisapproved = useCallback(async () => {
    setModalOpen(true);
    await deleteDb();
    localStorage.removeItem('email');
    window.location.href = './';
  }, [setModalOpen]);

  const checkLogin = useCallback(async () => {
    try {
      if (apiHost !== '' && userEmail !== '' && visitorID !== '') {
        const res = await fetch(`${apiHost}api/users/validate-me`, {
          signal: abortCont.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            visitorid: visitorID,
            email: userEmail,
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
              pocket_local_id,
              pocket_members,
            };

            await dbUpdateAppSettings(obj);

            setCongID(cong_id);
            setUserID(id);
            setCongName(cong_name);
            setCongNumber(cong_number);
            setPocketLocalID(pocket_local_id);
            setPocketMembers(pocket_members);
            setCongAccountConnected(true);

            return;
          }

          // role disapproved
          await handleDisapproved();
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
    userEmail,
    setCongAccountConnected,
    setCongID,
    setUserID,
    setCongName,
    setCongNumber,
    setPocketLocalID,
    setPocketMembers,
  ]);

  useEffect(() => {
    setUserEmail(localStorage.getItem('email'));
  }, [setUserEmail]);

  useEffect(() => {
    if (isOnline) {
      checkLogin();
    } else {
      setCongAccountConnected(false);
      setIsAdminCong(false);
    }
  }, [checkLogin, isOnline, setCongAccountConnected, setIsAdminCong, userEmail]);

  return <></>;
};

export default UserAutoLogin;
