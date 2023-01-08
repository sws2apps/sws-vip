import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AssignmentTypeContainer from './AssignmentTypeContainer';
import PersonFieldContainer from './PersonFieldContainer';
import { styles } from './sharedStyles';

const ScheduleRowContainer = ({ class_count = 1, source, sourceAlt, personA, personB, cbs }) => {
  const getRowStyles = () => {
    if (cbs || class_count === 2) {
      return styles.studentContainer2;
    }

    if (class_count === 1) {
      return styles.studentContainer1;
    }
  };

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

      <Grid item sx={getRowStyles}>
        <PersonFieldContainer person={personA} />
        {(class_count === 2 || cbs) && <PersonFieldContainer person={personB} />}
      </Grid>
    </Box>
  );
};

export default ScheduleRowContainer;
