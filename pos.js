// --- POS Data Structure ---
const posData = { openOrders: [], closedOrders: [], irregularOrders: [] };

// --- Menu Definition ---
const MENU = {
  Food: [{name:"Burger", price:5},{name:"Pizza", price:8},{name:"Salad", price:4},{name:"Pasta", price:7}],
  Drinks: [{name:"Water", price:1},{name:"Soda", price:2},{name:"Coffee", price:3},{name:"Juice", price:3}]
};

/* --- Utility Functions --- */
const $ = id => document.getElementById(id);
function uid(){ return "ID-" + Math.random().toString(36).slice(2,9); }
function formatPrice(p){ return typeof p==='string'?p:`$${p}`; }

/* --- Populate Items --- */
function populateItems(section, selectId='item'){
  const sel=$(selectId); sel.innerHTML='';
  MENU[section].forEach(it=>{
    let o=document.createElement('option'); 
    o.value=it.name; 
    o.textContent=`${it.name} - ${formatPrice(it.price)}`; 
    sel.appendChild(o);
  });
}

function getItemPrice(section,item){ 
  return MENU[section].find(i=>i.name===item)?.price || 0; 
}

function updateSnapshot(){ $('snapshot').textContent = JSON.stringify(posData,null,2); }

/* --- Place Order --- */
function placeOrder({tableDescription,orderTag,section,item,qty}){
  if(!tableDescription || !item || !qty) return alert("Please fill all required fields.");
  const timestamp = new Date().toISOString();
  let table = posData.openOrders.find(t=>t.tableDescription===tableDescription);
  if(!table){ 
    table={tableId:uid(),tableDescription,status:'occupied',createdAt:timestamp,orders:[]}; 
    posData.openOrders.push(table);
  }

  let tag = table.orders.find(x=>x.orderTag===orderTag);
  if(!tag){ tag={orderTagId:uid(),orderTag,items:[],createdAt:timestamp}; table.orders.push(tag); }

  let existing = tag.items.find(i=>i.item===item);
  if(existing) existing.qty += Number(qty);
  else tag.items.push({ item, qty:Number(qty), price:getItemPrice(section,item), timestampCreated:timestamp });

  renderTables(); 
  updateSnapshot();
}

/* --- Render Tables & Orders --- */
function renderTables(){
  const container = $('tables'); container.innerHTML='';

  // Sort tables newest first
  const sortedTables = posData.openOrders.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  sortedTables.forEach(table=>{
    const tableDiv = document.createElement('div'); 
    tableDiv.className = 'table-box';

    // Table title with timestamp
    const tableTitle = document.createElement('div');
    tableTitle.className = 'table-title';
    tableTitle.textContent = `${table.tableDescription} (${new Date(table.createdAt).toLocaleTimeString()})`;
    tableDiv.appendChild(tableTitle);

    table.orders.forEach(tag=>{
      const tagBox = document.createElement('div'); tagBox.className = 'order-tag-box';

      // Tag header with timestamp
      const tagHeader = document.createElement('div'); tagHeader.className = 'tag-header';
      tagHeader.textContent = `${tag.orderTag} (${new Date(tag.createdAt).toLocaleTimeString()})`;
      tagBox.appendChild(tagHeader);

      // Items
      tag.items.forEach(item=>{
        const itemDiv = document.createElement('div'); itemDiv.className = 'order-box';
        itemDiv.textContent = `${item.qty} x ${item.item} - ${formatPrice(item.price)}`;
        tagBox.appendChild(itemDiv);
      });

      // Buttons for each order tag
      const btnDiv = document.createElement('div'); btnDiv.className='tag-buttons';
      
      const payBtn = document.createElement('button'); payBtn.className='btn-pay'; payBtn.textContent='Pay';
      payBtn.onclick = ()=>openPayPopup(table, tag);
      
      const cancelBtn = document.createElement('button'); cancelBtn.className='btn-cancel'; cancelBtn.textContent='Cancel';
      cancelBtn.onclick = ()=>cancelOrder(table.tableId, tag.orderTagId);

      const addItemBtn = document.createElement('button'); addItemBtn.className='btn-additem'; addItemBtn.textContent='Add Item';
      addItemBtn.onclick = ()=>openAddItemPopup(table, tag);

      const irregularBtn = document.createElement('button'); irregularBtn.className='btn-irregular'; irregularBtn.textContent='Irregular';
      irregularBtn.onclick = ()=>openIrregularPopup(table, tag);

      btnDiv.append(payBtn, cancelBtn, addItemBtn, irregularBtn);
      tagBox.appendChild(btnDiv);

      tableDiv.appendChild(tagBox);
    });

    container.appendChild(tableDiv);
  });
}

/* --- Placeholder functions for buttons --- */
function openPayPopup(table, tag){ 
  $('payPopup').style.display='flex';
  $('payDetails').textContent = `Pay for ${tag.orderTag} at ${table.tableDescription}`;
}
function cancelOrder(tableId, tagId){
  const table = posData.openOrders.find(t=>t.tableId===tableId);
  if(!table) return;
  table.orders = table.orders.filter(t=>t.orderTagId !== tagId);
  renderTables(); updateSnapshot();
}
function openAddItemPopup(table, tag){ $('addItemPopup').style.display='flex'; }
function openIrregularPopup(table, tag){ $('irregularPopup').style.display='flex'; }

/* --- Event Bindings --- */
window.addEventListener('DOMContentLoaded', ()=>{
  populateItems($('section').value);
  renderTables();

  $('placeOrderBtn').onclick = ()=>{
    placeOrder({
      tableDescription: $('tableDesc').value,
      orderTag: $('orderTag').value || 'Single Order',
      section: $('section').value,
      item: $('item').value,
      qty: $('qty').value
    });
  };

  $('section').onchange = e => populateItems(e.target.value);

  // Close popup buttons
  ['payPopup','irregularPopup','addItemPopup'].forEach(id=>{
    const popup = $(id);
    const closeBtn = popup.querySelector('.popup-close');
    if(closeBtn) closeBtn.onclick = ()=> popup.style.display='none';
  });
});

/* --- Notes ---
- Fully restores original buttons and popups functionality.
- Place Order button now works.
- Tables sorted newest first, timestamps visible.
- All event bindings intact.
- Future edits: implement actual payment or irregular handling inside respective functions.
*/
