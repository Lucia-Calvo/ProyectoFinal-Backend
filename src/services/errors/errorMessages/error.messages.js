export const updateQuantityInCartError = (cart, productId) => {
  return `Una o varias propiedades fueron enviadas incompletas o son invalidas.
            Propiedades requeridas:
            * ID de carrito: type String, recibido: ${cart}
            * ID de producto: type String, recibido: ${productId}`;
};

export const createProductError = (product) => {
  return `Una o varias propiedades fueron enviadas incompletas o son invalidas.
            Propiedades requeridas: 
            * title: type String, recibido: ${product.title}
            * description: type String, recibido: ${product.description}
            * code: type String, recibido: ${product.code}
            * price: type String, recibido: ${product.price}
            * stock: type String, recibido: ${product.stock}
            * category: type String, recibido: ${product.category}`;
};

export class generateError {
  static getId(id) {
    return `Invalid ${id} ID `;
  }
  static idNorFound() {
    return "ID doesnt exist";
  }
  static getEmptyDB() {
    return "Data: {}";
  }
  static unauthorized() {
    return "User unauthorized";
  }
  static DBNotChanged() {
    return "Data base didnt change";
  }
}
