package domain

import "fmt"

type TableSide string

const (
	TableSideLeft  TableSide = "LEFT"
	TableSideRight TableSide = "RIGHT"
)

func TableSideFromString(s string) (TableSide, error) {
	switch TableSide(s) {
	case TableSideLeft, TableSideRight:
		return TableSide(s), nil
	default:
		return "", fmt.Errorf("invalid table side: %s", s)
	}
}
