import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { congAccountConnectedState } from '../../states/congregation';
import { dbRefreshLocalSchedule } from '../../utils/api';

const ScheduleAutoRefresh = () => {
  const congAccountConnected = useRecoilValue(congAccountConnectedState);

  useEffect(() => {
    dbRefreshLocalSchedule();
  }, [congAccountConnected]);

  return <></>;
};

export default ScheduleAutoRefresh;
