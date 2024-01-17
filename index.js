const mysql = require('mysql2');
const express = require('express');
const crypto = require('crypto');

const app = express();

app.use(express.json());


const db = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'',
    database:''
})

app.get('/',(req,res)=>{
    res.json({"good":"hi"});
})



//task 1 

app.get('/api/person',(req,res) => {
    
        db.query('SELECT * FROM person',(err,result) => {
            if(err){
                console.log(err);
               return  res.status(500).json({error:"Internal Server Error"});
            }
            
               return  res.status(201).json({result});
            
        })
    
})

app.get('/api/person/:id',(req,res)=>{
    let id = req.params.id;
    db.query('select * from person where party_id=?', [id], (err,result)=>{
        if(err){
            console.log(err);
           return  res.status(500).json({error:"Internal Server Error"});
        }
       
          return   res.status(201).json({result});
        
    })

})



app.post('/api/person',(req,res) => {
    const data = req.body;
    db.query('INSERT INTO person SET ?',[data],(err,result) => {
        if(err){
            console.log(err);
          return   res.status(500).json({error:"Internal Server Error"});
        }
        
           return  res.status(201).json({msg:"Data Inserted Successfully", data:result });
    
    })
})


//order 

//task 2 
app.post('/api/order',(req,res) => {

    let {
        order_name,
        placed_date,
        approved_date,
        status_id,
        party_id,
        currency_uom_id,
        product_store_id,
        sales_channel_enum_id,
        grand_total,
        completed_date} = req.body;
        
        if(!order_name || !placed_date){
            res.status(400).json({err:"OrderName and PlacedDate both are mandatory "})
        }
        if(!currency_uom_id ||currency_uom_id==undefined ){
            currency_uom_id="USD";
        }
        if(!status_id || status_id==undefined){
            status_id="OrderPlaced";
        }
        //foregin key constraint 
        db.query('Select * from party where party_id = ?',[party_id],(err,result) => {
            if(err){
               return  res.status(500).json({err:"Internal Server Error"});
            }
            else{
               
                const order_id = crypto.randomBytes(10).toString("hex");

                //console.log(restToken);
                const insertorder = `INSERT INTO order_header (order_id,
                    order_name,
                    placed_date,
                    approved_date,
                    status_id,
                    party_id,
                    currency_uom_id,
                    product_store_id,
                    sales_channel_enum_id,
                    grand_total,
                    completed_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                const values = [
                    order_id,
                    order_name,
                    placed_date,
                    approved_date,
                    status_id,
                    party_id,
                    currency_uom_id,
                    product_store_id,
                    sales_channel_enum_id,
                    grand_total,
                    completed_date]
                db.query(insertorder,values,(err,result) => {
                    if(err){
                        console.log(err);
                        return res.status(500).json({error:"Internal Server Error"});
                    }
                    
                      return   res.status(201).json({order_id, message :"items inserted successfully "});
                    
                })
            }
        })
})

app.get('/api/order',(req,res) => {
        db.query(`SELECT *,(SELECT JSON_ARRAYAGG( JSON_OBJECT(
            'order_item_seq_id', oi.order_item_seq_id,
            'product_id', oi.product_id,
            'item_description', oi.item_description,
            'quantity', oi.quantity,
            'unit_amount', oi.unit_amount,
            'item_type_enum_id', oi.item_type_enum_id
        )
    )
FROM order_item oi
    WHERE
    oi.order_id = order_header.order_id
) AS order_items from order_header`,(err,result) => {

    // particular order id se kitne order item jude  h 
        if(err){
            console.log(err);
           return  res.status(500).json({error:"Internal Server Error"});
        }
        
          return   res.status(201).json({result});
        
    })
})
// specfic order id k corresponding 
app.get('/api/order/:order_id',(req,res) => {
    const {order_id} = req.params;
    db.query(`SELECT *,(SELECT JSON_ARRAYAGG( JSON_OBJECT(
            'order_item_seq_id', oi.order_item_seq_id,
            'product_id', oi.product_id,
            'item_description', oi.item_description,
            'quantity', oi.quantity,
            'unit_amount', oi.unit_amount,
            'item_type_enum_id', oi.item_type_enum_id
        )
    )
FROM order_item oi
    WHERE
    oi.order_id = order_header.order_id
) AS order_items from order_header where order_id=?`,[order_id],(err,result) => {
        if(err){
            console.log(err);
          return   res.status(500).json({error:"Internal Server Error"});
        }
        
           return  res.status(201).json({order_items:result});
        
    })
})

app.post('/api/order/:order_id',(req,res) => {
    const {order_id} = req.params;
    let {
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id
    } = req.body;
    if(!order_item_seq_id || !product_id || !item_description || !quantity || !unit_amount || !item_type_enum_id){
        res.status.apply(400).json({msg:"Provide Complete Data"});
    }
    const insertorderitem = `INSERT INTO order_item (order_id,
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id) VALUES (?,?,?,?,?,?,?)`;
    const values = [
        order_id,
        order_item_seq_id,
        product_id,
        item_description,
        quantity,
        unit_amount,
        item_type_enum_id];
    db.query(insertorderitem,values,(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            res.status(201).json({order_id,order_item_seq_id});
        }
    })
})


app.put('/api/order/:order_id',(req,res) => {
    let {order_name} = req.body;
    const {order_id} = req.params;
    db.query('UPDATE order_header SET order_name = ? WHERE order_id = ?',[order_name,order_id],(err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({error:"Internal Server Error"});
        }
        else{
            db.query('SELECT * from order_header WHERE order_id = ?',[order_id],(err,result) => {
                if(err){
                    res.status(500).json({error:"Internal Server Error"});
                }
                else{
                    res.status(200).json({order_header:result});
                }
        })
    }
    })
})

app.listen(5050,()=>{
    console.log(`Server working on Port: 5050`);
})







