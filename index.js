import { delay } from "es-toolkit";
import { sort } from "fast-sort";
import json2md from "json2md";
import fs from "node:fs";

const f = async (input, { responseType = "json", delayMs = 3000 } = {}) => {
  await delay(delayMs);

  return await (await fetch(`https://context7.com/${input}`))[responseType]();
};

(async () => {
  const projects = sort(await f("api/projects")).asc(
    ({ settings }) => settings.title
  );

  fs.writeFileSync(
    "readme.md",
    json2md({
      table: {
        headers: ["#", "NAME", "TOKENS", "SNIPPETS", "UPDATE", "STATE"],
        rows: projects.map(({ settings, version }, index) => [
          index + 1,
          `<a href='data/${settings.project}.txt'>${settings.title}</a>`,
          version.totalTokens,
          version.totalSnippets,
          version.lastUpdate,
          version.state.toUpperCase(),
        ]),
      },
    })
  );

  fs.rmSync("data", {
    recursive: true,
    force: true,
  });

  fs.mkdirSync("data");

  for (const { settings } of projects) {
    fs.writeFileSync(
      `data/${settings.project}.txt`,
      await f(
        `${settings.project}/llm.txt?tokens=999999999999999999999999999999999`,
        {
          responseType: "text",
          delayMs: 20000,
        }
      )
    );
  }
})();
