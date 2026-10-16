namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// MSZIP decompressor for compressed DirectX <c>.x</c> files (<c>tzip</c>/<c>bzip</c>).
/// Every block is a raw deflate stream whose back-references may reach into the
/// output of earlier blocks (MSZIP keeps the 32 KB LZ77 window across blocks).
/// <see cref="System.IO.Compression.DeflateStream"/> cannot be seeded with that
/// history, so this decodes all blocks into one continuous buffer with a
/// built-in RFC 1951 inflater.
/// </summary>
internal static class MsZip
{
    public static byte[] Decompress(byte[] data, int headerLen)
    {
        // Layout: [16-byte .x header][uint32 total size incl. header][blocks]
        // Block:  [uint16 uncompressed size][uint16 compressed size]["CK"][raw deflate]
        int pos = headerLen;
        if (pos + 4 > data.Length) return Array.Empty<byte>();
        uint total = BitConverter.ToUInt32(data, pos);
        pos += 4;

        // The declared size only presizes the buffer; it grows if the header is wrong.
        bool plausible = total > headerLen && total < 256u << 20;
        var output = new Output(plausible ? (int)(total - headerLen) : data.Length * 4);
        int block = 0;
        while (pos + 4 <= data.Length)
        {
            int compSize = data[pos + 2] | (data[pos + 3] << 8);
            pos += 4;
            if (compSize < 2 || pos + compSize > data.Length) break;
            if (data[pos] != 0x43 || data[pos + 1] != 0x4B) // "CK"
                throw new InvalidDataException($"Invalid MSZIP block: missing CK signature at offset {pos}.");

            try
            {
                new Inflater(data, pos + 2, pos + compSize, output).Run();
            }
            catch (InvalidDataException ex)
            {
                throw new InvalidDataException(
                    $"The file is damaged: compressed block {block + 1} (byte {pos - 4}) cannot be decoded. {ex.Message}", ex);
            }
            pos += compSize;
            block++;
        }
        return output.ToArray();
    }

    private sealed class Output
    {
        private byte[] _buf;
        public int Length { get; private set; }

        public Output(int capacity) => _buf = new byte[Math.Max(capacity, 1024)];

        public void Add(byte b)
        {
            if (Length == _buf.Length) Array.Resize(ref _buf, _buf.Length * 2);
            _buf[Length++] = b;
        }

        public void Copy(int distance, int length)
        {
            if (distance <= 0 || distance > Length)
                throw new InvalidDataException("MSZIP back-reference points before the start of the data.");
            int from = Length - distance;
            for (int k = 0; k < length; k++) Add(_buf[from + k]);
        }

        public byte[] ToArray() => _buf.AsSpan(0, Length).ToArray();
    }

    /// <summary>Canonical Huffman decoder for one raw deflate stream (after zlib's puff.c).</summary>
    private sealed class Inflater
    {
        private static readonly short[] LengthBase =
            { 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258 };
        private static readonly short[] LengthExtra =
            { 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0 };
        private static readonly short[] DistBase =
            { 1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
              1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 };
        private static readonly short[] DistExtra =
            { 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 };
        private static readonly byte[] CodeLengthOrder =
            { 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 };

        private readonly byte[] _in;
        private int _pos;
        private readonly int _end;
        private readonly Output _out;
        private int _bitBuf;
        private int _bitCount;

        public Inflater(byte[] input, int start, int end, Output output)
        {
            _in = input;
            _pos = start;
            _end = end;
            _out = output;
        }

        public void Run()
        {
            bool last;
            do
            {
                last = Bits(1) == 1;
                switch (Bits(2))
                {
                    case 0: Stored(); break;
                    case 1: Codes(FixedLength, FixedDistance); break;
                    case 2: Dynamic(); break;
                    default: throw new InvalidDataException("Invalid deflate block type in MSZIP data.");
                }
            } while (!last);
        }

        private int Bits(int need)
        {
            long val = _bitBuf;
            while (_bitCount < need)
            {
                if (_pos >= _end) throw new InvalidDataException("MSZIP block ended unexpectedly.");
                val |= (long)_in[_pos++] << _bitCount;
                _bitCount += 8;
            }
            _bitBuf = (int)(val >> need);
            _bitCount -= need;
            return (int)(val & ((1L << need) - 1));
        }

