package exception

type LobbyFullError struct{}

func (e *LobbyFullError) Error() string { return "The lobby is full." }

type GameInProgressError struct{}

func (e *GameInProgressError) Error() string { return "A game is already in progress." }

type GameAlreadyInProgressError struct{}

func (e *GameAlreadyInProgressError) Error() string { return "The game has already started." }

type GameNotInProgressError struct{}

func (e *GameNotInProgressError) Error() string { return "There is no game in progress." }

type WinnerPendingError struct{}

func (e *WinnerPendingError) Error() string {
	return "Waiting for all players to confirm the result."
}

type InvalidChoiceError struct{}

func (e *InvalidChoiceError) Error() string { return "Invalid choice." }
