// Product photography generator. Run with: npm run images:generate
//
// Reads the prompt pack at docs/product-image-prompts.md and renders each
// product through Cloudflare Workers AI, writing the results into
// src/assets/images/ under the filenames the pack already specifies.
//
// The pack lives in docs/ rather than outputs/ because outputs/ is gitignored:
// it is for generated deliverables, and a source file this script cannot run
// without is not one. Left there, a fresh clone got a script with nothing to
// read.
//
// The pack is the single source of truth for prompts. Nothing is duplicated
// here — edit the markdown, re-run this, and the change takes effect. If the
// parse fails, this throws rather than silently generating from a partial pack.
//
// Why Workers AI: the free Workers plan allows 10,000 neurons per day, which is
// roughly 48 images a day at the default size. Cloudflare already hosts the
// site, so this adds no new vendor.
import sharp from 'sharp';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const PACK = resolve(REPO, 'docs/product-image-prompts.md');
const OUT_DIR = resolve(REPO, 'client/src/assets/images');

// Each model differs in wire format and price, so the differences live in one
// table rather than scattered through the request code.
//
// `multipart` models take form-data even for a plain text prompt, and are the
// only ones that accept width/height. flux-1-schnell takes JSON and has no size
// parameter at all — its output size is fixed — so it cannot satisfy the pack's
// 1400px requirement. It is kept here only as a cheap draft option.
//
// Neuron rates are from developers.cloudflare.com/workers-ai/platform/pricing/
// (read 2026-08-16). They are used for the budget estimate printed at the end.
const MODELS = {
  'klein-4b': {
    id: '@cf/black-forest-labs/flux-2-klein-4b',
    wire: 'multipart',
    sizeable: true,
    neurons: ({ width, height }) => tiles(width, height) * 26.05,
  },
  'klein-9b': {
    id: '@cf/black-forest-labs/flux-2-klein-9b',
    wire: 'multipart',
    sizeable: true,
    // Priced per megapixel: 1363.64 for the first, 181.82 for each after.
    neurons: ({ width, height }) => {
      const mp = (width * height) / 1_000_000;
      return 1363.64 + Math.max(0, mp - 1) * 181.82;
    },
  },
  schnell: {
    id: '@cf/black-forest-labs/flux-1-schnell',
    wire: 'json',
    sizeable: false,
    neurons: () => tiles(1024, 1024) * 4.8 + 4 * 9.6,
  },
};

// Cloudflare bills image models per 512x512 tile, rounding up to cover the
// whole frame.
const tiles = (width, height) => Math.ceil(width / 512) * Math.ceil(height / 512);

// Bare-bones flag parsing. `--flag value` and `--flag` both work; anything
// unrecognised is rejected so a typo fails loudly instead of being ignored.
const parseArgs = (argv) => {
  const known = ['only', 'model', 'reference', 'seed', 'size', 'dry-run', 'force'];
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const name = token.slice(2);
    if (!known.includes(name)) throw new Error(`Unknown flag: ${token}`);

    const next = argv[i + 1];
    // Boolean flags are the ones with no value following them.
    if (next === undefined || next.startsWith('--')) {
      args[name] = true;
    } else {
      args[name] = next;
      i += 1;
    }
  }

  return args;
};

