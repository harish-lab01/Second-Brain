/**
 * Markdown Importer Utility
 *
 * Parses .md files from Notion exports, Obsidian vaults, or plain markdown.
 * Strips YAML front matter and returns { title, content }.
 */

/**
 * Parse a single .md file's text into { title, content }.
 * - If YAML front matter has a `title` field, use it.
 * - Otherwise, use the first # heading or the filename.
 */
export function parseMarkdownFile(text, filename = '') {
  let body = text;
  let title = '';

  // Strip YAML front matter (--- ... ---)
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    const fm = fmMatch[1];
    body = text.slice(fmMatch[0].length).trim();

    // Extract title from front matter
    const titleLine = fm.split('\n').find(l => l.match(/^title\s*:/i));
    if (titleLine) {
      title = titleLine.replace(/^title\s*:\s*/i, '').replace(/['"]/g, '').trim();
    }
  }

  // If no front matter title, use first # heading
  if (!title) {
    const h1 = body.match(/^#\s+(.+)/m);
    if (h1) {
      title = h1[1].trim();
      // Remove the heading line from body so it's not duplicated
      body = body.replace(/^#\s+.+\n?/m, '').trim();
    }
  }

  // Fall back to filename without extension
  if (!title) {
    title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ').trim() || 'Imported Note';
  }

  return { title, content: body.trim() };
}

/**
 * Read a File object and return its text content.
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Process an array of .md File objects into parsed note objects.
 * Returns [{ title, content, filename }]
 */
export async function processMarkdownFiles(files) {
  const results = [];
  for (const file of files) {
    if (!file.name.match(/\.md$/i)) continue;
    try {
      const text = await readFileAsText(file);
      const { title, content } = parseMarkdownFile(text, file.name);
      results.push({ title, content, filename: file.name });
    } catch (err) {
      console.warn(`Skipping ${file.name}:`, err.message);
    }
  }
  return results;
}
