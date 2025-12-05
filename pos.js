// --- POS Data Structure ---
const posData = { openOrders: [], closedOrders: [], irregularOrders: [] };

// --- Menu Definition ---
const MENU = {
  Food: [{name:"Burger", price:5},{name:"Pizza", price:8},{name:"Salad", price:4},{name:"Pasta", price:7}],
  Drinks: [{name:"Water", price:1},{name:"Soda", price:2},{name:"Coffee", price:3},{name:"Juice", price:3}]
};

/* --- Functions --- */

// Populate items into a select element based on section
function populateItems(section, selectId='item'){
  const sel=$(selectId); sel.innerHTML='';
  MENU[section].forEach(it=>{
    let o=document.createElement('option'); 
    o.value=it.name; 
    o.textContent=`${it.name} - ${formatPrice(it.price)}`; 
    sel.appendChild(o);
  });
}

// Get item price from MENU
function getItemPrice(section,item){ return MENU[section].find(i=>i.name===item)?.price || 0; }

// Update JSON snapshot for debugging
function updateSnapshot(){ $('snapshot').textContent = JSON.stringify(posData,null,2); }

// Place order function
function placeOrder({tableDescription,orderTag,section,item,qty}){
  let table=posData.openOrders.find(t=>t.tableDescription===tableDescription);
  const timestamp=new Date().toISOString();
  if(!table){ table={tableId:uid(),tableDescription,status:'occupied',createdAt:timestamp,orders:[]}; posData.openOrders.push(table);}
  let tag=table.orders.find(x=>x.orderTag===orderTag);
  if(!tag){ tag={orderTagId:uid(),orderTag,items:[]}; table.orders.push(tag);}
  let existing=tag.items.find(i=>i.item===item);
  if(existing) existing.qty+=Number(qty);
  else tag.items.push({ item, qty:Number(qty), price:getItemPrice(section,item), timestampCreated:timestamp });
  renderTables(); updateSnapshot();
}

/* --- Popup Management --- */
// Pay, Irregular, Add Item popups all controlled via JS variables and onclick events.
// Functions: openPayPopup(), storeIrregular(), addAddItemButton(), addIrregularButton()

/* --- Render Function --- */
// renderTables() builds the UI for openOrders and irregularOrders
// Key elements for modification:
// - table.orders for each table
// - tag.items for each order tag
// - Buttons: Pay, Cancel, Move, Add Item, Irregular
// - Click on items or titles allows editing quantity, table description, or tag

/* --- Event Bindings --- */
// - 'placeOrderBtn' triggers placeOrder() from inputs
// - Section select dropdown triggers populateItems()
// - Popups have confirm/cancel buttons attached

/* Notes:
- Any new feature should follow existing posData structure.
- Changes to MENU, popups, or renderTables should respect existing DOM structure.
- IrregularOrders are stored separately in posData.irregularOrders.
- Closed orders are stored in posData.closedOrders.
- All interactions ultimately call renderTables() + updateSnapshot() to refresh UI.
*/
