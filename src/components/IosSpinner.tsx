interface IosSpinnerProps {
    size?: number;
    color?: string;
}

function IosSpinner({ size = 252, color = '#2563eb' }: IosSpinnerProps) {
    const lines = 12;
    const cx = size / 2;
    const r1 = size * 0.25;
    const r2 = size * 0.393;
    const sw = size * 0.079;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {Array.from({ length: lines }).map((_, i) => {
                const angle   = (i / lines) * 360;
                const opacity = (i + 1) / lines;
                const rad     = (angle * Math.PI) / 180;
                const x1 = cx + r1 * Math.sin(rad);
                const y1 = cx - r1 * Math.cos(rad);
                const x2 = cx + r2 * Math.sin(rad);
                const y2 = cx - r2 * Math.cos(rad);
                return (
                    <line
                        key={i}
                        x1={x1} y1={y1}
                        x2={x2} y2={y2}
                        stroke={color}
                        strokeWidth={sw}
                        strokeLinecap="round"
                        opacity={opacity}
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={`0 ${cx} ${cx}`}
                            to={`360 ${cx} ${cx}`}
                            dur="0.9s"
                            begin={`-${((lines - i - 1) / lines * 0.9).toFixed(3)}s`}
                            repeatCount="indefinite"
                        />
                    </line>
                );
            })}
        </svg>
    );
}

export default IosSpinner;