export interface ICategoriesDialog {
  nb_vehicles?: number;
  category_code: string;
}

export interface IFixedPrice extends ICategoriesDialog {
  price: number;
}

export interface IKmPrice extends ICategoriesDialog {
  km: {
    threshold: number;
    base_price: number;
    unit_price: number;
    min_price: number;
  };
}

export interface IRangePrice extends ICategoriesDialog {
  range: {
    min: number;
    max: number;
    price: number;
  };
}
