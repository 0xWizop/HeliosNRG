import { Composition } from 'remotion';
import { MarketingVideo } from './MarketingVideo';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="Marketing"
				component={MarketingVideo}
				durationInFrames={300} // 10 seconds at 30fps
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};
