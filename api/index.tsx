import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "node:fs/promises";
import satori from "satori";
import z from "zod";
import React from "react";

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

const regular = await fs.readFile("public/Roboto-Regular.ttf");

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  res.setHeader("Content-Type", "image/svg+xml;charset=utf-8");

  const svg = await satori(<div style={{ color: "red" }}>{name}</div>, {
    width: 48,
    height: 16,
    fonts: [
      {
        name: "Roboto",
        data: regular,
        weight: 400,
        style: "normal",
      },
    ],
  });

  res.status(200).send(svg);
}
