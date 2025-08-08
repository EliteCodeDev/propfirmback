
export interface UserData {
    Balance: string;
    User:    string;
    Server:  string;
    Login:   string;
}

export interface PositionOpened {
    Symbol:     string;
    Time:       string;
    Type:       string;
    Volume:     string;
    OpenPrice:  string;
    SL:         string;
    TP:         string;
    ClosePrice: string;
    Swap:       string;
    Profit:     string;
    Comment:    string;
}

export interface ResumenDataPositionsOpened {
    Balance:    string;
    Equity:     string;
    Margin:     string;
    FreeMargin: string;
    Level:      string;
    Profit:     string;
    Comment:    string;
}

export interface DataOpenPositions {
    success:     boolean;
    data:        PositionOpened[];
    resumenData: ResumenDataPositionsOpened;
}


export interface PositionClosed {
    time_enter:   string;
    ticket:       string;
    typePosition: string;
    volumen:      number;
    symbol:       string;
    price:        number;
    sl:           number;
    tp:           number;
    time_exit:    string;
    comission:    number;
    tasa:         number;
    profit:       number;
    swap:         number;
    comentary:    string;
}



export interface ResumenDataPositionsClosed {
    Benefit:    string;
    credit:     string;
    recharge:   string;
    withdraw:   string;
    Balance:    string;
    Commission: string;
    Rate:       string;
    Swap:       string;
}

export interface DataClosePositions {
    positions:   PositionClosed[];
    resumenData: ResumenDataPositionsClosed;
}