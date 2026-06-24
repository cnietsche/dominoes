package domain

import (
	"fmt"
	"strconv"
	"strings"
)

type PieceEnum string

const (
	PieceZeroZero   PieceEnum = "0-0"
	PieceZeroOne    PieceEnum = "0-1"
	PieceOneOne     PieceEnum = "1-1"
	PieceZeroTwo    PieceEnum = "0-2"
	PieceOneTwo     PieceEnum = "1-2"
	PieceTwoTwo     PieceEnum = "2-2"
	PieceZeroThree  PieceEnum = "0-3"
	PieceOneThree   PieceEnum = "1-3"
	PieceTwoThree   PieceEnum = "2-3"
	PieceThreeThree PieceEnum = "3-3"
	PieceZeroFour   PieceEnum = "0-4"
	PieceOneFour    PieceEnum = "1-4"
	PieceTwoFour    PieceEnum = "2-4"
	PieceThreeFour  PieceEnum = "3-4"
	PieceFourFour   PieceEnum = "4-4"
	PieceZeroFive   PieceEnum = "0-5"
	PieceOneFive    PieceEnum = "1-5"
	PieceTwoFive    PieceEnum = "2-5"
	PieceThreeFive  PieceEnum = "3-5"
	PieceFourFive   PieceEnum = "4-5"
	PieceFiveFive   PieceEnum = "5-5"
	PieceZeroSix    PieceEnum = "0-6"
	PieceOneSix     PieceEnum = "1-6"
	PieceTwoSix     PieceEnum = "2-6"
	PieceThreeSix   PieceEnum = "3-6"
	PieceFourSix    PieceEnum = "4-6"
	PieceFiveSix    PieceEnum = "5-6"
	PieceSixSix     PieceEnum = "6-6"
)

var DoublesByPriority = []PieceEnum{
	PieceSixSix, PieceFiveFive, PieceFourFour, PieceThreeThree,
	PieceTwoTwo, PieceOneOne, PieceZeroZero,
}

var pieceByCode map[string]PieceEnum

func init() {
	pieceByCode = make(map[string]PieceEnum)
	for _, p := range FullSet() {
		pieceByCode[string(p)] = p
	}
}

func FullSet() []PieceEnum {
	return []PieceEnum{
		PieceZeroZero, PieceZeroOne, PieceOneOne, PieceZeroTwo, PieceOneTwo, PieceTwoTwo,
		PieceZeroThree, PieceOneThree, PieceTwoThree, PieceThreeThree,
		PieceZeroFour, PieceOneFour, PieceTwoFour, PieceThreeFour, PieceFourFour,
		PieceZeroFive, PieceOneFive, PieceTwoFive, PieceThreeFive, PieceFourFive, PieceFiveFive,
		PieceZeroSix, PieceOneSix, PieceTwoSix, PieceThreeSix, PieceFourSix, PieceFiveSix, PieceSixSix,
	}
}

func (p PieceEnum) Code() string {
	return string(p)
}

func PieceEnumFromCode(code string) (PieceEnum, error) {
	piece, ok := pieceByCode[code]
	if !ok {
		return "", fmt.Errorf("unknown piece code: %s", code)
	}
	return piece, nil
}

func (p PieceEnum) IsDouble() bool {
	parts := strings.Split(string(p), "-")
	return parts[0] == parts[1]
}

func (p PieceEnum) LeftPip() int {
	return pipAt(p, 0)
}

func (p PieceEnum) RightPip() int {
	return pipAt(p, 1)
}

func pipAt(p PieceEnum, index int) int {
	parts := strings.Split(string(p), "-")
	v, _ := strconv.Atoi(parts[index])
	return v
}

func (p PieceEnum) MatchesPip(value int) bool {
	return p.LeftPip() == value || p.RightPip() == value
}
