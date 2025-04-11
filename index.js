import { delay } from "es-toolkit";
import { sort } from "fast-sort";
import { formatNumber } from "intl-number-helper";
import json2md from "json2md";
import fs from "node:fs";

const dataPath = "data";

const fetchData = async (
  input,
  { responseType = "json", delayMs = 3000 } = {}
) => {
  await delay(delayMs);

  return await (await fetch(`https://context7.com/${input}`))[responseType]();
};

const projects = sort(await fetchData("api/projects")).asc(
  ({ settings }) => settings.title
);

fs.writeFileSync(
  "readme.md",
  json2md({
    img: { source: "favicon.ico" },
    table: {
      headers: ["#", "NAME", "REPO", "TOKENS", "SNIPPETS", "UPDATE", "STATE"],
      rows: projects.map(({ settings, version }, index) => [
        index + 1,
        `<a href='${dataPath}/${settings.project}.txt'>${settings.title}</a>`,
        `<a href='${settings.docsRepoUrl}'>${settings.project}</a>`,
        formatNumber(version.totalTokens),
        formatNumber(version.totalSnippets),
        version.lastUpdate,
        `<img src='${
          // https://github.com/upstash/context7?tab=readme-ov-file#project-states
          {
            finalized: "icons/completed-icon.svg",
            initial: "icons/processing-icon.svg",
            error: "icons/error-icon.svg",
          }[version.state]
        }'/>`,
      ]),
    },
  })
);

fs.rmSync(dataPath, {
  recursive: true,
  force: true,
});

fs.mkdirSync(dataPath);

for (const { settings, version } of projects)
  fs.writeFileSync(
    `${dataPath}/${settings.project}.txt`,
    await fetchData(
      `${settings.project}/llm.txt?tokens=${version.totalTokens}`,
      {
        responseType: "text",
        delayMs: 30000,
      }
    )
  );
