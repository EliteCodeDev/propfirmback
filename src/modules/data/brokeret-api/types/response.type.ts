// list open positions
// {
//   "success": true,
//   "message": "Retrieved 1 positions for user 90009096752",
//   "data": {
//     "login": 90009096752,
//     "positions": [
//       {
//         "ticket": 6441583,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price_open": 3302.06,
//         "price_current": 3375.91,
//         "price_sl": 0,
//         "price_tp": 0,
//         "profit": 738.5,
//         "commission": 0,
//         "swap": 0,
//         "time_create": "2025-07-28 18:59:52",
//         "time_update": "2025-07-28 18:59:52",
//         "comment": ""
//       }
//     ],
//     "summary": {
//       "total_positions": 1,
//       "total_profit": 738.5,
//       "total_volume": 0.1
//     }
//   },
//   "total_count": 1,
//   "timestamp": null
// }

//deals/user/{login}
// {
//   "success": true,
//   "message": "Retrieved 6 deals for user 90009096752",
//   "data": {
//     "login": 90009096752,
//     "deals": [
//       {
//         "ticket": 6652002,
//         "order": 6441583,
//         "position_id": 6441583,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3302.06,
//         "profit": 0,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-28 18:59:52",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       },
//       {
//         "ticket": 6571362,
//         "order": 6627325,
//         "position_id": 6550754,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3385.5,
//         "profit": 3.9,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-24 08:47:25",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       },
//       {
//         "ticket": 6571361,
//         "order": 6627324,
//         "position_id": 6550755,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3385.41,
//         "profit": 4.9,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-24 08:47:21",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       },
//       {
//         "ticket": 6571359,
//         "order": 6627322,
//         "position_id": 6553212,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3385.23,
//         "profit": 55.1,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-24 08:47:07",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       },
//       {
//         "ticket": 6571357,
//         "order": 6627320,
//         "position_id": 6553217,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3385.24,
//         "profit": 56.5,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-24 08:47:04",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       },
//       {
//         "ticket": 6571355,
//         "order": 6627318,
//         "position_id": 6556661,
//         "login": 90009096752,
//         "symbol": "XAUUSD.k",
//         "action": 0,
//         "action_name": "BUY",
//         "volume": 0.1,
//         "price": 3385.26,
//         "profit": 120.7,
//         "commission": 0,
//         "swap": 0,
//         "time": "2025-07-24 08:47:00",
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase1",
//         "email": ""
//       }
//     ],
//     "summary": {
//       "total_deals": 6,
//       "total_profit": 241.1,
//       "total_volume": 0.6,
//       "total_commission": 0,
//       "total_swap": 0,
//       "net_profit": 241.1,
//       "date_from": "2025-07-24T00:00:00",
//       "date_to": "2025-08-26T00:00:00"
//     }
//   },
//   "total_count": 6,
//   "timestamp": null
// }

