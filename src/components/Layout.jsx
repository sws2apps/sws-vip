import { useEffect, Suspense } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';
import usePwa2 from 'use-pwa2/dist/index.js';
import Box from '@mui/material/Box';
import About from '../features/about';
import RootModal from './RootModal';
import UserAutoLogin from '../features/userAutoLogin';
import { WhatsNewContent } from '../features/whatsNew';
import { isAboutOpenState, isAppLoadState, isOnlineState } from '../states/main';
import Startup from '../features/startup';
import NavBar from './NavBar';
import { AppUpdater } from '../features/updater';
import { MyAssignments } from '../features/myAssignments';
import { ScheduleAutoRefresh } from '../features/schedules';
import WaitingPage from './WaitingPage';
import EmailLinkAuthentication from '../features/startup/EmailLinkAuthentication';
import { dbSaveNotifications } from '../indexedDb/dbNotifications';
import { fetchNotifications } from '../api/notification';

const Layout = ({ updatePwa }) => {
  let location = useLocation();

  const { data: announcements } = useQuery({
    queryKey: ['annoucements'],
    queryFn: fetchNotifications,
    refetchInterval: 60000,
  });

  const { enabledInstall, installPwa, isLoading } = usePwa2();

  const [searchParams] = useSearchParams();

  const isEmailAuth = searchParams.get('code') !== null;

  const isAppLoad = useRecoilValue(isAppLoadState);
  const isOpenAbout = useRecoilValue(isAboutOpenState);
  const isOnline = useRecoilValue(isOnlineState);

  const checkPwaUpdate = () => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
      navigator.serviceWorker.register(swUrl).then((reg) => {
        reg.update();
      });
    }
  };

  useEffect(() => {
    if (import.meta.env.PROD && isOnline) checkPwaUpdate();
  }, [isOnline, location]);

  useEffect(() => {
    if (announcements?.data?.length >= 0) dbSaveNotifications(announcements.data);
  }, [announcements]);

  return (
    <RootModal>
      <NavBar enabledInstall={enabledInstall} isLoading={isLoading} installPwa={installPwa} />
      <AppUpdater updatePwa={updatePwa} enabledInstall={enabledInstall} />

      <Box sx={{ padding: '10px' }}>
        <UserAutoLogin />
        <WhatsNewContent />
        <ScheduleAutoRefresh />
        {isOpenAbout && <About />}

        {isEmailAuth && <EmailLinkAuthentication />}
        {isAppLoad && !isEmailAuth && <Startup />}
        {!isAppLoad && (
          <Suspense fallback={<WaitingPage />}>
            <MyAssignments />
            <Outlet />
          </Suspense>
        )}
      </Box>
    </RootModal>
  );
};

export default Layout;
