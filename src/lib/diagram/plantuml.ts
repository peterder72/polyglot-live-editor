import { deflateRaw } from 'pako';
import { env } from '$lib/util/env';
import type { DiagramAssetUrls, DiagramEngine } from './types';
import { plantumlSamples } from './samples/plantumlSamples';

const PLANTUML_DEFAULT_SERVER = 'https://www.plantuml.com/plantuml';

const encode6bit = (b: number) => {
  if (b < 10) {
    return String.fromCharCode(48 + b);
  }
  b -= 10;
  if (b < 26) {
    return String.fromCharCode(65 + b);
  }
  b -= 26;
  if (b < 26) {
    return String.fromCharCode(97 + b);
  }
  b -= 26;
  if (b === 0) {
    return '-';
  }
  if (b === 1) {
    return '_';
  }
  return '?';
};

const append3bytes = (b1: number, b2: number, b3: number) => {
  let r = '';
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  r += encode6bit(c1 & 0x3f);
  r += encode6bit(c2 & 0x3f);
  r += encode6bit(c3 & 0x3f);
  r += encode6bit(c4);
  return r;
};

const encodePlantUml = (text: string) => {
  const data = new TextEncoder().encode(text);
  const compressed = deflateRaw(data, { level: 9 });
  let str = '';
  for (let i = 0; i < compressed.length; i += 3) {
    const b1 = compressed[i];
    const b2 = i + 1 < compressed.length ? compressed[i + 1] : 0;
    const b3 = i + 2 < compressed.length ? compressed[i + 2] : 0;
    str += append3bytes(b1, b2, b3);
  }
  return str;
};

const getServerUrl = () => env.plantumlServerUrl || PLANTUML_DEFAULT_SERVER;

const requestPlantUml = async (code: string, format: 'svg' | 'png' = 'svg') => {
  const server = getServerUrl();
  if (!server) {
    throw new Error('No PlantUML server configured. Set PLANTUML_SERVER_URL.');
  }
  const encoded = encodePlantUml(code);
  const response = await fetch(`${server}/${format}/${encoded}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PlantUML render failed: ${response.status} ${response.statusText}\n${body}`);
  }
  return await response.text();
};

const plantumlEngine: DiagramEngine = {
  codeEditorLanguage: 'plaintext',
  defaultCode: plantumlSamples.Sequence,
  description: 'Server-side rendering via a PlantUML server instance.',
  getAssetUrls: ({ code }) => {
    const server = getServerUrl();
    const encoded = encodePlantUml(code);
    const assetUrls: DiagramAssetUrls = {
      svg: `${server}/svg/${encoded}`,
      png: `${server}/png/${encoded}`
    };
    return assetUrls;
  },
  getDocumentationUrl: () => 'https://plantuml.com/',
  hasConfig: false,
  id: 'plantuml',
  label: 'PlantUML',
  mobileLanguage: 'markdown',
  parse: async () => ({ diagramType: 'plantuml' }),
  render: async ({ code }) => {
    const svg = await requestPlantUml(code, 'svg');
    return {
      svg,
      diagramType: 'plantuml'
    };
  },
  sampleDiagrams: plantumlSamples
};

export default plantumlEngine;
