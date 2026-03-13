import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const format = req.query.format

/*
----------------------------------
Return Swagger JSON
----------------------------------
*/

 if(format === "json"){

  return res.json({

   openapi:"3.0.0",

   info:{
    title:"WhatsApp Banking API",
    version:"1.0.0"
   },

   servers:[
    {
     url:"https://whatsapp-banking-api.vercel.app"
    }
   ],

   paths:{

/*
ADMIN
*/

"/api/admin":{

 get:{
  summary:"Admin API",
  parameters:[
   {
    name:"resource",
    in:"query",
    schema:{type:"string"},
    example:"accounts"
   }
  ]
 }

},

/*
WHATSAPP ROUTER
*/

"/api/whatsapp":{

 post:{

  summary:"WhatsApp Banking Endpoint",

  parameters:[
   {
    name:"action",
    in:"query",
    required:true,
    schema:{
     type:"string",
     enum:[
      "balance",
      "transfer",
      "history"
     ]
    }
   }
  ]

 }

},

/*
WEBHOOK
*/

"/api/webhook":{

 post:{

  summary:"Webhook Handler",

  parameters:[
   {
    name:"action",
    in:"query",
    schema:{
     type:"string",
     enum:[
      "infobip",
      "events",
      "dispatch"
     ]
    }
   }
  ]

 }

}

   }

  })

 }

/*
----------------------------------
Swagger UI Page
----------------------------------
*/

 res.setHeader("Content-Type","text/html")

 res.send(`

<!DOCTYPE html>
<html>

<head>

<link rel="stylesheet"
href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"/>

</head>

<body>

<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>

<script>

SwaggerUIBundle({

 url:"/api/docs?format=json",

 dom_id:"#swagger-ui"

})

</script>

</body>

</html>

 `)

}