// --- POS Data Structure ---
const posData = { openOrders: [], closedOrders: [], irregularOrders: [] };

// --- Waiters & Auth (new) ---
// Allowed waiters and simple password check (password is "1234")
const WAITERS = ['Nina','Ethan','Shakina'];
const WAITERS_PASSWORD = '1234'; // NOTE: simple client-side password, intended for demo only

// Current logged-in waiter (persist in sessionStorage so refresh keeps session)
let currentWaiter = sessionStorage.getItem('pos_currentWaiter') || null;

// --- Menu Definition ---
const MENU = {
  Food: [{name:"Burger", price:5},{name:"Pizza", price:8},{name:"Salad", price:4},{name:"Pasta", price:7}],
  Drinks: [{name:"Water", price:1},{name:"Soda", price:2},{name:"Coffee", price:3},{name:"Juice", price:3}]
};

// --- Populate Items ---
function populateItems(section, selectId='item'){
  const sel=$(selectId); sel.innerHTML='';
  MENU[section].forEach(it=>{
    let o=document.createElement('option');
    o.value=it.name;
    o.textContent=`${it.name} - ${formatPrice(it.price)}`;
    sel.appendChild(o);
  });
}
populateItems($('section').value);
$('section').addEventListener('change', e=>populateItems(e.target.value));

// --- Helpers ---
function getItemPrice(section,item){ return MENU[section].find(i=>i.name===item)?.price || 0; }
function updateSnapshot(){ $('snapshot').textContent = JSON.stringify(posData,null,2); }

/* ---------------------------
   LOGIN / AUTH UI (new)
   --------------------------- */
const loginOverlay = $('loginOverlay');
const loginBox = $('loginBox');
const waiterSelect = $('waiterSelect');
const waiterPassword = $('waiterPassword');
const loginBtn = $('loginBtn');
const guestBtn = $('guestBtn');
const loginMsg = $('loginMsg');
const currentWaiterBadge = $('currentWaiterBadge');

function showLoginOverlay(){
  // show overlay (blocks interaction)
  loginOverlay.style.display = 'flex';
  loginMsg.textContent = '';
}
function hideLoginOverlay(){
  loginOverlay.style.display = 'none';
}
function setCurrentWaiter(name){
  currentWaiter = name;
  if(name) sessionStorage.setItem('pos_currentWaiter', name);
  else sessionStorage.removeItem('pos_currentWaiter');
  currentWaiterBadge.textContent = name ? `Logged in: ${name}` : '';
}

// login handler
loginBtn.onclick = ()=>{
  const name = waiterSelect.value;
  const pass = waiterPassword.value;
  if(!name){ loginMsg.textContent = 'Select a waiter'; return; }
  if(pass !== WAITERS_PASSWORD){ loginMsg.textContent = 'Incorrect password'; return; }
  // success
  setCurrentWaiter(name);
  waiterPassword.value = '';
  loginMsg.textContent = '';
  hideLoginOverlay();
  // ensure UI reflects current waiter
  renderTables();
};

// logout/guest — hides session and forces login again
guestBtn.onclick = ()=>{
  setCurrentWaiter(null);
  showLoginOverlay();
};

// on load: if no current waiter, show overlay; otherwise hide
if(!currentWaiter) showLoginOverlay();
else { setCurrentWaiter(currentWaiter); hideLoginOverlay(); }

/* ---------------------------
   PLACE ORDER (modified)
   - When a new table is created, store table.waiter = currentWaiter
   - Block placing order if not logged in
   --------------------------- */
function placeOrder({tableDescription,orderTag,section,item,qty}){
  if(!currentWaiter){
    alert('Please login as a waiter before placing orders.');
    showLoginOverlay();
    return;
  }

  const timestamp=new Date().toISOString();
  let table=posData.openOrders.find(t=>t.tableDescription===tableDescription);
  if(!table){
    // create new table; set waiter property to current logged-in waiter
    table={tableId:uid(),tableDescription,status:'occupied',createdAt:timestamp, waiter: currentWaiter, orders:[]};
    posData.openOrders.push(table);
  }
  let tag=table.orders.find(x=>x.orderTag===orderTag);
  if(!tag){ tag={orderTagId:uid(),orderTag,items:[]}; table.orders.push(tag);}
  let existing=tag.items.find(i=>i.item===item);
  if(existing) existing.qty+=Number(qty);
  else tag.items.push({ item, qty:Number(qty), price:getItemPrice(section,item), timestampCreated:timestamp });
  renderTables(); updateSnapshot();
}

