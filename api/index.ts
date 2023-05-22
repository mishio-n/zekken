import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(req);
  res.status(200).json({
    message: "Hello world",
    cookies: req.cookies,
  });
}
