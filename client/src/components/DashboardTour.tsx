import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tourSteps } from './tourSteps';

type DashboardTourProps = {
  onFinish: () => void;
  onSkip: () => void;
};

export default function DashboardTour({ onFinish, onSkip }: DashboardTourProps) {
  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED) onFinish();
    if (status === STATUS.SKIPPED) onSkip();
  };

  return (
    <Joyride
      steps={tourSteps}
      run
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      styles={{
        options: {
          zIndex: 10000,
        },
      }}
    />
  );
}
