import * as cheerio from "cheerio";

interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
}

export async function getOpenGraphDataQuery(
  url: string,
): Promise<OpenGraphData | null> {
  const userAgent = "Mozilla/5.0 (compatible; MySuperTool)";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
      // mode: 'no-cors'
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const ogData: OpenGraphData = {
      title: $('meta[property="og:title"]').attr("content") ||
        $("title").text() || "",
      description: $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") || "",
      image: $('meta[property="og:image"]').attr("content") || "",
      url: $('meta[property="og:url"]').attr("content") || url,
      siteName: $('meta[property="og:site_name"]').attr("content") || "",
    };

    console.log("ogData", ogData);
    return ogData;
  } catch (error) {
    console.error("Error fetching Open Graph data:", error);
    return null;
  }
}
