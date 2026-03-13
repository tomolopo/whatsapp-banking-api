import { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const filePath = path.join(process.cwd(),"swagger.yaml")

 const file = fs.readFileSync(filePath,"utf8")

 res.setHeader("Content-Type","text/yaml")

 res.status(200).send(file)

}