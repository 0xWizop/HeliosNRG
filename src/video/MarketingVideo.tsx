import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Sequence,
} from 'remotion';

export const MarketingVideo = () => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Scene transitions
	const scene1Opacity = interpolate(frame, [0, 30], [0, 1]);
	const scene1Out = interpolate(frame, [90, 120], [1, 0]);
	
	const scene2Opacity = interpolate(frame, [120, 150], [0, 1]);
	const scene2Out = interpolate(frame, [210, 240], [1, 0]);
	
	const scene3Opacity = interpolate(frame, [240, 270], [0, 1]);
	const scene3Out = interpolate(frame, [330, 360], [1, 0]);
	
	const ctaOpacity = interpolate(frame, [360, 390], [0, 1]);

	return (
		<AbsoluteFill
			style={{
				background: '#0f172a',
				color: 'white',
				fontFamily: 'Inter, system-ui, sans-serif',
			}}
		>
			{/* Scene 1: Dashboard Overview */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: scene1Opacity * scene1Out,
				}}
			>
				{/* Browser Chrome */}
				<div
					style={{
						background: '#1e293b',
						height: '40px',
						display: 'flex',
						alignItems: 'center',
						padding: '0 20px',
						borderBottom: '1px solid #334155',
					}}
				>
					<div style={{ display: 'flex', gap: '8px' }}>
						<div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
						<div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
						<div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
					</div>
					<div
						style={{
							flex: 1,
							textAlign: 'center',
							color: '#94a3b8',
							fontSize: '14px',
						}}
					>
						heliosnrg.xyz/dashboard
					</div>
				</div>

				{/* Dashboard Content */}
				<div style={{ padding: '20px', height: 'calc(100% - 40px)' }}>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '30px',
						}}
					>
						<div>
							<h1 style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: '#fbbf24' }}>
								⚡ Helios
							</h1>
							<p style={{ fontSize: '16px', color: '#94a3b8', margin: '5px 0 0 0' }}>
								AI Infrastructure Intelligence
							</p>
						</div>
						<div
							style={{
								background: '#1e293b',
								padding: '8px 16px',
								borderRadius: '8px',
								border: '1px solid #334155',
							}}
						>
							<span style={{ fontSize: '14px', color: '#cbd5e1' }}>Team: Acme Corp</span>
						</div>
					</div>

					{/* Metrics Cards */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(4, 1fr)',
							gap: '20px',
							marginBottom: '30px',
						}}
					>
						{[
							{ label: 'Monthly Cost', value: '$12,450', change: '-12%', color: '#10b981' },
							{ label: 'Energy Usage', value: '8,234 kWh', change: '-8%', color: '#10b981' },
							{ label: 'Carbon Footprint', value: '3.2t CO₂', change: '-15%', color: '#10b981' },
							{ label: 'Active Workloads', value: '47', change: '+5%', color: '#f59e0b' },
						].map((metric, i) => (
							<div
								key={i}
								style={{
									background: '#1e293b',
									padding: '20px',
									borderRadius: '12px',
									border: '1px solid #334155',
								}}
							>
								<div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
									{metric.label}
								</div>
								<div style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
									{metric.value}
								</div>
								<div style={{ fontSize: '14px', color: metric.color }}>
									{metric.change} vs last month
								</div>
							</div>
						))}
					</div>

					{/* Charts Area */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '2fr 1fr',
							gap: '20px',
							height: '300px',
						}}
					>
						{/* Main Chart */}
						<div
							style={{
								background: '#1e293b',
								borderRadius: '12px',
								border: '1px solid #334155',
								padding: '20px',
							}}
						>
							<h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '20px' }}>
								Cost & Energy Trends
							</h3>
							{/* Simulated Chart */}
							<div
								style={{
									height: '200px',
									background: 'linear-gradient(135deg, #fbbf2420, #10b98120)',
									borderRadius: '8px',
									position: 'relative',
									overflow: 'hidden',
								}}
							>
								{[...Array(12)].map((_, i) => (
									<div
										key={i}
										style={{
											position: 'absolute',
											bottom: 0,
											left: `${i * 8.33}%`,
											width: '6%',
											height: `${30 + Math.random() * 60}%`,
											background: '#fbbf24',
											borderRadius: '4px 4px 0 0',
										}}
									/>
								))}
							</div>
						</div>

						{/* GPU Metrics */}
						<div
							style={{
								background: '#1e293b',
								borderRadius: '12px',
								border: '1px solid #334155',
								padding: '20px',
							}}
						>
							<h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '20px' }}>
								GPU Fleet
							</h3>
							<div style={{ spaceY: '10px' }}>
								{[
									{ type: 'H100', count: 8, utilization: '87%' },
									{ type: 'A100', count: 12, utilization: '92%' },
									{ type: 'V100', count: 6, utilization: '78%' },
								].map((gpu, i) => (
									<div key={i} style={{ marginBottom: '15px' }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												marginBottom: '5px',
											}}
										>
											<span style={{ fontSize: '14px', color: '#cbd5e1' }}>{gpu.type}</span>
											<span style={{ fontSize: '14px', color: '#94a3b8' }}>
												{gpu.count} × {gpu.utilization}
											</span>
										</div>
										<div
											style={{
												height: '4px',
												background: '#334155',
												borderRadius: '2px',
												overflow: 'hidden',
											}}
										>
											<div
												style={{
													height: '100%',
													width: gpu.utilization,
													background: '#10b981',
													borderRadius: '2px',
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Scene 2: Cost Analysis */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: scene2Opacity * scene2Out,
				}}
			>
				<div style={{ padding: '40px' }}>
					<h2 style={{ fontSize: '36px', fontWeight: '700', color: '#fbbf24', marginBottom: '10px' }}>
						Cost Optimization Insights
					</h2>
					<p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
						Identify savings opportunities across your AI infrastructure
					</p>

					<div
						style={{
							background: '#1e293b',
							borderRadius: '16px',
							border: '1px solid #334155',
							padding: '30px',
						}}
					>
						<div style={{ marginBottom: '30px' }}>
							<div
								style={{
									fontSize: '48px',
									fontWeight: '800',
									color: '#10b981',
									marginBottom: '10px',
								}}
							>
								$2,340
							</div>
							<div style={{ fontSize: '18px', color: '#cbd5e1' }}>
								Potential monthly savings
							</div>
						</div>

						<div style={{ spaceY: '20px' }}>
							{[
								{
									title: 'Spot Instance Optimization',
									savings: '$1,200/mo',
									description: 'Switch 40% of workloads to spot instances',
								},
								{
									title: 'GPU Right-Sizing',
									savings: '$800/mo',
									description: 'Downgrade underutilized A100s to V100s',
								},
								{
									title: 'Schedule-Based Scaling',
									savings: '$340/mo',
									description: 'Auto-scale during off-peak hours',
								},
							].map((insight, i) => (
								<div
									key={i}
									style={{
										background: '#0f172a',
										padding: '20px',
										borderRadius: '12px',
										border: '1px solid #334155',
										marginBottom: '15px',
									}}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: '10px',
										}}
									>
										<h4 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
											{insight.title}
										</h4>
										<span style={{ fontSize: '18px', color: '#10b981', fontWeight: '600' }}>
											{insight.savings}
										</span>
									</div>
									<p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
										{insight.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Scene 3: Energy & Carbon */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: scene3Opacity * scene3Out,
				}}
			>
				<div style={{ padding: '40px' }}>
					<h2 style={{ fontSize: '36px', fontWeight: '700', color: '#10b981', marginBottom: '10px' }}>
						Sustainability Metrics
					</h2>
					<p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
						Track and reduce your environmental impact
					</p>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)',
							gap: '30px',
						}}
					>
						<div
							style={{
								background: '#1e293b',
								borderRadius: '16px',
								border: '1px solid #334155',
								padding: '30px',
							}}
						>
							<h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '20px' }}>
								Carbon Footprint Analysis
							</h3>
							<div
								style={{
									fontSize: '64px',
									fontWeight: '800',
									color: '#10b981',
									marginBottom: '10px',
								}}
							>
								3.2t
							</div>
							<div style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '20px' }}>
								CO₂e this month
							</div>
							<div
								style={{
									fontSize: '14px',
									color: '#10b981',
									background: '#10b98120',
									padding: '8px 12px',
									borderRadius: '6px',
									display: 'inline-block',
								}}
							>
								↓ 15% from last month
							</div>
						</div>

						<div
							style={{
								background: '#1e293b',
								borderRadius: '16px',
								border: '1px solid #334155',
								padding: '30px',
							}}
						>
							<h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '20px' }}>
								Energy Efficiency Score
							</h3>
							<div
								style={{
									fontSize: '64px',
									fontWeight: '800',
									color: '#fbbf24',
									marginBottom: '10px',
								}}
							>
								A-
							</div>
							<div style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '20px' }}>
								Industry ranking: Top 12%
							</div>
							<div
								style={{
									fontSize: '14px',
									color: '#fbbf24',
									background: '#fbbf2420',
									padding: '8px 12px',
									borderRadius: '6px',
									display: 'inline-block',
								}}
							>
								Above industry average
							</div>
						</div>
					</div>

					<div
						style={{
							background: '#1e293b',
							borderRadius: '16px',
							border: '1px solid #334155',
							padding: '30px',
							marginTop: '30px',
						}}
					>
						<h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '20px' }}>
							Regional Energy Mix
						</h3>
						<div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
							{[
								{ source: 'Renewable', percent: 45, color: '#10b981' },
								{ source: 'Nuclear', percent: 30, color: '#3b82f6' },
								{ source: 'Natural Gas', percent: 20, color: '#f59e0b' },
								{ source: 'Coal', percent: 5, color: '#ef4444' },
							].map((energy, i) => (
								<div key={i} style={{ flex: 1, textAlign: 'center' }}>
									<div
										style={{
											height: `${energy.percent * 2}px`,
											background: energy.color,
											borderRadius: '8px 8px 0 0',
											marginBottom: '10px',
										}}
									/>
									<div style={{ fontSize: '14px', color: '#cbd5e1' }}>
										{energy.source}
									</div>
									<div style={{ fontSize: '18px', color: '#ffffff', fontWeight: '600' }}>
										{energy.percent}%
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Final CTA */}
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: ctaOpacity,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					textAlign: 'center',
					padding: '40px',
				}}
			>
				<div
					style={{
						fontSize: '72px',
						fontWeight: '800',
						marginBottom: '20px',
						background: 'linear-gradient(45deg, #fbbf24, #10b981)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
					}}
				>
					Optimize Your AI Infrastructure
				</div>
				<div
					style={{
						fontSize: '24px',
						color: '#94a3b8',
						marginBottom: '40px',
						maxWidth: '600px',
					}}
				>
					Join leading companies using Helios to reduce costs and environmental impact
				</div>
				<div
					style={{
						fontSize: '36px',
						color: '#fbbf24',
						fontWeight: '600',
						background: '#1e293b',
						padding: '20px 40px',
						borderRadius: '12px',
						border: '2px solid #fbbf24',
					}}
				>
					heliosnrg.xyz
				</div>
			</div>
		</AbsoluteFill>
	);
};
