package exception

type LobbyFullError struct{}

func (e *LobbyFullError) Error() string { return "The lobby is full." }

type GameInProgressError struct{}

func (e *GameInProgressError) Error() string { return "A game is already in progress." }

type GameAlreadyInProgressError struct{}

func (e *GameAlreadyInProgressError) Error() string { return "The game has already started." }

type GameNotInProgressError struct{}

func (e *GameNotInProgressError) Error() string { return "There is no game in progress." }

type NotYourTurnError struct{}

func (e *NotYourTurnError) Error() string { return "It is not your turn." }

type PieceNotInHandError struct{}

func (e *PieceNotInHandError) Error() string { return "You do not have that piece in your hand." }

type PieceDoesNotMatchError struct{}

func (e *PieceDoesNotMatchError) Error() string { return "That piece does not match this end." }

type AlreadyDrawnThisTurnError struct{}

func (e *AlreadyDrawnThisTurnError) Error() string { return "You already drew a piece this turn." }

type HasPlayablePieceError struct{}

func (e *HasPlayablePieceError) Error() string { return "You have playable pieces and must play one." }

type BoneyardEmptyError struct{}

func (e *BoneyardEmptyError) Error() string { return "There are no pieces left in the boneyard." }

type WinnerPendingError struct{}

func (e *WinnerPendingError) Error() string {
	return "Waiting for all players to confirm the result."
}