        private void Stored()
        {
            _bitBuf = 0;
            _bitCount = 0;
            if (_pos + 4 > _end) throw new InvalidDataException("MSZIP stored block ended unexpectedly.");
            int len = _in[_pos] | (_in[_pos + 1] << 8);
            int nlen = _in[_pos + 2] | (_in[_pos + 3] << 8);
            _pos += 4;
            if (len != (~nlen & 0xFFFF)) throw new InvalidDataException("MSZIP stored block length mismatch.");
            if (_pos + len > _end) throw new InvalidDataException("MSZIP stored block ended unexpectedly.");
            for (int k = 0; k < len; k++) _out.Add(_in[_pos++]);
        }

        private void Codes(Huffman lengths, Huffman distances)
        {
            while (true)
            {
                int symbol = Decode(lengths);
                if (symbol < 256) { _out.Add((byte)symbol); continue; }
                if (symbol == 256) return;

                symbol -= 257;
                if (symbol >= 29) throw new InvalidDataException("Invalid deflate length code in MSZIP data.");
                int len = LengthBase[symbol] + Bits(LengthExtra[symbol]);

                int dsym = Decode(distances);
                if (dsym >= 30) throw new InvalidDataException("Invalid deflate distance code in MSZIP data.");
                int dist = DistBase[dsym] + Bits(DistExtra[dsym]);
                _out.Copy(dist, len);
            }
        }

        private void Dynamic()
        {
            int nlen = Bits(5) + 257;
            int ndist = Bits(5) + 1;
            int ncode = Bits(4) + 4;
            if (nlen > 286 || ndist > 30) throw new InvalidDataException("Invalid deflate code counts in MSZIP data.");

            var lengths = new short[320];
            for (int k = 0; k < ncode; k++) lengths[CodeLengthOrder[k]] = (short)Bits(3);
            var codeLengths = new Huffman(lengths, 0, 19);

            int index = 0;
            while (index < nlen + ndist)
            {
                int symbol = Decode(codeLengths);
                if (symbol < 16) { lengths[index++] = (short)symbol; continue; }

                short repeat = 0;
                int count;
                if (symbol == 16)
                {
                    if (index == 0) throw new InvalidDataException("Invalid deflate repeat in MSZIP data.");
                    repeat = lengths[index - 1];
                    count = 3 + Bits(2);
                }
                else count = symbol == 17 ? 3 + Bits(3) : 11 + Bits(7);

                if (index + count > nlen + ndist) throw new InvalidDataException("Too many deflate lengths in MSZIP data.");
                while (count-- > 0) lengths[index++] = repeat;
            }
            if (lengths[256] == 0) throw new InvalidDataException("Deflate block has no end code in MSZIP data.");

            Codes(new Huffman(lengths, 0, nlen), new Huffman(lengths, nlen, ndist));
        }

        private int Decode(Huffman h)
        {
            int code = 0, first = 0, index = 0;
            for (int len = 1; len <= 15; len++)
            {
                code |= Bits(1);
                int count = h.Count[len];
                if (code - count < first) return h.Symbol[index + (code - first)];
                index += count;
                first += count;
                first <<= 1;
                code <<= 1;
            }
            throw new InvalidDataException("Invalid Huffman code in MSZIP data.");
        }

        private static readonly Huffman FixedLength = BuildFixedLength();
        private static readonly Huffman FixedDistance = new(Enumerable.Repeat((short)5, 30).ToArray(), 0, 30);

        private static Huffman BuildFixedLength()
        {
            var l = new short[288];
            for (int k = 0; k < 144; k++) l[k] = 8;
            for (int k = 144; k < 256; k++) l[k] = 9;
            for (int k = 256; k < 280; k++) l[k] = 7;
            for (int k = 280; k < 288; k++) l[k] = 8;
            return new Huffman(l, 0, 288);
        }
    }

    private sealed class Huffman
    {
        public readonly short[] Count = new short[16];
        public readonly short[] Symbol;

        public Huffman(short[] lengths, int offset, int n)
        {
            Symbol = new short[n];
            for (int s = 0; s < n; s++) Count[lengths[offset + s]]++;
            Count[0] = 0;

            var offs = new short[16];
            for (int len = 1; len < 15; len++) offs[len + 1] = (short)(offs[len] + Count[len]);
            for (int s = 0; s < n; s++)
                if (lengths[offset + s] != 0) Symbol[offs[lengths[offset + s]]++] = (short)s;
        }
    }
}
