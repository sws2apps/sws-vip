import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AssignmentTypeContainer from './AssignmentTypeContainer';
import PersonFieldContainer from './PersonFieldContainer';
import { styles } from './sharedStyles';

const ScheduleRowAYFContainer = ({
  class_count = 1,
  source,
  sourceAlt,
  personA,
  personB,
  assistantA,
  assistantB,
  assType,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}
    >
      <Grid item sx={class_count === 1 ? styles.studentPartWrapper1 : styles.studentPartWrapper2}>
        <AssignmentTypeContainer type={source} />
        {sourceAlt && <Typography variant="body1">{sourceAlt}</Typography>}
      </Grid>
      {assType !== 105 && assType !== 106 && assType !== 107 && assType !== 117 && (
        <Grid item sx={class_count === 1 ? styles.studentContainer1Styles : styles.studentContainer2Styles}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <PersonFieldContainer person={personA} />
            {assType && assType !== 104 && <PersonFieldContainer person={assistantA} />}
          </Box>

          {class_count === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <PersonFieldContainer person={personB} />
              {assType && assType !== 104 && <PersonFieldContainer person={assistantB} />}
            </Box>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default ScheduleRowAYFContainer;
