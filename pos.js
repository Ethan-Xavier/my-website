// --- POS Data Structure ---
const posData = { openOrders: [], closedOrders: [], irregularOrders: [] };

// --- Waiter Auth ---
const WAITERS = ["Nina", "Ethan", "Shakina"];
const WAITER_PASSWORD = "1234";
let currentWaiter = null;

// --- FORCE LOGIN ON LOAD ---
// NOTE: loginPopup is visible by default via CSS

$('loginBtn').onclick = () => {
  const user = $('waiterSelect').value;
  const pass = $('waiterPassword').value;

  if (!user) {
    alert("Select a username");
    return;
  }

  if (pass !== WAITER_PASSWORD) {
    alert("Wrong password");
    return;
  }

  currentWaiter = user;

  // Hide overlay ONLY after valid login
  $('loginPopup').style.display = 'none';
};

// --- Menu ---
const MENU = {
  Food: [{name:"Burger",price:5},{name:"Pizza",price:8}],
  Drinks: [{name:"Water",price:1},{name:"Soda",price:2}]
};

// --- Populate Items ---
function populateItems(section){
  const sel = $('item');
  sel.innerHTML='';
  MENU[section].forEach(it=>{
    const o=document.createElement('option');
    o.value=it.name;
    o.textContent=`${it.name} - ${formatPrice(it.price)}`;
    sel.appendChild(o);
  });
}
populateItems($('section').value);
$('section').onchange = e => populateItems(e.target.value);

// --- Place Order ---
$('placeOrderBtn').onclick = () => {
  if (!currentWaiter) {
    alert("Login required");
    return;
  }

  const t = $('tableDesc').value.trim();
  if (!t) return alert("Table required");

  let table = posData.openOrders.find(x => x.tableDescription === t);
  if (!table) {
    table = {
      tableId: uid(),
      tableDescription: t,
      waiter: currentWaiter, // ✅ tracked
      createdAt: new Date().toISOString(),
      orders: []
    };
    posData.openOrders.push(table);
  }

  table.orders.push({
    orderTag: $('orderTag').value,
    items: [{
      item: $('item').value,
      qty: Number($('qty').value),
      price: MENU[$('section').value].find(i=>i.name===$('item').value).price
    }]
  });

  updateSnapshot();
};

// --- Snapshot ---
function updateSnapshot(){
  $('snapshot').textContent = JSON.stringify(posData, null, 2);
}

updateSnapshot();