/* ---------------------------
   PAY POPUP (unchanged logic)
   --------------------------- */
let payContext=null;
const payPopup=$('payPopup'), payDetails=$('payDetails');
function openPayPopup(table,tag,fromDebt=null){
  // allow paying a debt (debt stored in irregularOrders) where tag is the debt object
  payContext={table,tag,fromDebt};
  payDetails.innerHTML = (tag.items || []).map(i=>`${i.item} x ${i.qty} - ${formatPrice(i.price)}`).join('<br>');
  payPopup.style.display='flex';
}
$('closePayPopup').onclick = $('cancelPaymentBtn').onclick = ()=>{ payPopup.style.display='none'; payContext=null; };
$('confirmPaymentBtn').onclick=()=>{
  if(!payContext) return;
  const {table,tag,fromDebt}=payContext;
  const method=$('paymentMethodSelect').value;
  // mark items as closedOrders
  (tag.items || []).forEach(i=>{
    posData.closedOrders.push({item:i.item, qty:i.qty, price:i.price, timestampCreated:i.timestampCreated, paymentMethod:method});
  });
  if(fromDebt){
    // tag is actually an irregularOrders entry
    posData.irregularOrders = posData.irregularOrders.filter(o => o.orderTagId !== tag.orderTagId);
  } else {
    table.orders = table.orders.filter(o=>o.orderTagId!==tag.orderTagId);
    if(table.orders.length===0)
      posData.openOrders = posData.openOrders.filter(t=>t.tableId!==table.tableId);
  }
  payPopup.style.display='none'; payContext=null;
  renderTables(); updateSnapshot();
};

/* ---------------------------
   IRREGULAR / ADD ITEM (unchanged, small adjustments)
   --------------------------- */
const irregularPopup=$('irregularPopup'), irregularInputDiv=$('irregularInputDiv'), irregularDesc=$('irregularDesc');
let irregularContext=null;
function addIrregularButton(btns,table,tag){
  const irrBtn=document.createElement('button');
  irrBtn.className='btn-irregular';
  irrBtn.textContent='Irregular';
  irrBtn.onclick=()=>{
    irregularContext={table,tag};
    irregularInputDiv.style.display='none';
    irregularDesc.value='';
    irregularPopup.style.display='flex';
  };
  btns.appendChild(irrBtn);
}

// --- Add Item Popup ---
const addItemPopup=$('addItemPopup'), addItemSection=$('addSection'), addItemItem=$('addItem'), addItemQty=$('addQty');
let addItemContext=null;
function addAddItemButton(btns,table,tag){
  const addBtn=document.createElement('button');
  addBtn.className='btn-pay';
  addBtn.textContent='Add Item';
  addBtn.onclick=()=>{
    addItemContext={table,tag};
    populateItems(addItemSection.value,'addItem');
    addItemQty.value=1;
    addItemPopup.style.display='flex';
  };
  btns.appendChild(addBtn);
}
addItemSection.addEventListener('change', e=>populateItems(e.target.value,'addItem'));
$('addItemCancelBtn').onclick=$('closeAddItemPopup').onclick=()=>{ addItemPopup.style.display='none'; addItemContext=null; };
$('addItemConfirmBtn').onclick=()=>{
  if(!addItemContext) return;
  const {table,tag}=addItemContext;
  const section=addItemSection.value, item=addItemItem.value, qty=Number(addItemQty.value);
  if(qty<=0){ alert('Quantity must be at least 1'); return; }
  let existing=tag.items.find(i=>i.item===item);
  if(existing) existing.qty+=qty;
  else tag.items.push({ item, qty, price:getItemPrice(section,item), timestampCreated:new Date().toISOString() });
  addItemPopup.style.display='none'; addItemContext=null;
  renderTables(); updateSnapshot();
};

/* ---------------------------
   Irregular Options (unchanged)
   --------------------------- */
