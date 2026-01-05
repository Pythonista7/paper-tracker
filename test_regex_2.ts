
function extractArxivId(url: string): string | null {
  const cleanUrl = url.split('?')[0].replace(/\.pdf$/, '');
  const regex = /arxiv\.org\/(?:abs|pdf)\/((?:[\w-]+\/)?[\d.]+(?:v\d+)?)/;
  const match = cleanUrl.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\.$/, '');
  }
  return null;
}

const urls = [
  "arxiv.org/abs/2103.14030",
  "www.arxiv.org/abs/2103.14030",
  "https://arxiv.org/abs/2103.14030",
];

urls.forEach(url => {
  console.log(`${url} -> ${extractArxivId(url)}`);
});
