import { useRecoilValue } from 'recoil';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { sourceLangState } from '../../states/main';

const MyAssignmentsMonthItem = ({ assignment }) => {
  const { weekOf, assignmentContent, assignmentName, assignmentSource } = assignment;

  const sourceLang = useRecoilValue(sourceLangState);
  const lang = sourceLang.toUpperCase();

  const dateValue = weekOf.split('/')[1];

  return (
    <Box sx={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <Paper sx={{ backgroundColor: '#3f51b5', padding: '0 20px' }} elevation={3}>
        <Typography align="center" sx={{ fontWeight: 'bold', fontSize: '22px', color: 'white' }}>
          {dateValue}
        </Typography>
      </Paper>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Typography variant="h6" sx={{ lineHeight: 1.2, marginTop: '3px' }}>
          {assignmentName}
        </Typography>
        <Typography sx={{ lineHeight: 1.2 }}>
          {assignmentSource && assignmentSource[lang] !== undefined ? assignmentSource[lang] : ''}
        </Typography>
        {assignmentContent && assignmentContent[lang] !== '' && (
          <Typography sx={{ lineHeight: 1.2, fontSize: '14px' }}>{assignmentContent[lang]}</Typography>
        )}
      </Box>
    </Box>
  );
};

export default MyAssignmentsMonthItem;
