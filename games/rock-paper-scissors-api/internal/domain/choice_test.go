package domain

import (
	"testing"

	"github.com/dominoes/rock-paper-scissors-api/internal/exception"
)

func TestParseChoiceValid(t *testing.T) {
	for _, raw := range []string{"rock", "paper", "scissors"} {
		choice, err := ParseChoice(raw)
		if err != nil {
			t.Fatalf("ParseChoice(%q) unexpected error: %v", raw, err)
		}
		if choice.String() != raw {
			t.Fatalf("ParseChoice(%q) = %q", raw, choice)
		}
	}
}

func TestParseChoiceInvalid(t *testing.T) {
	_, err := ParseChoice("lizard")
	if err == nil {
		t.Fatal("expected error for invalid choice")
	}
	if _, ok := err.(*exception.InvalidChoiceError); !ok {
		t.Fatalf("expected InvalidChoiceError, got %T", err)
	}
}

func TestResolveRoundAllPairs(t *testing.T) {
	tests := []struct {
		first, second Choice
		want          RoundOutcome
	}{
		{ChoiceRock, ChoiceRock, OutcomeDraw},
		{ChoiceRock, ChoicePaper, OutcomeSecondWins},
		{ChoiceRock, ChoiceScissors, OutcomeFirstWins},
		{ChoicePaper, ChoiceRock, OutcomeFirstWins},
		{ChoicePaper, ChoicePaper, OutcomeDraw},
		{ChoicePaper, ChoiceScissors, OutcomeSecondWins},
		{ChoiceScissors, ChoiceRock, OutcomeSecondWins},
		{ChoiceScissors, ChoicePaper, OutcomeFirstWins},
		{ChoiceScissors, ChoiceScissors, OutcomeDraw},
	}

	for _, tt := range tests {
		got := ResolveRound(tt.first, tt.second)
		if got != tt.want {
			t.Errorf("ResolveRound(%s, %s) = %v, want %v", tt.first, tt.second, got, tt.want)
		}
	}
}

func TestBeats(t *testing.T) {
	if !Beats(ChoiceRock, ChoiceScissors) {
		t.Error("rock should beat scissors")
	}
	if Beats(ChoiceRock, ChoicePaper) {
		t.Error("rock should not beat paper")
	}
	if Beats(ChoiceRock, ChoiceRock) {
		t.Error("rock should not beat rock")
	}
}