document.querySelectorAll('#irregularOptions .option-btn').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('#irregularOptions .option-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const type=b.dataset.type;
    irregularInputDiv.style.display='block';
    if(type==='Other' && irregularContext){
      const {tag}=irregularContext;
      tag.items.forEach(i=>{
        posData.closedOrders.push({item:i.item, qty:i.qty, price:i.price, timestampCreated:i.timestampCreated, paymentMethod:'Other'});
      });
    }
  };
});
$('irregularConfirmBtn').onclick=()=>{
  const type=document.querySelector('#irregularOptions .option-btn.active')?.dataset.type || 'Debt';
  storeIrregular(type, irregularDesc.value.trim());
  irregularPopup.style.display='none';
};
$('irregularCancelBtn').onclick=$('closeIrregularPopup').onclick=()=>{ irregularPopup.style.display='none'; irregularContext=null; };

function storeIrregular(type,desc){
  if(!irregularContext) return;
  const {table,tag}=irregularContext;
  const total=tag.items.reduce((s,i)=>s+i.qty*i.price,0);
  posData.irregularOrders.push({ orderTagId: tag.orderTagId, tableDescription: table.tableDescription, orderTag: tag.orderTag, items: JSON.parse(JSON.stringify(tag.items)), type, description: desc, total, waiter: table.waiter || null });
  table.orders = table.orders.filter(o=>o.orderTagId!==tag.orderTagId);
  if(table.orders.length===0)
    posData.openOrders = posData.openOrders.filter(t=>t.tableId!==table.tableId);
  renderTables(); updateSnapshot();
}

/* ---------------------------
   RENDER UI (modified)
   - Display waiter on table title
   - Make waiter name clickable to change assigned waiter
   --------------------------- */
