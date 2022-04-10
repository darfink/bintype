import { ArrayBufferReader } from './streams/arrayBuffer';
import { NodeBufferReader } from './streams/nodeBuffer';
import { BinaryReader } from './streams';

interface CodecDefinition<Out> {
  decode(source: BinaryReader, context?: unknown): Out;
}

abstract class Codec<Out> {
  public decode(source: ArrayBuffer | ArrayBufferView | Buffer): Out {
    const reader = Buffer.isBuffer(source) ? new NodeBufferReader(source) : new ArrayBufferReader(source);
    return this.internalDecode(reader);
  }

  protected abstract internalDecode(source: BinaryReader, context?: unknown): Out;
}

function codec<Out>(codec: CodecDefinition<Out>): Codec<Out> {
  return new class extends Codec<Out> {
    protected internalDecode(source: BinaryReader, context?: unknown): Out {
      return codec.decode(source, context);
    }
  }
}

export const uint8 = codec({
  decode(source: BinaryReader): number {
    return source.readUint8();
  },
});

export const int8 = codec({
  decode(source: BinaryReader): number {
    return source.readInt8();
  },
});

export function array<T>(size: number, type: Codec<T>): Codec<T[]> {
  return codec({
    decode(source: BinaryReader): T[] {
      return Array(size).fill(null).map(() => type.decode(source));
    }
  })
}

export function schema(definition: Record<string, Codec<unknown>>): Codec<unknown> {
  return codec({
    decode(source: BinaryReader): unknown {
      return Object.keys(definition).reduce(
        (acc, key) => ({ ...acc, [key]: definition[key].decode(source) }),
        {},
      );
    }
  });
}