//listAllClosedWithinRisk
// {
//   "success": true,
//   "message": "Found 664 positions closed within the period",
//   "data": {
//     "positions": [
//       {
//         "position_id": 77937247,
//         "login": 90009091736,
//         "symbol": "EURUSD.k",
//         "action": "BUY",
//         "volume": 0.5,
//         "price_open": 1.16934,
//         "price_close": 1.16948,
//         "time_open": "2025-08-25 16:49:20",
//         "time_close": "2025-08-25 19:54:16",
//         "duration_seconds": 11096,
//         "profit": 7,
//         "commission": 0,
//         "swap": 0,
//         "net_profit": 7,
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase2",
//         "email": ""
//       },
//       {
//         "position_id": 77937139,
//         "login": 90009094448,
//         "symbol": "EURUSD.k",
//         "action": "BUY",
//         "volume": 0.5,
//         "price_open": 1.16933,
//         "price_close": 1.16943,
//         "time_open": "2025-08-25 16:49:16",
//         "time_close": "2025-08-25 19:54:09",
//         "duration_seconds": 11093,
//         "profit": 5,
//         "commission": 0,
//         "swap": 0,
//         "net_profit": 5,
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase2",
//         "email": ""
//       },
//       {
//         "position_id": 78151404,
//         "login": 90009101295,
//         "symbol": "NAS100.k",
//         "action": "BUY",
//         "volume": 3,
//         "price_open": 23483.2,
//         "price_close": 23509.6,
//         "time_open": "2025-08-25 19:04:54",
//         "time_close": "2025-08-25 19:49:33",
//         "duration_seconds": 2679,
//         "profit": 7920,
//         "commission": 0,
//         "swap": 0,
//         "net_profit": 7920,
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase2",
//         "email": "ourhouse137@gmail.com"
//       },
//       {
//         "position_id": 78180061,
//         "login": 90009101507,
//         "symbol": "US30.k",
//         "action": "SELL",
//         "volume": 1,
//         "price_open": 45450,
//         "price_close": 45447,
//         "time_open": "2025-08-25 19:21:15",
//         "time_close": "2025-08-25 19:22:36",
//         "duration_seconds": 81,
//         "profit": 15,
//         "commission": 0,
//         "swap": 0,
//         "net_profit": 15,
//         "comment": "",
//         "group": "contest\\PG\\kbst\\contestphase2",
//         "email": "bwa444mike@icloud.com"
//       }
//     ],
//     "summary": {
//       "total_positions": 664,
//       "total_profit": 64306.11,
//       "total_volume": 1346.56,
//       "total_commission": 0,
//       "total_swap": 0,
//       "net_profit": 64306.11,
//       "date_from": "2025-07-26T00:00:00",
//       "date_to": "2025-08-26T00:00:00",
//       "filters": {
//         "symbol": null,
//         "include_demo": true
//       }
//     }
//   },
//   "total_count": 664,
//   "timestamp": null
// }

// listUserOrders (como tal no es la ruta requerida)

// statsUser

// === Tipos de respuesta para Brokeret API ===

