import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { dbRefreshLocalSchedule } from '../../api/schedule';
import { congAccountConnectedState } from '../../states/congregation';

const ScheduleAutoRefresh = () => {
  const congAccountConnected = useRecoilValue(congAccountConnectedState);

  useEffect(() => {
    if (congAccountConnected) {
      dbRefreshLocalSchedule();
    }
  }, [congAccountConnected]);

  return <></>;
};

export default ScheduleAutoRefresh;
