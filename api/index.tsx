import type { VercelRequest, VercelResponse } from "@vercel/node";
import { match } from "ts-pattern";
import fs from "node:fs/promises";
import satori from "satori";
import z, { ZodError } from "zod";
import React from "react";

const zekkenType = [
  "derby",
  "classic",
  "g1",
  "g2",
  "g3",
  "listed",
  "tokubetsu",
  "normal",
] as const;
type ZekkenType = typeof zekkenType[number];

const ZENKANKU_KANA = [
  "ア",
  "イ",
  "ウ",
  "エ",
  "オ",
  "カ",
  "キ",
  "ク",
  "ケ",
  "コ",
  "サ",
  "シ",
  "ス",
  "セ",
  "ソ",
  "タ",
  "チ",
  "ツ",
  "テ",
  "ト",
  "ナ",
  "ニ",
  "ヌ",
  "ネ",
  "ノ",
  "ハ",
  "ヒ",
  "フ",
  "ヘ",
  "ホ",
  "マ",
  "ミ",
  "ム",
  "メ",
  "モ",
  "ヤ",
  "ユ",
  "ヨ",
  "ラ",
  "リ",
  "ル",
  "レ",
  "ロ",
  "ワ",
  "ヲ",
  "ン",
  "ガ",
  "ギ",
  "グ",
  "ゲ",
  "ゴ",
  "ザ",
  "ジ",
  "ズ",
  "ゼ",
  "ゾ",
  "ダ",
  "ヂ",
  "ヅ",
  "デ",
  "ド",
  "バ",
  "ビ",
  "ブ",
  "ベ",
  "ボ",
  "パ",
  "ピ",
  "プ",
  "ペ",
  "ポ",
  "ャ",
  "ュ",
  "ョ",
  "ッ",
  "ヮ",
  "ヴ",
  "ー",
];

const theme = {
  derby: {
    backgroundColor: "rgb(250,250,250)",
    fontColor: "black",
  },
  classic: {
    backgroundColor: "rgb(0,8,138)",
    fontColor: "rgb(255,196,49)",
  },
  g1: {
    backgroundColor: "rgb(0,8,138)",
    fontColor: "white",
  },
  g2: {
    backgroundColor: "rgb(144,0,27)",
    fontColor: "white",
  },
  g3: {
    backgroundColor: "rgb(0,91,48)",
    fontColor: "white",
  },
  listed: {
    backgroundColor: "black",
    fontColor: "rgb(255,196,49)",
  },
  tokubetsu: {
    backgroundColor: "black",
    fontColor: "white",
  },
  normal: {
    backgroundColor: "rgb(250,250,250)",
    fontColor: "black",
  },
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req;

  if (query.name === undefined || query.number === undefined) {
    return res.status(400).send("nameとnumberは必須です");
  }

  try {
    const name = z
      .string()
      .min(2, "名前は2 ~ 9文字です")
      .max(9, "名前は2 ~ 9文字です")
      .refine((v) => {
        return [...v].every((c) => ZENKANKU_KANA.includes(c));
      }, "名前は全角カタカナのみ使用可能です")
      .parse(query.name);

    const number = z
      .string()
      .refine((v) => {
        return !isNaN(+v);
      }, "ゼッケン番号は半角数字のみ使用可能です")
      .transform((v) => +v)
      .parse(query.number);

    const type: ZekkenType = z
      .string()
      .refine((v): v is ZekkenType => {
        return zekkenType.includes(v as any);
      })
      // デフォルトは8大競争
      .default("g1")
      .parse(query.type);

    const [robotBold, notoSansJPBlack] = await Promise.all([
      fs.readFile("./assets/Oxygen-Bold-Number.woff"),
      fs.readFile("./assets/NotoSansJP-Black_ZenkakuKana.woff"),
    ]);

    const svg = await satori(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 200,
          height: 160,
          padding: 20,
          backgroundColor: theme[type].backgroundColor,
          clipPath: "polygon(3% 0%, 115% 0%, 120% 100%, 10% 100%, 0% 75%)",
        }}
      >
        <p
          style={{
            color: theme[type].fontColor,
            marginLeft: number > 9 ? 70 : 100,
            marginTop: -35,
            fontSize: 100,
            fontWeight: 700,
            textAlign: "start",
            fontFamily: "Roboto",
          }}
        >
          {number}
        </p>
        <p
          style={{
            color: theme[type].fontColor,
            fontWeight: 900,
            marginTop: match(name.length)
              .with(2, () => 70)
              .with(3, () => 70)
              .with(4, () => 75)
              .with(5, () => 75)
              .with(6, () => 75)
              .with(9, () => 100)
              .otherwise(() => 80),
            marginLeft:
              name.length === 9
                ? 5
                : name.length < 5
                ? 100 - (name.length - 2) * 30
                : 12 * (8 - name.length),
            fontSize: match(name.length)
              .with(2, () => 24)
              .with(3, () => 24)
              .with(4, () => 22)
              .with(5, () => 22)
              .with(6, () => 22)
              .with(9, () => 17)
              .otherwise(() => 20),
            textAlign: "end",
            fontFamily: "Noto Sans JP",
          }}
        >
          {name.length < 5 ? name.split("").join("  ") : name}
        </p>
      </div>,
      {
        width: 200,
        height: 160,
        fonts: [
          {
            name: "Roboto",
            data: robotBold,
            weight: 700,
            style: "normal",
          },
          {
            name: "Noto Sans JP",
            data: notoSansJPBlack,
            weight: 900,
            style: "normal",
          },
        ],
      }
    );

    res.setHeader("Content-Type", "image/svg+xml;charset=utf-8");
    res.status(200).send(svg);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(error.issues[0].message);
    } else {
      return res.status(500).send("サーバーエラーが発生しました");
    }
  }
}
