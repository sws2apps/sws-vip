import { useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import usePwa2 from 'use-pwa2/dist/index.js';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import About from '../features/about';
import RootModal from './RootModal';
import UserAutoLogin from '../features/userAutoLogin';
import { WhatsNew } from '../features/whatsNew';
import { isAboutOpenState, isAppClosingState, isAppLoadState, isWhatsNewOpenState } from '../states/main';
import Startup from '../features/startup';
import NavBar from './NavBar';
import { fetchNotifications } from '../utils/app';
import { AppUpdater } from '../features/updater';
import { UserSignOut } from '../features/userSignOut';

const WaitingPage = () => {
  return (
    <CircularProgress
      color="primary"
      size={80}
      disableShrink={true}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
      }}
    />
  );
};

const Layout = ({ updatePwa }) => {
  let location = useLocation();

  const { enabledInstall, installPwa, isLoading } = usePwa2();

  const isAppLoad = useRecoilValue(isAppLoadState);
  const isOpenAbout = useRecoilValue(isAboutOpenState);
  const isOpenWhatsNew = useRecoilValue(isWhatsNewOpenState);
  const isAppClosing = useRecoilValue(isAppClosingState);

  const checkPwaUpdate = () => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
      navigator.serviceWorker.register(swUrl).then((reg) => {
        reg.update();
      });
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (import.meta.env.PROD) {
      checkPwaUpdate();
    }
  }, [location]);

  return (
    <RootModal>
      <NavBar enabledInstall={enabledInstall} isLoading={isLoading} installPwa={installPwa} />
      <AppUpdater updatePwa={updatePwa} enabledInstall={enabledInstall} />

      <Box sx={{ padding: '10px' }}>
        <UserAutoLogin />

        {isOpenAbout && <About />}
        {isOpenWhatsNew && <WhatsNew />}
        {isAppClosing && <UserSignOut />}

        {isAppLoad && <Startup />}
        {!isAppLoad && (
          <Suspense fallback={<WaitingPage />}>
            <Outlet />
          </Suspense>
        )}
      </Box>
    </RootModal>
  );
};

export default Layout;
