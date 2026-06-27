import type { GameChoice } from '../types/lobby';

const CHOICES: { value: GameChoice; label: string; icon: string }[] = [
  { value: 'rock', label: 'Rock', icon: '/rockPaperScissors/rock.png' },
  { value: 'paper', label: 'Paper', icon: '/rockPaperScissors/paper.png' },
  { value: 'scissors', label: 'Scissors', icon: '/rockPaperScissors/scissors.png' },
];

interface ChoiceButtonsProps {
  selectedChoice: GameChoice | null;
  disabled: boolean;
  onSelect: (choice: GameChoice) => void;
}

export function ChoiceButtons({ selectedChoice, disabled, onSelect }: ChoiceButtonsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {CHOICES.map((choice) => {
        const isSelected = selectedChoice === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(choice.value)}
            className={`flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 bg-slate-800/80 p-2 transition sm:h-28 sm:w-28 ${
              isSelected
                ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                : 'border-slate-600 hover:border-slate-400'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            aria-pressed={isSelected}
            aria-label={choice.label}
          >
            <img
              src={choice.icon}
              alt=""
              className="h-14 w-14 object-contain sm:h-16 sm:w-16"
            />
          </button>
        );
      })}
    </div>
  );
}

export function choiceIcon(choice: GameChoice): string {
  return CHOICES.find((item) => item.value === choice)?.icon ?? '';
}
