import { inflateSync } from 'node:zlib';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function crc32(buffers) {
  let crc = 0xffffffff;
  for (const buffer of buffers) {
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function extractImageReferences(markdown) {
  const references = [];
  const markdownImage = /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g;
  const htmlImage = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const match of markdown.matchAll(markdownImage)) references.push(match[1] ?? match[2]);
  for (const match of markdown.matchAll(htmlImage)) references.push(match[1]);
  return references;
}

export function inspectPng(data) {
  if (data.length < 33 || !data.subarray(0, 8).equals(pngSignature)) {
    throw new Error('invalid PNG signature or truncated header');
  }

  let offset = 8;
  let ihdr = null;
  let seenIdat = false;
  let seenIend = false;
  const idatParts = [];

  while (offset < data.length) {
    if (offset + 12 > data.length) throw new Error('truncated PNG chunk header');
    const length = data.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > data.length) throw new Error('truncated PNG chunk data');

    const typeBytes = data.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString('ascii');
    const chunkData = data.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = data.readUInt32BE(offset + 8 + length);
    if (crc32([typeBytes, chunkData]) !== expectedCrc) {
      throw new Error(`invalid CRC for PNG ${type} chunk`);
    }

    if (offset === 8 && type !== 'IHDR') throw new Error('PNG IHDR must be the first chunk');
    if (type === 'IHDR') {
      if (ihdr || length !== 13) throw new Error('invalid or duplicate PNG IHDR chunk');
      ihdr = {
        width: chunkData.readUInt32BE(0),
        height: chunkData.readUInt32BE(4),
        bitDepth: chunkData[8],
        colorType: chunkData[9],
        compression: chunkData[10],
        filter: chunkData[11],
        interlace: chunkData[12],
      };
    } else if (type === 'IDAT') {
      if (!ihdr || seenIend) throw new Error('PNG IDAT chunk is out of order');
      seenIdat = true;
      idatParts.push(chunkData);
    } else if (type === 'IEND') {
      if (length !== 0 || seenIend) throw new Error('invalid or duplicate PNG IEND chunk');
      seenIend = true;
      if (chunkEnd !== data.length) throw new Error('PNG contains data after IEND');
    }
    offset = chunkEnd;
  }

  if (!ihdr || ihdr.width === 0 || ihdr.height === 0) throw new Error('PNG has invalid dimensions');
  if (!seenIdat || !seenIend) throw new Error('PNG is missing IDAT or IEND');
  if (ihdr.compression !== 0 || ihdr.filter !== 0 || ![0, 1].includes(ihdr.interlace)) {
    throw new Error('PNG uses unsupported compression, filter, or interlace settings');
  }

  let pixels;
  try {
    pixels = inflateSync(Buffer.concat(idatParts));
  } catch (error) {
    throw new Error(`PNG IDAT data cannot be decoded: ${error.message}`);
  }

  if (ihdr.interlace === 0) {
    const channels = new Map([[0, 1], [2, 3], [3, 1], [4, 2], [6, 4]]).get(ihdr.colorType);
    if (!channels) throw new Error(`PNG uses unsupported color type ${ihdr.colorType}`);
    const rowBytes = Math.ceil((ihdr.width * channels * ihdr.bitDepth) / 8);
    const expectedLength = (rowBytes + 1) * ihdr.height;
    if (pixels.length !== expectedLength) throw new Error('PNG decoded pixel length is invalid');
    for (let row = 0; row < ihdr.height; row += 1) {
      if (pixels[row * (rowBytes + 1)] > 4) throw new Error('PNG contains an invalid row filter');
    }
  } else if (pixels.length === 0) {
    throw new Error('PNG decoded pixel data is empty');
  }

  return { width: ihdr.width, height: ihdr.height };
}
