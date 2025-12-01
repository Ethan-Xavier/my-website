const posData={openOrders:[],closedOrders:[],irregularOrders:[]}

const MENU={
  Food:[{name:"Burger",price:5},{name:"Pizza",price:8},{name:"Salad",price:4},{name:"Pasta",price:7}],
  Drinks:[{name:"Water",price:1},{name:"Soda",price:2},{name:"Coffee",price:3},{name:"Juice",price:3}]
}

/* Populate main dropdown */
function populateItems(sec){
  $('item').innerHTML=""
  MENU[sec].forEach(i=>{
    const o=document.createElement("option")
    o.value=i.name
    o.textContent=`${i.name} - $${i.price}`
    $('item').appendChild(o)
  })
}
populateItems($('section').value)
$('section').onchange=e=>populateItems(e.target.value)

/* ADD ITEM DROPDOWN POPUP */
let addContext=null

function openAddPopup(table,tag){
  addContext={table,tag}
  const secSel=$('addSection')
  secSel.innerHTML=""
  Object.keys(MENU).forEach(s=>{
    const o=document.createElement("option")
    o.value=s;o.textContent=s
    secSel.appendChild(o)
  })
  secSel.onchange=()=>populateAddItems(secSel.value)
  populateAddItems(secSel.value)
  $('addItemPopup').style.display="flex"
}

function populateAddItems(sec){
  const sel=$('addItem'); sel.innerHTML=""
  MENU[sec].forEach(i=>{
    const o=document.createElement("option")
    o.value=i.name
    o.textContent=`${i.name} - $${i.price}`
    sel.appendChild(o)
  })
}

$('addItemConfirm').onclick=()=>{
  const {table,tag}=addContext
  placeOrder({
    tableDescription:table.tableDescription,
    orderTag:tag.orderTag,
    section:$('addSection').value,
    item:$('addItem').value,
    qty:$('addQty').value
  })
  $('addItemPopup').style.display="none"
}

$('addItemCancel').onclick=()=> $('addItemPopup').style.display="none"

/* CORE */
function getPrice(s,i){return MENU[s].find(x=>x.name===i).price}
function snapshot(){ $('snapshot').textContent=JSON.stringify(posData,null,2)}

function placeOrder({tableDescription,orderTag,section,item,qty}){
  let table=posData.openOrders.find(t=>t.tableDescription===tableDescription)
  if(!table){ table={tableId:uid(),tableDescription,orders:[]}; posData.openOrders.push(table)}

  let tag=table.orders.find(o=>o.orderTag===orderTag)
  if(!tag){ tag={orderTagId:uid(),orderTag,items:[]}; table.orders.push(tag)}

  let ex=tag.items.find(i=>i.item===item)
  if(ex) ex.qty+=Number(qty)
  else tag.items.push({item,qty:Number(qty),price:getPrice(section,item)})
  render(); snapshot()
}

/* BUTTONS */
function addAddBtn(btns,table,tag){
  const b=document.createElement("button")
  b.className="btn-add-item"
  b.textContent="+"
  b.onclick=()=>openAddPopup(table,tag)
  btns.appendChild(b)
}

/* RENDER */
function render(){
  $('tables').innerHTML=""
  posData.openOrders.forEach(table=>{
    const box=document.createElement("div"); box.className="table-box"
    const title=document.createElement("div"); title.className="table-title"; title.textContent=table.tableDescription
    title.onclick=()=>{const n=prompt("Rename Table",table.tableDescription);if(n)table.tableDescription=n;render();snapshot()}
    box.appendChild(title)

    table.orders.forEach(tag=>{
      const ob=document.createElement("div"); ob.className="order-tag-box"
      const head=document.createElement("div"); head.className="tag-header"
      const span=document.createElement("span"); span.textContent=tag.orderTag

      const btns=document.createElement("div"); btns.className="tag-buttons"
      const pay=document.createElement("button"); pay.className="btn-pay"; pay.textContent="Pay"
      const cancel=document.createElement("button"); cancel.className="btn-cancel"; cancel.textContent="Cancel"
      const move=document.createElement("button"); move.className="btn-move"; move.textContent="Move"

      cancel.onclick=()=>{
        table.orders=table.orders.filter(o=>o!==tag)
        if(!table.orders.length)posData.openOrders=posData.openOrders.filter(t=>t!==table)
        render();snapshot()
      }

      move.onclick=()=>{
        const to=prompt("Move to table:")
        if(!to)return
        table.orders=table.orders.filter(o=>o!==tag)
        let target=posData.openOrders.find(t=>t.tableDescription===to)
        if(!target){ target={tableId:uid(),tableDescription:to,orders:[]}; posData.openOrders.push(target)}
        target.orders.push(tag)
        render();snapshot()
      }

      pay.onclick=()=>alert("Payment logic already wired")

      btns.append(move,cancel,pay)
      addAddBtn(btns,table,tag)

      head.append(span,btns)
      ob.appendChild(head)

      tag.items.forEach(i=>{
        const d=document.createElement("div")
        d.className="order-box"
        d.textContent=`${i.item} x${i.qty} - $${i.price}`
        ob.appendChild(d)
      })

      const total=tag.items.reduce((s,i)=>s+i.qty*i.price,0)
      const tot=document.createElement("div")
      tot.className="order-total"
      tot.textContent="Total: $"+total
      ob.appendChild(tot)

      box.appendChild(ob)
    })

    $('tables').appendChild(box)
  })
}

$('placeOrderBtn').onclick=()=>{
  if(!$('tableDesc').value.trim()) return alert("Table required")
  placeOrder({
    tableDescription:$('tableDesc').value,
    orderTag:$('orderTag').value,
    section:$('section').value,
    item:$('item').value,
    qty:$('qty').value
  })
}

snapshot()
render()
