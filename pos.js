// --- POS Data Structure ---
const posData = { openOrders: [], closedOrders: [], irregularOrders: [] };

// --- Menu Definition ---
const MENU = {
  Food: [{name:"Burger", price:5},{name:"Pizza", price:8},{name:"Salad", price:4},{name:"Pasta", price:7}],
  Drinks: [{name:"Water", price:1},{name:"Soda", price:2},{name:"Coffee", price:3},{name:"Juice", price:3}]
};

/* --- Functions --- */

// Shortcut to populate items into a select element
function populateItems(section, selectId='item'){
  const sel=$(selectId); sel.innerHTML='';
  MENU[section].forEach(it=>{
    let o=document.createElement('option'); 
    o.value=it.name; 
    o.textContent=`${it.name} - ${formatPrice(it.price)}`; 
    sel.appendChild(o);
  });
}

// Get item price
function getItemPrice(section,item){ 
  return MENU[section].find(i=>i.name===item)?.price || 0; 
}

// Update JSON snapshot
function updateSnapshot(){ $('snapshot').textContent = JSON.stringify(posData,null,2); }

// --- Place Order ---
function placeOrder({tableDescription,orderTag,section,item,qty}){
  if(!tableDescription || !item || !qty) return alert("Please fill all required fields.");

  const timestamp = new Date().toISOString();
  let table=posData.openOrders.find(t=>t.tableDescription===tableDescription);
  if(!table){ 
    table={tableId:uid(),tableDescription,status:'occupied',createdAt:timestamp,orders:[]}; 
    posData.openOrders.push(table);
  }

  let tag=table.orders.find(x=>x.orderTag===orderTag);
  if(!tag){ tag={orderTagId:uid(),orderTag,items:[],createdAt:timestamp}; table.orders.push(tag); }

  let existing=tag.items.find(i=>i.item===item);
  if(existing) existing.qty+=Number(qty);
  else tag.items.push({ item, qty:Number(qty), price:getItemPrice(section,item), timestampCreated:timestamp });

  renderTables(); 
  updateSnapshot();
}

/* --- Render Tables --- */
function renderTables(){
  const container=$('tables'); container.innerHTML='';

  // Sort tables newest first
  const sortedTables = posData.openOrders.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  sortedTables.forEach(table=>{
    const tableDiv=document.createElement('div'); 
    tableDiv.className='table-box';

    // Table title with timestamp
    const tableTitle=document.createElement('div');
    tableTitle.className='table-title';
    tableTitle.textContent=`${table.tableDescription} (${new Date(table.createdAt).toLocaleTimeString()})`;
    tableDiv.appendChild(tableTitle);

    table.orders.forEach(tag=>{
      const tagBox=document.createElement('div'); tagBox.className='order-tag-box';
      const tagHeader=document.createElement('div'); tagHeader.className='tag-header';
      tagHeader.textContent=`${tag.orderTag} (${new Date(tag.createdAt).toLocaleTimeString()})`;
      tagBox.appendChild(tagHeader);

      tag.items.forEach(item=>{
        const itemDiv=document.createElement('div'); itemDiv.className='order-box';
        itemDiv.textContent=`${item.qty} x ${item.item} - ${formatPrice(item.price)}`;
        tagBox.appendChild(itemDiv);
      });

      tableDiv.appendChild(tagBox);
    });

    container.appendChild(tableDiv);
  });
}

/* --- Event Bindings --- */
window.addEventListener('DOMContentLoaded',()=>{
  // Initial populate
  populateItems($('section').value);
  renderTables();

  // Bind place order button
  $('placeOrderBtn').onclick = ()=>{
    placeOrder({
      tableDescription: $('tableDesc').value,
      orderTag: $('orderTag').value || 'Single Order',
      section: $('section').value,
      item: $('item').value,
      qty: $('qty').value
    });
  };

  // Section dropdown change
  $('section').onchange = (e)=> populateItems(e.target.value);

  // Initialize popups (optional: close buttons)
  const popups = ['payPopup','irregularPopup','addItemPopup'];
  popups.forEach(id=>{
    const popup = $(id);
    const closeBtn = popup.querySelector('.popup-close');
    if(closeBtn) closeBtn.onclick = ()=> popup.style.display='none';
  });
});

/* --- Notes ---
- Fixed placeOrderBtn binding.
- Added validation: tableDescription, item, qty required.
- Tables sorted newest first; timestamps visible.
- Future edits: continue using renderTables() for UI updates.
*/
