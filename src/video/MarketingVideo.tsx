import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const MarketingVideo = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Animation timing
	const logoScale = spring({
		frame,
		fps,
		config: { damping: 20 },
	});

	const titleOpacity = interpolate(frame, [30, 60], [0, 1]);
	const subtitleOpacity = interpolate(frame, [60, 90], [0, 1]);
	const featuresOpacity = interpolate(frame, [90, 120], [0, 1]);
	const ctaOpacity = interpolate(frame, [200, 230], [0, 1]);

	const logoY = interpolate(frame, [0, 30], [100, 0], {
		extrapolateRight: 'clamp',
	});

	const titleY = interpolate(frame, [30, 60], [50, 0], {
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
				color: 'white',
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			{/* Logo Animation */}
			<div
				style={{
					position: 'absolute',
					top: '20%',
					left: '50%',
					transform: `translate(-50%, ${logoY}px) scale(${logoScale})`,
					fontSize: '120px',
					fontWeight: 'bold',
					background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
				}}
			>
				⚡
			</div>

			{/* Title */}
			<div
				style={{
					position: 'absolute',
					top: '40%',
					left: '50%',
					transform: `translate(-50%, ${titleY}px)`,
					textAlign: 'center',
					opacity: titleOpacity,
				}}
			>
				<h1
					style={{
						fontSize: '96px',
						fontWeight: '800',
						margin: 0,
						lineHeight: 1.1,
						background: 'linear-gradient(45deg, #ffffff, #e2e8f0)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
					}}
				>
					Helios
				</h1>
				<h2
					style={{
						fontSize: '48px',
						fontWeight: '600',
						margin: '20px 0 0 0',
						color: '#94a3b8',
					}}
				>
					AI Infrastructure Intelligence
				</h2>
			</div>

			{/* Subtitle */}
			<div
				style={{
					position: 'absolute',
					top: '60%',
					left: '50%',
					transform: 'translateX(-50%)',
					textAlign: 'center',
					opacity: subtitleOpacity,
					maxWidth: '800px',
				}}
			>
				<p
					style={{
						fontSize: '28px',
						margin: 0,
						color: '#cbd5e1',
						lineHeight: 1.4,
					}}
				>
					Optimize costs, reduce energy consumption, and maximize efficiency of your AI infrastructure
				</p>
			</div>

			{/* Features */}
			<div
				style={{
					position: 'absolute',
					top: '70%',
					left: '50%',
					transform: 'translateX(-50%)',
					textAlign: 'center',
					opacity: featuresOpacity,
					display: 'flex',
					gap: '60px',
					justifyContent: 'center',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '10px' }}>💰</div>
					<div style={{ fontSize: '20px', fontWeight: '600', color: '#fbbf24' }}>
						Cost Optimization
					</div>
				</div>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '10px' }}>🌱</div>
					<div style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
						Energy Efficiency
					</div>
				</div>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
					<div style={{ fontSize: '20px', fontWeight: '600', color: '#3b82f6' }}>
						Real-time Analytics
					</div>
				</div>
			</div>

			{/* Call to Action */}
			<div
				style={{
					position: 'absolute',
					bottom: '15%',
					left: '50%',
					transform: 'translateX(-50%)',
					textAlign: 'center',
					opacity: ctaOpacity,
				}}
			>
				<div
					style={{
						fontSize: '36px',
						fontWeight: '700',
						marginBottom: '20px',
						color: '#ffffff',
					}}
				>
					Start optimizing today
				</div>
				<div
					style={{
						fontSize: '28px',
						color: '#fbbf24',
						fontWeight: '600',
					}}
				>
					heliosnrg.xyz
				</div>
			</div>

			{/* Animated particles/background elements */}
			{[...Array(20)].map((_, i) => {
				const delay = i * 5;
				const particleFrame = Math.max(0, frame - delay);
				const particleY = interpolate(particleFrame, [0, 100], [1080, -100], {
					extrapolateRight: 'clamp',
				});
				const particleOpacity = interpolate(particleFrame, [0, 20, 80, 100], [0, 1, 1, 0]);

				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: `${Math.random() * 100}%`,
							top: `${particleY}px`,
							width: '4px',
							height: '4px',
							background: '#fbbf24',
							borderRadius: '50%',
							opacity: particleOpacity * 0.6,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};
