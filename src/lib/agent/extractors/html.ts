import * as cheerio from "cheerio";

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer elements
  $("script, style, nav, footer, header").remove();

  // Get main content areas
  const mainContent =
    $("main, article, .content, #content, .page-content").text() ||
    $("body").text();

  // Clean up whitespace
  return mainContent
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

export function extractTablesFromHtml(
  html: string
): Array<{ headers: string[]; rows: string[][] }> {
  const $ = cheerio.load(html);
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];

  $("table").each((_, tableEl) => {
    const headers: string[] = [];
    const rows: string[][] = [];

    $(tableEl)
      .find("thead tr th, tr:first-child th")
      .each((_, th) => {
        headers.push($(th).text().trim());
      });

    $(tableEl)
      .find("tbody tr, tr:not(:first-child)")
      .each((_, tr) => {
        const row: string[] = [];
        $(tr)
          .find("td")
          .each((_, td) => {
            row.push($(td).text().trim());
          });
        if (row.length > 0) rows.push(row);
      });

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  return tables;
}