// Respuesta para listOpenPositions
export interface OpenPositionsResponse {
  success: boolean;
  message: string;
  data: {
    login: number;
    positions: {
      ticket: number;
      login: number;
      symbol: string;
      action: number;
      action_name: string;
      volume: number;
      price_open: number;
      price_current: number;
      price_sl: number;
      price_tp: number;
      profit: number;
      commission: number;
      swap: number;
      time_create: string;
      time_update: string;
      comment: string;
    }[];
    summary: {
      total_positions: number;
      total_profit: number;
      total_volume: number;
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta para listClosedPositions (deals/user/{login}) - Transformada en posiciones cerradas
export interface ClosedPositionsResponse {
  success: boolean;
  message: string;
  data: {
    login: number;
    deals: {
      ticket: number;
      order: number;
      position_id: number;
      login: number;
      symbol: string;
      action: string;
      action_name: string;
      volume: number;
      price_open: number;
      price_close: number;
      time_open: string;
      time_close: string;
      duration_seconds: number;
      profit: number;
      commission: number;
      swap: number;
      net_profit: number;
      comment: string;
      group: string;
      email: string;
    }[];
    summary: {
      total_deals: number;
      total_profit: number;
      total_volume: number;
      total_commission: number;
      total_swap: number;
      net_profit: number;
      date_from: string;
      date_to: string;
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta para listAllClosedWithinRisk
export interface ClosedWithinRiskResponse {
  success: boolean;
  message: string;
  data: {
    positions: {
      position_id: number;
      login: number;
      symbol: string;
      action: string;
      volume: number;
      price_open: number;
      price_close: number;
      time_open: string;
      time_close: string;
      duration_seconds: number;
      profit: number;
      commission: number;
      swap: number;
      net_profit: number;
      comment: string;
      group: string;
      email: string;
    }[];
    summary: {
      total_positions: number;
      total_profit: number;
      total_volume: number;
      total_commission: number;
      total_swap: number;
      net_profit: number;
      date_from: string;
      date_to: string;
      filters: {
        symbol: string | null;
        include_demo: boolean;
      };
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta genérica para operaciones de Brokeret
export interface BrokeretUserResponse {
  success?: boolean;
  result?: any;
  [k: string]: any;
}

// Respuesta para getCriticalUsersByMargin
export interface CriticalUsersByMarginResponse {
  success: boolean;
  message: string;
  data: {
    users: {
      login: number;
      name: string;
      email: string;
      margin_level: number;
      equity: number;
      balance: number;
      margin: number;
      free_margin: number;
      group: string;
    }[];
    summary: {
      total_users: number;
      threshold: number;
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta para getUsersByDrawdown
export interface UsersByDrawdownResponse {
  success: boolean;
  message: string;
  data: {
    users: {
      login: number;
      name: string;
      email: string;
      drawdown_percentage: number;
      initial_balance: number;
      current_balance: number;
      max_drawdown: number;
      group: string;
    }[];
    summary: {
      total_users: number;
      min_drawdown: number;
      period_days: number;
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta para listPositionsAtRisk
export interface PositionsAtRiskResponse {
  success: boolean;
  message: string;
  data: {
    positions: {
      ticket: number;
      login: number;
      symbol: string;
      action: string;
      volume: number;
      price_open: number;
      price_current: number;
      profit: number;
      margin_level: number;
      loss_percentage: number;
      group: string;
      email: string;
    }[];
    summary: {
      total_positions: number;
      margin_threshold: number;
      loss_threshold: number;
    };
  };
  total_count: number;
  timestamp: string | null;
}

// Respuesta para statsProp
// export interface StatsPropResponse {
//   success: boolean;
//   message: string;
//   data: {
//     logins: (string | number)[];
//     model: string;
//     statistics: {
//       [login: string]: {
//         balance: number;
//         equity: number;
//         profit: number;
//         margin: number;
//         free_margin: number;
//         margin_level: number;
//         total_trades: number;
//         winning_trades: number;
//         losing_trades: number;
//         win_rate: number;
//         profit_factor: number;
//         max_drawdown: number;
//         current_drawdown: number;
//       };
//     };
//     summary: {
//       total_accounts: number;
//       total_profit: number;
//       average_profit: number;
//       total_trades: number;
//       overall_win_rate: number;
//     };
//   };
//   timestamp: string | null;
// }

// Respuesta para trading/analytics/profitability
export interface ProfitabilityAnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    days: number;
    profitability_metrics: {
      total_trades: number;
      winning_trades: number;
      losing_trades: number;
      win_rate: number;
      profit_factor: string | number;
      total_profit: number;
      total_loss: number;
      net_profit: number;
      average_win: number;
      average_loss: number;
      expectancy: number;
      total_volume: number;
    };
    symbol_performance: {
      symbol: string;
      profit: number;
      trades: number;
      avg_profit: number;
    }[];
    daily_profit_chart: {
      date: string;
      profit: number;
    }[];
    filters: {
      login: number;
      symbol: string | null;
      group: string | null;
    };
  };
  total_count: number | null;
  timestamp: string | null;
}

// Respuesta para users/{login} (nueva estructura GET)
export interface UserDetailsResponse {
  success: boolean;
  message: string;
  data: {
    login: number;
    group: string;
    name: string;
    email: string;
    phone: string;
    enable: number;
    leverage: number;
    balance: number;
    credit: number;
    margin: number;
    margin_free: number;
    margin_level: number;
    equity: number;
    floating_pl: number;
    registration: string;
    last_access: string;
    last_ip: string;
    status: string;
    open_positions: number;
    pending_orders: number;
  };
  total_count: number | null;
  timestamp: string | null;
}

// === Tipos de respuesta para Fazo API ===

// Respuesta del endpoint de autenticación
export interface TokenResponse {
  message: string;
  token: string;
}

// Respuesta del endpoint de creación de cuenta
export interface CreateAccountResponse {
  message: string;
  user: {
    id: number;
    accountid: number;
    type: number;
    platform: number;
    server: string | null;
    groupName: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    balance: number;
    mPassword: string;
    iPassword: string;
    leverage: number;
  };
}

//users/{login}

// {
//   "success": true,
//   "message": "User details retrieved successfully",
//   "data": {
//     "login": 90009096752,
//     "group": "contest\\PG\\kbst\\contestphase1",
//     "name": "Takayla Harris ",
//     "email": "",
//     "phone": "",
//     "enable": 1,
//     "leverage": 33,
//     "balance": 9399.94,
//     "credit": 0,
//     "margin": 1000624.24,
//     "margin_free": -990337.6,
//     "margin_level": 1.03,
//     "equity": 10286.64,
//     "floating_pl": 886.7,
//     "registration": "2025-07-16 04:36:24",
//     "last_access": "2025-07-24 15:05:02",
//     "last_ip": "24.199.213.102",
//     "status": "Active",
//     "open_positions": 1,
//     "pending_orders": 0
//   },
//   "total_count": null,
//   "timestamp": null
// }
