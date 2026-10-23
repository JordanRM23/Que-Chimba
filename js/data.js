/* ============================================
   QUÉ CHIMBA — Datos del menú (configuración)
   Edit here to change products, prices, images
   ============================================ */

const IMG = {
  burger:  'https://kimi-web-img.kimi.ai/img/basilandbubbly.com/071f62bed40973ad9c2c0dfd22a111813b0ab467.jpg',
  burger2: 'https://kimi-web-img.kimi.ai/img/northeastnosh.com/00c947f48ddd3c0d2ab7de49cc362e63103dd0a7.jpg',
  fries:   'https://kimi-web-img.kimi.ai/img/www.lovebakesgoodcakes.com/fd9c40ad152facd3bed99159c27b20cc2bf8c79f.jpg',
  fries2:  'https://kimi-web-img.kimi.ai/img/plowingthroughlife.com/265549d2a5669d84a5c895d95127fef0a9219e5e.jpg',
  fries3:  'https://kimi-web-img.kimi.ai/img/www.allrecipes.com/65edbc6a7e33ef258451d916127b4ad02e2ff3cb.jpg',
  hotdog:  'https://kimi-web-img.kimi.ai/img/www.mycolombianrecipes.com/77af35b9101e05c0c211aa977fcaee281bf831a5.jpg',
  hotdog2: 'https://kimi-web-img.kimi.ai/img/www.mycolombianrecipes.com/19c6facd414deea343b3972b1336a63f0618caa0.jpg'
};

/* Productos iniciales (se guardan en localStorage la primera vez) */
const DEFAULT_PRODUCTS = [
  {id:1,  cat:'Smash Burgers', name:'Consentida',  desc:'Pan de papa, carne smash, salsa relish, cheddar, salsa ahumada, pepinillos.', price:4.75,
    opts:{label:'Tamaño', values:{'Clásica':4.75, 'Especial':5.75, 'Doble':7.00}}, img:IMG.burger},
  {id:2,  cat:'Smash Burgers', name:'Bendita BBQ', desc:'Pan de papa, carne smash, salsa BBQ, tocino crispy, cheddar, cebolla caramelizada.', price:6.50,
    opts:{label:'Tamaño', values:{'Clásica':6.50, 'Doble':7.75}}, img:IMG.burger2},
  {id:3,  cat:'Smash Burgers', name:'Criolla',     desc:'Pan brioche, carne smash, cebolla crispy, doble cheddar, pico de gallo, guacamole.', price:6.25,
    opts:{label:'Tamaño', values:{'Clásica':6.25, 'Doble':7.50}}, img:IMG.burger},
  {id:4,  cat:'Smash Burgers', name:'Melosa',      desc:'Doble carne smash, cheddar, tocino, cebolla caramelizada, salsa de tocino con piña.', price:8.00, img:IMG.burger2},
  {id:5,  cat:'Smash Burgers', name:'Coqueta',     desc:'Salsa ranch, carne smash, doble cheddar, aros de cebolla crispy, mermelada de tocino.', price:6.75, img:IMG.burger},

  {id:6,  cat:'Papas', name:'Solterona',           desc:'Papas fritas, chorizo, huevos de codorniz, cheddar, salsas de la casa.', price:3.50, img:IMG.fries},
  {id:7,  cat:'Papas', name:'Parchadita',          desc:'Papas, pollo panko crispy, chorizo, huevos de codorniz, cheddar, salsas de la casa.', price:7.00, img:IMG.fries2},
  {id:8,  cat:'Papas', name:'Que Pecado',          desc:'Chorizo, pollo, cerdo y res en salsa BBQ, queso derretido, tocino, jamón, huevos de codorniz.', price:10.00, img:IMG.fries2},
  {id:9,  cat:'Papas', name:'Papas Cheddar & Tocino', desc:'Papas fritas con extra queso cheddar y tocino crispy.', price:3.50, img:IMG.fries3},

  {id:10, cat:'Hot Dogs', name:'El Chiro',         desc:'Pan de papa, chorizo, cebolla, papitas trituradas.', price:3.00, img:IMG.hotdog},
  {id:11, cat:'Hot Dogs', name:'Piñita Paisa',     desc:'Pan mozzarella, chorizo, cheddar, tocino crispy, salsa de piña con tocino, huevo de codorniz.', price:4.00, img:IMG.hotdog2},

  {id:12, cat:'Bebidas', name:'Gaseosa',   desc:'Coca-Cola, Sprite, Fanta… bien frías.', price:0.75, img:IMG.fries3},
  {id:13, cat:'Bebidas', name:'Fuze Tea',  desc:'Té frío sabor durazno o limón.',        price:0.75, img:IMG.fries3},
  {id:14, cat:'Bebidas', name:'Guitig',    desc:'Agua mineral con gas.',                 price:0.75, img:IMG.fries3},
  {id:15, cat:'Bebidas', name:'Agua',      desc:'Agua pura.',                            price:0.75, img:IMG.fries3},
  {id:16, cat:'Bebidas', name:'Horchata',  desc:'Bebida natural de la casa.',            price:0.75, img:IMG.fries3},
  {id:17, cat:'Bebidas', name:'Jamaica',   desc:'Bebida natural de la casa.',            price:0.75, img:IMG.fries3},

  {id:18, cat:'Extras', name:'Honey Mustard',        desc:'Salsa extra.',      price:0.35, img:IMG.fries3},
  {id:19, cat:'Extras', name:'Leña Ahumada',         desc:'Salsa extra.',      price:0.40, img:IMG.fries3},
  {id:20, cat:'Extras', name:'Big Taste (picante)',  desc:'Salsa extra picante.', price:0.40, img:IMG.fries3},
  {id:21, cat:'Extras', name:'Salsa Piña',           desc:'Salsa extra.',      price:0.50, img:IMG.fries3},
  {id:22, cat:'Extras', name:'Salsa Cheddar',        desc:'Salsa extra.',      price:0.50, img:IMG.fries3},
  {id:23, cat:'Extras', name:'Pepinillos',           desc:'Porción extra.',    price:0.50, img:IMG.fries3},
  {id:24, cat:'Extras', name:'Tocino',               desc:'Porción extra.',    price:1.00, img:IMG.fries3},
  {id:25, cat:'Extras', name:'Queso',                desc:'Porción extra.',    price:0.50, img:IMG.fries3},
  {id:26, cat:'Extras', name:'Cambio de pan',        desc:'Pan brioche o mozzarella.', price:0.50, img:IMG.fries3}
];

/* Recargos */
const COMBO = 1.75;        // combo papas + bebida (burgers / hot dogs)
const DELIVERY_FEE = 1.50; // costo de domicilio
