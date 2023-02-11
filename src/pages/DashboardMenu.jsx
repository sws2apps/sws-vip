import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useTranslation } from 'react-i18next';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import Box from '@mui/material/Box';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MenuCard from '../components/MenuCard';
import { isMyAssignmentOpenState } from '../states/main';
import { congAccountConnectedState } from '../states/congregation';
import { getCurrentWeekDate } from '../utils/app';
import { dbRefreshLocalSchedule } from '../api/schedule';

const DashboardMenu = () => {
  const navigate = useNavigate();

  const { t } = useTranslation('ui');

  const setMyAssignmentsOpen = useSetRecoilState(isMyAssignmentOpenState);

  const isCongAccountConnected = useRecoilValue(congAccountConnectedState);

  const handleOpenMyAssignment = () => {
    setMyAssignmentsOpen(true);
  };

  const handleViewCurrentAssignment = async () => {
    let weekDate = await getCurrentWeekDate();
    weekDate = weekDate.replaceAll('/', '-');
    navigate(`/meeting-schedule/${weekDate}`);
  };

  const dashboardMenus = [
    {
      title: t('meetingSchedule'),
      visible: true,
      links: [
        {
          title: t('viewMyAssignments'),
          icon: <AssignmentIndIcon />,
          visible: true,
          action: handleOpenMyAssignment,
        },
        {
          title: t('viewAssignmentsSchedule'),
          icon: <ScheduleIcon />,
          visible: true,
          action: handleViewCurrentAssignment,
        },
        {
          title: t('refreshSchedule'),
          icon: <CloudSyncIcon />,
          visible: isCongAccountConnected,
          action: dbRefreshLocalSchedule,
        },
      ],
    },
  ];

  return (
    <Box sx={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {dashboardMenus.map((menu) => (
        <MenuCard key={`menu-item-${menu.title}`} menu={menu} />
      ))}
    </Box>
  );
};

export default DashboardMenu;
