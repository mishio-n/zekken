import type { VercelRequest, VercelResponse } from "@vercel/node";
import z from "zod";

enum ZekkenType {
  derby,
  classic,
  g1,
  g2,
  g3,
  listed,
  tokubetsu,
  normal,
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req;
  if (query === undefined) {
    return res.status(400).send("Bad request");
  }

  const name = z
    .string()
    .min(2, "名前は2 ~ 9文字です")
    .max(9, "名前は2 ~ 9文字です")
    .parse(query.name);

  const number = z
    .string()
    .transform((v) => +v)
    .parse(query.number);

  const type = z
    .nativeEnum(ZekkenType)
    // デフォルトは8大競争
    .default(ZekkenType.classic)
    .parse(query.type);

  const race = z.string().nullable().parse(query.race);

  res.status(200).json({
    message: "Hello world",
    name,
    number,
    type,
    race,
  });
}
