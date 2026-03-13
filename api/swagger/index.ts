import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const swagger = {

  openapi:"3.0.0",

  info:{
   title:"WhatsApp Banking API",
   version:"1.0.0",
   description:"Infobip WhatsApp banking endpoints"
  },

  servers:[
   {
    url:"https://whatsapp-banking-api.vercel.app"
   }
  ],

  paths:{

/*
REGISTER
*/

"/api/whatsapp":{

post:{

 summary:"Register User",

 parameters:[
  {
   name:"action",
   in:"query",
   required:true,
   schema:{
    type:"string",
    example:"register"
   }
  }
 ],

 requestBody:{
  required:true,
  content:{
   "application/json":{
    schema:{
     type:"object",
     properties:{
      phone:{
       type:"string",
       example:"2348012345678"
      },
      name:{
       type:"string",
       example:"John Doe"
      }
     }
    }
   }
  }
 },

 responses:{
  "200":{
   description:"User registered"
  }
 }

}

},

/*
BALANCE
*/

"/api/whatsapp?action=balance":{

post:{

 summary:"Check Balance",

 requestBody:{
  content:{
   "application/json":{
    example:{
     phone:"2348012345678"
    }
   }
  }
 },

 responses:{
  "200":{
   description:"Balance returned"
  }
 }

}

},

/*
BANK LIST
*/

"/api/whatsapp?action=banks":{

post:{
 summary:"List supported banks"
}

},

/*
ACCOUNT NAME
*/

"/api/whatsapp?action=account-name":{

post:{
 summary:"Resolve account name",

 requestBody:{
  content:{
   "application/json":{
    example:{
     accountNumber:"0123456789"
    }
   }
  }
 }

}

},

/*
REQUEST TRANSFER
*/

"/api/whatsapp?action=request-transfer":{

post:{

 summary:"Request Transfer (generate OTP)",

 requestBody:{
  content:{
   "application/json":{
    example:{
     phone:"2348012345678",
     fromAccount:"0123456789",
     toAccount:"0987654321",
     amount:5000
    }
   }
  }
 }

}

},

/*
CONFIRM TRANSFER
*/

"/api/whatsapp?action=confirm-transfer":{

post:{

 summary:"Confirm Transfer with OTP",

 requestBody:{
  content:{
   "application/json":{
    example:{
     phone:"2348012345678",
     otp:"123456"
    }
   }
  }
 }

}

},

/*
RECEIPT
*/

"/api/whatsapp?action=receipt":{

post:{

 summary:"Generate transfer receipt",

 requestBody:{
  content:{
   "application/json":{
    example:{
     amount:5000,
     toAccount:"0987654321"
    }
   }
  }
 }

}

}

}

 }

 res.json(swagger)

}