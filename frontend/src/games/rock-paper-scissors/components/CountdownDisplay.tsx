interface CountdownDisplayProps {
  seconds: number;
}

export function CountdownDisplay({ seconds }: CountdownDisplayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="text-8xl font-bold text-white drop-shadow-lg sm:text-9xl">
        {seconds}
      </span>
    </div>
  );
}
