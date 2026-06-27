package exception

type LobbyFullError struct{}

func (e *LobbyFullError) Error() string { return "The lobby is full." }

type GameInProgressError struct{}

func (e *GameInProgressError) Error() string { return "A game is already in progress." }
