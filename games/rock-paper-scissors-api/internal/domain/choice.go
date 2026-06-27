package domain

import (
	"fmt"

	"github.com/dominoes/rock-paper-scissors-api/internal/exception"
)

type Choice string

const (
	ChoiceRock     Choice = "rock"
	ChoicePaper    Choice = "paper"
	ChoiceScissors Choice = "scissors"
)

type RoundOutcome int

const (
	OutcomeDraw RoundOutcome = iota
	OutcomeFirstWins
	OutcomeSecondWins
)

func ParseChoice(s string) (Choice, error) {
	switch Choice(s) {
	case ChoiceRock, ChoicePaper, ChoiceScissors:
		return Choice(s), nil
	default:
		return "", &exception.InvalidChoiceError{}
	}
}

func (c Choice) String() string {
	return string(c)
}

func Beats(a, b Choice) bool {
	if a == b {
		return false
	}
	switch a {
	case ChoiceRock:
		return b == ChoiceScissors
	case ChoicePaper:
		return b == ChoiceRock
	case ChoiceScissors:
		return b == ChoicePaper
	default:
		return false
	}
}

func ResolveRound(first, second Choice) RoundOutcome {
	if first == second {
		return OutcomeDraw
	}
	if Beats(first, second) {
		return OutcomeFirstWins
	}
	return OutcomeSecondWins
}

func (o RoundOutcome) String() string {
	switch o {
	case OutcomeDraw:
		return "draw"
	case OutcomeFirstWins:
		return "first_wins"
	case OutcomeSecondWins:
		return "second_wins"
	default:
		return fmt.Sprintf("unknown(%d)", o)
	}
}
