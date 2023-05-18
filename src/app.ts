import express from 'express';
import { parse } from "node-html-parser";

import { convert } from "html-to-text";

import cors from "cors"

const app = express();
const port = process.env.PORT || 8080;

const OLD_BASE_URL = "https://www.ovoenergy.com/help";
const NEW_BASE_URL = "https://moss-help-centre-ovotech.vercel.app/help/article";

const OLD_QUERY_SELECTOR =
  "#main-content div:nth-child(1) div:nth-child(2) div:nth-child(1) div:nth-child(3) div:nth-child(2)";
const NEW_QUERY_SELECTOR =
  "#__next div:nth-child(1) div:nth-child(2) div:nth-child(1) div:nth-child(1) div:nth-child(2)";

const OLD_IMAGE_SRC_REGEX =
  /https:\/\/www\.ovobyus\.com\/transform\/(?<srcId>[a-f0-9-]+)\/.*/;
const NEW_IMAGE_SRC_REGEX = /(?<srcId>[a-f0-9-]+)\.(jpeg|png)/;

app.use(cors())

app.get("/", async (req, res) => {
  const articleSlug = req.query.articleSlug as string;
  res.send({
    new: await getProcessedHtml(
      `${NEW_BASE_URL}/${articleSlug}`,
      NEW_QUERY_SELECTOR,
      NEW_IMAGE_SRC_REGEX
    ),
    old: await getProcessedHtml(
      `${OLD_BASE_URL}/${articleSlug}`,
      OLD_QUERY_SELECTOR,
      OLD_IMAGE_SRC_REGEX
    ),
  });
});

const getProcessedHtml = async (
  url: string,
  querySelector: string,
  imageSrcRegex: RegExp
) => {
  const html = await (await fetch(url)).text();

  const root = parse(html);

  const queryResult = root.querySelector(querySelector);

  const converted = convert(queryResult.innerHTML, {
    formatters: {
      fooBlockFormatter: function (elem, walk, builder, formatOptions) {
        const match = (elem.attribs.src as string).match(imageSrcRegex);
        builder.addInline(
          match
            ? `[ IMAGE ${match.groups.srcId} ]`
            : "<<<Unmatched image src>>>"
        );
      },
    },
    selectors: [
      {
        selector: "img",
        format: "fooBlockFormatter",
        options: { leadingLineBreaks: 1, trailingLineBreaks: 1 },
      },
    ],
  });

  return converted;
};

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
