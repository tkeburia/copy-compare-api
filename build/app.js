"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_html_parser_1 = require("node-html-parser");
const html_to_text_1 = require("html-to-text");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
const OLD_BASE_URL = "https://www.ovoenergy.com/help";
const NEW_BASE_URL = "https://moss-help-centre-ovotech.vercel.app/help/article";
const OLD_QUERY_SELECTOR = "#main-content div:nth-child(1) div:nth-child(2) div:nth-child(1) div:nth-child(3) div:nth-child(2)";
const NEW_QUERY_SELECTOR = "#__next div:nth-child(1) div:nth-child(2) div:nth-child(1) div:nth-child(1) div:nth-child(2)";
const OLD_IMAGE_SRC_REGEX = /https:\/\/www\.ovobyus\.com\/transform\/(?<srcId>[a-f0-9-]+)\/.*/;
const NEW_IMAGE_SRC_REGEX = /(?<srcId>[a-f0-9-]+)\.(jpeg|png)/;
app.use((0, cors_1.default)());
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const articleSlug = req.query.articleSlug;
    res.send({
        new: yield getProcessedHtml(`${NEW_BASE_URL}/${articleSlug}`, NEW_QUERY_SELECTOR, NEW_IMAGE_SRC_REGEX),
        old: yield getProcessedHtml(`${OLD_BASE_URL}/${articleSlug}`, OLD_QUERY_SELECTOR, OLD_IMAGE_SRC_REGEX),
    });
}));
const getProcessedHtml = (url, querySelector, imageSrcRegex) => __awaiter(void 0, void 0, void 0, function* () {
    const html = yield (yield fetch(url)).text();
    const root = (0, node_html_parser_1.parse)(html);
    const queryResult = root.querySelector(querySelector);
    const converted = (0, html_to_text_1.convert)(queryResult.innerHTML, {
        formatters: {
            fooBlockFormatter: function (elem, walk, builder, formatOptions) {
                const match = elem.attribs.src.match(imageSrcRegex);
                builder.addInline(match
                    ? `[ IMAGE ${match.groups.srcId} ]`
                    : "<<<Unmatched image src>>>");
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
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
