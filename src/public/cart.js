const obtenerIdCarrito = async () => {
  try {
    const response = await fetch("/api/carts/usuario/carrito", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Error buscando el id del carrito");
      return null;
    }
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.log("Error buscando el id del carrito", error);
    return null;
  }
};

const agregarProductoAlCarrito = async (pid) => {
  try {
    const cid = await obtenerIdCarrito();
    if (!cid) {
      console.error("Id del carrito invalido.");
      return;
    }
    const response = await fetch(`/api/carts/${cid}/products/${pid}`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
    }).then((response) => {
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Producto agregado",
          text: `Checkear el carrito`,
        });
        return res.json();
      } else {
        throw new Error("Error");
      }
    });
    if (!response.ok) {
      console.log("Error agregando el producto al carrito");
      return;
    }
    console.log("Producto agregado al carrito");
  } catch (error) {
    console.log("Error agregando el producto al carrito" + error);
  }
};

async function realizarCompra() {
  try {
    const cid = await obtenerIdCarrito();
    if (!cid) {
      console.error("Carrito no encontrado");
      return;
    }
    const response = await fetch(`/api/carts/${cid}/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Compra completada",
            text: "Revise su mail para los detalles de la compra",
          });
          return res.json();
        } else {
          throw new Error("Error comprando el carrito.");
        }
      })
      .then((data) => {
        console.log(data);
        const ticketCode = data.ticket._id;
        window.location.href = `/tickets/${ticketCode}`;
      });
    if (!response.ok) {
      console.error("Error haciendo la compra");
      return;
    }
    console.log("Compra completada");
  } catch (error) {
    console.error("Error haciendo la compra", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const cartButton = document.getElementById("cartButton");
  if (cartButton) {
    cartButton.addEventListener("click", async () => {
      try {
        const cid = await obtenerIdCarrito();
        if (cid) {
          window.location.assign(`/carts/`);
        } else {
          console.error("Id del carrito invalido");
        }
      } catch (error) {
        console.error("Error buscando el id del carrito: " + error);
      }
      e.preventDefault();
    });
  }
});
