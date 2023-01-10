import { useEffect, useRef, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isEmailValid } from '../../utils/emailValid';
import {
  apiHostState,
  isEmailNotVerifiedState,
  isOnlineState,
  isUserSignInState,
  isUserSignUpState,
  visitorIDState,
} from '../../states/main';
import { appMessageState, appSeverityState, appSnackOpenState } from '../../states/notification';
import { getErrorMessage } from '../../utils/app';

const SignUp = () => {
  const abortCont = useRef();

  const { t } = useTranslation();

  const setUserSignIn = useSetRecoilState(isUserSignInState);
  const setUserSignUp = useSetRecoilState(isUserSignUpState);
  const setAppSnackOpen = useSetRecoilState(appSnackOpenState);
  const setAppSeverity = useSetRecoilState(appSeverityState);
  const setAppMessage = useSetRecoilState(appMessageState);
  const setEmailNotVerified = useSetRecoilState(isEmailNotVerifiedState);

  const visitorID = useRecoilValue(visitorIDState);
  const isOnline = useRecoilValue(isOnlineState);
  const apiHost = useRecoilValue(apiHostState);

  const [userTmpFullname, setUserTmpFullname] = useState('');
  const [userTmpPwd, setUserTmpPwd] = useState('');
  const [userTmpConfirmPwd, setUserTmpConfirmPwd] = useState('');
  const [userTmpEmail, setUserTmpEmail] = useState('');
  const [hasErrorFullname, setHasErrorFullname] = useState(false);
  const [hasErrorEmail, setHasErrorEmail] = useState(false);
  const [hasErrorPwd, setHasErrorPwd] = useState(false);
  const [hasErrorConfirmPwd, setHasErrorConfirmPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const togglePwd = () => {
    setShowPwd((prev) => {
      return !prev;
    });
  };

  const handleSignIn = () => {
    setUserSignIn(true);
    setUserSignUp(false);
  };

  const handleSignUp = async () => {
    try {
      abortCont.current = new AbortController();

      setHasErrorEmail(false);
      setHasErrorPwd(false);
      setHasErrorConfirmPwd(false);

      const { isValid: isValidEmail, isSupportedDomain: isSupportedEmail } = isEmailValid(userTmpEmail);
      if (
        userTmpFullname.length >= 3 &&
        isValidEmail &&
        isSupportedEmail &&
        userTmpPwd.length >= 10 &&
        userTmpPwd === userTmpConfirmPwd
      ) {
        setIsProcessing(true);
        const reqPayload = {
          email: userTmpEmail,
          password: userTmpPwd,
          fullname: userTmpFullname,
        };

        if (apiHost !== '') {
          const res = await fetch(`${apiHost}api/users/create-account`, {
            method: 'POST',
            signal: abortCont.current.signal,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(reqPayload),
          });

          const data = await res.json();
          if (res.status === 200) {
            setEmailNotVerified(true);
            setIsProcessing(false);
            setUserSignUp(false);
          } else {
            setIsProcessing(false);
            setAppMessage(getErrorMessage(data.message));
            setAppSeverity('warning');
            setAppSnackOpen(true);
          }
        }
      } else {
        if (userTmpFullname.length < 3) {
          setHasErrorFullname(true);
        }
        if (!isValidEmail || !isSupportedEmail) {
          setHasErrorEmail(true);
        }
        if (!isSupportedEmail) {
          setIsProcessing(false);
          setAppMessage(getErrorMessage('EMAIL_NOT_SUPPORTED'));
          setAppSeverity('warning');
          setAppSnackOpen(true);
        }
        if (userTmpPwd.length < 10) {
          setHasErrorPwd(true);
        }
        if (userTmpConfirmPwd.length < 10 || userTmpPwd !== userTmpConfirmPwd) {
          setHasErrorConfirmPwd(true);
        }
      }
    } catch (err) {
      if (!abortCont.current.signal.aborted) {
        setIsProcessing(false);
        setAppMessage(getErrorMessage('ACCOUNT_CREATION_FAILED'));
        setAppSeverity('error');
        setAppSnackOpen(true);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (abortCont.current) abortCont.current.abort();
    };
  }, [abortCont]);

  return (
    <Container sx={{ marginTop: '20px' }}>
      <Typography variant="h4" sx={{ marginBottom: '15px' }}>
        {t('createSwsAccount')}
      </Typography>

      <Typography sx={{ marginBottom: '20px' }}>{t('newUserAccount')}</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
        <TextField
          sx={{ width: '100%' }}
          id="outlined-fullname"
          label={t('fullname')}
          variant="outlined"
          autoComplete="off"
          required
          value={userTmpFullname}
          onChange={(e) => setUserTmpFullname(e.target.value)}
          error={hasErrorFullname ? true : false}
        />

        <TextField
          sx={{ marginTop: '20px', width: '100%' }}
          id="outlined-email"
          label={t('email')}
          variant="outlined"
          autoComplete="off"
          required
          value={userTmpEmail}
          onChange={(e) => setUserTmpEmail(e.target.value)}
          error={hasErrorEmail ? true : false}
        />

        <TextField
          sx={{ marginTop: '20px', width: '100%' }}
          id="outlined-password"
          label={t('password')}
          type={showPwd ? '' : 'password'}
          variant="outlined"
          autoComplete="off"
          required
          value={userTmpPwd}
          onChange={(e) => setUserTmpPwd(e.target.value)}
          error={hasErrorPwd ? true : false}
        />

        <TextField
          sx={{ marginTop: '20px', width: '100%' }}
          id="outlined-confirm-password"
          label={t('confirmPassword')}
          type={showPwd ? '' : 'password'}
          variant="outlined"
          autoComplete="off"
          required
          value={userTmpConfirmPwd}
          onChange={(e) => setUserTmpConfirmPwd(e.target.value)}
          error={hasErrorConfirmPwd ? true : false}
        />

        <FormControlLabel
          control={<Checkbox id="checkShowPwd" checked={showPwd} onChange={togglePwd} />}
          label={<Typography sx={{ lineHeight: 1.2 }}>{t('showPassword')}</Typography>}
          sx={{
            width: '100%',
            marginTop: '15px',
          }}
        />
      </Box>

      <Box
        sx={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '500px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <Link component="button" underline="none" variant="body1" onClick={handleSignIn}>
          {t('hasAccount')}
        </Link>
        <Button
          variant="contained"
          disabled={!isOnline || isProcessing || visitorID.length === 0}
          onClick={handleSignUp}
          endIcon={isProcessing ? <CircularProgress size={25} /> : null}
        >
          {t('create')}
        </Button>
      </Box>
    </Container>
  );
};

export default SignUp;
