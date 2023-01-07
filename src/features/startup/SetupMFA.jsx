import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import { Markup } from 'interweave';
import { MuiOtpInput } from 'mui-one-time-password-input';
import QRCode from 'qrcode';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TabPanel from '../../components/TabPanel';
import {
  apiHostState,
  isAppLoadState,
  isReEnrollMFAState,
  isSetupState,
  isUnauthorizedRoleState,
  isUserMfaSetupState,
  offlineOverrideState,
  qrCodePathState,
  secretTokenPathState,
  startupProgressState,
  userEmailState,
  userIDState,
  userPasswordState,
  visitorIDState,
} from '../../states/main';
import { initAppDb, isDbExist } from '../../indexedDb/dbUtility';
import { encryptString } from '../../utils/swsEncryption';
import { dbUpdateAppSettings } from '../../indexedDb/dbAppSettings';
import { getErrorMessage, loadApp } from '../../utils/app';
import { runUpdater } from '../../utils/updater';
import { appMessageState, appSeverityState, appSnackOpenState } from '../../states/notification';
import { congAccountConnectedState, congIDState } from '../../states/congregation';

const a11yProps = (index) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

const matchIsNumeric = (text) => {
  return !isNaN(Number(text));
};

const validateChar = (value, index) => {
  return matchIsNumeric(value);
};

const SetupMFA = () => {
  const abortCont = useRef();

  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(false);
  const [userOTP, setUserOTP] = useState('');
  const [imgPath, setImgPath] = useState('');
  const [isNoQR, setIsNoQR] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const setAppSnackOpen = useSetRecoilState(appSnackOpenState);
  const setAppSeverity = useSetRecoilState(appSeverityState);
  const setAppMessage = useSetRecoilState(appMessageState);
  const setIsUserMfaSetup = useSetRecoilState(isUserMfaSetupState);
  const setIsUnauthorizedRole = useSetRecoilState(isUnauthorizedRoleState);
  const setIsSetup = useSetRecoilState(isSetupState);
  const setIsAppLoad = useSetRecoilState(isAppLoadState);
  const setStartupProgress = useSetRecoilState(startupProgressState);
  const setCongAccountConnected = useSetRecoilState(congAccountConnectedState);
  const setOfflineOverride = useSetRecoilState(offlineOverrideState);
  const setCongID = useSetRecoilState(congIDState);
  const setUserID = useSetRecoilState(userIDState);

  const apiHost = useRecoilValue(apiHostState);
  const qrCodePath = useRecoilValue(qrCodePathState);
  const token = useRecoilValue(secretTokenPathState);
  const userEmail = useRecoilValue(userEmailState);
  const visitorID = useRecoilValue(visitorIDState);
  const userPwd = useRecoilValue(userPasswordState);
  const isReEnrollMFA = useRecoilValue(isReEnrollMFAState);

  const handleTabChange = (e, newValue) => {
    setTabValue(newValue);
  };

  const handleCopyClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
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

                const isMainDb = await isDbExist('sws_vip');
                if (!isMainDb) {
                  await initAppDb();
                }

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
              }
              return;
            }

            // congregation not assigned
            setIsProcessing(false);
            setIsUserMfaSetup(false);
            setIsUnauthorizedRole(true);
          } else {
            setIsProcessing(false);
            setAppMessage(getErrorMessage(data.message));
            setAppSeverity('warning');
            setAppSnackOpen(true);
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
    setIsSetup,
    setIsUnauthorizedRole,
    setIsUserMfaSetup,
    setOfflineOverride,
    setStartupProgress,
    setUserID,
    userEmail,
    userOTP,
    userPwd,
    visitorID,
  ]);

  const handleOtpChange = async (newValue) => {
    setUserOTP(newValue);
  };

  useEffect(() => {
    if (userOTP.length === 6) {
      handleVerifyOTP();
    }
  }, [handleVerifyOTP, userOTP]);

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

  useEffect(() => {
    const getQrCode = async () => {
      QRCode.toDataURL(qrCodePath, function (err, data_url) {
        if (err) {
          return;
        }

        setImgPath(data_url);
      });
    };

    if (qrCodePath.length > 0) {
      getQrCode();
    }
  }, [qrCodePath]);

  useEffect(() => {
    return () => {
      if (abortCont.current) abortCont.current.abort();
    };
  }, [abortCont]);

  return (
    <Container sx={{ marginTop: '20px' }}>
      <Typography variant="h4" sx={{ marginBottom: '15px' }}>
        {t('setupMFA')}
      </Typography>

      <Typography
        sx={{
          margin: '20px 0',
        }}
      >
        <Markup content={isReEnrollMFA ? t('mfaSetupUpdate') : t('mfaSetupTitle')} />
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          <Tab label={t('thisDevice')} {...a11yProps(0)} />
          <Tab label={t('otherDevice')} {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={tabValue} index={0}>
        <Typography sx={{ marginBottom: '15px' }}>{t('mfaThisDevice')}</Typography>
        <Button variant="contained" target="_blank" rel="noopener" href={qrCodePath}>
          {t('setup')}
        </Button>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {isNoQR && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              marginBottom: '10px',
            }}
          >
            <TextField
              id="outlined-token"
              label={t('token')}
              variant="outlined"
              autoComplete="off"
              value={token}
              multiline
              sx={{ width: '100%', maxWidth: '500px', marginTop: '10px' }}
              InputProps={{
                readOnly: true,
              }}
            />
            <IconButton aria-label="copy" onClick={() => handleCopyClipboard(token)}>
              <ContentCopyIcon />
            </IconButton>
          </Box>
        )}

        {!isNoQR && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {imgPath.length > 0 && <img className="qrcode" src={imgPath} alt="QR Code 2FA" />}
          </Box>
        )}

        <Link component="button" underline="none" variant="body1" onClick={() => setIsNoQR(!isNoQR)}>
          {isNoQR ? t('scanQR') : t('copyToken')}
        </Link>
      </TabPanel>

      <Typography sx={{ marginBottom: '15px', marginTop: '20px' }}>{t('setupTextOTP')}</Typography>

      <Box sx={{ width: '300px' }}>
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
          flexDirection: 'column',
          alignItems: 'flex-start',
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

export default SetupMFA;