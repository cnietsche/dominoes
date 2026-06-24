package exception

type LobbyFullError struct{}

func (e *LobbyFullError) Error() string { return "O lobby está cheio." }

type GameInProgressError struct{}

func (e *GameInProgressError) Error() string { return "A partida já está em andamento." }

type GameAlreadyInProgressError struct{}

func (e *GameAlreadyInProgressError) Error() string { return "A partida já foi iniciada." }

type GameNotInProgressError struct{}

func (e *GameNotInProgressError) Error() string { return "Não há partida em andamento." }

type NotYourTurnError struct{}

func (e *NotYourTurnError) Error() string { return "Não é a sua vez de jogar." }

type PieceNotInHandError struct{}

func (e *PieceNotInHandError) Error() string { return "Você não possui essa peça na mão." }

type PieceDoesNotMatchError struct{}

func (e *PieceDoesNotMatchError) Error() string { return "A peça não encaixa nesta extremidade." }

type AlreadyDrawnThisTurnError struct{}

func (e *AlreadyDrawnThisTurnError) Error() string { return "Você já comprou uma peça neste turno." }

type HasPlayablePieceError struct{}

func (e *HasPlayablePieceError) Error() string { return "Você possui peças jogáveis e deve jogar." }

type BoneyardEmptyError struct{}

func (e *BoneyardEmptyError) Error() string { return "Não há mais peças no monte." }