function renderTables(){
  const container=$('tables'); container.innerHTML='';
  const debtsDiv=$('debts'); debtsDiv.innerHTML='';

  // Sort tables newest first
  const sortedTables = [...posData.openOrders].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  sortedTables.forEach(table=>{
    const box=document.createElement('div'); box.className='table-box';

    // Title row: left = description + timestamp, right = waiter badge (clickable)
    const title=document.createElement('div'); title.className='table-title';

    const descSpan = document.createElement('div');
    descSpan.textContent = `${table.tableDescription} (${new Date(table.createdAt).toLocaleString()})`;
    descSpan.style.flex = '1';
    descSpan.onclick = ()=>{
      const newDesc=prompt('Edit Table Description:',table.tableDescription);
      if(newDesc){ table.tableDescription=newDesc; renderTables(); updateSnapshot(); }
    };

    const waiterName = document.createElement('div');
    waiterName.className = 'waiter-name';
    waiterName.textContent = table.waiter ? table.waiter : 'Unassigned';
    waiterName.title = 'Click to change waiter assigned to this table';
    // Clicking waiter name lets you choose a different waiter (change table.waiter)
    waiterName.onclick = ()=>{
      // prompt shows the list of allowed waiters
      const choice = prompt(`Change waiter for table "${table.tableDescription}". Options: ${WAITERS.join(', ')}`, table.waiter || '');
      if(choice === null) return; // cancelled
      const trimmed = choice.trim();
      if(!trimmed) return;
      if(!WAITERS.includes(trimmed)){
        alert('Invalid waiter. Choose one of: ' + WAITERS.join(', '));
        return;
      }
      table.waiter = trimmed;
      renderTables(); updateSnapshot();
    };

    title.appendChild(descSpan);
    title.appendChild(waiterName);
    box.appendChild(title);

    table.orders.forEach(tag=>{
      const tbox=document.createElement('div'); tbox.className='order-tag-box';
      const head=document.createElement('div'); head.className='tag-header';
      const span=document.createElement('span');
      span.textContent=`${tag.orderTag} (${new Date(tag.items[0].timestampCreated).toLocaleString()})`;
      span.onclick=()=>{
        const newTag=prompt('Edit Order Tag:',tag.orderTag);
        if(newTag){ tag.orderTag=newTag; renderTables(); updateSnapshot(); }
      };
      const btns=document.createElement('div'); btns.className='tag-buttons';
      const moveBtn=document.createElement('button'); moveBtn.className='btn-move'; moveBtn.textContent='Move';
      moveBtn.onclick=()=>{
        const newDesc=prompt('Move to which Table Description?'); if(!newDesc) return;
        // remove from current table
        table.orders = table.orders.filter(o=>o.orderTagId!==tag.orderTagId);
        if(table.orders.length===0)
          posData.openOrders = posData.openOrders.filter(t=>t.tableId!==table.tableId);
        // find or create target table
        let target=posData.openOrders.find(t=>t.tableDescription===newDesc);
        if(!target){
          // preserve original table.waiter when creating new table via move (so opener remains)
          target={tableId:uid(),tableDescription:newDesc,status:'occupied',createdAt:new Date().toISOString(), waiter: table.waiter || currentWaiter, orders:[]};
          posData.openOrders.push(target);
        }
        target.orders.push(tag);
        renderTables(); updateSnapshot();
      };
      const cancelBtn=document.createElement('button'); cancelBtn.className='btn-cancel'; cancelBtn.textContent='Cancel';
      cancelBtn.onclick=()=>{
        table.orders = table.orders.filter(o=>o.orderTagId!==tag.orderTagId);
        if(table.orders.length===0)
          posData.openOrders = posData.openOrders.filter(t=>t.tableId!==table.tableId);
        renderTables(); updateSnapshot();
      };
      const payBtn=document.createElement('button'); payBtn.className='btn-pay'; payBtn.textContent='Pay';
      payBtn.onclick=()=>openPayPopup(table,tag,null);

      btns.append(moveBtn,cancelBtn,payBtn);
      addIrregularButton(btns,table,tag);
      addAddItemButton(btns,table,tag);

      head.append(span,btns); tbox.appendChild(head);

      tag.items.forEach(i=>{
        const d=document.createElement('div'); d.className='order-box';
        d.textContent=`${i.item} x ${i.qty} - ${formatPrice(i.price)}`;
        d.onclick=()=>{
          const newQty=prompt(`Adjust quantity for ${i.item} (0 to remove):`, i.qty);
          if(newQty===null) return;
          const n=Number(newQty);
          if(n<=0) tag.items=tag.items.filter(it=>it.item!==i.item);
          else i.qty=n;
          if(tag.items.length===0) table.orders=table.orders.filter(o=>o.orderTagId!==tag.orderTagId);
          if(table.orders.length===0) posData.openOrders=posData.openOrders.filter(t=>t.tableId!==table.tableId);
          renderTables(); updateSnapshot();
        };
        tbox.appendChild(d);
      });

      const total=tag.items.reduce((s,i)=>s+i.qty*i.price,0);
      const tot=document.createElement('div'); tot.className='order-total'; tot.textContent=`Total: ${formatPrice(total)}`;
      tbox.appendChild(tot);
      box.appendChild(tbox);
    });

    container.appendChild(box);
  });

  // Render debts (include waiter if present)
  posData.irregularOrders.filter(o=>o.type==='Debt').forEach(debt=>{
    const dbox=document.createElement('div'); dbox.className='order-tag-box';
    const details=document.createElement('div');
    const waiterText = debt.waiter ? ` (Waiter: ${debt.waiter})` : '';
    details.innerHTML=`<strong>${debt.description || debt.orderTag}</strong>${waiterText}<br>${debt.items.map(i=>`${i.item} x ${i.qty} - ${formatPrice(i.price)}`).join('<br>')}<div style="margin-top:4px;font-weight:600;">Total: ${formatPrice(debt.total)}</div>`;
    const payBtn=document.createElement('button'); payBtn.className='btn-pay'; payBtn.textContent='Paid';
    payBtn.onclick=()=>openPayPopup(null,debt,true);
    dbox.append(details,payBtn); debtsDiv.appendChild(dbox);
  });

  // update waiter badge
  currentWaiterBadge.textContent = currentWaiter ? `Logged in: ${currentWaiter}` : '';
}

/* ---------------------------
   Place Order Button binding
   (keeps previous behaviour, but now requires login)
   --------------------------- */
$('placeOrderBtn').onclick=()=>{
  const t=$('tableDesc').value.trim();
  if(!t){alert('Table Description required');return;}
  placeOrder({ tableDescription:t, orderTag:$('orderTag').value.trim(), section:$('section').value, item:$('item').value, qty:$('qty').value });
};

// --- Init ---
updateSnapshot();
renderTables();
