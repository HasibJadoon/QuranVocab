export interface IAxis {
  p: string;
  ro?: boolean;
  s?: Array<string | IAxis>;
  r?: any;
  pr?: Array<string>;
  c?: any;
}

export interface ModelGroup<T> {
  _id: { [prop: string]: any };
  dimensions: Array<IAxis>;
  count?: number;
  children?: Array<ModelGroup<T>>;
  elements?: Array<Partial<T>>;
  open?: boolean;
  distribution?: { [key: string]: Array<Partial<T>> };
  parent?: ModelGroup<T>;

  totalPages?: number;
  page?: number;
  pageElements?: Array<Partial<T>>;
}
