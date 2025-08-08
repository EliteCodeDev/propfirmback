

export interface UserData {
    Balance: string;
    User:    string;
    Server:  string;
    Login:   string;
}

export interface PositionClose {
    Orden:      string;
    Time:       string;
    Type:       string;
    Volume:     string;
    Symbol:     string;
    OpenPrice:  string;
    SL:         string;
    TP:         string;
    ClosePrice: string;
    Swap:       string;
    Benefit:    string;
}

export interface ResumenDataPositionsClosed {
    BenefitLose:  string;
    Credit:       string;
    Deposit:      string;
    Withdrawal:   string;
    TotalBenefit: string;
}

export interface DataClosePositions {
    positions:   PositionClose[];
    resumenData: ResumenDataPositionsClosed;
}

export interface ResumenDataPositionsOpened {
    Balance:    string;
    Comentary:  string;
    Equidad:    string;
    MarginFree: string;
    Benefit:    string;
}

export interface OpenPositions {
    Balance: string;
    Commentary: string;
    Equity: string;
    Margin?: string;           // Solo en el caso else
    FreeMargin: string;
    MarginLevel?: string;      // Solo en el caso else
    TotalProfit: string;
}

export interface DataOpenPositions {
    success:     boolean;
    data:        OpenPositions[];
    resumenData: ResumenDataPositionsOpened;
}



