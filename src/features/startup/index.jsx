import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import Box from '@mui/material/Box';
import EmailNotVerified from './EmailNotVerified';
import LinearProgress from '@mui/material/LinearProgress';
import SetupMFA from './SetupMFA';
import SignIn from './SignIn';
import SignUp from './SignUp';
import TermsUse from './TermsUse';
import { dbGetAppSettings } from '../../indexedDb/dbAppSettings';
import { loadApp } from '../../utils/app';
import { runUpdater } from '../../utils/updater';
import {
  isAppLoadState,
  isEmailBlockedState,
  isEmailNotVerifiedState,
  isSetupState,
  isShowTermsUseState,
  isUnauthorizedRoleState,
  isUserMfaSetupState,
  isUserMfaVerifyState,
  isUserSignInState,
  isUserSignUpState,
  offlineOverrideState,
} from '../../states/main';
import UnauthorizedRole from './UnauthorizedRole';
import VerifyMFA from './VerifyMFA';
import EmailBlocked from './EmailBlocked';

const Startup = () => {
  const [isSetup, setIsSetup] = useRecoilState(isSetupState);
  const [showTermsUse, setShowTermsUse] = useRecoilState(isShowTermsUseState);
  const [isUserSignUp, setIsUserSignUp] = useRecoilState(isUserSignUpState);
  const [isUserSignIn, setIsUserSignIn] = useRecoilState(isUserSignInState);

  const setIsAppLoad = useSetRecoilState(isAppLoadState);

  const offlineOverride = useRecoilValue(offlineOverrideState);
  const isEmailNotVerified = useRecoilValue(isEmailNotVerifiedState);
  const isUserMfaSetup = useRecoilValue(isUserMfaSetupState);
  const isUnauthorizedRole = useRecoilValue(isUnauthorizedRoleState);
  const isUserMfaVerify = useRecoilValue(isUserMfaVerifyState);
  const isEmailBlocked = useRecoilValue(isEmailBlockedState);

  useEffect(() => {
    const checkLoginState = async () => {
      if (offlineOverride) {
        setIsSetup(true);
      } else {
        let { isLoggedOut, userPass, username } = await dbGetAppSettings();

        if (isLoggedOut === false && userPass?.length > 0 && username?.length > 0) {
          await loadApp();
          await runUpdater();
          setTimeout(() => {
            setIsAppLoad(false);
          }, [1000]);
        } else if (isLoggedOut === true) {
          setShowTermsUse(false);
          setIsUserSignUp(false);
          setIsUserSignIn(true);
          setIsSetup(true);
        } else {
          setIsSetup(true);
        }
      }
    };

    checkLoginState();
  }, [offlineOverride, setIsAppLoad, setIsSetup, setShowTermsUse, setIsUserSignUp, setIsUserSignIn]);

  useEffect(() => {
    const showTermsUse =
      localStorage.getItem('termsUse') && localStorage.getItem('termsUse') === 'false' ? false : true;
    setShowTermsUse(showTermsUse);
  }, [setShowTermsUse]);

  if (isSetup) {
    return (
      <>
        {showTermsUse && <TermsUse />}
        {!showTermsUse && (
          <>
            {isUserSignIn && <SignIn />}
            {isUserSignUp && <SignUp />}
            {isEmailNotVerified && <EmailNotVerified />}
            {isUserMfaSetup && <SetupMFA />}
            {isUnauthorizedRole && <UnauthorizedRole />}
            {isUserMfaVerify && <VerifyMFA />}
            {isEmailBlocked && <EmailBlocked />}
          </>
        )}
      </>
    );
  }

  return (
    <Box className="app-splash-screen">
      <Box className="app-logo-container">
        <img src="/img/appLogo.png" alt="App logo" className="appLogo" />
      </Box>
      <Box sx={{ width: '280px', marginTop: '10px' }}>
        <LinearProgress />
      </Box>
    </Box>
  );
};

export default Startup;
