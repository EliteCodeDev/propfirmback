export class Position {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public location: string,
    public company: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
