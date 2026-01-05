
const xml = `
<feed xmlns="http://www.w3.org/2005/Atom">
  <link href="http://arxiv.org/api/query?search_query%3D%26id_list%3D2103.14030%26start%3D0%26max_results%3D10" rel="self" type="application/atom+xml"/>
  <title type="html">ArXiv Query: search_query=&amp;id_list=2103.14030&amp;start=0&amp;max_results=10</title>
  <id>http://arxiv.org/api/aH4F+5y+5y+5y</id>
  <updated>2021-03-25T17:50:00Z</updated>
  <opensearch:totalResults xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">1</opensearch:totalResults>
  <opensearch:startIndex xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">0</opensearch:startIndex>
  <opensearch:itemsPerPage xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">10</opensearch:itemsPerPage>
  <entry>
    <id>http://arxiv.org/abs/2103.14030v1</id>
    <updated>2021-03-25T17:50:00Z</updated>
    <published>2021-03-25T17:50:00Z</published>
    <title>Attention Is All You Need</title>
    <summary>The dominant sequence transduction models are based on complex recurrent or
convolutional neural networks that include an encoder and a decoder. The best
performing models also connect the encoder and decoder through an attention
mechanism. We propose a new simple network architecture, the Transformer,
based solely on attention mechanisms, dispensing with recurrence and convolutions
entirely.</summary>
    <author>
      <name>Ashish Vaswani</name>
    </author>
    <author>
      <name>Noam Shazeer</name>
    </author>
    <arxiv:comment xmlns:arxiv="http://arxiv.org/schemas/atom">Comment text</arxiv:comment>
    <link href="http://arxiv.org/abs/2103.14030v1" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/2103.14030v1" rel="related" type="application/pdf"/>
    <arxiv:primary_category xmlns:arxiv="http://arxiv.org/schemas/atom" term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.CL" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.LG" scheme="http://arxiv.org/schemas/atom"/>
  </entry>
</feed>
`;

function parseArxivXml(xml: string) {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch) return null;
  const entry = entryMatch[1];

  const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

  const authorMatches = entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g);
  const authors = Array.from(authorMatches).map(m => m[1].trim()).join(', ');

  const categories: string[] = [];
  const catRegex = /<category[^>]*term="([^"]*)"/g;
  let catMatch;
  while ((catMatch = catRegex.exec(entry)) !== null) {
      categories.push(catMatch[1]);
  }

  return {
    title,
    abstract,
    authors,
    tags: categories
  };
}

console.log(parseArxivXml(xml));
