export enum ChallengeStatus {
  INNITIAL = 'initial', //por iniciar
  IN_PROGRESS = 'progress', //en progreso
  APPROVABLE = 'approvable', //por aprobar
  APPROVED = 'approved', //aprobado
  DISAPPROVABLE = 'disapprovable', //por desaprobar
  DISAPPROVED = 'disapproved', //desaprobado

  WITHDRAWABLE = 'withdrawable', //por retirar
  WITHDRAWN = 'withdrawn', //retirado
  CANCELLED = 'cancelled', //retiro cancelado
}
