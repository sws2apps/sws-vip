import { useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import InfoIcon from '@mui/icons-material/Info';
import Typography from '@mui/material/Typography';
import { isUnauthorizedRoleState, isUserSignInState } from '../../states/main';

const UnauthorizedRole = () => {
  const { t } = useTranslation();

  const setUserSignIn = useSetRecoilState(isUserSignInState);
  const setIsUnauthorizedRole = useSetRecoilState(isUnauthorizedRoleState);

  const handleSignIn = () => {
    setUserSignIn(true);
    setIsUnauthorizedRole(false);
  };

  return (
    <Container sx={{ marginTop: '20px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <InfoIcon
          color="primary"
          sx={{
            fontSize: '40px',
            cursor: 'pointer',
          }}
        />
        <Typography variant="h5">{t('unauthorized')}</Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '20px',
          margin: '30px 0',
        }}
      >
        <Typography>{t('unauthorizedRole')}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSignIn}>
          OK
        </Button>
      </Box>
    </Container>
  );
};

export default UnauthorizedRole;
