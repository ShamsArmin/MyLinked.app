import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tourSteps } from '@/tourSteps';

type Props = {
  run: boolean;
  onFinish: () => void;
  onSkip: () => void;
};

export default function DashboardTour({ run, onFinish, onSkip }: Props) {
  return (
    <Joyride
      steps={tourSteps}
      run={run}
      showProgress
      showSkipButton
      continuous
      disableScrolling
      styles={{
        options: { zIndex: 10000 },
        overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
      }}
      locale={{ last: 'Done' }}
      callback={(data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
          if (status === STATUS.SKIPPED) onSkip();
          else onFinish();
        }
      }}
    />
  );
}
