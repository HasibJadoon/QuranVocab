import { ITracable } from 'projects/lib-shared/src/lib/common/models/types.model';

export interface ICategory extends ITracable {
  _id?: string;
  // Code
  code: string;
  // Description
  description: string;
  // Vehicules
  vehicles: {
    // Marque
    maker: {
      code: string;
      name: string;
    };
    // Modèle
    model: {
      code: string;
      name: string;
      shape?: {
        code: string;
        name: string;
      };
    };
  }[];
}

export interface ICategoriesGridEntry {
  category_code: string;
  category_description: string;
  brand_code: string;
  brand_label: string;
  model_code: string;
  model_label: string;
  shape_code: string;
  shape_label: string;
}

export interface ICategoriesGrid {
  // code de la grille
  code: string;
  // description
  description?: string;
  // liste des categories
  entries: ICategoriesGridEntry[];
}
