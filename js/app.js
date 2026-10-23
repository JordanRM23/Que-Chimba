/* ============================================
   QUÉ CHIMBA — Lógica de la aplicación
   ============================================ */

const money = n => '$' + n.toFixed(2);

/* ---------- Supabase y estado ---------- */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fail(e, msg){ console.error(e); toast('⚠️ ' + (msg || 'Ocurrió un error, intenta de nuevo')); }

let products = [];
let orders  = [];
let cart    = [];
let mode    = 'local';
let activeCat = 'Smash Burgers';
let isAdmin = false;
let ordersChannel = null;

async function loadProducts(){
  const { data, error } = await sb.from('products').select('*').order('sort').order('id');
  if(error) return fail(error, 'No se pudo cargar el menú');
  products = data.map(r => ({ id:r.id, cat:r.cat, name:r.name, desc:r.description,
    price:Number(r.price), opts:r.opts, img:r.img, available:r.available, sort:r.sort }));
}

/* ---------- Hero slider ---------- */
const slides = document.querySelectorAll('.slide');
const dotsBox = document.getElementById('dots');
slides.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' active' : '');
  d.onclick = () => goSlide(i);
  dotsBox.appendChild(d);
});
let cur = 0;
function goSlide(i){
  slides[cur].classList.remove('active');
  dotsBox.children[cur].classList.remove('active');
  cur = i;
  slides[cur].classList.add('active');
  dotsBox.children[cur].classList.add('active');
}
setInterval(() => goSlide((cur + 1) % slides.length), 4500);

