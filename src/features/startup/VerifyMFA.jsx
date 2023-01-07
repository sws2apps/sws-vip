import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import { MuiOtpInput } from 'mui-one-time-password-input';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { appMessageState, appSeverityState, appSnackOpenState } from '../../states/notification';
import {
  apiHostState,
  isAppLoadState,
  isReEnrollMFAState,
  isSetupState,
  isUnauthorizedRoleState,
  isUserMfaSetupState,
  isUserMfaVerifyState,
  offlineOverrideState,
  qrCodePathState,
  secretTokenPathState,
  startupProgressState,
  userEmailState,
  userIDState,
  userPasswordState,
  visitorIDState,
} from '../../states/main';
import { congAccountConnectedState, congIDState } from '../../states/congregation';
import { encryptString } from '../../utils/swsEncryption';
import { dbUpdateAppSettings } from '../../indexedDb/dbAppSettings';
import { getErrorMessage, loadApp } from '../../utils/app';
import { runUpdater } from '../../utils/updater';

const matchIsNumeric = (text) => {
  return !isNaN(Number(text));
};

const validateChar = (value, index) => {
  return matchIsNumeric(value);
};

const VerifyMFA = () => {
  const abortCont = useRef();

  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [userOTP, setUserOTP] = useState('');

  const setAppSnackOpen = useSetRecoilState(appSnackOpenState);
  const setAppSeverity = useSetRecoilState(appSeverityState);
  const setAppMessage = useSetRecoilState(appMessageState);
  const setIsUserMfaVerify = useSetRecoilState(isUserMfaVerifyState);
  const setIsUnauthorizedRole = useSetRecoilState(isUnauthorizedRoleState);
  const setIsSetup = useSetRecoilState(isSetupState);
  const setIsAppLoad = useSetRecoilState(isAppLoadState);
  const setStartupProgress = useSetRecoilState(startupProgressState);
  const setCongAccountConnected = useSetRecoilState(congAccountConnectedState);
  const setOfflineOverride = useSetRecoilState(offlineOverrideState);
  const setCongID = useSetRecoilState(congIDState);
  const setUserID = useSetRecoilState(userIDState);
  const setIsReEnrollMFA = useSetRecoilState(isReEnrollMFAState);
  const setIsUserMfaSetup = useSetRecoilState(isUserMfaSetupState);
  const setQrCodePath = useSetRecoilState(qrCodePathState);
  const setSecretTokenPath = useSetRecoilState(secretTokenPathState);

  const apiHost = useRecoilValue(apiHostState);
  const userEmail = useRecoilValue(userEmailState);
  const visitorID = useRecoilValue(visitorIDState);
  const userPwd = useRecoilValue(userPasswordState);

  const handleOtpChange = async (newValue) => {
    setUserOTP(newValue);
  };

  const handleVerifyOTP = useCallback(async () => {
    try {
      abortCont.current = new AbortController();

      if (userOTP.length === 6) {
        setIsProcessing(true);
        const reqPayload = {
          token: userOTP,
        };

        if (apiHost !== '') {
          const res = await fetch(`${apiHost}api/mfa/verify-token`, {
            method: 'POST',
            signal: abortCont.current.signal,
            headers: {
              'Content-Type': 'application/json',
              visitorid: visitorID,
              email: userEmail,
            },
            body: JSON.stringify(reqPayload),
          });

          const data = await res.json();
          if (res.status === 200) {
            const { id, cong_id, cong_name, cong_role, cong_number, pocket_local_id, pocket_members, username } = data;

            if (cong_role.length > 0) {
              // role approved
              if (cong_role.includes('view_meeting_schedule')) {
                localStorage.setItem('email', userEmail);

                setCongID(cong_id);
                // encrypt email & pwd
                const encPwd = await encryptString(userPwd, JSON.stringify({ email: userEmail, pwd: userPwd }));

                // save congregation update if any
                const obj = {
                  username,
                  cong_name,
                  cong_number,
                  userPass: encPwd,
                  isLoggedOut: false,
                  local_id: pocket_local_id.person_uid,
                  pocket_members,
                };

                await dbUpdateAppSettings(obj);

                setUserID(id);

                await loadApp();

                setIsSetup(false);

                await runUpdater();
                setTimeout(() => {
                  setStartupProgress(0);
                  setOfflineOverride(false);
                  setCongAccountConnected(true);
                  setIsAppLoad(false);
                }, [2000]);

                return;
              }
            }

            setIsProcessing(false);
            setIsUserMfaVerify(false);
            setIsUnauthorizedRole(true);
          } else {
            if (data.message) {
              setIsProcessing(false);
              setAppMessage(getErrorMessage(data.message));
              setAppSeverity('warning');
              setAppSnackOpen(true);
            } else {
              setSecretTokenPath(data.secret);
              setQrCodePath(data.qrCode);
              setIsReEnrollMFA(true);
              setIsUserMfaSetup(true);
              setIsProcessing(false);
              setIsUserMfaVerify(false);
            }
          }
        }
      }
    } catch (err) {
      if (!abortCont.current.signal.aborted) {
        setIsProcessing(false);
        setAppMessage(err.message);
        setAppSeverity('error');
        setAppSnackOpen(true);
      }
    }
  }, [
    apiHost,
    setAppMessage,
    setAppSeverity,
    setAppSnackOpen,
    setCongAccountConnected,
    setCongID,
    setIsAppLoad,
    setIsReEnrollMFA,
    setIsSetup,
    setIsUnauthorizedRole,
    setIsUserMfaSetup,
    setIsUserMfaVerify,
    setOfflineOverride,
    setQrCodePath,
    setSecretTokenPath,
    setStartupProgress,
    setUserID,
    userEmail,
    userOTP,
    userPwd,
    visitorID,
  ]);

  useEffect(() => {
    if (userOTP.length === 6) {
      handleVerifyOTP();
    }
  }, [handleVerifyOTP, userOTP]);

  useEffect(() => {
    return () => {
      if (abortCont.current) abortCont.current.abort();
    };
  }, [abortCont]);

  useEffect(() => {
    const handlePaste = (e) => {
      const text = (e.clipboardData || window.clipboardData).getData('text');
      setUserOTP(text);
    };

    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <Container sx={{ marginTop: '20px' }}>
      <Typography variant="h4" sx={{ marginBottom: '15px' }}>
        {t('mfaVerifyTitle')}
      </Typography>

      <Box sx={{ width: '100%', maxWidth: '450px', marginTop: '20px' }}>
        <MuiOtpInput
          value={userOTP}
          onChange={handleOtpChange}
          length={6}
          display="flex"
          gap={1}
          validateChar={validateChar}
          TextFieldsProps={{ autoComplete: 'off' }}
        />
      </Box>

      <Box
        sx={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          maxWidth: '450px',
          width: '100%',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <Button
          variant="contained"
          disabled={isProcessing || visitorID.length === 0}
          onClick={handleVerifyOTP}
          endIcon={isProcessing ? <CircularProgress size={25} /> : null}
        >
          {t('verify')}
        </Button>
      </Box>
    </Container>
  );
};

export default VerifyMFA;