// The pack's structure is stable: one "## House style" section holding a single
// ```text fence, then one "### N. Name — `file.jpg`" heading per product, each
// followed by its own fence. Headings 7 and 8 carry a trailing italic note,
// which the pattern deliberately ignores.
const parsePack = (markdown) => {
  const house = markdown.match(/## House style[^\n]*\n+```text\n([\s\S]*?)```/);
  if (!house) throw new Error('No "## House style" block found in the prompt pack.');

  const pattern = /### \d+\.\s*(.+?)\s*—\s*`([^`]+)`[^\n]*\n+```text\n([\s\S]*?)```/g;
  const subjects = [...markdown.matchAll(pattern)].map(([, name, file, body]) => ({
    name: name.trim(),
    file: file.trim(),
    body: body.trim(),
  }));

  if (subjects.length === 0) throw new Error('No subject blocks found in the prompt pack.');

  return { house: house[1].trim(), subjects };
};

// One prompt is the fixed house style followed by the product's own subject
// line. Keeping the order fixed is what makes the eight shots read as one
// catalogue rather than eight unrelated photographs.
const buildPrompt = (house, subject) => `${house}\n\n${subject}`;

// Reference images must be under 512x512 per Cloudflare's docs. Style matching
// does not need detail, so downscaling loses nothing that matters.
const loadReference = async (path) => {
  const buffer = await sharp(path)
    .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();

  return new Blob([buffer], { type: 'image/jpeg' });
};

const generate = async ({ model, prompt, width, height, seed, reference, account, token }) => {
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model.id}`;
  const headers = { Authorization: `Bearer ${token}` };
  let body;

  if (model.wire === 'multipart') {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('width', String(width));
    form.append('height', String(height));
    if (seed !== undefined) form.append('seed', String(seed));
    // The anchor shot, when one is supplied, so later products inherit its
    // lighting and surface instead of only being described the same way.
    if (reference) form.append('input_image_0', reference, 'reference.jpg');
    body = form;
    // Content-Type is deliberately not set: fetch adds it with the multipart
    // boundary, and setting it by hand produces a boundary-less header the
    // server cannot parse.
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ prompt, steps: 4, ...(seed !== undefined && { seed }) });
  }

  const response = await fetch(url, { method: 'POST', headers, body });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Workers AI returned ${response.status}: ${detail.slice(0, 400)}`);
  }

  // The image models are inconsistent: some return the raw JPEG bytes, others
  // wrap a base64 string in the standard API envelope. Branch on what actually
  // came back rather than assuming per-model.
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    if (payload.success === false) {
      throw new Error(`Workers AI error: ${JSON.stringify(payload.errors)}`);
    }
    const encoded = payload.result?.image;
    if (!encoded) throw new Error(`No image in response: ${JSON.stringify(payload).slice(0, 300)}`);
    return Buffer.from(encoded, 'base64');
  }

  return Buffer.from(await response.arrayBuffer());
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  // Credentials come from the environment. A .env is loaded when present so the
  // token never has to be pasted into a shell that keeps history.
  //
  // The repo root is tried first and is the recommended home: client/.env sits
  // inside the directory Vite loads env files from, and while an unprefixed
  // variable is never bundled, a rename to VITE_* would ship the token to every
  // browser. client/.env is still accepted, because failing over the location of
  // a config file helps nobody. Both are covered by .gitignore.
  for (const candidate of ['.env', 'client/.env']) {
    try {
      process.loadEnvFile(resolve(REPO, candidate));
      break;
    } catch {
      // Missing is fine — try the next, or fall back to already-exported vars.
    }
  }

  const model = MODELS[args.model ?? 'klein-4b'];
  if (!model) throw new Error(`Unknown model. Choose one of: ${Object.keys(MODELS).join(', ')}`);

  // The site crops square on cards and in the gallery, and vite-imagetools only
  // resizes downward, so the master needs to be comfortably larger than any
  // rendered size.
  const [width, height] = (args.size ?? '1400x1400').split('x').map(Number);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('--size must look like 1400x1400');
  }
  if (!model.sizeable && args.size) {
    throw new Error(`${model.id} has no width/height parameter — its output size is fixed.`);
  }

  const { house, subjects } = parsePack(await readFile(PACK, 'utf8'));
  const wanted = args.only ? subjects.filter((s) => s.file === args.only) : subjects;

  if (wanted.length === 0) {
    throw new Error(`No subject matches --only ${args.only}. Known: ${subjects.map((s) => s.file).join(', ')}`);
  }

  const estimate = model.neurons({ width, height }) * wanted.length;
  console.log(`${model.id}  ${width}x${height}  ${wanted.length} image(s)`);
  console.log(`Estimated cost: ~${Math.round(estimate)} neurons of the 10,000/day free allocation.\n`);

  if (args['dry-run']) {
    wanted.forEach((subject) => {
      console.log(`--- ${subject.name} → ${subject.file} ---`);
      console.log(buildPrompt(house, subject.body));
      console.log();
    });
    return;
  }

  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (see the README section in this file).');
  }

  await mkdir(OUT_DIR, { recursive: true });
  // Resolved against the working directory, so a path typed at the prompt means
  // what it looks like it means.
  const reference = args.reference ? await loadReference(resolve(process.cwd(), args.reference)) : undefined;

  // Sequential on purpose. Running eight at once would race the rate limiter,
  // and a failure halfway through is easier to read one line at a time.
  for (const subject of wanted) {
    const target = resolve(OUT_DIR, subject.file);

    if (!args.force && (await exists(target))) {
      console.log(`skip   ${subject.file}  (already exists — pass --force to replace)`);
      continue;
    }

    try {
      const image = await generate({
        model,
        prompt: buildPrompt(house, subject.body),
        width,
        height,
        seed: args.seed === undefined ? undefined : Number(args.seed),
        reference,
        account,
        token,
      });

      await writeFile(target, image);
      console.log(`wrote  ${subject.file}  ${(image.length / 1024).toFixed(0)} kB  — ${subject.name}`);
    } catch (error) {
      // One bad product should not abandon the other seven.
      console.error(`FAILED ${subject.file}: ${error.message}`);
    }
  }
};

await main();