/* ---------- Menú ---------- */
const tabsBox = document.getElementById('tabs');
function buildTabs(){
  const cats = [...new Set(products.filter(p => p.available).map(p => p.cat))];
  if(!cats.includes(activeCat)) activeCat = cats[0] || activeCat;
  tabsBox.innerHTML = '';
  cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tab' + (c === activeCat ? ' active' : '');
    b.textContent = c;
    b.onclick = () => { activeCat = c; renderTabs(); renderGrid(); };
    tabsBox.appendChild(b);
  });
}
function refreshMenu(){ buildTabs(); renderGrid(); }
function renderTabs(){
  [...tabsBox.children].forEach(b => b.classList.toggle('active', b.textContent === activeCat));
}
function renderGrid(){
  const g = document.getElementById('grid'); g.innerHTML = '';
  products.filter(p => p.cat === activeCat && p.available).forEach(p => {
    const card = document.createElement('div'); card.className = 'card';
    let optHtml = '';
    if(p.opts){
      optHtml = `<div class="opt"><b>${p.opts.label}:</b><select id="opt-${p.id}" onchange="updPrice(${p.id})">` +
        Object.entries(p.opts.values).map(([k,v]) => `<option value="${v}">${k} — ${money(v)}</option>`).join('') +
        `</select></div>`;
    }
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.src='${IMG.burger}'">
      <div class="body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        ${p.cat === 'Smash Burgers' || p.cat === 'Hot Dogs' ? `<span class="combo">🍟 Combo + papas y bebida ${money(COMBO)}</span>` : ''}
        ${optHtml}
        <div class="price-row">
          <span class="price" id="price-${p.id}">${money(p.price)}</span>
          <button class="add" onclick="addToCart(${p.id})">Añadir ➕</button>
        </div>
      </div>`;
    g.appendChild(card);
  });
}
function updPrice(id){
  const sel = document.getElementById('opt-' + id);
  if(sel) document.getElementById('price-' + id).textContent = money(parseFloat(sel.value));
}

/* ---------- Carrito ---------- */
function toggleCart(open){ document.getElementById('drawer').classList.toggle('open', open); }
function setMode(m){
  mode = m;
  document.getElementById('mLocal').classList.toggle('active', m === 'local');
  document.getElementById('mDom').classList.toggle('active', m === 'domicilio');
  document.getElementById('addrBox').classList.toggle('show', m === 'domicilio');
  renderCart();
}
function addToCart(id){
  const p = products.find(x => x.id === id);
  let price = p.price, variant = '';
  const sel = document.getElementById('opt-' + id);
  if(sel){
    price = parseFloat(sel.value);
    variant = sel.options[sel.selectedIndex].text.split(' — ')[0];
  }
  const key = id + '|' + variant;
  const found = cart.find(i => i.key === key);
  if(found) found.qty++;
  else cart.push({key, id, name: p.name + (variant ? ' (' + variant + ')' : ''), price, qty: 1});
  toast('🍔 ' + p.name + ' añadido al carrito');
  renderCart();
}
function chQty(key, d){
  const it = cart.find(i => i.key === key);
  if(!it) return;
  it.qty += d;
  if(it.qty <= 0) cart = cart.filter(i => i.key !== key);
  renderCart();
}
function renderCart(){
  const box = document.getElementById('cartItems'); box.innerHTML = '';
  document.getElementById('cartCount').textContent = cart.reduce((s,i) => s + i.qty, 0);
  if(!cart.length){
    box.innerHTML = '<p class="empty">Tu carrito está vacío 🥲<br>¡Échale ganas, hay hamburguesas!</p>';
  }
  cart.forEach(i => {
    const row = document.createElement('div'); row.className = 'cart-item';
    row.innerHTML = `<div><b>${i.name}</b><br><small>${money(i.price)} c/u</small></div>
      <div class="qty">
        <button onclick="chQty('${i.key}',-1)">−</button><b>${i.qty}</b><button onclick="chQty('${i.key}',1)">+</button>
        <b style="margin-left:8px">${money(i.price * i.qty)}</b>
      </div>`;
    box.appendChild(row);
  });
  const sub = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const del = mode === 'domicilio' ? DELIVERY_FEE : 0;
  document.getElementById('tSub').textContent = money(sub);
  document.getElementById('delRow').style.display = del ? 'flex' : 'none';
  document.getElementById('tTotal').textContent = money(sub + del);
}
async function placeOrder(){
  if(!cart.length){ toast('El carrito está vacío'); return; }
  let customer = {name:'', tel:'', addr:''};
  if(mode === 'domicilio'){
    customer = {
      name: document.getElementById('cName').value.trim(),
      tel:  document.getElementById('cTel').value.trim(),
      addr: document.getElementById('cAddr').value.trim()
    };
    if(!customer.name || !customer.tel || !customer.addr){
      toast('⚠️ Completa nombre, teléfono y dirección'); return;
    }
  }
  const btn = document.getElementById('btnOrder'); btn.disabled = true;
  const { data, error } = await sb.rpc('create_order', {
    p_mode: mode, p_name: customer.name, p_tel: customer.tel, p_addr: customer.addr,
    p_items: cart.map(i => ({ id: i.id, variant: i.key.split('|')[1] || '', qty: i.qty }))
  });
  btn.disabled = false;
  if(error) return fail(error, 'No se pudo enviar el pedido: ' + error.message);
  document.getElementById('modalTxt').innerHTML =
    `Pedido <b>${esc(data.code)}</b> · ${money(Number(data.total))}<br>` +
    (mode === 'domicilio' ? 'Llegará pronto a tu puerta 🛵' : 'Lo llamaremos cuando esté listo 🍔') +
    `<br><small>${new Date(data.created_at).toLocaleString('es-EC')}</small>`;
  document.getElementById('modalBg').classList.add('show');
  cart = []; renderCart(); toggleCart(false);
}
function closeModal(){ document.getElementById('modalBg').classList.remove('show'); }
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._tm); t._tm = setTimeout(() => t.style.display = 'none', 2200);
}

/* ---------- Cambio de vistas ---------- */
function showView(v){
  document.getElementById('homeView').style.display  = v === 'home'  ? 'block' : 'none';
  document.getElementById('adminView').style.display = v === 'admin' ? 'block' : 'none';
  if(v === 'admin') refreshAdmin();
  window.scrollTo(0, 0);
}

/* ---------- Panel Admin (Supabase Auth + RLS) ---------- */
async function checkAdmin(){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session) return false;
  const { data } = await sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
  return !!data;
}
async function doLogin(){
  const email = document.getElementById('lUser').value.trim();
  const password = document.getElementById('lPass').value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if(error || !(await checkAdmin())){
    if(!error) await sb.auth.signOut();
    document.getElementById('loginErr').style.display = 'block'; return;
  }
  document.getElementById('loginErr').style.display = 'none';
  document.getElementById('lPass').value = '';
  await enterAdmin();
}
async function logout(){
  await sb.auth.signOut();
  if(ordersChannel){ sb.removeChannel(ordersChannel); ordersChannel = null; }
  isAdmin = false; orders = []; refreshAdmin();
}
async function loadOrders(){
  const { data, error } = await sb.from('orders').select('*').order('created_at', {ascending:false}).limit(200);
  if(error) return fail(error, 'No se pudieron cargar los pedidos');
  orders = data;
}
async function enterAdmin(){
  isAdmin = true;
  await loadOrders();
  if(!ordersChannel){
    ordersChannel = sb.channel('orders-live')
      .on('postgres_changes', {event:'*', schema:'public', table:'orders'}, async payload => {
        await loadOrders(); if(isAdmin) renderOrders();
        if(payload.eventType === 'INSERT') toast('🔔 ¡Nuevo pedido!');
      }).subscribe();
  }
  refreshAdmin();
}
function refreshAdmin(){
  document.getElementById('loginBox').style.display   = isAdmin ? 'none' : 'block';
  document.getElementById('adminPanel').style.display = isAdmin ? 'block' : 'none';
  if(isAdmin){ renderOrders(); renderProductsAdmin(); }
}
function adminTab(t, btn){
  document.getElementById('tabOrders').style.display    = t === 'orders'    ? 'block' : 'none';
  document.getElementById('tabProducts').style.display  = t === 'products'  ? 'block' : 'none';
  document.querySelectorAll('.admin-tabs .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
const STATUS = ['Pendiente','Preparando','Listo','Entregado'];
const BADGE  = {'Pendiente':'b-pend','Preparando':'b-prep','Listo':'b-listo','Entregado':'b-ent'};

function renderOrders(){
  const box = document.getElementById('tabOrders');
  if(!orders.length){ box.innerHTML = '<p class="empty">Aún no hay pedidos registrados 📦</p>'; return; }
  box.innerHTML = '<table><thead><tr><th>Código</th><th>Fecha</th><th>Cliente / Entrega</th><th>Detalle</th><th>Total</th><th>Estado</th></tr></thead><tbody>' +
    orders.map(o => `<tr>
      <td><b>${esc(o.code)}</b></td>
      <td style="white-space:nowrap">${new Date(o.created_at).toLocaleString('es-EC')}</td>
      <td><b>${esc(o.customer_name)}</b><br><small>${o.mode === 'domicilio' ? '🛵 ' + esc(o.customer_tel) + ' — ' + esc(o.customer_addr) : '🏠 Consumo en local'}</small></td>
      <td><small>${o.items.map(it => it.qty + '× ' + esc(it.name)).join('<br>')}</small></td>
      <td><b>${money(Number(o.total))}</b></td>
      <td>
        <span class="badge ${BADGE[o.status]}">${o.status}</span><br>
        <select class="st" onchange="setStatus(${o.id}, this.value)">${STATUS.map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select>
      </td>
    </tr>`).join('') + '</tbody></table>';
}
async function setStatus(id, s){
  const { error } = await sb.from('orders').update({status:s}).eq('id', id);
  if(error){ renderOrders(); return fail(error, 'No se pudo actualizar el estado'); }
  const o = orders.find(x => x.id === id); if(o) o.status = s;
  renderOrders();
}

function renderProductsAdmin(){
  document.getElementById('prodRows').innerHTML = products.map(p => `<tr>
    <td><b>${esc(p.name)}</b><br><small>${esc(p.desc)}</small></td>
    <td>${esc(p.cat)}</td>
    <td><input type="number" step="0.05" min="0" value="${p.price}" onchange="setPrice(${p.id}, this.value)"></td>
    <td><input type="checkbox" ${p.available ? 'checked' : ''} onchange="setAvail(${p.id}, this.checked)"></td>
    <td><button class="add" style="background:#c0392b" onclick="delProduct(${p.id})">🗑</button></td>
  </tr>`).join('');
}
const r2 = n => Math.round(n * 100) / 100;
async function setPrice(id, v){
  const p = products.find(x => x.id === id);
  const price = Math.max(0, r2(parseFloat(v) || 0));
  const patch = { price };
  if(p.opts){   // mantiene la diferencia entre tamaños
    const d = price - p.price;
    patch.opts = {...p.opts, values: Object.fromEntries(Object.entries(p.opts.values).map(([k,x]) => [k, Math.max(0, r2(x + d))]))};
  }
  const { error } = await sb.from('products').update(patch).eq('id', id);
  if(error){ renderProductsAdmin(); return fail(error, 'No se pudo actualizar el precio'); }
  Object.assign(p, patch); refreshMenu(); toast('Precio actualizado ✏️');
}
async function setAvail(id, v){
  const { error } = await sb.from('products').update({available:v}).eq('id', id);
  if(error){ renderProductsAdmin(); return fail(error, 'No se pudo actualizar'); }
  products.find(x => x.id === id).available = v; refreshMenu();
}
async function delProduct(id){
  if(!confirm('¿Eliminar este producto?')) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if(error) return fail(error, 'No se pudo eliminar');
  products = products.filter(x => x.id !== id); renderProductsAdmin(); refreshMenu();
}
async function addProduct(){
  const name  = document.getElementById('nName').value.trim();
  const price = parseFloat(document.getElementById('nPrice').value);
  if(!name || isNaN(price) || price < 0){ toast('Completa nombre y precio'); return; }
  const { error } = await sb.from('products').insert({
    cat: document.getElementById('nCat').value, name, price: r2(price), description: '',
    img: IMG.burger, available: true, sort: Math.max(0, ...products.map(p => p.sort)) + 1
  });
  if(error) return fail(error, 'No se pudo agregar el producto');
  document.getElementById('nName').value = ''; document.getElementById('nPrice').value = '';
  await loadProducts(); renderProductsAdmin(); refreshMenu(); toast('Producto agregado ✅');
}

/* ---------- Init ---------- */
renderCart();
(async () => {
  await loadProducts(); refreshMenu();
  sb.channel('products-live')
    .on('postgres_changes', {event:'*', schema:'public', table:'products'}, async () => {
      await loadProducts(); refreshMenu(); if(isAdmin) renderProductsAdmin();
    }).subscribe();
  if(await checkAdmin()) await enterAdmin();   // restaura sesión guardada
})();
